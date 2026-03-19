import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const body = (await req.json().catch(() => null)) as
    | {
        title?: string
        productType?: string
        price?: number | string
        stock?: number | string
        imageUrl?: string | null
        images?: any
        energy_tags?: any
        diameter?: string | null
        weight?: string | null
      }
    | null

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: '商品不存在' }, { status: 404 })

  const data: any = {}

  if (body.title !== undefined) {
    const v = body.title.trim()
    if (!v) return NextResponse.json({ error: 'title 不能为空' }, { status: 400 })
    data.title = v
  }
  if (body.productType !== undefined) {
    const v = body.productType.trim()
    if (!v) return NextResponse.json({ error: 'productType 不能为空' }, { status: 400 })
    data.productType = v
  }
  if (body.price !== undefined) {
    const n = typeof body.price === 'string' ? Number(body.price) : body.price
    if (typeof n !== 'number' || Number.isNaN(n) || n < 0) {
      return NextResponse.json({ error: 'price 不合法' }, { status: 400 })
    }
    data.price = String(n.toFixed(2))
  }
  if (body.stock !== undefined) {
    const n = typeof body.stock === 'string' ? Number(body.stock) : body.stock
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: 'stock 不合法' }, { status: 400 })
    }
    data.stock = n
  }

  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl
  if (body.images !== undefined) data.images = body.images
  if (body.energy_tags !== undefined) data.energy_tags = body.energy_tags
  if (body.diameter !== undefined) data.diameter = body.diameter
  if (body.weight !== undefined) data.weight = body.weight

  const updated = await prisma.product.update({
    where: { id },
    data,
    select: {
      id: true,
      title: true,
      productType: true,
      price: true,
      diameter: true,
      weight: true,
      stock: true,
      imageUrl: true,
      images: true,
      energy_tags: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ product: updated }, { status: 200 })
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params

  const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: '商品不存在' }, { status: 404 })

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true }, { status: 200 })
}

