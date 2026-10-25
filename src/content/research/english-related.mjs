// Each pair is supported by the English article or an official Unique Research/Delta Wu share.
// Related editions are not guaranteed to be line-by-line translations.
export const ENGLISH_RELATED = Object.freeze({
  '20250926a084iw00': 'https://uniqueresearch.substack.com/p/why-do-bytedances-ai-apps-keep-winning',
  '20260903a098sq00': 'https://uniqueresearch.substack.com/p/selling-ai-toys-in-the-united-states',
  '20260830a09nqd00': 'https://uniqueresearch.substack.com/p/src-20260830-01html',
  '20260716a064py00': 'https://uniqueresearch.substack.com/p/src-20260716-01html',
  '20260717a043mo00': 'https://uniqueresearch.substack.com/p/src-20260717-01html',
})
export function relatedEnglishArticle(articles, chineseSlug) {
  const url = ENGLISH_RELATED[chineseSlug]
  return url ? articles.find(article => (article.sourceUrl || article.url) === url) : undefined
}

export function relatedChineseSlug(englishUrl) {
  return Object.entries(ENGLISH_RELATED).find(([, url]) => url === englishUrl)?.[0]
}

export function relatedChineseSlugForArticle(article) {
  if (article?.relatedCnSlug) return article.relatedCnSlug
  return relatedChineseSlug(article?.sourceUrl)
}

export function englishSlugForChinese(chineseSlug) {
  const url = ENGLISH_RELATED[chineseSlug]
  return url?.split('/p/')[1]
}
