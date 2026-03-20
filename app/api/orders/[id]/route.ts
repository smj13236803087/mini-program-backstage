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

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id } = await ctx.params

  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  // 富化：把 Product.imageUrl 注入 order.designSnapshot / order.items[*].snapshot 里的 bead.imageUrl
  const snapshots: any[] = []
  if ((order as any)?.designSnapshot) snapshots.push((order as any).designSnapshot)
  const firstItem = (order.items || [])[0] as any
  if (firstItem?.snapshot) snapshots.push(firstItem.snapshot)

  const productIds = new Set<string>()
  const collectFromDesignLike = (x: any) => {
    if (!x) return
    const design = x?.design || x
    const beadItems = design?.items || design?.beads
    if (!Array.isArray(beadItems)) return
    for (const it of beadItems as any[]) {
      const pid = it?.productId
      if (pid) productIds.add(String(pid))
    }
  }
  for (const s of snapshots) collectFromDesignLike(s)

  if (productIds.size > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(productIds) } },
      select: { id: true, imageUrl: true },
    })
    const imageMap = new Map(products.map((p) => [p.id, p.imageUrl] as const))

    const injectIntoDesignLike = (x: any) => {
      if (!x) return
      const design = x?.design || x
      const beadItems = design?.items || design?.beads
      if (!Array.isArray(beadItems)) return

      const nextItems = (beadItems as any[]).map((it) => {
        const pid = it?.productId ? String(it.productId) : ''
        if (!pid) return it
        if (it?.imageUrl) return it
        const resolved = imageMap.get(pid)
        return resolved ? { ...it, imageUrl: resolved } : it
      })

      if (Array.isArray(design?.items)) design.items = nextItems
      if (Array.isArray(design?.beads)) design.beads = nextItems
    }

    for (const s of snapshots) injectIntoDesignLike(s)
  }

  return NextResponse.json({ order }, { status: 200 })
}

