import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/admin-auth'
import { getUserIdFromToken } from '@/lib/security'
import { uploadBufferToCos } from '@/lib/cos-upload'

/**
 * 上传商品图片：接收 multipart/form-data 中的 file 字段，上传到腾讯云 COS，返回可访问的图片 URL
 * - 复用 lib/cos-upload（与 Excel 导入脚本一致）
 * - 权限：后台登录态（session cookie）+ 管理员角色
 */
export async function POST(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: '请选择图片' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: '图片不能超过 4MB' }, { status: 400 })
    }

    const ext =
      (file.name?.split('.').pop() || 'jpg')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'jpg'

    const token =
      req.headers.get('x-equilune-token') ||
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('session')?.value ||
      ''
    const userId = (token && getUserIdFromToken(token)) || 'admin'
    const key = `products/${userId}_${Date.now()}.${ext}`

    const contentType = `image/${ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext}`
    const url = await uploadBufferToCos({ buffer, key, contentType })
    return NextResponse.json({ url }, { status: 200 })
  } catch (e) {
    console.error('商品图片上传失败:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '上传失败' },
      { status: 500 }
    )
  }
}
