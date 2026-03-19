import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signSession } from '@/lib/security'
import { decryptUserInfoData, getWechatSession, verifyUserInfoSignature } from '@/lib/wechat'

const SESSION_DAYS = 7
// 新用户头像由小程序端 defaultAvatar 兜底，这里不再使用任何默认 URL
const DEFAULT_AVATAR_URL = ''

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

    // 1) 使用 code 获取 openid/session_key（只调用一次，避免 code 复用失败）
    const sessionData = await getWechatSession(code)
    const openId = sessionData.openid

    // 2. 根据 weixin_openid 查找用户
    let user = await prisma.user.findUnique({
      where: { weixin_openid: openId },
    })

    const isNewUser = !user

    // 如果有 userInfo，解密获得昵称/头像等（需要用户确认后才能拿到）
    const decrypted = (() => {
      if (!body.userInfo) return null
      const ok = verifyUserInfoSignature(body.userInfo.rawData, body.userInfo.signature, sessionData.session_key)
      if (!ok) return null
      return decryptUserInfoData(sessionData.session_key, body.userInfo.encryptedData, body.userInfo.iv)
    })()

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            weixin_openid: openId,
            role: 'USER',
            // 新用户头像使用小程序侧 defaultAvatar 兜底，这里不写默认 URL（避免 404/外链依赖）
            avatar: '',
            gender: typeof decrypted?.gender === 'number' ? decrypted!.gender : 0,
            nickname: decrypted?.nickName || null,
          } as any,
        } as any)
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

      if (!user.avatar && decrypted?.avatarUrl) patch.avatar = decrypted.avatarUrl
      if ((user.gender === null || user.gender === undefined) && typeof decrypted?.gender === 'number') {
        patch.gender = decrypted.gender
      }
      if (!user.nickname && decrypted?.nickName) patch.nickname = decrypted.nickName

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
          isNewUser,
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
