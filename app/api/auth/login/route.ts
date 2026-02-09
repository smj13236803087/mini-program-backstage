import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isValidEmail, signSession, verifyPassword } from '@/lib/security'

const SESSION_DAYS = 7

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string }
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }
    if (!password) {
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }
    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + SESSION_DAYS * 24 * 3600
    const token = signSession({ sub: user.id, email: user.email, iat: now, exp })

    const res = NextResponse.json(
      { message: '登录成功', user: { id: user.id, email: user.email, name: user.name } },
      { status: 200 }
    )
    res.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DAYS * 24 * 3600,
    })
    return res
  } catch (err) {
    console.error('登录失败：', err)
    return NextResponse.json(
      { error: '登录失败', detail: String(err) },
      { status: 500 }
    )
  }
}

