#!/usr/bin/env node

/**
 * Import publicly readable Unique Research posts into the FFCAP site.
 *
 * Run: node scripts/research/import-substack-fulltext.mjs [--limit N] [--refresh]
 *      node scripts/research/import-substack-fulltext.mjs --refresh-mismatched-titles
 *      node scripts/research/import-substack-fulltext.mjs --catalog-only
 * The public Substack pages are fetched as a guest through agent-browser because
 * this machine's direct HTTP client cannot reliably reach the publication.
 * No account session, API credential, subscriber export or private endpoint is used.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digestHtml, rebuildEnglishCatalog } from './lib/english-ingest-shared.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  if (!process.argv[index + 1]) throw new Error(`${name} requires a value`);
  return path.resolve(process.argv[index + 1]);
};
const sourcePath = option('--source-path', path.join(repo, 'src/content/research/english-substack.json'));
const outputDir = option('--output-dir', path.join(repo, 'src/content/research/english-articles'));
const catalogPath = option('--catalog-path', path.join(repo, 'src/content/research/english-catalog.json'));
const highlightsPath = option('--highlights-path', path.join(repo, 'src/content/research/english-highlights.json'));
const backfillManifestPath = option('--backfill-manifest-path', path.join(repo, 'src/content/research/english-backfill.json'));
const reportPath = option('--report-path', process.env.FFCAP_IMPORT_REPORT_PATH || path.join(repo, '.local/reports/fulltext-import-report.json'));
const session = process.env.FFCAP_IMPORT_BROWSER_SESSION || 'ffcap-fulltext-import';
const batchSize = 4;
const limitArgument = process.argv.indexOf('--limit');
const limit = limitArgument < 0 ? Infinity : Number(process.argv[limitArgument + 1]);
const refresh = process.argv.includes('--refresh');
const refreshMismatchedTitles = process.argv.includes('--refresh-mismatched-titles');
const catalogOnly = process.argv.includes('--catalog-only');
const onlySlugsArgument = process.argv.indexOf('--only-slugs');
const onlySlugs = onlySlugsArgument < 0 ? null : new Set((process.argv[onlySlugsArgument + 1] || '').split(',').filter(Boolean));
if (onlySlugs && (!onlySlugs.size || [...onlySlugs].some((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))) {
  throw new Error('--only-slugs requires valid comma-separated slugs');
}
const atomicJson = async (target, value) => {
  await mkdir(path.dirname(target), { recursive: true });
  const pending = `${target}.pending-${process.pid}`;
  await writeFile(pending, `${JSON.stringify(value, null, 2)}\n`);
  await rename(pending, target);
};

if (!Number.isInteger(limit) && limit !== Infinity || limit < 1) {
  throw new Error('--limit must be a positive integer');
}

function cli(args, input, timeout = 120_000) {
  const result = spawnSync('npx', ['--yes', 'agent-browser', '--session', session, ...args], {
    cwd: repo,
    input,
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
    timeout,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`agent-browser ${args[0]} failed: ${result.error?.message || result.stderr?.slice(0, 500) || result.stdout?.slice(0, 500)}`);
  }
  return result.stdout.trim();
}

// This function is serialized and run in the public publication's browser origin.
async function fetchBatch(items) {
  function sanitize(body) {
    const allowed = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'strong', 'em', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br', 'hr', 'sup', 'sub', 'del']);
    const discard = new Set(['script', 'style', 'button', 'form', 'input', 'textarea', 'select', 'svg', 'iframe', 'object', 'embed', 'canvas', 'video', 'audio', 'source']);
    const fragment = document.createDocumentFragment();
    function appendClean(parent, node) {
      if (node.nodeType === Node.TEXT_NODE) {
        parent.appendChild(document.createTextNode(node.textContent || ''));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toLowerCase();
      const classes = String(node.className?.baseVal || node.className || '');
      if (discard.has(tag) || /(?:header-anchor|subscribe-widget|subscription-widget|paywall|share-dialog|comment-widget)/i.test(classes)) return;
      if (tag === 'img') {
        const src = node.getAttribute('src') || node.getAttribute('data-src') || '';
        if (!/^https:\/\//i.test(src)) return;
        const clean = document.createElement('img');
        clean.setAttribute('src', src);
        if (node.getAttribute('alt')) clean.setAttribute('alt', node.getAttribute('alt'));
        clean.setAttribute('loading', 'lazy');
        parent.appendChild(clean);
        return;
      }
      if (!allowed.has(tag)) {
        for (const child of node.childNodes) appendClean(parent, child);
        return;
      }
      const clean = document.createElement(tag);
      if (tag === 'a') {
        const href = node.getAttribute('href') || '';
        if (/^https?:\/\//i.test(href)) clean.setAttribute('href', href);
      }
      if (tag === 'ol' && node.getAttribute('start')) clean.setAttribute('start', node.getAttribute('start'));
      for (const child of node.childNodes) appendClean(clean, child);
      parent.appendChild(clean);
    }
    for (const child of body.childNodes) appendClean(fragment, child);
    const wrap = document.createElement('div');
    wrap.appendChild(fragment);
    const textParts = [];
    function gather(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        textParts.push(node.textContent || '');
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'figcaption', 'tr', 'br', 'hr'].includes(tag)) textParts.push('\n');
        for (const child of node.childNodes) gather(child);
        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'figcaption', 'tr'].includes(tag)) textParts.push('\n');
      }
    }
    for (const child of wrap.childNodes) gather(child);
    return {
      html: wrap.innerHTML,
      text: textParts.join('').replace(/[\t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim(),
      imageCount: wrap.querySelectorAll('img').length,
      originalImageCount: body.querySelectorAll('img').length,
    };
  }

  async function fetchOne(item) {
    try {
      const response = await fetch(item.url, { credentials: 'omit', redirect: 'follow' });
      if (!response.ok) return { slug: item.slug, status: response.status, reason: 'http_error' };
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const body = doc.querySelector('.available-content .body.markup');
      const ld = [...doc.querySelectorAll('script[type="application/ld+json"]')]
        .map((node) => { try { return JSON.parse(node.textContent || ''); } catch { return null; } })
        .find((value) => value?.['@type'] === 'NewsArticle');
      if (!body) return { slug: item.slug, status: response.status, reason: 'body_missing' };
      const paywall = Boolean(doc.querySelector('[class*="paywall" i], [class*="paid-content" i], [class*="locked-content" i]'));
      const sourceAccessFree = ld?.isAccessibleForFree === true;
      const authors = (Array.isArray(ld?.author) ? ld.author : [ld?.author])
        .map((author) => typeof author === 'string' ? author : author?.name)
        .filter(Boolean);
      const result = sanitize(body);
      const title = doc.querySelector('h1.post-title')?.textContent?.trim() || item.title || ld?.headline;
      const publishedAt = ld?.datePublished;
      const contentComplete = sourceAccessFree && !paywall && Boolean(title && publishedAt && result.text.length >= 100);
      const reason = contentComplete ? null : ld?.isAccessibleForFree === false ? 'paid_metadata' : !sourceAccessFree ? 'free_access_unconfirmed' : paywall ? 'paywall' : !title || !publishedAt ? 'metadata_missing' : 'body_too_short';
      return {
        slug: item.slug,
        title,
        summary: item.summary || doc.querySelector('meta[name="description"]')?.content || '',
        html: result.html,
        text: result.text,
        publishedAt,
        sourceUrl: response.url,
        author: authors.join(', ') || 'Unique Research',
        sourceAccessFree,
        contentComplete,
        imageCount: result.imageCount,
        missingSourceImageCount: result.originalImageCount - result.imageCount,
        status: response.status,
        reason,
      };
    } catch (error) {
      return { slug: item.slug, reason: 'fetch_exception', error: String(error).slice(0, 300) };
    }
  }

  const results = [];
  for (const item of items) {
    results.push(await fetchOne(item));
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  return results;
}

const archive = JSON.parse(await readFile(sourcePath, 'utf8'));
const seen = new Set();
const entries = archive.articles.map((item) => {
  const url = new URL(item.url);
  const slug = url.pathname.match(/^\/p\/([^/]+)\/?$/)?.[1];
  if (!slug || url.host !== 'uniqueresearch.substack.com' || seen.has(slug)) throw new Error(`Invalid or duplicate archive URL: ${item.url}`);
  seen.add(slug);
  return { ...item, slug };
});
await mkdir(outputDir, { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });

if (onlySlugs && [...onlySlugs].some((slug) => !seen.has(slug))) throw new Error('--only-slugs contains unknown source slug');
let selected = entries.filter((entry) => !onlySlugs || onlySlugs.has(entry.slug)).slice(0, limit);
if (refreshMismatchedTitles) {
  const mismatched = [];
  for (const entry of selected) {
    try {
      const existing = JSON.parse(await readFile(path.join(outputDir, `${entry.slug}.json`), 'utf8'));
      if (existing.title !== entry.title) mismatched.push(entry);
    } catch { /* Missing files are handled by the normal import run. */ }
  }
  selected = mismatched;
}
const pending = [];
for (const entry of selected) {
  try {
    if (refresh || refreshMismatchedTitles || onlySlugs) throw new Error('refresh');
    const existing = JSON.parse(await readFile(path.join(outputDir, `${entry.slug}.json`), 'utf8'));
    if (!existing.contentComplete || existing.sourceAccessFree !== true || existing.sourceUrl !== entry.url) pending.push(entry);
  } catch {
    pending.push(entry);
  }
}

const fetchQueue = catalogOnly ? [] : pending;
if (fetchQueue.length) {
  try {
    if (JSON.parse(cli(['eval', 'location.origin'], undefined, 15_000)) !== 'https://uniqueresearch.substack.com') {
      cli(['open', entries[0].url], undefined, 60_000);
    }
  } catch {
    cli(['open', entries[0].url], undefined, 60_000);
  }
}

const failures = [];
for (let index = 0; index < fetchQueue.length; index += batchSize) {
  const batch = fetchQueue.slice(index, index + batchSize);
  let results;
  try {
    const expression = `(${fetchBatch.toString()})(${JSON.stringify(batch)})`;
    results = JSON.parse(cli(['eval', '--stdin'], expression, 120_000));
  } catch (error) {
    results = batch.map((entry) => ({ slug: entry.slug, reason: 'batch_error', error: error.message.slice(0, 300) }));
  }
  for (const result of results) {
    if (result.contentComplete) {
      const { status, reason, ...article } = result;
      const existingPath = path.join(outputDir, `${result.slug}.json`);
      let previous;
      try { previous = JSON.parse(await readFile(existingPath, 'utf8')); } catch { /* New article. */ }
      if (previous && (article.text.length < previous.text.length * 0.7 || article.imageCount < previous.imageCount)) {
        failures.push({ slug: result.slug, reason: 'body_or_image_regression' });
        continue;
      }
      await atomicJson(existingPath, article);
    } else {
      failures.push({ slug: result.slug, url: batch.find((entry) => entry.slug === result.slug)?.url, status: result.status, reason: result.reason, error: result.error });
    }
  }
  process.stdout.write(`Fetched ${Math.min(index + batch.length, fetchQueue.length)}/${fetchQueue.length}; accepted ${results.filter((item) => item.contentComplete).length}/${results.length} in batch\n`);
}

const fileNames = new Set(await readdir(outputDir));
let missingSourceImageCount = 0;
let affectedSourceImageArticles = 0;
let sourceAccessVerifiedCount = 0;
const sourceImageWarnings = [];
for (const entry of entries) {
  if (!fileNames.has(`${entry.slug}.json`)) continue;
  const articlePath = path.join(outputDir, `${entry.slug}.json`);
  const article = JSON.parse(await readFile(articlePath, 'utf8'));
  if (!article.contentComplete || article.sourceAccessFree !== true || article.sourceUrl !== entry.url) continue;
  if (article.sourceAccessFree === true) sourceAccessVerifiedCount += 1;
  const contentSha256 = digestHtml(article.html);
  if (article.contentSha256 !== contentSha256) {
    article.contentSha256 = contentSha256;
    await atomicJson(articlePath, article);
  }
  missingSourceImageCount += article.missingSourceImageCount || 0;
  if (article.missingSourceImageCount) {
    affectedSourceImageArticles += 1;
    sourceImageWarnings.push({ slug: article.slug, missingSourceImageCount: article.missingSourceImageCount });
  }
}
const { catalog, highlights, backfillCount } = await rebuildEnglishCatalog({
  archivePath: sourcePath,
  manifestPath: backfillManifestPath,
  articlesDir: outputDir,
  catalogPath,
  highlightsPath,
});
await atomicJson(catalogPath, catalog);
await atomicJson(highlightsPath, highlights);
const catalogSlugs = new Set(catalog.map((article) => article.slug));
const failedSlugs = new Set(failures.map((failure) => failure.slug));
const exclusionDetails = [
  ...failures.filter((failure) => !catalogSlugs.has(failure.slug)),
  ...entries.filter((entry) => !catalogSlugs.has(entry.slug) && !failedSlugs.has(entry.slug)).map((entry) => ({
    slug: entry.slug,
    url: entry.url,
    reason: entry.slug === 'three-programmers-making-ai-videos' ? 'body_too_short' : 'not_checked_in_this_run',
    ...(entry.slug === 'three-programmers-making-ai-videos' ? { evidence: 'Public body contained only "test" (4 characters) when checked on 2026-09-26.' } : {}),
  })),
];
const bodyLengths = [];
const sourceEndingColonSlugs = [];
let subscriptionPromptMatches = 0;
for (const article of catalog) {
  const body = JSON.parse(await readFile(path.join(outputDir, `${article.slug}.json`), 'utf8'));
  bodyLengths.push(body.text.length);
  if (body.text.trim().endsWith(':')) sourceEndingColonSlugs.push(body.slug);
  if (/subscribe to (continue|keep|read)|continue reading|read the rest|this post is for paid|paid subscribers only|upgrade to read/i.test(body.text)) subscriptionPromptMatches += 1;
}
bodyLengths.sort((a, b) => a - b);
const percentile = (fraction) => bodyLengths[Math.floor((bodyLengths.length - 1) * fraction)] || null;
await atomicJson(reportPath, {
  source: archive.source,
  sourceCapturedAt: archive.capturedAt,
  checkedAt: new Date().toISOString(),
  archiveCount: entries.length,
  selectedCount: selected.length,
  attemptedCount: fetchQueue.length,
  completeCatalogCount: catalog.length,
  backfillCatalogCount: backfillCount,
  sourceAccessVerifiedCount,
  excludedCount: entries.length - catalog.length,
  missingSourceImageCount,
  affectedSourceImageArticles,
  sourceImageWarnings,
  exclusionDetails,
  bodyTextLength: { min: percentile(0), p05: percentile(0.05), median: percentile(0.5), p95: percentile(0.95), max: percentile(1) },
  subscriptionPromptMatches,
  sourceEndingColonSlugs,
  completenessRule: 'Public guest HTTP 200, available-content body at least 100 text characters, headline/date, no paywall/locked marker, and NewsArticle isAccessibleForFree=true. Every catalog file must retain that explicit metadata proof. Source images that are already /img/missing-image.png do not invalidate full text; they are omitted and counted in the article.',
  authorRule: 'NewsArticle.author name; Unique Research only when the public article has no usable author name.',
  imageRule: 'Preserve public HTTPS image URLs; images are linked, not copied.',
});
process.stdout.write(`Catalog: ${catalog.length}/${entries.length}; failures this run: ${failures.length}\n`);
