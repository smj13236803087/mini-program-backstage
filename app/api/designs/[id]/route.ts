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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromReq(req)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const design = await prisma.braceletDesign.findFirst({
    where: { id: params.id, userId },
  })

  if (!design) {
    return NextResponse.json({ error: '作品不存在' }, { status: 404 })
  }

  // 富化：把 Product.imageUrl 按 design.items[*].productId 注入 design.items[*].imageUrl
  const items = (design as any)?.items
  if (Array.isArray(items) && items.length > 0) {
    const productIds = new Set<string>()
    for (const it of items as any[]) {
      const pid = it?.productId
      if (pid) productIds.add(String(pid))
    }

    if (productIds.size > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: Array.from(productIds) } },
        select: { id: true, atlas: { select: { imageUrl: true } } },
      })
      const imageMap = new Map(products.map((p) => [p.id, (p as any)?.atlas?.imageUrl || null] as const))

      ;(design as any).items = (items as any[]).map((it) => {
        const pid = it?.productId ? String(it.productId) : ''
        if (!pid) return it
        if (it?.imageUrl) return it
        const resolved = imageMap.get(pid)
        return { ...it, imageUrl: resolved }
      })
    }
  }

  return NextResponse.json({ design }, { status: 200 })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromReq(req)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as {
      items?: unknown
      totalPrice?: number
      totalWeight?: number | null
      averageDiameter?: number | null
      wristSize?: number | null
      wearingStyle?: 'single' | 'double' | null
    }

    const data: any = {}
    if (body.items !== undefined) {
      if (!Array.isArray(body.items)) {
        return NextResponse.json({ error: '设计内容格式不正确' }, { status: 400 })
      }
      data.items = body.items as any
    }
    if (body.totalPrice !== undefined) data.totalPrice = body.totalPrice
    if (body.totalWeight !== undefined) data.totalWeight = body.totalWeight
    if (body.averageDiameter !== undefined)
      data.averageDiameter = body.averageDiameter
    if (body.wristSize !== undefined) data.wristSize = body.wristSize
    if (body.wearingStyle !== undefined) data.wearingStyle = body.wearingStyle

    const design = await prisma.braceletDesign.update({
      where: { id: params.id, userId },
      data,
    })

    return NextResponse.json({ design }, { status: 200 })
  } catch (err) {
    console.error('更新设计失败：', err)
    return NextResponse.json(
      { error: '更新设计失败', detail: String(err) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromReq(req)
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    await prisma.plazaPost.deleteMany({
      where: { braceletDesignId: params.id, userId },
    })
    await prisma.braceletDesign.delete({
      where: { id: params.id, userId },
    })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('删除设计失败：', err)
    return NextResponse.json(
      { error: '删除设计失败', detail: String(err) },
      { status: 500 }
    )
  }
}

