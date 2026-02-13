import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signSession } from '@/lib/security'
import { createOrGetShopifyCustomer } from '@/lib/shopify/admin'

const SESSION_DAYS = 7

// 微信小程序配置
const WECHAT_APPID = process.env.WECHAT_MINIAPP_APPID
const WECHAT_SECRET = process.env.WECHAT_MINIAPP_SECRET

/**
 * 通过code获取微信openid和session_key
 */
async function getWechatOpenId(code: string): Promise<{ openid: string; session_key: string }> {
  if (!WECHAT_APPID || !WECHAT_SECRET) {
    throw new Error('微信配置未设置：请配置 WECHAT_MINIAPP_APPID 和 WECHAT_MINIAPP_SECRET')
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`

  const res = await fetch(url)
  const data = await res.json()

  if (data.errcode) {
    throw new Error(`微信API错误: ${data.errcode} - ${data.errmsg || '未知错误'}`)
  }

  if (!data.openid) {
    throw new Error('获取微信openid失败')
  }

  return {
    openid: data.openid,
    session_key: data.session_key || '',
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      code?: string
      nickName?: string
      avatarUrl?: string
      gender?: number
      country?: string
      province?: string
      city?: string
    }

    const code = body.code?.trim()
    if (!code) {
      return NextResponse.json({ error: '微信code不能为空' }, { status: 400 })
    }

    // 1. 通过code获取微信openid
    const { openid, session_key } = await getWechatOpenId(code)

    // 2. 查找或创建用户
    // 使用openid作为唯一标识，如果没有email字段，可以用wechat_${openid}作为email
    const wechatEmail = `wechat_${openid}@wechat.local`
    
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: wechatEmail },
          // 如果以后添加了wechatOpenId字段，也可以这样查找
          // { wechatOpenId: openid }
        ],
      },
    })

    if (!user) {
      // 创建新用户
      // 使用微信昵称作为name，如果没有则使用默认值
      const userName = body.nickName || '微信用户'
      
      // 先创建本地用户
      user = await prisma.user.create({
        data: {
          email: wechatEmail,
          password: '', // 微信登录不需要密码，但schema要求有password字段，使用空字符串
          name: userName,
          shopifyEmail: wechatEmail,
        },
      })

      // 尝试同步到Shopify（可选，如果失败不影响登录）
      try {
        const customer = await createOrGetShopifyCustomer({
          email: wechatEmail,
          name: userName,
        })

        await prisma.user.update({
          where: { id: user.id },
          data: {
            shopifyCustomerId: String(customer.id),
            shopifyEmail: customer.email,
          },
        })
      } catch (shopifyErr) {
        // Shopify同步失败不影响登录，只记录日志
        console.warn('Shopify同步失败（微信登录）：', shopifyErr)
      }
    } else {
      // 更新用户信息（如果提供了新的昵称或头像信息）
      if (body.nickName && body.nickName !== user.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: body.nickName },
        })
        user.name = body.nickName
      }
    }

    // 3. 生成session token
    const now = Math.floor(Date.now() / 1000)
    const exp = now + SESSION_DAYS * 24 * 3600
    const token = signSession({
      sub: user.id,
      email: user.email,
      iat: now,
      exp,
    })

    // 4. 设置cookie并返回
    const res = NextResponse.json(
      {
        message: '登录成功',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          shopifyCustomerId: user.shopifyCustomerId,
        },
      },
      { status: 200 }
    )

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
        error: '微信登录失败',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
