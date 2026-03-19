import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromToken } from '@/lib/security'

function getSessionToken(req: NextRequest): string | null {
  let token = req.headers.get('x-equilune-token') || null
  if (!token) {
    const authHeader = req.headers.get('authorization')
    token = authHeader?.replace('Bearer ', '') || null
  }
  if (!token) token = req.cookies.get('session')?.value || null
  return token
}

export async function assertAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = getSessionToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = getUserIdFromToken(token)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

