# 面板底纹 · Option B

产品大格用 D 地形墨线，右下角再叠一张低透明度手绘。阅读枢纽只留安静等高线，不放手绘。气质靠近 Felt 的暖纸地图：线条慢、纸留白多，不做弹跳和重视差。

色板仍是 paper `#f7f6f1`、accent `#3f6b52`、muted `#5c6758`。等高线层约 15%（悬停最多 18%）。手绘约 30%（悬停 32%，窄屏 26%）。装饰层 `pointer-events: none`，不挡链接。

## 类

| 类 | 用在哪里 |
|---|---|
| `.ed-panel` | 首页产品格、`/products` 与 `/en/products` 的 2×2。`::before` 复用 `/editorial/topo-contour.svg` |
| `[data-motif]` | 手绘文件名，不是新产品。`uniqueresearch`、`uniquebase`、`uniquebloom`、`goodprojects`（产品 id 为 `good-projects`） |
| `.ed-reading-hub` | 联系页「站内阅读与数据入口 / On-site reading and data」。盖住原来的平面米色块，只留纸色和安静等高线 |

手绘在 `public/editorial/motifs/`。动效在 `src/app/editorial-motion.css`：等高线约 56 秒往复漂移，手绘进入时轻轻落位，细线淡入。`prefers-reduced-motion: reduce` 时这些动画关闭，底纹仍在。

产品详情是正文列，不是大格，不加手绘。社媒 `cover-style` 不改。
