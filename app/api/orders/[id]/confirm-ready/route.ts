import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/security'

function getTokenFromReq(req: NextRequest): string | null {
  const h = req.headers.get('x-equilune-token')
  if (h) return h
  const auth = req.headers.get('authorization')
  if (auth) return auth.replace('Bearer ', '')
  return cookies().get('session')?.value || null
}

function getUserIdFromReq(req: NextRequest): string | null {
  const token = getTokenFromReq(req)
  if (!token) return null
  const payload = (() => {
    try {
      return verifySession(token)
    } catch {
      return null
    }
  })()
  if (!payload) return null
  return payload.user_id || payload.sub || null
}

// 小程序端「确认实物并发出」：将状态从 inspect -> ready（结缘发出）
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id } = await ctx.params
  const order = await prisma.order.findFirst({
    where: { id, userId },
    select: { id: true, status: true },
  })
  if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 })

  if (order.status !== 'inspect') {
    return NextResponse.json({ error: '当前状态不可确认实物', status: order.status }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: 'ready' },
  })

  return NextResponse.json({ ok: true, order: updated }, { status: 200 })
}

