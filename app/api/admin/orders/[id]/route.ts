import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

const ALLOWED_STATUS = new Set([
  'pending',
  'to_pay',
  'to_ship',
  'to_receive',
  'done',
  'cancelled',
  'refund',
])

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, nickname: true, phone: true, avatar: true },
      },
      items: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  return NextResponse.json({ order }, { status: 200 })
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const body = (await req.json().catch(() => null)) as
    | {
        status?: string
        payStatus?: string
        shippingCompany?: string | null
        trackingNo?: string | null
        refundStatus?: string | null
        refundAmount?: number | string | null
        refundReason?: string | null
      }
    | null

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const nextStatus = body.status?.trim()
  if (nextStatus && !ALLOWED_STATUS.has(nextStatus)) {
    return NextResponse.json({ error: '非法订单状态' }, { status: 400 })
  }

  const data: any = {}

  // 状态变更（同时维护关键时间点）
  if (nextStatus) {
    data.status = nextStatus
    if (nextStatus === 'to_receive') {
      data.shippedAt = new Date()
    }
    if (nextStatus === 'done') {
      data.receivedAt = new Date()
    }
    if (nextStatus === 'refund' && !body.refundStatus) {
      data.refundStatus = 'requested'
    }
  }

  // 支付状态：用于“模拟支付”或补单
  if (body.payStatus) {
    data.payStatus = body.payStatus
    if (body.payStatus === 'paid') {
      data.paidAt = new Date()
      if (!nextStatus) data.status = 'to_ship'
    }
    if (body.payStatus === 'refunded') {
      if (!nextStatus) data.status = 'refund'
      data.refundedAt = new Date()
    }
  }

  if (body.shippingCompany !== undefined) data.shippingCompany = body.shippingCompany
  if (body.trackingNo !== undefined) data.trackingNo = body.trackingNo
  if (body.refundStatus !== undefined) data.refundStatus = body.refundStatus
  if (body.refundReason !== undefined) data.refundReason = body.refundReason

  if (body.refundAmount !== undefined) {
    const v = body.refundAmount
    if (v === null) {
      data.refundAmount = null
    } else {
      const n = typeof v === 'string' ? Number(v) : v
      if (typeof n !== 'number' || Number.isNaN(n) || n < 0) {
        return NextResponse.json({ error: 'refundAmount 不合法' }, { status: 400 })
      }
      data.refundAmount = n
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, nickname: true, phone: true, avatar: true } },
      items: { orderBy: { createdAt: 'asc' } },
    },
  })

  return NextResponse.json({ order: updated }, { status: 200 })
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params

  const exists = await prisma.order.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!exists) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId: id } })
    await tx.order.delete({ where: { id } })
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}

