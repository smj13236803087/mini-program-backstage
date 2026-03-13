import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = v ? Number.parseInt(v, 10) : def
  if (Number.isNaN(n)) return def
  return Math.max(min, Math.min(max, n))
}

export async function GET(req: NextRequest) {
  const denied = assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
  const page = clampInt(sp.get('page'), 1, 1, 100000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 100)

  const where: any = {}
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { weixin_openid: { contains: q } },
      { email: { contains: q } },
      { nickname: { contains: q } },
      { phone: { contains: q } },
    ]
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        role: true,
        weixin_openid: true,
        email: true,
        nickname: true,
        phone: true,
        createdAt: true,
        _count: { select: { braceletDesigns: true, orders: true, addresses: true } },
      },
    }),
  ])

  return NextResponse.json({ page, pageSize, total, users }, { status: 200 })
}

