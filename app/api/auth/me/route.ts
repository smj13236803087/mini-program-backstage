import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/security'

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
    select: { id: true, email: true, name: true, nickname: true, avatar: true, gender: true, last_login_time: true },
  })

  if (!user) {
    return NextResponse.json({ errno: 404, errmsg: '用户不存在', data: null }, { status: 200 })
  }

  const lastLoginText = (() => {
    if (!user.last_login_time) return ''
    // 明确输出：YYYY-MM-DD HH:mm:ss（上海时区）
    const sh = new Date(new Date(user.last_login_time).toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${sh.getFullYear()}-${pad(sh.getMonth() + 1)}-${pad(sh.getDate())} ${pad(sh.getHours())}:${pad(sh.getMinutes())}:${pad(sh.getSeconds())}`
  })()

  return NextResponse.json({
    errno: 0,
    errmsg: '',
    data: {
      id: user.id,
      username: user.name || '',
      nickname: user.nickname || user.name || '',
      gender: user.gender || 0,
      avatar: user.avatar || '',
      lastLoginTime: lastLoginText,
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
  }

  if (!body) {
    return NextResponse.json({ errno: 400, errmsg: '请求体不能为空', data: null }, { status: 200 })
  }

  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : undefined
  const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : undefined
  const gender = typeof body.gender === 'number' ? body.gender : undefined

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

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(nickname !== undefined ? { nickname } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
      ...(gender !== undefined ? { gender } : {}),
    },
    select: { id: true, name: true, nickname: true, avatar: true, gender: true, last_login_time: true },
  })

  const lastLoginText = (() => {
    if (!updated.last_login_time) return ''
    const sh = new Date(new Date(updated.last_login_time).toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${sh.getFullYear()}-${pad(sh.getMonth() + 1)}-${pad(sh.getDate())} ${pad(sh.getHours())}:${pad(sh.getMinutes())}:${pad(sh.getSeconds())}`
  })()

  return NextResponse.json({
    errno: 0,
    errmsg: '',
    data: {
      id: updated.id,
      username: updated.name || '',
      nickname: updated.nickname || updated.name || '',
      gender: updated.gender || 0,
      avatar: updated.avatar || '',
      lastLoginTime: lastLoginText,
    },
  }, { status: 200 })
}

