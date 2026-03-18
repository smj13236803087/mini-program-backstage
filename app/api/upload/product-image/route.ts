import { NextRequest, NextResponse } from 'next/server'
import COS from 'cos-nodejs-sdk-v5'
import { assertAdmin, getAdminToken } from '@/lib/admin-auth'

const SecretId = process.env.COS_SECRET_ID
const SecretKey = process.env.COS_SECRET_KEY
const Bucket = process.env.COS_BUCKET
const Region = process.env.COS_REGION || 'ap-guangzhou'

function getCosObjectUrl(key: string): string {
  if (!Bucket || !Region) return ''
  return `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`
}

/**
 * 上传商品图片：接收 multipart/form-data 中的 file 字段，上传到腾讯云 COS，返回可访问的图片 URL
 * - 复用头像上传的 COS 上传方式
 * - 权限：管理端 token（x-admin-token / admin_token）
 */
export async function POST(req: NextRequest) {
  const denied = assertAdmin(req)
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

    const adminToken = getAdminToken(req) || 'admin'
    const key = `products/${adminToken}_${Date.now()}.${ext}`

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
    console.error('商品图片上传失败:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '上传失败' },
      { status: 500 }
    )
  }
}

