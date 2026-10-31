import type { CSSProperties } from 'react'
import {
  BRAND_MARK_BAR,
  BRAND_MARK_BARS,
  BRAND_MARK_PAPER,
  BRAND_MARK_PAPER_RX,
  BRAND_MARK_VIEWBOX,
} from '@/content/brand-mark.mjs'

type BrandMarkProps = {
  size?: number
  animated?: boolean
  className?: string
}

export function BrandMark({ size = 32, animated = true, className = '' }: BrandMarkProps) {
  const classes = ['ff-brand-icon', animated ? 'ff-brand-icon--hop' : '', className].filter(Boolean).join(' ')

  return (
    <span className={classes} style={{ width: size, height: size }} aria-hidden="true">
      <svg
        className="ff-brand-mark"
        viewBox={`0 0 ${BRAND_MARK_VIEWBOX} ${BRAND_MARK_VIEWBOX}`}
        width={size}
        height={size}
        aria-hidden="true"
      >
        <rect
          className="ff-mark-paper"
          width={BRAND_MARK_VIEWBOX}
          height={BRAND_MARK_VIEWBOX}
          rx={BRAND_MARK_PAPER_RX}
          fill={BRAND_MARK_PAPER}
        />
        {BRAND_MARK_BARS.map(bar => (
          <rect
            key={`${bar.x}-${bar.y}`}
            className="ff-mark-bar"
            x={bar.x}
            y={bar.y}
            width={BRAND_MARK_BAR.width}
            height={BRAND_MARK_BAR.height}
            rx={BRAND_MARK_BAR.rx}
            fill={bar.fill}
            style={{ '--ff-mark-delay': bar.delay } as CSSProperties}
          />
        ))}
      </svg>
    </span>
  )
}
