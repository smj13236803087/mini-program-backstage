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
  const denied = await assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
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
          { atlas: { is: { title: { contains: q } } } },
          { atlas: { is: { majorCategory: { contains: q } } } },
          { materialCode: { contains: q } },
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
      if (field === 'title') {
        andParts.push({ atlas: { is: { title: { contains: q } } } })
      } else if (field === 'majorCategory') {
        andParts.push({ atlas: { is: { majorCategory: { contains: q } } } })
      } else {
        andParts.push({ [field]: { contains: q } })
      }
    } else {
      andParts.push({
        OR: [
          { id: { contains: q } },
          { atlas: { is: { title: { contains: q } } } },
          { atlas: { is: { majorCategory: { contains: q } } } },
          { materialCode: { contains: q } },
          { diameter: { contains: q } },
        ],
      })
    }
  }

  const where = andParts.length ? { AND: andParts } : {}

  const orderBy = (() => {
    const [k, o] = sort.split(':')
    const order = o === 'asc' ? 'asc' : o === 'desc' ? 'desc' : null
    if (!order) return { updatedAt: 'desc' as const }
    if (k === 'createdAt' || k === 'updatedAt') return { [k]: order } as any
    if (k === 'title') return { atlas: { title: order } } as any
    if (k === 'materialCode') return { [k]: order } as any
    if (k === 'majorCategory') return { atlas: { majorCategory: order } } as any
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
        price: true,
        diameter: true,
        weight: true,
        inventory: { select: { quantity: true } },
        atlas: {
          select: {
            title: true,
            majorCategory: true,
            imageUrl: true,
            colorSeries: true,
            coreEnergyTag: true,
            mineVeinTrace: true,
            materialTrace: true,
            visualFeatures: true,
            classicSixDimensions: true,
            zodiac: true,
            fiveElements: true,
            constellation: true,
            chakra: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  const productsWithStock = (products as any[]).map((p) => ({
    ...p,
    title: p.atlas?.title ?? '',
    majorCategory: p.atlas?.majorCategory ?? null,
    imageUrl: p.atlas?.imageUrl ?? null,
    colorSeries: p.atlas?.colorSeries ?? null,
    coreEnergyTag: p.atlas?.coreEnergyTag ?? null,
    mineVeinTrace: p.atlas?.mineVeinTrace ?? null,
    materialTrace: p.atlas?.materialTrace ?? null,
    visualFeatures: p.atlas?.visualFeatures ?? null,
    classicSixDimensions: p.atlas?.classicSixDimensions ?? null,
    zodiac: p.atlas?.zodiac ?? null,
    fiveElements: p.atlas?.fiveElements ?? null,
    constellation: p.atlas?.constellation ?? null,
    chakra: p.atlas?.chakra ?? null,
    stock: p.inventory?.quantity ?? 0,
  }))

  return NextResponse.json({ page, pageSize, total, products: productsWithStock }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as
    | {
        atlasId?: string
        materialCode?: string | null
        price?: number | string
        stock?: number | string
        diameter?: string | null
        weight?: string | null
      }
    | null

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const atlasId = (body.atlasId || '').trim()
  if (!atlasId) return NextResponse.json({ error: '请选择图鉴（atlasId）' }, { status: 400 })

  const atlas = await prisma.productAtlas.findUnique({
    where: { id: atlasId },
    select: { id: true },
  })
  if (!atlas) return NextResponse.json({ error: '图鉴不存在' }, { status: 400 })

  const priceNum = typeof body.price === 'string' ? Number(body.price) : body.price
  if (typeof priceNum !== 'number' || Number.isNaN(priceNum) || priceNum < 0) {
    return NextResponse.json({ error: 'price 不合法' }, { status: 400 })
  }

  const stockNum =
    body.stock === undefined ? 0 : typeof body.stock === 'string' ? Number(body.stock) : body.stock
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    return NextResponse.json({ error: 'stock 不合法' }, { status: 400 })
  }

  const materialCode = String(body.materialCode ?? '').trim()
  if (!materialCode) {
    return NextResponse.json({ error: '物料编号不能为空' }, { status: 400 })
  }

  const diameter = String(body.diameter ?? '').trim()
  if (!diameter) {
    return NextResponse.json({ error: '直径不能为空' }, { status: 400 })
  }

  const created = await prisma.product.create({
    data: {
      materialCode,
      atlasId,
      price: String(priceNum.toFixed(2)),
      diameter,
      weight: body.weight ?? null,
      inventory: { create: { quantity: stockNum } },
    },
    include: { inventory: { select: { quantity: true } }, atlas: true },
  })

  return NextResponse.json(
    {
      product: {
        id: created.id,
        materialCode: created.materialCode,
        title: created.atlas?.title ?? '',
        price: created.price,
        diameter: created.diameter,
        weight: created.weight,
        imageUrl: created.atlas?.imageUrl ?? null,
        majorCategory: created.atlas?.majorCategory ?? null,
        colorSeries: created.atlas?.colorSeries ?? null,
        coreEnergyTag: created.atlas?.coreEnergyTag ?? null,
        mineVeinTrace: created.atlas?.mineVeinTrace ?? null,
        materialTrace: created.atlas?.materialTrace ?? null,
        visualFeatures: created.atlas?.visualFeatures ?? null,
        classicSixDimensions: created.atlas?.classicSixDimensions ?? null,
        zodiac: created.atlas?.zodiac ?? null,
        fiveElements: created.atlas?.fiveElements ?? null,
        constellation: created.atlas?.constellation ?? null,
        chakra: created.atlas?.chakra ?? null,
        updatedAt: created.updatedAt,
        stock: created.inventory?.quantity ?? 0,
      },
    },
    { status: 200 }
  )
}
