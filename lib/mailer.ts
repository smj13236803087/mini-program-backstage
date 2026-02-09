import nodemailer from 'nodemailer';

function requiredEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`缺少环境变量：${name}`)
  return v
}

const transporter = nodemailer.createTransport({
  host: requiredEnv('SMTP_HOST'),
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports
    auth: {
    user: requiredEnv('SMTP_USER'),
    pass: requiredEnv('SMTP_PASS'),
    },
});

export async function sendEmail(params: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  const from = process.env.SMTP_FROM || requiredEnv('SMTP_USER')
  await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  })
}

export async function sendVerificationCodeEmail(params: {
  to: string
  code: string
  purpose: 'register' | 'password_reset'
}) {
  const purposeText =
    params.purpose === 'register' ? '注册' : '重置密码'

  const subject = `你的${purposeText}验证码：${params.code}`
  const text = `你的${purposeText}验证码是：${params.code}。验证码有效期 10 分钟。如非本人操作请忽略本邮件。`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; line-height:1.6">
      <h2 style="margin:0 0 12px 0;">${purposeText}验证码</h2>
      <p style="margin:0 0 8px 0;">你的${purposeText}验证码是：</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:10px 0 14px 0;">${params.code}</div>
      <p style="margin:0;color:#666;">有效期 10 分钟。如非本人操作请忽略。</p>
    </div>
  `

  await sendEmail({ to: params.to, subject, text, html })
}