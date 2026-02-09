function requiredEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`缺少环境变量：${name}`)
  return v
}

export type ShopifyCustomer = {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
}

function getShopifyConfig() {
  const storeDomain = requiredEnv('SHOPIFY_STORE_DOMAIN')
  const adminToken = requiredEnv('SHOPIFY_ADMIN_ACCESS_TOKEN')
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01'
  return { storeDomain, adminToken, apiVersion }
}

export async function findShopifyCustomerByEmail(email: string) {
  const { storeDomain, adminToken, apiVersion } = getShopifyConfig()
  const url = `https://${storeDomain}/admin/api/${apiVersion}/customers/search.json?query=${encodeURIComponent(
    `email:${email}`
  )}`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': adminToken,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shopify 查询 customer 失败：${res.status} ${text}`)
  }

  const data = (await res.json()) as { customers: ShopifyCustomer[] }
  return data.customers?.[0] || null
}

export async function createShopifyCustomer(params: {
  email: string
  name?: string | null
}) {
  const { storeDomain, adminToken, apiVersion } = getShopifyConfig()

  const url = `https://${storeDomain}/admin/api/${apiVersion}/customers.json`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': adminToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: {
        email: params.email,
        first_name: params.name || undefined,
        verified_email: true,
        send_email_welcome: false,
      },
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shopify 创建 customer 失败：${res.status} ${text}`)
  }

  const data = (await res.json()) as { customer: ShopifyCustomer }
  return data.customer
}

export async function createOrGetShopifyCustomer(params: {
  email: string
  name?: string | null
}) {
  const existing = await findShopifyCustomerByEmail(params.email)
  if (existing) return existing
  return await createShopifyCustomer(params)
}

