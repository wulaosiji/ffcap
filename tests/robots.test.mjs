import assert from 'node:assert/strict'
import test from 'node:test'
import { ROBOTS_TXT } from '../src/content/robots-txt.mjs'

test('robots.txt keeps crawl rules, sitemap, and allows AI training signals', () => {
  assert.match(ROBOTS_TXT, /User-agent: \*/i)
  assert.match(ROBOTS_TXT, /Allow: \//)
  assert.match(ROBOTS_TXT, /Disallow: \/api\//)
  assert.match(ROBOTS_TXT, /Sitemap: https:\/\/ffcap\.cn\/sitemap\.xml/)
  assert.match(ROBOTS_TXT, /Content-Signal: search=yes, ai-input=yes, ai-train=yes/)
})
