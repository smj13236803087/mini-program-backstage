import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/security'

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

function parseBirthday(s: string): Date | undefined {
  const m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (!m) return undefined
  const [, y, mo, d] = m
  const date = new Date(parseInt(y!, 10), parseInt(mo!, 10) - 1, parseInt(d!, 10))
  if (isNaN(date.getTime())) return undefined
  return date
}

export async function GET(req: NextRequest) {
  let token = req.headers.get('x-equilune-token') || null

  if (!token) {
    const authHeader = req.headers.get('authorization')
    token = authHeader?.replace('Bearer ', '') || null
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

  // 优先使用 user_id，否则使用 sub
  const userId = payload.user_id || payload.sub
  if (!userId) {
    return NextResponse.json({ errno: 401, errmsg: 'token 无效', data: null }, { status: 200 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true, avatar: true, gender: true, birthday: true, signature: true, phone: true, phone_verified: true },
  })

  if (!user) {
    return NextResponse.json({ errno: 404, errmsg: '用户不存在', data: null }, { status: 200 })
  }

  return NextResponse.json({
    errno: 0,
    errmsg: '',
    data: {
      id: user.id,
      nickname: user.nickname || '微信用户',
      gender: user.gender || 0,
      avatar: user.avatar || '',
      birthday: user.birthday ? formatBirthday(user.birthday) : '',
      signature: user.signature || '',
      phone: user.phone_verified && user.phone ? maskPhone(user.phone) : (user.phone || ''),
      phone_verified: user.phone_verified,
    },
  }, { status: 200 })
}

export async function PUT(req: NextRequest) {
  let token = req.headers.get('x-equilune-token') || null

  if (!token) {
    const authHeader = req.headers.get('authorization')
    token = authHeader?.replace('Bearer ', '') || null
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

  const body = (await req.json().catch(() => null)) as null | {
    nickname?: unknown
    gender?: unknown
    avatar?: unknown
    birthday?: unknown
    signature?: unknown
    phone?: unknown
  }

  if (!body) {
    return NextResponse.json({ errno: 400, errmsg: '请求体不能为空', data: null }, { status: 200 })
  }

  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : undefined
  const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : undefined
  const gender = typeof body.gender === 'number' ? body.gender : undefined
  const signature = typeof body.signature === 'string' ? body.signature.trim() : undefined
  const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined
  const birthdayStr = typeof body.birthday === 'string' ? body.birthday.trim() : undefined
  const birthday = birthdayStr ? parseBirthday(birthdayStr) : undefined

  if (nickname !== undefined) {
    if (nickname.length === 0) {
      return NextResponse.json({ errno: 400, errmsg: '昵称不能为空', data: null }, { status: 200 })
    }
    if (nickname.length > 20) {
      return NextResponse.json({ errno: 400, errmsg: '昵称最多 20 个字符', data: null }, { status: 200 })
    }
  }

  if (avatar !== undefined && avatar.length > 2048) {
    return NextResponse.json({ errno: 400, errmsg: '头像链接过长', data: null }, { status: 200 })
  }

  if (gender !== undefined && ![0, 1, 2].includes(gender)) {
    return NextResponse.json({ errno: 400, errmsg: '性别参数不合法', data: null }, { status: 200 })
  }

  if (signature !== undefined && signature.length > 100) {
    return NextResponse.json({ errno: 400, errmsg: '个性签名最多 100 个字符', data: null }, { status: 200 })
  }

  if (phone !== undefined && phone.length > 20) {
    return NextResponse.json({ errno: 400, errmsg: '手机号格式不正确', data: null }, { status: 200 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(nickname !== undefined ? { nickname } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
      ...(gender !== undefined ? { gender } : {}),
      ...(birthday !== undefined ? { birthday } : {}),
      ...(signature !== undefined ? { signature } : {}),
      ...(phone !== undefined ? { phone } : {}),
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
      phone: updated.phone_verified && updated.phone ? maskPhone(updated.phone) : (updated.phone || ''),
      phone_verified: updated.phone_verified,
    },
  }, { status: 200 })
}
