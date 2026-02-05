import { BeadCategory, AccessoryCategory } from '@/types/bracelet'

// Shopify 商品类型映射到设计界面分类
export type ShopifyProductType =
  | 'obsidian'
  | 'amethyst'
  | 'moonshine'
  | 'cutoff'
  | 'double-pointed-crystal'
  | 'running-laps'
  | 'pendant'

// Shopify 商品数据结构
export interface ShopifyProduct {
  id: number
  title: string
  body_html: string
  vendor: string
  product_type: string
  handle: string
  status: string
  variants: Array<{
    id: number
    title: string
    price: string
    sku: string | null
  }>
  options?: Array<{
    id: number
    product_id: number
    name: string
    position: number
    values: string[]
  }>
  images: Array<{
    id: number
    src: string
    alt: string | null
  }>
  image: {
    id: number
    src: string
    alt: string | null
  } | null
}

// 商品类型映射表
const PRODUCT_TYPE_MAP: Record<
  ShopifyProductType,
  { category: BeadCategory | AccessoryCategory | 'pendant'; name: string }
> = {
  obsidian: { category: 'obsidian', name: '曜石' },
  amethyst: { category: 'amethyst', name: '紫水晶' },
  moonshine: { category: 'moonstone', name: '月光' },
  cutoff: { category: 'spacer', name: '隔断' },
  'double-pointed-crystal': { category: 'doubleTerminated', name: '双尖水晶' },
  'running-laps': { category: 'decoration', name: '跑环' },
  pendant: { category: 'pendant', name: '吊坠' },
}

// 占位图 URL（你可以替换成你自己的占位图）
const PLACEHOLDER_IMAGE = '/placeholder-product.svg'

/**
 * 获取商品图片 URL，如果为空则返回占位图
 */
export function getProductImage(product: ShopifyProduct): string {
  if (product.image?.src) {
    return product.image.src
  }
  if (product.images && product.images.length > 0) {
    return product.images[0].src
  }
  return PLACEHOLDER_IMAGE
}

/**
 * 将 Shopify 商品按 product_type 分类
 */
export function categorizeProducts(products: ShopifyProduct[]) {
  const categorized: Record<
    ShopifyProductType,
    {
      category: BeadCategory | AccessoryCategory | 'pendant'
      name: string
      products: ShopifyProduct[]
    }
  > = {
    obsidian: { category: 'obsidian', name: '曜石', products: [] },
    amethyst: { category: 'amethyst', name: '紫水晶', products: [] },
    moonshine: { category: 'moonstone', name: '月光', products: [] },
    cutoff: { category: 'spacer', name: '隔断', products: [] },
    'double-pointed-crystal': {
      category: 'doubleTerminated',
      name: '双尖水晶',
      products: [],
    },
    'running-laps': { category: 'decoration', name: '跑环', products: [] },
    pendant: { category: 'pendant', name: '吊坠', products: [] },
  }

  products.forEach((product) => {
    const productType = product.product_type.toLowerCase() as ShopifyProductType
    if (productType in categorized) {
      categorized[productType].products.push(product)
    }
  })

  return categorized
}

/**
 * 获取商品价格（取第一个 variant 的价格）
 */
export function getProductPrice(product: ShopifyProduct): number {
  if (product.variants && product.variants.length > 0) {
    return parseFloat(product.variants[0].price) || 0
  }
  return 0
}

/**
 * 从 options 中获取直径（diameter）
 * 返回第一个值，如 "6mm" -> "6mm"
 */
export function getProductDiameter(product: ShopifyProduct): string | null {
  if (!product.options || product.options.length === 0) {
    return null
  }

  // 查找 name 为 "diameter" 的 option（不区分大小写）
  const diameterOption = product.options.find(
    (opt) => opt.name.toLowerCase().trim() === 'diameter'
  )

  if (diameterOption && diameterOption.values && diameterOption.values.length > 0) {
    // 返回第一个值，如 "6mm"
    const value = diameterOption.values[0]
    return value ? value.trim() : null
  }

  return null
}

/**
 * 从 options 中获取重量（weight）
 * 返回第一个值，如 "1.65g" -> "1.65g"
 */
export function getProductWeight(product: ShopifyProduct): string | null {
  if (!product.options || product.options.length === 0) {
    return null
  }

  // 查找 name 为 "weight" 的 option（不区分大小写）
  const weightOption = product.options.find(
    (opt) => opt.name.toLowerCase().trim() === 'weight'
  )

  if (weightOption && weightOption.values && weightOption.values.length > 0) {
    // 返回第一个值，如 "1.65g"
    const value = weightOption.values[0]
    return value ? value.trim() : null
  }

  return null
}
