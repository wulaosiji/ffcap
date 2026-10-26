import assert from 'node:assert/strict'
import test from 'node:test'
import nextConfig from '../next.config.js'

test('legacy UniqueClub product URLs permanently redirect to UniqueBase', async () => {
  const redirects = await nextConfig.redirects()
  const uniqueclub = redirects.filter(
    r => r.destination === '/products/uniquebase' && r.source.includes('uniqueclub'),
  )
  assert.deepEqual(
    uniqueclub.map(({ source, destination, permanent }) => ({ source, destination, permanent })),
    [
      { source: '/products/uniqueclub', destination: '/products/uniquebase', permanent: true },
      { source: '/en/products/uniqueclub', destination: '/products/uniquebase', permanent: true },
    ],
  )
})

test('retired events list permanently redirects to the events and awards hub', async () => {
  const redirects = await nextConfig.redirects()
  const events = redirects.filter(r => r.source === '/events')
  assert.deepEqual(
    events.map(({ source, destination, permanent }) => ({ source, destination, permanent })),
    [
      { source: '/events', destination: '/research/events-awards', permanent: true },
    ],
  )
})

test('open.html short links permanently redirect to UniqueBloom', async () => {
  const redirects = await nextConfig.redirects()
  const open = redirects.filter(r => r.source === '/open.html')
  assert.deepEqual(
    open.map(({ source, destination, permanent }) => ({ source, destination, permanent })),
    [
      { source: '/open.html', destination: 'https://uniquebloom.cn/:slug', permanent: true },
      { source: '/open.html', destination: 'https://uniquebloom.cn/', permanent: true },
    ],
  )
})
