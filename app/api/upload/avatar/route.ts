import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import COS from 'cos-nodejs-sdk-v5'
import { verifySession } from '@/lib/security'

const SecretId = process.env.COS_SECRET_ID
const SecretKey = process.env.COS_SECRET_KEY
const Bucket = process.env.COS_BUCKET
const Region = process.env.COS_REGION || 'ap-guangzhou'

/**
 * 生成 COS 对象公网访问 URL。
 * 需在腾讯云控制台将存储桶或路径前缀 avatars/ 设为公有读，否则前端无法直接展示图片。
 */
function getCosObjectUrl(key: string): string {
  if (!Bucket || !Region) return ''
  return `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`
}

/**
 * 上传头像：接收 multipart/form-data 中的 file 字段，上传到腾讯云 COS，返回可访问的图片 URL
 */
export async function POST(req: NextRequest) {
  let token = req.headers.get('x-equilune-token') || null
  if (!token) {
    token = req.headers.get('authorization')?.replace('Bearer ', '') || null
  }
  if (!token) {
    token = (await cookies()).get('session')?.value || null
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

  if (!SecretId || !SecretKey || !Bucket) {
    console.error('COS 未配置: COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET')
    return NextResponse.json({
      errno: 500,
      errmsg: '服务未配置存储',
      data: null,
    }, { status: 200 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ errno: 400, errmsg: '请选择图片', data: null }, { status: 200 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json({ errno: 400, errmsg: '图片不能超过 2MB', data: null }, { status: 200 })
    }

    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const key = `avatars/${userId}_${Date.now()}.${ext}`

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
        (err, _data) => {
          if (err) reject(new Error(err.message || String(err)))
          else resolve()
        }
      )
    })

    const avatarUrl = getCosObjectUrl(key)

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
