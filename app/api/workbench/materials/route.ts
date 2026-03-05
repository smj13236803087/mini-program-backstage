import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type BeadMaterial = {
  id: string
  name: string
  category: 'main' | 'support' | 'spacer' | 'accessory' | string
  energy: Record<string, number>
  energyTag: { emoji: string; label: string }
  price: number
  size: string
  color: string
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
    })

    const materials: BeadMaterial[] = products
      .map((p) => {
        const images = (p.images as any) || null
        const first = Array.isArray(images) ? images[0] : null
        const meta = first?.meta || {}

        const category = typeof meta.category === 'string' ? meta.category : ''
        const size = (typeof meta.size === 'string' ? meta.size : p.diameter) || ''
        const color = typeof meta.color === 'string' ? meta.color : '#9ca3af'
        const energy = (meta.energy && typeof meta.energy === 'object' ? meta.energy : {}) as Record<
          string,
          number
        >
        const energyTag = (meta.energyTag && typeof meta.energyTag === 'object'
          ? meta.energyTag
          : { emoji: '✨', label: '能量' }) as { emoji: string; label: string }

        // 仅用于工作台：必须有 category + 尺寸 + 颜色等 meta，否则容易破坏展示效果
        if (!category) return null

        return {
          id: p.productType, // 种子脚本写入的稳定键（bead.id）
          name: p.title,
          category,
          energy,
          energyTag,
          price: Number(p.price),
          size,
          color,
        }
      })
      .filter(Boolean) as BeadMaterial[]

    return NextResponse.json({ errno: 0, errmsg: '', data: { materials } }, { status: 200 })
  } catch (error) {
    console.error('工作台商品拉取失败：', error)
    return NextResponse.json(
      { errno: 500, errmsg: '工作台商品拉取失败', data: null, detail: String(error) },
      { status: 500 }
    )
  }
}

