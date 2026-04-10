import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const body = (await req.json().catch(() => null)) as
    | {
        quantity?: number
        remark?: string | null
      }
    | null

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const existing = await prisma.inventory.findUnique({
    where: { id },
    include: { product: { select: { id: true, materialCode: true, atlas: { select: { title: true } } } } },
  })

  if (!existing) {
    return NextResponse.json({ error: '库存记录不存在' }, { status: 404 })
  }

  if (body.quantity === undefined) {
    return NextResponse.json({ error: 'quantity 不能为空' }, { status: 400 })
  }

  const qty = Number(body.quantity)
  if (!Number.isInteger(qty) || qty < 0) {
    return NextResponse.json({ error: 'quantity 不合法' }, { status: 400 })
  }

  const beforeQty = existing.quantity

  const updated = await prisma.inventory.update({
    where: { id },
    data: { quantity: qty },
  })

  await prisma.inventoryLog.create({
    data: {
      productId: existing.productId,
      type: 'ADJUST',
      quantity: qty - beforeQty,
      beforeQty,
      afterQty: qty,
      remark: body.remark?.trim() || '后台调整库存',
    },
  })

  return NextResponse.json(
    {
      inventory: {
        id: updated.id,
        productId: existing.product?.id ?? updated.productId,
        productTitle: (existing.product as any)?.atlas?.title ?? '',
        materialCode: existing.product?.materialCode ?? null,
        quantity: updated.quantity,
        updatedAt: updated.updatedAt.toISOString(),
      },
    },
    { status: 200 }
  )
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params

  const existing = await prisma.inventory.findUnique({
    where: { id },
  })

  if (!existing) {
    return NextResponse.json({ error: '库存记录不存在' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventory.delete({ where: { id } })
    await tx.inventoryLog.create({
      data: {
        productId: existing.productId,
        type: 'ADJUST',
        quantity: -existing.quantity,
        beforeQty: existing.quantity,
        afterQty: 0,
        remark: '后台删除库存记录',
      },
    })
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}

