# 全站企业 10 分 · ① 本地 L5 全链路全矩阵 · ②③ 公网/生产需求

**Status：** **① 走廊 10 + 全站 10 已落盘** · **②③ 公网/生产另闸**（本页为 **SSOT**）  
**阶段纪律：** **① 本地 → ② 测试网 → ③ 公网/生产**（禁止跳阶 · 禁止假完成）

**互指：**

| 文档 | 用途 |
|------|------|
| [GO_local_enterprise_10 · 走廊 10](../../frontend/evidence/GO_local_enterprise_10/README.md) | **子集**：Web3 创新行程走廊 |
| [GO_local_phase1](../../frontend/evidence/GO_local_phase1/README.md) | **① onboarding / Hub / fee_schedule** 总验收 |
| [PHASE1-ENTERPRISE-CLOSURE-AUDIT](./PHASE1-ENTERPRISE-CLOSURE-AUDIT.md) | ① 垂直 CLOSED vs 全仓边界 |
| [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) | **② 测试网** G-0～G-4 · Stripe · 合约 · webhook · staging |
| [go-live-checklist](../go-live-checklist.md) | **③ 生产** P0 · R-002 · 主网 |
| [dev-local-smoke-baseline](../dev-local-smoke-baseline.md) | ① A+B 主链烟测 |
| [93 全站功能验证矩阵](../spec/93-全站功能验证矩阵-域别回归清单.md) | 域矩阵真源 |
| [TT-LOCAL-FULL-E2E-MATRIX-001](./TT-LOCAL-FULL-E2E-MATRIX-001.md) | CI 默认 chromium 全量 vs **Site10 844 主矩阵** 边界（§1.4.1） |

---

## 0 · 三档「10 分」口径（必读）

| 档位 | 名称 | 阶段 | 可否宣称 | 末行 grep（示例） |
|------|------|------|----------|-------------------|
| **A** | **走廊 10** | ① | Landing→解锁→Escrow→Market bind | `TT_ENTERPRISE_LOCAL_10: OK` |
| **B** | **全站企业 10** | ① | **本地**全链路 + **L5 绿集** + **域烟测** + **可选** Playwright 全矩阵 | `TT_ENTERPRISE_SITE_10_LOCAL: OK` |
| **C** | **测试网 / staging 10** | ② | **须** G-1/G-2 清闸 + 真 Stripe test + 公网 webhook + staging 烟测 | `TT_SMOKE_ONBOARDING_TESTNET: OK` 等（**待 ② 实施**） |
| **D** | **生产 / 公网 10** | ③ | **须** go-live P0 · R-002 **GO** · 主网/真 PSP | **Production GO**（**非** ①② 闸） |

**禁止：** 用 **A** 或 **B** 冒充 **C/D**（见 [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion)）。

---

## 1 · 全站企业 10 分（① 本地 · L5 · 定义）

**必须同时满足：**

1. **全链路**：注册/登录 → `/me` / Hub → 市场 → 订单/托管 → 消息（及 onboarding / 收购 / 商家 / 主理人 **域烟测** 已列脚本）。
2. **全矩阵（① 可机读部分）**：Phase1 总验收 + 链路质量闸 + A+B 主链 + 各垂直 **L5 vitest 绿集** + **走廊 10**；**可选加重** Chromium 全量 E2E（见 §1.3）。
3. **L5 级别**：各域 **UI 冻结 README** + **contract/vitest 绿集** + **API smoke**（**非**仅手点截图）；五主路由见 [FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)。

**不等于：** 93 每一条 MANUAL、96-20 每路由×每弹窗、staging `release_gate=GO`、主网真资金。

---

### 1.1 ① 全站 10 · 机读闸（推荐一条命令）

```bash
bash scripts/dev/run-enterprise-site-10-local.sh
```

**成功末行：** `TT_ENTERPRISE_SITE_10_LOCAL: OK`

**可选（长跑 · 45～55min）：**

```bash
ENTERPRISE_SITE_10_FULL_E2E=1 bash scripts/dev/run-enterprise-site-10-local.sh
```

**跳过 Playwright 走廊（仅 API + vitest）：**

```bash
SKIP_E2E=1 bash scripts/dev/run-enterprise-site-10-local.sh
```

**前置：** `DATABASE_URL` · `INTERNAL_API_SECRET` · API `:8080`（烟测/E2E 时）；见 [dev-local-smoke-baseline §1](../dev-local-smoke-baseline.md)。

---

### 1.2 ① 全站 10 · 分层清单（与脚本对拍）

| 层 | 内容 | 命令 / 证据 |
|----|------|-------------|
| **L0 治理** | Phase1 onboarding/Hub/fee_schedule 总验收 | `bash scripts/dev/run-go-local-phase1-acceptance.sh` → `TT_GO_LOCAL_PHASE1: OK` |
| **L1 链路质量** | cargo 子集 · 五主防回归 · 治理/me 契约闸 | `bash scripts/gates/local-phase1-linkage-quality-gates.sh` → `TT_PHASE1_LINKAGE_QUALITY_GATES_SUMMARY: OK` |
| **L2 A+B 主链** | 注册→市场→订单→消息 | `bash scripts/smoke-ab-core-chain.sh` exit 0 |
| **L3 垂直烟测** | 商家 / 主理人 / 收购 PD-009 | `smoke-provider-onboarding-local.sh` · `smoke-steward-onboarding-local.sh` · `smoke-acquisition-pd009-local.sh` |
| **L3b 订单走廊** | `/orders` 列表 L5 + 列表→`/pay`·`/escrow` 烟测 + 可选 Playwright | `bash scripts/dev/run-orders-corridor-local.sh` → `TT_ORDERS_CORRIDOR_LOCAL: OK` · [GO_local_orders_l5](../../frontend/evidence/GO_local_orders_l5/README.md) |
| **L4 走廊 L5** | Web3 行程创新链 | `bash scripts/dev/run-enterprise-local-10.sh` → `TT_ENTERPRISE_LOCAL_10: OK` |
| **L5 可选全矩阵 E2E** | Playwright chromium 全项目 | `bash scripts/gates/local-e2e-chromium-full-matrix.sh`（**≠** 93 穷举） |

**域 L5 绿集（已编入 Phase1 / 走廊 / 冻结 README，动域须 exit 0）：**

| 域 | SSOT |
|----|------|
| 五主路由 | [FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · `five-main-routes-ui-antiregression-gate.sh` |
| Auth / Hub | [AUTH-LOGIN-UI-FREEZE](../../frontend/evidence/GO_local_auth_l5/AUTH-LOGIN-UI-FREEZE.md) · `authL5FullScore` 等 |
| 商家入驻 | [PROVIDER-REGISTER-UI-FREEZE](../../frontend/evidence/GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md) |
| 收购 PD-009 | [market/acquisition README](../../frontend/app/market/acquisition/README.md) · `acquisitionL5` 绿集 |
| Web3 走廊 | [GO_local_web3_itinerary_l5](../../frontend/evidence/GO_local_web3_itinerary_l5/README.md) |
| **`/` + `/market` 四页数据链** | [LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · `run-web3-itinerary-l5-green.sh` · [dev-local-smoke-baseline §10](../dev-local-smoke-baseline.md) |
| 订单列表走廊 | [GO_local_orders_l5](../../frontend/evidence/GO_local_orders_l5/README.md) · `run-orders-l5-green.sh` |
| 治理矩阵 | `bash scripts/gates/governance-matrix-local-gate.sh` |

---

### 1.3 诚实边界（① 全站 10）

| 可宣称 | 禁止冒充 |
|--------|----------|
| ① 本地 **编排闸** 全绿 + 上表分层 exit 0 | ② staging **`release_gate=GO`** |
| ① **L5 机读绿集** + **域烟测** 已列 | ISS-007 **`PARTIAL_GO`** = staging 全矩阵 GO |
| 可选 **Chromium 全量 E2E** 在 **①** 自证 | ① E2E = ③ Production GO |
| G-0 `acceptance.latest.log` 含 `TT_GO_LOCAL_PHASE1: OK` | `internal/webhook` / `local-dev/mark-paid` = ② Stripe 真收单 |

---

### 1.4 ① Site10 收敛 · G1 / G2/G3（双轨 · 2026-06-23 对拍）

**阶段：** 仅 **① 本地**；**≠** ② staging GO **≠** ③ Production GO。

#### 1.4.0 22-key denoised G2/G3 收敛轨（**当前真源 · Run4 · 2026-06-23 CLOSED**）

**本轨为 Site10 G2/G3 签字与 Phase① Freeze（Site10 收敛）的唯一机读真源。** **846 / 844 全矩阵不得反向推翻** 本轮签字。

| 项 | 口径 |
|----|------|
| **Manifest** | 22 锚点 · [`site10-r22-true-regression-manifest.txt`](../../frontend/evidence/GO_local_phase1/site10-r22-true-regression-manifest.txt) |
| **Batch** | 11 spec · 139 steps · single-batch webServer |
| **G1** | `TT_SITE10_P1_SLICES_RECHECK: OK` |
| **G2/G3** | `TT_SITE10_G2G3_CONVERGENCE_READY: OK` · **须** `run_complete: True` + manifest **22/22** |
| **extra FAIL** | 非 manifest 行 = **WARN only**（[`site10-r22b-extra-warn-register.txt`](../../frontend/evidence/GO_local_phase1/site10-r22b-extra-warn-register.txt)） |

```bash
bash scripts/dev/run-site10-r22b-denoised-regression-matrix.sh run
bash scripts/dev/run-site10-r22b-denoised-regression-matrix.sh parse
bash scripts/dev/run-site10-r22b-denoised-regression-matrix.sh check-gates
bash scripts/dev/run-site10-alignment-audit.sh --write
```

| 证据 | 路径 |
|------|------|
| Acceptance | [`site10-g2g3-convergence-acceptance.latest.log`](../../frontend/evidence/GO_local_phase1/site10-g2g3-convergence-acceptance.latest.log) |
| Alignment Audit | [`site10-alignment-audit.latest.txt`](../../frontend/evidence/GO_local_phase1/site10-alignment-audit.latest.txt) |
| Phase① Freeze | [`PHASE1-FREEZE-SITE10-G2G3-DENOISED.md`](../../frontend/evidence/GO_local_phase1/PHASE1-FREEZE-SITE10-G2G3-DENOISED.md) |
| ② 对齐前检查 | [`site10-phase2-staging-precheck.latest.txt`](../../frontend/evidence/GO_local_phase1/site10-phase2-staging-precheck.latest.txt) |

**② 入口（Freeze 后）：** S3/S1 precheck **PASS** → **须 Owner 书面 `scope=②`** → staging 部署 + 测试网真人验证（[PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md)）。

#### 1.4.1 844 宽矩阵轨（旁证 · **非** G2/G3 收敛真源）

**不新增发布阶段** — 本节为 **844 宽矩阵** 机读边界；**G2/G3 收敛签字以 §1.4.0 为准**。

| 项 | 口径 |
|----|------|
| **Site10 主业务矩阵（844 轨）** | Playwright 日志 **`Running 844 tests using 1 worker`**（`chromium` · **`PLAYWRIGHT_LOCAL_SITE10_MATRIX=1`**） |
| **844 轨判定** | **`site10.acceptance.latest.log`** + **`run-site10-matrix-convergence.sh check-gates`** → `TT_SITE10_THREE_GATES: OK` |
| **与 §1.4.0 关系** | 844 绿 **可** 作旁证；844 红 **不得** 撤销 Run4 22-key 签字 |
| **历史 949** | rerun11 及更早 **未** 应用下列 **`testIgnore`** 时的计数；**禁止** 用 949 与当前 G3 对拍或冒充已收敛 |
| **代码真源** | [`frontend/playwright.config.ts`](../../frontend/playwright.config.ts) · `site10MatrixTestIgnore` · `grepInvert`（`PLAYWRIGHT_LOCAL_SITE10_MATRIX=1` 时注入） |
| **编排真源** | [`scripts/dev/run-site10-matrix-convergence.sh`](../../scripts/dev/run-site10-matrix-convergence.sh) · [`scripts/gates/local-e2e-chromium-full-matrix.sh`](../../scripts/gates/local-e2e-chromium-full-matrix.sh) |
| **REAL FAIL 分桶** | [`scripts/dev/parse-site10-failures.py`](../../scripts/dev/parse-site10-failures.py) · 仅以 **当次** acceptance log 为准（**禁止** 混读 rerun 编号不同的旧 log 末行） |

**844 矩阵内仍执行的排除（标签 · 非删文件）：**

| 机制 | 范围 | 说明 |
|------|------|------|
| **`grepInvert`** | `@e2e-chain-off-mock-pay` · `@e2e-sepolia-deferred` | ① 本地闸；mock-pay / 暂缓 Sepolia 项 **另跑**（见 [TT-L4](./TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md)） |
| **`dependencies`** | `setup-meta-chain`（2 用例） | 全矩阵 **前** 短闸；**不计入** Playwright 汇总行的 844 |

**暂不纳入 G2/G3 Gate 的 spec（`testIgnore` · 须单独 corridor 跑 · 不得计入 844 红绿）：**

| 类别 | 匹配 / 代表文件 | 用途 |
|------|-----------------|------|
| **probe** | `**/*.probe.spec.ts` | 探针 / 链路观测（如 `traveltrust-hero-p1-linkage.probe.spec.ts` · `capture-*-pass-*.probe.spec.ts`） |
| **capture** | `**/*capture*.spec.ts` | 证据截图 / 像素留痕（如 `site-theme-v1-evidence-capture` · `founder-review-capture` · `cinematic-l5-evidence-capture`） |
| **visual-regression** | `traveltrust-hero-visual-regression.spec.ts` | 英雄区视觉回归（快照 · 非业务 PASS/FAIL 闸） |
| **theme-modal** | `site-theme-v1-v2-hard-refresh.spec.ts` · `site-theme-v1-market-modals.spec.ts` | 主题硬刷新 / 市场弹窗专项（**≠** `site-theme-v1-did-rank-guide-modal` 等功能 spec，后者 **在 844 内**） |
| **pes-journey** | `pes-real-user-journey-review.spec.ts` | PES 长旅程人工评审脚本（窄切片 · 非 Site10 主矩阵闸） |
| **setup 目录** | `**/setup/**` | 仅 `setup-meta-chain` 依赖项 |

**G3 通过必要条件（写死）：**

1. 日志含 **`Running 844 tests`** 且 Playwright 汇总 **零 failed**（skipped / did not run 口径以当次 log 为准）。  
2. 末行或编排段含 **`OK: local-e2e-chromium-full-matrix`**。  
3. **`parse-site10-failures.py`** 对 **同一份** `site10.acceptance.latest.log` 的 **REAL FAIL** 为 **0**（或脚本声明的收敛目标；**禁止** 仅用窄切片 GO 冒充全矩阵）。

**诚实边界：** 844 绿 **≠** [93](../spec/93-全站功能验证矩阵-域别回归清单.md) 穷举 **≠** [96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md) 每路由 **≠** ②③ GO（见 [TT-9628 · 覆盖边界](./TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary) · [TT-LOCAL-FULL-E2E-MATRIX-001 §1](./TT-LOCAL-FULL-E2E-MATRIX-001.md#tt-local-full-e2e-matrix)）。

##### 《非 Gate 测试登记表》（844 外 · 不阻塞 G1/G2/G3）

**计数纪律（防 949/844 混淆 · 写死）：**

| 禁止 | 正确 |
|------|------|
| 将本表用例 **加回** 844 汇总行或宣称「全矩阵 949 已绿」 | G3 **仅**认 **`Running 844 tests`** + 零 failed |
| 用本表 **任一** corridor **exit 0** 替代 G3 或 **① Phase 冻结签字** | 本表 **不进入** `run-site10-matrix-convergence.sh check-gates` |
| ① 未跑本表即宣称 **② Graduation** 视觉/主题/PES 已验 | **Phase② Graduation 前**（[PHASE2-GRADUATION-CLOSURE-PROGRAM](./PHASE2-GRADUATION-CLOSURE-PROGRAM.md) 步骤 6 · Owner 签字 **G-09** 前）须 **逐行** 完成下表验收并留痕 |

**阶段边界：**

| 阶段 | 本表地位 |
|------|----------|
| **① 全矩阵收敛（G1/G2/G3）** | **不阻塞** — 844 绿即可进入 §1.4 收口顺序步骤 1；本表 **不得** 拖慢或替代 G3 |
| **① Alignment Audit（步骤 2）** | **登记对拍** — 核对下表「责任文档 ↔ 证据目录 ↔ 最近 exit 0」是否一致 |
| **② Graduation 前** | **须完成验证** — 下表五类 **全部** 达到「验收标准」列；缺任一行 **不得** Owner Graduation 签字（**≠** 要求把它们塞回 844） |

**代码排除真源（与上表同步）：** [`frontend/playwright.config.ts`](../../frontend/playwright.config.ts) · `site10MatrixTestIgnore`（`PLAYWRIGHT_LOCAL_SITE10_MATRIX=1`）。

| 类别 | spec / 匹配 | 执行入口（仓库根 · ①） | 责任文档 | 验收标准 | Graduation 前留痕 |
|------|-------------|------------------------|----------|----------|-------------------|
| **probe** | `**/*.probe.spec.ts`（12 文件 · 含 scene-debug / hero corridor） | **Hero 走廊（推荐）：** `cd frontend && npm run e2e:hero-globe-closure`<br>**首页模块化 QA：** `cd frontend && npm run e2e:traveltrust-home-modular-qa`<br>**全 probe（旁证）：** `cd frontend && npx playwright test --config=playwright.scene-debug.probe.config.ts`<br>**单文件：** `cd frontend && npx playwright test --project=chromium e2e/<name>.probe.spec.ts` | [TT-PH1-CINEMATIC-ANIMATION-L5-001 §6](./TT-PH1-CINEMATIC-ANIMATION-L5-001.md) · [issues-phase1-ui-ux-traveltrust-v6 §TT-PH1-182 旁](./issues-phase1-ui-ux-traveltrust-v6.md) · [`playwright.scene-debug.probe.config.ts`](../../frontend/playwright.scene-debug.probe.config.ts) | 当次 Playwright **零 failed**；Hero 走廊脚本 **全绿**；探针 **不** 写入 `site10.acceptance.latest.log` | `frontend/evidence/GO_local_phase1/` 或域 evidence 下 **probe 复跑 log**（含日期 · exit 0） |
| **capture** | `**/*capture*.spec.ts`（**不含** `*.probe.spec.ts` 中 capture 命名旁路时按 probe 行） | **Site Theme POST 九路由：** `cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npm run e2e:site-theme-v1-capture`<br>**Wave-B 旁证：** `cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npm run e2e:site-theme-v1-wave-b-capture`<br>**Cinematic L5 §6.2：** `cd frontend && npm run capture:cinematic-l5`（或 `npm run verify:cinematic-l5` + 可选 refresh）<br>**Founder 五主截图：** `cd frontend && npx playwright test e2e/founder-review-capture.spec.ts --config=playwright.founder-review.config.ts` | [TT-PH1-SITE-THEME-V1-UPGRADE-001 §6.2](./TT-PH1-SITE-THEME-V1-UPGRADE-001.md) · [TT-PH1-CINEMATIC-ANIMATION-L5-001 §7](./TT-PH1-CINEMATIC-ANIMATION-L5-001.md) · [FOUNDER-REVIEW-REPORT](./FOUNDER-REVIEW-REPORT.md) · [`GO_local_site_theme_v1`](../../frontend/evidence/GO_local_site_theme_v1/) · [`GO_local_cinematic_l5_closure`](../../frontend/evidence/GO_local_cinematic_l5_closure/) | **机采：** 约定 PNG 目录齐全且 spec **exit 0**（Founder capture **无 assertion** → 以产出目录 + maintainer 目视清单为准）；**Cinematic：** `verify:cinematic-l5` **exit 0** + §6.2 勾选 | `POST-screenshots/` · `V2-hard-refresh-capture/` · `GO_local_cinematic_l5_closure/*.png` · `evidence/founder-review-*/screenshots/` |
| **visual-regression** | `traveltrust-hero-visual-regression.spec.ts` | `cd frontend && npm run e2e:traveltrust-visual`<br>基线更新（maintainer only）：`npm run e2e:traveltrust-visual:update` | [issues-phase1-ui-ux-traveltrust-v6 · TT-PH1-182/163](./issues-phase1-ui-ux-traveltrust-v6.md) · [`e2e/traveltrust-hero-visual-regression.spec.ts-snapshots/`](../../frontend/e2e/traveltrust-hero-visual-regression.spec.ts-snapshots/) | **`e2e:traveltrust-visual` exit 0**；375/390 + desktop 快照 **与 committed baseline 一致**（**禁止** 用 `--update-snapshots` 冒充 Graduation 验收） | 终端 log + 快照目录 SHA 与 **Graduation 前** 复跑一致 |
| **theme-modal** | `site-theme-v1-v2-hard-refresh.spec.ts` · `site-theme-v1-market-modals.spec.ts` | **硬刷新机采（含于 theme capture config）：** `cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npm run e2e:site-theme-v1-capture`（含 hard-refresh spec）<br>**市场弹窗 smoke：** `cd frontend && node ./scripts/run-e2e-default.mjs --project=chromium e2e/site-theme-v1-market-modals.spec.ts` | [`LOCAL-HARD-REFRESH-V2-20260524.md`](../../frontend/evidence/GO_local_site_theme_v1/LOCAL-HARD-REFRESH-V2-20260524.md) · [TT-PH1-SITE-THEME-V1-CONTROL-MATRIX](./TT-PH1-SITE-THEME-V1-CONTROL-MATRIX.md) · **注：** `site-theme-v1-did-rank-guide-modal` **在 844 内** — 本行 **不** 重复登记 | hard-refresh：**PNG 01～06** + 目视清单勾选；market-modals：**dialog visible** · spec **exit 0** | `GO_local_site_theme_v1/V2-hard-refresh-capture/` · market-modals 复跑 log |
| **pes-journey** | `pes-real-user-journey-review.spec.ts` | `cd frontend && npx vitest run lib/pesJourneyReviewAggregate.test.ts`<br>`cd frontend && npx playwright test e2e/pes-real-user-journey-review.spec.ts --project=chromium` | [PES-REAL-USER-JOURNEY-REVIEW](./PES-REAL-USER-JOURNEY-REVIEW.md) · [PRODUCT-ENHANCEMENT-SPRINT](./PRODUCT-ENHANCEMENT-SPRINT.md) · [`frontend/evidence/pes-rujr-20260607/`](../../frontend/evidence/pes-rujr-20260607/) | Vitest 聚合 **exit 0**；Playwright RUJR spec **exit 0**；`rujr-report-synth.json` 与 **PES_RUJR_ID** 一致 | `pes-rujr-*/rujr-report-synth.json` + Graduation 前 **staging 或 ① 全栈** 复跑 log（② 须 **非** local-dev 零金额覆盖） |

**Graduation 收口 grep（Owner · ② · 旁证，非 G3 替代）：** Alignment Audit 末行可记 `TT_SITE10_NON_GATE_REGISTRY: VERIFIED (① corridor · ② pre-graduation)` — **须** 附五类证据路径；真源毕业闸仍为 [TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD](./TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md) · `TT_TESTNET_PERFECT_VALIDATION_GO`。

| 闸 | 含义 | 成功 grep |
|----|------|-----------|
| **G1** | P1 切片顺序复跑（25/25） | `TT_SITE10_P1_SLICES_RECHECK: OK` 或 `pass=25 fail=0` |
| **G2** | 全站企业编排（含可选全矩阵） | `TT_ENTERPRISE_SITE_10_LOCAL: OK` |
| **G3** | Chromium **844** 主业务矩阵零 FAIL | `OK: local-e2e-chromium-full-matrix` · 且 log 含 **`Running 844 tests`** |

**SSOT 脚本（仓库根）：**

```bash
source scripts/dev/export-database-url-from-root-env.sh
export P3_CHAIN_OFF=1 ENTERPRISE_SITE_10_FULL_E2E=1
export PLAYWRIGHT_FULL_STACK=1 PLAYWRIGHT_E2E_STABILITY=1
export PLAYWRIGHT_REUSE_API_SERVER=1 PLAYWRIGHT_REUSE_FE_SERVER=0 PLAYWRIGHT_SKIP_NEXT_PURGE=1
export PLAYWRIGHT_LOCAL_SITE10_MATRIX=1
export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1 NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=1
unset REQUIRE_IDEMPOTENCY_KEY

bash scripts/dev/run-site10-matrix-convergence.sh check-gates    # G1 G2 G3
bash scripts/dev/run-site10-matrix-convergence.sh run-matrix       # 长跑 · 写 site10.acceptance.latest.log
PYTHONIOENCODING=utf-8 python scripts/dev/parse-site10-failures.py \
  frontend/evidence/GO_local_phase1/site10.acceptance.latest.log   # REAL FAIL 分桶
```

**三项闸全绿末行：** `TT_SITE10_THREE_GATES: OK (① · ready for phase freeze review · not ②③ GO)`

**① 收口顺序（须顺序 · 禁止跳阶 · 2026-06-23 对拍）：**

1. **22-key denoised 收敛** — `TT_SITE10_G2G3_CONVERGENCE_READY: OK`（§1.4.0）· **✅ Run4**  
2. **Alignment Audit** — `TT_SITE10_ALIGNMENT_AUDIT: CLOSED`（§1.4.2）· **✅ 2026-06-23**  
3. **更新技术文档** — 本 runbook · [`GO_local_phase1/README`](../../frontend/evidence/GO_local_phase1/README.md) · Freeze 文件  
4. **冻结 Phase①（Site10 G2/G3 轨）** — [`PHASE1-FREEZE-SITE10-G2G3-DENOISED.md`](../../frontend/evidence/GO_local_phase1/PHASE1-FREEZE-SITE10-G2G3-DENOISED.md) · [TT-PHASE1-FINAL-CONVERGENCE-FREEZE](./TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md)  
5. **② 测试网真人验证** — S3/S1 precheck **PASS** · **须 Owner `scope=②`** · [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) G-0～G-4  
6. **72h Soak · TN-P1-010 · Graduation** — §1.4.4 · [PHASE2-GRADUATION-CLOSURE-PROGRAM](./PHASE2-GRADUATION-CLOSURE-PROGRAM.md)  
7. **③ Production GO** — §1.4.5 · [go-live-checklist](../go-live-checklist.md)

**844 宽矩阵（旁证轨）：** 仍可按 §1.4.1 收敛 · **不阻塞** 步骤 1～4 已完成项 · **禁止** 用 844 红绿 **推翻** §1.4.0 签字。

#### 1.4.2 步骤 2 · Alignment Audit Exit Criteria（写死 · 防无限膨胀）

**入口：** `TT_SITE10_G2G3_CONVERGENCE_READY: OK`（§1.4.0）· S3/S1 precheck PASS  
**出口：** 下表 **六行全 ✅** + **`TT_SITE10_ALIGNMENT_AUDIT: CLOSED`** → 方可 Freeze 与 **② Owner scope=②** 真人验证  
**禁止：** 以「再扫一轮」「补一份旁证」无限追加维度 — **未列入下表者默认 OUT OF SCOPE**

| # | Exit 项 | 通过判据 | 对拍真源（示例） |
|---|---------|----------|------------------|
| 1 | **代码真源一致** | `frontend/` 路由 / 绿集 / `playwright.config.ts` **`site10MatrixTestIgnore`** 与 §1.4.1 **一致** | [FIVE-PAGES-ENTERPRISE-CODE-AUDIT](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603.md) · 各 `app/*/README.md` |
| 2 | **文档真源一致** | 本页 · 域 freeze README · runbook **无互相矛盾** 的计数/阶段/GO 宣称 | §1.4.1 · [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) |
| 3 | **脚本真源一致** | `run-site10-matrix-convergence.sh` · `local-e2e-chromium-full-matrix.sh` · env 导出与 §1.4 SSOT 命令块 **一致** | [`scripts/dev/run-site10-matrix-convergence.sh`](../../scripts/dev/run-site10-matrix-convergence.sh) |
| 4 | **G2/G3 引用一致** | **§1.4.0 22-key** 为收敛真源；**846/844 不得** 冒充或推翻当前 G2/G3 签字 | §1.4.0 · [TT-LOCAL-FULL-E2E-MATRIX-001 §1](./TT-LOCAL-FULL-E2E-MATRIX-001.md#tt-local-full-e2e-matrix) |
| 5 | **SSOT 无冲突** | 阶段 **①②③** 不跳阶；**禁止假完成** 句式与 [CONTRIBUTING](../../CONTRIBUTING.md#no-false-completion) 同源 | [TT-9628 §0.0.5](./TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion) |
| 6 | **历史口径已归档** | **949 → 844**、rerun 编号、非 Gate 登记表 **已写入** evidence 或本页；旧 log **标注**不可用于当前 G3 | `frontend/evidence/GO_local_phase1/site10-rerun*-*.txt` · §1.4.1《非 Gate 测试登记表》 |

**机读出口（①）：** `bash scripts/dev/run-site10-alignment-audit.sh --write` → **`TT_SITE10_ALIGNMENT_AUDIT: CLOSED`**

**范围外（默认不做）：** 93 全文 MANUAL 补跑 · 96-20 每路由深审 · ③ 生产项 — **留 ②③** 或专项 runbook。

#### 1.4.3 步骤 4 · Phase① Freeze 与解冻规则（写死）

**Freeze 含义：** [TT-PHASE1-FINAL-CONVERGENCE-FREEZE](./TT-PHASE1-FINAL-CONVERGENCE-FREEZE.md) **STRUCTURE FROZEN** + G-0 `TT_GO_LOCAL_PHASE1: OK` — **≠** ② Graduation **≠** ③ Production GO。

**Freeze 后仅允许：**

| 允许 | 示例 |
|------|------|
| **P0 Bug** | REAL FAIL 回归 · 数据链断裂 · 安全/鉴权 P0 |
| **安全修复** | 依赖 CVE · 密钥/权限硬闸 |
| **文档勘误** | SSOT 互指 · 计数口径 · 证据路径 **不扩契约** |

**Freeze 后禁止：**

| 禁止 | 示例 |
|------|------|
| **新功能** | 新 onboarding 步 · 新 fee 规则 · 新 growth 实验 |
| **新页面 / 新路由** | 五主路由 structure 回流 · 新 Hub 域 |
| **新流程 / 新 gate 包** | 扩 § · 新 DOMAIN · 新发布阶段 |
| **新角色 / 新权限面** | 第六 `users.role` · 新 Admin 写矩阵列 |

**解冻：** 仅 **Owner** 书面决定 + **G-1/G-2** 清闸后 **② 专项** 合入 — 见 [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) · [GO_local_phase1 README](../../frontend/evidence/GO_local_phase1/README.md)。**禁止**「顺手加个功能」式破冻。

#### 1.4.4 步骤 6 · Phase② Graduation Gate（Owner 可裁决清单）

**阶段：** **② 测试网** — **须** Phase① Freeze + [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) G-0～G-4 + **G-1/G-2 清闸**  
**完整机读：** [TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD §1](./TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md#1--唯一毕业退出写死)（G-01～G-09）· [PHASE2-GRADUATION-CLOSURE-PROGRAM](./PHASE2-GRADUATION-CLOSURE-PROGRAM.md)  
**本节：** **一页清单** — 回答「测试网到底毕业没有？」**全部 ✅** + **`TT_TESTNET_GRADUATION: CLOSED`** 方可进入步骤 7 宽表评审。

| # | Graduation Gate | PASS 判据 | SSOT |
|---|-----------------|-----------|------|
| 1 | **真人验收** | staging 真人路径（含 HAT-R1 钱包 · P0 手测）**无 OPEN P0** | [TT-LOCAL-P0-MANUAL-UAT-CHECKLIST](./TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md) · `run-hat-r1-sepolia-live-wallet.sh` |
| 2 | **TN-P1-010** | Indexer 深账 **`reconcile_compound_pass=true`** · `missing_projection=0` · 证据 stamp **晚于** soak `completed_at` | `record-tn-p1-010-indexer-reconcile-staging-evidence.sh` |
| 3 | **72h Soak** | `evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json` 存在 · **全新 job**（`P2FC_SOAK_SUPERSEDE=1`） | [PHASE2-GRADUATION-CLOSURE-PROGRAM §执行序](./PHASE2-GRADUATION-CLOSURE-PROGRAM.md) |
| 4 | **监控无 P0/P1** | Open Testnet **P0=0 · P1=0** · Readiness **100/100** | [TESTNET-PERFECT-VALIDATION-REPORT](./TESTNET-PERFECT-VALIDATION-REPORT.md) |
| 5 | **财务链路** | B 轨 **非零** `amount_minor` · Stripe test webhook 闭环 · **无** staging `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` | PHASE2 §1 · G-4 证据 |
| 6 | **治理链路** | Sepolia 治理栈 · vote/claim/timelock **staging 证据** · Cert #7–#12 签字 | [TTG-CERT-EXECUTION-SESSION-RUNBOOK](./TTG-CERT-EXECUTION-SESSION-RUNBOOK.md) |
| 7 | **Escrow 链路** | staging 订单/托管 **真回调** 烟测 · **≠** ① mock-pay 走廊 | [PHASE2 §5](./PHASE2-START-CHECKLIST.md) · R-003 相关域 |
| 8 | **§1.4.1 非 Gate 五类** | probe · capture · visual-regression · theme-modal · pes-journey **Graduation 前验收留痕** | §1.4.1《非 Gate 测试登记表》 |

**毕业末行 grep：** `TT_TESTNET_GRADUATION: CLOSED` · `TT_TESTNET_PERFECT_VALIDATION_GO: GO` · Owner **`OWNER-SIGNOFF.md`**（[G-09 模板](./evidence-templates/PHASE2-TESTNET-OWNER-SIGNOFF-SOLO.md)）

**禁止：** ① 844 绿 · 窄切片 `release_gate=GO` · soak **未 COMPLETED** — **任一** 冒充「② 已毕业」。

#### 1.4.5 步骤 7 · Production GO（Owner Sign-off · 写死）

**阶段：** **③ 公网/生产** — **须** 步骤 6 **`TT_TESTNET_GRADUATION: CLOSED`**  
**技术清单详表：** 本文 §3 · [go-live-checklist](../go-live-checklist.md) · R-002 **`--fail-on-no-go`**

**Production GO 最小 Owner 清单（AND）：**

| # | 项 | PASS 判据 |
|---|-----|-----------|
| 1 | **Phase② Graduation** | §1.4.4 **全勾** · `TT_TESTNET_GRADUATION: CLOSED` |
| 2 | **发布包生成** | 镜像 **digest** · `TRAVELTRUST_GIT_SHA` · 与部署清单一致 | go-live **§0** |
| 3 | **回滚方案存在** | 上一版 digest / DB 回滚 / feature flag **已文档化且演练过** | go-live **§0** · DR signoff |
| 4 | **Owner Sign-off** | Product + Engineering + Compliance（单人维护者四帽合一见 [SOLO-MAINTAINER-SIGNATURE-INDEX](../../frontend/evidence/GO_local_phase1/SOLO-MAINTAINER-SIGNATURE-INDEX.md)）**书面拍板** | go-live **§0.3** · `evidence/GO_YYYYMMDD/` |

**末行 grep（③）：** **`Production GO`** · `validate-regression-report.py --fail-on-no-go` · **`release_gate=GO`**（**生产** `environment.name`）

**禁止：** 技术闸全绿但 **无 Owner Sign-off** 即公网切流；**①②** 任何结果 **冒充** **③ Production GO**。

#### 1.4.6 当前执行优先级（写死 · 维护者排序 · 2026-06-23）

**诚实结论：** **§1.4.0 22-key G2/G3 · Alignment Audit · Phase① Freeze（Site10 轨）已 CLOSED**；下一合法动作 = **Owner `scope=②`** 测试网真人验证（S5/S6）。

| 优先级 | 项 | 状态 / 动作 |
|--------|-----|-------------|
| **P0** | **22-key denoised G2/G3** | **✅ CLOSED** — Run4 · `TT_SITE10_G2G3_CONVERGENCE_READY: OK` |
| **P1** | **Alignment Audit** | **✅ CLOSED** — `run-site10-alignment-audit.sh --write` |
| **P1b** | **844 宽矩阵（旁证）** | **BACKLOG** — `run-site10-matrix-convergence.sh` · **不阻塞** ① Freeze |
| **P2** | **② 测试网主轨** | **HOLD** — 待 Owner **`scope=②`** · 主轨 = S5/S6 → 真人验证 → Soak → TN-P1-010 · **禁止** 回本地收敛 |
| **P3** | **Phase② Graduation** | **文档已写死** — §1.4.4 · **须** ② 真人验证后 |
| **P4** | **Production GO** | **文档已写死** — §1.4.5 · **须** Graduation **CLOSED** 后 |

**参考：** rerun12～14 为 **844 轨** 历史 FAIL 分桶 — **禁止** 用其 **推翻** §1.4.0 Run4 签字。

**Community E2E 稳定性（①）：** API 侧默认 `TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1`（`start-api-for-playwright.sh` · `playwright.config.ts` · `run-matrix`）；Feed 会话 helper：`frontend/e2e/helpers/communityFeedSession.ts`。

---

## 2 · ② 测试网 / staging / 公网回调（**未开工 · 需求清单**）

**入口闸：** [PHASE2-START-CHECKLIST · G-0～G-4](./PHASE2-START-CHECKLIST.md#0--总入口闸phase-②-任何工作流开工前) — **G-1/G-2 OPEN** 前 **禁止** 宣称 ② 实施或 GO。

| 类别 | 必须项 | SSOT / 命令 |
|------|--------|-------------|
| **环境与隔离** | staging **`DATABASE_URL`** · HTTPS **`API_BASE_URL`** · Stripe **test** 与生产密钥 **零混用** | G-1 · [96-03 §轮换](../spec/96-03-安全密钥与供应链.md) |
| **B 轨 USDC（默认）** | **`ONBOARDING_FEE_RECEIVER_ADDRESS`** · quote **`currency=USDC`** · **`OnboardingFeePaid` 索引** | [PHASE2 §1.0](./PHASE2-START-CHECKLIST.md#1--b-轨准入费96-18) · ONB-P2-USDC-001～002 |
| **B 轨 PSP（可选）** | **`sk_test_`/`pk_test_`** · PI **非零** `amount_minor` · **关闭** staging 上 `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` | [PHASE2 §1.1](./PHASE2-START-CHECKLIST.md#1--b-轨准入费96-18) · ONB-P2-001～006 |
| **公网 Webhook** | Stripe Dashboard / **`stripe listen`** → **`https://<staging>/api/v1/hooks/stripe/onboarding`** · **`whsec_*` 一对一** | [PHASE2 §4](./PHASE2-START-CHECKLIST.md#4--webhook-回调内网-json-vs-stripe-公网) · [TT-9618](../runbook/TT-9618-onboarding-local-testnet.md) |
| **测试网合约** | Sepolia（或目标测试网）部署 · registry 地址 · API `.env` 加载 | [PHASE2 §2](./PHASE2-START-CHECKLIST.md#2--测试网合约部署protocol-convergence--a-轨) · [TT-9630](./TT-9630-protocol-convergence-testnet-pregate.md) |
| **链上 stake（A 轨）** | `stake-quote` 四相等式 · testnet TTG · **与 B 轨 paid 分证据** | [PHASE2 §3](./PHASE2-START-CHECKLIST.md#3--链上-stake-对拍a-轨-vs-b-轨--主理人) |
| **Staging 烟测** | 商家/主理人/Hub **真 Stripe + webhook** 闭环 | `check-phase2-onboarding-staging-ready.sh` → `smoke-onboarding-testnet.sh` |
| **浏览器（②）** | staging URL Playwright · Sepolia 基线 | [TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001](./TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md) · `npm run e2e:sepolia` |
| **回归矩阵** | staging 首次 **R-003** A+B 域 · `report.json` **`environment.name`** 匹配 | [R-003](../spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md) · [R-002](../spec/R-002-回归执行闭环与发布准入.md) |

**② 成功末行（草案 · 垂直切片，非全站）：** `TT_SMOKE_ONBOARDING_TESTNET: OK` 等 — 见 [PHASE2 §5.3](./PHASE2-START-CHECKLIST.md#53--②-验收出口草案--未启动)。

---

## 3 · ③ 生产 / 公网 / 主网（**另闸 · 需求清单**）

**入口：** [go-live-checklist](../go-live-checklist.md) · [缺口与待补-官方总表 · P0](../spec/缺口与待补-官方总表.md) · **§1.4.5 Production GO Owner 清单**（**须** Phase② **`TT_TESTNET_GRADUATION: CLOSED`**）

| 类别 | 必须项 | SSOT |
|------|--------|------|
| **发布真值** | 镜像 digest · `TRAVELTRUST_GIT_SHA` · 双人复核 | go-live **§0** |
| **R-002 / 93** | `validate-regression-report.py` **`--fail-on-no-go`** · **`release_gate`** 符合 [93 §7.1](../spec/93-全站功能验证矩阵-域别回归清单.md) · Owner 双签 | go-live **§0.3** · R-002 |
| **合约与链** | 生产 RPC · 部署地址与 `.env` / `NEXT_PUBLIC_*` 一致 · pause 策略 | go-live **§1** |
| **数据库** | 生产库 · 迁移全量 · 备份/PITR 演练 | go-live **§2** |
| **API 安全** | `CORS_ORIGINS` 生产域 · `INTERNAL_API_SECRET` · 内网路由不可公网 | go-live **§3** |
| **PSP** | **`sk_live_`** · 生产 webhook · **禁止** local-dev 零金额 | **③ only** |
| **主网** | Ethereum Mainnet **`CHAIN_ID=1`** · [TT-MAINNET G0～G6 + SL](../runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md) | go-live **§9** |
| **公网可达** | 生产 HTTPS 前端 · 生产 API · 监控/on-call | go-live **§10～§11** |

**禁止：** 用 **① `TT_ENTERPRISE_SITE_10_LOCAL: OK`** 或 **② testnet 烟测** 替代 **③ Production GO**。

---

## 4 · 进度对照（2026-05-29）

| 档位 | 状态 |
|------|------|
| **A 走廊 10** | **可绿** — `run-enterprise-local-10.sh` |
| **B 全站 10（①）** | **收敛中 · P0** — §1.4.6：**rerun14 IN FLIGHT**（rerun12/13 = **57 FAIL**）· G3 基线 **844** · 待 G1/G2/G3 全绿后再 §1.4.2 Audit |
| **C 测试网** | **Prepared / Not Started** — 本文 §2 + PHASE2 |
| **D 生产/公网** | **未验** — 本文 §3 + go-live |

---

## 5 · 留痕建议

| 里程碑 | 路径 |
|--------|------|
| Phase1 G-0 | `frontend/evidence/GO_local_phase1/acceptance.latest.log` · `TT_GO_LOCAL_PHASE1: OK` |
| 全站 10 G-0（①） | `frontend/evidence/GO_local_phase1/site10.acceptance.latest.log` · `TT_ENTERPRISE_SITE_10_LOCAL: OK` |
| 走廊 10 | 终端输出含 `TT_ENTERPRISE_LOCAL_10: OK` |
| ② staging | `evidence/GO_phase2_*/` · R-003 `report.json` |
| ③ 生产 | go-live 勾选 + `evidence/GO_YYYYMMDD/report.json` |
