import { enrichBraceletItemsImageUrl } from '@/lib/enrich-design-items'

type DesignLike = {
  id: string
  items: unknown
  totalPrice: number
  totalWeight: number | null
  averageDiameter: number | null
  wristSize: number | null
  wearingStyle: string | null
}

export type PlazaSnapshotMeta = {
  recipeName?: string
  recipePhilosophy?: string
  recipeTags?: string[]
}

/** 与小程序发布广场时一致的默认快照结构 */
export async function buildDefaultPlazaSnapshot(design: DesignLike, meta?: PlazaSnapshotMeta) {
  const rawItems = Array.isArray(design.items) ? design.items : []
  const items = await enrichBraceletItemsImageUrl(rawItems)

  const defaultTitle = `共创配方 · ${items.length}颗`
  const name = meta?.recipeName?.trim()
  const philosophy = meta?.recipePhilosophy?.trim()
  const defaultStory =
    '来自灵感广场的共创分享，将个人疗愈配方分享给同频的人。每一颗晶石都承载着转化与平衡的意图。'

  return {
    sourceDesignId: design.id,
    items,
    totalPrice: design.totalPrice,
    totalWeight: design.totalWeight ?? null,
    averageDiameter: design.averageDiameter ?? null,
    wristSize: design.wristSize ?? null,
    wearingStyle: design.wearingStyle ?? 'single',
    title: name && name.length > 0 ? name : defaultTitle,
    story: philosophy && philosophy.length > 0 ? philosophy : defaultStory,
    tags: Array.isArray(meta?.recipeTags) ? meta.recipeTags : ([] as string[]),
  }
}

/** 对快照中的 items 做图片富化（管理端手动改 JSON 后保存时用） */
export async function enrichPlazaSnapshotSnapshot(snapshot: Record<string, unknown>) {
  const items = snapshot.items
  if (!Array.isArray(items)) return snapshot
  const enriched = await enrichBraceletItemsImageUrl(items)
  return { ...snapshot, items: enriched }
}
