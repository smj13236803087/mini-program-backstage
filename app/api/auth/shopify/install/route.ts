import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID
const APP_URL = process.env.SHOPIFY_APP_URL
const SCOPES = process.env.SHOPIFY_SCOPES || 'read_products'

export async function GET(req: NextRequest) {
  if (!CLIENT_ID || !APP_URL) {
    return NextResponse.json(
      {
        error:
          '缺少环境变量：请在 .env.local 中配置 SHOPIFY_CLIENT_ID 和 SHOPIFY_APP_URL',
      },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(req.url)
  const shop = searchParams.get('shop')

  if (!shop) {
    return NextResponse.json({ error: '缺少 shop 参数' }, { status: 400 })
  }

  // 生成 state 防止 CSRF，并存入 cookie
  const state = crypto.randomBytes(16).toString('hex')
  cookies().set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  const redirectUri = `${APP_URL}/api/auth/shopify/callback`

  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`)
  authUrl.searchParams.set('client_id', CLIENT_ID)
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}

