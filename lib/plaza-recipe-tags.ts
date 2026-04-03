/** 与小程序「确认配方」标签选项一致，发布时仅允许这些值 */
export const PLAZA_RECIPE_TAG_OPTIONS = [
  '职场破局',
  '安神助眠',
  '招财进宝',
  '情感疗愈',
  '考试锦鲤',
  '健康守护',
  '创业加持',
  '减压静心',
] as const

export function sanitizePlazaRecipeTags(input: unknown, max = 8): string[] {
  const allowed = new Set<string>(PLAZA_RECIPE_TAG_OPTIONS as unknown as string[])
  if (!Array.isArray(input)) return []
  const out: string[] = []
  for (const x of input) {
    if (typeof x !== 'string') continue
    const t = x.trim()
    if (!allowed.has(t)) continue
    if (out.includes(t)) continue
    out.push(t)
    if (out.length >= max) break
  }
  return out
}
