export const HOME_H1: string
export const HOME_LEAD: string
export const HOME_TITLE: string
export const HOME_META_DESCRIPTION: string
export const HOME_OG_IMAGE: string
export const FAQ_ITEMS: { question: string; answer: string }[]
export const FAQ_ITEMS_EN: { question: string; answer: string }[]
export function homeLibraryStatLabel(): string
export function homeLibraryCount(): number
export function homeLatestAnnouncement(): {
  title: string
  date: string
  href: string
  stat: string | null
  summary: string
  source: string
  coverSrc: string | null
} | null
export function homeLatestEnglishAnnouncement(): {
  title: string
  date: string
  href: string
  stat: string | null
  summary: string
  source: string
  coverSrc: string | null
} | null
export function homeItemListGraph(): Record<string, unknown>
export function homeFaqGraph(): Record<string, unknown>
export function homeAgentLinks(): { label: string; href: string }[]
