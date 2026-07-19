# PSG · Coverage Model（七维）+ Final Coverage Acceptance Layer

**Machine:** `TT_PSG_COVERAGE_MODEL_SEVEN_DIMENSIONS`  
**Status:** **ACTIVE** · Acceptance Layer **IN_GATE** · `2026-07-19`  
**机读：** [`registry/psg-coverage-model-seven-dimensions.v1.yaml`](../../registry/psg-coverage-model-seven-dimensions.v1.yaml)  
**功能域明细：** [Release Surface Gap Map](./TT-PSG-RELEASE-SURFACE-TEST-COVERAGE-GAP-MAP-LATEST.md)  
**Acceptance Baseline（只读验收）：** [Coverage Acceptance Baseline Report](./TT-PSG-COVERAGE-ACCEPTANCE-BASELINE-LATEST.md)  
**Completion Pack（Journey/RBAC/Data/API/Sec/UI 映射）：** [Coverage Completion Pack](./TT-PSG-COVERAGE-COMPLETION-PACK-LATEST.md)  
**Measurement（可计算分母）：** [Coverage Measurement Recalculate](./TT-PSG-COVERAGE-MEASUREMENT-RECALCULATE-LATEST.md)  
**裁决入口：** [PSG Production Release Readiness Gate](./TT-PSG-PRODUCTION-RELEASE-READINESS-GATE-LATEST.md)

```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED
Coverage Metrics:    FINAL
Threshold Rollup:    NEED_FIX
```

**四维 Measurement（Phase3 · LOCAL）：** [FINAL](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md)（Journey 5/5 · Data 20/20 · UI 24/24 · RBAC 60/96 · NOT_RUN=0）。  
**Consistency：** [Control](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md) = **NOT_ALIGNED**（Acceptance 只认 ALIGNED_PASS）。
> **七维 Coverage = Gate 最终验收层** · **不是**「发现问题后再补的审计」。  
> **Mode：Evidence Sync** · Coverage Status = **Latest Valid Evidence** · **≠** Latest Test Execution Time · **≠** Re-test Campaign。  
> 正确链：风险域检查 → Register 分类 → Fix/Deferred/Accepted → **Measurement Recalculate** → **Coverage Acceptance** → Release Decision。  
> **禁止**估算覆盖率 · **禁止**用单一行覆盖率 % 代表覆盖 · **禁止**为刷数字全量重跑。  
> **本文件不自动**开旅程/全站审计 · WAIT_WINDOW 仍 heartbeat only。  
> **当前 Gate：** `CONDITIONAL_GO` · Fix=8 · Coverage = Evidence VERIFIED · Metrics NOT FINAL。

---

## 0 · 在 Gate 中的位置

```text
PSG Production Release Readiness Gate
├── Release Blocker
├── Fix Required
├── Deferred / Accepted Risk
└── Coverage Acceptance   ← 最终验收层（七维）
         ↓
   GO / CONDITIONAL_GO / NO-GO
```

```text
发现问题 → Register 分类 → 修复（Release Window）
        → 重新验证覆盖是否达发布标准
        → 才允许 GO
```

**≠** 发现问题 → 修复 → 直接上线。

---

## 1 · 七维定义 + Production 门槛

| # | 维 | 回答 | Production 门槛 | 可 Deferred？ |
|---|-----|------|----------------|---------------|
| **1** | Functional Domain | P0/P1 域有证据？ | **PASS** | 否（P0/P1） |
| **2** | User Journey | 核心角色旅程走通？ | **核心旅程 PASS** | 非核心可 Deferred |
| **3** | API / Backend | 核心 API/权限/错误路径？ | **PASS** | 非核心可 Deferred |
| **4** | Code Line | 行/分支 %？ | **可不挡** | **是** · Engineering Quality |
| **5** | Security / Web3 | 地址/Chain/Gov/Timelock/Wallet/权限？ | **PASS** | live 全角色交叉可部分 Deferred |
| **6** | Data Governance | 真源 CMS→API→DB→UI？ | **PASS**（P0 链） | Country QA / Pulse 可 Deferred |
| **7** | UI / UX | P0 路径体验闭环？ | **P0 PASS** | 非 P0 / 多端可 Deferred |

### Acceptance 状态词（维级 · Gate 用）

| 状态 | 含义 |
|------|------|
| **PASS** | 达本维 Production 门槛 |
| **CONDITIONAL** | 有证据 · 未达门槛（含开放 Fix 重叠）· 可维持 CONDITIONAL_GO |
| **FAIL** | 关键无证据或未分类黑洞 → 倾向 NO-GO |
| **DEFERRED** | 明确不挡首次 Production 切片（仅 Code Line 默认可；其它须 Owner 书面） |

---

## 2 · Coverage Acceptance Dashboard（Baseline COMPLETE · 只读）

> 真源报告：[Acceptance Baseline](./TT-PSG-COVERAGE-ACCEPTANCE-BASELINE-LATEST.md)

```text
PSG Final Coverage Acceptance (Baseline)

1 Functional Domain     PARTIAL
2 User Journey          PARTIAL
3 API / Backend         PASS
4 Code Line             DEFERRED
5 Security / Web3       PARTIAL
6 Data Governance       PARTIAL
7 UI / UX               PARTIAL

Overall:                CONDITIONAL
→ Gate CONDITIONAL_GO · Fix=8 · Release NOT_READY_FOR_GO
→ 新 Fix from Baseline = 0（仅关联既有 ID）
```

| # | 维 | Acceptance | 门槛摘要 | 证据 cite |
|---|-----|------------|----------|-----------|
| 1 | Functional | **CONDITIONAL** | P0/P1 均有证据；PARTIAL 须 Fix 后复验升 PASS | [Gap Map](./TT-PSG-RELEASE-SURFACE-TEST-COVERAGE-GAP-MAP-LATEST.md) |
| 2 | Journey | **CONDITIONAL** | 核心路径须 PASS 才可 Production GO | 既有 smokes · **禁** WAIT_WINDOW 开全旅程审计 |
| 3 | API | **PASS** | 核心 API + 权限/错误路径有测 | `cargo test -p traveltrust-api` |
| 4 | Code | **DEFERRED** | 不挡首次上线 | — |
| 5 | Security/Web3 | **CONDITIONAL** | 地址/Chain/Gov/Timelock/Wallet/权限门槛 | PFA-02/03/UI-01 · Hardening · Min-Fix |
| 6 | Data | **CONDITIONAL** | 真源链已知且 P0 探针 | CMS Specialty |
| 7 | UI/UX | **CONDITIONAL** | P0：登录·市场·订单·钱包·治理·Escrow | Freeze · T0 · Min-Fix Role/Trust |

**rollup 规则：** 任一 **必达维** 为 FAIL → Gate 倾向 **NO-GO**；必达维为 CONDITIONAL 或 Fix>0 → **CONDITIONAL_GO**；必达维均 PASS + Blocker=0 + Fix=0 + Owner → 可宣称切片 **GO**（仍 ≠ 另闸 CERT/全站 Production GO，除非 Owner 同批声明）。

---

## 3 · 各维门槛细则

### 3.1 Functional Domain — Production 要求 **PASS**

- Auth · Market · Escrow · Governance · Wallet · Admin（及 Gap Map P0/P1）**均有**自动化或烟测 + Evidence
- `NOT_RUN` 黑洞 = **FAIL**
- 域级 PARTIAL 若仅映射已排程 Fix → Acceptance **CONDITIONAL**（修完复验 → PASS）

### 3.2 User Journey — Production 要求 **核心旅程 PASS** ⭐

| 角色 | 核心骨架（Acceptance 意图） |
|------|---------------------------|
| Tourist | 注册→登录→市场→Guide→订单→Escrow→完成→评价 |
| Guide | 注册→身份→发布→接单→完成→收益 |
| Provider | 入驻→门闸→工作台 |
| Steward | 申请→审核→治理权限 |
| Admin | 登录→审核→运营→风控 |
| DAO | 提案→Timelock→执行（与 F-02/治理窗对齐） |

**WAIT_WINDOW：** 不新开旅程矩阵。  
**Release Window 后 / GO 前：** 核心路径须有复验 Evidence（可窄烟测 · 禁借机全站 E2E 风暴）。

### 3.3 API / Backend — **PASS**

- 核心 Route 族有测；权限码与错误路径存在（非 100% 穷尽）
- 当前 cite：**PASS**

### 3.4 Code Line — **DEFERRED**（不挡首次 Production Gate）

- `cargo llvm-cov` / `vitest --coverage` → Engineering Quality Tracked
- **永不**单独决定 GO

### 3.5 Security / Web3 — **PASS** ⭐

须证明（或 Fix 关闭后复验）：地址一致 · ChainId · Governor · Timelock · Wallet flow · Permission 边界纸面+关键绑定。  
Money-Path 真资金可另窗；**不得**用「无测」冒充 PASS。

### 3.6 Data Governance — **PASS**（P0 真源链）⭐

```text
Source → API → DB → UI
```

P0：谁是真源已知 · 关键链探针有证据。Country Content QA / Pulse 双轨可 Deferred（须入册）。

### 3.7 UI / UX — **P0 PASS**

P0 闭环：登录 · 市场 · 订单 · 钱包 · 治理 · Escrow（Loading/Empty/Success/Error/Unauthorized 切片证据）。  
非 P0 / Mobile / Wallet browser 可 Deferred。

---

## 4 · Production GO 公式（Coverage 侧）

```text
Blocker = 0
+ Release Fix Required 全部 Closed（含单项 Evidence）
+ Coverage Acceptance 必达维均 PASS
    （Functional · Journey 核心 · API · Security/Web3 · Data P0 · UI P0）
+ Code Line = DEFERRED 可接受（或 Owner 另要求）
+ Owner Sign-off
+ Rollback 存在
= 本 Gate 可宣称切片 GO
```

**不是** Finding = 0。

---

## 5 · 未来深化（登记 · 非本窗 Audit）

| ID | 项 | Status |
|----|-----|--------|
| `PSG-COV-MEASUREMENT` | 可计算分母 + Recalculate | **ACTIVE** · [Measurement](./TT-PSG-COVERAGE-MEASUREMENT-RECALCULATE-LATEST.md) |
| `PSG-COV-JOURNEY-DASH` | Journey 5 步格板 | **ACTIVE**（分母已定 · 填格 PENDING） |
| `PSG-COV-RBAC-MATRIX` | 6×4×4=96 live 表 | **ACTIVE**（分母已定 · 填格 PENDING） |
| `PSG-COV-DATA-LIFECYCLE` | 5×4=20 Create→UI | **ACTIVE**（分母已定 · 填格 PENDING） |
| `PSG-ENG-LINE-COVERAGE` | 行/分支/函数 % | DEFERRED |

---

## 6 · 防混淆

| 错误 | 正确 |
|------|------|
| Coverage 黄灯 → 马上新开审计轨 | 先看是否已在 Fix/Deferred；Acceptance 在 **Fix 关闭后复验** |
| Fix 关完就 GO | 还须 **Coverage Acceptance 复验达 PASS** |
| 行覆盖未做 → NO-GO | Code Line **可 DEFERRED** |
| Acceptance = 任务列表 | Acceptance = **裁决门槛** · Register 仍是问题地图 |
