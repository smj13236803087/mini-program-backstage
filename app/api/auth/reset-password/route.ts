import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'
import { hashPassword, isValidEmail } from '@/lib/security'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | null
    | {
        token?: unknown
        newPassword?: unknown
      }

  if (!body) {
    return NextResponse.json({ errno: 400, errmsg: '请求体不能为空', data: null }, { status: 200 })
  }

  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (!token || !newPassword) {
    return NextResponse.json({ errno: 400, errmsg: '缺少 token 或新密码', data: null }, { status: 200 })
  }

  try {
    const email = await redis.get(`password_reset:${token}`)
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ errno: 400, errmsg: '重置链接已过期或无效', data: null }, { status: 200 })
    }

    const hashed = hashPassword(newPassword)

    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    })

    await redis.del(`password_reset:${token}`)
    return NextResponse.json({ errno: 0, errmsg: '', data: null }, { status: 200 })
  } catch (e) {
    console.error('reset-password error:', e)
    return NextResponse.json({ errno: 500, errmsg: '重置失败，请稍后重试', data: null }, { status: 200 })
  }
}

