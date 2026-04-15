import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { assertAdmin } from '@/lib/admin-auth'

function parse01(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s0 = String(v).trim()
  if (!s0) return null
  const n = Number(s0)
  if (Number.isNaN(n)) return null
  const clamped = Math.max(0, Math.min(1, n))
  return clamped.toFixed(4)
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ atlasId: string }> }) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { atlasId } = await ctx.params
  const id = String(atlasId || '').trim()
  if (!id) return NextResponse.json({ error: 'atlasId 不能为空' }, { status: 400 })

  const body = (await req.json().catch(() => null)) as
    | {
        love?: number | string | null
        wealth?: number | string | null
        career?: number | string | null
        focus?: number | string | null
        emotion?: number | string | null
        protection?: number | string | null
      }
    | null

  if (!body) return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })

  const exists = await prisma.atlasSixDimension.findUnique({ where: { atlasId: id }, select: { atlasId: true } })
  if (!exists) return NextResponse.json({ error: '六维记录不存在' }, { status: 404 })

  const updated = await prisma.atlasSixDimension.update({
    where: { atlasId: id },
    data: {
      ...(body.love !== undefined ? { love: parse01(body.love) } : {}),
      ...(body.wealth !== undefined ? { wealth: parse01(body.wealth) } : {}),
      ...(body.career !== undefined ? { career: parse01(body.career) } : {}),
      ...(body.focus !== undefined ? { focus: parse01(body.focus) } : {}),
      ...(body.emotion !== undefined ? { emotion: parse01(body.emotion) } : {}),
      ...(body.protection !== undefined ? { protection: parse01(body.protection) } : {}),
    },
    select: {
      atlasId: true,
      love: true,
      wealth: true,
      career: true,
      focus: true,
      emotion: true,
      protection: true,
      updatedAt: true,
      atlas: { select: { title: true, majorCategory: true } },
    },
  })

  return NextResponse.json(
    {
      item: {
        atlasId: updated.atlasId,
        title: updated.atlas?.title ?? '',
        majorCategory: updated.atlas?.majorCategory ?? null,
        love: updated.love,
        wealth: updated.wealth,
        career: updated.career,
        focus: updated.focus,
        emotion: updated.emotion,
        protection: updated.protection,
        updatedAt: updated.updatedAt,
      },
    },
    { status: 200 }
  )
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ atlasId: string }> }) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  const { atlasId } = await ctx.params
  const id = String(atlasId || '').trim()
  if (!id) return NextResponse.json({ error: 'atlasId 不能为空' }, { status: 400 })

  const exists = await prisma.atlasSixDimension.findUnique({ where: { atlasId: id }, select: { atlasId: true } })
  if (!exists) return NextResponse.json({ error: '六维记录不存在' }, { status: 404 })

  await prisma.atlasSixDimension.delete({ where: { atlasId: id } })
  return NextResponse.json({ ok: true }, { status: 200 })
}

