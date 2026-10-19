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
