import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
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
  const q = sp.get('q')?.trim() || ''
  const field = sp.get('field')?.trim() || 'all'
  const page = clampInt(sp.get('page'), 1, 1, 100000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 100)

  const where = (() => {
    if (!q) return {}
    if (field === 'title') return { title: { contains: q } }
    if (field === 'majorCategory') return { majorCategory: { contains: q } }
    if (field === 'coreEnergyTag') return { coreEnergyTag: { contains: q } }
    if (field === 'energyAnalysis') return { energyAnalysis: { contains: q } }
    return {
      OR: [
        { title: { contains: q } },
        { majorCategory: { contains: q } },
        { coreEnergyTag: { contains: q } },
        { energyAnalysis: { contains: q } },
        { mineVeinTrace: { contains: q } },
        { materialTrace: { contains: q } },
        { visualFeatures: { contains: q } },
      ],
    }
  })()

  const [total, rows] = await Promise.all([
    prisma.productAtlas.count({ where }),
    prisma.productAtlas.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
  ])

  return NextResponse.json({ page, pageSize, total, atlases: rows }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

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
        love?: number | string | null
        wealth?: number | string | null
        career?: number | string | null
        focus?: number | string | null
        emotion?: number | string | null
        protection?: number | string | null
      }
    | null

  if (!body) return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })

  const title = (body.title || '').trim()
  if (!title) return NextResponse.json({ error: '商品名不能为空' }, { status: 400 })

  const parseRealImages = (
    v: unknown
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
    if (v === undefined) return undefined
    if (v === null) return Prisma.JsonNull
    if (Array.isArray(v)) {
      const out = v.map((x) => String(x ?? '').trim()).filter(Boolean)
      return out.length ? out : Prisma.JsonNull
    }
    const s = String(v).trim()
    return s ? s : Prisma.JsonNull
  }

  const parse01 = (v: unknown): string | null => {
    if (v === null || v === undefined) return null
    const s0 = String(v).trim()
    if (!s0) return null
    const n = Number(s0)
    if (Number.isNaN(n)) return null
    const clamped = Math.max(0, Math.min(1, n))
    return clamped.toFixed(4)
  }

  // 新增图鉴时要求必须输入六维（0-1）
  const requiredKeys = ['love', 'wealth', 'career', 'focus', 'emotion', 'protection'] as const
  for (const k of requiredKeys) {
    const v = parse01((body as any)[k])
    if (v === null) return NextResponse.json({ error: `六维字段「${k}」不能为空且需为 0-1` }, { status: 400 })
  }

  try {
    const atlas = await prisma.$transaction(async (tx) => {
      const created = await tx.productAtlas.create({
        data: {
          title,
          imageUrl: body.imageUrl?.trim() || null,
          realImages: parseRealImages(body.realImages),
          majorCategory: body.majorCategory?.trim() || null,
          coreEnergyTag: body.coreEnergyTag?.trim() || null,
          energyAnalysis: body.energyAnalysis?.trim() || null,
          mineVeinTrace: body.mineVeinTrace?.trim() || null,
          materialTrace: body.materialTrace?.trim() || null,
          visualFeatures: body.visualFeatures?.trim() || null,
          classicSixDimensions: body.classicSixDimensions?.trim() || null,
          zodiac: body.zodiac?.trim() || null,
          fiveElements: body.fiveElements?.trim() || null,
          constellation: body.constellation?.trim() || null,
          chakra: body.chakra?.trim() || null,
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

      await tx.atlasSixDimension.create({
        data: {
          atlasId: created.id,
          love: parse01(body.love),
          wealth: parse01(body.wealth),
          career: parse01(body.career),
          focus: parse01(body.focus),
          emotion: parse01(body.emotion),
          protection: parse01(body.protection),
        },
        select: { atlasId: true },
      })

      return created
    })
    return NextResponse.json({ atlas }, { status: 200 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json(
        { error: '已存在相同「商品名 + 大分类」的图鉴，请修改后重试' },
        { status: 409 }
      )
    }
    throw e
  }
}

