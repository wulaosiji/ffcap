/** Numbered homepage sections (research → events → products → FAQ → world). */
export const HOME_SECTION_TOTAL = 5

export const HOME_SECTION_INDEX = {
  research: 1,
  events: 2,
  products: 3,
  faq: 4,
  world: 5,
}

export function formatSectionIndex(index, total = HOME_SECTION_TOTAL) {
  return `[${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}]`
}
