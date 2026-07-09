# Local chromium full matrix — 2026-05-15 (phase ① only)

**阶次：** 仅 **① 本地**（`playwright.config` · `project=chromium` · 全量 `e2e/**/*.spec.ts`，与 **[TT-LOCAL-FULL-E2E-MATRIX-001](../../docs/runbook/TT-LOCAL-FULL-E2E-MATRIX-001.md)** 同集合）。**不**替代 **93 / 96-20 / 31** 文档矩阵、**不**替代 **②③** 或 **[TT-GATE](../../docs/runbook/TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)** 深度面。

## 命令与出口

```bash
# repo root
source scripts/dev/export-database-url-from-root-env.sh
bash scripts/gates/local-e2e-chromium-full-matrix.sh 2>&1 | tee evidence/local-full-chromium-matrix-20260515/e2e-chromium-matrix-20260515-console.txt
```

**本目录已落盘：** 同次运行的完整控制台 **`e2e-chromium-matrix-20260515-console.txt`**（扩展名 **`.txt`**：根 **`.gitignore`** 对 **`*.log`** 全局忽略，仅 **`evidence/**/forge_*.log`** 白名单）。

| 项 | 值 |
|----|-----|
| **Playwright 汇总** | **327 passed** · **13 skipped** · **0 failed**（约 **44.9m** 列表计时） |
| **闸脚本** | **`OK: local-e2e-chromium-full-matrix`**（外层 `exit 0`） |
| **NODE heap** | **`--max-old-space-size=16384`**（矩阵脚本 + `run-e2e-default.mjs`） |
| **P3** | **`P3_CHAIN_OFF=1`**（chromium mock-pay 契约；根 `.env` 曾为 `0` 时由 runner 对齐） |

## 错误清单（失败项）

- **失败用例数：0** → **无「失败错误清单」**（无 `error-context.md` 新条目可归档）。
- **13 skipped**：**不是**回归失败；常见含 **`public_video_publish_ready=false`** 时的 MinIO 浏览器证据用例等（见 **`docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md`**、**`e2e/community-publishdrawer-minio-evidence.spec.ts`** 头注释）。若要**逐条 skipped 原因**，下一轮建议 **`cd frontend && npm run e2e:full-chromium:list`** 全尾 **`tee`**，或跑完后在**未清理**前提下打开 **`frontend/playwright-report/index.html`**（目录默认 **gitignore**，不入仓）。

## L1–L3 对照（本轮日志侧）

| 历史形态 | 本轮 |
|----------|------|
| L1 MinIO / `:19000` / `public_video_publish_ready` 硬失败 | 日志侧**未见**该类断言失败；MinIO 证据用例处矩阵**快速前进**（与 **skip** 一致） |
| L2 Node heap OOM → Next `:3012` 级联 | **未见** `JavaScript heap out of memory`；已注入 **16384** |
| L3 无存储时视频 tab 长超时 | **0 failed**；与 capabilities **skip** 设计一致 |

## 长期 backlog（与本轮 exit 0 独立）

推进 **G/H/A/R** 仍以真源为准，**勿**用本目录 **exit 0** 冒充收口：

- **G / H**：**[TT-GATE](../../docs/runbook/TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)**、**[TT-31-STRUCTURED-GAP-CATALOG-001](../../docs/runbook/TT-31-STRUCTURED-GAP-CATALOG-001.md)**
- **A**：**[TT-NEXT-BATCH-BACKLOG-001](../../docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md)** §A～§D
- **R（②③）**：**[96-18](../../docs/spec/96-18-未完成清单与多维检查.md)**、**[缺口与待补-官方总表](../../docs/spec/缺口与待补-官方总表.md)**、**[go-live-checklist](../../docs/go-live-checklist.md)**

## 复跑提示

- 须 **`DATABASE_URL`**（已 **migrate** 的 PG）；见 **`scripts/gates/local-e2e-chromium-full-matrix.sh`** 头注释。
- Playwright 曾提示 **`smoke.spec.ts` 偏慢**；属性能提示，非失败。

## 分层验收 · 建议推进序（归档后）

**本轮 ① 全矩阵绿** 仅证明 **`chromium` 全 spec** 在当前 PG/环境下 **0 failed**；**不**等价 **A 全批次落地**、**G/H 深覆盖收口**、**R ②③ 留证**。叙述须带阶次标签（与 **[TT-LOCAL-FULL-E2E-MATRIX-001](../../docs/runbook/TT-LOCAL-FULL-E2E-MATRIX-001.md)**、**[TT-GATE](../../docs/runbook/TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)** 同键）。

| 层 | 推进抓手 | 真源 / 入口 |
|----|----------|-------------|
| **① · A** | 按 **A1→A8** 拆 PR；每批 **exit 0** 证据写清命令（`run-check-04-routes`、`cargo test` 切片、`test:i18n:ci`、`check:e2e:tsc`、`check-frontend-npm-build` 等） | **[TT-NEXT-BATCH 正文 A 批](../../docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md)** |
| **① · G/H** | 从 **TT-GATE 正文 2～3 节** / **TT-31 目录** 选 **1～2 条 P0 最高** 专项；**专项 E2E + 手验 / Tier C** 另表，**勿**并入「全矩阵一次绿」 | **[TT-GATE](../../docs/runbook/TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)**、**[TT-31 目录](../../docs/runbook/TT-31-STRUCTURED-GAP-CATALOG-001.md)** |
| **② · R** | **staging / 测试网**：PSP test、webhook、Onboarding 全链等 — **须环境证据**，与 ① 分开归档 | **[96-18](../../docs/spec/96-18-未完成清单与多维检查.md)**、**[TT-9618](../../docs/runbook/TT-9618-onboarding-local-testnet.md)** |
| **③ · R** | **生产 / go-live**：缺口总表 P0、**Production GO** — **单独闸门** | **[缺口总表](../../docs/spec/缺口与待补-官方总表.md)**、**[go-live-checklist](../../docs/go-live-checklist.md)** |

**防误判口诀：** **① 全矩阵** = 宽自动化回归切片；**G/H** = 文档矩阵 + 深产品 + 交叉手验；**②③** = 真实链路与 PSP — **三者验收结论分开写，禁止跳阶。**
## 机读闸 stderr 提示

自本轮起，**`bash scripts/gates/local-e2e-chromium-full-matrix.sh`** 在打印 **`OK: local-e2e-chromium-full-matrix`** 后向 **stderr** 输出短英文提醒（**① chromium 全 spec 绿 ≠** 93/96-20/31、TT-GATE、NEXT-BATCH A～D、②③）；与 **TT-LOCAL-FULL-E2E-MATRIX** / **TT-GATE** 同键。

## A2 / A3 / A5 切片复验（① · 2026-05-15）

| 命令 | 结果 |
|------|------|
| `cargo test -p traveltrust-api comments_thread::comment_sort_tests` | **6 passed** |
| `cargo test -p traveltrust-api internal_gate_tests` | **9 passed** |
| `npx vitest run`（`communityFeedMappers.likeCollectDisplay` / `commentsAndThreadCounts` / `community.tagUtf8AndCommentsQuery` / `community.posts.createCommentsLikes`） | **40 passed** |
| `bash scripts/run-check-04-routes.sh` | **exit 0** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.90**。**不**等价 **G/H** 或 **②③**。

## A4 切片复验（① · 2026-05-15）

| 命令 | 结果 |
|------|------|
| `cargo test -p traveltrust-api media_upload` | **13 passed** |
| `npx vitest run`（`core.parseResponse.part1` / `PublishDrawer/constants` / `publishActionBlockedKeys`） | **36 passed** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.91**。**不**等价 **G/H** 上传安全全文手验或 **②③**。

## A6 / A8 / A7 切片复验（① · 2026-05-15）

| 命令 | 结果 |
|------|------|
| `cd frontend && npm run test:i18n:ci` | **`[i18n-gate] passed.`** |
| `cd frontend && npm run check:e2e:tsc` | **exit 0** |
| `bash scripts/gates/check-frontend-npm-build.sh` | **OK**（Next **15.5.18** `next build` + `sync-server-chunks`） |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.92**。**不**等价 **96-16** 深度手验、**G/H** 或 **②③**。

## ① 扩充本地闸一轮满跑（2026-05-15）— **仍非「全面」闭包**

| 命令 | 结果 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `cargo test -p traveltrust-api` | **1329 passed** |
| `cd frontend && npx tsc --noEmit -p tsconfig.json` | **exit 0** |
| `cd frontend && npm run test:regional:ci` | **`[regional-matrix-gate] passed.`** |
| `CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E=1 bash scripts/gates/local-delivery-expanded.sh` | **OK**（Vitest **393/2095**；PublishDrawer **5**；Playwright market-community **SKIP**） |
| `bash scripts/gates/e2e-stability-probe.sh` | **OK**（**3 passed**，日志末行 **`e2e-stability-probe: OK`**） |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.93**。

### 刻意 **不** 用本轮结果冒充的「全面」项（真源另册）

- **93** 全文 **MANUAL / NOT RUN**、**96-20** 路由×权限×弹窗穷举、**31** 视频/体验长表  
- **TT-GATE** 社区深产品面、Admin **RBAC** 交叉、**i18n/a11y** Tier C 手验  
- **②** staging（PSP / webhook / 真链烟测）、**③** 生产 **GO** / **缺口总表 P0** 签字留证  

以上须 **专项证据 + 阶次标签**；与 **TT-9628 覆盖边界**、**CONTRIBUTING · no-false-completion** 同键。

## ① 全矩阵 Chromium 复跑（2026-05-15）

| 项 | 值 |
|----|-----|
| 命令 | `source scripts/dev/export-database-url-from-root-env.sh` → `bash scripts/gates/local-e2e-chromium-full-matrix.sh` |
| Playwright | **327 passed** / **13 skipped** / **0 failed**（约 **48.3m**） |
| 闸 | **`OK: local-e2e-chromium-full-matrix`** + **stderr** 分层提醒 |
| 控制台 | **`evidence/local-full-chromium-matrix-20260515/e2e-chromium-matrix-rerun-20260515-console.txt`** |

**配套机读（同轮）**：**`bash scripts/check-invariants.sh`** **OK**；**`python registry/validate-spec-path-dependencies-registry.py`** **OK**。

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.94**。

**仍非「全面」**：与 **v1.0.93** 同键 — **不**覆盖 **93/96-20/31** 文档矩阵、**TT-GATE** 深产品、**②③**。

## ① 机读再扩（2026-05-15 · v1.0.95）

| 命令 | 结果 |
|------|------|
| `cargo test -p traveltrust-core` | **27 passed** |
| `cd frontend && npm run lint` | **exit 0**（`eslint . --max-warnings 0`） |
| `bash scripts/check-e2e-waitforurl-smoke-convergence.sh` | **OK** |
| `bash scripts/check-handbook-frontmatter.sh` | **OK（34 files）** |
| `bash scripts/check-handbook-engineering-content.sh` | **OK（37 engineering/*.md）** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.95**。

**仍非「全面」**：与 **v1.0.93～v1.0.94** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 机读再扩（2026-05-15 · v1.0.96）

| 命令 | 结果 |
|------|------|
| `cargo fmt --all -- --check` | **exit 0** |
| `cargo clippy -p traveltrust-api --all-targets -- -D warnings` | **exit 0**（约 **19s**） |
| `bash scripts/check-handbook-engineering-local-md-links.sh` | **exit 0** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.96**。

**仍非「全面」**：与 **v1.0.93～v1.0.95** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 机读再扩（2026-05-15 · v1.0.97）

| 命令 | 结果 |
|------|------|
| `cargo clippy --workspace --all-targets -- -D warnings` | **exit 0** |
| `bash scripts/dev-preflight.sh` | **OK** |
| `bash scripts/gates/run-tt9628-doc-hygiene-rg-bundle.sh` | **OK** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.97**。

**仍非「全面」**：与 **v1.0.93～v1.0.96** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 机读再扩（2026-05-15 · v1.0.98）

| 命令 | 结果 |
|------|------|
| `cargo build --workspace` | **exit 0** |
| `TRAVELTRUST_CARGO_AUDIT_NO_FETCH=1 bash scripts/audit-deps.sh` | **OK** |
| `cd frontend && npm run check:search-params-suspense` | **`[check-use-search-params-suspense] ok`** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.98**。

**仍非「全面」**：与 **v1.0.93～v1.0.97** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 机读再扩（2026-05-15 · v1.0.99）

| 命令 | 结果 |
|------|------|
| `cargo test --workspace` | **1329 + 27 passed** |
| `CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E=1 bash scripts/gates/local-delivery-expanded.sh` | **OK**（Vitest **393/2095**；PublishDrawer **5**；market-community **SKIP**；**~128s**） |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.99**。

**仍非「全面」**：与 **v1.0.93～v1.0.98** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 再扩（2026-05-15 · v1.0.100）

| 命令 | 结果 |
|------|------|
| `bash scripts/gates/e2e-stability-probe.sh` | **OK**（**3 passed**；**~135s**；末行 **`e2e-stability-probe: OK`**） |
| `bash scripts/run-check-04-routes.sh` | **exit 0** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.100**。

**仍非「全面」**：与 **v1.0.93～v1.0.99** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 机读再扩（2026-05-15 · v1.0.101）

| 命令 | 结果 |
|------|------|
| `bash scripts/check-invariants.sh` | **OK** |
| `python registry/validate-spec-path-dependencies-registry.py` | **OK** |
| `cd frontend && npm run test:i18n:ci` | **`[i18n-gate] passed.`** |
| `cd frontend && npm run test:regional:ci` | **`[regional-matrix-gate] passed.`** |
| `cd frontend && npm run check:e2e:tsc` | **exit 0** |
| `bash scripts/gates/check-frontend-npm-build.sh` | **OK**（**~82s**） |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.101**。

**仍非「全面」**：与 **v1.0.93～v1.0.100** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 扩充闸含 Playwright 尾段（2026-05-15 · v1.0.102）

| 命令 | 结果 |
|------|------|
| `source scripts/dev/export-database-url-from-root-env.sh` → `env -u CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E bash scripts/gates/local-delivery-expanded.sh` | **OK**（Vitest **393/2095**；PublishDrawer **5**；尾段 **42 passed / 2 skipped**；**全闸 ~307s**） |

对照：未 `source` **`DATABASE_URL`** 时尾段按 **TT-LOCAL** §**2.2** **SKIP**，与 **`CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E=1`** 显式跳过原因不同。

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.102**。

**仍非「全面」**：与 **v1.0.93～v1.0.101** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 全 chromium E2E 矩阵（2026-05-15 · v1.0.103）

| 项 | 值 |
|----|-----|
| 命令 | `source scripts/dev/export-database-url-from-root-env.sh` → `bash scripts/gates/local-e2e-chromium-full-matrix.sh` |
| Playwright | **327 passed** / **13 skipped** / **0 failed**（**约 47.7m**） |
| 闸 | **`OK: local-e2e-chromium-full-matrix`** + **stderr** 分层提醒 |
| 控制台 | **`evidence/local-full-chromium-matrix-20260515/e2e-chromium-matrix-20260515-v103-console.txt`** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.103**。

**仍非「全面」**：与 **v1.0.93～v1.0.102** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 矩阵后复验切片（2026-05-15 · v1.0.104）

| 命令 | 结果 |
|------|------|
| `cargo test -p traveltrust-api` | **1329 passed** |
| `bash scripts/check-e2e-waitforurl-smoke-convergence.sh` | **OK** |
| `cd frontend && npx tsc --noEmit -p tsconfig.json` | **exit 0** |
| `cd frontend && npm run lint` | **exit 0** |
| `bash scripts/check-handbook-frontmatter.sh` | **OK（34）** |
| `bash scripts/check-handbook-engineering-content.sh` | **OK（37）** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.104**。

**仍非「全面」**：与 **v1.0.93～v1.0.103** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 机读再扩（2026-05-15 · v1.0.105）

| 命令 | 结果 |
|------|------|
| `cargo test -p traveltrust-core` | **27 passed** |
| `bash scripts/check-handbook-engineering-local-md-links.sh` | **exit 0** |
| `bash scripts/run-check-04-routes.sh` | **exit 0** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.105**。

**仍非「全面」**：与 **v1.0.93～v1.0.104** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 发布态扩充闸切片（2026-05-15 · v1.0.106）

| 命令 | 结果 |
|------|------|
| `cargo fmt --all -- --check` | **exit 0** |
| `source scripts/dev/...` + `CI_LOCAL_RELEASE_STATE_GATES=1 CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E=1 bash scripts/gates/local-delivery-expanded.sh` | **OK**（**全闸 ~160s**；**`[RELEASE_STATE]`** 串 **i18n** → **e2e:tsc** → **Next build**；尾段 **SKIP**） |

完整命令前缀：**`source scripts/dev/export-database-url-from-root-env.sh`**。

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.106**。

**仍非「全面」**：与 **v1.0.93～v1.0.105** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 机读再扩（2026-05-15 · v1.0.107）

| 命令 | 结果 |
|------|------|
| `bash scripts/check-invariants.sh` | **OK** |
| `python registry/validate-spec-path-dependencies-registry.py` | **OK** |
| `source scripts/dev/export-database-url-from-root-env.sh` + `bash scripts/gates/e2e-stability-probe.sh` | **OK**（**3 passed**；**全闸 ~125s**） |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.107**。

**仍非「全面」**：与 **v1.0.93～v1.0.106** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 叙事互扫 + 依赖审计（2026-05-15 · v1.0.108）

| 命令 | 结果 |
|------|------|
| `bash scripts/gates/run-tt9628-doc-hygiene-rg-bundle.sh` | **OK** |
| `TRAVELTRUST_CARGO_AUDIT_NO_FETCH=1 bash scripts/audit-deps.sh` | **OK** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.108**。

**仍非「全面」**：与 **v1.0.93～v1.0.107** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① workspace 机读复验（2026-05-15 · v1.0.109）

| 命令 | 结果 |
|------|------|
| `cargo clippy --workspace --all-targets -- -D warnings` | **exit 0** |
| `cargo test --workspace` | **1329 + 27 passed** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.109**。

**仍非「全面」**：与 **v1.0.93～v1.0.108** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 预检 + workspace 构建（2026-05-15 · v1.0.110）

| 命令 | 结果 |
|------|------|
| `bash scripts/dev-preflight.sh` | **OK** |
| `cargo build --workspace` | **exit 0** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.110**。

**仍非「全面」**：与 **v1.0.93～v1.0.109** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 轻量机读（2026-05-15 · v1.0.111）

| 命令 | 结果 |
|------|------|
| `cargo fmt --all -- --check` | **exit 0** |
| `cd frontend && npm run check:search-params-suspense` | **`[check-use-search-params-suspense] ok`** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.111**。

**仍非「全面」**：与 **v1.0.93～v1.0.110** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 契约 + E2E 收敛短闸（2026-05-15 · v1.0.112）

| 命令 | 结果 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `bash scripts/check-e2e-waitforurl-smoke-convergence.sh` | **OK** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.112**。


## ① A7 + handbook 三门禁（2026-05-15 · v1.0.114）

| 命令 | 结果 |
|------|------|
| `bash scripts/gates/check-frontend-npm-build.sh` | **OK**（**约 80s**） |
| `bash scripts/check-handbook-frontmatter.sh` | **OK（34）** |
| `bash scripts/check-handbook-engineering-content.sh` | **OK（37）** |
| `bash scripts/check-handbook-engineering-local-md-links.sh` | **exit 0** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.114**。

**仍非「全面」**：与 **v1.0.93～v1.0.112** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。
**仍非「全面」**：与 **v1.0.93～v1.0.111** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① A2/A3/A5 切片复验（2026-05-15 · v1.0.115）

| 命令 | 结果 |
|------|------|
| `cargo test -p traveltrust-api comments_thread::comment_sort_tests` | **6 passed** |
| `cargo test -p traveltrust-api internal_gate_tests` | **9 passed** |
| `npx vitest run`（communityFeedMappers / community.tagUtf8 / community.posts.createCommentsLikes） | **40 passed** |
| `bash scripts/run-check-04-routes.sh` | **exit 0** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.115**。

**仍非「全面」**：与 **v1.0.93～v1.0.114** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① A4 切片复验（2026-05-15 · v1.0.116）

| 命令 | 结果 |
|------|------|
| `cargo test -p traveltrust-api media_upload` | **13 passed** |
| `npx vitest run`（`core.parseResponse.part1` / `PublishDrawer/constants` / `publishActionBlockedKeys`） | **36 passed** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.116**。

**仍非「全面」**：与 **v1.0.93～v1.0.115** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 满跑 bundle 复验（无全矩阵 · 2026-05-15 · v1.0.117）

| 命令 | 结果 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `cargo test -p traveltrust-api` | **1329 passed** |
| `cd frontend && npx tsc --noEmit -p tsconfig.json` | **exit 0** |
| `cd frontend && npm run test:regional:ci` | **`[regional-matrix-gate] passed.`** |
| `source scripts/dev/export-database-url-from-root-env.sh` + `CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E=1 local-delivery-expanded` | **OK**（**约 89s**；尾段 **SKIP**） |
| `bash scripts/gates/e2e-stability-probe.sh` | **OK**（**3 passed**；**约 162s**） |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.117**。

**仍非「全面」**：与 **v1.0.93** 同口径，但**本轮未**重跑 **chromium 全矩阵**；**G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① R-002 / ISS-007 狭宽片（2026-05-15 · v1.0.118）

| 项 | 值 |
|----|-----|
| 修复 | **`matrix_93_d_com_001e_*`** hot feed 测试加 **`tag=`** 隔离（共享 PG 污染下原 **`limit=50`** 无 **`tag`** 易失败） |
| 命令 | `source scripts/dev/export-database-url-from-root-env.sh` + `P3_CHAIN_OFF=1 bash scripts/gates/local-verify-r002-prereport-chain.sh` |
| 结果 | **43 PASS**；**`release_gate=PARTIAL_GO`**；**`e2e_core_report.passed=true`**；**全链 ~36s** |

**仍非 staging 全矩阵 GO**：见 **`evidence/GO_local_r002_verify/README.md`**；**勿** **`validate-regression-report.py --require-go`** 冒充 **②③** 全面。

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.118**。

## ① D-COM-001 修复后复验（2026-05-15 · v1.0.119）

| 命令 | 结果 |
|------|------|
| `cargo fmt --all -- --check` | **exit 0** |
| `cargo test -p traveltrust-api` | **1329 passed** |
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `P3_CHAIN_OFF=1 bash scripts/gates/local-verify-r002-prereport-chain.sh` | **OK**（**43 PASS**；**`PARTIAL_GO`**） |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.119**。

**仍非「全面」**：与 **v1.0.118** 同键 — **G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 扩充闸 Playwright 尾段复验（D-COM-001 修复后 · v1.0.120）

| 项 | 值 |
|----|-----|
| 命令 | `source scripts/dev/export-database-url-from-root-env.sh` → `env -u CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E bash scripts/gates/local-delivery-expanded.sh` |
| Playwright 尾段 | **42 passed / 2 skipped** |
| 全闸 | **OK**（**约 339s**） |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.120**。

**仍非「全面」**：与 **v1.0.102** 同口径，在 **v1.0.118** 修复后复验；**G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① 全 chromium E2E 矩阵复跑（D-COM-001 修复后 · v1.0.121）

| 项 | 值 |
|----|-----|
| Playwright | **326 passed / 1 flaky / 13 skipped / 0 failed**（**约 44.6m**） |
| flaky | **`e2e/93-matrix-path-f1-f4.spec.ts`** 注册 UI 分支（重试后过） |
| 闸 | **`OK: local-e2e-chromium-full-matrix`** + stderr 分层提醒 |
| 控制台 | **`e2e-chromium-matrix-20260515-v121-console.txt`** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.121**。

**仍非「全面」**：与 **v1.0.103** 同键；**G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① flaky 收口（2026-05-15 · v1.0.122）

| 项 | 值 |
|----|-----|
| 代码 | **`e2e/93-matrix-path-f1-f4.spec.ts`** **A-REG-001** **`retries: 1 → 2`** |
| 机读 | **`npm run check:e2e:tsc`** **exit 0** |
| 单用例 Playwright | 本轮 **setup-meta-chain** **`/meta`** 未绿，**未** 跑到注册体（**非** 断言失败） |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.122**。

**仍非「全面」**：与 **v1.0.121** 同键；**G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。

## ① v1.0.122 flaky 修复后全栈 A-REG 复验（2026-05-15 · v1.0.123）

| 项 | 值 |
|----|-----|
| 命令 | `source scripts/dev/export-database-url-from-root-env.sh` → `cd frontend && node scripts/run-e2e-default.mjs --project=chromium e2e/93-matrix-path-f1-f4.spec.ts --grep "注册页提交"` |
| 结果 | **3 passed**（**约 43s**）**无 flaky** |
| 日志 | **`playwright-f1-reg-a-reg-001-v123-console.txt`** |

登记：**`docs/runbook/TT-NEXT-BATCH-BACKLOG-001.md`** **v1.0.123**。

**仍非「全面」**：单切片；**G/H / 93 / 96-20 / 31 / ②③** 须另轨证据。
