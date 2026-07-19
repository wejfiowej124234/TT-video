# PSG · Coverage Metrics Baseline（Evidence-derived %）

**Machine:** `TT_PSG_COVERAGE_METRICS_BASELINE`  
**Status:** **LAST_FORMAL**（映射分）· 四维 Measurement → [**FINAL**](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md) · WAIT_WINDOW · `2026-07-19`  
**Mode:** 上表 W% = Evidence Sync 历史；**发布对照以 Measurement FINAL 的 pass/denom 为准**  
**Measurement：** [Recalculate 框架](./TT-PSG-COVERAGE-MEASUREMENT-RECALCULATE-LATEST.md) · [FINAL](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md)  
**Authenticity：** [Non-Web3 Audit](./TT-PSG-COVERAGE-GAP-NON-WEB3-AUTHENTICITY-AUDIT-LATEST.md)  
**输入：** [Gap Map](./TT-PSG-RELEASE-SURFACE-TEST-COVERAGE-GAP-MAP-LATEST.md) · [Completion Pack](./TT-PSG-COVERAGE-COMPLETION-PACK-LATEST.md) · [Acceptance Baseline](./TT-PSG-COVERAGE-ACCEPTANCE-BASELINE-LATEST.md)  
**Threshold / Gap：** [Acceptance Threshold Matrix](./TT-PSG-COVERAGE-ACCEPTANCE-THRESHOLD-MATRIX-LATEST.md)  
**Gate / Registry 裁决戳：**

```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED
Coverage Metrics:    FINAL
Consistency Control: NOT_ALIGNED
Threshold Rollup:    NEED_FIX
```

> **Consistency Control：** [LATEST](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md) — LOCAL Measurement ≠ ALIGNED Acceptance。

> **本页 W%** = 历史 Evidence Sync（PARTIAL→加权）· **≠** Non-Web3 估数。  
> **四维本地数字** 以 [Measurement FINAL](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md) `pass/denom` 为准（P3 LOCAL：RBAC 60/96 · Journey 5/5 · Data 20/20 · UI 24/24）。  
> **Acceptance 分子** 另受 Consistency Control 约束（仅 ALIGNED_PASS）。

---

## 计分规则（写死）

| 记号 | 含义 |
|------|------|
| **Mapped %** | 有可 cite Evidence 的项 / 总项（含 PARTIAL） |
| **PASS %** | 达 Acceptance「可宣称 PASS」的项 / 总项（PARTIAL 不计 PASS） |
| **Weighted %** | PASS=1.0 · PARTIAL/CITE=0.5 · DEFERRED 移出分母或单独列 · NOT_RUN=0 |

**Code Line：** 不计入本 Dashboard（DEFERRED）。

---

## Coverage Dashboard（最终视图）

| 维度 | Mapped % | PASS % | Weighted % | 分子/分母（Mapped） | 说明 |
|------|----------|--------|------------|---------------------|------|
| **Functional Domain** | **100%** | **27%** | **64%** | 11/11 有证据 · COVERED 3/11 | 见 §1 |
| **User Journey** | **100%** | **0%** | **50%** | 6/6 有证据 · PASS 0/6 | 见 §2 · 全 PARTIAL |
| **API（核心族）** | **100%** | **100%** | **100%** | 6/6 族有测包/探针 | 见 §3 · 非穷尽状态码 |
| **RBAC** | **100%** | **0%** | **50%** | 6/6 Role 行列齐全 · live 未宣称 PASS | 见 §4 |
| **Data Lifecycle** | **100%** | **0%** | **50%** | 4/4 Surface 已映射 · Consistency Full 未宣称 | 见 §5 |
| **UI/UX（P0）** | **100%** | **33%** | **67%** | 6/6 P0 有证据 · 无 Fix 重叠「净」面 2/6 | 见 §6 |
| **Security/Web3** | **100%** | **33%** | **58%** | 6/6 控制项有证据 · 硬 PASS 2/6 | 见 §7 |

```text
PSG Coverage Metrics Baseline

Functional   Mapped 100% · PASS 27% · W 64%
Journey      Mapped 100% · PASS  0% · W 50%
API          Mapped 100% · PASS 100% · W 100%
RBAC         Mapped 100% · PASS  0% · W 50%
Data         Mapped 100% · PASS  0% · W 50%
UI/UX P0     Mapped 100% · PASS 33% · W 67%
Security     Mapped 100% · PASS 33% · W 58%
Code Line    DEFERRED（不计）

Overall Acceptance:     CONDITIONAL
Coverage stamp:         Evidence VERIFIED · Metrics NOT FINAL
Interpretation:         上表 = LAST_FORMAL 映射分 · 非 Measurement FINAL
                        Non-Web3 live 旁证已 VERIFIED · 分母格未齐 → Metric GAP
                        → Fix=8 · 禁止估数升维
```

**读法：** Mapped 高 = 映射做过；W% = 旧 Formal；四维 Non-Web3 **不得**因 smoke PASS 改写为高 %。

---

## §1 Functional Domain

| 域 | 档 | 分 |
|----|-----|-----|
| Auth · Market · Provider | COVERED | 1.0 ×3 |
| Escrow · Governance · Steward · Admin · Wallet · Trust · CMS | PARTIAL | 0.5 ×7 |
| Payment/Settlement 真资金 | DEFERRED | 出分母（另窗）· 映射占位仍计 Mapped |

- **Mapped：** 11/11 = **100%**（含 Deferred 占位行）  
- **PASS（COVERED only）：** 3/11 = **27%**  
- **Weighted：** (3×1 + 7×0.5)/11 = **64%**

---

## §2 User Journey（P1 统计）

| Journey | 核心链 | 档 | Evidence 摘要 |
|---------|--------|-----|---------------|
| Tourist | Create trip → Accept guide → Escrow → Complete（切片） | PARTIAL | web3 full-chain · orders/escrow smoke |
| Guide | Profile → Accept → Deliver | PARTIAL | guide workbench/detail/bind smokes |
| Provider | Register → Publish → Market | PARTIAL | provider onboarding/workbench |
| Steward | Apply → Review / 治理入口 | PARTIAL | steward onboarding/workbench |
| Admin | Manage → Audit | PARTIAL | admin pages · rbac · CERT |
| DAO | Propose → Timelock → Execute | PARTIAL | proposals L5 · **Execute 等解锁** |

- **Mapped：** 6/6 = **100%**  
- **PASS：** 0/6 = **0%**  
- **Weighted：** 6×0.5/6 = **50%**

---

## §3 API Contract（核心 Endpoint 族）

| 族 | Auth 意图 | Evidence | 档 |
|----|-----------|----------|-----|
| `/auth/*` | session | cargo auth_* tests | PASS |
| `/orders*` + escrow/dispute | user/role | cargo orders/escrow/dispute | PASS |
| market/discover/bookmarks | read + login | bookmarks + itinerary tests | PASS |
| `/admin*` | admin RBAC | admin tests · CERT · rbac smoke | PASS |
| governance/steward | steward/gov | proposals/steward smokes · matrix gate | PASS |
| `/api/v1/catalog*` + cold-start | public published | CMS Specialty probes | PASS |

- **Mapped / PASS / Weighted：** 6/6 = **100%**  
- **边界：** 非全仓 OpenAPI · 非每 401/403/422

---

## §4 RBAC（Role × Capability）

| Role | 能做有证 | 禁止有证 | live 交叉 | 档 |
|------|----------|----------|-----------|-----|
| Tourist | ✅ | ✅ 纸面 | 未全 live | PARTIAL |
| Guide | ✅ | ✅ 纸面 | 未全 live | PARTIAL |
| Provider | ✅ | ✅ 纸面 | 未全 live | PARTIAL |
| Steward | ✅ | ✅ · FE Finding | 未全 live | PARTIAL |
| Admin | ✅ CERT | ✅ 纸面 | Deferred | PARTIAL |
| DAO | ✅ 提案 | ✅ Timelock | Execute 未 | PARTIAL |

- **Mapped：** 6/6 = **100%**  
- **PASS（live Acceptance）：** 0/6 = **0%**  
- **Weighted：** **50%**

---

## §5 Data Lifecycle

| Surface | 真源→API→DB→UI 映射 | Consistency Full | 档 |
|---------|---------------------|------------------|-----|
| Market | ✅ | 未宣称 | PARTIAL |
| Provider | ✅ | 未宣称 | PARTIAL |
| Community | ✅ | 未宣称 | PARTIAL |
| Announcement | ✅ | 未宣称 | PARTIAL |

- **Mapped：** 4/4 = **100%** · **PASS：** 0/4 · **Weighted：** **50%**

---

## §6 UI/UX P0

| P0 | 有证据 | 无开放 Fix 重叠 | 档 |
|----|--------|-----------------|-----|
| `/` 首页 | ✅ | ✅ | PASS 切片 |
| Market | ✅ | ✅ | PASS 切片 |
| Wallet | ✅ | ❌ WC Fix | PARTIAL |
| Governance | ✅ | ❌ ACTIVE Fix | PARTIAL |
| Escrow | ✅ draft | 已上链 Deferred | PARTIAL |
| Profile/Trust/Role | ✅ | ❌ Role/Trust Fix | PARTIAL |

- **Mapped：** 6/6 = **100%**  
- **PASS（净）：** 2/6 = **33%**  
- **Weighted：** (2×1 + 4×0.5)/6 = **67%**

---

## §7 Security / Web3

| 控制项 | 档 | 分 |
|--------|-----|-----|
| Chain Identity | PASS/OK | 1.0 |
| Shadow/Hardening 归档 | PASS/CLOSED | 1.0 |
| Address Binding | PARTIAL | 0.5 |
| Wallet Flow | PARTIAL | 0.5 |
| Permission 纸面 | PARTIAL | 0.5 |
| Timelock | CITE/等待 | 0.5 |

- **Mapped：** 6/6 = **100%**  
- **PASS：** 2/6 = **33%**  
- **Weighted：** (2 + 4×0.5)/6 = **58%**

---

## Min-Fix 后刷新表（预置 · 不现做）

| Fix | 刷新维度（分子） |
|-----|------------------|
| WC | Security · UI/UX · Journey(Tourist/DAO…) |
| ACTIVE Runtime | Security · Journey(Steward/DAO) · Functional(Gov/Steward) |
| Role | RBAC · Journey · UI/UX |
| Trust | UI/UX · Data Surface |
| SHA/image | （Identity · 不进七维 % 或另列 Artifact） |

未改代码的 Auth/Market/Provider：**不重跑** · 沿用本 Baseline。

---

## Non-Web3 四维 · Measurement FINAL（覆盖估数与 GAP）

| 维 | LAST_FORMAL W% | Measurement FINAL（P3） | Threshold |
|----|----------------|------------------------|-----------|
| Journey | 50% | **5/5 = 100%** | **PASS** |
| RBAC | 50% | **60/96 = 62.5%** | **NEED_FIX** |
| Data | 50% | **20/20 = 100%** | **PASS** |
| UI/UX P0 | 67% | **24/24 = 100%** | **PASS** |

---

## 完成判定

| 项 | 结果 |
|----|------|
| 七维 LAST_FORMAL Dashboard | ✅ |
| Measurement Recalculate FINAL | ✅ Phase3 · NOT_RUN=0 · Rollup NEED_FIX（RBAC 阈值） |
| 全量 E2E / llvm-cov / 压测 / Money-Path | ❌ 故意未做 |
| 新 Finding / Fix Required Δ | **0**（Register 关联 seed repair · 不增 Fix） |
| Gate 裁决 | **CONDITIONAL_GO** · Fix=8 · **未改** |

**下一动作：**（解锁后）Min-Fix（Fix=8）→ 影响域复验 → PSG Final Gate。**禁止**再为 Coverage 随机扩测。
