import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export const BACKFILL_INGEST_SOURCE = 'unique-research-backfill';
export const SUBSTACK_ORIGIN = 'https://uniqueresearch.substack.com';
export const SITE_ORIGIN = 'https://ffcap.cn';
export const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MIN_TEXT_LENGTH = 100;

export function backfillCanonicalUrl(slug) {
  return `${SITE_ORIGIN}/en/research/${slug}`;
}

export function isBackfillArticle(article) {
  return article?.ingestSource === BACKFILL_INGEST_SOURCE
    || (typeof article?.sourceUrl === 'string' && article.sourceUrl.startsWith(`${SITE_ORIGIN}/en/research/`));
}

export function isSubstackArticle(article) {
  if (isBackfillArticle(article)) return false;
  try {
    return new URL(article.sourceUrl).origin === SUBSTACK_ORIGIN;
  } catch {
    return false;
  }
}

export function countImagesInHtml(html) {
  return [...String(html).matchAll(/<img[^>]+src="([^"]+)"/gi)].length;
}

export function assertSafeEnglishHtml(html, slug = 'article') {
  if (!html || html.trim().length < 100) throw new Error(`HTML too short: ${slug}`);
  if (/<(?:script|style|iframe|form|button|input|textarea|select|svg|object|embed|canvas|video|audio)\b/i.test(html)) {
    throw new Error(`Unsafe HTML tag in ${slug}`);
  }
  if (/\son[a-z]+\s*=/i.test(html)) throw new Error(`Inline event handler in ${slug}`);
  if (/\b(?:src|href)\s*=\s*["'](?:javascript|data):/i.test(html)) throw new Error(`Unsafe URL scheme in ${slug}`);
  if (html.includes('/img/missing-image.png')) throw new Error(`Placeholder image in ${slug}`);
  for (const match of html.matchAll(/<img[^>]+src="([^"]+)"/gi)) {
    const src = match[1].replaceAll('&amp;', '&');
    if (!/^https:\/\//i.test(src)) throw new Error(`Non-HTTPS image in ${slug}: ${src}`);
  }
}

export function digestHtml(html) {
  return createHash('sha256').update(html).digest('hex');
}

export function catalogEntryFromArticle(article) {
  const {
    slug, title, summary, publishedAt, sourceUrl, author, contentComplete, sourceAccessFree, imageCount,
  } = article;
  return {
    slug, title, summary, publishedAt, sourceUrl, author, contentComplete, sourceAccessFree, imageCount,
  };
}

export function sortCatalogEntries(entries) {
  return [...entries].sort((a, b) => {
    const date = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    if (date !== 0) return date;
    return a.slug.localeCompare(b.slug);
  });
}

/** Minimal Markdown → HTML for pilot packages (headings, paragraphs, links, emphasis). */
export function markdownToHtml(markdown) {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const chunks = [];
  let paragraph = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const inline = paragraph.join(' ')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
    chunks.push(`<p>${inline}</p>`);
    paragraph = [];
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      chunks.push(`<h${level}>${heading[2]}</h${level}>`);
      continue;
    }
    paragraph.push(trimmed);
  }
  flushParagraph();
  return chunks.join('\n');
}

export function plainTextFromHtml(html) {
  const text = String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h[1-6]|li|blockquote|figcaption|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

export async function readBackfillManifest(manifestPath) {
  try {
    const raw = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (raw.source !== BACKFILL_INGEST_SOURCE) throw new Error(`Unexpected backfill manifest source: ${raw.source}`);
    if (!Array.isArray(raw.articles)) throw new Error('Backfill manifest articles must be an array');
    return raw;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { source: BACKFILL_INGEST_SOURCE, updatedAt: null, articles: [] };
    }
    throw error;
  }
}

export async function loadBackfillArticles({ manifestPath, articlesDir }) {
  const manifest = await readBackfillManifest(manifestPath);
  const articles = [];
  const seen = new Set();
  for (const row of manifest.articles) {
    if (!VALID_SLUG.test(row.slug) || seen.has(row.slug)) throw new Error(`Invalid or duplicate backfill slug: ${row.slug}`);
    seen.add(row.slug);
    const file = path.join(articlesDir, `${row.slug}.json`);
    const article = JSON.parse(await readFile(file, 'utf8'));
    if (!isBackfillArticle(article)) throw new Error(`Article is not marked as backfill: ${row.slug}`);
    if (article.slug !== row.slug) throw new Error(`Backfill slug mismatch: ${row.slug}`);
    articles.push({ manifest: row, article });
  }
  return { manifest, articles };
}

export async function loadSubstackCatalogEntries({ archivePath, articlesDir }) {
  const archive = JSON.parse(await readFile(archivePath, 'utf8'));
  const fileNames = new Set(await readdir(articlesDir));
  const entries = [];
  const seen = new Set();
  for (const item of archive.articles) {
    const url = new URL(item.url);
    const slug = url.pathname.match(/^\/p\/([^/]+)\/?$/)?.[1];
    if (!slug || url.host !== 'uniqueresearch.substack.com' || seen.has(slug)) {
      throw new Error(`Invalid or duplicate archive URL: ${item.url}`);
    }
    seen.add(slug);
    if (!fileNames.has(`${slug}.json`)) continue;
    const article = JSON.parse(await readFile(path.join(articlesDir, `${slug}.json`), 'utf8'));
    if (!article.contentComplete || article.sourceAccessFree !== true || article.sourceUrl !== item.url) continue;
    if (isBackfillArticle(article)) throw new Error(`Substack archive slug conflicts with backfill article: ${slug}`);
    entries.push(catalogEntryFromArticle(article));
  }
  return { archive, entries };
}

export async function rebuildEnglishCatalog({
  archivePath,
  manifestPath,
  articlesDir,
  catalogPath,
  highlightsPath,
  highlightCount = 12,
}) {
  const { entries: substackEntries } = await loadSubstackCatalogEntries({ archivePath, articlesDir });
  const { articles: backfillRows } = await loadBackfillArticles({ manifestPath, articlesDir });
  const backfillEntries = backfillRows.map(({ article }) => catalogEntryFromArticle(article));
  const bySlug = new Map();
  for (const entry of substackEntries) {
    if (bySlug.has(entry.slug)) throw new Error(`Duplicate catalog slug: ${entry.slug}`);
    bySlug.set(entry.slug, entry);
  }
  for (const entry of backfillEntries) {
    if (bySlug.has(entry.slug)) throw new Error(`Backfill slug collides with Substack catalog entry: ${entry.slug}`);
    bySlug.set(entry.slug, entry);
  }
  const catalog = sortCatalogEntries([...bySlug.values()]);
  return { catalog, highlights: catalog.slice(0, highlightCount), substackCount: substackEntries.length, backfillCount: backfillEntries.length };
}

export function validateBackfillPackagePayload(payload, { slugFromDir } = {}) {
  const slug = payload.slug || slugFromDir;
  if (!VALID_SLUG.test(slug)) throw new Error(`Invalid slug: ${slug}`);
  if (payload.slug && payload.slug !== slugFromDir && slugFromDir) {
    throw new Error(`Package slug ${payload.slug} does not match directory ${slugFromDir}`);
  }
  const title = String(payload.title || '').trim();
  if (!title) throw new Error(`Missing title for ${slug}`);
  const publishedAt = String(payload.publishedAt || '').trim();
  if (!Number.isFinite(Date.parse(publishedAt))) throw new Error(`Invalid publishedAt for ${slug}`);
  const author = String(payload.author || 'Unique Research').trim() || 'Unique Research';
  let html = String(payload.html || '').trim();
  if (!html && payload.markdown) html = markdownToHtml(payload.markdown);
  if (!html && payload.body) html = String(payload.body).trim().startsWith('<') ? String(payload.body).trim() : markdownToHtml(payload.body);
  assertSafeEnglishHtml(html, slug);
  const text = String(payload.text || '').trim() || plainTextFromHtml(html);
  if (text.length < MIN_TEXT_LENGTH) throw new Error(`Body text too short for ${slug}`);
  const summary = String(payload.summary || '').trim() || text.split('\n').find((line) => line.trim())?.slice(0, 240) || title;
  const imageCount = Number.isInteger(payload.imageCount) ? payload.imageCount : countImagesInHtml(html);
  if (imageCount !== countImagesInHtml(html)) throw new Error(`imageCount mismatch for ${slug}`);
  const provenance = {};
  if (payload.backfillFromCnId) provenance.backfillFromCnId = String(payload.backfillFromCnId);
  if (payload.cnSourceUrl) {
    const cnUrl = new URL(payload.cnSourceUrl);
    if (!/^https?:$/.test(cnUrl.protocol)) throw new Error(`Invalid cnSourceUrl for ${slug}`);
    provenance.cnSourceUrl = cnUrl.href;
  }
  if (payload.relatedCnSlug) {
    const related = String(payload.relatedCnSlug);
    if (!/^[0-9]{8}a[0-9a-z]{5}00$/i.test(related)) throw new Error(`Invalid relatedCnSlug for ${slug}`);
    provenance.relatedCnSlug = related;
  }
  const article = {
    slug,
    title,
    summary,
    publishedAt,
    author,
    html,
    text,
    sourceUrl: backfillCanonicalUrl(slug),
    ingestSource: BACKFILL_INGEST_SOURCE,
    contentComplete: true,
    sourceAccessFree: true,
    imageCount,
    missingSourceImageCount: 0,
    contentSha256: digestHtml(html),
    ...provenance,
  };
  if (!isBackfillArticle(article)) throw new Error(`Failed backfill identity for ${slug}`);
  return article;
}
