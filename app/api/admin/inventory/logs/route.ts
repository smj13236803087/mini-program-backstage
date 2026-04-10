import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = v ? Number.parseInt(v, 10) : def
  if (Number.isNaN(n)) return def
  return Math.max(min, Math.min(max, n))
}

export async function GET(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const page = clampInt(sp.get('page'), 1, 1, 100000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 100)
  const q = sp.get('q')?.trim() || ''
  const field = sp.get('field')?.trim() || ''

  const where: any = {}
  if (q) {
    if (!field || field === 'all') {
      where.OR = [
        { product: { atlas: { is: { title: { contains: q } } } } },
        { type: { contains: q.toUpperCase() } },
      ]
    } else if (field === 'productTitle') {
      where.product = { atlas: { is: { title: { contains: q } } } }
    } else if (field === 'type') {
      where.type = q.toUpperCase()
    }
  }

  const [total, logs] = await Promise.all([
    prisma.inventoryLog.count({ where }),
    prisma.inventoryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: {
          select: {
            id: true,
            atlas: { select: { title: true } },
          },
        },
      },
    }),
  ])

  const rows = logs.map((log) => ({
    id: log.id,
    productId: log.product?.id ?? log.productId,
    productTitle: (log.product as any)?.atlas?.title ?? '',
    type: log.type,
    quantity: log.quantity,
    beforeQty: log.beforeQty,
    afterQty: log.afterQty,
    remark: log.remark ?? null,
    createdAt: log.createdAt.toISOString(),
  }))

  return NextResponse.json({ page, pageSize, total, logs: rows }, { status: 200 })
}


