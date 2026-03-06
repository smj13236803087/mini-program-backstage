import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signSession } from '@/lib/security'
import { wechatLogin } from '@/lib/wechat'

const SESSION_DAYS = 7

function formatBirthday(d: Date): string {
  const date = new Date(d)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

function maskPhone(phone: string): string {
  if (phone.length < 11) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      code?: string
      userInfo?: {
        rawData: string
        signature: string
        encryptedData: string
        iv: string
      }
    }

    const code = body.code?.trim()
    if (!code) {
      return NextResponse.json({ errno: 400, errmsg: '微信code不能为空', data: null }, { status: 400 })
    }

    if (!body.userInfo) {
      return NextResponse.json({ errno: 400, errmsg: '用户信息不能为空', data: null }, { status: 400 })
    }

    // 1. 解释用户数据（包含 signature 校验和 encryptedData 解密）
    const { errno, errmsg, data: wechatUserInfo } = await wechatLogin(code, body.userInfo)
    if (errno !== 0 || !wechatUserInfo) {
      return NextResponse.json({ errno, errmsg, data: null }, { status: 400 })
    }

    // 检查 openId 是否存在
    if (!wechatUserInfo.openId) {
      console.error('wechatUserInfo:', JSON.stringify(wechatUserInfo, null, 2))
      return NextResponse.json({ errno: 400, errmsg: '获取 openId 失败', data: null }, { status: 400 })
    }

    const openId = wechatUserInfo.openId

    // 2. 根据 weixin_openid 查找用户
    let user = await prisma.user.findUnique({
      where: { weixin_openid: openId },
    })

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            weixin_openid: openId,
            avatar: wechatUserInfo.avatarUrl || '',
            gender: wechatUserInfo.gender || 0,
            nickname: wechatUserInfo.nickName,
          },
        })
      } catch (e: unknown) {
        // 并发创建导致唯一约束冲突：重新查询
        if (typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002') {
          user = await prisma.user.findUnique({ where: { weixin_openid: openId } })
        }
        if (!user) throw e
      }
    }
    if (user) {
      // 若存在用户：不要覆盖用户手动编辑过的资料
      // 仅在本地字段为空时，用微信信息补全
      const patch: { avatar?: string; gender?: number; nickname?: string } = {}

      if (!user.avatar && wechatUserInfo.avatarUrl) patch.avatar = wechatUserInfo.avatarUrl
      if ((user.gender === null || user.gender === undefined) && typeof wechatUserInfo.gender === 'number') {
        patch.gender = wechatUserInfo.gender
      }
      if (!user.nickname && wechatUserInfo.nickName) patch.nickname = wechatUserInfo.nickName

      if (Object.keys(patch).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: patch,
        })
      }
    }

    if (!user) {
      return NextResponse.json({ errno: 500, errmsg: '用户创建/查询失败', data: null }, { status: 500 })
    }

    // 3. 查询用户信息
    const newUserInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nickname: true,
        gender: true,
        avatar: true,
        birthday: true,
        signature: true,
        phone: true,
        phone_verified: true,
      },
    })

    if (!newUserInfo) {
      return NextResponse.json({ errno: 500, errmsg: '用户信息查询失败', data: null }, { status: 500 })
    }

    const now = Math.floor(Date.now() / 1000)

    // 4. 生成 token（使用 JWT 包含 user_id）
    const token = signSession({
      user_id: user.id,
      sub: user.id,
      iat: now,
      exp: now + SESSION_DAYS * 24 * 3600,
    })

    if (!token) {
      return NextResponse.json({ errno: 500, errmsg: '生成 token 失败', data: null }, { status: 500 })
    }

    // 5. 返回结果
    const res = NextResponse.json(
      {
        errno: 0,
        errmsg: '',
        data: {
          token,
          userInfo: {
            id: newUserInfo.id,
            nickname: newUserInfo.nickname || '微信用户',
            gender: newUserInfo.gender || 0,
            avatar: newUserInfo.avatar || '',
            birthday: newUserInfo.birthday ? formatBirthday(newUserInfo.birthday) : '',
            signature: newUserInfo.signature || '',
            phone: newUserInfo.phone_verified && newUserInfo.phone ? maskPhone(newUserInfo.phone) : (newUserInfo.phone || ''),
            phone_verified: newUserInfo.phone_verified,
          },
        },
      },
      { status: 200 }
    )

    // 同时设置 cookie
    res.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DAYS * 24 * 3600,
    })

    return res
  } catch (err) {
    console.error('微信登录失败：', err)
    return NextResponse.json(
      {
        errno: 500,
        errmsg: err instanceof Error ? err.message : '微信登录失败',
        data: null,
      },
      { status: 500 }
    )
  }
}
