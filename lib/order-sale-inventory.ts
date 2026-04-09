import type { Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient

function asRecord(x: unknown): Record<string, unknown> | null {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : null
}

/** 与小程序工作台 / 配方快照一致：解析单颗珠子的后端商品 id */
function beadProductId(item: unknown): string | null {
  const o = asRecord(item)
  if (!o) return null
  const direct = o.productId ?? o.product_id
  if (typeof direct === 'string' && direct.trim()) return direct.trim()
  if (typeof direct === 'number' && Number.isFinite(direct)) return String(direct)

  const mat = asRecord(o.material)
  if (mat) {
    const mp = mat.productId ?? mat.product_id
    if (typeof mp === 'string' && mp.trim()) return mp.trim()
    if (typeof mp === 'number' && Number.isFinite(mp)) return String(mp)
  }

  const prod = asRecord(o.product)
  if (prod) {
    const pid = prod.id
    if (typeof pid === 'string' && pid.trim()) return pid.trim()
    if (typeof pid === 'number' && Number.isFinite(pid)) return String(pid)
  }

  return null
}

function collectItemsFromSnapshot(snapshot: unknown): unknown[] {
  const root = asRecord(snapshot)
  if (!root) return []

  const fromDesign = asRecord(root.design)
  if (fromDesign) {
    const a = fromDesign.items ?? fromDesign.beads
    if (Array.isArray(a) && a.length) return a
  }

  const top = root.items ?? root.beads
  if (Array.isArray(top) && top.length) return top

  return []
}

/**
 * 从订单明细 / 设计快照得到环上珠子列表（去重前的顺序数组，仅用于计数）
 */
export function extractBeadItemsFromOrder(order: {
  designSnapshot: unknown
  items: { snapshot: unknown }[]
}): unknown[] {
  for (const it of order.items) {
    const list = collectItemsFromSnapshot(it.snapshot)
    if (list.length) return list
  }
  return collectItemsFromSnapshot(order.designSnapshot)
}

function aggregateProductQuantities(items: unknown[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const it of items) {
    const pid = beadProductId(it)
    if (!pid) continue
    map.set(pid, (map.get(pid) ?? 0) + 1)
  }
  return map
}

export class OrderInventoryError extends Error {
  code: 'INSUFFICIENT_STOCK' | 'INVALID_PRODUCT'

  constructor(code: OrderInventoryError['code'], message: string) {
    super(message)
    this.code = code
    this.name = 'OrderInventoryError'
  }
}

/**
 * 支付成功后扣减珠子库存并写 SALE 流水；依赖订单 payStatus 已为 paid。
 * 通过 stockDeductedAt 幂等，可安全重复调用。
 */
export async function deductInventoryOnOrderPaid(tx: Tx, orderId: string): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      payStatus: true,
      stockDeductedAt: true,
      designSnapshot: true,
      items: { select: { snapshot: true } },
    },
  })

  if (!order) {
    throw new Error('deductInventoryOnOrderPaid: order not found')
  }
  if (order.stockDeductedAt) {
    return
  }
  if (order.payStatus !== 'paid') {
    throw new Error('deductInventoryOnOrderPaid: order is not paid')
  }

  const beadItems = extractBeadItemsFromOrder(order)
  /** 快照里的标识：工作台接口优先返回 materialCode，否则才是 Prisma id */
  const countsBySnapshotKey = aggregateProductQuantities(beadItems)

  if (countsBySnapshotKey.size === 0) {
    await tx.order.update({
      where: { id: orderId },
      data: { stockDeductedAt: new Date() },
    })
    return
  }

  const keys = [...countsBySnapshotKey.keys()]
  const products = await tx.product.findMany({
    where: {
      OR: [{ id: { in: keys } }, { materialCode: { in: keys } }],
    },
    select: { id: true, materialCode: true },
  })

  const counts = new Map<string, number>()
  for (const [key, need] of countsBySnapshotKey) {
    const p = products.find(
      (pr) =>
        pr.id === key ||
        (pr.materialCode != null && pr.materialCode.trim() === key)
    )
    if (!p) {
      throw new OrderInventoryError(
        'INVALID_PRODUCT',
        `订单中含无效商品 id：${key}`,
      )
    }
    counts.set(p.id, (counts.get(p.id) ?? 0) + need)
  }

  for (const [productId, need] of counts) {
    const inv = await tx.inventory.findUnique({
      where: { productId },
    })
    const beforeQty = inv?.quantity ?? 0
    if (beforeQty < need) {
      throw new OrderInventoryError(
        'INSUFFICIENT_STOCK',
        `商品库存不足（需要 ${need}，当前 ${beforeQty}）`,
      )
    }
    const afterQty = beforeQty - need

    await tx.inventory.update({
      where: { productId },
      data: { quantity: afterQty },
    })

    await tx.inventoryLog.create({
      data: {
        productId,
        type: 'SALE',
        quantity: -need,
        beforeQty,
        afterQty,
        remark: `订单${orderId}销售出库`,
      },
    })
  }

  await tx.order.update({
    where: { id: orderId },
    data: { stockDeductedAt: new Date() },
  })
}
