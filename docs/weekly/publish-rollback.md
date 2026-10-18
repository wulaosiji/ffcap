# 周更发布与回滚（生产 47.100.55.67）

每一步都需要用户对本次发布的明确批准；Git push、Nginx、DNS、依赖与庭院改动不在周更范围内。

## 发布前
1. **发布锁**：`mkdir /www/wwwroot/ffcap-publish.lock`（失败即有他人发布，停止），写入 owner 文件。
2. **复核基线**：PM2 `ffcap` 的 `pm_exec_path` 必须仍是生成候选时的 release；对基线中被修改文件做 `sha256sum -c`。不一致则停止并重建候选。
3. **回滚点**：记录当前 release 路径到私密状态目录。
4. **新 release**：`cp -a <live> /www/wwwroot/ffcap-releases/YYYYMMDD-weekly-vN`，删除其中 `.next`，解包白名单 overlay；`diff -rq --exclude=.next --exclude=node_modules` 只应出现白名单文件。`import.env` 保持原 symlink，不读取、不复制内容。
5. **构建**：`PATH=/www/wwwroot/ffcap-runtime/node-v22.22.2/bin:$PATH npm run build`。
6. **Canary**：用与生产相同的 interpreter 和 `--require /www/wwwroot/ffcap-migration-20261014/bind-loopback.cjs`、`PORT=3100` 以独立 PM2 名启动；检查首页、研究库、health、sitemap 与每篇新稿页面/Markdown；结束后 `pm2 delete` canary。

## 切换
写 `ecosystem.production-<release>.json`（name `ffcap`、PORT 3000、同 interpreter/node_args/日志路径、autorestart），`pm2 delete ffcap && pm2 start <file>`，等待 `127.0.0.1:3000/api/health`，`pm2 save`。

## 正式读回（https://ffcap.cn）
`python3 scripts/weekly/verify-formal.py --content-dir <候选>/src/content --cn-slugs ... --en-slugs ... --ga4-id G-JP9FNSTQYM --out <私密>/formal-readback.json`
覆盖首页、中英文研究库、health、活动入口、sitemap、搜索、四个静态入口、GA4，以及每篇新稿的全文/Markdown/metadata/canonical/来源链接/图片。另确认 Nginx `proxy_cache off` 未变。

## 失败回滚
任一正式检查失败：用回滚点 release 重写 ecosystem 并 `pm2 delete ffcap && pm2 start`，`pm2 save`，再跑首页/health/研究库 HTTPS 读回确认恢复。不推进成功基线，不发群消息。

## 收尾
成功：写成功记录（来源读取时间、内容指纹、数量、release、回滚点、验证结果），删除 `/tmp` 临时包，`rm -rf /www/wwwroot/ffcap-publish.lock`。
