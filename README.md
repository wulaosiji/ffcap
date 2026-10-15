# FFCAP · UniqueCapital

FFCAP 官网：中英文研究、活动、产品与 R56 庭院。

## 云开发

在 Codex 的 `Work in > Cloud` 创建环境，选择 `wulaosiji/ffcap`。使用 Node.js 22.22.2；安装命令为 `npm ci`。完成环境自检并发布环境后，再开始新任务。

常用命令：

```sh
npm ci
npm run test:content
npm run typecheck
npm run build
npm run dev -- --hostname 0.0.0.0 --port 3000
```

云环境使用独立分支 `codex/<task>`，通过 PR 审查改动。GitHub Actions 对 PR 和主分支执行内容/统计测试、类型检查及构建。庭院改动另跑 `npm run test:world` 和相应视觉/交互验收；具体覆盖范围见 `docs/cloud-development.md`。

## 内容与运行

- `src/content/research/`：已发布中英文正文与目录；页面与 Markdown 使用同一内容。
- `public/`：字体、图片、庭院运行资产；它们是运行必需文件。
- `ops/static-entries/`：线上 Nginx 独立服务的四类入口源码，含现有统计代码。常规 Next.js 构建不会自动安装它们。
- `scripts/`、`tests/`：生产保留的导入、验证及回归检查。

公开页面无需生产凭据即可构建和预览。Funding Agent 等飞书业务接口需要授权环境变量；未配置时不能宣称外部业务接口已验收。不要把生产 `import.env`、SSH 私钥、TLS 文件放入云开发环境或 Git。

这份初始基线取自 2026-10-15 在线 release `20261015-ga4-v1`，保留最新统计、中英文内容和 R56 模型。旧本地开发历史和未发布候选独立保留，没有混入本基线。

生产运行于 `47.100.55.67`，PM2 `ffcap`。代码合并与生产发布是两个步骤；本仓库尚未配置自动生产部署。发布规则见 [AGENTS.md](AGENTS.md) 与 [云开发交接](docs/cloud-development.md)。
