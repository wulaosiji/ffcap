// Run from the FFCAP checkout: node scripts/events/sync-uniquebloom.mjs
// Read-only cloud access; writes only the local public-content snapshot.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const columns = 'id,slug,title,subtitle,description_summary,date,end_date,time_text,location,city,country,status,is_visible,is_published,is_flagship,tags,cover_url';
const output = execFileSync('superun', ['-a', 'uniquebloom', 'db', 'select', 'activities', '--select', columns, '--eq', 'is_visible=true', '--order', 'date.desc', '--limit', '1000'], { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
if (!output.startsWith('HTTP 200\n')) throw new Error('UniqueBloom read failed; snapshot preserved');
const rows = JSON.parse(output.slice(output.indexOf('\n') + 1));
if (!Array.isArray(rows) || !rows.length || rows.length >= 1000) throw new Error('Empty or potentially truncated directory; snapshot preserved');
const ids = new Set();
const events = rows.map(row => {
  if (!row.is_visible || !row.id || ids.has(row.id) || !row.title || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) throw new Error('Invalid activity; snapshot preserved');
  ids.add(row.id);
  const href = `https://uniquebloom.cn/${row.slug ? encodeURIComponent(row.slug) : `activities/${encodeURIComponent(row.id)}`}`;
  return { id: row.id, slug: row.slug, title: row.title, subtitle: row.subtitle || '', summary: row.description_summary || row.subtitle || '', date: row.date, endDate: row.end_date, timeText: row.time_text || '', location: row.location || row.city || '', city: row.city || '', country: row.country || '', status: row.status, isFlagship: row.is_flagship, tags: row.tags || [], coverUrl: row.cover_url, href };
});
writeFileSync(new URL('../../src/content/editorial.events.mjs', import.meta.url), `// Public activity content from the documented superun CLI. Do not hand-edit.\n// Visibility follows UniqueBloom is_visible; ended events remain in the archive.\nexport const EVENT_SOURCE = ${JSON.stringify({ url: 'https://uniquebloom.cn/', syncedAt: new Date().toISOString(), count: events.length }, null, 2)};\nexport const EVENT_DIRECTORY = ${JSON.stringify(events, null, 2)};\n`);
console.log(`Synced ${events.length} public activities from UniqueBloom.`);
