import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'
import { buildDefaultPlazaSnapshot, enrichPlazaSnapshotSnapshot } from '@/lib/plaza-snapshot'

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
  const sort = sp.get('sort')?.trim() || '' // e.g. createdAt:desc
  const page = clampInt(sp.get('page'), 1, 1, 100000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 100)

  const where: any = {}
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { braceletDesignId: { contains: q } },
      { userId: { contains: q } },
    ]
  }

  const orderBy = (() => {
    const [k, o] = sort.split(':')
    const order = o === 'asc' ? 'asc' : o === 'desc' ? 'desc' : null
    if (!order) return { updatedAt: 'desc' as const }
    if (k === 'createdAt' || k === 'updatedAt') return { [k]: order } as any
    return { updatedAt: 'desc' as const }
  })()

  const [total, rows] = await Promise.all([
    prisma.plazaPost.count({ where }),
    prisma.plazaPost.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        braceletDesignId: true,
        userId: true,
        adoptCount: true,
        createdAt: true,
        updatedAt: true,
        snapshot: true,
        user: {
          select: {
            id: true,
            nickname: true,
            phone: true,
            email: true,
          },
        },
      },
    }),
  ])

  const posts = rows.map((r) => {
    const snap = r.snapshot as Record<string, unknown> | null
    const title =
      snap && typeof snap.title === 'string' ? snap.title : '—'
    return {
      id: r.id,
      braceletDesignId: r.braceletDesignId,
      userId: r.userId,
      adoptCount: r.adoptCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      snapshotTitle: title,
      user: r.user,
    }
  })

  return NextResponse.json({ page, pageSize, total, posts }, { status: 200 })
}

/**
 * 添加/覆盖广场条目：
 * - 仅 braceletDesignId：从作品同步快照（作品须存在），userId 取作品所有者
 * - 另传 snapshot：手动快照，须同时传 userId（须存在）
 */
export async function POST(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as null | {
    braceletDesignId?: unknown
    userId?: unknown
    snapshot?: unknown
    adoptCount?: unknown
  }

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const braceletDesignId =
    typeof body.braceletDesignId === 'string' ? body.braceletDesignId.trim() : ''
  if (!braceletDesignId) {
    return NextResponse.json({ error: 'braceletDesignId 不能为空' }, { status: 400 })
  }

  let userId: string
  let snapshot: Record<string, unknown>

  if (body.snapshot !== undefined && body.snapshot !== null) {
    if (typeof body.snapshot !== 'object' || Array.isArray(body.snapshot)) {
      return NextResponse.json({ error: 'snapshot 须为 JSON 对象' }, { status: 400 })
    }
    const uid = typeof body.userId === 'string' ? body.userId.trim() : ''
    if (!uid) {
      return NextResponse.json({ error: '手动填写 snapshot 时必须指定 userId' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 400 })
    }
    userId = uid
    snapshot = await enrichPlazaSnapshotSnapshot(body.snapshot as Record<string, unknown>)
  } else {
    const design = await prisma.braceletDesign.findUnique({
      where: { id: braceletDesignId },
    })
    if (!design) {
      return NextResponse.json({ error: '作品不存在' }, { status: 404 })
    }
    userId = design.userId
    snapshot = (await buildDefaultPlazaSnapshot(design)) as unknown as Record<string, unknown>
  }

  let adoptCount = 0
  if (body.adoptCount !== undefined) {
    const n =
      typeof body.adoptCount === 'string' ? Number.parseInt(body.adoptCount, 10) : body.adoptCount
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: 'adoptCount 须为非负整数' }, { status: 400 })
    }
    adoptCount = n
  }

  const post = await prisma.plazaPost.upsert({
    where: { braceletDesignId },
    create: {
      braceletDesignId,
      userId,
      snapshot: snapshot as any,
      adoptCount,
    },
    update: {
      userId,
      snapshot: snapshot as any,
      ...(body.adoptCount !== undefined ? { adoptCount } : {}),
    },
    select: {
      id: true,
      braceletDesignId: true,
      userId: true,
      adoptCount: true,
      createdAt: true,
      updatedAt: true,
      snapshot: true,
    },
  })

  return NextResponse.json({ post }, { status: 200 })
}
