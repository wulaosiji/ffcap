# 非凡产研研究文章库

来源账号：<https://news.qq.com/omn/author/21759984>。只访问公开页面与页面实际使用的公开列表请求，不使用登录信息、Cookie 或私有接口。

## 本地更新

在 FFCAP 源码目录执行：

```sh
python3 scripts/research/import_qq.py --workspace .local/private/qq-import-YYYYMMDD --publish-local
node scripts/research/classify.mjs
node --test tests/research.test.mjs
python3 scripts/research/test_import.py
```

这两步用于本地候选版本，须全部完成并验证后再发布；不要在运行中的生产目录执行。脚本不会上传、部署、提交 Git 或安排定时任务。

列表必须读取到 `hasNext=0`，按腾讯文章 ID 去重，遇到分页停滞立即失败。原始列表、HTML、标准化中间文件和异常报告保存到指定私密目录。重试可以加 `--reuse-inventory`，前提是该目录已有读取完整的列表；每篇 HTML 缓存可复用。使用新目录才能重新获取远端最新正文，避免将旧缓存当作最新版本。

`src/content/research/articles/` 保存经过 HTML 白名单清理的站内正文；`catalog.json` 保存服务端全文索引；`highlights.json` 仅包含首页所需的 16 条短摘要。服务端不会将全文索引发送到浏览器。正文保留原文措辞、图片顺序、表格、强调、署名、日期和来源。腾讯平台自己的推荐卡、广告与互动脚本不迁移。视频提供原文观看链接。

## 英文站内全文与每周发现

`/en/research` 和 `/en/research/[slug]` 从 `english-catalog.json` 与 `english-articles/*.json` 读取已保存的英文全文，页面本身不需要现场请求 Substack 才能呈现文字。导入器 `import-substack-fulltext.mjs` 使用 `english-substack.json` 的固定公开归档清单；`--catalog-only` 只从已有正文重建目录，`--refresh` 重访清单内的原始公开页面。它必须确认游客态全文、`isAccessibleForFree=true`、标题和日期，并拒绝不足 100 字的正文。每篇保留来源、署名、HTML 指纹；`verify-english.mjs` 验证本地 HTTP 路由。

周一任务通过 `discover-substack.mjs` 完整读取公开归档分页，用 RSS 交叉核对最新条目。发现快照只写入本机私密目录；执行时用 `--previous-archive`、`--published-catalog` 指向**当时线上版本**的非秘密内容快照，不依赖可能过时的本地源码。来源缺页、数量下降、旧 slug 消失或冲突时停止英文更新。2026-09-28 实测归档仍为 352 条、站内完整英文稿仍为 351 篇，本次没有新稿。

导入前从线上版本复制 `english-substack.json`、`english-catalog.json`、`english-highlights.json` 和现有 `english-articles/` 到本机私密隔离目录。对发现的新 slug、归档元数据实质变化及近期旧稿，用 `import-substack-fulltext.mjs --source-path ... --output-dir ... --catalog-path ... --highlights-path ... --report-path ... --only-slugs slug1,slug2` 访客态重读原稿；以上参数都必须指向隔离目录。脚本按来源完整性规则抓取正文，以原子写入保存新稿或修订；正文严重缩短或图片数下降时保留旧稿并记失败。`--catalog-only` 只重建目录，不能当作来源更新。

随后用 `build-english-overlay.mjs --baseline-dir ... --staged-dir ... --discovery ... --overlay-dir ... --manifest ...` 比较线上基线和隔离内容。它要求新稿有完整正文、游客免费可读证据、署名、日期、来源、HTML 指纹及有效目录；旧稿不能丢失或退化。无实质变化时返回 `status=unchanged`，不生成发布清单；有变化时只列出英文正文、目录、首页英文精选和来源快照的精确文件。将这些文件与当周中文/活动变更合并进同一个从线上版本创建的候选，仍须经过构建、3100 canary、正式 HTTPS 验证与失败回滚。`verify-english.mjs <origin> --content-dir <隔离目录> --changed-slugs <本次slug>` 逐篇检查新稿或修订的全文、Markdown、搜索、metadata、站点地图、来源和图片；现有英文旧稿回归也保留。没有新增或修订时无需发布英文文件。

这套发现流程只覆盖 Unique Research Substack 的公开英文原稿，不翻译中文文章，也不自动建立中英关联。以后若有经编辑核准的 FFCAP 本地英文稿，须先为该来源建立独立的身份、审核和差异规则。当前正文保存在本站，145 张正文图仍引用来源 CDN。（原验收记录在 Mac 项目目录 `04_开发与验证/2026-09-28_英文周更接入验收.md`，未入库。）

## 自动分类与检索

`taxonomy.mjs` 按标题、正文前部和全文关键词加权，生成 4 个方向、6 个内容类型及最多 8 个主题标签。方向允许多个；默认主方向用于列表展示。类别为 Agentic AI、Physical AI、Entertainment AI、产业与商业；类型为研究与观点、访谈与对话、榜单与数据、公司与融资、活动回顾、活动与公告。

这是确定性的词表规则分类，并非调用远端大模型。`overrides.json` 保存已核查的例外，重新分类时保留。新增词表或例外后运行 `classify.mjs`，无需重新抓取原文。

`/research` 支持 `q/topic/type/tag/year/sort/page`，多个筛选条件取交集。关键词经大小写、全半角和空白规范化；空格分词要求每个词都命中，支持少量中英文同义词。正文及元数据均可检索，图片内文字未做 OCR。分页 18 条；不存在的文章返回 404。文章详情有主题标签、原文链接、相关文章、独立元数据与结构化数据；站点地图包含可读取正文的文章。

## 来源缺口

`import-report.json` 区分列表/导入流程完整与原始内容完整。2026-09-06 核查到 1,264 条记录，其中 4 篇原始网页正文为空或只剩署名，4 篇部分图片占位符没有对应地址。这些页面显示缺口提示，不能将它们称为完整恢复。12 篇以图片为主，保留原图并说明图片文字不参与全文搜索。视频保持腾讯来源链接，不复制播放器或猜测视频文件地址。

## 验证与发布

现有 `next lint` 与仓库 flat 配置存在兼容问题：Next 14.1.3 会进入首次配置提示。针对变更文件使用 ESLint Node API，显式传入 `useEslintrc: false, overrideConfig: { extends: ['next/core-web-vitals'] }`；不把配置提示视作检查通过。

```sh
npm run typecheck
npm test
FFCAP_VALIDATION_DIR=.next-research npm run build
FFCAP_VALIDATION_DIR=.next-research npm run start -- --hostname 127.0.0.1 --port 4319
```

独立构建缓存不会覆盖原有预览。生产发布包不包含本地 `next.config.js`、package/lock、环境、数据库、middleware、世界资产或其他未发布改动。生产发布需要单独确认，采用现有 release 作为基线生成候选版本并保留回滚点。


## 云端执行（2026-10-18 起）

周更已迁到 Grok Bot 云电脑执行，完整步骤见 `docs/weekly/README.md` 与 `docs/weekly/publish-rollback.md`。要点：

- 每次先查询线上 PM2 实际 release，以它的 `src/content` 作为基线建立隔离候选；仓库内容快照可能落后于线上，不能据此覆盖线上。
- 私密快照、抓取缓存和运行记录放在 `.local/`（已被 `.gitignore` 忽略）或 `FFCAP_PRIVATE_DIR` 指向的仓库外目录。
- 活动同步优先用 `scripts/events/sync-uniquebloom-sxq.mjs`（苏小强 CLI `sxq` 只读查询）；旧的 `sync-uniquebloom.mjs`（`superun` CLI）保留作备用。CLI 返回 `fetch failed` 时不得当作来源为空，也不得推进成功基线。

历史发布目录中的脚本带固定日期、候选和回滚路径，只用作实现参考，不直接重放。
