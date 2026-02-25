import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/security'

async function getUserIdFromSession() {
  const token = cookies().get('session')?.value
  if (!token) return null

  const payload = (() => {
    try {
      return verifySession(token)
    } catch {
      return null
    }
  })()

  if (!payload) return null
  return payload.sub
}

// 获取当前用户购物车及条目列表
export async function GET() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  // 即使没有购物车，也返回空结构，方便前端处理
  return NextResponse.json(
    {
      cart: cart || null,
      items: cart?.items || [],
    },
    { status: 200 }
  )
}

// 向购物车添加一个手串设计条目
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as {
      name?: string
      design: any
      totalPrice?: number
    }

    if (!body || !body.design || !Array.isArray(body.design.items)) {
      return NextResponse.json({ error: '设计数据不完整' }, { status: 400 })
    }

    const totalPrice =
      typeof body.totalPrice === 'number' && !Number.isNaN(body.totalPrice)
        ? body.totalPrice
        : 0

    // 找到或创建用户的购物车
    let cart = await prisma.cart.findFirst({
      where: { userId },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
        },
      })
    }

    const item = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        name: body.name || body.design?.designName || null,
        design: body.design,
        totalPrice,
      },
    })

    return NextResponse.json({ item }, { status: 200 })
  } catch (error) {
    console.error('添加购物车失败：', error)
    return NextResponse.json(
      { error: '添加购物车失败', detail: String(error) },
      { status: 500 }
    )
  }
}

// 删除购物车条目：支持批量删除和清空
export async function DELETE(req: NextRequest) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    let ids: string[] | undefined
    try {
      const body = (await req.json().catch(() => null)) as { ids?: string[] } | null
      if (body && Array.isArray(body.ids)) {
        ids = body.ids
      }
    } catch {
      ids = undefined
    }

    // 找到当前用户的购物车
    const carts = await prisma.cart.findMany({
      where: { userId },
      select: { id: true },
    })

    if (carts.length === 0) {
      return NextResponse.json({ deletedCount: 0 }, { status: 200 })
    }

    const cartIds = carts.map((c) => c.id)

    const where: any = { cartId: { in: cartIds } }
    if (ids && ids.length > 0) {
      where.id = { in: ids }
    }

    const result = await prisma.cartItem.deleteMany({
      where,
    })

    return NextResponse.json({ deletedCount: result.count }, { status: 200 })
  } catch (error) {
    console.error('删除购物车条目失败：', error)
    return NextResponse.json(
      { error: '删除购物车条目失败', detail: String(error) },
      { status: 500 }
    )
  }
}


