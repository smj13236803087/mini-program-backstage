import { NextRequest, NextResponse } from 'next/server'

export function getAdminToken(req: NextRequest) {
  return (
    req.headers.get('x-admin-token') ||
    req.nextUrl.searchParams.get('admin_token') ||
    ''
  )
}

export function assertAdmin(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_TOKEN || 'dev-admin-token'
  const got = getAdminToken(req)
  if (!got || got !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

