import assert from 'node:assert/strict'
import test from 'node:test'
import { usesEditorialShell } from '../src/lib/uses-editorial-shell.mjs'

test('usesEditorialShell hides legacy Navbar on editorial routes', () => {
  for (const path of [
    '/',
    '/contact',
    '/events',
    '/events/cd2026',
    '/topics',
    '/topics/agentic',
    '/products',
    '/products/uniqueresearch',
    '/research',
    '/research/rankings',
    '/research/events-awards',
    '/research/some-article',
    '/en/research',
    '/en/research/rankings',
    '/en/research/events-awards',
    '/en/research/some-article',
  ]) {
    assert.equal(usesEditorialShell(path), true, path)
  }
})

test('usesEditorialShell keeps legacy Navbar on non-editorial routes', () => {
  for (const path of ['/submit', '/flash-fundraising', '/funding-agent']) {
    assert.equal(usesEditorialShell(path), false, path)
  }
})
