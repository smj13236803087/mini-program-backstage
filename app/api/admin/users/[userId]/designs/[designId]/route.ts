import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string; designId: string } }
) {
  const denied = assertAdmin(req)
  if (denied) return denied

  try {
    await prisma.braceletDesign.delete({
      where: { id: params.designId, userId: params.userId },
    })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    return NextResponse.json(
      { error: '删除失败', detail: String(e) },
      { status: 500 }
    )
  }
}

