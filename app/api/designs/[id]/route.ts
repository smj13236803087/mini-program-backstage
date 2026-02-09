import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/security'

function getUserIdFromCookie() {
  const token = cookies().get('session')?.value
  if (!token) return null
  const payload = verifySession(token)
  return payload?.sub ?? null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const design = await prisma.braceletDesign.findFirst({
    where: { id: params.id, userId },
  })

  if (!design) {
    return NextResponse.json({ error: '作品不存在' }, { status: 404 })
  }

  return NextResponse.json({ design }, { status: 200 })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as {
      name?: string
      items?: unknown
      totalPrice?: number
      totalWeight?: number | null
      averageDiameter?: number | null
      wristSize?: number | null
      wearingStyle?: 'single' | 'double' | null
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name.trim() || '未命名作品'
    if (body.items !== undefined) {
      if (!Array.isArray(body.items)) {
        return NextResponse.json({ error: '设计内容格式不正确' }, { status: 400 })
      }
      data.items = body.items as any
    }
    if (body.totalPrice !== undefined) data.totalPrice = body.totalPrice
    if (body.totalWeight !== undefined) data.totalWeight = body.totalWeight
    if (body.averageDiameter !== undefined)
      data.averageDiameter = body.averageDiameter
    if (body.wristSize !== undefined) data.wristSize = body.wristSize
    if (body.wearingStyle !== undefined) data.wearingStyle = body.wearingStyle

    const design = await prisma.braceletDesign.update({
      where: { id: params.id, userId },
      data,
    })

    return NextResponse.json({ design }, { status: 200 })
  } catch (err) {
    console.error('更新设计失败：', err)
    return NextResponse.json(
      { error: '更新设计失败', detail: String(err) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromCookie()
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    await prisma.braceletDesign.delete({
      where: { id: params.id, userId },
    })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('删除设计失败：', err)
    return NextResponse.json(
      { error: '删除设计失败', detail: String(err) },
      { status: 500 }
    )
  }
}

