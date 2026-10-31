# 面板底纹 · Option B

产品大格用 D 地形墨线，右下角再叠一张低透明度手绘。阅读枢纽只留安静等高线，不放手绘。气质靠近 Felt 的暖纸地图：线条慢、纸留白多，不做弹跳和重视差。

站点 chrome 色板仍是 paper `#f7f6f1`、accent `#3f6b52`、muted `#5c6758`。静止时等高线与手绘保持去饱和的单色淡墨线稿。悬停或键盘 `:focus-within` 去掉 `grayscale`，让植物标本手绘自己的绿 / cream 透出来，并叠一层很淡的 cream / amber 径向晕（等高线约 15%→20%，手绘约 30%→40%，窄屏静止 26%）。不用 `sepia` / `hue-rotate` 的 terracotta 滤镜，也不用林绿 `saturate(1.4)`。装饰层 `pointer-events: none`，不挡链接。

## 类

| 类 | 用在哪里 |
|---|---|
| `.ed-panel` | 首页产品格、`/products` 与 `/en/products` 的 2×2。`::before` 复用 `/editorial/topo-contour.svg` |
| `[data-motif]` | 手绘文件名，不是新产品。`uniqueresearch`、`uniquebase`、`uniquebloom`、`goodprojects`（产品 id 为 `good-projects`） |
| `.ed-reading-hub` | 联系页「站内阅读与数据入口 / On-site reading and data」。盖住原来的平面米色块，只留纸色和安静等高线 |

手绘在 `public/editorial/motifs/`。动效在 `src/app/editorial-motion.css`：hub / hero / 阅读枢纽的等高线仍可 56 秒往复漂移；产品格 `.ed-panel::before` 静止时不循环，只在悬停或 `:focus-within` 时短位移。`prefers-reduced-motion: reduce` 时关闭循环与位移，仍允许透明度与去掉灰度的过渡。

产品详情是正文列，不是大格，不加手绘。社媒 `cover-style` 不改。

`public/editorial/motifs/` 四张手绘已换成封面式彩色植物标本线稿（暖琥珀 / 雾蓝 / cream / terracotta / 浅粉 / sage）。静止仍靠 CSS `grayscale` 保持单色淡墨；悬停去掉滤镜后露出植物本色。隐喻不变：`uniqueresearch` 开本日记 + 等高线 + 植物，`uniquebase` 古地图残片 + 节点 + 植物，`uniquebloom` 蓍草/伞形科 + 地形飘带，`goodprojects` 纸飞机越过等高线丘陵 + 植物。
