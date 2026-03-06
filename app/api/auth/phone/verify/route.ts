import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/security'
import { getPhoneNumber } from '@/lib/wechat'

/**
 * 验证手机号：用户点击微信 getPhoneNumber 后，将 code 传给此接口
 * 后端调用微信 API 获取真实手机号并更新用户
 */
export async function POST(req: NextRequest) {
  let token = req.headers.get('x-equilune-token') || null
  if (!token) {
    token = req.headers.get('authorization')?.replace('Bearer ', '') || null
  }
  if (!token) {
    token = cookies().get('session')?.value || null
  }

  if (!token) {
    return NextResponse.json({ errno: 401, errmsg: '未登录', data: null }, { status: 200 })
  }

  const payload = (() => {
    try {
      return verifySession(token)
    } catch {
      return null
    }
  })()

  if (!payload) {
    return NextResponse.json({ errno: 401, errmsg: 'token 无效', data: null }, { status: 200 })
  }

  const userId = payload.user_id || payload.sub
  if (!userId) {
    return NextResponse.json({ errno: 401, errmsg: 'token 无效', data: null }, { status: 200 })
  }

  const body = (await req.json().catch(() => null)) as { code?: string } | null
  const code = body?.code?.trim()

  if (!code) {
    return NextResponse.json({ errno: 400, errmsg: '缺少手机号授权 code', data: null }, { status: 200 })
  }

  try {
    const phoneInfo = await getPhoneNumber(code)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phoneInfo.purePhoneNumber,
        phone_verified: true,
      },
      select: { id: true, nickname: true, avatar: true, gender: true, birthday: true, signature: true, phone: true, phone_verified: true },
    })

    return NextResponse.json({
      errno: 0,
      errmsg: '',
      data: {
        id: updated.id,
        nickname: updated.nickname || '微信用户',
        gender: updated.gender || 0,
        avatar: updated.avatar || '',
        birthday: updated.birthday ? formatBirthday(updated.birthday) : '',
        signature: updated.signature || '',
        phone: maskPhone(updated.phone || ''),
        phone_verified: updated.phone_verified,
      },
    }, { status: 200 })
  } catch (e) {
    console.error('手机号验证失败:', e)
    return NextResponse.json({
      errno: 400,
      errmsg: e instanceof Error ? e.message : '获取手机号失败，请确保小程序已认证并开通手机号能力',
      data: null,
    }, { status: 200 })
  }
}

function formatBirthday(d: Date): string {
  const date = new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function maskPhone(phone: string): string {
  if (phone.length < 11) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}
