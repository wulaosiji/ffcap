import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { organizationGraph } from '../src/content/site-identity.mjs'
import {
  BRAND_MARK_BARS,
  BRAND_MARK_PAPER,
} from '../src/content/brand-mark.mjs'

const require = createRequire(import.meta.url)
const brandMark = readFileSync(new URL('../src/components/BrandMark.tsx', import.meta.url), 'utf8')
const logo = readFileSync(new URL('../src/components/Logo.tsx', import.meta.url), 'utf8')
const shell = readFileSync(new URL('../src/components/editorial-home/EditorialShell.tsx', import.meta.url), 'utf8')
const hopCss = readFileSync(new URL('../src/app/brand-mark.css', import.meta.url), 'utf8')
const faviconSvg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const appIconSvg = readFileSync(new URL('../src/app/icon.svg', import.meta.url), 'utf8')
const editorialCss = readFileSync(new URL('../src/app/editorial-home.css', import.meta.url), 'utf8')
const cinematicCss = readFileSync(new URL('../src/app/infinite-world.css', import.meta.url), 'utf8')

test('BrandMark keeps UniqueBase four-tile geometry and forest fills', () => {
  assert.equal(BRAND_MARK_PAPER, '#f8f9f6')
  assert.deepEqual(BRAND_MARK_BARS.map(({ x, y, fill, delay }) => ({ x, y, fill, delay })), [
    { x: 10, y: 10, fill: '#203d2f', delay: '0s' },
    { x: 21, y: 7, fill: '#3f6b52', delay: '0.4s' },
    { x: 21, y: 20, fill: '#4e8766', delay: '0.8s' },
    { x: 10, y: 23, fill: '#79946a', delay: '1.2s' },
  ])
  for (const fill of ['#203d2f', '#3f6b52', '#4e8766', '#79946a']) {
    assert.ok(brandMark.includes(fill) || brandMark.includes('BRAND_MARK_BARS'), fill)
    assert.ok(faviconSvg.includes(fill), fill)
  }
  assert.equal(faviconSvg, appIconSvg)
  assert.match(faviconSvg, /#f8f9f6/)
})

test('site chrome uses BrandMark instead of the old raster infinity mark', () => {
  assert.match(brandMark, /ff-brand-icon--hop/)
  assert.match(logo, /BrandMark/)
  assert.doesNotMatch(logo, /ffcap-logo-mark/)
  assert.match(shell, /<BrandMark size=\{32\} \/>/)
  assert.match(shell, /<BrandMark size=\{32\} animated=\{false\} \/>/)
  assert.match(shell, /<BrandMark size=\{28\} animated=\{false\} \/>/)
  assert.doesNotMatch(shell, /ffcap-logo-mark|next\/image/)
  assert.doesNotMatch(editorialCss, /\.ed-brand img/)
  assert.doesNotMatch(cinematicCss, /\.ed-brand img/)
})

test('header hop is gated on prefers-reduced-motion and is not a hub animation', () => {
  assert.match(hopCss, /@keyframes ff-mark-bounce/)
  assert.match(hopCss, /prefers-reduced-motion:\s*reduce/)
  assert.match(hopCss, /\.ff-brand-icon--hop \.ff-mark-bar/)
  assert.doesNotMatch(hopCss, /ed-topo|ed-panel/)
})

test('generated favicon set and organization logo point at the four-tile mark', () => {
  assert.equal(organizationGraph()['@graph'][0].logo, 'https://ffcap.cn/favicon.svg')
  for (const relative of ['../src/app/favicon.ico', '../public/favicon.ico', '../src/app/apple-icon.png', '../public/apple-touch-icon.png']) {
    const bytes = readFileSync(new URL(relative, import.meta.url))
    assert.ok(bytes.length > 80, relative)
  }
  const ico = readFileSync(new URL('../src/app/favicon.ico', import.meta.url))
  assert.equal(ico[0], 0)
  assert.equal(ico[2], 1)
  assert.deepEqual(ico, readFileSync(new URL('../public/favicon.ico', import.meta.url)))
  assert.deepEqual([...readFileSync(new URL('../src/app/apple-icon.png', import.meta.url)).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
})

test('icon renderer stays a local stdlib script', () => {
  const script = readFileSync(new URL('../scripts/render-brand-mark-icons.py', import.meta.url), 'utf8')
  assert.match(script, /favicon\.svg/)
  assert.match(script, /apple-icon\.png/)
  assert.doesNotMatch(script, /import requests|urllib.request/)
  assert.ok(require.resolve('../src/content/brand-mark.mjs'))
})
