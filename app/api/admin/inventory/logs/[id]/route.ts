import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params

  const exists = await prisma.inventoryLog.findUnique({ where: { id } })
  if (!exists) {
    return NextResponse.json({ error: '库存流水不存在' }, { status: 404 })
  }

  await prisma.inventoryLog.delete({ where: { id } })

  return NextResponse.json({ ok: true }, { status: 200 })
}

