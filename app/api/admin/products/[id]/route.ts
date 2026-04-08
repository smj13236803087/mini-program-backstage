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
        materialCode?: string | null
        price?: number | string
        stock?: number | string
        imageUrl?: string | null
        majorCategory?: string | null
        productGender?: string | null
        colorSeries?: string | null
        coreEnergyTag?: string | null
        mineVeinTrace?: string | null
        materialTrace?: string | null
        visualFeatures?: string | null
        classicSixDimensions?: string | null
        zodiac?: string | null
        fiveElements?: string | null
        constellation?: string | null
        chakra?: string | null
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
  if (body.materialCode !== undefined) {
    data.materialCode =
      body.materialCode === null ? null : String(body.materialCode).trim() || null
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
  if (body.majorCategory !== undefined) data.majorCategory = body.majorCategory?.trim() || null
  if (body.productGender !== undefined) data.productGender = body.productGender?.trim() || null
  if (body.colorSeries !== undefined) data.colorSeries = body.colorSeries?.trim() || null
  if (body.coreEnergyTag !== undefined) data.coreEnergyTag = body.coreEnergyTag?.trim() || null
  if (body.mineVeinTrace !== undefined) data.mineVeinTrace = body.mineVeinTrace?.trim() || null
  if (body.materialTrace !== undefined) data.materialTrace = body.materialTrace?.trim() || null
  if (body.visualFeatures !== undefined) data.visualFeatures = body.visualFeatures?.trim() || null
  if (body.classicSixDimensions !== undefined)
    data.classicSixDimensions = body.classicSixDimensions?.trim() || null
  if (body.zodiac !== undefined) data.zodiac = body.zodiac?.trim() || null
  if (body.fiveElements !== undefined) data.fiveElements = body.fiveElements?.trim() || null
  if (body.constellation !== undefined) data.constellation = body.constellation?.trim() || null
  if (body.chakra !== undefined) data.chakra = body.chakra?.trim() || null
  if (body.diameter !== undefined) data.diameter = body.diameter
  if (body.weight !== undefined) data.weight = body.weight

  const updated = await prisma.product.update({
    where: { id },
    data,
    select: {
      id: true,
      materialCode: true,
      title: true,
      price: true,
      diameter: true,
      weight: true,
      stock: true,
      imageUrl: true,
      majorCategory: true,
      productGender: true,
      colorSeries: true,
      coreEnergyTag: true,
      mineVeinTrace: true,
      materialTrace: true,
      visualFeatures: true,
      classicSixDimensions: true,
      zodiac: true,
      fiveElements: true,
      constellation: true,
      chakra: true,
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
