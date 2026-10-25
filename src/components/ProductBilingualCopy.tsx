/** Shared CN + EN product blurb layout for /products hub and detail pages. */
type Localized = { zh: string; en: string }

export function ProductBilingualCopy({
  description,
  className = 'rs-product-desc',
}: {
  description: Localized
  className?: string
}) {
  return (
    <div className={className}>
      <p>{description.zh}</p>
      <p lang="en">{description.en}</p>
    </div>
  )
}
