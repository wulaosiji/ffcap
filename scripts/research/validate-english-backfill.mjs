#!/usr/bin/env node

/**
 * Validate English backfill packages before import.
 *
 *   node scripts/research/validate-english-backfill.mjs /path/to/packages
 *   node scripts/research/validate-english-backfill.mjs /path/to/packages --json
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { validateBackfillPackagePayload } from './lib/english-ingest-shared.mjs';

const packagesDir = process.argv[2] ? path.resolve(process.argv[2]) : null;
const asJson = process.argv.includes('--json');
if (!packagesDir) throw new Error('usage: validate-english-backfill.mjs PACKAGES_DIR [--json]');

async function readPackage(dirName) {
  const dir = path.join(packagesDir, dirName);
  const info = await stat(dir);
  if (!info.isDirectory()) return null;
  const articleJson = path.join(dir, 'article.json');
  let payload;
  try {
    payload = JSON.parse(await readFile(articleJson, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`${dirName}: missing article.json`);
    throw error;
  }
  const article = validateBackfillPackagePayload(payload, { slugFromDir: dirName });
  return { dirName, article };
}

const names = (await readdir(packagesDir)).filter((name) => !name.startsWith('.')).sort();
const results = [];
const errors = [];
for (const name of names) {
  try {
    const row = await readPackage(name);
    if (row) results.push(row);
  } catch (error) {
    errors.push({ package: name, error: error.message });
  }
}
const output = {
  packagesDir,
  validCount: results.length,
  errorCount: errors.length,
  slugs: results.map((row) => row.article.slug),
  errors,
};
if (errors.length) {
  if (asJson) console.log(JSON.stringify(output, null, 2));
  else {
    for (const item of errors) console.error(`${item.package}: ${item.error}`);
  }
  process.exit(1);
}
if (asJson) console.log(JSON.stringify({ ...output, passed: true }, null, 2));
else console.log(`Validated ${results.length} backfill package(s) in ${packagesDir}`);
process.exit(0);
