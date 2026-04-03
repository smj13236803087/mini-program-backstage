import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'
import { buildDefaultPlazaSnapshot, enrichPlazaSnapshotSnapshot } from '@/lib/plaza-snapshot'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const post = await prisma.plazaPost.findUnique({
    where: { id },
    select: {
      id: true,
      braceletDesignId: true,
      userId: true,
      adoptCount: true,
      createdAt: true,
      updatedAt: true,
      snapshot: true,
      recipeName: true,
      recipePhilosophy: true,
      recipeTags: true,
      user: {
        select: {
          id: true,
          nickname: true,
          phone: true,
          email: true,
        },
      },
    },
  })

  if (!post) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 })
  }

  return NextResponse.json({ post }, { status: 200 })
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const exists = await prisma.plazaPost.findUnique({
    where: { id },
    select: { id: true, braceletDesignId: true },
  })
  if (!exists) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 })
  }

  const body = (await req.json().catch(() => null)) as null | {
    userId?: unknown
    braceletDesignId?: unknown
    snapshot?: unknown
    adoptCount?: unknown
    resyncFromDesign?: unknown
  }

  if (!body) {
    return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
  }

  const data: any = {}

  if (body.resyncFromDesign === true) {
    const design = await prisma.braceletDesign.findUnique({
      where: { id: exists.braceletDesignId },
    })
    if (!design) {
      return NextResponse.json({ error: '关联作品不存在，无法同步' }, { status: 400 })
    }
    data.userId = design.userId
    data.snapshot = await buildDefaultPlazaSnapshot(design)
    data.recipeName = null
    data.recipePhilosophy = null
    data.recipeTags = null
  } else {
    const wantsResync = body.resyncFromDesign === true
    const wantsSnapshot = body.snapshot !== undefined && body.snapshot !== null

    // 先处理 braceletDesignId：如果你换了作品，我们默认自动生成新的 snapshot（除非你显式传了 snapshot）
    if (body.braceletDesignId !== undefined) {
      const bid = typeof body.braceletDesignId === 'string' ? body.braceletDesignId.trim() : ''
      if (!bid) {
        return NextResponse.json({ error: 'braceletDesignId 不能为空' }, { status: 400 })
      }

      if (bid !== exists.braceletDesignId) {
        const clash = await prisma.plazaPost.findUnique({
          where: { braceletDesignId: bid },
          select: { id: true },
        })
        if (clash && clash.id !== id) {
          return NextResponse.json({ error: '该作品 ID 已被其他广场条目占用' }, { status: 400 })
        }

        const design = await prisma.braceletDesign.findUnique({ where: { id: bid } })
        if (!design) {
          return NextResponse.json({ error: '作品不存在' }, { status: 400 })
        }

        data.braceletDesignId = bid
        // 作品归属就是发布者；因此作品切换时 userId 同步改掉
        data.userId = design.userId

        if (!wantsSnapshot && !wantsResync) {
          data.snapshot = await buildDefaultPlazaSnapshot(design)
          data.recipeName = null
          data.recipePhilosophy = null
          data.recipeTags = null
        }
      }
    }

    // 若没换作品，仅允许改发布者（userId）
    if (body.userId !== undefined && data.userId === undefined) {
      const uid = typeof body.userId === 'string' ? body.userId.trim() : ''
      if (!uid) {
        return NextResponse.json({ error: 'userId 不能为空' }, { status: 400 })
      }
      const user = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } })
      if (!user) {
        return NextResponse.json({ error: '用户不存在' }, { status: 400 })
      }
      data.userId = uid
    }

    // 显式 snapshot 则以你传入的为准（并富化珠子图片）
    if (body.snapshot !== undefined) {
      if (body.snapshot === null || typeof body.snapshot !== 'object' || Array.isArray(body.snapshot)) {
        return NextResponse.json({ error: 'snapshot 须为 JSON 对象' }, { status: 400 })
      }
      data.snapshot = await enrichPlazaSnapshotSnapshot(body.snapshot as Record<string, unknown>)
    }

    if (body.adoptCount !== undefined) {
      const n =
        typeof body.adoptCount === 'string' ? Number.parseInt(body.adoptCount, 10) : body.adoptCount
      if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
        return NextResponse.json({ error: 'adoptCount 须为非负整数' }, { status: 400 })
      }
      data.adoptCount = n
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
  }

  const updated = await prisma.plazaPost.update({
    where: { id },
    data,
    select: {
      id: true,
      braceletDesignId: true,
      userId: true,
      adoptCount: true,
      createdAt: true,
      updatedAt: true,
      snapshot: true,
    },
  })

  return NextResponse.json({ post: updated }, { status: 200 })
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { id } = await ctx.params
  const row = await prisma.plazaPost.findUnique({ where: { id }, select: { id: true } })
  if (!row) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 })
  }

  await prisma.plazaPost.delete({ where: { id } })
  return NextResponse.json({ ok: true }, { status: 200 })
}
