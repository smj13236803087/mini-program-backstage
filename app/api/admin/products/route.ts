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

const CATEGORY_HINTS: Record<string, string[]> = {
  main: ['main', '主'],
  support: ['support', '配珠', '配'],
  spacer: ['spacer', '隔'],
  accessory: ['accessory', '配饰', '配件', '饰'],
}

export async function GET(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
  const category = sp.get('category')?.trim() || ''
  const field = sp.get('field')?.trim() || ''
  const sort = sp.get('sort')?.trim() || ''
  const page = clampInt(sp.get('page'), 1, 1, 100000)
  const pageSize = clampInt(sp.get('pageSize'), 20, 1, 100)

  const andParts: object[] = []

  if (q) {
    const dayRange = parseDayRange(q)
    if (!field || field === 'all') {
      andParts.push({
        OR: [
          { id: { contains: q } },
          { title: { contains: q } },
          { materialCode: { contains: q } },
          { majorCategory: { contains: q } },
          { diameter: { contains: q } },
          ...(dayRange
            ? [
                { createdAt: { gte: dayRange.gte, lt: dayRange.lt } },
                { updatedAt: { gte: dayRange.gte, lt: dayRange.lt } },
              ]
            : []),
        ],
      })
    } else if (field === 'createdAt' || field === 'updatedAt') {
      if (!dayRange) {
        return NextResponse.json(
          { page, pageSize, total: 0, products: [] },
          { status: 200 }
        )
      }
      andParts.push({ [field]: { gte: dayRange.gte, lt: dayRange.lt } })
    } else if (
      field === 'id' ||
      field === 'title' ||
      field === 'materialCode' ||
      field === 'majorCategory' ||
      field === 'diameter'
    ) {
      andParts.push({ [field]: { contains: q } })
    } else {
      andParts.push({
        OR: [
          { id: { contains: q } },
          { title: { contains: q } },
          { materialCode: { contains: q } },
          { majorCategory: { contains: q } },
          { diameter: { contains: q } },
        ],
      })
    }
  }

  if (category) {
    const hints = CATEGORY_HINTS[category] || [category]
    andParts.push({
      OR: hints.map((h) => ({ majorCategory: { contains: h } })),
    })
  }

  const where = andParts.length ? { AND: andParts } : {}

  const orderBy = (() => {
    const [k, o] = sort.split(':')
    const order = o === 'asc' ? 'asc' : o === 'desc' ? 'desc' : null
    if (!order) return { updatedAt: 'desc' as const }
    if (k === 'createdAt' || k === 'updatedAt') return { [k]: order } as any
    if (k === 'title' || k === 'materialCode' || k === 'stock' || k === 'majorCategory') {
      return { [k]: order } as any
    }
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
        materialCode: true,
        title: true,
        price: true,
        diameter: true,
        weight: true,
        stock: true,
        imageUrl: true,
        majorCategory: true,
        productGender: true,
        colorSeries: true,
        texture: true,
        energyScience: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  return NextResponse.json({ page, pageSize, total, products }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as
    | {
        title?: string
        materialCode?: string | null
        price?: number | string
        stock?: number | string
        imageUrl?: string | null
        majorCategory?: string | null
        productGender?: string | null
        colorSeries?: string | null
        texture?: string | null
        energyScience?: string | null
        diameter?: string | null
        weight?: string | null
      }
    | null

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const title = (body.title || '').trim()
  if (!title) return NextResponse.json({ error: 'title 不能为空' }, { status: 400 })

  const priceNum = typeof body.price === 'string' ? Number(body.price) : body.price
  if (typeof priceNum !== 'number' || Number.isNaN(priceNum) || priceNum < 0) {
    return NextResponse.json({ error: 'price 不合法' }, { status: 400 })
  }

  const stockNum =
    body.stock === undefined ? 0 : typeof body.stock === 'string' ? Number(body.stock) : body.stock
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    return NextResponse.json({ error: 'stock 不合法' }, { status: 400 })
  }

  const materialCode =
    body.materialCode === undefined || body.materialCode === null
      ? null
      : String(body.materialCode).trim() || null

  const created = await prisma.product.create({
    data: {
      title,
      materialCode,
      price: String(priceNum.toFixed(2)),
      stock: stockNum,
      imageUrl: body.imageUrl || null,
      majorCategory: body.majorCategory?.trim() || null,
      productGender: body.productGender?.trim() || null,
      colorSeries: body.colorSeries?.trim() || null,
      texture: body.texture?.trim() || null,
      energyScience: body.energyScience?.trim() || null,
      diameter: body.diameter ?? null,
      weight: body.weight ?? null,
    },
    select: {
      id: true,
      materialCode: true,
      title: true,
      price: true,
      diameter: true,
      weight: true,
      stock: true,
      imageUrl: true,
      majorCategory: true,
      productGender: true,
      colorSeries: true,
      texture: true,
      energyScience: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ product: created }, { status: 200 })
}
