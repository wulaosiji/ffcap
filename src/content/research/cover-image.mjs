/**
 * Cover src helpers. English cards use a Substack CDN width variant of the
 * first image. Local Chinese covers pass through unchanged.
 */

const FETCH_PREFIX = 'https://substackcdn.com/image/fetch/'

export function firstSubstackImage(html) {
  if (typeof html !== 'string' || !html) return null
  const match = html.match(/<img\b[^>]*\bsrc=["'](https:\/\/substackcdn\.com\/image\/fetch\/[^"']+)["']/i)
  return match ? match[1] : null
}

export function substackAssetKey(url) {
  if (typeof url !== 'string' || !url.startsWith(FETCH_PREFIX)) return null
  const rest = url.slice(FETCH_PREFIX.length)
  const slash = rest.indexOf('/')
  if (slash < 0) return null
  try {
    return decodeURIComponent(rest.slice(slash + 1))
  } catch {
    return null
  }
}

/** Resize a Substack fetch URL to a CDN width variant. Returns null for other hosts. */
export function substackVariant(url, width) {
  if (typeof url !== 'string' || !url.startsWith(FETCH_PREFIX)) return null
  if (!Number.isInteger(width) || width < 320 || width > 1456) return null
  if (/[?#\s"'<>]/.test(url)) return null
  if (/w_\d+/.test(url)) return url.replace(/w_\d+/, `w_${width}`)
  return url.replace('/image/fetch/', `/image/fetch/w_${width},`)
}

const LOCAL_ZH_COVER = /^\/editorial\/covers\/zh\/[a-z0-9]+\.(webp|jpg|png)$/

/**
 * Card and header src. Substack URLs become a width variant. A local Chinese
 * cover is returned unchanged. Anything else is omitted.
 */
export function coverImageSrc(src, width) {
  const sized = substackVariant(src, width)
  if (sized) return sized
  if (typeof src === 'string' && LOCAL_ZH_COVER.test(src)) return src
  return null
}

/**
 * Drop the leading body figure when it is the same Substack asset as the header
 * cover, so the detail page does not show that image twice.
 */
export function withoutLeadingCover(html, coverUrl) {
  if (typeof html !== 'string' || !html || !coverUrl) return html
  const key = substackAssetKey(coverUrl)
  if (!key) return html
  const region = html.slice(0, 1800)
  const match = /<figure\b[^>]*>[\s\S]*?<\/figure>|<p\b[^>]*>\s*(?:<a\b[^>]*>\s*)?<img\b[^>]*>(?:\s*<\/a>)?\s*<\/p>/i.exec(region)
  if (!match) return html
  const img = firstSubstackImage(match[0])
  if (!img || substackAssetKey(img) !== key) return html
  return html.slice(0, match.index) + html.slice(match.index + match[0].length)
}
