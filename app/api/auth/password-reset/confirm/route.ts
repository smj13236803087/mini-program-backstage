import { NextRequest, NextResponse } from 'next/server'

/**
 * 邮箱密码重置已停用，小程序仅支持微信登录，无密码。
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: '密码重置已停用，请使用微信登录' },
    { status: 410 }
  )
}

