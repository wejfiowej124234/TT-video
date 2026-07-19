# PSG · Coverage Acceptance Baseline Report（只读验收）

**Machine:** `TT_PSG_COVERAGE_ACCEPTANCE_BASELINE`  
**Status:** **COMPLETE** · Baseline frozen · `2026-07-19`  
**Method:** 既有脚本/证据整理 · **未**全量重跑 E2E/Security/CMS/Perf  
**机读：** [`registry/psg-coverage-acceptance-baseline.v1.yaml`](../../registry/psg-coverage-acceptance-baseline.v1.yaml)  
**母模型：** [七维 Coverage + Acceptance Layer](./TT-PSG-COVERAGE-MODEL-SEVEN-DIMENSIONS-LATEST.md)  
**Completion Pack（Evidence Sync 补齐）：** [Coverage Completion Pack](./TT-PSG-COVERAGE-COMPLETION-PACK-LATEST.md)  
**Metrics Baseline（Evidence-derived %）：** [Coverage Metrics Baseline](./TT-PSG-COVERAGE-METRICS-BASELINE-LATEST.md)  
**Gate：** [Production Release Readiness Gate](./TT-PSG-PRODUCTION-RELEASE-READINESS-GATE-LATEST.md) · **仍** `CONDITIONAL_GO`

> **定位：** 发布证明（有没有验证证据）· **不是**重新 Audit。  
> **Mode：** **Evidence Sync** · **≠** Re-test Campaign。  
> **公式：** `Coverage Status = Latest Valid Evidence` · **≠** Latest Test Execution Time。  
> **不改变** Frozen RC · Money-Path · Fix Required=8 · Register FROZEN。  
> **规则：** Coverage 发现 → **只关联**既有 Register/Min-Fix ID · **禁止**新增 Fix 风暴。  
> **不替代** Release Window 的 8 项修复。

---

## 0 · Evidence Sync 治理（写死）

```text
已有验证证据
        ↓
映射 Coverage 状态 / 发布视图
        ↓
仅当：代码变更 · 配置变更 · 关键运行时变更
        ↓
对应域失效 → 定向复验 → Coverage Refresh
```

| 职责 | 是 | 否 |
|------|----|----|
| 发布前回答覆盖程度 | ✅ Functional PARTIAL · Security 证据+Pending Binding… | ❌ 今天再跑一遍所有测试 |
| 证据有效性 | ✅ Evidence Validity | ❌ Test Count / 数字好看 |
| 未改代码的域 | ✅ 沿用证据 | ❌ 为刷 % 重跑 |

**Min-Fix 后只刷新受影响域：**

| Fix | 刷新 Coverage |
|-----|----------------|
| WalletConnect | Security/Web3 · UI/UX · Journey |
| ACTIVE Runtime | Security/Web3 · Governance Journey |
| Role | Security · Journey |
| Trust | UI/UX · Data Surface |
| SHA/image | Release Identity / Artifact |
| Auth / Market / Provider（无代码变更） | **沿用** Baseline 证据 |

**禁止：** 为追求覆盖率数字引入新变量 / 新 Finding 风暴。

---

## Overall

```text
PSG Coverage Acceptance Baseline

Functional Domain     PARTIAL
User Journey          PARTIAL
API / Backend         PASS
Code Line             DEFERRED
Security / Web3       PARTIAL
Data Governance       PARTIAL
UI / UX               PARTIAL

Overall:              CONDITIONAL
Gate:                 CONDITIONAL_GO
Release:              NOT_READY_FOR_GO
Blocker:              0
Fix Required:         8 (unchanged)
```

**含义：** 非失败 · 等待受控闭环（Min-Fix → Coverage Recalculate → Final Decision）。

### 诚实口径（防误读 · 写死）

> **已完成的是 PSG Coverage Acceptance（发布覆盖模型）· 不是「全部测试覆盖率跑完了」。**

| 类型 | 状态 | 说明 |
|------|------|------|
| 功能域覆盖 | ✅ 已完成 | 11 发布关键域已映射 |
| 用户旅程覆盖 | 🟡 基线完成 | 六角色已映射 · Journey 仍 PARTIAL |
| API 覆盖 | ✅ 已完成 | Contract/Route Evidence 已整理 |
| Security/Web3 | 🟡 基线完成 | PFA/Hardening/Shadow 已合并 |
| Data Lifecycle | 🟡 基线完成 | CMS→API→DB→UI 已映射 |
| UI/UX | 🟡 基线完成 | P0 已映射 · Finding 已关联 |
| 代码行覆盖 % | ❌ 未做 | **DEFERRED** |
| 全量 E2E 再跑 | ❌ 未做 | **当前禁止** |
| 性能压测 | ❌ 未做 | **当前禁止** |
| Money-Path 真资金 | ❌ 未做 | **另窗 Deferred** |

**能回答：** 上线关键能力有没有验证证据？风险在哪？哪些要修？哪些可延期？→ **有。**  
**不能宣称：** 所有代码/页面/用户路径 100% 测试覆盖完成。

解锁后 **不是** 重跑全部覆盖率，而是：Min-Fix → **影响域**复验 → Coverage Recalculate  
（例：WC→Wallet/UI/Security/Journey · ACTIVE→Web3/Gov · Role→RBAC/Journey · Trust→UI/Data · Identity→Artifact）。

---

## Production 门槛（写死 · 防争论）

| 项 | Production GO 要求 | Baseline 当前 |
|----|-------------------|---------------|
| P0 Domain 证据 | 100% 有证据（无 NOT_RUN） | **达标**（缺口=PARTIAL↔Fix） |
| Core Journey | 100% 核心闭环复验 | **未达** → PARTIAL |
| Security/Web3 | 100% 关键一致（含 WC/ACTIVE） | **未达** → Fix 未关 |
| API Critical | 100% 有测 | **PASS** |
| Data Ownership | 100% 真源/Owner 明确 | **PARTIAL**（P0 链有 · Full Consistency 未宣称） |
| UI P0 | 100% 可用闭环 | **PARTIAL** ↔ Role/Trust/WC Fix |
| Code Line | not blocking | **DEFERRED** |

---

## D1 · Functional Domain — **PARTIAL**

| 域 | 状态 | Evidence（cite） |
|----|------|------------------|
| Auth | COVERED→PASS 切片 | Gap Map · `GO_local_auth_l5` · auth freeze vitest |
| Market | COVERED→PASS 切片 | FIVE-MAIN · LANDING-MARKET · web3 green |
| Provider | COVERED→PASS 切片 | Provider freeze · `smoke-provider-onboarding-local` |
| Escrow | PARTIAL | draft freeze · web3 smoke · Hardening P1 · 已上链页未冻 |
| Governance | PARTIAL | proposals L5 · PFA-02/UI-01 |
| Steward | PARTIAL | steward L5 smokes · PFA-UI-STEWARD |
| Admin | PARTIAL | Admin CERT CONDITIONAL_PASS · admin green |
| Wallet | PARTIAL | wallet L5 · **→** `PFA-UI-WALLET-01` |
| CMS | PARTIAL | CMS Specialty PASS+Findings |

**关联 Fix（不新增）：** Wallet/Gov/Steward PARTIAL → 既有 Min-Fix seq1–2。  
**明细：** [Gap Map](./TT-PSG-RELEASE-SURFACE-TEST-COVERAGE-GAP-MAP-LATEST.md)

---

## D2 · User Journey — **PARTIAL** ⭐（核心路径映射 · 未全量跑）

| 角色 | 核心路径（Acceptance 意图） | 既有证据 | 步态 |
|------|---------------------------|----------|------|
| Tourist | 注册→登录→市场→需求/订单 | auth smoke · web3 itinerary full-chain · market SSOT | **PARTIAL**（未宣称单次端到端 Acceptance 复验） |
| Guide | 身份→接单→订单态 | guide workbench/detail smokes · orders corridor | **PARTIAL** |
| Provider | 创建服务→展示 | `smoke-provider-onboarding-local` · workbench L5 | **PARTIAL→较强** |
| Steward | 治理入口 | `smoke-steward-workbench-l5-local` · onboarding | **PARTIAL** |
| Admin | 后台入口 | `smoke-admin-pages-local` · rbac matrix · CERT | **PARTIAL** |
| DAO | 提案/Timelock/执行 | F-02 主轴 CITE · proposals L5 · **未** execute | **PARTIAL**（等 `execute_allowed_now`） |

**禁止本 Baseline：** 重跑 93 全矩阵 / 新开旅程 Audit。  
**GO 前：** Release Window 后窄复验核心路径 → 升 PASS（仍禁风暴）。

---

## D3 · API / Backend — **PASS**

| 面 | Evidence |
|----|----------|
| cargo | `traveltrust-api` auth/orders/escrow/admin 测包存在 |
| Smoke/Gate | `ci-local-delivery-minimum` · 各域 API smoke 索引 |
| 诚实边界 | **非**每路由 401/403/422 穷尽 |

---

## D4 · Code Line — **DEFERRED**

| ID | `PSG-ENG-LINE-COVERAGE` |
|----|-------------------------|
| 原因 | 上线风险 ≠ 行覆盖 % |
| 本窗 | 不装不跑 |

---

## D5 · Security / Web3 — **PARTIAL** ⭐（汇总 · 不重审）

| 检查项 | 证据汇总 | 状态 | Register 关联 |
|--------|----------|------|---------------|
| ACTIVE addresses | PFA-02 · V311 CERT · Matrix | 脊 OK · FE 绑定缺口 | `PFA-UI-GOV-01` · `STEWARD-01` |
| ChainId | PFA-02 · Sepolia 11155111 | OK（切片） | — |
| Governor | PFA-02 · PFA-UI-01 | PARTIAL | `PFA-UI-GOV-01` · `GOV-02` |
| Timelock | F-02 CITE · Operator Card | CITE / 等待执行 | `PSG-CITE-TIMELOCK-F02` |
| Wallet | PFA-03 · PFA-UI-WALLET | PARTIAL | **`PFA-UI-WALLET-01`** |
| Permission / RBAC | Hardening P0 · Admin CERT | PARTIAL 纸面 | live → Deferred `PFA-UI-ADMIN-01` |
| Web3 Shadow | W3S CLOSED | CLOSED | — |

---

## D6 · Data Governance — **PARTIAL** ⭐

```text
CMS → API → DB → UI
```

| 项 | 结果 |
|----|------|
| Specialty | **PASS**（Finding only · Class A=0） |
| 真源 / Owner | Final Paper Dependency + CMS Specialty · **已知** |
| Consistency Full | **未**宣称 |
| 关联 Deferred | Pulse 双轨 · Country QA · DC-05 soft（已入册） |
| **新 Fix** | **0** |

Evidence：`TT-CMS-DATA-CHAIN-SPECIALTY-LATEST` · `cms-data-chain-20260719/`

---

## D7 · UI / UX — **PARTIAL** ⭐（仅 P0）

| P0 面 | 证据 | Finding 关联 |
|-------|------|--------------|
| 首页 `/` | FIVE-MAIN Freeze · T0 | — |
| Market | FIVE-MAIN · LANDING-MARKET | — |
| Wallet | wallet L5 · PFA-UI | **`PFA-UI-WALLET-01`** |
| Governance | PFA-UI-01 | **`PFA-UI-GOV-*`** |
| Escrow | Draft Experience Freeze · web3 green | 已上链页 Deferred |
| Profile / Trust / Role | identities · meTrust · PFA-UI | **`PFA-UI-ROLE-*`** · **`PFA-UI-TRUST-01`** |

**新 Fix：0** · 全部挂既有桶。

---

## Finding → Register 映射（禁增 Fix）

| Coverage 观察 | 处理 |
|---------------|------|
| WC 未配置 | → `PFA-UI-WALLET-01` |
| Governor LEGACY | → `PFA-UI-GOV-01` · `GOV-02` |
| Steward LEGACY | → `PFA-UI-STEWARD-01` |
| Role 入口 | → `PFA-UI-ROLE-01` · `ROLE-02` |
| Trust 路径 | → `PFA-UI-TRUST-01`（不增计数） |
| SHA/image 未钉 | → `PFA-01-CANDIDATE-SHA` · `PFA-01-IMAGE-DIGEST` |
| Admin live RBAC | → Deferred `PFA-UI-ADMIN-01` |
| Money-Path / 已上链 Escrow | → Deferred（非本窗） |
| CMS soft / Pulse | → Deferred（已登记） |

**Baseline 新增 Fix Required 计数：0**（仍为 **8**）。

---

## 固定发布链路（企业模型）

```text
Risk Domains
      ↓
Findings / Register
      ↓
Fix Required / Deferred / Accepted Risk
      ↓
【现在】Coverage Acceptance Baseline  ← 本报告
      ↓
等待 execute_allowed_now=true
      ↓
Release Window · 8× Min-Fix
      ↓
Coverage Recalculate
      ↓
Owner Sign-off · Rollback Ready
      ↓
Production GO / NO-GO
```

---

## 下一步（唯一）

| 现在 | heartbeat only · Baseline **CLOSED** |
|------|--------------------------------------|
| 解锁后 | Min-Fix → 单项复验 → **Coverage Recalculate** → Gate 裁决 |
| 禁止 | 因 Baseline 黄灯开新 Audit/Shadow/E2E/CMS/Perf 轨 |
