import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = v ? Number.parseInt(v, 10) : def
  if (Number.isNaN(n)) return def
  return Math.max(min, Math.min(max, n))
}

export async function GET(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const page = clampInt(sp.get('page'), 1, 1, 100000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 100)
  const q = sp.get('q')?.trim() || ''
  const field = sp.get('field')?.trim() || ''

  const where: any = {}
  if (q) {
    if (!field || field === 'all') {
      where.OR = [
        { product: { title: { contains: q } } },
        { product: { materialCode: { contains: q } } },
      ]
    } else if (field === 'title') {
      where.product = { title: { contains: q } }
    } else if (field === 'materialCode') {
      where.product = { materialCode: { contains: q } }
    }
  }

  const [total, items] = await Promise.all([
    prisma.inventory.count({ where }),
    prisma.inventory.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            materialCode: true,
          },
        },
      },
    }),
  ])

  const inventories = items.map((it) => ({
    id: it.id,
    productId: it.product?.id ?? it.productId,
    productTitle: it.product?.title ?? '',
    materialCode: it.product?.materialCode ?? null,
    quantity: it.quantity,
    updatedAt: it.updatedAt.toISOString(),
  }))

  return NextResponse.json({ page, pageSize, total, inventories }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as
    | {
        productId?: string
        quantity?: number
        remark?: string | null
      }
    | null

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const productId = String(body.productId || '').trim()
  if (!productId) {
    return NextResponse.json({ error: 'productId 不能为空' }, { status: 400 })
  }

  const qty = Number(body.quantity)
  if (!Number.isInteger(qty) || qty < 0) {
    return NextResponse.json({ error: 'quantity 不合法' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, title: true, materialCode: true },
  })
  if (!product) {
    return NextResponse.json({ error: '商品不存在' }, { status: 400 })
  }

  const existing = await prisma.inventory.findUnique({
    where: { productId: productId },
  })
  const beforeQty = existing?.quantity ?? 0

  const inv = await prisma.inventory.upsert({
    where: { productId: productId },
    create: { productId: productId, quantity: qty },
    update: { quantity: qty },
  })

  await prisma.inventoryLog.create({
    data: {
      productId: productId,
      type: 'ADJUST',
      quantity: qty - beforeQty,
      beforeQty,
      afterQty: qty,
      remark: body.remark?.trim() || '后台新增/调整库存',
    },
  })

  return NextResponse.json(
    {
      inventory: {
        id: inv.id,
        productId: product.id,
        productTitle: product.title,
        materialCode: product.materialCode ?? null,
        quantity: inv.quantity,
        updatedAt: inv.updatedAt.toISOString(),
      },
    },
    { status: 200 }
  )
}


