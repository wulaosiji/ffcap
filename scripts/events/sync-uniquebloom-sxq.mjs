#!/usr/bin/env node
// FFCAP activity sync via sxq (read-only public fields). Replaces `superun ... db select`.
// Usage: node scripts/events/sync-uniquebloom-sxq.mjs [OUT_PATH]
// Needs a logged-in `sxq` (苏小强 CLI) and a directory linked to the UniqueBloom project
// (`sxq link` run there). Set FFCAP_UNIQUEBLOOM_LINK_DIR; default is the ignored .local/uniquebloom-link.
// Reads only public is_visible=true activity fields; never registrations, contacts or ops fields; never writes back.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const linkDir = resolve(process.env.FFCAP_UNIQUEBLOOM_LINK_DIR || resolve(repo, '.local/uniquebloom-link'));
const outPath = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(repo, 'src/content/editorial.events.mjs');

const sql = `select id, slug, title, subtitle, description_summary, date, end_date, time_text, location, city, country, status, is_visible, is_published, is_flagship, tags, cover_url
from activities
where is_visible = true
order by date desc
limit 1000`;

const raw = execFileSync('sxq', ['db', 'query', '--json', sql], {
  cwd: linkDir,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
// sxq prints progress lines before JSON; extract last JSON array
const start = raw.indexOf('[');
const end = raw.lastIndexOf(']');
if (start < 0 || end < start) throw new Error('UniqueBloom read failed; snapshot preserved');
const rows = JSON.parse(raw.slice(start, end + 1));
if (!Array.isArray(rows) || !rows.length || rows.length >= 1000) {
  throw new Error('Empty or potentially truncated directory; snapshot preserved');
}

const ids = new Set();
const events = rows.map((row) => {
  if (!row.is_visible || !row.id || ids.has(row.id) || !row.title) {
    throw new Error('Invalid activity; snapshot preserved');
  }
  const date = String(row.date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid activity date; snapshot preserved');
  ids.add(row.id);
  const href = `https://uniquebloom.cn/${row.slug ? encodeURIComponent(row.slug) : `activities/${encodeURIComponent(row.id)}`}`;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || '',
    summary: row.description_summary || row.subtitle || '',
    date,
    endDate: row.end_date ? String(row.end_date).slice(0, 10) : row.end_date,
    timeText: row.time_text || '',
    location: row.location || row.city || '',
    city: row.city || '',
    country: row.country || '',
    status: row.status,
    isFlagship: row.is_flagship,
    tags: row.tags || [],
    coverUrl: row.cover_url,
    href,
  };
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  `// Public activity content from sxq read-only query. Do not hand-edit.\n// Visibility follows UniqueBloom is_visible; ended events remain in the archive.\nexport const EVENT_SOURCE = ${JSON.stringify({ url: 'https://uniquebloom.cn/', syncedAt: new Date().toISOString(), count: events.length }, null, 2)};\nexport const EVENT_DIRECTORY = ${JSON.stringify(events, null, 2)};\n`
);
console.log(`Synced ${events.length} public activities from UniqueBloom via sxq.`);
