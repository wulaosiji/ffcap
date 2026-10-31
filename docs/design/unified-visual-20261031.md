# ffcap.cn 全站视觉统一 · D 地形墨线 × Substack 封面 · 2026-10-31

研究刊门面 = 暖纸底上的淡墨等高线 + 暖色手绘概念封面。结构签名仍是整句衬线标题、左文右器（约 7:5）、句子式 eyebrow。插画和底纹负责生动，不抢正文。

社媒流水线的 `linkedin-migration-pack/references/cover-style.md` 不在本仓库。新稿请改用下面的 prompt，与官网色板一致。

## 两层

| 层 | 用在哪里 | 做法 |
|---|---|---|
| Chrome 底纹 D | 首页 hero 外缘；研究库、榜单、活动 hub 页眉侧缘；产品 / 关于 / 联系 / 给 AI 只轻轻带一下 | `public/editorial/topo-contour.svg`，墨线用 accent / muted，层透明度 8–18%。类名：`ed-topo-hub`、`ed-topo-quiet`，首页用 `.ed-research-hero::before` |
| 内容封面 | 英文文章卡、英文详情头图、OG；首页英文右器缩略图；中文仅在 `ENGLISH_RELATED` 已核实对照上复用英文封面 | 正文第一张 Substack CDN 图。卡片 `w_640`，头图 `w_960`。不重画历史文件 |

阅读列（`.rs-prose`、`.rs-article-header`）保持实色 paper。不要把封面模糊铺成整页背景。

## Token

| 名 | Hex | 角色 |
|---|---|---|
| paper | `#f7f6f1` | 页面底 / 阅读列 |
| ink | `#1a221c` | 正文；封面里只作细线 |
| muted | `#5c6758` | 次要文字 / 淡墨线 |
| rule | `#ddd8cc` | 编辑细线 |
| accent | `#3f6b52` | 链接、等高线主墨 |
| button | `#1e3328` | 主按钮 |
| focus | `#4e8766` | 焦点环 |
| sage | `#79946a` | 只用于新封面，不进页面主色 |

页面上不要新开陶土主色、紫色、霓虹、3D 或实拍墙。

## 封面色板（新稿）

- cream / warm paper：`#f7f6f1`–`#f3efe6`
- forest / sage：`#3f6b52`、`#5c6758`、`#79946a`
- ink line：`#1a221c`（仅细线）
- dusty blue：只作点缀，面积不超过 15%（地图水系、冷隐喻）
- amber：只作高光点缀，面积不超过 10%。不再用大面积 terracotta

仍是暖色手绘、平面、纸纹、概念隐喻，16:9 / 2048×1152。无字、无脸、无 Logo、无暗色科技底、无照片质感。可以出现等高线、古地图淡影、桥或路径、纸飞机、器物化的仪表，但不要画成界面截图。

### Prompt

```
Warm hand-drawn editorial illustration, flat style with soft paper texture,
cream warm-paper background, forest sage and muted ink-line palette
(paper #f7f6f1, forest #3f6b52, muted #5c6758), optional faint topographic
contour or antique-map whisper in the background.
Conceptual scene: <ONE_SENTENCE_METAPHOR_OF_ARTICLE_CORE_IDEA>.
Absolutely no words, no letters, no text, no labels, no realistic faces,
no photorealism, no third-party logos, no dark tech background,
no large terracotta or purple fields.
Gentle research-journal magazine feel.
```

出字或出 Logo 就整张重来。存量封面照用，不在这次改动里重画。

产品 2×2 与阅读枢纽的面板底纹见 `docs/design/panel-backgrounds-b.md`。社媒封面标准不在这次改动里。
