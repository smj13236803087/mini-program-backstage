import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

function parseOptionalNumber(v: unknown): number | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  const n = Number(v)
  if (Number.isNaN(n)) return undefined
  return n
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as
    | {
        userId?: string
        items?: unknown
        totalPrice?: number
        totalWeight?: number | null
        averageDiameter?: number | null
        wristSize?: number | null
        wearingStyle?: string | null
      }
    | null
  if (!body) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  const data: any = {}
  if (body.userId !== undefined) {
    const userId = String(body.userId || '').trim()
    if (!userId) return NextResponse.json({ error: 'userId 不能为空' }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    data.userId = userId
  }

  if (body.items !== undefined) {
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: 'items 必须是数组' }, { status: 400 })
    }
    data.items = body.items as any
  }

  if (body.totalPrice !== undefined) {
    const totalPrice = Number(body.totalPrice)
    if (Number.isNaN(totalPrice)) {
      return NextResponse.json({ error: 'totalPrice 必须是数字' }, { status: 400 })
    }
    data.totalPrice = totalPrice
  }

  const totalWeight = parseOptionalNumber(body.totalWeight)
  if (totalWeight !== undefined) data.totalWeight = totalWeight

  const averageDiameter = parseOptionalNumber(body.averageDiameter)
  if (averageDiameter !== undefined) data.averageDiameter = averageDiameter

  const wristSize = parseOptionalNumber(body.wristSize)
  if (wristSize !== undefined) data.wristSize = wristSize

  if (body.wearingStyle !== undefined) {
    const style = body.wearingStyle === null ? null : String(body.wearingStyle).trim()
    data.wearingStyle = style || null
  }

  try {
    const design = await prisma.braceletDesign.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json({ design }, { status: 200 })
  } catch (e) {
    return NextResponse.json(
      { error: '更新失败', detail: String(e) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  try {
    await prisma.plazaPost.deleteMany({
      where: { braceletDesignId: params.id },
    })
    await prisma.braceletDesign.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    return NextResponse.json(
      { error: '删除失败', detail: String(e) },
      { status: 500 }
    )
  }
}
