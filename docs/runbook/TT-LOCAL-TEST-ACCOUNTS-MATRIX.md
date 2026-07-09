# TT-LOCAL-TEST-ACCOUNTS-MATRIX

**Version:** 1.3.7 · **2026-07-01** · **IMMUTABLE IDs · Registry SSOT · Quick Reference**  
**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（须顺序；本文 **①** SSOT，**②③ 另闸**）

> **冻结纪律（写死 · 最后一项）：** 账号**五支结构** [§0](#tt-test-accounts-root) · **Admin 最高原则** [§10.0](#tt-admin-rbac-supreme-principle) · **唯一身份来源** [§0.1](#tt-single-source-of-identity) — **均已冻结，勿再改。** 日常仅维护既有 **C1–C4/E1–E2** + [② UI 手测](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) + [③ P0 手测](TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md)。

**唯一 SSOT：** **一页速查** [TT-TEST-ACCOUNTS-QUICK-REFERENCE.md](./TT-TEST-ACCOUNTS-QUICK-REFERENCE.md) · **结构** [§0](#tt-test-accounts-root) · **身份来源** [§0.1](#tt-single-source-of-identity) · **覆盖矩阵** [§0.2](#tt-coverage-matrix) · **生命周期/Owner** [§0.3](#tt-account-lifecycle-owner) · **禁止事项** [§0.4](#tt-account-forbidden) · **Business 三层** [§0a](#tt-local-three-layer-acceptance) · **Admin** [§10](#tt-admin-console-personas) · **关系图** [§6](#tt-account-relationship-diagram)。

**互指（勿分叉）：**

| 文档 | 用途 |
|------|------|
| [`docs/runbook/TT-TEST-ACCOUNTS-QUICK-REFERENCE.md`](./TT-TEST-ACCOUNTS-QUICK-REFERENCE.md) | **一页 SSOT** · 日常手测 · Staging/Local 邮箱 + 密码 + 关系图 |
| [`docs/测试账号与本地联调.md`](../测试账号与本地联调.md) | 启栈步骤 · 登录排错 · DB 接库 |
| [`scripts/dev/start-api-with-seed-README.md`](../../scripts/dev/start-api-with-seed-README.md) | 一键栈 Step · env 变量 |
| [`docs/runbook/TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT.md`](TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT.md) | 主理人双轨 · multi-demo 钱包 · 持久化 |
| [`evidence/manual-uat/README.md`](../../evidence/manual-uat/README.md) | **质量证据 SSOT**（FROZEN）· Session · Defect · Regression · **Release** · Dashboard |
| [`docs/runbook/LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT.md`](LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT.md) | **②** Playwright 旁证 · **不**替代 UI 手测勾选 |
| [`docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md`](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) | **②** Business UI 手测勾选 · 六账号走廊 |
| [`docs/runbook/TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md`](TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md) | **③** 企业 P0 深测 · Business 不覆盖项 |
| [`docs/runbook/ADM-U01-staging-rbac-matrix.md`](ADM-U01-staging-rbac-matrix.md) | **②** Admin Console Personas · RBAC 台账 |
| [`docs/runbook/ADM-U02-admin-permissions-2fa-approval.md`](ADM-U02-admin-permissions-2fa-approval.md) | Admin 审批 · 2FA · 权限中心 |
| [`docs/spec/70-管理员系统开发文档.md`](../spec/70-管理员系统开发文档.md) | Admin Console 契约真源 |
| [`crates/api/src/chain_off/auth.rs`](../../crates/api/src/chain_off/auth.rs) | Business 种子实现真源 |

**代码锚：** `seed_test_accounts_if_empty` · `seed_multi_identity_demo_account` · `seed_merchant_workbench_demo_accounts`

---

## 0 · TravelTrust Test Accounts（总览 · 结构已冻结）{#tt-test-accounts-root}

**结构冻结（2026-06-25 · 勿扩）：** 下列五支为**完整**账号体系；**禁止**新增第六类桶、Business 第 7 固定邮箱、或 `xxx@test.com` 固定控制台种子。扩展 Admin 见 **[§10.0 最高原则](#tt-admin-rbac-supreme-principle)**。

```
TravelTrust Test Accounts
│
├── Business Personas
│     C1 · C2 · C3 · C4 · E1 · E2
│
├── Admin Console Personas
│     SuperAdmin（开发捷径）
│     Dynamic RBAC Personas
│
├── L3 Ephemeral
│
├── Smoke Accounts
│
└── Staging Temporary Accounts
```

> **身份体系隔离（写死）：** 产品业务账号（**Business Personas**）与 **Admin Console Personas** 属于两套独立身份体系，任何文档、测试、验收、证据均**不得混用**；**不得**以产品账号通过替代 Admin RBAC 验收，也**不得**以 Admin RBAC 通过替代产品业务验收。

| 体系 | 叫什么 | 验什么 | 固定邮箱？ |
|------|--------|--------|------------|
| **Business Personas** | 产品业务账号 | API/UI 回归 · Escrow · DID · Publish · Governance 页面 · Market · Community | **是** — C1–C4 · E1–E2 |
| **Admin Console Personas** | 控制台角色（**勿**称「测试账号」） | RBAC · deny/pass · Admin Shell · 审批 · 风控 · 财务 · 审计 | **否** — 见 **[§10](#tt-admin-console-personas)** |
| **L3 / Smoke / Staging** | 临时账号 | 见 **[§5](#tt-ephemeral-accounts)** | **否** — 按次生成 |

**C2 `tourist@test.com` 与 Admin 的关系：** 同一邮箱在 Step **6b/6b2** 后可兼 **Business（旅行者）** 与 **Admin 开发捷径（SuperAdmin）**；这是**本地开发便利**，**不**表示 Admin 六角色 RBAC 已验收 — 六控制台角色须走 **[§10](#tt-admin-console-personas)**。

---

## 0.1 · 唯一身份来源 Single Source of Identity（永久 · 勿改 · 最后一项冻结）{#tt-single-source-of-identity}

> **以后任何文档、脚本、Smoke、HAT、FRCA、ADM-U01，均只引用下表身份来源；禁止各自定义账号、禁止在本文档外另立「测试账号清单」。**

| 身份类型 | 唯一真源 | 消费方（须互指本文） |
|----------|----------|----------------------|
| **Business Persona** | **固定测试账号矩阵** — **C1–C4 · E1–E2**（本文 §3–§4 · `auth.rs` · `SEED_TEST_ACCOUNTS=1`） | 文档 · `start-api-with-seed` · Step **6b5** · Business ①②③ · HAT 业务 persona |
| **Admin Persona** | **`admin_console_roles` + Permission Matrix**（`admin_rbac.rs` · `registry/admin-rbac-*.v1.yaml` · ADM-U01/U02） | `/admin` · P0-01 · ADM-U01 · ADM-U02 · **非**固定邮箱表 |
| **Ephemeral Persona** | **测试脚本动态创建** — `adm-rbac-*` · `*-smoke-*@traveltrust.test` · L3 自注册；**测试结束即可销毁** | `smoke-*-local.sh` · `smoke-admin-rbac-matrix-local.sh` · P0 L3 路径 |
| **Staging Persona** | **Staging 专用临时身份** — `adm-u01-*@traveltrust.staging` · TN-P1 cohort · **不进入**本地固定矩阵 | ADM-U01 · FRCA · ② 台账 · `record-*-staging-evidence.sh` |

**读法：**

- 需要 **Business 邮箱** → 只查 **§3–§4**，**不**在 runbook 另写一套。
- 需要 **Admin 角色能力** → 只查 **`console_role_70` + Permission Matrix**，**不**发明 `ops@test.com`。
- 需要 **一次性受控身份** → **Ephemeral** 脚本内注册；**不**升格为固定种子。
- 需要 **② 环境身份** → **Staging Persona**；**不**写入根 `.env` 或本文 Business 表。

**分叉禁令：** 新增 smoke/HAT/FRCA/验收文档时，**须**链接 `TT-LOCAL-TEST-ACCOUNTS-MATRIX` **[§0.1](#tt-single-source-of-identity)**，**禁止**文内自建平行账号表（可写「用 C2」或「ADM-U01 ephemeral」，须带矩阵 ID / 角色名）。

---

## 0.1b · Immutable Logical IDs（永久 · 不可重新分配语义）{#tt-immutable-logical-ids}

**机读 Registry SSOT：** [`registry/test-accounts-business-immutable.v1.yaml`](../../registry/test-accounts-business-immutable.v1.yaml)

**C1、C2、C3、C4、E1、E2 为永久逻辑 ID（Immutable ID）。** 任何情况下 **不得重新分配** 其业务含义（business_role · Escrow 链归属 · 手测走廊）。

| 规则 | 说明 |
|------|------|
| **Email 可换** | 经 [TT_TEST_ACCOUNT_CHANGE](./TT-TEST-ACCOUNT-CHANGE.md) · 只改 `email` 字段 |
| **ID 语义不可换** | 禁止「C2 改成 Merchant」「C4 承担 Tourist」等 |
| **向后兼容** | C1–E2 变更须保持向后兼容 |
| **破坏性调整** | **新增新 ID**（如 C7）— **禁止**修改现有 ID 语义 |

**Email 变更示例（正确）：**

```text
C2 · business_role: TouristTraveler（不变）
    email: tourist@test.com → traveler@test.com
```

**错误示例（禁止）：**

```text
C2 · 现承担 Merchant 角色   ← 禁止
```

**脚本/文档/证据/自动化** 一律引用 **Immutable ID（C1–E2）**；邮箱仅作 Registry 中的可维护字段。

```text
TT_TEST_ACCOUNTS_IMMUTABLE_IDS: C1,C2,C3,C4,E1,E2
TT_TEST_ACCOUNT_CHANGE: REQUIRED_FOR_EMAIL_OR_ID_CHANGES
TT_TEST_ACCOUNTS_GOVERNANCE: BACKWARD_COMPATIBLE_ADD_NEW_ID_ON_BREAK
```

---

## 0.2 · 账号覆盖矩阵 Coverage Matrix（可维护 · 非新体系）{#tt-coverage-matrix}

**用途：** 账号**结构已冻结**（§0）— 本表只维护**验证完成度**，一眼看出「谁验到哪一阶」。**不**新增 Persona · **不**新增账号桶。

**图例：** **✅** 当前版本已有可引用证据 · **⏳** 待执行或未对当前 HEAD 复跑 · **—** 不适用该 Persona · **N/A** 留到该阶再填

**列含义：**

| 列 | 对应层 | 执行方 |
|----|--------|--------|
| **API** | **①** API 固定账号验收 | **脚本**（每日回归） |
| **UI** | **②** UI 固定账号验收 | **人工**（浏览器逐页） |
| **P0** | **③** 企业级 P0 深测 | **人工为主**（必要时脚本旁证） |
| **FRCA** | **②** FRCA / TN-P1 / staging 走廊 | 人工 + ② 台账 |
| **Mainnet** | **③** 主网真链 / Production GO | Owner · **③** 另闸 |

**最后维护：** 2026-06-25 · 本地 API 探针 + Step 6b5 · UI 待 `:3012` 手测/Playwright 复跑

### 0.2a · Business Personas

| Persona | 邮箱 | API | UI | P0 | FRCA | Mainnet |
|---------|------|-----|-----|-----|------|---------|
| **C1** | `multi-demo@test.com` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **C2** | `tourist@test.com` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **C3** | `guide@test.com` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **C4** | `merchant@test.com` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **E1** | `tg_guide_main@trustgate-e2e.local` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **E2** | `provider-did-rank-demo@test.com` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |

**API ✅ 依据：** Step **6b5** + 各账号角色核心 API 200（E1 须 Step **6b4** 已种）。**UI ⏳：** 前端 `:3012` 六账号典型入口手点 / Playwright 未对当前轮次收口。

> **诚实边界：** [LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT](LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT.md) 历史 PASS **≠** 当前 HEAD **② UI** 已验 — 须复跑后可将对应行 **UI** 改为 ✅。

### 0.2b · Admin Console Personas（独立表 · 勿与上表混读）

| Persona | API / RBAC 矩阵 | UI Shell | P0 | FRCA | Mainnet |
|---------|-----------------|----------|-----|------|---------|
| **SuperAdmin 开发捷径**（C2 · 6b2） | ✅ `capabilities` | ⏳ | — | — | ⏳ |
| **Dynamic RBAC**（六控制台角色 · ephemeral） | ⏳ ① 窄切片 · ② ADM-U01 须复跑 | ⏳ | ⏳ P0-01 | ⏳ | ⏳ |

**维护纪律：** 完成任一格验收后**只改本表状态** + 留证据路径/日期 — **勿**改 §0 结构 · §0.1 身份来源 · §10.0 最高原则。

---

## 0.3 · 生命周期 · Owner（SSOT · 可维护）{#tt-account-lifecycle-owner}

**用途：** 一眼区分 **永远不能删** vs **脚本生成可删** · 以及 **谁维护**。

### 0.3a · 生命周期 Lifecycle

| 账号 / 模式 | 生命周期 | 说明 |
|-------------|----------|------|
| **C1 · C2 · C3 · C4 · E1 · E2** | **Permanent** | 固定 Business 种子 · **冻结** · 勿删 |
| **SuperAdmin 捷径**（C2 + 6b2） | **Permanent** | 开发便利 · 非 RBAC 矩阵验收 |
| **`adm-u01-*@traveltrust.staging`** | **Ephemeral** | ADM-U01 证据跑完可清理 |
| **`adm-rbac-*@traveltrust.test`** | **Ephemeral** | 本地 RBAC 矩阵 · 测试结束可删 |
| **`*-smoke-*@traveltrust.test`** | **Ephemeral** | Smoke 脚本一次性 |
| **L3 自注册邮箱** | **Temporary** | 从零入驻 / P0 深测 · 用毕可弃 |
| **`P3_SEED_ARBITRATOR_EMAIL`** | **Configured** | env 配置 · dispute deep audit |

### 0.3b · Owner（维护责任）

| 类别 | Owner | 真源 / 入口 |
|------|-------|-------------|
| **Business Accounts（C1–E2）** | **Seed Script** | `auth.rs` · `SEED_TEST_ACCOUNTS=1` · `start-api-with-seed.bat` · Step **6b5** |
| **Admin RBAC（六角色矩阵）** | **ADM-U01 / ADM-U02** | `smoke-admin-rbac-matrix-local.sh` · `record-adm-u01-staging-evidence.sh` |
| **SuperAdmin 开发捷径** | **Seed + bootstrap** | Step **6b** · **6b2** `bootstrap-local-admin-console.ps1` |
| **Smoke Accounts** | **Smoke Scripts** | `smoke-*-local.sh` · 各脚本 README |
| **Staging Temporary** | **ADM-U01 / FRCA** | `record-*-staging-evidence.sh` |
| **L3 Ephemeral** | **手测 / P0 执行人** | 自注册 · 不写入固定矩阵 |

---

## 0.4 · 禁止事项（写死）{#tt-account-forbidden}

| 禁止 | 原因 |
|------|------|
| × **Business 账号**验证 **Admin RBAC** | 两套身份体系 · C2 进 `/admin` ≠ 六角色 GO |
| × **Admin 账号**验证 **Business 业务流程** | 同上 |
| × **Local 与 Staging 混用**同一浏览器 Session | chain_id / 合约 / host 设计不同 |
| × **E1** 用于 **Staging** | TrustGate · 仅 Local（Step **6b4**） |
| × **C1** 用于 **从零主理人入驻** | C1 为已灌满演示捷径 |
| × 新增固定 `xxx@test.com` **未经 TT_TEST_ACCOUNT_CHANGE** | 防止账号膨胀 · 见 [§9](#tt-test-account-change-gate) |
| × 在本文档外 **另立平行测试账号表** | 违反 [§0.1](#tt-single-source-of-identity) |
| × 将 **Ephemeral** 升格为 **Permanent** 固定种子 | 用 L3/Smoke 或复用 C1–C4 |

**一页速查：** [TT-TEST-ACCOUNTS-QUICK-REFERENCE.md §禁止](./TT-TEST-ACCOUNTS-QUICK-REFERENCE.md)

---

## 0a · Business Personas · 三层验收 SSOT（写死）{#tt-local-three-layer-acceptance}

**适用范围：** 仅 **Business Personas（C1–C4 / E1–E2）**。**Admin Console Personas** 验收见 **[§10](#tt-admin-console-personas)**，**不**纳入本表三层。

> **固定六账号（Business）分为三层：① API 固定账号验收（每日回归）；② UI 固定账号验收（版本回归）；③ 企业级 P0 深测（发布前验收）。三层职责独立，不互相替代。**
>
> **扩展归属原则：** 任何新增**产品**角色、新业务或新页面，都必须明确归属于 **①**、**②** 或 **③** 中的某一层；**不得**新增第四套独立验收流程。

**三层都需要，但职责完全不同（写死）：**

| 层 | 谁执行 | 目的 |
|----|--------|------|
| **① API 固定账号验收** | **脚本** | **每日**快速回归 — 登录、权限、核心 API 是否正常 |
| **② UI 固定账号验收** | **人工** | **版本**回归 — 浏览器逐页操作，验证真实用户流程、交互、视觉、状态变化 |
| **③ 企业级 P0 深测** | **人工为主**（必要时配合脚本） | **发布前**完整业务闭环 — Escrow、审批、治理、支付、争议等 |

**读法：** ① 脚本绿 **≠** ② 人工 UI 已验 **≠** ③ P0 全勾。① **不能**替代 ② 的页面/文案/动线判断；② **不能**替代 ③ 的跨角色终态与钱包/支付闭环。

### 0a.0 · 三层验收文档树（STRUCTURE FROZEN · 2026-06-25）{#tt-three-layer-doc-tree}

**完整对称（写死 · 禁止第四层）：**

| 层 | 形态 | 文档 | 角色 |
|----|------|------|------|
| **① API** | 脚本 → PASS | Step **6b5** 等（见 [§0a.1](#tt-local-three-layer-acceptance)） | 每日机读回归 |
| **② UI** | 人工 Checklist → 签字 | [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) | Business 六账号浏览器走廊 |
| **③ P0** | 人工 Checklist → 签字 | [TT-LOCAL-P0-MANUAL-UAT-CHECKLIST](TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md) | 发布前深测 · L3 · Admin §10 |
| — | Playwright 旁证 | [LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT](LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT.md) | **非**第四层 · **不**替代 ② 签字 |

**总索引（本文）：** 账号树 · 身份来源 · **[§0.2 Coverage Matrix](#tt-coverage-matrix)** — **不**另立平行账号表或验收 SSOT。

**日常维护（仅此 · 写死）：**

| 可改 | 不可改（须单独立项） |
|------|----------------------|
| [§0.2](#tt-coverage-matrix) 各 Persona 的 API / UI / P0 / FRCA / Mainnet **状态格** · 证据路径 · 日期 | §0 账号五支结构 · §0.1 身份来源 · §10.0 Admin 最高原则 · **三层文档树** · **禁止第四层** |
| [UI 清单](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) §1 **勾选** · §2 **签字行** · **`evidence/manual-uat/sessions/<stamp>/`** + **`summary/MASTER-DEFECT-REGISTER`** | UI 清单 **Persona × 走廊项**（冻结） |
| [P0 清单](TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md) §1 **勾选** · **签字行** | P0-01～P0-06 **清单项**（冻结） |
| Playwright 报告 **复跑 stamp** · 证据目录 | 将 Playwright 升格为验收层或替代 ② 签字 |
| [release/R00N](../../evidence/manual-uat/release/README.md) · Dashboard 脚本生成 | 迁移 `evidence/manual-uat/` 目录结构 |

**新增产品能力：** 须**归入** ① / ② / ③ 之一（见 [§0a.4 扩展示例](#tt-local-three-layer-acceptance)）— **不**新建第四套 Checklist；若须增删冻结清单项，**单独立项**同步 §0a.2 / §0a.3 走廊摘要。

---

### 0a.1 · ① API 固定账号验收（脚本 · 每日）

**入口：** Step **6b5** · `verify-seed-test-accounts-login.ps1` · 角色核心 API 探针。

**适合自动化（示例）：**

| 项 | 内容 |
|----|------|
| 登录 | C1 · C2 · C3 · C4 · E1 · E2 六账号 `POST /auth/login` |
| 核心 API | `GET /api/v1/me` · `/orders?role=guide` · `/market/provider/listings` · `/governance/proposals` · `/community/feed` · `/discover/orders` 等 |

**Coverage Matrix：** 对应 [§0.2](#tt-coverage-matrix) **API** 列。

---

### 0a.2 · ② UI 固定账号验收（人工 · 版本回归）

**手测勾选 SSOT：** [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md)（Persona × 走廊 · 签字行 · **不**新增体系）

**入口：** `http://localhost:3012` · 六账号典型页面手点；旁证 `run-local-six-account-ui-l5-audit.sh`（**不**替代人工体验判断）。

**不能完全依赖脚本 — 须人工确认（示例）：**

| Persona | 人工 UI 走廊（示例） |
|---------|----------------------|
| **C1** | 登录后多身份切换 · Publish · 主理人工作台 |
| **C2** | 市场 · 社区浏览 · Landing/Escrow 旅行者侧 |
| **C3** | `/guide` · 市场选向导 · 接单流程起点 |
| **C4** | `/provider` 商家工作台 · listing 管理 |
| **E1** | 与 C2 走 **Escrow 链 A** catalog UI |
| **E2** | `/did-rank` 副榜展示 |

**人工须看：** 页面异常 · 文案 · 按钮与权限提示 · 流程是否自然 · 视觉/状态变化。

**Coverage Matrix：** 对应 **UI** 列（**⏳** = 待本轮人工收口）。

---

### 0a.3 · ③ 企业级 P0 深测（人工为主 · 发布前）

**入口：** [TT-LOCAL-P0-MANUAL-UAT-CHECKLIST](TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md) P0-01～P0-06 · L3 ephemeral · ② 台账（**§11.1** 不覆盖项）。

**不能靠脚本完全替代（示例）：**

| 域 | 示例 |
|----|------|
| Escrow | 完整闭环 · 评价 · 争议分支 |
| 入驻/审核 | 商家审核 · 主理人审批 · **Admin 六角色**审批（P0-01 · §10） |
| 治理 | 提案 · **钱包签名** · 投票 · **Claim** |
| 支付/增长 | 支付流程 · Growth 双用户 |
| 争议 | 裁决员 · resolve 终态 |

**Coverage Matrix：** 对应 **P0** 列；**FRCA** / **Mainnet** 为 **②③** 阶段延伸，见 §0.2 列定义。

---

### 0a.4 · 三层对照（机读入口）

| 层 | 名称 | 节奏 | 最低证据 |
|----|------|------|----------|
| **①** | API 固定账号验收 | 每日 | Step **6b5** + 核心 API 200 |
| **②** | UI 固定账号验收 | 版本 | [UI 手测勾选](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) · Playwright 旁证 |
| **③** | 企业级 P0 深测 | 发布前 | P0-01～P0-06 勾选 + 证据 |

**扩展示例（产品侧 · 仅归类）：**

| 新增项 | 归属层 | 说明 |
|--------|--------|------|
| 新 API 路由 | **①** | 脚本探针可覆盖 |
| 新页面/交互 | **②** 或 **③** | 可手点走廊 → **②**；全终态闭环 → **③** |
| Admin deny / 新 Shell | **§10.0** · P0-01 · ADM-U01 | **不**写入 Business ①②③ |

**阶段：** ① 绿 **≠** ② 测试网 GO **≠** ③ Production GO。

---

## 1 · Business Personas · 设计原则（减账号）

1. **固定种子只保留 4 个日常 + 2 个扩展**（共 6 邮箱 · **C1–C4 / E1–E2**）。
2. **演示捷径只认 `multi-demo@test.com`**（四轨 + 主理人已灌满；**不**用于测「选国家 / 从零入驻」）。
3. **从零入驻不新增固定种子** — L3 自注册或 Smoke 邮箱（**§5**）。
4. **Escrow 双链**向导邮箱不可合并；仅链 A 需要 **E1**。
5. **① 本地绿 ≠ ② staging GO** — ② 凭证不得写入本文或根 `.env` Anvil 块。
6. **Admin 开发捷径**（C2 promote）**≠** Admin Console Personas 矩阵 — 见 **§10**。

**统一密码（Business 固定种子）：** `Test123!`（区分大小写）

**启用：** 根 `.env` 设 `SEED_TEST_ACCOUNTS=1` · 推荐 `scripts\start-api-with-seed.bat`

---

## 2 · Business Personas · 账号分层（L0–L3 · 非 4 个账号）

| 层 | 代号 | 含义 | 账号从哪来 |
|----|------|------|------------|
| **L0** | 演示捷径 | 状态已灌满，日常 UI 不重走流程 | 固定种子 **`multi-demo`（C1）** |
| **L1** | 单域闭环 | 单角色/单链路深测 | 固定种子 **C2–C4** |
| **L2** | 扩展链 | Escrow 链 A · DID 副榜 | 固定种子 **E1–E2** |
| **L3** | 从零 / 深测 | 入驻 wizard · 跨用户闭环 | **§5** Ephemeral / Smoke |

---

## 3 · Business Personas · 核心 4 账号（C1–C4）

> **邮箱 SSOT：** [`registry/test-accounts-business-immutable.v1.yaml`](../../registry/test-accounts-business-immutable.v1.yaml) · 下表 **business_role / 入口** 与 Registry 一致 · 邮箱变更只改 Registry + [TT-TEST-ACCOUNT-CHANGE](./TT-TEST-ACCOUNT-CHANGE.md)

| # | 邮箱 | 存储 role | 功能域（测什么） | 典型入口 | 一键栈探针 |
|---|------|-----------|------------------|----------|------------|
| **C1** | `multi-demo@test.com` | `guide`（A2 后可为 `region_steward`） | 多重身份 Hub · Publish · 收购 UI · 主理人工作台（CN 已批/已质押捷径） | `/me/identities` · `/me/publish` · `/governance?view=region` | **6p** · **6s** · **6t** |
| **C2** | `tourist@test.com` | `tourist` | 旅行者 · 下单/社区 · Market · Landing/Escrow（旅行者侧） | `/` · `/market` · `/community` | **6b5** · `e2e-verify.bat` |
| **C3** | `guide@test.com` | `guide` | 向导工作台 · Escrow **链 B** | `/guide` · `/market?view=guides` | **6b5** · `smoke-ab-core-chain.sh` |
| **C4** | `merchant@test.com` | `provider` | 商家工作台 · listing | `/provider` · `/me/identities/merchant/settings` | **6r** |

**C1 链上钱包（Anvil #0）：** `0x104FCb93B5e097F92c93Ee4621C487C6C953D212`  
**主理人不重质押：** `set TRAVELTRUST_STEWARD_PERSIST=1`（[TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT](TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT.md)）。

> **C2 审主理人/商家/收购（Admin 操作面）：** 使用 C2 登录 **`/admin`** 时，走的是 **§10 开发捷径（SuperAdmin）**，属于 **Admin Console** 操作，**不**计入 Business Personas 的 **①②③** 完成度。

---

## 4 · Business Personas · 扩展 2 账号（E1–E2）

| # | 邮箱 | 何时必须用 | 功能域 | 勿与谁混用 |
|---|------|------------|--------|------------|
| **E1** | `tg_guide_main@trustgate-e2e.local` | Escrow **链 A** catalog | Landing → Escrow → 公众 catalog 向导接单 | **C3**（链 B） |
| **E2** | `provider-did-rank-demo@test.com` | DID **副榜** demo | `/did-rank` · `/did-rank?board=acquisition` | 一般榜单可用 **C4** |

**Escrow 双链（旅行者均为 C2）：**

| 链 | 旅行者 | 向导 | 场景 |
|----|--------|------|------|
| **A · catalog** | C2 | **E1** | itinerary-first · 公众 catalog |
| **B · AB 种子** | C2 | **C3** | 市场选向导 · `smoke-ab-core-chain.sh` |

**E1 前置：** Step **6b4** `POST /auth/seed-trust-gate-e2e`（`start-api-with-seed.bat`）。

---

## 5 · L3 · Smoke · Staging Temporary {#tt-ephemeral-accounts}

**不纳入 Business 固定六账号 · 不纳入 Admin 固定邮箱。**

| 类型 | 邮箱模式 | 用途 | 阶段 |
|------|----------|------|------|
| **L3 Ephemeral** | 自注册任意邮箱 · `adm-rbac-*@traveltrust.test`（Admin RBAC 脚本） | 从零入驻 · P0 深测 · Admin 六角色本地矩阵 | **①** |
| **Smoke Accounts** | `*-smoke-{timestamp}@traveltrust.test` | `smoke-steward-onboarding-local.sh` · `smoke-acquisition-pd009-local.sh` 等 | **①** |
| **Staging Temporary** | `adm-u01-{role}-{stamp}@traveltrust.staging` | ADM-U01 六角色自动注册 · **勿固定邮箱** | **②** |
| **争议裁决员** | `P3_SEED_ARBITRATOR_EMAIL` 与脚本一致 | `run-order-escrow-dispute-deep-audit.sh` | **①** |

**主理人从零（①）：** 勿用 C1；`RESET_DOCKER_DB=1` → 新邮箱 → `/steward/register` → **§10 捷径或 L3 Admin** 审批。

---

## 6 · Business Personas · 按功能选账号 {#tt-account-relationship-diagram}

### 6.0 · 账号关系图（配对 SSOT）

```text
                    BUSINESS PERSONAS · 关系图
                    ─────────────────────────

  Escrow 链 B              Catalog 链 A (Local)         Merchant
  ───────────              ──────────────────           ────────

      C2                       C2                         C4
   (旅行者)                  (旅行者)                   (商家)
       │ 下单                     │ 下单                      │
       ▼                         ▼                           ▼
      C3                       E1                      /provider
   (向导·链B)              (向导·TrustGate)            listing

  Governance               Ranking                 Admin（独立体系）
  ──────────               ───────                 ───────────────

      C1                     E2                 C2+6b2 → SuperAdmin 捷径
  multi-demo            /did-rank              adm-rbac-* / adm-u01-* → RBAC 矩阵
  多身份·主理人           DID 副榜
```

| 场景 | 账号组合 |
|------|----------|
| 旅行者下单 · 向导接单（链 B） | **C2 → C3** |
| Catalog Escrow（Local） | **C2 → E1** |
| 商家工作台 | **C4** |
| 多身份 / 主理人 / 收购 UI | **C1** |
| DID 副榜 | **E2** |
| Admin 审批（开发） | **C2** SuperAdmin 捷径 · **非** Business 验收 |
| Admin RBAC 六角色 | **Ephemeral** · §10 |

### 6.1 · 按功能选账号

| 要测的功能 | 账号 | Business 层 |
|------------|------|-------------|
| 四轨 Hub / Publish / 主理人已质押工作台 | **C1** | L0 |
| 旅行者下单 / 社区 | **C2** | L1 |
| 向导接单（链 B） | **C2** + **C3** | L1 |
| 商家 listing / `/provider` | **C4** | L1 |
| Escrow catalog 链 A | **C2** + **E1** | L2 |
| DID 副榜 demo | **E2** | L2 |
| 主理人选国家 + 完整入驻 | **L3 新邮箱** | L3 |
| 收购 API 全链 | **L3 smoke** | L3 |
| **Admin RBAC 六角色 deny/pass** | **§10 Admin Console Personas** | **非 Business 表** |

---

## 7 · 启栈与环境

| 场景 | 命令 / env |
|------|------------|
| 日常全栈 | `scripts\start-api-with-seed.bat`（`SEED_TEST_ACCOUNTS=1`） |
| **配置漂移（CFG）** | **FROZEN** · [CFG-REGISTRY](../../evidence/manual-uat/summary/CFG-REGISTRY.md) · [TT-CONFIGURATION-ZERO-DRIFT-FROZEN](TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md) · 维护 `verify-cfg-drift-closure.sh` |
| 主理人演示不重质押 | `set TRAVELTRUST_STEWARD_PERSIST=1` |
| 从零入驻 / 空库 | `set RESET_DOCKER_DB=1` |
| 本地 A1 零元准入 | `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` |
| Admin 开发捷径 | Step **6b** promote + **6b2** `bootstrap-local-admin-console.ps1`（**§10**） |
| Admin RBAC 本地矩阵 | `bash scripts/dev/smoke-admin-rbac-matrix-local.sh`（**§10**） |

### 7a · 一键栈探针 Step ↔ Business ID

| Step | 脚本 | Business ID |
|------|------|-------------|
| **6b5** | `verify-seed-test-accounts-login.ps1` | C1 · C2 · C3 · C4 · E2 |
| **6b4** | `POST /auth/seed-trust-gate-e2e` | **E1**（Local · TrustGate） |
| **6p** | `smoke-multi-identity-closure-local.sh` | C1 |
| **6r** | `smoke-provider-workbench-l5-local.sh` | C4 |
| **6t** | `smoke-steward-workbench-l5-local.sh` | C1 |

---

## 8 · 禁止假完成（验收边界 · 账号相关见 §0.4）

**禁止事项 SSOT：** **[§0.4](#tt-account-forbidden)**（Business/Admin 混用 · Session 混用 · E1 Staging 等）

- **[§0 身份隔离](#tt-test-accounts-root)**：Business **①②③** 绿 **≠** Admin Console Personas GO · **禁止混表宣称**
- **[§0a](#tt-local-three-layer-acceptance)**：① **不**替代 ② · ② **不**替代 ③ · **禁止第四套产品验收轨**
- **C2 能进 `/admin`（SuperAdmin 捷径）** **≠** Ops/CS/Risk/Finance/Auditor RBAC 已验（**§10** · P0-01 · ADM-U01）
- Step **6b5** **≠** ② UI Business 验收完成 **≠** ② staging GO
- **L3** smoke exit 0 **≠** Production GO

见 [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion)。

---

## 9 · 变更纪律 · TT_TEST_ACCOUNT_CHANGE 闸门 {#tt-test-account-change-gate}

### 9.0 · Business Immutable IDs（冻结 · Registry 为邮箱真源）

**Immutable IDs（语义永久）：** `C1` · `C2` · `C3` · `C4` · `E1` · `E2` — 见 **[§0.1b](#tt-immutable-logical-ids)** · [`registry/test-accounts-business-immutable.v1.yaml`](../../registry/test-accounts-business-immutable.v1.yaml)

**当前邮箱映射：** 以 Registry 为准（**勿**在本文重复维护第二份邮箱表 — 见 Registry `accounts.*.email`）。

**探针分工（写死）：**

| Step | Immutable IDs | 说明 |
|------|---------------|------|
| **6b5** | C1 · C2 · C3 · C4 · E2 | `verify-seed-test-accounts-login.ps1` |
| **6b4** | E1 | `POST /auth/seed-trust-gate-e2e` · Local only |
| **Staging 探针** | C1–C4 · E2 | **排除 E1**（Expected Difference） |

**任何邮箱 / Registry 变更 — 必须走：**

```text
TT_TEST_ACCOUNT_CHANGE: REQUIRED
```

**最低同步清单（缺一 = 未闭合变更）：**

1. Owner 书面 **[TT-TEST-ACCOUNT-CHANGE.md](./TT-TEST-ACCOUNT-CHANGE.md)** 记录  
2. **`registry/test-accounts-business-immutable.v1.yaml`**（邮箱真源）  
3. 本文 **§3–§4** · [TT-TEST-ACCOUNTS-QUICK-REFERENCE.md](./TT-TEST-ACCOUNTS-QUICK-REFERENCE.md)  
3. `crates/api/src/chain_off/auth.rs`（或等价 seed 真源）  
4. `start-api-with-seed.bat` · Step **6b5** · `verify-seed-test-accounts-login.ps1`  
5. [`docs/测试账号与本地联调.md`](../测试账号与本地联调.md) · [§0.2 Coverage Matrix](#tt-coverage-matrix)  
6. 相关 smoke / UAT checklist — **须符合 [§0.1](#tt-single-source-of-identity)**

**默认替代：** 新场景用 **L3 Ephemeral** · **Smoke** · 复用 C1–C4 — **不** 加第 7 固定邮箱。

### 9.1 · 其他变更纪律

- 增删 **Business** 固定种子：**§9.0 TT_TEST_ACCOUNT_CHANGE**（**非** 静默 PR）。
- **Admin Console** 变更：**§10.0** 四步流程 · ADM-U01/U02 · **禁止**固定 Ops/Risk/… 邮箱种子。
- **新增/修改** 文档 · 脚本 · Smoke · HAT · FRCA · ADM-U01：**须**互指 **[§0.1](#tt-single-source-of-identity)** 与 **[Quick Reference](./TT-TEST-ACCOUNTS-QUICK-REFERENCE.md)** — **禁止**各自定义账号。
- **验收收口后**：更新 **[§0.2 Coverage Matrix](#tt-coverage-matrix)** 对应格（✅/⏳）+ 证据路径 · **不**扩 Persona 行。
- **新增产品能力**：标明 **§0a ①②③** 之一；**新增 Admin 能力**：**§10.0** 四步 — **禁止**第四套验收命名。
- **不**为每个 smoke 单独加 Business 固定种子；优先 **Ephemeral Persona**（§5）或复用 C1–C4。

---

## 10 · Admin Console Personas（独立于产品业务账号）{#tt-admin-console-personas}

**名称：** **Admin Console Personas**（**勿**称「Admin 测试账号」）。与 **Business Personas（§3–§4）** **并列 · 互不替代**。

> **身份体系隔离（同 §0）：** 产品业务账号与 Admin Console Personas 属于两套独立身份体系，任何文档、测试、验收、证据均不得混用。

### 10.0 · Admin 最高原则（永久 · 勿改）{#tt-admin-rbac-supreme-principle}

> **Admin RBAC 的验收对象始终是 Permission Matrix（角色 × 权限 × 资源），而不是固定账号集合。任何新增控制台角色，只需纳入 RBAC Matrix 与 ADM-U01/ADM-U02，无需新增固定测试账号。**

**新增 Console Role / 后台模块 / 审批权限时 — 固定流程（勿讨论 `xxx@test.com`）：**

| 步骤 | 动作 | 真源 |
|------|------|------|
| 1 | 角色写入 **`admin_console_roles`** 枚举 / 迁移（若新角色） | `admin_rbac.rs` · migrations |
| 2 | 更新 **RBAC Matrix**（权限包 · 路由 deny/pass） | `registry/admin-rbac-permissions.v1.yaml` · `admin_rbac.rs` |
| 3 | 更新 **ADM-U01 / ADM-U02** 探针与 smoke | `admin-rbac-staging-probes.v1.yaml` · `smoke-admin-rbac-*` · `smoke-admin-adm-u02-local.sh` |
| 4 | **跑一次矩阵验证** | ① `smoke-admin-rbac-matrix-local.sh` · ② `record-adm-u01-staging-evidence.sh` |

**答案永远是：不用新增固定 `xxx@test.com`。**

### 10.1 · RBAC 身份模型（写死）{#tt-admin-console-rbac-design}

> **Admin Console Personas** 的目标是验证 **RBAC 权限矩阵**，而不是建立固定管理员账号体系；除 **SuperAdmin 开发捷径**外，其余控制台角色默认采用 **动态（ephemeral）身份** 完成权限验证。

| 模式 | 是什么 | 固定邮箱？ |
|------|--------|------------|
| **SuperAdmin 开发捷径** | `tourist@test.com` + Step **6b2** · 日常进 `/admin` | **是**（Business C2 兼便利 · **≠** RBAC 矩阵验收） |
| **Dynamic RBAC Personas** | `adm-rbac-*@traveltrust.test`（①）· `adm-u01-*@traveltrust.staging`（②）· ADM-U01 脚本自动注册 | **否** — **设计就是没有** 固定 Ops/Risk/Finance/Auditor 号 |

**禁止新增固定种子（写死）：** `ops@test.com` · `risk@test.com` · `finance@test.com` · `auditor@test.com` 或同类 — **保持**「SuperAdmin 捷径 + Dynamic RBAC Personas」双轨即可。

**常见误解（答）：**

| 问题 | 答案 |
|------|------|
| 为什么没有固定 Ops / Risk？ | **设计就是没有** — 用 ephemeral + `admin_console_roles` 验矩阵 |
| C2 能进 `/admin` 算六角色 GO 吗？ | **否** — 仅 SuperAdmin 捷径 |
| ② ADM-U01 历史 GO 代表什么？ | **流程状态** — 宣称「**当前版本**六角色已验」须对**当前运行版本复跑**证据；说明体系与历史能力时，**§10 结构已足够** |

### 10.2 · 六控制台角色

| Console Persona | 职责域 |
|---------------|--------|
| **SuperAdmin** | 平台配置 · 角色治理 · 高危审批 |
| **Ops** | 运营配置 · 受限写 |
| **CS** | 客服队列 · 用户协助 |
| **Risk** | 风控 · 争议相关读/写 |
| **Finance** | 资金 · 对账 · 财务读面 |
| **Auditor** | 审计只读 · 导出 |

**验收内容：** RBAC · deny/pass · Admin Shell 六域 · 审批链（ADM-U02）· 2FA · 路由矩阵 · 审计落库。

**契约真源：** [70-管理员系统](../spec/70-管理员系统开发文档.md) · [`admin_rbac.rs`](../../crates/api/src/routes/admin/admin_rbac.rs) · [`registry/admin-rbac-staging-probes.v1.yaml`](../../registry/admin-rbac-staging-probes.v1.yaml)

### 10.3 · ① 本地

| 场景 | 账号 / 方式 | 说明 |
|------|-------------|------|
| **日常开发捷径** | `tourist@test.com` / `Test123!` → Step **6b** promote → **6b2** → `console_role_70=SuperAdmin` | **仅**方便进 `/admin`；**≠** 六角色矩阵 GO |
| **真正 RBAC 矩阵** | `adm-rbac-super-{ts}@traveltrust.test` · `adm-rbac-cs-{ts}@traveltrust.test` … | `bash scripts/dev/smoke-admin-rbac-matrix-local.sh` · **动态生成 · 无固定邮箱** |
| **ADM-U02 本地** | 同上 + `smoke-admin-adm-u02-local.sh` | 审批 · 2FA · 审计 |

**密码（L3 Admin 脚本）：** 默认 `Test123!`

### 10.4 · ② Staging

| 场景 | 邮箱模式 | 说明 |
|------|----------|------|
| **ADM-U01 六角色矩阵** | `adm-u01-super-{stamp}@traveltrust.staging` · `adm-u01-ops-{stamp}@…` · … · `adm-u01-aud-{stamp}@…` | `record-adm-u01-staging-evidence.sh` 自动注册 · **勿固定邮箱** |
| **预置 Token** | `TRAVELTRUST_ADMIN_TOKEN_SUPER` … `_AUDITOR` | 与 DB `admin_console_roles` 一致 |

**台账：** [ADM-U01-staging-rbac-matrix.md](ADM-U01-staging-rbac-matrix.md) · [ADM-U02](ADM-U02-admin-permissions-2fa-approval.md)

### 10.5 · Admin 验收路径（与 Business 三层分立）

| 声称 | 最低证据 |
|------|----------|
| ① 本地 SuperAdmin 捷径可用 | Step **6b2** · `GET /admin/capabilities` · `console_role_70=SuperAdmin` |
| ① Admin RBAC 矩阵（动态 Personas） | **③** P0-01 · `smoke-admin-rbac-matrix-local.sh` · ephemeral 注册 |
| ② Staging Admin RBAC GO | 对**当前版本**复跑 ADM-U01 · `release_gate=GO` · **非** ① C2 捷径 · **非** 仅引用历史证据 |
| ② ADM-U02 审批/2FA | `record-adm-u02-staging-evidence.sh` |

**ADM-U01 证据口径：** 历史 `TT_ADM_U01_EVIDENCE: PASS` 为**② 流程旁证** — **不**表示 RBAC 设计缺固定账号；**不**自动等于「当前 HEAD 已验」。要宣称**当前版本**六角色矩阵通过，须复跑 [`record-adm-u01-staging-evidence.sh`](ADM-U01-staging-rbac-matrix.md)（或等价 strict 矩阵）并留存新 `report.json`。

---

## 11 · Business Personas · 覆盖边界与缺口表 {#tt-local-9-coverage-boundary}

**Business 日常最小集：** **C1–C4** + **E1–E2** · `Test123!` · **不新增**固定种子。

**Admin 矩阵：** 见 **[§10](#tt-admin-console-personas)** — **不**在本表「固定矩阵」列冒充六控制台角色已覆盖。

### 11.1 · 功能域 × 验收路径

| 功能域 | Business 固定矩阵 | Business **不**覆盖 | ① 路径 | ② 台账 |
|--------|-------------------|---------------------|--------|--------|
| **Admin RBAC 六角色** | —（C2 捷径 **非** 矩阵） | 全六角色 deny/pass | **§10** · P0-01 · L3 `smoke-admin-rbac-matrix-local.sh` | ADM-U01 |
| **Growth 双用户** | C2 旅行者侧 | 邀请闭环双用户 | 手测 + L3 · `smoke-growth-referral-p0-local.sh` | staging Growth |
| **从零入驻** | —（C1 反例） | 选辖区全流程 | L3 + **§10 捷径审批** | FRCA-GAP-M01 |
| **争议 + 裁决** | C2/C3 下单 | arbitrator 终态 | L3 · dispute deep audit | ② 专项 |
| **治理链上手操** | C1 已质押捷径 UI | propose/vote/claim 链上 | P0-05 · MetaMask | HAT-R1 · Sepolia |
| **Escrow 全 UI 终态** | C2+向导起单 | 评价/争议/混链 | P0-06 | FRCA M02/M03 |
| **收购 bond→listing** | C1 UI 槽 | 双用户全链 | L3 `smoke-acquisition-pd009-local.sh` | TN-P1-003 |
| **CMS/OPS 用户侧** | C2 浏览 | 活动转化闭环 | Admin 配置 + L3 用户手测 | staging OPS |

### 11.2 · Business 三层对照（§0a）

| 层 | 声称 | 最低证据 |
|----|------|----------|
| **① API** | Business 六账号 API 可用 | Step **6b5** + 核心 API |
| **② UI** | Business 六账号 UI 可用 | [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) 全勾 · Playwright 旁证 |
| **③ P0** | 企业 P0（含 Admin RBAC） | P0-01～P0-06 · §11.1 不覆盖项 |

### 11.3 · UI / P0 手测入口

| 层 | SSOT |
|----|------|
| **② UI** | [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) |
| **③ P0** | [TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md](TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md) |

**③ P0 清单：**

| ID | 标题 | 主要 persona 体系 |
|----|------|-------------------|
| P0-01 | Admin 六控制台角色 RBAC | **Admin Console** §10 |
| P0-02 | Growth 双用户 | Business + L3 |
| P0-03 | 从零入驻 | L3 + Admin 审批 |
| P0-04 | 争议 + 裁决员 | L3 |
| P0-05 | 治理链上手操 | Business C1 + 链上 |
| P0-06 | Escrow 全 UI 终态 | Business C2+向导 |

---

*End of TT-LOCAL-TEST-ACCOUNTS-MATRIX v1.3.7 · IMMUTABLE IDs · REGISTRY SSOT*
