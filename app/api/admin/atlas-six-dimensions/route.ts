import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = v ? Number.parseInt(v, 10) : def
  if (Number.isNaN(n)) return def
  return Math.max(min, Math.min(max, n))
}

function parse01(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s0 = String(v).trim()
  if (!s0) return null
  const n = Number(s0)
  if (Number.isNaN(n)) return null
  const clamped = Math.max(0, Math.min(1, n))
  return clamped.toFixed(4)
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
    if (field === 'title') return { atlas: { is: { title: { contains: q } } } }
    if (field === 'majorCategory') return { atlas: { is: { majorCategory: { contains: q } } } }
    return {
      OR: [
        { atlas: { is: { title: { contains: q } } } },
        { atlas: { is: { majorCategory: { contains: q } } } },
      ],
    }
  })()

  const [total, rows] = await Promise.all([
    prisma.atlasSixDimension.count({ where }),
    prisma.atlasSixDimension.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        atlasId: true,
        love: true,
        wealth: true,
        career: true,
        focus: true,
        emotion: true,
        protection: true,
        updatedAt: true,
        atlas: { select: { title: true, majorCategory: true } },
      },
    }),
  ])

  const items = rows.map((r) => ({
    atlasId: r.atlasId,
    title: r.atlas?.title ?? '',
    majorCategory: r.atlas?.majorCategory ?? null,
    love: r.love,
    wealth: r.wealth,
    career: r.career,
    focus: r.focus,
    emotion: r.emotion,
    protection: r.protection,
    updatedAt: r.updatedAt,
  }))

  return NextResponse.json({ page, pageSize, total, items }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as
    | {
        atlasId?: string
        love?: number | string | null
        wealth?: number | string | null
        career?: number | string | null
        focus?: number | string | null
        emotion?: number | string | null
        protection?: number | string | null
      }
    | null

  if (!body) return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })

  const atlasId = String(body.atlasId || '').trim()
  if (!atlasId) return NextResponse.json({ error: 'atlasId 不能为空' }, { status: 400 })

  const atlas = await prisma.productAtlas.findUnique({ where: { id: atlasId }, select: { id: true } })
  if (!atlas) return NextResponse.json({ error: '图鉴不存在' }, { status: 400 })

  const created = await prisma.atlasSixDimension.create({
    data: {
      atlasId,
      love: parse01(body.love),
      wealth: parse01(body.wealth),
      career: parse01(body.career),
      focus: parse01(body.focus),
      emotion: parse01(body.emotion),
      protection: parse01(body.protection),
    },
    select: {
      atlasId: true,
      love: true,
      wealth: true,
      career: true,
      focus: true,
      emotion: true,
      protection: true,
      updatedAt: true,
      atlas: { select: { title: true, majorCategory: true } },
    },
  })

  return NextResponse.json(
    {
      item: {
        atlasId: created.atlasId,
        title: created.atlas?.title ?? '',
        majorCategory: created.atlas?.majorCategory ?? null,
        love: created.love,
        wealth: created.wealth,
        career: created.career,
        focus: created.focus,
        emotion: created.emotion,
        protection: created.protection,
        updatedAt: created.updatedAt,
      },
    },
    { status: 200 }
  )
}

