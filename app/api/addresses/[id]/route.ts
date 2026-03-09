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

// 更新地址
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const body = (await req.json()) as {
      recipient?: string
      phone?: string
      country?: string
      province?: string
      city?: string
      district?: string
      detail?: string
      postalCode?: string
      tag?: string
      isDefault?: boolean
    }

    // 验证地址是否属于当前用户
    const existingAddress = await prisma.address.findFirst({
      where: { id: params.id, userId },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: '地址不存在或无权限' }, { status: 404 })
    }

    // 构建更新数据
    const updateData: any = {}
    if (body.recipient !== undefined) updateData.recipient = body.recipient.trim()
    if (body.phone !== undefined) updateData.phone = body.phone.trim()
    if (body.country !== undefined) updateData.country = body.country.trim()
    if (body.province !== undefined) updateData.province = body.province.trim()
    if (body.city !== undefined) updateData.city = body.city.trim()
    if (body.district !== undefined) updateData.district = body.district.trim()
    if (body.detail !== undefined) updateData.detail = body.detail.trim()
    if (body.postalCode !== undefined)
      updateData.postalCode = body.postalCode?.trim() || null
    if (body.tag !== undefined) updateData.tag = body.tag?.trim() || null

    // 更新地址
    const address = await prisma.address.update({
      where: { id: params.id },
      data: updateData,
    })

    // 如果设置为默认地址，更新用户的默认地址
    if (body.isDefault !== undefined) {
      if (body.isDefault) {
        await prisma.user.update({
          where: { id: userId },
          data: { defaultAddressId: address.id },
        })
      } else {
        // 如果取消默认，检查是否是当前默认地址
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { defaultAddressId: true },
        })
        if (user?.defaultAddressId === address.id) {
          await prisma.user.update({
            where: { id: userId },
            data: { defaultAddressId: null },
          })
        }
      }
    }

    // 获取更新后的默认地址状态
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultAddressId: true },
    })

    return NextResponse.json(
      { address: { ...address, isDefault: address.id === user?.defaultAddressId } },
      { status: 200 }
    )
  } catch (err) {
    console.error('更新地址失败：', err)
    return NextResponse.json(
      { error: '更新地址失败', detail: String(err) },
      { status: 500 }
    )
  }
}

// 删除地址
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    // 验证地址是否属于当前用户
    const existingAddress = await prisma.address.findFirst({
      where: { id: params.id, userId },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: '地址不存在或无权限' }, { status: 404 })
    }

    // 检查是否是默认地址，如果是，先清除用户的默认地址引用
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultAddressId: true },
    })

    if (user?.defaultAddressId === params.id) {
      await prisma.user.update({
        where: { id: userId },
        data: { defaultAddressId: null },
      })
    }

    // 删除地址
    await prisma.address.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '地址已删除' }, { status: 200 })
  } catch (err) {
    console.error('删除地址失败：', err)
    return NextResponse.json(
      { error: '删除地址失败', detail: String(err) },
      { status: 500 }
    )
  }
}
