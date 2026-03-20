import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { signSession } from '@/lib/security'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as null | {
    email?: unknown
    code?: unknown
  }

  // 默认禁用公开注册，避免未经授权的账号被创建后直接登录
  if (process.env.ALLOW_PUBLIC_REGISTER !== 'true') {
    return NextResponse.json(
      { errno: 403, errmsg: '注册已禁用，请联系管理员开通账号', data: null },
      { status: 200 }
    )
  }

  if (!body) {
    return NextResponse.json(
      { errno: 400, errmsg: '请求体不能为空', data: null },
      { status: 200 }
    )
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const code = typeof body.code === 'string' ? body.code.trim() : ''

  if (!email || !code) {
    return NextResponse.json(
      { errno: 400, errmsg: '邮箱和验证码不能为空', data: null },
      { status: 200 }
    )
  }

  const pending = await prisma.pendingUser.findUnique({
    where: { email },
  })

  if (!pending) {
    return NextResponse.json(
      { errno: 404, errmsg: '未找到对应的注册请求，请先获取验证码', data: null },
      { status: 200 }
    )
  }

  const now = new Date()
  if (pending.expiresAt.getTime() < now.getTime()) {
    return NextResponse.json(
      { errno: 400, errmsg: '验证码已过期，请重新获取', data: null },
      { status: 200 }
    )
  }

  if (pending.verificationCode !== code) {
    return NextResponse.json(
      { errno: 400, errmsg: '验证码不正确', data: null },
      { status: 200 }
    )
  }

  const existingUser = (await prisma.user.findFirst({
    where: { email } as any,
  } as any)) as any

  if (existingUser) {
    // 已经是正式账号，直接登录
    const nowSec = Math.floor(Date.now() / 1000)
    const exp = nowSec + 60 * 60 * 24 * 7
    const token = signSession({
      sub: existingUser.id,
      user_id: existingUser.id,
      iat: nowSec,
      exp,
    })

    const res = NextResponse.json(
      {
        errno: 0,
        errmsg: '',
        data: {
          id: existingUser.id,
          email: existingUser.email,
          nickname: existingUser.nickname,
        },
      },
      { status: 200 }
    )

    res.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return res
  }

  const user = (await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: pending.email,
        password: pending.password,
        role: 'SUPER_ADMIN',
        nickname: pending.name,
      } as any,
    } as any)

    await tx.pendingUser.delete({
      where: { email: pending.email },
    })

    return created
  })) as any

  const nowSec = Math.floor(Date.now() / 1000)
  const exp = nowSec + 60 * 60 * 24 * 7
  const token = signSession({
    sub: user.id,
    user_id: user.id,
    iat: nowSec,
    exp,
  })

  const res = NextResponse.json(
    {
      errno: 0,
      errmsg: '',
      data: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    },
    { status: 200 }
  )

  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return res
}

