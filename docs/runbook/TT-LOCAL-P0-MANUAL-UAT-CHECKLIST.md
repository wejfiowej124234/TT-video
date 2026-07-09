# TT-LOCAL-P0-MANUAL-UAT-CHECKLIST

**Version:** 1.0.1 · **2026-06-25** · **FREEZE ACTIVE（① P0 手测 · 三层文档树已冻结）**  
**阶段口径：** **① 本地** — 补全 [TT-LOCAL-TEST-ACCOUNTS-MATRIX](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md) **固定六账号** 无法覆盖的 **P0 企业验收**；**≠ ② staging GO** · **≠ ③ Production GO**。

> **冻结纪律：** P0-01～P0-06 **清单项不变** · **不新增**固定种子 · **不新增**本轨 smoke/脚本 · **不新增**第四套验收轨。日常**仅**维护 §1 勾选 · 签字行 · [§0.2 P0 列](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-coverage-matrix) — 见矩阵 [§0a.0](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-three-layer-doc-tree)。TL#1 前不做 Graduation 序；TL#1 后见 [PHASE2-GRADUATION-CLOSURE-PROGRAM](PHASE2-GRADUATION-CLOSURE-PROGRAM.md)。

**固定种子 SSOT：** [TT-LOCAL-TEST-ACCOUNTS-MATRIX.md](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md)（**Business Personas** C1–C4 / E1–E2 · **Admin Console Personas** 见矩阵 **[§10](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-admin-console-personas)** · **不混用**）

> **身份体系隔离（与矩阵 [§0](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-test-accounts-root) 同句）：** 产品业务账号（**Business Personas**）与 **Admin Console Personas** 属于两套独立身份体系，任何文档、测试、验收、证据均**不得混用**；**不得**以产品账号通过替代 Admin RBAC 验收，也**不得**以 Admin RBAC 通过替代产品业务验收。
>
> **Business 三层验收（[§0a](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-local-three-layer-acceptance) · 均需 · 互不替代）：**
>
> | 层 | 执行 | 目的 | SSOT |
> |----|------|------|------|
> | **① API** | **脚本** | 每日登录 + 核心 API 回归 | 矩阵 [§0a.1](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-local-three-layer-acceptance) |
> | **② UI** | **人工** | 浏览器逐页 — 流程 · 交互 · 文案 · 视觉 | [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) |
> | **③ P0** | **人工为主** | 发布前完整闭环 — Escrow · 审批 · 治理 · 支付 · 争议 | 本文档 |
>
> **Coverage Matrix：** [§0.2](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-coverage-matrix) · API/UI/P0 列与上表一一对应。
>
> **唯一身份来源（[§0.1](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-single-source-of-identity)）：** 四类身份真源 — **禁止**本文档外另立账号表。
>
> **覆盖矩阵（可维护 · [§0.2](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-coverage-matrix)）：** 验收完成后更新对应格 — **不**扩 Persona 行。
>
> **本文档 = ③**（P0-01 **Admin Console**）；**不**用 Business ①②③ 或 C2 捷径勾选「六角色 RBAC 全完成」。

**② 测试网台账（分文件 · 无 ① 密码）：**

| 文档 | 用途 |
|------|------|
| [ADM-U01-staging-rbac-matrix.md](ADM-U01-staging-rbac-matrix.md) | Admin **六控制台角色** · staging Token/DB |
| [TESTNET-PERFECT-VALIDATION-REPORT.md](TESTNET-PERFECT-VALIDATION-REPORT.md) | 六角色 · TN-P1 · staging cohort |
| [FIVE-ROLE-FULL-CHAIN-AUDIT-REPORT.md](FIVE-ROLE-FULL-CHAIN-AUDIT-REPORT.md) | FRCA-GAP-M01–M04 手操缺口 |

---

## 0 · 使用方式

1. 先跑 **`scripts\start-api-with-seed.bat`**（Step **6b5** 等）— 仅证明 **① API**（**脚本** · [§0a.1](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-local-three-layer-acceptance)）。
2. **② UI**（**人工** · [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md)）：六账号浏览器逐页勾选 — **不**计入本 P0 表。
3. 再按 **P0-01～P0-06**（**③** · **人工为主** · [§0a.3](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-local-three-layer-acceptance)）逐项手测或 L3 脚本旁证。
4. **禁止**用 ① 脚本绿、② UI 手点或 Step 6 探针 exit 0 勾选本表「全完成」。更新 [§0.2 Coverage](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-coverage-matrix) 对应列。

**签字行（可选）：**

| 项 | 值 |
|----|-----|
| 验收阶段 | ① 本地 |
| git SHA | `git rev-parse --short HEAD` |
| 日期 UTC | |
| 结论 | P0 全勾 / 部分（列未勾 ID） |

---

## 1 · P0 清单（① 必做 · 固定矩阵不覆盖）

### P0-01 · Admin 六控制台角色 RBAC

| 项 | 说明 |
|----|------|
| **固定矩阵** | **非** Business 六账号 — Admin 见矩阵 **[§10](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-admin-console-personas)** |
| **本地捷径** | C2 `tourist@test.com` Step 6b2 = SuperAdmin **仅开发便利** · **≠** 六角色 GO |
| **不覆盖** | Ops · CS · Risk · Finance · Auditor 的 deny/pass · Shell 六域写操作 |
| **① 验收路径（二选一）** | **A** `bash scripts/dev/smoke-admin-rbac-matrix-local.sh`（ephemeral `adm-rbac-*@traveltrust.test`）· **B** 浏览器手测：临时 promote 第二账号为 CS 并验 deny |
| **② 验收路径** | `bash scripts/dev/record-adm-u01-staging-evidence.sh` · 见 [ADM-U01](ADM-U01-staging-rbac-matrix.md) |
| **禁止** | 用 C2 进 `/admin` 冒充六角色矩阵 GO |

| # | 检查项 | ① L3/手测 | ② staging | 证据 |
|---|--------|-----------|------------|------|
| 1 | SuperAdmin 写路径可达 | C2 | ADM-U01 Super | |
| 2 | 非 Super 角色至少 1 条 **deny** 与探针一致 | ephemeral RBAC smoke | ADM-U01 102/102 | |
| 3 | Admin 2FA enforced 写路径（若本轮范围含 ADM-U02） | `smoke-admin-adm-u02-local.sh` | ADM-U02 证据 | |

---

### P0-02 · Growth 双用户（邀请人 + 被邀请人）

| 项 | 说明 |
|----|------|
| **固定矩阵** | C2 可 **Admin 建码**；**无**固定「邀请人/被邀请人」对 |
| **不覆盖** | `/me/referrals` · `?ref=` 注册绑定 · ledger · anti-fraud 用户侧 |
| **① 验收路径** | **手测卡：** C2 Admin 建 referral code → **L3** 邮箱 B 打开 `/auth/register?ref=…` 注册 → Admin 查 ledger / 用户查 `/me/referrals` |
| **脚本旁证** | `bash scripts/dev/smoke-growth-referral-p0-local.sh`（**仅端点** · **非**双用户闭环）→ 须 **+ 上项手测** |
| **禁止** | 仅 G-S1 smoke exit 0 即宣称 Growth 用户闭环完成 |

| # | 检查项 | 账号 | 证据 |
|---|--------|------|------|
| 1 | Admin 创建 referral code | C2 | |
| 2 | 新用户带 `?ref=` 注册成功 | L3 邮箱 B | |
| 3 | 邀请关系可在 Admin 或 `/me/referrals` 核对 | C2 + B | |

---

### P0-03 · 从零入驻（非 C1 捷径）

| 项 | 说明 |
|----|------|
| **固定矩阵** | C1 **禁止**用于本项；C3/C4 为 **已 active/approved** 后态 |
| **不覆盖** | 主理人 **选辖区** · 商家/向导 **pending → Admin 批** · A1/A2 逐步 |
| **① 验收路径** | `RESET_DOCKER_DB=1` 启栈（**勿** `STEWARD_PERSIST`）→ **L3 新邮箱** 走 wizard → **C2** Admin 批 → 业务轨继续 |
| **脚本旁证** | `bash scripts/dev/smoke-steward-onboarding-local.sh`（主理人 API 链 · ephemeral） |
| **主理人 B 轨** | Anvil **#1** + `bash scripts/dev/mint-ttg-anvil-local.sh 0x70997970…` |

| # | 域 | 检查项 | 账号 |
|---|-----|--------|------|
| 1 | 主理人 | `/steward/register` Step1 **自选辖区** → 批准 → A/B 轨 | L3 + C2 |
| 2 | 商家 | `/provider/register` → pending → Admin 批 → `/provider` | L3 + C2 |
| 3 | 向导 | `/guide/register` → 钱包验证 → Admin 批 → `/guide` | L3 + C2 |

---

### P0-04 · 争议 + 裁决员

| 项 | 说明 |
|----|------|
| **固定矩阵** | **无** `arbitrator` 固定种子 |
| **不覆盖** | 开争议 → 裁决 → PG `disputes.status=resolved` |
| **① 验收路径** | `bash scripts/dev/smoke-order-escrow-dispute-p0-local.sh`（**L3 API 切片** · 默认重启 API+`P3_SEED_ARBITRATOR_EMAIL`）**或** 完整 `run-order-escrow-dispute-deep-audit.sh`（须 Python 探针） **或** L3 订单手测 + 裁决员登录 |
| **禁止** | 仅用 C2/C3 mock-pay 完成单即宣称争议轨 closed |

| # | 检查项 | 路径 | 证据 |
|---|--------|------|------|
| 1 | 旅行者（C2 或 L3）对 in_progress 单开争议 | 手测 / 脚本 | |
| 2 | 裁决员账号 resolve（refund_ratio） | env + L3 arbitrator | |
| 3 | 双方读回 `resolved` | API 或 UI | |

---

### P0-05 · 治理链上手操（非 C1 工作台捷径）

| 项 | 说明 |
|----|------|
| **固定矩阵** | C1 可打开 `/governance` · **已质押 CN 捷径**；**≠** propose/vote/delegate/claim 全链 |
| **不覆盖** | MetaMask **提案 · 投票 · 委托 · 领取**（FRCA-GAP-M04） |
| **① 验收路径** | `bash scripts/dev/smoke-governance-proposals-l5-local.sh`（vitest/E2E 切片）+ **手测**：C1 或 L3 主理人钱包接 Anvil → `/governance/proposals/new` |
| **② 验收路径** | Sepolia HAT-R1 · TN-P1-004 · 见 [TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT](TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT.md) §6 |
| **禁止** | Step **6t** 或 C1 已质押 UI 冒充 Governor 链上 GO |

| # | 检查项 | ① | ② |
|---|--------|---|---|
| 1 | 提案创建 UI/API | 手测 + smoke | HAT 证据 |
| 2 | 钱包 vote 或 delegate | MetaMask Anvil | Sepolia live |
| 3 | 领取/观测与脚注一致 | 工作台观测 | TN-P1 |

---

### P0-06 · Escrow 全 UI 终态（链 A 或链 B 择一深测）

| 项 | 说明 |
|----|------|
| **固定矩阵** | C2 + **C3**（链 B）或 C2 + **E1**（链 A）；Step 6o/6f 为 **API 切片** |
| **不覆盖** | mock-pay → 完成 → **双向评价** · 争议分支 · 403 混链提示验证 |
| **① 验收路径** | **手测卡（链 B 推荐）：** C2 下单 → C3 接单 → mock-pay → 完成 → 评价 |
| **链 A** | C2 Landing/Escrow → 绑 **E1** → 接单 → mock-pay（见 [ESCROW-P03-P06-GD-MAIN-CHAIN-FREEZE](../../frontend/evidence/GO_local_web3_itinerary_l5/ESCROW-P03-P06-GD-MAIN-CHAIN-FREEZE.md)） |
| **禁止** | 混用 C3 接 E1 链订单（须见 403 或正确提示） |

| # | 链 | 检查项 | 账号 |
|---|-----|--------|------|
| 1 | B | 市场选向导 → 下单 → Escrow 页状态正确 | C2 + C3 |
| 2 | B | 向导接单 → mock-pay → 完成 | C3 |
| 3 | B | 双向 reviews（若 UI 已开） | C2 + C3 |
| 4 | A 或 B | 故意错向导登录验证 403/提示 | 负例 |

---

## 2 · 与一键栈 Step 的关系

| Step | 证明什么 | **不能**替代 P0 |
|------|----------|-----------------|
| **6b5** | C2 C3 C4 E2 C1 可登录 | P0-01 五角色 · P0-03 从零 |
| **6p** | C1 四轨 API | P0-03 · P0-05 |
| **6r** | C4 商家 API | P0-03 商家从零 |
| **6t** | C1 主理人工作台 API | P0-03 选辖区 · P0-05 链上治理 |

---

## 3 · 禁止假完成（写死）

- **六账号 + Step 6 绿** **≠** 本 P0 清单全勾 **≠** [93 全站矩阵](../spec/93-全站功能验证矩阵-域别回归清单.md) GO  
- **① 本表全勾** **≠** **②** ADM-U01 / TN-P1 / Graduation GO  
- ISS-007 窄切片 `report.json` **不得**替代本表 — 见 [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion)

---

## 4 · 变更纪律

- 增删 P0 项须同步 [TT-LOCAL-TEST-ACCOUNTS-MATRIX §11](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-local-9-coverage-boundary) · **§0 / §10** 身份隔离 · **§0a** 扩展归属
- **不**为 P0 项新增 `auth.rs` 固定种子；仅增 L3 脚本或 ② 探针

---

## 5 · 机读旁证记录（L3 · 非 P0 全勾）

**说明：** 本节仅记录 **① L3 脚本 exit 0** 旁证 · **不**替代 §1 手测勾选 · **不**替代签字行「P0 全勾」。

| 记录 UTC | git SHA | 项 | 脚本 / 证据 | 机读 | 手测仍须 |
|----------|---------|-----|-------------|------|----------|
| 2026-06-17 | workspace | **矩阵 MACHINE** | Step 6b5/6p/6r/6t/6q + Web3/Admin/DID/Community L5 | ✅ | — |
| 2026-06-17 | workspace | **P0-01** SuperAdmin + CS deny | `smoke-admin-rbac-matrix-local.sh` | ✅ L3 | 五角色 Shell 手测 / ② ADM-U01 |
| 2026-06-17 | workspace | **P0-02** Growth API 切片 | `smoke-growth-referral-p0-local.sh` | ✅ API · FE 未起 WARN+skip | 双用户 `?ref=` 闭环手测 |
| 2026-06-17 | workspace | **P0-03** 主理人从零 API | `smoke-steward-onboarding-local.sh` | ✅ L3 | 选手辖区 wizard 手测 |
| 2026-06-17 | workspace | **P0-04** 争议+裁决 | `smoke-order-escrow-dispute-p0-local.sh` | ✅ L3 API · resolve | Admin 争议 UI 手测 |
| 2026-06-17 | workspace | **P0-05** 治理提案契约 | `smoke-governance-proposals-l5-local.sh` | ✅ vitest 43/43 | MetaMask vote/claim 手测 |
| 2026-06-17 | workspace | **P0-06** Escrow 链 B API | `smoke-seed-tourist-guide-transaction-local.sh` | ✅ mock-pay 全链 | 浏览器 UI 终态手测 |
| 2026-06-17 | workspace | **Escrow 链 A API** | `smoke-guide-detail-booking-local.sh`（SKIP_PLAYWRIGHT=1） | ✅ GD-L5 | C2+E1 UI 手测 |
| 2026-06-17 | workspace | **收购 L3** | `smoke-acquisition-pd009-local.sh` | ✅ 须 API `P3_CHAIN_OFF=1` | 非六账号矩阵 |
| 2026-06-17 | workspace | **AB 主链** | `smoke-ab-core-chain.sh` | ✅ HTTP · DB skip 默认 | ephemeral 非矩阵 UI |

**mock-pay 前置：** 本地 API 须 **`P3_CHAIN_OFF=1`**（`scripts/start-api-with-seed.bat` 默认）· 烟测共用 **`scripts/dev/lib/local-smoke-preflight.sh`** · 链 A 签名 **`scripts/dev/sign-eip191-message.mjs`**。

---

*End of TT-LOCAL-P0-MANUAL-UAT-CHECKLIST v1.0.1*
