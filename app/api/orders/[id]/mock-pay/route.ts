import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/security'
import { deductInventoryOnOrderPaid, OrderInventoryError } from '@/lib/order-sale-inventory'

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

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id } = await ctx.params

  const exists = await prisma.order.findFirst({
    where: { id, userId },
    select: { id: true, payStatus: true },
  })
  if (!exists) return NextResponse.json({ error: '订单不存在' }, { status: 404 })

  if (exists.payStatus === 'paid') {
    return NextResponse.json({ ok: true, orderId: id }, { status: 200 })
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const n = await tx.order.updateMany({
        where: { id, userId, payStatus: 'unpaid' },
        data: {
          payStatus: 'paid',
          paidAt: new Date(),
          status: 'making',
        },
      })
      if (n.count === 0) {
        const cur = await tx.order.findFirst({
          where: { id, userId },
          select: { payStatus: true },
        })
        if (cur?.payStatus === 'paid') {
          return tx.order.findUnique({ where: { id } })
        }
        return null
      }
      await deductInventoryOnOrderPaid(tx, id)
      return tx.order.findUnique({ where: { id } })
    })

    if (!updated) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, order: updated }, { status: 200 })
  } catch (e) {
    if (e instanceof OrderInventoryError) {
      if (e.code === 'INSUFFICIENT_STOCK') {
        return NextResponse.json({ error: e.message }, { status: 409 })
      }
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    throw e
  }
}

