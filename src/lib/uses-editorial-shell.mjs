/**
 * Routes that mount EditorialShell (or an equivalent editorial chrome) and must
 * not also render the legacy global Navbar / Footer from ClientLayout.
 */
export function usesEditorialShell(pathname) {
  if (!pathname) return false

  const exact = new Set([
    '/',
    '/about',
    '/world',
    '/faq',
    '/contact',
    '/for-models',
    '/for-ai',
    '/research',
    '/en/research',
    '/events',
    '/products',
    '/topics',
  ])
  if (exact.has(pathname)) return true

  const prefixes = [
    '/research/',
    '/en/research/',
    '/events/',
    '/products/',
    '/topics/',
  ]
  return prefixes.some((prefix) => pathname.startsWith(prefix))
}
