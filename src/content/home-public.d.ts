export const HOME_H1: string
export const HOME_LEAD: string
export const HOME_TITLE: string
export const HOME_META_DESCRIPTION: string
export const HOME_OG_IMAGE: string
export const FAQ_ITEMS: { question: string; answer: string }[]
export function homeLibraryStatLabel(): string
export function homeLatestAnnouncement(): { title: string; date: string; href: string } | null
export function homeItemListGraph(): Record<string, unknown>
export function homeFaqGraph(): Record<string, unknown>
export function homeAgentLinks(): { label: string; href: string }[]
