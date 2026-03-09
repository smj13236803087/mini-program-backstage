import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma, { Prisma } from '@/lib/prisma'
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

function toMoneyDecimal(n: number) {
  return new Prisma.Decimal(n.toFixed(2))
}

function genOutTradeNo() {
  const rand = Math.floor(Math.random() * 1e6)
    .toString()
    .padStart(6, '0')
  return `OUT${Date.now()}${rand}`
}

export async function GET(req: NextRequest) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  })

  return NextResponse.json({ orders }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as
    | null
    | {
        remark?: string
        price?: number
        draft?: any
        addressId?: string
        address?: {
          recipient?: string
          phone?: string
          country?: string
          province?: string
          city?: string
          district?: string
          detail?: string
          postalCode?: string
        }
      }

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const remark = typeof body.remark === 'string' ? body.remark.trim() : ''
  const draft = body.draft || null
  const price = typeof body.price === 'number' ? body.price : Number(draft?.design?.price || 0)
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: '价格不合法' }, { status: 400 })
  }

  let addr:
    | null
    | {
        recipient: string
        phone: string
        country: string
        province: string
        city: string
        district: string
        detail: string
        postalCode: string | null
      } = null

  if (body.addressId) {
    const a = await prisma.address.findFirst({
      where: { id: body.addressId, userId },
    })
    if (!a) return NextResponse.json({ error: '收货地址不存在' }, { status: 400 })
    addr = {
      recipient: a.recipient,
      phone: a.phone,
      country: a.country,
      province: a.province,
      city: a.city,
      district: a.district,
      detail: a.detail,
      postalCode: a.postalCode || null,
    }
  } else {
    const a = body.address || (null as any)
    const recipient = typeof a?.recipient === 'string' ? a.recipient.trim() : ''
    const phone = typeof a?.phone === 'string' ? a.phone.trim() : ''
    const province = typeof a?.province === 'string' ? a.province.trim() : ''
    const city = typeof a?.city === 'string' ? a.city.trim() : ''
    const district = typeof a?.district === 'string' ? a.district.trim() : ''
    const detail = typeof a?.detail === 'string' ? a.detail.trim() : ''
    if (!recipient || !phone || !province || !city || !district || !detail) {
      return NextResponse.json({ error: '收货地址信息不完整' }, { status: 400 })
    }
    addr = {
      recipient,
      phone,
      country: typeof a?.country === 'string' && a.country.trim() ? a.country.trim() : '中国',
      province,
      city,
      district,
      detail,
      postalCode: typeof a?.postalCode === 'string' && a.postalCode.trim() ? a.postalCode.trim() : null,
    }
  }

  const amount = toMoneyDecimal(price)
  const outTradeNo = genOutTradeNo()

  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        status: 'to_pay',
        totalAmount: amount,
        payAmount: amount,
        freightAmount: toMoneyDecimal(0),
        remark: remark || null,
        recipient: addr!.recipient,
        phone: addr!.phone,
        country: addr!.country,
        province: addr!.province,
        city: addr!.city,
        district: addr!.district,
        detail: addr!.detail,
        postalCode: addr!.postalCode,
        designSnapshot: draft ? draft : undefined,
        outTradeNo,
        payStatus: 'unpaid',
        payChannel: 'wechat',
      },
    })

    await tx.orderItem.create({
      data: {
        orderId: order.id,
        name: '能量定制手串',
        unitPrice: amount,
        quantity: 1,
        subtotal: amount,
        snapshot: draft?.design || draft || undefined,
      },
    })

    return order
  })

  return NextResponse.json({ order: created }, { status: 200 })
}

