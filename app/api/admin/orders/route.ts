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
  const status = sp.get('status')?.trim() || ''
  const q = sp.get('q')?.trim() || ''
  const page = clampInt(sp.get('page'), 1, 1, 100000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 100)

  const where: any = {}
  if (status && status !== 'all') {
    where.status = status
  }
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { outTradeNo: { contains: q } },
      { recipient: { contains: q } },
      { phone: { contains: q } },
      { trackingNo: { contains: q } },
    ]
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            phone: true,
            avatar: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            subtotal: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
  ])

  return NextResponse.json(
    {
      page,
      pageSize,
      total,
      orders,
    },
    { status: 200 }
  )
}

