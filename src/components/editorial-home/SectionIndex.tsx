import { formatSectionIndex, HOME_SECTION_TOTAL } from '@/content/home-sections.mjs'

export function SectionIndex({ index, total = HOME_SECTION_TOTAL }: { index: number; total?: number }) {
  return (
    <span className="ed-section-index" aria-hidden="true">
      {formatSectionIndex(index, total)}
    </span>
  )
}
