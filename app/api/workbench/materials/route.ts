import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { productDisplayColor } from '@/lib/product-display'

/**
 * 工作台：材料/矿石列表
 * 给 miniapp 的 diy-workbench 使用：GET /api/workbench/materials
 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        materialCode: true,
        title: true,
        imageUrl: true,
        price: true,
        diameter: true,
        majorCategory: true,
        colorSeries: true,
        energyScience: true,
      },
    })

    const materials = products.map((p) => {
      const color = productDisplayColor(p)
      const size = (p.diameter || '').trim()

      // 小程序目前只用到 id/name/color/size（以及后续可能扩展 energy 标签）
      return {
        id: (p.materialCode && p.materialCode.trim()) || p.id,
        name: p.title,
        // 左侧 tab：直接展示商品表 majorCategory 原文（去重后由前端渲染）
        category: (p.majorCategory || '未分类').trim(),
        energy: {},
        energyTag: { emoji: '✨', label: '' },
        price: Number(p.price || 0),
        size,
        color,
        imageUrl: p.imageUrl || null,
        // 预留：前端可直接展示
        energyScience: p.energyScience || null,
      }
    })

    return NextResponse.json({ errno: 0, errmsg: '', data: { materials } }, { status: 200 })
  } catch (error) {
    console.error('workbench materials failed:', error)
    return NextResponse.json(
      { errno: 500, errmsg: 'workbench materials failed', data: null, detail: String(error) },
      { status: 500 }
    )
  }
}

