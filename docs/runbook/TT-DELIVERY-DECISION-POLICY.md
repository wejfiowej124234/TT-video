# TT-DELIVERY-DECISION-POLICY · 交付决策最高裁决规则

**生效：** 2026-07-01  
**优先级：** **全项目最高** — 一切工作的统一决策入口  
**阶段：** **Product Delivery**  
**机读：** [`registry/traveltrust-three-dimension-status.v1.yaml`](../../registry/traveltrust-three-dimension-status.v1.yaml)

**下游纪律（本政策为入口，不得绕过）：**

| 文档 | 关系 |
|------|------|
| [`TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md`](TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md) | 四大中心 · **八条治理原则** · 唯一合法路径 §C |
| [`TT-PROGRAM-MAINLINE-DISCIPLINE.md`](TT-PROGRAM-MAINLINE-DISCIPLINE.md) | 纪律 ④ · 五条主线 · 日报格式 |
| [`TT-ADMIN-PLATFORM-GOVERNANCE-DISCIPLINE.md`](TT-ADMIN-PLATFORM-GOVERNANCE-DISCIPLINE.md) | 纪律 ①～③ · Admin STABLE_FINAL |
| [`TT-CAPABILITY-MATRIX-UNIFIED.md`](TT-CAPABILITY-MATRIX-UNIFIED.md) | Architecture · Feature Level · Production |
| [`PHASE3-PRODUCTION-PREPARATION.md`](PHASE3-PRODUCTION-PREPARATION.md) | Phase ③ Dashboard |

---

## 0 · 机读键

```text
TT_DELIVERY_DECISION_POLICY: ENFORCED
TT_PROJECT_PHASE: PRODUCT_DELIVERY
TT_DEVELOPMENT_WORK_TYPES: BUG,FEATURE
TT_FEATURE_CLASSIFICATION_REQUIRED: true
TT_DECISION_GATE_QUESTIONS: 3
TT_FEATURE_CLASSIFICATION_QUESTIONS: 3
TT_FEATURE_SSOT_REQUIRED: true
TT_ADMIN_GOVERNANCE_CLOSED_LOOP: true
```

---

## 1 · 核心原则

```text
TT_DELIVERY_DECISION_POLICY: ENFORCED
TT_DEVELOPMENT_WORK_TYPES: BUG,FEATURE
TT_FEATURE_SSOT_REQUIRED: true
TT_ADMIN_GOVERNANCE_CLOSED_LOOP: true
```

### 1.1 工作类型（只允许两种）

以后所有需求 **只允许两种**：

| 类型 | 子类 | 处理 |
|------|------|------|
| **第一类：Bug** | BUG · Security · Incident · Production Hotfix | **允许直接修复**（仍须符合 Freeze 例外） |
| **第二类：Feature** | 一切新能力 · 增强 · 控制台 · UI 补齐 | **必须先归类** → 见 §1.2 |

**禁止：** 「这里放一点、那里再放一点、新开后台、再建管理页」— 未经归类 **不得实现**。

### 1.2 Feature 三问（归类 · 先于开发）

每个 **Feature** 必须先回答（**不再讨论放哪里**）：

| # | 问题 | 示例 |
|---|------|------|
| **F1** | **属于哪个中心？** | Featured → **Official Ops** |
| **F2** | **属于哪个模块？** | Featured → **Public Operations** |
| **F3** | **Feature Level 是什么？** | Featured → **STANDARD** |

**范例：**

| 需求 | 中心 | 模块 | Feature Level |
|------|------|------|---------------|
| 增加 Featured | Official Ops | Public Operations | STANDARD |
| 增加背景图上传 | Content Center | Landing | STANDARD |
| 增加 Feature Flag | Platform Center | Feature Flags | STANDARD |

归类真源：[`TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md`](TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md) §A · §B

### 1.3 Feature 统一入口流程（含 P8 · SSOT）

```
Requirement
      │
      ▼
Bug 还是 Feature？
      │
 ┌───┴───┐
 │       │
Bug    Feature
 │       │
 ▼       ▼
修复    四中心 → 模块 → Feature Level
 │       │
 │       ▼
 │   编写/更新 SSOT          ← P8 · 未经 SSOT 不得开发
 │       │
 │       ▼
 │   Delivery Gate（§1.4）
 │       │
 └───┬───┘
     ▼
  开始开发
     │
     ▼
  Evidence → Freeze / 更新 SSOT
```

**治理原则：**

- **P7：** Feature 必须先归类；**未经归类不得实现。**
- **P8：** Feature 必须先有 SSOT；**未经 SSOT 定义不得进入开发。**

**P8 避免：** 做完补文档 · 双文档冲突 · AI 按旧文档开发 · 多版本并存。

### 1.4 执行队列三问（SSOT 就绪后 · Delivery Gate）

**所有**开发、修复、重构、优化、文档、测试工作，在 Bug 直接路径，或 Feature **归类 + SSOT 就绪** 后，**还必须**回答：

| # | 问题 | 任一为 **No** → |
|---|------|-----------------|
| **1** | **是否阻断 Current Mainline？** | 不得进入当前执行队列 |
| **2** | **是否属于当前主线？** | 不得进入当前执行队列 |
| **3** | **是否符合当前模块的 Freeze Discipline？** | 不得进入当前执行队列 |

**若任一答案为 No** → **不得进入当前执行队列** → 归入对应 **Roadmap**（通常为 Post-GO Official Ops 1.1+）。

### 1.5 唯一合法路径（治理闭环）

真源：[`TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md`](TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md) §C

```
需求 → Bug? → [是] 修复 → Evidence
              → [Feature] 四中心 → 模块 → Level → SSOT → Gate → 开发 → Evidence → Freeze
```

**机读：** `TT_ADMIN_GOVERNANCE_CLOSED_LOOP: true`

---

## 2 · 统一决策流程

```
发现问题
        │
        ▼
是否阻断 Current Mainline？  ──► 是否属于当前主线？  ──► 是否符合 Freeze Discipline？
        │
   ┌────┴────┐
   │         │
  全是       任一 No
   │         │
立即修复     归入对应 Roadmap（不执行）
   │
   ▼
执行
   │
   ▼
验证（Gate / 证据）
   │
   ▼
更新 SSOT
```

**禁止：**

- 「顺手把这个也改了」
- 「这个后台再优化一下」
- 「这个 CMS 再补一个按钮」

---

## 3 · 交流 / 评审（强制）

讨论任何工作项前，**先回答**（不直接讨论实现）：

| 序 | 问题 |
|----|------|
| 0 | **Bug 还是 Feature？** |
| 0a | （Feature）**中心 · 模块 · Feature Level 是什么？** |
| 0b | （Feature）**SSOT 文档/registry 是否已编写或更新？** |
| 1 | **这件事是不是当前主线？** |
| 2 | **是不是 Production Blocker？** |
| 3 | **是不是违反 Freeze Discipline？** |
| 4 | **如果不是，现在应该进入哪个 Roadmap？** |

---

## 4 · 三问判定速查

### 4.1 是否阻断 Current Mainline？

**Current Mainline（2026-07-02）：**

```
PI3（PI3-001～006）→ Production Readiness → Mainnet → Production GO
```

**每次发布前置门禁（不阻断 PI3 推进，但 Production GO 前必 PASS）：**  
Display Data Governance → Business Manual UAT（见 [`TT-RELEASE-PIPELINE.md`](TT-RELEASE-PIPELINE.md)）

| 示例 | 阻断？ |
|------|--------|
| PI3-001 prod 备份缺失 | ✅ 是 |
| Mainnet 合约未部署 | ✅ 是 |
| Admin 按钮不好看 | ❌ 否 |
| CMS 少一个按钮 | ❌ 否 |
| Publish 控制台未做 | ❌ 否（Post-GO） |

### 4.2 是否属于当前主线？

| 工作 | 主线 # | 现在执行？ |
|------|--------|-----------|
| Fly PG backup | ① PI3 | ✅ |
| 域名 TLS | ① PI3 | ✅ |
| Stripe Live | ① PI3 | ✅ |
| Featured 控制台 | ⑤ Post-GO | ❌ |
| Admin IA 调整 | —（冻结） | ❌ |

### 4.3 是否符合 Freeze Discipline？

| 模块 | Freeze | 允许例外 |
|------|--------|----------|
| Admin Platform | STABLE_FINAL | Security · Incident · Critical Bug |
| Official Ops 1.0 | ARCHITECTURE FROZEN | 同上 · 不扩架构 |
| Content Center | STABLE | Post-GO 增强 |
| Public Operations | MVP FROZEN | STANDARD+ post GO |

---

## 5 · Current Mainline（唯一持续推进）

```
Production Infrastructure（PI3 · PI3-001～006）
        ↓
Production Readiness
        ↓
Mainnet
        ↓
Production GO
```

**每次 Production 发布固定前置（v1.0+ · v1.1+ · 未来版本）：**  
Product Capability Complete → **Display Data Governance** → **Business Manual UAT** → PI3 → Production GO  
见 [`TT-RELEASE-PIPELINE.md`](TT-RELEASE-PIPELINE.md) · `TT_RELEASE_PIPELINE: ENFORCED`

**主线之外：** 先判是否构成**当前阻断**；若不是 → **Roadmap**，不打断交付节奏。

---

## 6 · 项目状态最终评价（2026-07-01）

TravelTrust 已从**持续开发中的项目**，进入以交付为目标的 **Product Delivery** 阶段。

| 维度 | 裁定 |
|------|------|
| **Architecture** | **100% · PERMANENT_FROZEN** |
| **Governance** | **100% · LONG_TERM_ENFORCED** |
| **Feature** | **ROADMAP 演进** · 不影响架构稳定性 |
| **Current Mainline** | **PI3 → Production Readiness → Mainnet → Production GO** |

| 已冻结（不阻断 GO） | 唯一主战场 |
|--------------------|-----------|
| Admin Platform · 四大中心架构 | **PI3** |
| Official Ops · Content Center | **Mainnet** |
| Product Capability · DDG · Business UAT | **Production GO**（前置门禁已 PASS · 每次发布复跑） |
| Governance 栈（七原则 · 双轨 · 三问门） | — |
| Test Accounts / SSOT | — |

真源：[`TT-TRAVELTRUST-THREE-DIMENSION-STATUS-SSOT.md`](TT-TRAVELTRUST-THREE-DIMENSION-STATUS-SSOT.md) §0.1

---

## 7 · 治理层级（自上而下）

```
TT-DELIVERY-DECISION-POLICY     ← 本文件（三问裁决）
        │
        ▼
TT-PROGRAM-MAINLINE-DISCIPLINE  ← 五条主线 · 日报
        │
        ▼
TT-ADMIN-PLATFORM-GOVERNANCE    ← Admin ①～③
        │
        ▼
域 SSOT / Capability Matrix / Evidence
```

---

**TT_DELIVERY_DECISION_POLICY: ENFORCED**
