import crypto from 'crypto'

const PBKDF2_ITERATIONS = parseInt(process.env.PBKDF2_ITERATIONS || '210000', 10)
const PBKDF2_KEYLEN = 32

export function generate6DigitCode() {
  const n = crypto.randomInt(0, 1000000)
  return String(n).padStart(6, '0')
}

export function hashPassword(password: string) {
  if (password.length < 8) throw new Error('密码长度至少 8 位')
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256')
    .toString('hex')
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
  const iterations = parseInt(parts[1] || '', 10)
  const salt = parts[2]
  const hashHex = parts[3]
  if (!iterations || !salt || !hashHex) return false

  const derived = crypto
    .pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, 'sha256')
    .toString('hex')

  // timingSafeEqual 需要 Buffer 长度一致
  const a = Buffer.from(derived, 'hex')
  const b = Buffer.from(hashHex, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlDecodeToBuffer(s: string) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replaceAll('-', '+').replaceAll('_', '/') + pad
  return Buffer.from(b64, 'base64')
}

export type SessionPayload = {
  sub: string
  email: string
  user_id?: string
  iat: number
  exp: number
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('缺少环境变量：AUTH_SECRET')
  return secret
}

export function signSession(payload: SessionPayload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerPart = base64UrlEncode(Buffer.from(JSON.stringify(header)))
  const payloadPart = base64UrlEncode(Buffer.from(JSON.stringify(payload)))
  const toSign = `${headerPart}.${payloadPart}`
  const sig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(toSign)
    .digest()
  const sigPart = base64UrlEncode(sig)
  return `${toSign}.${sigPart}`
}

export function verifySession(token: string): SessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerPart, payloadPart, sigPart] = parts
  const toSign = `${headerPart}.${payloadPart}`
  const expected = crypto
    .createHmac('sha256', getAuthSecret())
    .update(toSign)
    .digest()
  const got = base64UrlDecodeToBuffer(sigPart)
  if (got.length !== expected.length) return null
  if (!crypto.timingSafeEqual(got, expected)) return null

  const payloadJson = base64UrlDecodeToBuffer(payloadPart).toString('utf8')
  const payload = JSON.parse(payloadJson) as SessionPayload
  // 支持 user_id 或 sub
  if ((!payload?.sub && !payload?.user_id) || !payload?.email || !payload?.exp) return null
  if (Date.now() / 1000 > payload.exp) return null
  return payload
}

/**
 * 从 token 获取 user_id
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = verifySession(token)
  if (!payload) return null
  return payload.user_id || payload.sub || null
}

export function isValidEmail(email: string) {
  // 简单校验
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

