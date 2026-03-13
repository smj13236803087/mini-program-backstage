import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const denied = assertAdmin(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() || ''
  const category = sp.get('category')?.trim() || '' // main/support/spacer/accessory

  const where: any = {}
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { title: { contains: q } },
      { productType: { contains: q } },
      { diameter: { contains: q } },
    ]
  }

  if (category) {
    // seed-products.js: images[0].meta.category
    where.images = {
      path: '$[0].meta.category',
      equals: category,
    }
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 500,
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

  return NextResponse.json({ products }, { status: 200 })
}

