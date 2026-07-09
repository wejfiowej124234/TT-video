# TT-96-20-P0-E2E-LADDER-001 · 96-20 对齐 · P0 Playwright 分批阶梯（① 本地）

**仓库路径：** `docs/runbook/TT-96-20-P0-E2E-LADDER-001.md`  
**稳定锚：** [`#tt-96-20-p0-e2e-ladder`](#tt-96-20-p0-e2e-ladder) · [`#tt-96-20-trust-gate-pg-evidence-warn`](#tt-96-20-trust-gate-pg-evidence-warn)

**Version:** 1.0.28  
**Status:** `Active` — **分批打穿 P0** 的操作入口；**不**替代 **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** 全矩阵、**不**替代 **[04](../spec/04-后端与API.md)** 契约正文。

**阶次：** 本文默认 **① 本地**（Playwright + 本地/CI `webServer` + 可连 API）；**② 测试网 / ③ 生产** 须在每行结论旁 **单独标明**；**禁止跳阶**、**禁止假完成**（与 **[CONTRIBUTING · no-false-completion](../../CONTRIBUTING.md#no-false-completion)**、**[TT-9628 · §0.0.5](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)** 同源）。

**覆盖边界：** P0 机读清单 **不等于** 全站 **126** 页、每弹窗、每角色交叉穷举 — 读者预期见 **[TT-9628 · 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)**、**96-20** 文首 **§0**。

---

<a id="tt-96-20-p0-e2e-ladder"></a>

## 1. 分批顺序（与执行约定）

| 阶段 | 做什么 | 收口 |
|------|--------|------|
| **Day 1** | 从 **[TT-9625](TT-9625-golden-path-system-spine.md) §2** 与 **96-20 §6** 加权域抽出 **P0 URL**；维护 **机读清单** **`frontend/e2e/p0-routes.v1.json`**；本 Runbook **§2** 人类可读表与之对拍 | 清单 **version** bump + PR/本地说明可 grep **`p0-routes`** |
| **Day 2～4** | 只打穿 **P0**：复用 **`skipIfApiDown`**、**429 / Retry-After** helpers、**seed**、**角色登录**；**不**搞「一次生成全矩阵跑完」 | 相关 **`*.spec.ts`** 命名与 **`p0-routes.v1.json`** **`existingE2e`** 列互指 |
| **Day 5+** | 扩 **P1 / P2**；每批可维护；失败按 **§4** 分类登记（可进 **[TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)** 或专项 Runbook） | 同上 |

**Mock 口径（与 TT-31 对读）：** Playwright **`request`** 侧 **429 退避**、Vitest **`Response`/`fetch` 契约桩** 与 **「`page.route` 假 JSON 冒充矩阵」** 分轨 — 见 **[TT-31 · `#tt-31-gap-mock-reality`](TT-31-STRUCTURED-GAP-CATALOG-001.md#tt-31-gap-mock-reality)**。

---

## 2. P0 路由表（人类可读 · 与 JSON 对拍）

**机读真源：** `frontend/e2e/p0-routes.v1.json`（**`routes[]`**）。下表为摘要；字段以 JSON 为准。

| 域 | 路径 | 叙事 |
|----|------|------|
| Auth | `/auth/login`、`/auth/register` | **[TT-9625](TT-9625-golden-path-system-spine.md) §2 步 1**；`POST /auth/*` **须直连 API BASE**（**96-20 §1** / **`apiUrl` 注释**） |
| Meta | （非独立用户 URL） | 首屏或业务前 **`GET /meta`**；市场/向导等已消费 |
| Market | `/market`、`/discover`（→`/market`）、`/guides` | **TT-9625 §2 步 3**；**`discoverOrders`** + **`GET /api/v1/guides`** 列表 |
| Orders | `/orders`、`/orders/new` | 列表 + 创单入口（**TT-9625 §2 步 4**） |
| Escrow | `/escrow/:id` | **TT-9625 §2 步 5**；需 **seed 订单 id** 或专用竖切 |
| Community | `/community`、`/community/explore`、`/community/me`（**`?tab=`** **`posts` / `collects` / `likes` / `orders`**） | Hub 弹层与 **`GET …/me/*`**、**`GET /api/v1/orders`** 对拍；**96-20 §4** |
| Me | `/me`、`/me/security`、`/me/onboarding` | 权限与 **onboarding** 闸；**96-20 §5** 相关行 |

---

## 3. 推荐 Helpers（代码真源）

| 用途 | 路径 |
|------|------|
| API 探活 / 跳过 | `frontend/e2e/helpers/skipIfApiDown.ts` |
| 429 / Retry-After | `frontend/e2e/helpers/playwright429Backoff.ts` |
| 登录 / seed / Bearer 会话 | `frontend/e2e/helpers/apiSession.ts`（首跳 **`gotoSmoke`**、注入后 **`reloadSmoke`**；**`page.waitForURL`** 宜显式 **`waitUntil`**（**`domcontentloaded`**/**`commit`**）；与 **04**「Web / E2E」段对读） |
| **P0 真实 GET 200 等待**（feed / discover / guides / orders 列表等） | `frontend/e2e/helpers/p0RealApiWaits.ts` |
| Escrow 原生 CTA（接单 / 双边确认） | `frontend/e2e/helpers/bilateralEscrowE2e.ts`（**`clickBilateralConfirmCta`** 等）：前置 **`waitForLoadState('domcontentloaded')`**，与 **`gotoSmoke`/`reloadSmoke`**/**`waitForURL`** 口径一致（**不**用 **`load`** 鱼尾） |
| 壳层导航（smoke） | `frontend/e2e/helpers/smoke-nav.ts`（**`gotoSmoke` / `reloadSmoke` / `waitForUrlSmoke` / `waitForUrlSmokePromise`**）、`frontend/e2e/helpers/pageShells.ts`；**`page.waitForURL` 漂移闸**：**`bash scripts/check-e2e-waitforurl-smoke-convergence.sh`**（**优先 `rg`**，无则 **`find`+`grep`**；与 **[GAP-MAP §2](TT-96-20-E2E-COVERAGE-GAP-MAP-001.md)** 末 SSOT 对拍） |

**专 spec（真链、无 `page.route`）：** `frontend/e2e/p0-spine-real-api-public.spec.ts`（访客 / onboarding / 公开读）+ **`p0-spine-real-api-session.spec.ts`**（seed + Bearer 会话读）（与 **`p0-routes.v1.json`** 对拍；含 **`/discover`→`/market`**、**`/guides`**、**`/community/me?tab=`**（**posts / collects / likes / orders**）、**`/auth/*`**、**`/me`→`/community/me`**、**`/me/onboarding`**、**`/escrow/:id`** 等 **`GET …` 200** 等待；**`npm run e2e:p0-spine`** 两文件同跑）。**已从 P0 相关 E2E 移除的 `page.route`：** `me-onboarding-96-18-shell`（409/429/503 对拍改指 **`frontend/lib/apiClient/onboarding`**）、`b463-browser-reviews-contract`（降级对拍指 **`reviewJsonContractObservability.test.ts`**）、`community-me-data-state`（社交条改 **真实 GET**）。**`trust-gate-*.spec.ts`**：**全栈** **`POST /auth/seed-trust-gate-e2e`**（须 **`SEED_TEST_ACCOUNTS=1`**）+ 真实 API，标签 **`@e2e-trust-gate-real`**；**npm** 入口 **`npm run e2e:trust-gate`**（**`frontend/scripts/run-e2e-trust-gate.mjs`** → **`run-e2e-default.mjs`**）。有 **`DATABASE_URL`** 时 seed **best-effort upsert** 夹具 **`orders`**，以满足 **`evidence_receipts.order_id`** FK（仍属 **①**）；**WARN / strict 边界见下 §3.1**；**Rust PG·IT（可选）**：**`cargo test -p traveltrust-api matrix_93_b_tg_`**（**`it_db_pool`** 同源；**`002`** 订单 / **`003`** **`POST …/evidence`** 双写 **`evidence_receipts` + `disputes.evidence_hashes`** / **`004`** **`TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE=1`** 缺 **`orders`** 行 → **503**；未设 **`DATABASE_URL`** 时 **skip**）。**不**把四文件等同于 **96-20** 全矩阵或 **P0 spine** 已穷举 — 仍为 **Escrow/争议写错与信任闸** 的 **竖切切片**；并纳入根 **`scripts/gates/local-delivery-expanded.sh`** Playwright 尾段（与 **TT-LOCAL §2.2** 对读）。

<a id="tt-96-20-trust-gate-pg-evidence-warn"></a>

### 3.1 trust-gate · 订单进 PG · `evidence_receipts` 双写 WARN 边界（技术债收口）

| 维度 | 说明 |
|------|------|
| **收口（代码）** | 有 **`db_pool`**（通常来自 **`DATABASE_URL`**）且调用 **`POST /auth/seed-trust-gate-e2e`** 时，对夹具 **`orders`** **`upsert_order`**，并对 **`is_trust_gate_seeded_order_id`** 关联的夹具 **`disputes`** **`upsert_dispute_chain_off_fixture`**（**`ON CONFLICT (id) DO UPDATE`**），使 **`POST …/evidence`** 插入 **`evidence_receipts`** 不因 **`order_id` FK** 失败，**`append_evidence_hash_to_dispute`** 可更新 PG **`disputes.evidence_hashes`**，且 **`GET /disputes/:id`** 在有 PG 行时与 **chain_off 内存**一致（旧 PG 行 **`resolved`** 不再因 **`DO NOTHING`** 与内存分叉）。真源：**`crates/api/src/db/disputes/`**（**`mutations.rs`** **`upsert_dispute_chain_off_fixture`**）· **`crates/api/src/chain_off/trust_gate_e2e_seed/`**（**`mod.rs`/`seed.rs`/`pg_sync.rs`/…**；**`seed_trust_gate_e2e_fixtures`** 路径不变）· **`crates/api/src/routes/auth_trust_gate_e2e_seed_db_api_tests/`**（**`matrix_93_b_tg_*`** **PG·IT**）；订单 UUID 前缀与 **`is_trust_gate_seeded_order_id`**、单元测试 **`fixture_order_ids_match_pg_upsert_prefix_gate`**（无 PG）及 **`matrix_93_b_tg_002_*`** / **`matrix_93_b_tg_003_*`** / **`matrix_93_b_tg_004_*`** / **`matrix_93_b_tg_005_*`**（有 **`DATABASE_URL`**）对拍。 |
| **维护** | 新增夹具订单须使用 **`f0e0c201-0001-4001-8001-`** / **`f0e0e401-0001-4001-8001-`** 前缀，或扩展 **`is_trust_gate_seeded_order_id`** 并同步 **`fixture_order_ids_match_pg_upsert_prefix_gate`** 中的 UUID 列表；否则 PG **不** upsert 该行，仍可能出现 FK 失败与双写 WARN。 |
| **默认（接受 WARN 的边界）** | **`TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE` 未置 `1`** 时，DB 插入失败仅日志 **`WARN: evidence_receipts double-write failed: …`**（**`chain_off/evidence/post.rs`**）；HTTP **仍 200**，内存态已写入证据。**① 本地 / 开发**：可接受为「当前 API 进程内 **chain_off 内存**为写路径 SSOT」。**若以 PG 为证据列表读 SSOT**（与 **`tests_evidence_messages_list_db_ssot`** 同源），则出现该 WARN **表示 PG 缺行**，**不得**宣称该读路径已验收；应修 seed / 迁移 / 双写或开 **strict**。 |
| **strict（不接受 WARN）** | **`TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE=1`**：插入失败 → **503** `evidence_db_persist_failed`。**②③** 或「证据落库必须成功」的闸，应按 **strict** 或等价产品策略收紧。 |
| **seed 仍失败时** | **`upsert_order` / `insert_user`** 等 **best-effort** 若 **`eprintln!`** 报错，夹具行可能未进 PG；证据路径仍可能 WARN — 归类 **§4 · seed_data** 或环境漂移，先修 PG 与 seed 再跑 E2E。 |

**已有宽覆盖 smoke：** `frontend/e2e/smoke.spec.ts`、`frontend/e2e/smoke-community.spec.ts` — 已接 **`skipIfApiDown`** + **`p0RealApiWaits`** 的读面断言；全量 Playwright 仍受 **`playwright.config`** 的 **setup / webServer** 与 **`127.0.0.1:8080` API** 约束（与测试网/生产同源 URL，仅主机不同）。**Sepolia 真链烟切片（整文件 `smoke.spec.ts`，禁 `page.route` 假 JSON）：** 根 **`.env`** 与 **[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md) §3** 满足时 **`cd frontend && npm run e2e:sepolia:smoke`**（与 **`run-e2e-sepolia.mjs`**、**[TT-LOCAL §2](./TT-LOCAL-CI-DELIVERY-GATE-001.md)** 对读；**①** 收口，**不**冒充 **②③**）。

---

## 4. 失败五分类（登记用语）

1. **route_missing** — 前端路由或链接断裂  
2. **api_contract** — 状态码/体字段与 **04** / `apiClient` 不一致  
3. **rbac_permission** — 登录态、向导/游客、Admin 等权限与 UI 不同步  
4. **seed_data** — seed 顺序、订单 id、社区数据前提缺失（**trust-gate × PG × 证据 WARN** 见 **§3.1**）  
5. **test_flake** — 超时、竞态、环境漂移（先复现再改测试或产品）

---

## 5. 互指

| 文档 | 关系 |
|------|------|
| [04 §3 / §3.4](../spec/04-后端与API.md) | **`POST /auth/seed-trust-gate-e2e`**、**`POST …/evidence`** 双写 **WARN/strict** 契约句（与 **§3.1** 对读） |
| [96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md) | 全站 **§5** 矩阵；**§6** 加权 **P0 UI** |
| [TT-9625](TT-9625-golden-path-system-spine.md) | 主脊五段 → P0 核心子集 |
| [TT-NEXT](TT-NEXT-BATCH-BACKLOG-001.md) | **A** 批契约/E2E 切片总入口 |
| [TT-31](TT-31-STRUCTURED-GAP-CATALOG-001.md) | 社区线缺口 + mock 口径 |
| [TT-LOCAL](TT-LOCAL-CI-DELIVERY-GATE-001.md) | 本地交付闸；**机读绿 ≠ 深度多维** 见 **[TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)** |
| [TT-96-20-E2E-COVERAGE-GAP-MAP-001](TT-96-20-E2E-COVERAGE-GAP-MAP-001.md) | **P0 路由 ↔ E2E ↔ 缺口 ↔ ① 下一步** 执行表（与 **`p0-routes.v1.json`** 对拍）；**§2** 末 **Playwright 导航 SSOT**（**`waitForUrlSmoke*`** / **`commit`** 例外；**v1.0.28** 起三 **spec/helper** 文件头互指齐；**v1.0.29** 起 **`check-e2e-waitforurl-smoke-convergence`** 机读闸；**v1.0.30** 起闸已串 **`local-delivery-expanded`**；**v1.0.31** 起闸扫描 **优先 `rg`**、无则 **`find`+`grep`**） |
| [TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md) | **全页面 10 轮** UI/UX 深度多维协议（生产取向 · **禁假 JSON**） |

---

## 6. 修订记录

| Version | Date | 摘要 |
|---------|------|------|
| 1.0.28 | 2026-05-11 | P0 主脊 **`p0-spine-real-api.spec.ts`** 拆 **`p0-spine-real-api-public.spec.ts`**（访客·onboarding·公开读）+ **`p0-spine-real-api-session.spec.ts`**（会话读）；**`p0-routes.v1.json`** **`existingE2e`**、**`npm run e2e:p0-spine`**、**`local-tt9621-p0-stack-one-shot.sh`** 同批。**承** **v1.0.27**。 |
| 1.0.27 | 2026-05-08 | **§3 Helpers**：漂移闸扫描 **优先 `rg`** / **`find`+`grep`** 与 **GAP-MAP v1.0.31**、**TT-LOCAL §2.2 v1.0.72** 对拍。**承** **v1.0.26**。 |
| 1.0.26 | 2026-05-08 | **`local-delivery-expanded.sh`** 串 **`check-e2e-waitforurl-smoke-convergence`**；**GAP-MAP** **v1.0.30**；**TT-LOCAL §2.2** **v1.0.71**。**承** **v1.0.25**。 |
| 1.0.25 | 2026-05-08 | **§3 Helpers** 表：**`check-e2e-waitforurl-smoke-convergence.sh`**；**GAP-MAP** **v1.0.29**。**承** **v1.0.24**。 |
| 1.0.24 | 2026-05-08 | **GAP-MAP** **v1.0.28**：**`core-path`** / **`section10-5-login-community-feed`** 文件头 **`commit`** 互指对齐。**承** **v1.0.23**。 |
| 1.0.23 | 2026-05-08 | **GAP-MAP** **v1.0.27**：**04**/**53**/**CONTRIBUTING**/**`playwright.config`**/**`clickLoginWaitClientNav`** 互指 **§2** 末 SSOT。**承** **v1.0.22**。 |
| 1.0.22 | 2026-05-08 | **§5** 互指 **GAP-MAP §2** 导航 SSOT 段；**`smoke-nav.ts`** 头注补 **`commit`** 三例外。**承** **v1.0.21**。 |
| 1.0.21 | 2026-05-08 | **`waitForUrlSmokePromise`**（**`Promise.all`** 并发）+ **`p02`～`p05`**/**`b467`/`b468`/`b469`**/**`93-matrix`**/**`me-security`**/**`smoke-community`** 等全量收敛；**`smoke.spec.ts`** **`gotoSmoke(page, "`** 格式统一。**承** **v1.0.20**。 |
| 1.0.20 | 2026-05-08 | **`smoke.spec.ts`** / **`p0-spine-real-api`** / **`auth-ui-logout-me`** / **`b469`** 余下 **`page.waitForURL`** 收敛为 **`waitForUrlSmoke`**。**承** **v1.0.19**。 |
| 1.0.19 | 2026-05-08 | **`waitForUrlSmoke`**（**`smoke-nav.ts`**）+ **`93-matrix-admin-domain-batch`** **`main`/`h1`** 超时放宽；订单链 **`b467`～`b469`** 等 **`toHaveURL`** 收敛。**承** **v1.0.18**。 |
| 1.0.18 | 2026-05-08 | **§3 Helpers**：**`waitForURL`** 显式 **`waitUntil`** 与 **`gotoSmoke`** 同源；**`smoke.spec.ts`** 等 P0 宽覆盖对拍。**承** **v1.0.17**。 |
| 1.0.17 | 2026-05-08 | **§3 Helpers**：**`apiSession`** 与 **`gotoSmoke`/`reloadSmoke`** 对拍；**`bilateralEscrowE2e`** **`clickBilateralConfirmCta`** 用 **`domcontentloaded`**。**承** **v1.0.16**。 |
| 1.0.16 | 2026-05-07 | **§5**：互指 **[TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md)**。**承** **v1.0.15**。 |
| 1.0.15 | 2026-05-07 | **§5**：互指 **[TT-96-20-E2E-COVERAGE-GAP-MAP-001](TT-96-20-E2E-COVERAGE-GAP-MAP-001.md)**。**承** **v1.0.14**。 |
| 1.0.14 | 2026-05-07 | **§3.1**：夹具 **`disputes`** 叙事改为 **`upsert_dispute_chain_off_fixture`**（**`DO UPDATE`**）；互指 **`matrix_93_b_tg_005_*`**。**§3.1 末**：**`e2e:sepolia:smoke`**（**①**）。**承** **v1.0.13**。 |
| 1.0.13 | 2026-05-07 | **§3.1**：seed **PG** 补 **`disputes`**；**Rust** **`matrix_93_b_tg_003_*`**/**`004_*`**（证据双写 + strict **503**）。**承** **v1.0.12**。 |
| 1.0.12 | 2026-05-07 | **§3**：移除 **`e2e:trust-gate-offline`** npm 别名与脚本；**§3.1**：补 **`matrix_93_b_tg_002_*`** PG·IT 互指。**承** **v1.0.11**。 |
| 1.0.11 | 2026-05-07 | **§5**：互指 **04 §3/§3.4**（**seed-trust-gate-e2e** / **evidence** 契约）。**承** **v1.0.10**。 |
| 1.0.10 | 2026-05-07 | **§3**：勘误 **`e2e:trust-gate-offline`** 调用链（**`run-e2e-trust-gate-offline.mjs`** → **`run-e2e-trust-gate.mjs`** → **`run-e2e-default.mjs`**）。**承** **v1.0.9**。 |
| 1.0.9 | 2026-05-07 | 新增 **§3.1**：订单进 PG、**`evidence_receipts`** 双写 **WARN** 可接受边界 vs **`TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE`**；**§4** **seed_data** 互指；文首稳定锚；Rust **`fixture_order_ids_match_pg_upsert_prefix_gate`**。**承** **v1.0.8**。 |
| 1.0.8 | 2026-05-07 | **§3**：**trust-gate** seed 在有 **`DATABASE_URL`** 时 **upsert** 夹具 **`orders`**（**`evidence_receipts`** FK）。**承** **v1.0.7**。 |
| 1.0.7 | 2026-05-07 | **§3**：**`trust-gate-*.spec.ts`** 叙事改为 **全栈 seed + 真 API**；**`e2e:trust-gate-offline`** 改为 **历史别名**；互指 **TT-LOCAL §2.2** / **`local-delivery-expanded`**。 |
| 1.0.6 | 2026-05-04 | P0 spine：**`tab=collects|likes|orders`** + **`waitCommunityMeCollectsGet200`** / **`waitCommunityMeLikesGet200`**；**`me/posts`** path 精确匹配。 |
| 1.0.5 | 2026-05-04 | **§3** / **`p0-routes`**：**`/discover`**、**`/guides`**、**`/community/me?tab=posts`**；**`waitGuidesGet200`** 收紧为列表 path。 |
| 1.0.4 | 2026-05-04 | **§3**：P0 spine 扩 **`/auth/*`**、**`/me` 重定向**、**`/me/onboarding`**、escrow **chain-sync-status** 等待。 |
| 1.0.3 | 2026-05-04 | **§3**：**`e2e:trust-gate-offline`** / **`chromium-trust-gate-offline`** 操作入口一句。 |
| 1.0.2 | 2026-05-04 | **§3**：P0 相关 **`page.route` 移除** 与 **`trust-gate-*` 分轨** 一句。 |
| 1.0.1 | 2026-05-04 | **§3**：**`p0RealApiWaits.ts`**、**`p0-spine-real-api.spec.ts`**；smoke / smoke-community 真链读面对拍说明。 |
| 1.0.0 | 2026-05-04 | 首版：Day 1～5 阶梯 + P0 表 + **`p0-routes.v1.json`** 互指 |
