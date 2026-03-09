import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { hashPassword, verifyPassword, signSession } from '@/lib/security'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as null | {
    email?: unknown
    password?: unknown
  }

  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json(
      { errno: 400, errmsg: '邮箱和密码不能为空', data: null },
      { status: 200 }
    )
  }

  const email = body.email.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json(
      { errno: 400, errmsg: '邮箱和密码不能为空', data: null },
      { status: 200 }
    )
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      isAdmin: true,
    },
  })

  if (!user || !user.password) {
    return NextResponse.json(
      { errno: 401, errmsg: '账号或密码错误', data: null },
      { status: 200 }
    )
  }

  const ok = verifyPassword(password, user.password)
  if (!ok) {
    return NextResponse.json(
      { errno: 401, errmsg: '账号或密码错误', data: null },
      { status: 200 }
    )
  }

  const now = Math.floor(Date.now() / 1000)
  const exp = now + 60 * 60 * 24 * 7 // 7 天
  const token = signSession({
    sub: user.id,
    user_id: user.id,
    iat: now,
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

