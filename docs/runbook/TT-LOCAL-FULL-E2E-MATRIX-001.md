# TT-LOCAL-FULL-E2E-MATRIX-001 · 本地「chromium 全量 Playwright」与 **93 / 96-20 / 31** 边界

**仓库路径：** `docs/runbook/TT-LOCAL-FULL-E2E-MATRIX-001.md`  
**稳定锚：** [`#tt-local-full-e2e-matrix`](#tt-local-full-e2e-matrix) · [`#tt-local-full-e2e-not-done`](#tt-local-full-e2e-not-done)

**Version:** 1.0.2  
**Status:** `Active` — **① 本地** 可选重闸；**不**改写 **93 / 96-20 / 31** SSOT；**不**替代 **②③** 留证。

**阶次：** 本文仅 **①**；**禁止**用本闸 **exit 0** 冒充 **96-15 Tier C**、**93 全文 PASS** 或 **生产 GO**（与 **[CONTRIBUTING · no-false-completion](../../CONTRIBUTING.md#no-false-completion)**、**[TT-9628 §0.0.5](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)** 同源）。

---

<a id="tt-local-full-e2e-matrix"></a>

## 1. 「全矩阵」在 **自动化** 口径下的定义

| 术语 | 含义 |
|------|------|
| **本闸所称「全量 E2E」** | **`playwright.config.ts`** 下 **`project=chromium`** 的 **全部** `e2e/**/*.spec.ts`（与 **`.github/workflows/build.yml`** **`e2e`** job：`cd frontend && npm run e2e -- --project=chromium` **同集合**）。**入口：** **`bash scripts/gates/local-e2e-chromium-full-matrix.sh`** 或 **`cd frontend && npm run e2e:full-chromium`**（经 **`run-e2e-default.mjs`**）。 |
| **Site10 G1/G2/G3 主矩阵（844）** | **`PLAYWRIGHT_LOCAL_SITE10_MATRIX=1`** 时 **`chromium`** 为 **844 Tests** 子集（`testIgnore` + `grepInvert`）；**G3 唯一判定基线** — **[ENTERPRISE-SITE-10-L5-MATRIX §1.4.1](ENTERPRISE-SITE-10-L5-MATRIX.md)**（**不**新增发布阶段） |
| **文档矩阵「全矩阵」** | **[93](../spec/93-全站功能验证矩阵-域别回归清单.md)**（含 **MANUAL**、**NOT RUN**、多环境）、**[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)**、**[31](../spec/31-TT社区-企业级UI检查-未完成与待优化.md)** — **无**单一 `exit 0` 可等价穷举（**[TT-9628 · 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)** **§8.0** 同键）。 |

---

## 2. 接入 **`local-delivery-expanded.sh`**

| 变量 | 行为 |
|------|------|
| **`CI_LOCAL_FULL_CHROMIUM_E2E_MATRIX=1`** | 在默认 **market-community + b468/b469 + trust-gate** 尾段 **之后**，再串 **`scripts/gates/local-e2e-chromium-full-matrix.sh`**。 |
| **unset / 0** | **不**跑全量 chromium（保持扩充闸默认时长）。 |

**须 `DATABASE_URL`（已 migrate）**；与 **`local-delivery-expanded`** 尾段同源。

---

<a id="tt-local-full-e2e-not-done"></a>

## 3. **即使** chromium 全绿，仍属「未完成 / 须另轨」的清单（摘要）

下列 **不**因 **`npm run e2e:full-chromium` exit 0** 而自动收口 — 真源与登记见 **[TT-GATE §1～§3](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)**，此处仅列 **高频误解**：

| 类别 | 未完成项（仍须 **手验 / Tier C / ②③** 或专项 spec） |
|------|------------------------------------------------------|
| **社区** | Feed **真实视频流**全屏与交互、评论全形态分页排序、赞藏关注 **刷新一致**、举报审核全链路、Explore/搜索/话题 — 见 **TT-GATE §2**。 |
| **市场 / 订单 / 托管** | **②** mock-pay / **③** PSP；订单状态机长尾；**≠** 96-20 全路由 PASS — **TT-GATE §3**。 |
| **向导质押 / 积分** | 链上质押与 **trust_growth** 产品全链、**②③** 对账 — smoke 级 **可达性 ≠** 业务证明。 |
| **Admin** | **RBAC 交叉**、审计留痕 **全枚举** — **TT-GATE §3**。 |
| **i18n / a11y / 96-16 D1～D12** | **`npm test`** / Vitest / Lighthouse **≠** 深度抽样闭环 — **96-15**、**TT-96-16-D3-hand-checklist**。 |
| **`chromium-sepolia` / L4** | 本闸 **不**含 Sepolia 项目；另跑 **`npm run e2e:sepolia`** 等 — **TT-L4**。 |

---

## 4. 互指

| 文档 | 关系 |
|------|------|
| [ENTERPRISE-SITE-10-L5-MATRIX §1.4.1](ENTERPRISE-SITE-10-L5-MATRIX.md) | **844 Tests** G1/G2/G3 判定基线与 **testIgnore** 登记 |
| [TT-LOCAL-CI-DELIVERY-GATE-001](TT-LOCAL-CI-DELIVERY-GATE-001.md) | **§2** 表 **E2E（chromium 全量）** 行 |
| [TT-96-20-E2E-COVERAGE-GAP-MAP-001](TT-96-20-E2E-COVERAGE-GAP-MAP-001.md) | **P0 ↔ E2E ↔ 缺口** 对照表（跑全量前后对读） |
| [TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md) | **全页面 10 轮** UI/UX 深度协议（与 **chromium 全量** 互补） |
| [scripts/README](../../scripts/README.md) | **`e2e:full-chromium`** / **`CI_LOCAL_FULL_CHROMIUM_E2E_MATRIX`** 快速使用段 |

---

## 5. 修订记录

| Version | Date | 摘要 |
|---------|------|------|
| 1.0.2 | 2026-05-07 | **§4** 互指增 **[TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md)**。**承** **v1.0.1**。 |
| 1.0.1 | 2026-05-07 | **§4** 互指增 **[TT-96-20-E2E-COVERAGE-GAP-MAP-001](TT-96-20-E2E-COVERAGE-GAP-MAP-001.md)**；节号 **互指 / 修订** 对调为常序。**承** **v1.0.0**。 |
| 1.0.0 | 2026-05-07 | 首版：全量 chromium 闸定义、**`CI_LOCAL_FULL_CHROMIUM_E2E_MATRIX`**、**§3** 未完成摘要。 |

---

**文档结束**
