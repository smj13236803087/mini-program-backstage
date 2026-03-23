import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/security'
import { buildDefaultPlazaSnapshot } from '@/lib/plaza-snapshot'

function getTokenFromReq(req: NextRequest): string | null {
  const h = req.headers.get('x-equilune-token')
  if (h) return h
  const auth = req.headers.get('authorization')
  if (auth) return auth.replace('Bearer ', '')
  return cookies().get('session')?.value || null
}

function getUserIdFromReq(req: NextRequest): string | null {
  const token = getTokenFromReq(req)
  if (!token) return null
  try {
    const payload = verifySession(token)
    if (!payload) return null
    return payload.user_id || payload.sub || null
  } catch {
    return null
  }
}

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = v ? Number.parseInt(v, 10) : def
  if (Number.isNaN(n)) return def
  return Math.max(min, Math.min(max, n))
}

/** 广场列表：公开，无需登录 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const page = clampInt(sp.get('page'), 1, 1, 10000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 50)

  const [total, rows] = await Promise.all([
    prisma.plazaPost.count(),
    prisma.plazaPost.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        braceletDesignId: true,
        adoptCount: true,
        createdAt: true,
        updatedAt: true,
        snapshot: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    }),
  ])

  const posts = rows.map((r) => ({
    id: r.id,
    braceletDesignId: r.braceletDesignId,
    adoptCount: r.adoptCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    snapshot: r.snapshot,
    author: {
      id: r.user.id,
      nickname: r.user.nickname || '微信用户',
      avatar: r.user.avatar || '',
    },
  }))

  return NextResponse.json({ page, pageSize, total, posts }, { status: 200 })
}

/** 发布/更新广场条目：需登录，且作品属于当前用户 */
export async function POST(req: NextRequest) {
  const userId = getUserIdFromReq(req)
  if (!userId) {
    return NextResponse.json({ errno: 401, errmsg: '未登录', data: null }, { status: 200 })
  }

  const body = (await req.json().catch(() => null)) as null | { braceletDesignId?: unknown }
  const braceletDesignId =
    typeof body?.braceletDesignId === 'string' ? body.braceletDesignId.trim() : ''
  if (!braceletDesignId) {
    return NextResponse.json({ errno: 400, errmsg: '缺少 braceletDesignId', data: null }, { status: 200 })
  }

  const design = await prisma.braceletDesign.findFirst({
    where: { id: braceletDesignId, userId },
  })
  if (!design) {
    return NextResponse.json({ errno: 404, errmsg: '作品不存在或无权操作', data: null }, { status: 200 })
  }

  const snapshot = await buildDefaultPlazaSnapshot(design)

  const post = await prisma.plazaPost.upsert({
    where: { braceletDesignId },
    create: {
      braceletDesignId,
      userId,
      snapshot: snapshot as any,
    },
    update: {
      snapshot: snapshot as any,
    },
    select: {
      id: true,
      braceletDesignId: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ errno: 0, errmsg: '', data: { post } }, { status: 200 })
}
