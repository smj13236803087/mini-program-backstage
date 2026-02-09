import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'
import { generate6DigitCode, hashPassword, isValidEmail } from '@/lib/security'
import { sendVerificationCodeEmail } from '@/lib/mailer'

const CODE_TTL_SEC = 10 * 60
const RESEND_COOLDOWN_SEC = 60

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string
      name?: string
      password?: string
    }

    const email = (body.email || '').trim().toLowerCase()
    const name = (body.name || '').trim()
    const password = body.password || ''

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: '姓名不能为空' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: '密码长度至少 8 位' }, { status: 400 })
    }

    const cooldownKey = `register:cooldown:${email}`
    const ttl = await redis.ttl(cooldownKey)
    if (ttl > 0) {
      return NextResponse.json(
        { error: '发送过于频繁', retryAfterSeconds: ttl },
        { status: 429 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
    }

    const code = generate6DigitCode()
    const expiresAt = new Date(Date.now() + CODE_TTL_SEC * 1000)
    const passwordHash = hashPassword(password)

    await prisma.pendingUser.upsert({
      where: { email },
      create: {
        email,
        name,
        password: passwordHash,
        verificationCode: code,
        expiresAt,
      },
      update: {
        name,
        password: passwordHash,
        verificationCode: code,
        expiresAt,
      },
    })

    await sendVerificationCodeEmail({ to: email, code, purpose: 'register' })

    // 60s 冷却
    await redis.set(cooldownKey, '1', 'EX', RESEND_COOLDOWN_SEC)

    return NextResponse.json(
      { message: '验证码已发送', expiresInSeconds: CODE_TTL_SEC },
      { status: 200 }
    )
  } catch (err) {
    console.error('注册发送验证码失败：', err)
    return NextResponse.json(
      { error: '发送验证码失败', detail: String(err) },
      { status: 500 }
    )
  }
}

