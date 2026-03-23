import prisma from '@/lib/prisma'

/**
 * 按 productId 把 Product.imageUrl 注入到珠子项（与 /api/designs 列表富化逻辑一致）
 */
export async function enrichBraceletItemsImageUrl(items: unknown): Promise<any[]> {
  const arr = Array.isArray(items) ? (items as any[]) : []
  const productIds = new Set<string>()
  for (const it of arr) {
    const pid = it?.productId
    if (pid) productIds.add(String(pid))
  }
  if (productIds.size === 0) return arr

  const products = await prisma.product.findMany({
    where: { id: { in: Array.from(productIds) } },
    select: { id: true, imageUrl: true },
  })
  const imageMap = new Map(products.map((p) => [p.id, p.imageUrl] as const))

  return arr.map((it) => {
    const pid = it?.productId ? String(it.productId) : ''
    if (!pid) return it
    if (it?.imageUrl) return it
    const resolved = imageMap.get(pid)
    if (!resolved) return it
    return { ...it, imageUrl: resolved }
  })
}
