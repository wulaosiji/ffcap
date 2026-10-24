const ZH_SLUG = '[a-z0-9]+'
const EN_SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*'

/** Rewrite /research/{slug}.md to the existing Markdown route. Leaves /research/latest.md alone. */
export function markdownAliasRewrite(pathname) {
  if (pathname === '/research/latest.md') return null
  let match = pathname.match(new RegExp(`^/research/(${ZH_SLUG})\\.md$`))
  if (match) return `/research/${match[1]}/markdown`
  match = pathname.match(new RegExp(`^/en/research/(${EN_SLUG})\\.md$`))
  if (match) return `/en/research/${match[1]}/markdown`
  return null
}

/** Canonical Markdown URL advertised from an article HTML page. */
export function articleMarkdownAlternate(pathname) {
  let match = pathname.match(new RegExp(`^/research/(${ZH_SLUG})$`))
  if (match) return `https://ffcap.cn/research/${match[1]}/markdown`
  match = pathname.match(new RegExp(`^/en/research/(${EN_SLUG})$`))
  if (match) return `https://ffcap.cn/en/research/${match[1]}/markdown`
  return null
}

export function articleMarkdownLinkHeader(pathname) {
  const href = articleMarkdownAlternate(pathname)
  if (!href) return null
  return `<${href}>; rel="alternate"; type="text/markdown"`
}
