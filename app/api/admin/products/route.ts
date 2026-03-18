import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = v ? Number.parseInt(v, 10) : def
  if (Number.isNaN(n)) return def
  return Math.max(min, Math.min(max, n))
}

function parseDayRange(input: string): { gte: Date; lt: Date } | null {
  const s = input.trim()
  if (!s) return null
  const d = new Date(s.length <= 10 ? `${s}T00:00:00` : s)
  if (Number.isNaN(d.getTime())) return null
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { gte: start, lt: end }
}

export async function GET(req: NextRequest) {
  const denied = assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
  const category = sp.get('category')?.trim() || '' // main/support/spacer/accessory
  const field = sp.get('field')?.trim() || ''
  const sort = sp.get('sort')?.trim() || '' // e.g. updatedAt:desc
  const page = clampInt(sp.get('page'), 1, 1, 100000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 100)

  const where: any = {}
  if (q) {
    const dayRange = parseDayRange(q)
    if (!field || field === 'all') {
      where.OR = [
        { id: { contains: q } },
        { title: { contains: q } },
        { productType: { contains: q } },
        { diameter: { contains: q } },
        ...(dayRange
          ? [
              { createdAt: { gte: dayRange.gte, lt: dayRange.lt } },
              { updatedAt: { gte: dayRange.gte, lt: dayRange.lt } },
            ]
          : []),
      ]
    } else if (field === 'createdAt' || field === 'updatedAt') {
      if (!dayRange) {
        return NextResponse.json(
          { page, pageSize, total: 0, products: [] },
          { status: 200 }
        )
      }
      where[field] = { gte: dayRange.gte, lt: dayRange.lt }
    } else if (
      field === 'id' ||
      field === 'title' ||
      field === 'productType' ||
      field === 'diameter'
    ) {
      where[field] = { contains: q }
    } else {
      where.OR = [
        { id: { contains: q } },
        { title: { contains: q } },
        { productType: { contains: q } },
        { diameter: { contains: q } },
      ]
    }
  }

  if (category) {
    // seed-products.js: images[0].meta.category
    where.images = {
      path: '$[0].meta.category',
      equals: category,
    }
  }

  const orderBy = (() => {
    const [k, o] = sort.split(':')
    const order = o === 'asc' ? 'asc' : o === 'desc' ? 'desc' : null
    if (!order) return { updatedAt: 'desc' as const }
    if (k === 'createdAt' || k === 'updatedAt') return { [k]: order } as any
    if (k === 'title' || k === 'productType' || k === 'stock') return { [k]: order } as any
    return { updatedAt: 'desc' as const }
  })()

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        productType: true,
        price: true,
        diameter: true,
        weight: true,
        stock: true,
        imageUrl: true,
        images: true,
        energy_tags: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  return NextResponse.json({ page, pageSize, total, products }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const denied = assertAdmin(req)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as
    | {
        title?: string
        productType?: string
        price?: number | string
        stock?: number | string
        imageUrl?: string | null
        images?: any
        energy_tags?: any
        diameter?: string | null
        weight?: string | null
      }
    | null

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const title = (body.title || '').trim()
  const productType = (body.productType || '').trim()
  if (!title) return NextResponse.json({ error: 'title 不能为空' }, { status: 400 })
  if (!productType)
    return NextResponse.json({ error: 'productType 不能为空' }, { status: 400 })

  const priceNum = typeof body.price === 'string' ? Number(body.price) : body.price
  if (typeof priceNum !== 'number' || Number.isNaN(priceNum) || priceNum < 0) {
    return NextResponse.json({ error: 'price 不合法' }, { status: 400 })
  }

  const stockNum =
    body.stock === undefined ? 0 : typeof body.stock === 'string' ? Number(body.stock) : body.stock
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    return NextResponse.json({ error: 'stock 不合法' }, { status: 400 })
  }

  const created = await prisma.product.create({
    data: {
      title,
      productType,
      price: String(priceNum.toFixed(2)),
      stock: stockNum,
      imageUrl: body.imageUrl || null,
      images: body.images ?? null,
      energy_tags: body.energy_tags ?? null,
      diameter: body.diameter ?? null,
      weight: body.weight ?? null,
    },
    select: {
      id: true,
      title: true,
      productType: true,
      price: true,
      diameter: true,
      weight: true,
      stock: true,
      imageUrl: true,
      images: true,
      energy_tags: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ product: created }, { status: 200 })
}

