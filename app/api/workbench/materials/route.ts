import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { productDisplayColor } from '@/lib/product-display'

/**
 * 工作台：材料/矿石列表
 * 给 miniapp 的 diy-workbench 使用：GET /api/workbench/materials
 */
// Next.js 生产环境可能会缓存 GET Route Handler 的结果；
// 这里显式禁用缓存，避免后台改了商品图片但小程序一直拿到旧数据，直到重新部署才刷新。
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const products = await (prisma as any).product.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        materialCode: true,
        price: true,
        diameter: true,
        atlas: {
          select: {
            title: true,
            majorCategory: true,
            imageUrl: true,
            colorSeries: true,
            coreEnergyTag: true,
            classicSixDimensions: true,
            mineVeinTrace: true,
            materialTrace: true,
            visualFeatures: true,
          },
        },
      },
    })

    const materials = (products as any[]).map((p: any) => {
      const atlas = (p as any).atlas || null
      const color = productDisplayColor(atlas || {})
      const size = (p.diameter || '').trim()

      // 小程序目前只用到 id/name/color/size（以及后续可能扩展 energy 标签）
      return {
        id: (p.materialCode && p.materialCode.trim()) || p.id,
        name: atlas?.title || '',
        // 左侧 tab：与后台商品列表一致，使用关联图鉴的大分类
        category: (atlas?.majorCategory || '未分类').trim(),
        energy: {},
        energyTag: { emoji: '✨', label: '' },
        price: Number(p.price || 0),
        size,
        color,
        colorSeries: atlas?.colorSeries || '',
        imageUrl: atlas?.imageUrl || null,
        // 预留：前端可直接展示
        coreEnergyTag: atlas?.coreEnergyTag || null,
        classicSixDimensions: atlas?.classicSixDimensions || null,
        mineVeinTrace: atlas?.mineVeinTrace || null,
        materialTrace: atlas?.materialTrace || null,
        visualFeatures: atlas?.visualFeatures || null,
      }
    })

    return NextResponse.json(
      { errno: 0, errmsg: '', data: { materials } },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('workbench materials failed:', error)
    return NextResponse.json(
      { errno: 500, errmsg: 'workbench materials failed', data: null, detail: String(error) },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    )
  }
}

