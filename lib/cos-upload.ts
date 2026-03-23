import COS from 'cos-nodejs-sdk-v5'

const SecretId = process.env.COS_SECRET_ID
const SecretKey = process.env.COS_SECRET_KEY
const Bucket = process.env.COS_BUCKET
const Region = process.env.COS_REGION || 'ap-guangzhou'

export function assertCosConfigured(): void {
  if (!SecretId || !SecretKey || !Bucket) {
    throw new Error('COS 未配置: 需要 COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET')
  }
}

export function getCosObjectUrl(key: string): string {
  if (!Bucket || !Region) return ''
  return `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`
}

export async function uploadBufferToCos(params: {
  buffer: Buffer
  key: string
  contentType: string
}): Promise<string> {
  assertCosConfigured()
  const cos = new COS({ SecretId: SecretId!, SecretKey: SecretKey! })
  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: Bucket!,
        Region,
        Key: params.key,
        Body: params.buffer,
        ContentType: params.contentType,
      },
      (err) => {
        if (err) reject(new Error(err.message || String(err)))
        else resolve()
      }
    )
  })
  return getCosObjectUrl(params.key)
}
