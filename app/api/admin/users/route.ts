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
  const denied = assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
  const field = sp.get('field')?.trim() || ''
  const sort = sp.get('sort')?.trim() || '' // e.g. createdAt:desc
  const page = clampInt(sp.get('page'), 1, 1, 100000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 100)

  const where: any = {}
  if (q) {
    const dayRange = parseDayRange(q)
    if (!field || field === 'all') {
      where.OR = [
        { id: { contains: q } },
        { weixin_openid: { contains: q } },
        { email: { contains: q } },
        { nickname: { contains: q } },
        { phone: { contains: q } },
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
          { page, pageSize, total: 0, users: [] },
          { status: 200 }
        )
      }
      where[field] = { gte: dayRange.gte, lt: dayRange.lt }
    } else if (
      field === 'id' ||
      field === 'weixin_openid' ||
      field === 'email' ||
      field === 'nickname' ||
      field === 'phone'
    ) {
      where[field] = { contains: q }
    } else {
      where.OR = [
        { id: { contains: q } },
        { weixin_openid: { contains: q } },
        { email: { contains: q } },
        { nickname: { contains: q } },
        { phone: { contains: q } },
      ]
    }
  }

  const orderBy = (() => {
    const [k, o] = sort.split(':')
    const order = o === 'asc' ? 'asc' : o === 'desc' ? 'desc' : null
    if (!order) return { createdAt: 'desc' as const }
    if (k === 'createdAt' || k === 'updatedAt') return { [k]: order } as any
    if (k === 'id' || k === 'nickname' || k === 'phone') return { [k]: order } as any
    return { createdAt: 'desc' as const }
  })()

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
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
        updatedAt: true,
        _count: { select: { braceletDesigns: true, orders: true, addresses: true } },
      },
    }),
  ])

  return NextResponse.json({ page, pageSize, total, users }, { status: 200 })
}

