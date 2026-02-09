import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/security'

export async function GET() {
  const token = cookies().get('session')?.value
  if (!token) {
    return NextResponse.json({ designs: [] }, { status: 200 })
  }

  const payload = verifySession(token)
  if (!payload) {
    return NextResponse.json({ designs: [] }, { status: 200 })
  }

  const designs = await prisma.braceletDesign.findMany({
    where: { userId: payload.sub },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      totalPrice: true,
      totalWeight: true,
      averageDiameter: true,
      wristSize: true,
      wearingStyle: true,
      items: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ designs }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const token = cookies().get('session')?.value
  if (!token) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const payload = verifySession(token)
  if (!payload) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as {
      id?: string
      name?: string
      items: unknown
      totalPrice: number
      totalWeight?: number | null
      averageDiameter?: number | null
      wristSize?: number | null
      wearingStyle?: 'single' | 'double' | null
    }

    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: '设计内容格式不正确' }, { status: 400 })
    }

    const name = (body.name || '').trim() || '未命名作品'

    const data = {
      userId: payload.sub,
      name,
      totalPrice: body.totalPrice,
      totalWeight: body.totalWeight ?? null,
      averageDiameter: body.averageDiameter ?? null,
      wristSize: body.wristSize ?? null,
      wearingStyle: body.wearingStyle ?? null,
      items: body.items as any,
    }

    let design
    if (body.id) {
      design = await prisma.braceletDesign.update({
        where: { id: body.id, userId: payload.sub },
        data,
      })
    } else {
      design = await prisma.braceletDesign.create({ data })
    }

    return NextResponse.json({ design }, { status: 200 })
  } catch (err) {
    console.error('保存设计失败：', err)
    return NextResponse.json(
      { error: '保存设计失败', detail: String(err) },
      { status: 500 }
    )
  }
}

