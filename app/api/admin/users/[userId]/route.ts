import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'
import { hashPassword, isValidEmail } from '@/lib/security'

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

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { userId } = await ctx.params
  const body = (await req.json().catch(() => null)) as
    | {
        email?: string | null
        nickname?: string
        avatar?: string | null
        gender?: number | string | null
        weixin_openid?: string | null
        password?: unknown
        role?: string
      }
    | null

  if (!body) return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })

  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const data: {
    password?: string
    email?: string | null
    nickname?: string
    avatar?: string
    gender?: number
    weixin_openid?: string | null
    role?: AllowedRole
  } = {}

  if (body.nickname !== undefined) {
    const v = String(body.nickname || '').trim()
    if (!v) return NextResponse.json({ error: 'nickname 不能为空' }, { status: 400 })
    data.nickname = v
  }
  if (body.avatar !== undefined) data.avatar = String(body.avatar || '').trim()
  if (body.gender !== undefined) data.gender = normalizeGender(body.gender)
  if (body.role !== undefined) {
    const role = normalizeRole(body.role)
    if (!role) {
      return NextResponse.json({ error: 'role 仅支持 USER 或 SUPER_ADMIN' }, { status: 400 })
    }
    data.role = role
  }

  if (body.password !== undefined) {
    const passwordRaw = typeof body.password === 'string' ? body.password.trim() : ''
    if (!passwordRaw) {
      return NextResponse.json({ error: 'password 不能为空' }, { status: 400 })
    }
    try {
      data.password = hashPassword(passwordRaw)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'password 无效' },
        { status: 400 }
      )
    }
  }

  if (body.email !== undefined) {
    const email = body.email === null ? '' : String(body.email || '').trim().toLowerCase()
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'email 格式不正确' }, { status: 400 })
    }
    if (email) {
      const existsEmail = await prisma.user.findFirst({
        where: { email, id: { not: userId } },
        select: { id: true },
      })
      if (existsEmail) {
        return NextResponse.json({ error: 'email 已存在' }, { status: 409 })
      }
    }
    data.email = email || null
  }

  if (body.weixin_openid !== undefined) {
    const v = String(body.weixin_openid || '').trim()
    if (v) {
      const existsOpenId = await prisma.user.findFirst({
        where: { weixin_openid: v, id: { not: userId } },
        select: { id: true },
      })
      if (existsOpenId) {
        return NextResponse.json({ error: 'weixin_openid 已存在' }, { status: 409 })
      }
    }
    data.weixin_openid = v || null
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
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

  return NextResponse.json({ user: updated }, { status: 200 })
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { userId } = await ctx.params
  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true }, { status: 200 })
}

