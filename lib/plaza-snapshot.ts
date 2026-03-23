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

/** 与小程序发布广场时一致的默认快照结构 */
export async function buildDefaultPlazaSnapshot(design: DesignLike) {
  const rawItems = Array.isArray(design.items) ? design.items : []
  const items = await enrichBraceletItemsImageUrl(rawItems)

  return {
    sourceDesignId: design.id,
    items,
    totalPrice: design.totalPrice,
    totalWeight: design.totalWeight ?? null,
    averageDiameter: design.averageDiameter ?? null,
    wristSize: design.wristSize ?? null,
    wearingStyle: design.wearingStyle ?? 'single',
    title: `共创配方 · ${items.length}颗`,
    story:
      '来自灵感广场的共创分享，将个人疗愈配方分享给同频的人。每一颗晶石都承载着转化与平衡的意图。',
    tags: [] as string[],
  }
}

/** 对快照中的 items 做图片富化（管理端手动改 JSON 后保存时用） */
export async function enrichPlazaSnapshotSnapshot(snapshot: Record<string, unknown>) {
  const items = snapshot.items
  if (!Array.isArray(items)) return snapshot
  const enriched = await enrichBraceletItemsImageUrl(items)
  return { ...snapshot, items: enriched }
}
