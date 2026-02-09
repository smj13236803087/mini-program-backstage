import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'
import { hashPassword, isValidEmail } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string
      code?: string
      newPassword?: string
    }
    const email = (body.email || '').trim().toLowerCase()
    const code = (body.code || '').trim()
    const newPassword = body.newPassword || ''

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: '验证码格式不正确' }, { status: 400 })
    }
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: '新密码长度至少 8 位' }, { status: 400 })
    }

    const codeKey = `pwreset:code:${email}`
    const stored = await redis.get(codeKey)
    if (!stored || stored !== code) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword) },
    })

    await redis.del(codeKey)

    return NextResponse.json({ message: '密码已更新，请重新登录' }, { status: 200 })
  } catch (err) {
    console.error('重置密码失败：', err)
    return NextResponse.json(
      { error: '重置密码失败', detail: String(err) },
      { status: 500 }
    )
  }
}

