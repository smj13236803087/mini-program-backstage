import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 从本地数据库的 Product 表拉取商品，并映射成小程序当前使用的“Shopify 风格”结构
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const mapped = products.map((p) => {
      const mainImage =
        p.imageUrl != null && p.imageUrl !== ''
          ? { src: p.imageUrl }
          : null

      let images: any[] = []
      if (p.images) {
        const val = p.images as any
        if (Array.isArray(val)) {
          images = val
        }
      }

      const options: any[] = []
      if (p.diameter) {
        options.push({
          name: 'diameter',
          values: [p.diameter],
        })
      }
      if (p.weight) {
        options.push({
          name: 'weight',
          values: [p.weight],
        })
      }

      return {
        id: p.id,
        title: p.title,
        product_type: p.productType, // 给 categorizeProducts 用
        image: mainImage,
        images,
        variants: [
          {
            price: p.price.toString(),
          },
        ],
        options,
      }
    })

    return NextResponse.json({ products: mapped }, { status: 200 })
  } catch (error) {
    console.error('从数据库拉取商品失败：', error)
    return NextResponse.json(
      { error: '拉取商品失败', detail: String(error) },
      { status: 500 }
    )
  }
}

