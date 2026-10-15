import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

const source = await readFile(new URL('../next.config.js', import.meta.url), 'utf8')
async function policies(environment) {
  const module = { exports: {} }
  runInNewContext(source, { module, process: { env: { NODE_ENV: environment } } })
  const rules = await module.exports.headers()
  return Object.fromEntries(rules.map(rule => [rule.source, rule.headers.find(header => header.key === 'Cache-Control').value]))
}

test('development never retains unversioned page bundles or route responses', async () => {
  const result = await policies('development')
  assert.ok(Object.values(result).every(policy => policy === 'no-store'))
})

test('production keeps the existing route, API, font and hashed asset cache policies', async () => {
  assert.deepEqual(await policies('production'), {
    '/(.*)': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
    '/api/(.*)': 'public, max-age=60, s-maxage=60',
    '/fonts/(.*)': 'public, max-age=31536000, immutable',
    '/_next/static/(.*)': 'public, max-age=31536000, immutable',
  })
})
