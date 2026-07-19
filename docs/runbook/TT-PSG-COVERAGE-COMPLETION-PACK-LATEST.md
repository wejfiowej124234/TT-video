# PSG · Coverage Completion Pack（Evidence Sync Only）

**Machine:** `TT_PSG_COVERAGE_COMPLETION_PACK`  
**Status:** **COMPLETE** · WAIT_WINDOW · `2026-07-19`  
**Mode:** Evidence Sync · **≠** Re-test Campaign · **≠** New Audit  
**母报告：** [Coverage Acceptance Baseline](./TT-PSG-COVERAGE-ACCEPTANCE-BASELINE-LATEST.md)  
**七维模型：** [Coverage Model](./TT-PSG-COVERAGE-MODEL-SEVEN-DIMENSIONS-LATEST.md)

> **做了什么：** 用已有代码路径 + 已有脚本 + 已有 Evidence **映射**七维 Dashboard 缺口。  
> **没做什么：** 全量 E2E · 性能压测 · llvm-cov/vitest % · Fix · Deploy · Registry/Gate 变更 · 新 Finding 桶。  
> **Gate：** 仍 `CONDITIONAL_GO` · Fix Required **仍 = 8** · Overall Coverage **仍 CONDITIONAL**。  
> **规则：** 观察 → 仅关联既有 Register ID。

---

## Dashboard（Completion 后）

```text
Functional Domain     ✅  mapped（Gap Map + 本 Pack cite）
User Journey          ⬅ 补齐映射 → PARTIAL（核心路径有证据 · 未宣称全闭环复验）
API / Backend         ✅  mapped → PASS（合同索引）
Code Line             ⏸  DEFERRED
Security / Web3       ⬅ 汇总 → PARTIAL（↔ Min-Fix）
Data Lifecycle        ⬅ 补齐 → PARTIAL（P0 真源明确）
UI / UX               ⬅ 汇总 → PARTIAL（P0 ↔ Fix）

Overall:              CONDITIONAL
New Fix Required:     0
```

---

## 1 · User Journey Coverage — **PARTIAL**

测试账号（immutable）：C2 Tourist · C3 Guide · C4 Provider · C1 Steward hub · Admin 另档 · DAO=治理窗。

| Journey | 核心步 | 既有 Evidence（不重跑） | 状态 |
|---------|--------|------------------------|------|
| **Tourist** | 注册→登录→市场→需求/订单→Escrow 切片 | `smoke-auth-register` · `smoke-web3-itinerary-full-chain-local` · `smoke-orders-pay-escrow-local` · LANDING-MARKET SSOT | **PARTIAL** |
| **Guide** | 身份→工作台→接单/详情→订单态 | `smoke-guide-workbench-l5-local` · `smoke-guide-detail-booking-local` · `smoke-guide-profile-settings-local` · `smoke-escrow-draft-guide-bind-local` | **PARTIAL** |
| **Provider** | 入驻→展示→工作台 | `smoke-provider-onboarding-local` · `smoke-provider-workbench-l5-local` · Provider UI Freeze | **PARTIAL**（较强） |
| **Steward** | 申请→工作台→治理入口 | `smoke-steward-onboarding-local` · `smoke-steward-workbench-l5-local` · steward L5 contracts | **PARTIAL** |
| **Admin** | 登录→后台→审核/运营入口 | `smoke-admin-pages-local` · `smoke-admin-rbac-matrix-local` · Admin CERT | **PARTIAL** |
| **DAO** | 提案→Timelock→执行 | `smoke-governance-proposals-l5-local` · F-02 CITE · **未** execute | **PARTIAL** / 等解锁 |

**关联 Fix（不新增）：** Wallet/Role/Trust/ACTIVE 影响 Journey 完成度 → 既有 Min-Fix。  
**GO 前：** 解锁后仅对 **受 Min-Fix 影响** 的旅程步定向复验。

---

## 2 · RBAC Coverage Matrix — **PARTIAL**（覆盖确认 · 非攻击测试）

| Role | 能做（证据存在） | 禁止做（纸面/CERT/Hardening） | Evidence |
|------|------------------|-------------------------------|----------|
| **Tourist (C2)** | 浏览市场 · 下单走廊 · 本人订单 | 不可 Admin 审批 · 不可改他人资金参数 | web3/orders smokes · Hardening P0 |
| **Guide (C3)** | 工作台 · 接单/行程绑定切片 | 不可任意改订单金额（规则纸面） | guide smokes · escrow draft bind |
| **Provider (C4)** | 入驻 · 工作台 · listing 门闸切片 | 不可绕过 publish gate | provider onboarding · acquisition 旁路非 Provider |
| **Steward (C1 hub)** | 治理/工作台入口 · stake 走廊（①） | 不可伪 ACTIVE 若 FE LEGACY（Finding） | steward smokes · **→** `PFA-UI-STEWARD-01` |
| **Admin** | 六角色 RBAC CERT · 审批/审计主链 | 不可未审计直改资金（纸面） | Admin CERT · `smoke-admin-rbac-matrix-local` · live 全交叉 **Deferred** `PFA-UI-ADMIN-01` |
| **DAO / Gov** | 提案 L5 · Timelock 窗 | 不可跳 Timelock 执行 | proposals smoke · F-02 |

**新 Fix：0** · live 矩阵 = Deferred。

---

## 3 · Data Lifecycle Coverage — **PARTIAL**

```text
CMS / Catalog Owner  →  API (catalog/cold-start)  →  DB (published)  →  UI (/ · /market*)
```

| Surface | 真源 | 展示消费 | 生命周期要点 | Evidence |
|---------|------|----------|--------------|----------|
| **Market** | Catalog / discover API · PG published | `/` `/market*` | no-store 主路径 · ambient soft gap 已记 | CMS Specialty · LANDING-MARKET |
| **Provider** | onboarding/listing API | provider UI · market 展示 | publish gate | provider smoke · acquisition 旁证 |
| **Community** | community API / feed | `/community/*` | Phase1 freeze · staging smokes 另档 | community L5 green / staging smokes cite |
| **Announcement** | announcements API | 公开表面 | `max-age=60` · Specialty 探针 | CMS Specialty §2 |

| 项 | 状态 |
|----|------|
| 唯一 Owner（纸面） | Final Paper Dependency · CMS Specialty |
| Consistency Full | **未**宣称 → PARTIAL |
| 关联 Deferred | Pulse 双轨 · Country QA · DC-05 soft |
| **新 Fix** | **0** |

---

## 4 · API Contract Coverage — **PASS**（索引 · 不重压）

| 族 | Method/Auth 意图 | Evidence |
|----|------------------|----------|
| `/auth/*` | register/login/logout · session | `auth_register_login_logout_db_api_tests*` |
| `/orders*` · escrow | create/list/pay/escrow/dispute | `orders_*escrow*` · `tests_esc_dsp` · dispute tests |
| `/market*` · discover · bookmarks | 读为主 · 登录收藏 | `me_market_bookmarks_db_api_tests` · itinerary tests |
| `/admin*` | RBAC · 审批 | `routes/admin/tests` · Admin CERT · rbac smoke |
| `/governance*` · steward | 提案/申请 | proposals/steward smokes · matrix gate |
| `/api/v1/catalog*` · cold-start | 公开读 · published | CMS Specialty probes |

**诚实边界：** 非 OpenAPI 全量契约穷尽 · 非每码 401/403/422 矩阵。

---

## 5 · Security / Web3 Evidence Merge — **PARTIAL**

| 主题 | 合并来源 | 状态 | Register |
|------|----------|------|----------|
| Chain Identity | PFA-02 · V311 CERT · Matrix | 脊 OK | — |
| Address Binding | PFA-02 · PFA-UI-01 | PARTIAL | `PFA-UI-GOV-01` · `STEWARD-01` · `GOV-02` |
| Wallet Flow | PFA-03 · wallet L5 · WC | PARTIAL | **`PFA-UI-WALLET-01`** |
| Permission | Hardening P0 · Admin CERT · W3S | PARTIAL 纸面 | live → `PFA-UI-ADMIN-01` Deferred |
| Timelock | F-02 · Operator Card | CITE / 等待 | `PSG-CITE-TIMELOCK-F02` |
| Shadow/Hardening | W3S · HRD P0–P2 CLOSED | CLOSED | — |

**≠ 重新安全审计。**

---

## 6 · UI / UX Evidence Merge — **PARTIAL**（P0 only）

| P0 | Evidence | Finding 关联 |
|----|----------|--------------|
| `/` 首页 | FIVE-MAIN Freeze · T0 | — |
| Market | FIVE-MAIN · LANDING-MARKET | — |
| Wallet | `GO_local_wallet_connection_l5` · PFA-UI | `PFA-UI-WALLET-01` |
| Governance | PFA-UI-01 · proposals L5 | `PFA-UI-GOV-*` |
| Escrow | Draft Freeze · web3 green | 已上链 Deferred |
| Profile / Trust / Role | identities · meTrust · PFA-UI | `PFA-UI-ROLE-*` · `PFA-UI-TRUST-01` |

**新 Fix：0。**

---

## 完成判定

| 检查 | 结果 |
|------|------|
| Journey / RBAC / Data / API / Security / UI 映射齐 | **是** |
| 全量 E2E / Perf / 行覆盖已跑 | **否**（故意） |
| Fix Required 增量 | **0**（仍为 8） |
| Gate / Registry 已改 | **否** |
| CONDITIONAL_GO 改变 | **否** |

---

## 下一合法动作（不变）

```text
heartbeat only
        ↓
Coverage Gap Fix → Register → Local PASS → Git SHA pin
        → Staging same SHA → Staging Evidence → Coverage Recalculate（ALIGNED only）
        ↓
execute_allowed_now=true
        ↓
Min-Fix(8) → 受影响域复验 → Evidence Sync → Coverage Recalculate
        ↓
PSG Final Gate
```

**Consistency Control：** [TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md) — **禁止**仅本地通过计入 Coverage PASS。