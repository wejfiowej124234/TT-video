# PSG · Coverage Acceptance Threshold Matrix + Gap List

**Machine:** `TT_PSG_COVERAGE_ACCEPTANCE_THRESHOLD_MATRIX`  
**Status:** **COMPLETE** · WAIT_WINDOW · `2026-07-19`  
**Mode:** 标准定义 + 差距分析 · **≠** 新 Audit · **≠** 重跑全量  
**输入 Metrics：** [Coverage Metrics Baseline](./TT-PSG-COVERAGE-METRICS-BASELINE-LATEST.md)（LAST_FORMAL W% · **NOT FINAL**）  
**Measurement：** [Coverage Measurement Recalculate](./TT-PSG-COVERAGE-MEASUREMENT-RECALCULATE-LATEST.md)  
**机读：** [`registry/psg-coverage-acceptance-threshold-matrix.v1.yaml`](../../registry/psg-coverage-acceptance-threshold-matrix.v1.yaml)

```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED
Coverage Metrics:    FINAL
Consistency Control: NOT_ALIGNED
Threshold Rollup:    NEED_FIX
```
**FINAL 数字（Phase3 · LOCAL）：** [Measurement FINAL](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md) — Journey **5/5** · Data **20/20** · UI **24/24** · RBAC **60/96 NEED_FIX** · Rollup **NEED_FIX**（定向 NOT_RUN=0）。  
**Consistency Control：** [Consistency Control](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md) = **ALIGNED_PASS** — Pass Tier **ALIGNED_PASS**（Recalculate 已绑定）；**Threshold Rollup 仍 NEED_FIX**（RBAC 60/96）。
> **顺序（写死）：** 先定义发布标准 → 可计算分母 → 填格证据 → Recalculate → 对照本阈值 → GO。  
> **不是：** 先刷估数 % → 再上线。  
> **不改变** `CONDITIONAL_GO` · Fix Required=8 · **禁止**全量测试 / 零 Finding / 强拉 Deferred / 估算覆盖率。

---

## 0 · 发布控制链（固化）

```text
PSG Coverage Acceptance 标准阈值
        ↓
Measurement 分母（RBAC/Journey/Data/UI）
        ↓
Evidence VERIFIED（可有）· Metric GAP/PENDING
        ↓
填格 → Coverage Measurement Recalculate → Metric FINAL
        ↓
对照本 Threshold（meets）
        ↓
execute_allowed_now=true → Release Window · Min-Fix（Fix=8）
        ↓
受影响域复验 → Metrics refresh
        ↓
PSG Final Gate → GO / NO-GO
```

---

## 1 · 七维 Acceptance 标准（首次生产切片）

| 维度 | 首次生产上线标准 | Measurement FINAL | Threshold | 主依赖 |
|------|------------------|-------------------|-----------|--------|
| **Functional Domain** | Weighted ≥90% **且** P0/P1 Mapped 100% | （沿用 LAST_FORMAL 64%） | ❌ | Min-Fix + 复验 |
| **User Journey** | `pass/5` = 100% | **1/5 (20%)** | **NEED_FIX** | J1/J2/J4/J5 定向补证 · 后 WC/Role |
| **API Contract** | ≥95% · 核心族 100% | 族级 100% 沿用 | ✅ 保持 | 触 API 再定向 |
| **RBAC** | `pass/96` = 100% | **7/96 (7.29%)** | **NEED_FIX** | 六角色 Deny/UI 格 |
| **Data Lifecycle** | `pass/20` ≥90% | **5/20 (25%)** | **NEED_FIX** | Create/DB/UI 缺口格 |
| **UI/UX P0** | `pass/24` ≥90% | **5/24 (20.83%)** | **NEED_FIX** | loading/error/empty · escrow |
| **Security/Web3** | P0=100% · 整体≥90% | （未测本窗 · Fix=8） | ❌ | ACTIVE · WC · Timelock |
| **Code Line** | 非首次硬门槛 | DEFERRED | ⏸ | Engineering |

**附加硬条件（与 Gate 同键）：** Blocker=0 · Fix Required=0 · Owner Sign-off · Rollback Ready · Code Line 可 Deferred。

### 硬门槛 vs 可接受（写死）

| 必须硬门槛 | 可以接受（不挡首次 GO） |
|------------|-------------------------|
| API 核心族 **100%** | 非核心 UI 页面 |
| RBAC 核心角色矩阵 **100%** | Code Line Coverage |
| Security/Web3 **P0 = 100%** | 非首发 Money-Path |
| Release Identity（SHA/image）**100%** | 已入册 Deferred 项 |
| 核心用户旅程 **≥90%** | — |

### 解锁后唯一执行序（8 步 · 不再扩 Coverage）

| 顺序 | 工作 | 目标 |
|------|------|------|
| 1 | WC 修复 | Wallet / Journey / UI / Security 提升 |
| 2 | ACTIVE Runtime 对齐 | Web3 / Governance / Steward |
| 3 | Role/RBAC 验证 | RBAC 50% → 接近 100% |
| 4 | Trust 修复 | UI / Data / Security 提升 |
| 5 | Release Identity（SHA/image） | 发布身份 PASS |
| 6 | 受影响 Journey 回归 | Core Journey ≥90% |
| 7 | Coverage Recalculate | 更新七维指标 |
| 8 | PSG Final Gate | GO / NO-GO |

**Final Gate 形态：** Blocker=0 · Release Fix=0 · Coverage=PASS（相对本阈值）· Owner=CONFIRMED · Rollback=READY → 切片 Production GO。

**禁止再：** 寻找更多测试类型 · 扩 Coverage 维 · 新 Audit · 为刷 % 全量重跑。

---

## 2 · 当前 → 目标 → 依赖（Release 开工表）

| Coverage | 当前 W% | Release 目标 | 依赖 Fix / 动作 |
|----------|---------|--------------|-----------------|
| Functional | 64% | PASS（≥90% W + P0/P1 Mapped 100%） | Min-Fix 全序 + 受影响域复验 |
| Journey | 50% | Core Journey PASS（≥90% W） | **WC · Role**（+ ACTIVE 影响 Steward/DAO） |
| API | 100% | **保持** | 无 |
| RBAC | 50% | Core Role PASS（矩阵 100%） | **Role Fix** + 定向「能做/不能做/API 拒」 |
| Data | 50% | P0 Data PASS（≥90%） | P0 链路确认（Specialty 已有 · 解锁后窄复验） |
| UI/UX | 67% | P0 PASS（≥90% · 关键入口 100%） | **Wallet · Gov/ACTIVE · Trust · Role** |
| Security/Web3 | 58% | PASS（P0=100% · 整体≥90%） | **ACTIVE · WC**（+ Timelock 执行窗对拍） |

**Release Window 开始时：直接按本表执行 · 不重新分析。**

---

## 3 · Gap List（按维拆解）

### 3.1 User Journey — 当前 50% → 目标 Core PASS

| Journey / 步 | 状态 | 动作 |
|--------------|------|------|
| 游客 · 注册登录 | 有证 · 可升 PASS | 无代码变更则沿用；WC 后若连钱包步再验 |
| 游客 · 市场/浏览旅行需求 | 有证 | 沿用 |
| 向导 · 接单 | PARTIAL | Role/工作台入口复验 |
| Escrow 走廊 | PARTIAL | WC + 订单/托管步定向复验（**非** Money-Path） |
| Provider · 入驻→市场 | 较强 PARTIAL | 沿用（无代码变更） |
| Steward | PARTIAL | **ACTIVE** 绑定后复验治理入口 |
| Admin | PARTIAL（入口有证） | 窄验后台入口；live 全矩阵仍 Deferred |
| DAO · Execute | PARTIAL / 等解锁 | F-02 execute · **非**本 Gap 另开审计 |

### 3.2 RBAC — 50% → 100%（生产必须项）

每个核心角色须在解锁后 **定向**（非全站攻击测试）补齐四问证据：

```text
登录 → 看到什么 → 能操作什么 → 不能操作什么 → API 是否拒绝
```

| Role | Gap | 关联 |
|------|-----|------|
| Tourist | 禁止项 API 拒证可加强 | Role 导航修复后抽样 |
| Guide | 同左 | Role Fix |
| Provider | 同左 | Role Fix |
| Steward | FE LEGACY 绑定 | **`PFA-UI-STEWARD-01`** |
| Admin | live 全交叉 Deferred | **不**拉进本窗强 PASS；入口+CERT 纸面 + Role |
| DAO | Execute 未 | Timelock 窗 |

### 3.3 UI/UX P0 — 67% → ≥90%

| 入口 | Gap | 关联 Fix |
|------|-----|----------|
| `/` · Market | 净 PASS 切片 | — |
| Wallet | KEY / 连接 | **`PFA-UI-WALLET-01`** |
| Governance | ACTIVE 绑定 | **`PFA-UI-GOV-*`** |
| Escrow | 草稿 OK · 已上链 Deferred | 不拉 Money-Path |
| Role / Trust / 工作台 | 入口一致 | **`PFA-UI-ROLE-*`** · **`PFA-UI-TRUST-01`** |

### 3.4 Security/Web3 — 58% → ≥90% · P0=100%

| 控制 | Gap | 关联 |
|------|-----|------|
| ACTIVE 地址绑定 | FE/Runtime | **`PFA-UI-GOV-01`** · **`STEWARD-01`** · **`GOV-02`** |
| WalletConnect | KEY_ABSENT | **`PFA-UI-WALLET-01`** |
| Governor / Timelock | 绑定 + 执行窗 | Min-Fix + F-02 |
| Role 权限 | 导航/边界 | Role Fix |
| Chain Runtime Mapping | `/meta` 对拍 | **`PFA-UI-GOV-02`** |

**不是**增加扫描数量。

### 3.5 Functional — 64% → ≥90%

随 Gov/Steward/Wallet/Escrow 等 PARTIAL 域在 Min-Fix + 复验后升档；Auth/Market/Provider 无变更则 **不重跑**。

### 3.6 Data — 50% → ≥90% P0

Specialty 已 PASS 探针；缺口=Consistency Full 未宣称。解锁后：**窄复验** P0 真源链（catalog→UI）· **禁止** CMS 深挖 / 新 Audit。

### 3.7 API — 100%

**保持** · 仅当 Min-Fix 触及契约时定向。

---

## 4 · 明确不做（破坏稳定性）

| ❌ | 原因 |
|----|------|
| 再开新 Audit / 新 Coverage 维 | 失稳 |
| 为刷 PASS % 重跑旧全量测试 | 假 Finding / 新变量 |
| llvm-cov / vitest 全量 % | 非首次 GO 硬门槛 |
| 全量 Playwright / 压测 / Money-Path | 另窗 |
| 把 Admin live 全矩阵 / Country QA 强拉进本 Release | Deferred 纪律 |

---

## 5 · 当前状态戳

```text
PSG Coverage Metrics:     BASELINE COMPLETE
Threshold Matrix:         COMPLETE
Gap List:                 READY FOR RELEASE WINDOW
Gate:                     CONDITIONAL_GO
Fix Required:             8
Coverage:                 CONDITIONAL
Release:                  NOT_READY_FOR_GO

Next:
  execute_allowed_now=true
    → Min-Fix
    → 定向补验证（本 Gap List）
    → Coverage Recalculate
    → PSG Final Gate
```

**PSG 能力一句话：** 证明「所有问题有分类、有责任、有处理路径」· **不是**证明「没有任何问题」。
