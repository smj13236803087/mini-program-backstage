import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generate6DigitCode, hashPassword, isValidEmail } from '@/lib/security'
import { sendVerificationCodeEmail } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as null | {
    email?: unknown
    name?: unknown
    password?: unknown
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
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { errno: 400, errmsg: '邮箱格式不正确', data: null },
      { status: 200 }
    )
  }

  if (!name) {
    return NextResponse.json(
      { errno: 400, errmsg: '姓名不能为空', data: null },
      { status: 200 }
    )
  }

  try {
    // 提前校验密码规则（内部也会校验长度）
    const hashed = hashPassword(password)

    const existingUser = await prisma.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { errno: 409, errmsg: '该邮箱已注册', data: null },
        { status: 200 }
      )
    }

    const code = generate6DigitCode()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000)

    await prisma.pendingUser.upsert({
      where: { email },
      update: {
        name,
        password: hashed,
        verificationCode: code,
        expiresAt,
      },
      create: {
        email,
        name,
        password: hashed,
        verificationCode: code,
        expiresAt,
      },
    })

    await sendVerificationCodeEmail({
      to: email,
      code,
      purpose: 'register',
    })

    return NextResponse.json(
      { errno: 0, errmsg: '', data: { email } },
      { status: 200 }
    )
  } catch (err) {
    console.error('register request-code error', err)
    return NextResponse.json(
      { errno: 500, errmsg: '发送验证码失败，请稍后重试', data: null },
      { status: 200 }
    )
  }
}

