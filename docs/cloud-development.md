# 云开发交接

## 基线

初始源码来自 `47.100.55.67` 当前活动 release `20261015-ga4-v1`（构建 `EN67UDRMog2Rwij13zFBd`）。只读取 2,090 个明确列出的非秘密源码/内容/资产文件；另外读取 Nginx 独立目录中的四个公开 HTML 入口。没有读取环境文件、私钥、证书或进程环境。

相对线上源码，仅新增云开发配置、说明与统计测试；为 `package.json` 增加检查命令和 Node 版本约束，修正活动测试对旧数量与可变源状态的依赖，迁移英文导入报告的默认输出到仓库内忽略目录 `.local/reports/`。网页代码、文章、活动、统计运行代码和庭院资产与线上一致。

初次提交使用无父提交的新历史，旧本地 main 和所有旧提交原样保留。GitHub 公开仓库只接收这份已核验的基线，避免带入旧配置历史或未发布美术候选。

## 云环境设置

1. 在 Codex 的 `Work in > Cloud` 中创建环境并选择 `wulaosiji/ffcap`。
2. 使用 Node.js 22.22.2，安装命令 `npm ci --no-audit --no-fund`。允许包管理器联网。
3. 执行 `npm run test:content`、`npm run build`、`npm run typecheck`。
4. 预览使用 `npm run dev -- --hostname 0.0.0.0 --port 3000`；确认服务就绪后测试 `/`、`/research`、`/en/research` 以及中英文文章和 Markdown。
5. 保存并 Publish 环境，确认界面显示已发布，再在新云任务中复测仓库与启动流程。配置文件存在不等于云环境已发布。

公开页面构建、内容搜索和庭院资产读取不需要生产秘密。飞书接口、UniqueBloom 来源访问和其他集成需要各自授权；没有配置时记录未验收，不复制生产凭据。预览域名不会触发正式站 GA4 收集。

官方操作说明：https://learn.chatgpt.com/docs/environments/cloud-environments

## 变更与发布

云任务从 main 新建 `codex/<task>` 分支，修改后执行相应检查并提交 PR。当前 CI 验证 25 项内容/统计测试、生产构建和类型检查；不等同于完整庭院视觉或真实手机验收。涉及庭院时另外执行 `npm run test:world` 并完成对应交互检查。

合并与生产发布分别授权。目前没有自动部署 workflow，也没有在 GitHub 或 Codex 配置生产 SSH 权限。后续若接入 GitHub Actions 发布，应先准备受控候选、源码指纹、回滚和正式读回脚本，再单独授权安装部署权限并演练。

线上 PM2 使用 Node 22.22.2，并通过现有 loopback preloader 限定监听 `127.0.0.1:3000`；preloader、PM2、Nginx、TLS 和 `import.env` 是服务器运行配置，不属于此次源码迁移。不得用 README 中的预览启动方式直接替换生产配置。

四静态入口位于 `/var/www/postify/`，源码归档在 `ops/static-entries/`。它们独立于 Next.js 发布，保留 450ms 跳转、参数传递和异步统计；普通代码发布不能覆盖掉这四项能力。

## 内容更新的范围

本仓库包含当前已发布内容与生产保留的导入/验证脚本。现有周更任务、腾讯来源抓取器、Substack 发现/叠加工具、浏览器工具和 Superun 登录等仍在原维护体系内，此次未迁移定时执行器或访问凭据。英文阅读已在站内完成；不能因为云环境可以构建，就宣称内容周更已脱离原电脑。后续迁移周更需要单独移入完整工具链、授权来源访问并演练来源失败时保留旧内容。
