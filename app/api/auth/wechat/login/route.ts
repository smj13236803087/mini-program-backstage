import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signSession } from '@/lib/security'
import { wechatLogin } from '@/lib/wechat'

const SESSION_DAYS = 7

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

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || ''

    // 2. 根据 openid 查找用户是否已经注册
    // 兼容：如果历史逻辑曾用 wechat_${openid}@wechat.local 创建过用户，但没有写入 weixin_openid，
    // 则需要通过 email 回填 weixin_openid，避免 email 唯一约束冲突。
    const openId = wechatUserInfo.openId
    const wechatEmail = `wechat_${openId}@wechat.local`
    
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ weixin_openid: openId }, { email: wechatEmail }],
      },
    })

    const now = Math.floor(Date.now() / 1000)
    const nowAt = new Date()
    
    if (!user) {
      try {
      user = await prisma.user.create({
        data: {
          email: wechatEmail,
            password: '', // 微信登录不需要密码
            name: `微信用户${Math.random().toString(36).substring(2, 8)}`,
            weixin_openid: openId,
            avatar: wechatUserInfo.avatarUrl || '',
            gender: wechatUserInfo.gender || 0,
            nickname: wechatUserInfo.nickName,
            register_ip: clientIp,
            last_login_time: nowAt,
            last_login_ip: clientIp,
        },
      })
      } catch (e: any) {
        // 并发/历史数据导致 email 唯一约束冲突：回查并继续走更新逻辑
        if (e?.code === 'P2002') {
          user = await prisma.user.findUnique({ where: { email: wechatEmail } })
    } else {
          throw e
        }
      }
    }

    if (!user) {
      return NextResponse.json({ errno: 500, errmsg: '用户创建/查询失败', data: null }, { status: 500 })
    }

    // 若存在用户但未绑定 weixin_openid，则回填；同时更新头像/昵称等信息
    if (!user.weixin_openid || user.weixin_openid !== openId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          weixin_openid: openId,
          avatar: wechatUserInfo.avatarUrl || user.avatar || '',
          gender: wechatUserInfo.gender || user.gender || 0,
          nickname: wechatUserInfo.nickName || user.nickname || '',
        },
      })
    }

    // 3. 查询用户信息
    const newUserInfo = await prisma.user.findUnique({
          where: { id: user.id },
      select: {
        id: true,
        name: true,
        nickname: true,
        gender: true,
        avatar: true,
      },
        })

    if (!newUserInfo) {
      return NextResponse.json({ errno: 500, errmsg: '用户信息查询失败', data: null }, { status: 500 })
    }

    // 4. 更新登录信息
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_login_time: nowAt,
        last_login_ip: clientIp,
      },
    })

    // 5. 生成 token（使用 JWT 包含 user_id）
    const token = signSession({
      user_id: user.id,
      sub: user.id,
      email: user.email,
      iat: now,
      exp: now + SESSION_DAYS * 24 * 3600,
    })

    if (!token) {
      return NextResponse.json({ errno: 500, errmsg: '生成 token 失败', data: null }, { status: 500 })
    }

    // 6. 返回结果
    const res = NextResponse.json(
      {
        errno: 0,
        errmsg: '',
        data: {
          token,
          userInfo: {
            id: newUserInfo.id,
            username: newUserInfo.name || '',
            nickname: newUserInfo.nickname || newUserInfo.name || '',
            gender: newUserInfo.gender || 0,
            avatar: newUserInfo.avatar || '',
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
