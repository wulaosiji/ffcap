# FFCAP 每周内容更新工具链

每周一 10:00（Asia/Shanghai）更新 ffcap.cn 的中文文章、英文文章和活动。2026-10-18 起由 Grok Bot 云电脑执行，Mac 本地不再是必需环境。发布/回滚步骤见 `publish-rollback.md`，记录模板见 `release-record-template.md`。

## 来源（只读）
| 内容 | 来源 | 脚本 |
|---|---|---|
| 中文 | 腾讯新闻「非凡产研」 https://news.qq.com/omn/author/21759984 | `scripts/research/import_qq.py`、`classify.mjs` |
| 英文 | Unique Research Substack 公开归档 https://uniqueresearch.substack.com/archive | `discover-substack.mjs` → `import-substack-fulltext.mjs --only-slugs` → `build-english-overlay.mjs` |
| 活动 | UniqueBloom（Superun）`activities` 表，仅 `is_visible=true` 公开字段 | `scripts/events/sync-uniquebloom-sxq.mjs`（备用：`sync-uniquebloom.mjs`） |

不翻译中文稿、不自动建立中英对应；不读取报名/联系人/运营字段，不回写来源。

## 运行环境
- Node 22（与生产 22.22.2 一致）、Python 3（仅标准库）、`npx agent-browser`（英文全文导入）、`sxq`（苏小强 CLI，已登录并在 `FFCAP_UNIQUEBLOOM_LINK_DIR` 下 `sxq link` 到 UniqueBloom）、`sshpass`（仅密码登录时）。
- 环境变量名见 `.env.example`。值不入库、不写进文档或聊天。
- 私密快照、抓取缓存（腾讯 HTML、列表页）、指纹与运行记录一律放 `.local/` 或 `FFCAP_PRIVATE_DIR`，不提交。

## 每周流程（摘要）
1. `scripts/weekly/ffcap-ssh.sh 'pm2 describe ffcap'` 确认线上 release。
2. 把线上 release 的 `src/content` 打包流式拉到私密目录作为**基线**（`ssh ... "tar czf - src/content" | tar xzf -`；不要逐文件 scp，太慢）。
3. 中文：完整读取列表到 `hasNext=0`，与基线 catalog 比较；只抓新增/变化正文，合并后用 taxonomy 分类并重建 `highlights.json`（字段：id/slug/title/excerpt/topic/type/tags/publishedAt）。随后运行 `node scripts/weekly/generate-home-hero-stats.mjs --repo <候选根目录>`，在候选内生成 **不入库** 的 `src/content/research/home-hero-stats.local.json`（刷新首页 Hero 融资/订阅数据卡口径；`catalog.length` 与活动卡仍由 classify / 活动同步自动更新）。
4. 英文：`discover-substack.mjs --previous-archive <基线>/english-substack.json --published-catalog <基线>/english-catalog.json --output <私密>/english-discovery.json`；对新 slug 用 `import-substack-fulltext.mjs` 的隔离参数导入；`build-english-overlay.mjs --baseline-dir <基线根目录，非 research 子目录>` 生成精确白名单。
5. 活动：`sync-uniquebloom-sxq.mjs <候选>/src/content/editorial.events.mjs`；只比较内容指纹，忽略 `syncedAt`。无实质变化时恢复基线文件，避免空发布。
6. 三类都无变化：写报告并停止，不构建、不发布、不发消息。
7. 有变化：白名单只含 `src/content/research/**` 与 `src/content/editorial.events.mjs`；候选内 `npm ci`（含 devDependencies，否则缺 `@types/three` 类型检查失败）+ `npm run build`，3100 canary 后按 `publish-rollback.md` 发布。
8. 发布成功后 `scripts/weekly/verify-formal.py` 正式读回；任一失败即回滚。

## 已知限制
- 云电脑到生产机上传带宽很低（约 30KB/s），scp 可能卡住；用 `ssh host 'cat > /tmp/x' < file`。
- 中文增量合并不会发现旧稿修订；需要时用新的私密目录跑完整 `import_qq.py`。
- 飞书「内容中心」发送尚无云端连接器；企微走已授权连接器。群消息只在正式读回通过后发送，按发布版本与平台去重。
