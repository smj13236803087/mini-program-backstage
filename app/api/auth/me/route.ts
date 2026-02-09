import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/security'

export async function GET() {
  const token = cookies().get('session')?.value
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const payload = (() => {
    try {
      return verifySession(token)
    } catch {
      return null
    }
  })()

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, shopifyCustomerId: true },
  })

  return NextResponse.json({ user }, { status: 200 })
}

