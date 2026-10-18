# 原 Mac 项目级规则（归档，2026-10-18 迁入）

> 来自 Mac 项目根的 AGENTS.md。文中 `00_入口/`…`11_本机私密资料库/` 等目录在 Mac 本地，未入库；`~/.ssh/aliyun_ffcap` 仅为本机密钥路径，私钥本身不在仓库。现行规则以仓库根 `AGENTS.md` 和 `docs/weekly/` 为准。


## Scope

This project manages product work, source governance, validation, and production operations for `ffcap.cn` (UniqueCapital / 非凡资本). The source checkout is `02_代码库/ffcap`; production runs behind Nginx and PM2 `ffcap` on `47.100.55.67` as of 2026-10-14. The previous host `106.15.233.217` is retained as a rollback copy, not the target for routine releases.

## Context Router

Read only the documents relevant to the task:

- Current courtyard candidate and unresolved acceptance work: `04_开发与验证/当前候选验收缺口_20260911.md`.
- 2026-09-24 online-visual-baseline decision and rejected local Physical-room road studies: `04_开发与验证/线上庭院第二房局部通路复核_20260924.md`.
- Accepted courtyard objective, layout, reuse, and stopping rules: `04_开发与验证/庭院重规划目标_20260909.md` and `04_开发与验证/庭院重规划_复用清单与白模_20260909.md`.
- Specific implementation work: the matching plan or validation record under `04_开发与验证/`.
- Production state, release scope, and rollback: the matching record under `05_发布与运维/`.
- GA4 tracking and Search Console ownership, verification, and rollback: `05_发布与运维/2026-10-15_FFCAP接入GA4与GSC.md`.
- `00_入口/项目状态.md` includes the latest production pointer and historical stage records; use the newest matching dated release record for runtime and rollback details.

Do not read all historical plans or release records for an unrelated edit. When dated text conflicts, use the latest explicit user decision and the newest matching current-state document.

## Current Courtyard Contract

- Production snapshot on 2026-10-14 preserves the already deployed R56 island, two guided rooms, and the closed third room. This supersedes the older one-room production descriptions below. The server migration does not publish a local art candidate or change the model. See `05_发布与运维/2026-10-14_FFCAP官网迁移至47.100.55.67.md` for the release and model fingerprints.

- Latest user choice (2026-09-24): the deployed irregular island is the visual baseline and is more complete than the local round/Y reconstruction. Do not replace it wholesale with r75. The local r14 second-room route is a functional study only and failed visual acceptance; production keeps the second room closed. Later accepted revisions below remain layout references, not authorization to publish r14 or overwrite the deployed island.
- The accepted layout uses round room envelopes and an upright Y route: a central stem with two upper branches; the bridge joins from the right; the robot starts on the inner-bank stem and does not have to cross the bridge first.
- Retain the large tree on the room as part of the planted roof composition and preserve the accepted aerial design. This overrides older ground-tree or no-roof wording.
- Preserve continuous wall cores while keeping real door and window openings. Reuse approved interiors, furniture, materials, robot, vegetation, island, bridge, and prior assets before creating new final art.
- The local reconstruction planned two guided rooms and a closed northern third room; the deployed visual baseline still opens only the original room. Do not describe either local study as a production opening. Visible ground, water, route, and collision must agree before any new room is accepted.
- Current model hashes, preview ports, open defects, and device coverage live in the current-candidate document, not here.
- Courtyard work is local-only unless the user explicitly authorizes a named release. Preserve the stable local candidate, production, and all prior sources; no automatic deployment or Git push.

## Workspace

- `00_入口/`: current status and next actions.
- `01_服务器/`: non-secret connection helpers and sanitized server baselines.
- `02_代码库/`: the complete source checkout and repository notes.
- `03_产品与需求/`: product and page decisions.
- `04_开发与验证/`: plans, implementation evidence, and local acceptance.
- `05_发布与运维/`: release preparation, release records, and production readback.
- `10_参考资料/`: public references and source index.
- `11_本机私密资料库/`: local-only credentials, environments, private exports, and sensitive snapshots; never commit or share it.

## Source And Content Boundaries

- Preserve `02_代码库/ffcap` as one repository, including `.git`, branches, dirty files, and ignored environments. Do not create a competing checkout while it contains uncommitted work.
- Do not assume GitHub, Gitee, local source, or production is authoritative until the relevant commits and dirty diffs are compared.
- UniqueBloom is the source of truth for public activity content. Read it through the documented `superun` CLI and expose only public `is_visible=true` data; retain ended public history and never include attendee or operations data.
- Public claims, links, and editorial content must remain source-backed. Do not fabricate people, research, portfolio claims, or metrics.
- Redirect entry URLs use `https://ffcap.cn/report.html`, `/bp.html`, `/open.html`, and `/rankings.html` as of 2026-09-13. Preserve report/project `id` and activity `slug` parameters; Chengdu uses `https://ffcap.cn/open.html?slug=cd2026`. Do not generate new postify.cc entry links. Existing direct UniqueBloom public event URLs remain source links. See `05_发布与运维/2026-09-13_四类跳转入口迁入FFCAP.md` for deployed redirect behavior.
- Existing runtime behavior is governed by nearby tests and implementation records. Open those only when changing that subsystem.

## Production And Secrets

- Treat `47.100.55.67` as live production. Default server inspection is read-only and sanitized. Use `01_服务器/ssh-connect.sh`; the previous host remains available only for rollback or explicitly requested inspection.
- Never expose or copy `.env`, `import.env`, private keys, tokens, cookies, or secret-bearing process environments.
- One-time exception explicitly approved by the user on 2026-10-14: migrate the existing `import.env` and TLS certificate/private key from `106.15.233.217` to `47.100.55.67` over encrypted SSH, and install the existing FFCAP public maintenance key on the target. Do not reuse this exception for another destination or later secret transfer; never print or commit the contents.
- Preserve the legacy dirty production checkout and existing releases. Capture a sanitized baseline before proposing a mutation.
- The 2026-10-15 analytics release is `/www/wwwroot/ffcap-releases/20261015-ga4-v1`; inspect PM2 for later releases. Preserve its manual, query-free page-view tracker and the four instrumented static entry pages during content updates. GA4 enhanced measurement is off to avoid duplicate route views. The existing local Git checkout is not an analytics deployment baseline.
- FFCAP's proxy location explicitly sets `proxy_cache off` so inherited server caching cannot serve an earlier release's HTML. Preserve this setting during maintenance; do not clear or change other sites' shared cache. HTTPS `www.ffcap.cn` currently serves the same page with root-domain canonical metadata.
- Upload, dependency installation, build, file replacement, PM2/Nginx changes, cron changes, server Git operations, DNS changes, and deployment each require explicit approval for that exact action.
- Use `~/.ssh/aliyun_ffcap` with `IdentitiesOnly=yes`, `BatchMode=yes`, and `StrictHostKeyChecking=yes` for automated read-only checks. Do not modify SSH or server authentication settings without approval.

## Git And Release

- Local edits, local commit, Git push, source synchronization, build, canary, service switch, and public release are separate states.
- Preserve unrelated changes in both the shared active-project repository and the nested FFCAP repository.
- A release needs an approved allowlist, source fingerprint, rollback point, validation record, and post-switch HTTP plus affected-workflow readback. A successful build, SSH command, PM2 status, or single HTTP response is not release proof.
- Git push and every production mutation require explicit approval.

## Validation

- Run checks proportional to the affected subsystem; do not rerun the full 3D, mobile, content, and production matrix for an unrelated narrow edit.
- For courtyard changes, validate the same final model/build across fixed views, guided entry/return, visible geometry versus collision, loading poster, relevant desktop/mobile coverage, and recorded residual gaps.
- Distinguish generated references, Blender renders, local previews, simulated mobile viewports, real-device checks, release preparation, deployment, and public readback.
- Before claiming a milestone complete, verify the requested behavior, affected tests/type/build checks, final diff or manifest, and the appropriate local or public workflow.
