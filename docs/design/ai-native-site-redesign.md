# ffcap.cn 全站 AI-native 改版说明（对照 firecrawl.dev）

- 分支：`cursor/ai-native-home-redesign-f389`
- 对照参考：https://www.firecrawl.dev/ 、线上 https://ffcap.cn/
- 草稿来源：`uploads/hero-redesign-proposal.md`（已核查并扩展为全站）

## 全站对比摘要

| 页面/能力 | 改版前 | 改版后（本 PR） |
| --- | --- | --- |
| 首页首屏 | 100svh 3D SettlementHero，h1 sr-only，无事实数字 | ResearchHero ≤65vh：可见 h1、定义句、GET 搜索、CTA、给 AI 链接、4 张数据卡 |
| 首页性能 | 默认加载 ~30MB `cloud-courtyard-v2.glb` | 首页不加载 glb；3D 迁至 `/world` |
| `/faq` | DevSignal 旧模板 | 非凡资本真实 FAQ + FAQPage JSON-LD |
| 标题层级 | 首页卡片 h2 与区块 h2 扁平 | 首页仅 1 个可见 h1；研究卡片改 h3 |
| JSON-LD | Organization/WebSite，无 SearchAction | WebSite SearchAction、首页 ItemList + FAQPage、Organization brand/logo |
| llms.txt | 2.7KB 导航 | 增加 agent 使用说明与近期数据点 |
| 导航/页脚 | 无「给 AI」 | 主导航「给 AI」、页脚 llms.txt / index.json / FAQ |
| `/research` | 已有服务端 `?q=` | 未改检索逻辑；首页搜索直连 |
| `/en/research` | 独立 SSR | 保持（P2：英文首页） |

## 数据卡来源（口径已由内容侧确认，2026-10-19）

| 顺序 | stat | 来源 |
| --- | --- | --- |
| 1 | 542 起 | https://ffcap.cn/research/20261016a0disr00 |
| 2 | 61 亿美元/月 | https://ffcap.cn/research/20261014a0cmpf00 |
| 3 | 1312+ 篇 | 仓库 `catalog.json` 条数 |
| 4 | 活动日期/标题 | UniqueBloom `editorial.events.mjs` 下一场 upcoming |

## 定义句选用说明

- **HOME_H1**：`非凡产研：以 AI 研究为基础的产业资本与生态机构`
- **HOME_LEAD**：明确非凡资本为「以 AI 研究为基础的产业资本与生态机构」，非凡产研为研究品牌并持续跟踪融资、订阅收入与产品流量数据；与 FAQ、llms.txt、JSON-LD 的 `IDENTITY.description` 一致。不写未核实资管规模。

## 主要改动文件

- `src/components/editorial-home/ResearchHero.tsx`（新）
- `src/app/page.tsx`、`EditorialHome.tsx`、`EditorialShell.tsx`
- `src/app/world/page.tsx`（新，承载 SettlementHero）
- `src/app/faq/page.tsx`
- `src/content/site-identity.mjs`、`src/content/home-public.mjs`
- `src/app/llms.txt/route.ts`、`src/app/editorial-home.css`
- `src/components/editorial-home/ResearchHighlights.tsx`（h3）
- `src/app/sitemap.ts`

## P2 Follow-up

- 英文首页独立 URL + hreflang
- 首页 RAG「问非凡产研」对话
- robots `Content-Signal`（需用户确认 ai-train 策略）
- 数据卡数字随周更从 `highlights.json` / `catalog.json` 自动刷新（542 起文入库后优先从 catalog 取 `publishedAt`）
