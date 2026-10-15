const { createServer } = require('http')
const { parse } = require('url')

// 加载环境变量（支持 import.env 命名）
try {
  require('dotenv').config({ path: './import.env' })
} catch (e) {
  require('dotenv').config()
}

const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// 准备Next.js应用
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // 解析URL
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      // 处理请求
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
