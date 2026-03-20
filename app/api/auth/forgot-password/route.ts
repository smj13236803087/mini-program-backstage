import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import redis from '@/lib/redis'
import crypto from 'crypto'
import { isValidEmail, hashPassword } from '@/lib/security'
import { sendEmail } from '@/lib/mailer'

function getBaseUrl(req: NextRequest) {
  // 生成邮件链接时优先使用配置，避免因为反向代理/请求头缺失导致拼出非法 URL
  const configured =
    process.env.RESET_PASSWORD_BASE_URL ||
    process.env.EMAIL_REQUEST_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.PUBLIC_BASE_URL

  if (typeof configured === 'string' && configured.trim()) {
    return configured.trim().replace(/\/+$/, '')
  }

  const proto =
    req.headers.get('x-forwarded-proto') ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''

  if (!host) {
    throw new Error('无法获取服务域名：请配置 RESET_PASSWORD_BASE_URL/EMAIL_REQUEST_BASE_URL')
  }

  return `${proto}://${host}`
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as null | { email?: unknown }

  if (!body) {
    return NextResponse.json({ errno: 400, errmsg: '请求体不能为空', data: null }, { status: 200 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ errno: 400, errmsg: '邮箱格式不正确', data: null }, { status: 200 })
  }

  try {
    // 只允许管理员角色使用该功能（防止普通用户/未知账号枚举）
    const user = await prisma.user.findFirst({
      where: { email, role: { in: ['SUPER_ADMIN', 'ADMIN'] } } as any,
      select: { id: true },
    })

    // 不泄露账号是否存在：即使不存在也返回“邮件已发送”的同样提示
    const token = crypto.randomBytes(24).toString('hex')
    if (user) {
      await redis.set(`password_reset:${token}`, email, 'EX', 60 * 60) // 1 hour
    }

    const baseUrl = getBaseUrl(req)
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`

    await sendEmail({
      to: email,
      subject: '重置密码',
      text: `请在 1 小时内点击以下链接重置密码：\n${resetUrl}`,
      html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; line-height:1.6">` +
        `<p>请在 1 小时内点击以下链接重置密码：</p>` +
        `<p><a href="${resetUrl}">${resetUrl}</a></p>` +
        `<p>如果不是本人操作，请忽略本邮件。</p>` +
        `</div>`,
    })

    return NextResponse.json({ errno: 0, errmsg: '', data: null }, { status: 200 })
  } catch (e) {
    console.error('forgot-password error:', e)
    return NextResponse.json({ errno: 500, errmsg: '发送重置密码邮件失败，请稍后重试', data: null }, { status: 200 })
  }
}

