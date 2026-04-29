import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const body = (await req.json().catch(() => null)) as
    | {
        title?: string
        imageUrl?: string | null
        realImages?: unknown
        majorCategory?: string | null
        coreEnergyTag?: string | null
        energyAnalysis?: string | null
        mineVeinTrace?: string | null
        materialTrace?: string | null
        visualFeatures?: string | null
        classicSixDimensions?: string | null
        zodiac?: string | null
        fiveElements?: string | null
        constellation?: string | null
        chakra?: string | null
      }
    | null

  if (!body) return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })

  const exists = await prisma.productAtlas.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: '图鉴不存在' }, { status: 404 })

  const title = body.title === undefined ? undefined : body.title.trim()
  if (title !== undefined && !title) {
    return NextResponse.json({ error: '商品名不能为空' }, { status: 400 })
  }

  const parseRealImages = (v: unknown): string | string[] | null => {
    if (v === null || v === undefined) return null
    if (Array.isArray(v)) {
      const out = v.map((x) => String(x ?? '').trim()).filter(Boolean)
      return out.length ? out : null
    }
    const s = String(v).trim()
    return s ? s : null
  }

  const updated = await (prisma as any).productAtlas.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl?.trim() || null } : {}),
      ...(body.realImages !== undefined ? { realImages: parseRealImages(body.realImages) } : {}),
      ...(body.majorCategory !== undefined ? { majorCategory: body.majorCategory?.trim() || null } : {}),
      ...(body.coreEnergyTag !== undefined ? { coreEnergyTag: body.coreEnergyTag?.trim() || null } : {}),
      ...(body.energyAnalysis !== undefined ? { energyAnalysis: body.energyAnalysis?.trim() || null } : {}),
      ...(body.mineVeinTrace !== undefined ? { mineVeinTrace: body.mineVeinTrace?.trim() || null } : {}),
      ...(body.materialTrace !== undefined ? { materialTrace: body.materialTrace?.trim() || null } : {}),
      ...(body.visualFeatures !== undefined ? { visualFeatures: body.visualFeatures?.trim() || null } : {}),
      ...(body.classicSixDimensions !== undefined
        ? { classicSixDimensions: body.classicSixDimensions?.trim() || null }
        : {}),
      ...(body.zodiac !== undefined ? { zodiac: body.zodiac?.trim() || null } : {}),
      ...(body.fiveElements !== undefined ? { fiveElements: body.fiveElements?.trim() || null } : {}),
      ...(body.constellation !== undefined ? { constellation: body.constellation?.trim() || null } : {}),
      ...(body.chakra !== undefined ? { chakra: body.chakra?.trim() || null } : {}),
    },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      realImages: true,
      majorCategory: true,
      coreEnergyTag: true,
      energyAnalysis: true,
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

  return NextResponse.json({ atlas: updated }, { status: 200 })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const exists = await prisma.productAtlas.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: '图鉴不存在' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: { atlasId: id },
      data: { atlasId: null },
    })
    await tx.productAtlas.delete({ where: { id } })
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}

