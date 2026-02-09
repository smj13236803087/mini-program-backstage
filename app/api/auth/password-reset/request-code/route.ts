import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'
import { generate6DigitCode, isValidEmail } from '@/lib/security'
import { sendVerificationCodeEmail } from '@/lib/mailer'

const CODE_TTL_SEC = 10 * 60
const RESEND_COOLDOWN_SEC = 60

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string }
    const email = (body.email || '').trim().toLowerCase()

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    const cooldownKey = `pwreset:cooldown:${email}`
    const ttl = await redis.ttl(cooldownKey)
    if (ttl > 0) {
      return NextResponse.json(
        { error: '发送过于频繁', retryAfterSeconds: ttl },
        { status: 429 }
      )
    }

    // 先设置冷却，避免被用来枚举邮箱
    await redis.set(cooldownKey, '1', 'EX', RESEND_COOLDOWN_SEC)

    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const code = generate6DigitCode()
      const codeKey = `pwreset:code:${email}`
      await redis.set(codeKey, code, 'EX', CODE_TTL_SEC)
      await sendVerificationCodeEmail({
        to: email,
        code,
        purpose: 'password_reset',
      })
    }

    return NextResponse.json(
      { message: '如果该邮箱已注册，验证码将发送到你的邮箱', expiresInSeconds: CODE_TTL_SEC },
      { status: 200 }
    )
  } catch (err) {
    console.error('忘记密码发送验证码失败：', err)
    return NextResponse.json(
      { error: '发送验证码失败', detail: String(err) },
      { status: 500 }
    )
  }
}

