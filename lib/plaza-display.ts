import { sanitizePlazaRecipeTags } from '@/lib/plaza-recipe-tags'

type PlazaRow = {
  snapshot: unknown
  recipeName: string | null
  recipePhilosophy: string | null
  recipeTags: unknown
}

/** 列表/详情接口：合并表字段与 snapshot，供小程序只读 snapshot */
export function mergePlazaSnapshotForApi(row: PlazaRow): Record<string, unknown> {
  const base =
    row.snapshot && typeof row.snapshot === 'object' && !Array.isArray(row.snapshot)
      ? { ...(row.snapshot as Record<string, unknown>) }
      : {}

  const itemCount = Array.isArray(base.items) ? base.items.length : 0
  const colTags = sanitizePlazaRecipeTags(row.recipeTags, 16)
  const snapTags = Array.isArray(base.tags)
    ? (base.tags as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : []
  const tags = colTags.length > 0 ? colTags : snapTags

  const title =
    typeof row.recipeName === 'string' && row.recipeName.trim().length > 0
      ? row.recipeName.trim()
      : typeof base.title === 'string' && base.title.trim().length > 0
        ? base.title
        : `共创配方 · ${itemCount}颗`

  const defaultStory =
    '来自灵感广场的共创分享，将个人疗愈配方分享给同频的人。每一颗晶石都承载着转化与平衡的意图。'

  const story =
    typeof row.recipePhilosophy === 'string' && row.recipePhilosophy.trim().length > 0
      ? row.recipePhilosophy.trim()
      : typeof base.story === 'string' && base.story.trim().length > 0
        ? base.story
        : defaultStory

  return {
    ...base,
    title,
    story,
    tags,
  }
}
