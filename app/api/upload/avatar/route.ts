import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { verifySession } from '@/lib/security'

/**
 * 上传头像：接收 multipart/form-data 中的 file 字段
 * 返回可访问的图片 URL
 */
export async function POST(req: NextRequest) {
  let token = req.headers.get('x-equilune-token') || null
  if (!token) {
    token = req.headers.get('authorization')?.replace('Bearer ', '') || null
  }
  if (!token) {
    token = cookies().get('session')?.value || null
  }

  if (!token) {
    return NextResponse.json({ errno: 401, errmsg: '未登录', data: null }, { status: 200 })
  }

  const payload = (() => {
    try {
      return verifySession(token)
    } catch {
      return null
    }
  })()

  if (!payload) {
    return NextResponse.json({ errno: 401, errmsg: 'token 无效', data: null }, { status: 200 })
  }

  const userId = payload.user_id || payload.sub
  if (!userId) {
    return NextResponse.json({ errno: 401, errmsg: 'token 无效', data: null }, { status: 200 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ errno: 400, errmsg: '请选择图片', data: null }, { status: 200 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 简单校验：限制 2MB
    if (buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json({ errno: 400, errmsg: '图片不能超过 2MB', data: null }, { status: 200 })
    }

    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const filename = `${userId}_${Date.now()}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')

    await mkdir(uploadDir, { recursive: true })
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // 返回相对 URL，前端需拼接 baseUrl
    const avatarUrl = `/uploads/avatars/${filename}`

    return NextResponse.json({
      errno: 0,
      errmsg: '',
      data: { avatarUrl },
    }, { status: 200 })
  } catch (e) {
    console.error('头像上传失败:', e)
    return NextResponse.json({
      errno: 500,
      errmsg: e instanceof Error ? e.message : '上传失败',
      data: null,
    }, { status: 200 })
  }
}
