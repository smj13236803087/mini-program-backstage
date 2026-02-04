// 简单脚本：从 Shopify Admin API 获取商品信息并打印到控制台
// 优先从环境变量读取配置（例如 .env.local），如果缺失，会在命令行里提示你输入：
// SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
// SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx（Admin API 访问令牌，可选，不填则运行时手动输入）
// SHOPIFY_API_VERSION=2024-01（或你在后台启用的版本）
//
// 运行方式（在项目根目录）：
// npx ts-node lib/shopify/fetchProduct.ts
// 或者：ts-node lib/shopify/fetchProduct.ts

import readline from 'readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01'

// 这里示例：获取第一个商品；如果你知道商品 ID，可以改成按 ID 查询
async function fetchFirstProduct(storeDomain: string, adminToken: string) {
  const url = `https://${storeDomain}/admin/api/${API_VERSION}/products.json?limit=1`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': adminToken,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[请求失败]', res.status, res.statusText, text)
    throw new Error('请求 Shopify Admin API 失败')
  }

  const data = await res.json()
  if (!data.products || data.products.length === 0) {
    console.log('没有找到任何商品，请确认你已经在 Shopify 后台创建了商品。')
    return
  }

  const product = data.products[0]
  console.log('成功获取到的商品信息：')
  console.log(JSON.stringify(product, null, 2))
}

async function main() {
  const rl = readline.createInterface({ input, output })

  let storeDomain = STORE_DOMAIN
  let adminToken = ADMIN_TOKEN

  if (!storeDomain) {
    storeDomain = await rl.question(
      '请输入 Shopify 店铺域名（例如 your-store.myshopify.com）：'
    )
  }

  if (!adminToken) {
    adminToken = await rl.question(
      '请输入 Shopify access token（例如以 shpat_ 开头）：'
    )
  }

  rl.close()

  if (!storeDomain || !adminToken) {
    console.error('[错误] 店铺域名或 access token 为空，无法请求 Shopify API')
    process.exit(1)
  }

  await fetchFirstProduct(storeDomain, adminToken)
}

// 直接执行
main().catch((err) => {
  console.error('执行脚本出错：', err)
  process.exit(1)
})

