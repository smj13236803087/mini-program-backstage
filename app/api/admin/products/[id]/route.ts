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
        realImages?: unknown
        majorCategory?: string | null
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
        horizontalLength?: string | null
        weight?: string | null
      }
    | null

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const exists = await (prisma as any).product.findUnique({
    where: { id },
    select: {
      id: true,
      atlasId: true,
      materialCode: true,
      diameter: true,
      horizontalLength: true,
      atlas: { select: { title: true, majorCategory: true } },
    },
  })
  if (!exists) return NextResponse.json({ error: '商品不存在' }, { status: 404 })

  const data: any = {}
  const atlasData: any = {}

  if (body.title !== undefined) {
    const v = body.title.trim()
    if (!v) return NextResponse.json({ error: 'title 不能为空' }, { status: 400 })
    atlasData.title = v
  }
  if (body.materialCode !== undefined) {
    const v = body.materialCode === null ? '' : String(body.materialCode).trim()
    if (!v) return NextResponse.json({ error: '物料编号不能为空' }, { status: 400 })
    data.materialCode = v
  }
  if (body.price !== undefined) {
    const n = typeof body.price === 'string' ? Number(body.price) : body.price
    if (typeof n !== 'number' || Number.isNaN(n) || n < 0) {
      return NextResponse.json({ error: 'price 不合法' }, { status: 400 })
    }
    data.price = String(n.toFixed(2))
  }
  let stockNum: number | undefined
  if (body.stock !== undefined) {
    const n = typeof body.stock === 'string' ? Number(body.stock) : body.stock
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: 'stock 不合法' }, { status: 400 })
    }
    stockNum = n
  }

  if (body.majorCategory !== undefined) {
    const v = String(body.majorCategory ?? '').trim()
    if (!v) return NextResponse.json({ error: '大分类不能为空' }, { status: 400 })
    atlasData.majorCategory = v
  }
  if (body.imageUrl !== undefined) atlasData.imageUrl = body.imageUrl
  if (body.realImages !== undefined) {
    atlasData.realImages = (() => {
      const v = body.realImages
      if (v === null || v === undefined) return null
      if (Array.isArray(v)) {
        const out = v.map((x) => String(x ?? '').trim()).filter(Boolean)
        return out.length ? out : null
      }
      const s = String(v).trim()
      return s ? s : null
    })()
  }
  if (body.colorSeries !== undefined) atlasData.colorSeries = body.colorSeries?.trim() || null
  if (body.coreEnergyTag !== undefined) atlasData.coreEnergyTag = body.coreEnergyTag?.trim() || null
  if (body.mineVeinTrace !== undefined) atlasData.mineVeinTrace = body.mineVeinTrace?.trim() || null
  if (body.materialTrace !== undefined) atlasData.materialTrace = body.materialTrace?.trim() || null
  if (body.visualFeatures !== undefined) atlasData.visualFeatures = body.visualFeatures?.trim() || null
  if (body.classicSixDimensions !== undefined)
    atlasData.classicSixDimensions = body.classicSixDimensions?.trim() || null
  if (body.zodiac !== undefined) atlasData.zodiac = body.zodiac?.trim() || null
  if (body.fiveElements !== undefined) atlasData.fiveElements = body.fiveElements?.trim() || null
  if (body.constellation !== undefined) atlasData.constellation = body.constellation?.trim() || null
  if (body.chakra !== undefined) atlasData.chakra = body.chakra?.trim() || null
  if (body.diameter !== undefined) {
    data.diameter = String(body.diameter ?? '').trim() || null
  }
  if (body.horizontalLength !== undefined) {
    data.horizontalLength = String(body.horizontalLength ?? '').trim() || null
  }
  if (body.weight !== undefined) data.weight = body.weight

  const mergedMaterialCode =
    data.materialCode !== undefined ? data.materialCode : exists.materialCode
  const mergedDiameter = data.diameter !== undefined ? data.diameter : exists.diameter
  const mergedHorizontalLength =
    data.horizontalLength !== undefined ? data.horizontalLength : exists.horizontalLength

  if (!String(mergedMaterialCode ?? '').trim()) {
    return NextResponse.json({ error: '物料编号不能为空' }, { status: 400 })
  }
  if (!String(mergedDiameter ?? '').trim() && !String(mergedHorizontalLength ?? '').trim()) {
    return NextResponse.json({ error: '直径/横长 至少填写一个' }, { status: 400 })
  }

  const updated = await prisma.$transaction(async (tx) => {
    // 如果 title 或 majorCategory 变了：切换/创建 atlas
    const nextTitle = (atlasData.title ?? exists.atlas?.title ?? '').trim()
    const nextMajorCategory =
      atlasData.majorCategory !== undefined
        ? String(atlasData.majorCategory).trim() || null
        : exists.atlas?.majorCategory ?? null

    let nextAtlasId = exists.atlasId || null
    if (nextTitle) {
      const majorCategoryKey = nextMajorCategory ?? ''
      const atlas = await (tx as any).productAtlas.upsert({
        where: { title_majorCategory: { title: nextTitle, majorCategory: majorCategoryKey } },
        create: {
          title: nextTitle,
          majorCategory: majorCategoryKey,
          ...atlasData,
        },
        update: {
          ...atlasData,
        },
      })
      nextAtlasId = atlas.id
    }

    const sku = await (tx as any).product.update({
      where: { id },
      data: { ...data, atlasId: nextAtlasId },
      include: { inventory: { select: { quantity: true } }, atlas: true },
    })
    return sku
  })

  if (stockNum !== undefined) {
    await prisma.inventory.upsert({
      where: { productId: id },
      create: { productId: id, quantity: stockNum },
      update: { quantity: stockNum },
    })
    ;(updated as any).inventory = { quantity: stockNum }
  }

  return NextResponse.json(
    {
      product: {
        id: updated.id,
        materialCode: updated.materialCode,
        title: updated.atlas?.title ?? '',
        price: updated.price,
        diameter: updated.diameter,
        horizontalLength: (updated as any).horizontalLength ?? null,
        weight: updated.weight,
        imageUrl: updated.atlas?.imageUrl ?? null,
        realImages: (updated.atlas as any)?.realImages ?? null,
        majorCategory: updated.atlas?.majorCategory ?? null,
        colorSeries: updated.atlas?.colorSeries ?? null,
        coreEnergyTag: updated.atlas?.coreEnergyTag ?? null,
        mineVeinTrace: updated.atlas?.mineVeinTrace ?? null,
        materialTrace: updated.atlas?.materialTrace ?? null,
        visualFeatures: updated.atlas?.visualFeatures ?? null,
        classicSixDimensions: updated.atlas?.classicSixDimensions ?? null,
        zodiac: updated.atlas?.zodiac ?? null,
        fiveElements: updated.atlas?.fiveElements ?? null,
        constellation: updated.atlas?.constellation ?? null,
        chakra: updated.atlas?.chakra ?? null,
        updatedAt: updated.updatedAt,
        stock: (updated as any).inventory?.quantity ?? 0,
      },
    },
    { status: 200 }
  )
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params

  const exists = await prisma.product.findUnique({ where: { id }, select: { id: true, atlasId: true } })
  if (!exists) return NextResponse.json({ error: '商品不存在' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.product.delete({ where: { id } })
    const atlasId = exists.atlasId
    if (atlasId) {
      const left = await tx.product.count({ where: { atlasId } })
      if (left === 0) {
        await tx.productAtlas.delete({ where: { id: atlasId } }).catch(() => {})
      }
    }
  })
  return NextResponse.json({ ok: true }, { status: 200 })
}
