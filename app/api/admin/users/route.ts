import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

const ALLOWED_ROLES = ['USER', 'SUPER_ADMIN'] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]

function normalizeRole(input: unknown): AllowedRole | null {
  const v = String(input || '').trim().toUpperCase()
  if (v === 'USER' || v === 'SUPER_ADMIN') return v
  return null
}

function normalizeGender(input: unknown): number {
  const n = Number(input)
  if (n === 1 || n === 2) return n
  return 0
}

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
        { role: { equals: q.toUpperCase() } },
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
      field === 'nickname'
    ) {
      where[field] = { contains: q }
    } else if (field === 'role') {
      where.role = { equals: q.toUpperCase() }
    } else {
      where.OR = [
        { id: { contains: q } },
        { weixin_openid: { contains: q } },
        { email: { contains: q } },
        { nickname: { contains: q } },
        { role: { equals: q.toUpperCase() } },
      ]
    }
  }

  const orderBy = (() => {
    const [k, o] = sort.split(':')
    const order = o === 'asc' ? 'asc' : o === 'desc' ? 'desc' : null
    if (!order) return { createdAt: 'desc' as const }
    if (k === 'createdAt' || k === 'updatedAt') return { [k]: order } as any
    if (k === 'id' || k === 'nickname' || k === 'role') return { [k]: order } as any
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
        avatar: true,
        gender: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  return NextResponse.json({ page, pageSize, total, users }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as
    | {
        nickname?: string
        avatar?: string | null
        gender?: number | string | null
        weixin_openid?: string | null
        role?: string
      }
    | null

  if (!body) return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })

  const nickname = String(body.nickname || '').trim()
  if (!nickname) return NextResponse.json({ error: 'nickname 不能为空' }, { status: 400 })

  const role = normalizeRole(body.role)
  if (!role) {
    return NextResponse.json({ error: 'role 仅支持 USER 或 SUPER_ADMIN' }, { status: 400 })
  }

  const avatar = body.avatar === undefined ? '' : String(body.avatar || '').trim()
  const gender = normalizeGender(body.gender)
  const weixinOpenId = String(body.weixin_openid || '').trim()

  if (weixinOpenId) {
    const existsOpenId = await prisma.user.findUnique({
      where: { weixin_openid: weixinOpenId },
      select: { id: true },
    })
    if (existsOpenId) {
      return NextResponse.json({ error: 'weixin_openid 已存在' }, { status: 409 })
    }
  }

  const created = await prisma.user.create({
    data: {
      nickname,
      avatar: avatar || '',
      gender,
      role,
      weixin_openid: weixinOpenId || null,
    },
    select: {
      id: true,
      role: true,
      weixin_openid: true,
      email: true,
      avatar: true,
      gender: true,
      nickname: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ user: created }, { status: 200 })
}

