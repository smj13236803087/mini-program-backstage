import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/security'

function getTokenFromReq(req: NextRequest): string | null {
  const h = req.headers.get('x-equilune-token')
  if (h) return h
  const auth = req.headers.get('authorization')
  if (auth) return auth.replace('Bearer ', '')
  return cookies().get('session')?.value || null
}

function getUserIdFromReq(req: NextRequest): string | null {
  const token = getTokenFromReq(req)
  if (!token) return null
  const payload = (() => {
    try {
      return verifySession(token)
    } catch {
      return null
    }
  })()
  if (!payload) return null
  return payload.user_id || payload.sub || null
}

export async function GET(req: NextRequest) {
  const userId = getUserIdFromReq(req)
  if (!userId) {
    return NextResponse.json({ designs: [] }, { status: 200 })
  }

  const designs = await prisma.braceletDesign.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
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
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const body = (await req.json()) as {
      id?: string
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

    const data = {
      userId,
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
        where: { id: body.id, userId },
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

