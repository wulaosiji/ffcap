/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境优化
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    outputFileTracingRoot: undefined,
  },
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  compress: true,
  poweredByHeader: false,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  generateEtags: false,
  
  // 字体优化配置
  optimizeFonts: true,
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60',
          },
        ],
      },
      // 字体文件缓存
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 静态资源缓存
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  // afterFiles: checked after static routes, so /research/latest.md stays the feed.
  async rewrites() {
    return [
      { source: '/research/:slug.md', destination: '/research/:slug/markdown' },
      { source: '/en/research/:slug.md', destination: '/en/research/:slug/markdown' },
    ]
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/en/',
        destination: '/en',
        permanent: true,
      },
      {
        source: '/events',
        destination: '/research/events-awards',
        permanent: true,
      },
      {
        source: '/products/uniqueclub',
        destination: '/products/uniquebase',
        permanent: true,
      },
      {
        source: '/en/products/uniqueclub',
        destination: '/en/products/uniquebase',
        permanent: true,
      },
      {
        source: '/open.html',
        has: [{ type: 'query', key: 'slug' }],
        destination: 'https://uniquebloom.cn/:slug',
        permanent: true,
      },
      {
        source: '/open.html',
        destination: 'https://uniquebloom.cn/',
        permanent: true,
      },
    ]
  },
  
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 确保路径别名正确解析
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
};
module.exports = nextConfig; 