import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (Number.isNaN(n)) return null
  return n
}

export async function GET(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
  const field = sp.get('field')?.trim() || 'all'
  const sort = sp.get('sort')?.trim() || 'createdAt:desc'
  const page = Math.max(1, Number(sp.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') || '20')))

  const where: any = {}
  if (q) {
    if (field === 'id') {
      where.id = { contains: q }
    } else if (field === 'userId') {
      where.userId = { contains: q }
    } else if (field === 'wearingStyle') {
      where.wearingStyle = { contains: q }
    } else if (field === 'totalPrice') {
      const n = Number(q)
      if (!Number.isNaN(n)) where.totalPrice = { equals: n }
    } else {
      const n = Number(q)
      where.OR = [
        { id: { contains: q } },
        { userId: { contains: q } },
        { wearingStyle: { contains: q } },
      ]
      if (!Number.isNaN(n)) {
        where.OR.push({ totalPrice: { equals: n } })
      }
    }
  }

  const orderBy = (() => {
    const [k, o] = sort.split(':')
    const order = o === 'asc' ? 'asc' : 'desc'
    if (
      k === 'createdAt' ||
      k === 'updatedAt' ||
      k === 'totalPrice' ||
      k === 'wristSize'
    ) {
      return { [k]: order } as any
    }
    return { createdAt: 'desc' as const }
  })()

  const [total, designs] = await Promise.all([
    prisma.braceletDesign.count({ where }),
    prisma.braceletDesign.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        userId: true,
        totalPrice: true,
        totalWeight: true,
        averageDiameter: true,
        wristSize: true,
        wearingStyle: true,
        items: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            nickname: true,
            phone: true,
          },
        },
      },
    }),
  ])

  return NextResponse.json({ total, page, pageSize, designs }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as
    | {
        userId?: string
        items?: unknown
        totalPrice?: number
        totalWeight?: number | null
        averageDiameter?: number | null
        wristSize?: number | null
        wearingStyle?: string | null
      }
    | null
  if (!body) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  const userId = String(body.userId || '').trim()
  if (!userId) return NextResponse.json({ error: 'userId 必填' }, { status: 400 })
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: 'items 必须是数组' }, { status: 400 })
  }
  if (typeof body.totalPrice !== 'number' || Number.isNaN(body.totalPrice)) {
    return NextResponse.json({ error: 'totalPrice 必须是数字' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const totalWeight = parseNumber(body.totalWeight)
  const averageDiameter = parseNumber(body.averageDiameter)
  const wristSize = parseNumber(body.wristSize)
  const wearingStyle = body.wearingStyle ? String(body.wearingStyle).trim() : null

  const design = await prisma.braceletDesign.create({
    data: {
      userId,
      items: body.items as any,
      totalPrice: body.totalPrice,
      totalWeight,
      averageDiameter,
      wristSize,
      wearingStyle,
    },
  })

  return NextResponse.json({ design }, { status: 200 })
}
