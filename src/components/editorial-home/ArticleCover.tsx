import { substackVariant } from '@/content/research/cover-image.mjs'

const WIDTH = { card: 640, header: 960, thumb: 640 } as const

export function ArticleCoverImage({
  src,
  variant,
}: {
  src: string
  variant: keyof typeof WIDTH
}) {
  const width = WIDTH[variant]
  const sized = substackVariant(src, width)
  if (!sized) return null
  return (
    <img
      className={`ed-cover ed-cover--${variant}`}
      src={sized}
      alt=""
      width={width}
      height={Math.round((width * 9) / 16)}
      loading={variant === 'header' ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  )
}
