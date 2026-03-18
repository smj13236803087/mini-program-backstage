import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const denied = assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
  const field = sp.get('field')?.trim() || ''
  const sort = sp.get('sort')?.trim() || '' // e.g. createdAt:desc

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, nickname: true, phone: true, weixin_openid: true },
  })
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const where: any = { userId: params.userId }
  if (q) {
    if (!field || field === 'all') {
      where.OR = [{ id: { contains: q } }]
      const n = Number(q)
      if (!Number.isNaN(n)) {
        where.OR.push({ totalPrice: { equals: n } })
      }
    } else if (field === 'id') {
      where.id = { contains: q }
    }
  }

  const orderBy = (() => {
    const [k, o] = sort.split(':')
    const order = o === 'asc' ? 'asc' : o === 'desc' ? 'desc' : null
    if (!order) return { createdAt: 'desc' as const }
    if (k === 'createdAt' || k === 'updatedAt' || k === 'totalPrice') {
      return { [k]: order } as any
    }
    return { createdAt: 'desc' as const }
  })()

  const designs = await prisma.braceletDesign.findMany({
    where,
    orderBy,
    select: {
      id: true,
      totalPrice: true,
      totalWeight: true,
      averageDiameter: true,
      wristSize: true,
      wearingStyle: true,
      items: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ user, designs }, { status: 200 })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const denied = assertAdmin(req)
  if (denied) return denied

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const body = (await req.json().catch(() => null)) as
    | {
        items: unknown
        totalPrice: number
        totalWeight?: number | null
        averageDiameter?: number | null
        wristSize?: number | null
        wearingStyle?: 'single' | 'double' | null
        createdAt?: string | number | null
      }
    | null

  if (!body) return NextResponse.json({ error: '参数错误' }, { status: 400 })
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: 'items 必须是数组' }, { status: 400 })
  }
  if (typeof body.totalPrice !== 'number' || Number.isNaN(body.totalPrice)) {
    return NextResponse.json({ error: 'totalPrice 必须是数字' }, { status: 400 })
  }

  const createdAt = (() => {
    if (body.createdAt === null || body.createdAt === undefined) return undefined
    const d =
      typeof body.createdAt === 'number'
        ? new Date(body.createdAt)
        : new Date(String(body.createdAt))
    if (Number.isNaN(d.getTime())) return undefined
    return d
  })()

  const design = await prisma.braceletDesign.create({
    data: {
      userId: params.userId,
      items: body.items as any,
      totalPrice: body.totalPrice,
      totalWeight: body.totalWeight ?? null,
      averageDiameter: body.averageDiameter ?? null,
      wristSize: body.wristSize ?? null,
      wearingStyle: body.wearingStyle ?? null,
      ...(createdAt ? { createdAt } : {}),
    },
  })

  return NextResponse.json({ design }, { status: 200 })
}

