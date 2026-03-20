import { NextRequest, NextResponse } from 'next/server'
import COS from 'cos-nodejs-sdk-v5'
import { assertAdmin } from '@/lib/admin-auth'
import { getUserIdFromToken } from '@/lib/security'

const SecretId = process.env.COS_SECRET_ID
const SecretKey = process.env.COS_SECRET_KEY
const Bucket = process.env.COS_BUCKET
const Region = process.env.COS_REGION || 'ap-guangzhou'

function getCosObjectUrl(key: string): string {
  if (!Bucket || !Region) return ''
  return `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`
}

/**
 * 实物检视实拍图上传：接收 multipart/form-data 中的 file 字段，上传到腾讯云 COS，返回可访问图片 URL
 *
 * 权限：后台管理员登录态（session cookie）+ 管理员角色
 */
export async function POST(req: NextRequest) {
  const denied = await assertAdmin(req)
  if (denied) return denied

  if (!SecretId || !SecretKey || !Bucket) {
    console.error('COS 未配置: COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET')
    return NextResponse.json({ error: '服务未配置存储' }, { status: 500 })
  }

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
    const key = `order-inspect/${userId}_${Date.now()}.${ext}`

    const cos = new COS({ SecretId, SecretKey })

    await new Promise<void>((resolve, reject) => {
      cos.putObject(
        {
          Bucket,
          Region: Region!,
          Key: key,
          Body: buffer,
          ContentType: `image/${ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext}`,
        },
        (err) => {
          if (err) reject(new Error(err.message || String(err)))
          else resolve()
        }
      )
    })

    const url = getCosObjectUrl(key)
    return NextResponse.json({ url }, { status: 200 })
  } catch (e) {
    console.error('实物检视图片上传失败:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '上传失败' },
      { status: 500 }
    )
  }
}

