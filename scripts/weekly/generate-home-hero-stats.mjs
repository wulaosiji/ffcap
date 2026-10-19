#!/usr/bin/env node
/**
 * Regenerate gitignored home-hero-stats.local.json on the weekly release host.
 * Run after classify.mjs refreshes highlights.json / catalog.json. Do not commit output.
 *
 * Usage: node scripts/weekly/generate-home-hero-stats.mjs [--repo /path/to/release]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FINANCING_SLUG = '20261016a0disr00'
const SUBSCRIPTION_SLUG = '20261014a0cmpf00'

const repoRoot = process.argv.includes('--repo')
  ? process.argv[process.argv.indexOf('--repo') + 1]
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

const researchRoot = path.join(repoRoot, 'src/content/research')
const catalog = JSON.parse(fs.readFileSync(path.join(researchRoot, 'catalog.json'), 'utf8'))
const highlights = JSON.parse(fs.readFileSync(path.join(researchRoot, 'highlights.json'), 'utf8'))

function pick(slug) {
  return highlights.find(a => a.slug === slug) || catalog.find(a => a.slug === slug)
}

function statFromFinancing(article) {
  const hay = `${article?.title || ''} ${article?.excerpt || ''}`
  const m = hay.match(/(\d+)\s*起/)
  if (m) return `${m[1]} 起`
  return null
}

function statFromSubscription(article) {
  const hay = `${article?.title || ''} ${article?.excerpt || ''}`
  const m = hay.match(/(\d+(?:\.\d+)?)\s*亿(?:美元)?/)
  if (m) return `${m[1]} 亿美元/月`
  return null
}

const financing = pick(FINANCING_SLUG)
const subscription = pick(SUBSCRIPTION_SLUG)

const payload = {
  generatedAt: new Date().toISOString(),
  financing: financing
    ? {
        slug: FINANCING_SLUG,
        stat: statFromFinancing(financing) || '542 起',
        label: '2026 年 9 月全球 AI 融资事件（非凡产研盘点）',
        publishedAt: financing.publishedAt,
      }
    : null,
  subscription: subscription
    ? {
        slug: SUBSCRIPTION_SLUG,
        stat: statFromSubscription(subscription) || '61 亿美元/月',
        label: '9 月全球 AI 订阅收入榜 Top100 预估合计',
        publishedAt: subscription.publishedAt,
      }
    : null,
}

const outPath = path.join(researchRoot, 'home-hero-stats.local.json')
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`)
console.log(`Wrote ${outPath}`)
