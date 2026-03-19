import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = v ? Number.parseInt(v, 10) : def
  if (Number.isNaN(n)) return def
  return Math.max(min, Math.min(max, n))
}

function parseDayRange(input: string): { gte: Date; lt: Date } | null {
  const s = input.trim()
  if (!s) return null
  const d = new Date(s.length <= 10 ? `${s}T00:00:00` : s)
  if (Number.isNaN(d.getTime())) return null
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { gte: start, lt: end }
}

export async function GET(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const status = sp.get('status')?.trim() || ''
  const q = sp.get('q')?.trim() || ''
  const field = sp.get('field')?.trim() || ''
  const sort = sp.get('sort')?.trim() || '' // e.g. createdAt:desc
  const page = clampInt(sp.get('page'), 1, 1, 100000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 100)

  const where: any = {}
  if (status && status !== 'all') {
    where.status = status
  }
  if (q) {
    const dayRange = parseDayRange(q)
    if (!field || field === 'all') {
      where.OR = [
        { id: { contains: q } },
        { outTradeNo: { contains: q } },
        { recipient: { contains: q } },
        { phone: { contains: q } },
        { trackingNo: { contains: q } },
        ...(dayRange
          ? [
              { createdAt: { gte: dayRange.gte, lt: dayRange.lt } },
              { updatedAt: { gte: dayRange.gte, lt: dayRange.lt } },
            ]
          : []),
      ]
    } else if (field === 'createdAt' || field === 'updatedAt') {
      if (!dayRange) {
        return NextResponse.json(
          { page, pageSize, total: 0, orders: [] },
          { status: 200 }
        )
      }
      where[field] = { gte: dayRange.gte, lt: dayRange.lt }
    } else if (
      field === 'id' ||
      field === 'outTradeNo' ||
      field === 'recipient' ||
      field === 'phone' ||
      field === 'trackingNo'
    ) {
      where[field] = { contains: q }
    } else {
      where.OR = [
        { id: { contains: q } },
        { outTradeNo: { contains: q } },
        { recipient: { contains: q } },
        { phone: { contains: q } },
        { trackingNo: { contains: q } },
      ]
    }
  }

  const orderBy = (() => {
    const [k, o] = sort.split(':')
    const order = o === 'asc' ? 'asc' : o === 'desc' ? 'desc' : null
    if (!order) return { createdAt: 'desc' as const }
    if (k === 'createdAt' || k === 'updatedAt') return { [k]: order } as any
    if (k === 'id' || k === 'status' || k === 'payStatus') return { [k]: order } as any
    return { createdAt: 'desc' as const }
  })()

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy,
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

