/**
 * 后台 / 手串 items 快照共用的商品展示字段（不依赖已删除的 images JSON）
 */

export type ProductRowLite = {
  id: string
  materialCode?: string | null
  majorCategory?: string | null
  colorSeries?: string | null
  title: string
  price: unknown
  diameter?: string | null
  weight?: string | null
  stock?: number
  imageUrl?: string | null
}

export function productDisplayColor(p: { colorSeries?: string | null }): string {
  const t = (p.colorSeries || '').trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t)) return t
  return '#e5e7eb'
}

/** 工作台 category：尽量映射到大分类文案 */
export function workbenchCategoryFromMajor(majorCategory: string | null | undefined): string {
  const raw = (majorCategory || '').trim()
  if (!raw) return 'main'
  const s = raw.toLowerCase()
  if (['main', 'support', 'spacer', 'accessory'].includes(s)) return s
  if (/隔|spacer/i.test(raw)) return 'spacer'
  if (/配饰|配件|accessory/i.test(raw)) return 'accessory'
  if (/配珠|辅|support/i.test(raw)) return 'support'
  if (/主|main/i.test(raw)) return 'main'
  return 'main'
}

/** 兼容旧快照里的 productType：优先物料编号，否则用商品 id */
export function productStableKey(p: { id: string; materialCode?: string | null }): string {
  const c = (p.materialCode || '').trim()
  return c || p.id
}

/** 写入 bracelet_designs.items / 广场快照的单颗珠子结构 */
export function braceletItemFromProductRow(p: ProductRowLite, idx: number) {
  return {
    id: `${p.id}_${idx}`,
    productId: p.id,
    name: p.title,
    price: Number(p.price || 0),
    color: productDisplayColor(p),
    size: p.diameter || '--',
    diameter: p.diameter ?? null,
    weight: p.weight ?? null,
    energy_tags: [] as string[],
    productType: productStableKey(p),
    imageUrl: p.imageUrl ?? null,
    materialCode: p.materialCode ?? null,
    majorCategory: p.majorCategory ?? null,
  }
}
