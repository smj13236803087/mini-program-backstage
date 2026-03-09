import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
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

// 获取用户的所有地址
export async function GET(req: NextRequest) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultAddressId: true },
  })

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  // 标记默认地址
  const addressesWithDefault = addresses.map((addr) => ({
    ...addr,
    isDefault: addr.id === user?.defaultAddressId,
  }))

  return NextResponse.json({ addresses: addressesWithDefault }, { status: 200 })
}

// 创建新地址
export async function POST(req: NextRequest) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const body = (await req.json()) as {
      recipient: string
      phone: string
      country?: string
      province: string
      city: string
      district: string
      detail: string
      postalCode?: string
      tag?: string
      isDefault?: boolean
    }

    // 验证必填字段
    if (!body.recipient?.trim()) {
      return NextResponse.json({ error: '收件人姓名不能为空' }, { status: 400 })
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: '手机号不能为空' }, { status: 400 })
    }
    if (!body.province?.trim() || !body.city?.trim() || !body.district?.trim()) {
      return NextResponse.json({ error: '省市区信息不完整' }, { status: 400 })
    }
    if (!body.detail?.trim()) {
      return NextResponse.json({ error: '详细地址不能为空' }, { status: 400 })
    }

    // 创建地址
    const address = await prisma.address.create({
      data: {
        userId,
        recipient: body.recipient.trim(),
        phone: body.phone.trim(),
        country: body.country?.trim() || '中国',
        province: body.province.trim(),
        city: body.city.trim(),
        district: body.district.trim(),
        detail: body.detail.trim(),
        postalCode: body.postalCode?.trim() || null,
        tag: body.tag?.trim() || null,
      },
    })

    // 如果设置为默认地址，更新用户的默认地址
    if (body.isDefault) {
      await prisma.user.update({
        where: { id: userId },
        data: { defaultAddressId: address.id },
      })
    }

    return NextResponse.json(
      { address: { ...address, isDefault: body.isDefault || false } },
      { status: 200 }
    )
  } catch (err) {
    console.error('创建地址失败：', err)
    return NextResponse.json(
      { error: '创建地址失败', detail: String(err) },
      { status: 500 }
    )
  }
}
