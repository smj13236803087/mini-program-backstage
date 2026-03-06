import { NextRequest, NextResponse } from 'next/server'

/**
 * 邮箱密码登录已停用，小程序仅支持微信登录。
 * 请使用 /api/auth/wechat/login 接口。
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: '邮箱密码登录已停用，请使用微信登录' },
    { status: 410 }
  )
}

