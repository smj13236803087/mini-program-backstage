import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ errno: 400, errmsg: '缺少 id', data: null }, { status: 200 })
  }

  const row = await prisma.plazaPost.findUnique({
    where: { id },
    select: {
      id: true,
      braceletDesignId: true,
      adoptCount: true,
      createdAt: true,
      updatedAt: true,
      snapshot: true,
      user: {
        select: {
          id: true,
          nickname: true,
          avatar: true,
        },
      },
    },
  })

  if (!row) {
    return NextResponse.json({ errno: 404, errmsg: '内容不存在', data: null }, { status: 200 })
  }

  return NextResponse.json(
    {
      errno: 0,
      errmsg: '',
      data: {
        post: {
          id: row.id,
          braceletDesignId: row.braceletDesignId,
          adoptCount: row.adoptCount,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          snapshot: row.snapshot,
          author: {
            id: row.user.id,
            nickname: row.user.nickname || '微信用户',
            avatar: row.user.avatar || '',
          },
        },
      },
    },
    { status: 200 }
  )
}
