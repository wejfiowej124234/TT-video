# TT-ADMIN-THREE-CENTERS-ARCHITECTURE · Admin 四大中心架构 SSOT

**（三大业务中心 + 平台中心 · 永久冻结）**

**生效：** 2026-07-01  
**性质：** **Architecture SSOT · PERMANENT_FROZEN**  
**机读：** [`registry/admin-four-centers-governance.v1.yaml`](../../registry/admin-four-centers-governance.v1.yaml)  
**决策入口：** [`TT-DELIVERY-DECISION-POLICY.md`](TT-DELIVERY-DECISION-POLICY.md) · **§3 五步归属判断**  
**路线图：** [`TT-OFFICIAL-OPS-ENTERPRISE-ROADMAP.md`](TT-OFFICIAL-OPS-ENTERPRISE-ROADMAP.md)

> **文件名说明：** 历史文件名保留 `THREE-CENTERS`；机读模型为 **`FOUR_CENTERS`**（3 业务 + 1 平台）。

---

## 0 · 机读键

```text
TT_ADMIN_FOUR_CENTERS: FROZEN
TT_ADMIN_ARCHITECTURE_MODEL: FOUR_CENTERS
TT_ADMIN_GOVERNANCE_PRINCIPLES: EIGHT_PERMANENT
TT_ADMIN_GOVERNANCE_CLOSED_LOOP: true
TT_DEVELOPMENT_WORK_TYPES: BUG,FEATURE
TT_FEATURE_CLASSIFICATION_REQUIRED: true
TT_FEATURE_SSOT_REQUIRED: true
TT_ADMIN_BUSINESS_CENTERS: USER_MANAGEMENT,CONTENT_CENTER,OFFICIAL_OPS
TT_ADMIN_PLATFORM_CENTER: PLATFORM_CENTER
TT_ADMIN_CENTERS_TOTAL: 4
TT_ADMIN_ROUTING_DISCIPLINE: FIVE_STEP
TT_ADMIN_NO_NEW_ADMIN_MODULES: true
TT_ADMIN_PLATFORM_STATUS: STABLE_FINAL
TT_ADMIN_DEV_ENTRY: FUNCTIONAL_AUDIT_ONLY
TT_ADMIN_DEV_NOT_FROM: CHECKLIST,INSPIRATION
```

**开发入口：** 永远从 [`TT-ADMIN-FUNCTIONAL-USABILITY-AUDIT`](TT-ADMIN-FUNCTIONAL-USABILITY-AUDIT-20260701.md) 开始 — **不**从 Checklist · **不**从灵感。补功能 **不改** 四大中心架构。

---

## A · 八条治理原则（永久冻结 · 治理闭环）

**机读登记：** [`registry/admin-four-centers-governance.v1.yaml`](../../registry/admin-four-centers-governance.v1.yaml)  
**开发入口：** [`TT-DELIVERY-DECISION-POLICY.md`](TT-DELIVERY-DECISION-POLICY.md) §1

| 原则 | 摘要 | 状态 |
|------|------|------|
| **P1** | 四中心唯一 | ✅ |
| **P2** | 一个功能一个中心 | ✅ |
| **P3** | 一个实体一个 Owner | ✅ |
| **P4** | Platform 不做业务 | ✅ |
| **P5** | Official Ops 不做内容 | ✅ |
| **P6** | Feature Level 独立于 Architecture | ✅ |
| **P7** | Feature 必须先归类 | ✅ |
| **P8** | **Feature 必须先有 SSOT** | ✅ |

### P1～P6（摘要）

见上表；详述见 [`registry/admin-four-centers-governance.v1.yaml`](../../registry/admin-four-centers-governance.v1.yaml)。

**P6 汇报格式：**

| Module | Architecture | Feature Level | Production |
|--------|--------------|---------------|------------|

**禁止：** 「Phase 2 完成了吗？」

### P7 · Feature 必须先归类

中心 → 模块 → Feature Level。**未经归类不得实现。**

### P8 · Feature 必须先有 SSOT

任何新功能，在开发之前 **必须先确定 SSOT（Single Source of Truth）**；**未经 SSOT 定义，不得进入开发。**

**避免：**

- 功能做完才补文档
- 两份文档描述不同
- AI 按旧文档开发
- 多个实现版本并存

与 **SSOT 驱动开发** 一致。

---

## B · 后续开发纪律（Bug / Feature 双轨）

| 类型 | 子类 | 处理 |
|------|------|------|
| **Bug** | BUG · Security · Incident · Production Hotfix | **直接修复** → Evidence |
| **Feature** | 一切新能力 | **归类 → SSOT → Gate → 开发** |

### Feature 归类三问

| 问题 | Featured | 背景图上传 | Feature Flag |
|------|----------|------------|--------------|
| **中心** | Official Ops | Content Center | Platform Center |
| **模块** | Public Operations | Landing | Feature Flags |
| **Feature Level** | STANDARD | STANDARD | STANDARD |

---

## C · 唯一合法路径（治理闭环）

以后任何需求 **只有这一条合法路径**：

```
需求
    │
    ▼
Bug？
│
├──── 是 → 修复 → Evidence
│
└──── Feature
          │
          ▼
      四中心
          │
          ▼
        模块
          │
          ▼
    Feature Level
          │
          ▼
         SSOT          ← P8：编写/更新 SSOT
          │
          ▼
    Delivery Gate      ← 三问门
          │
          ▼
        开发
          │
          ▼
      Evidence
          │
          ▼
        Freeze
```

**机读：** `TT_ADMIN_GOVERNANCE_CLOSED_LOOP: true`

---

## 1 · 四大中心终态树（冻结）

```
TravelTrust Admin
│
├── User Management（业务管理）
│   ├── Users
│   ├── Guides
│   ├── Merchants
│   ├── Providers
│   ├── DID
│   ├── KYB
│   ├── RBAC
│   └── Audit
│
├── Content Center（内容中心）
│   ├── Country
│   ├── City
│   ├── POI
│   ├── POI Images
│   ├── Landing
│   ├── Media Assets
│   ├── Catalog
│   ├── Translation
│   ├── SEO
│   └── Publish Queue
│
├── Official Ops（运营中心）
│   ├── Public Operations
│   ├── Campaign Center
│   ├── Official Guides
│   ├── Official Accounts
│   ├── Templates
│   └── Analytics（后续）
│
└── Platform Center（平台中心）
    ├── Feature Flags
    ├── Environment
    ├── Jobs
    ├── Queue
    ├── Monitoring
    ├── Logs
    ├── Audit Logs
    ├── Backup
    └── System Config
```

| 中心 | 路由域（今日） | Architecture |
|------|----------------|--------------|
| **User Management** | `/admin/users` · onboarding · RBAC | ✅ **FROZEN** |
| **Content Center** | `/admin/content` | ✅ **FROZEN** |
| **Official Ops** | `/admin/official-ops` · campaign | ✅ **FROZEN** |
| **Platform Center** | `/admin/platform` · system · jobs | ✅ **FROZEN** |

**纪律：** 后续只在槽位 **填 Feature** — **不改** 四大中心骨架。

---

## 2 · 五步归属判断

| 步骤 | 问题 | 归属 |
|------|------|------|
| **1** | 业务对象？ | User Management |
| **2** | 内容资产？ | Content Center |
| **3** | 运营展示？ | Official Ops |
| **4** | 平台配置 / 系统运维？ | Platform Center |
| **5** | 都不是？ | **禁止新增后台模块 — 重新归类** |

叠加 [`TT-DELIVERY-DECISION-POLICY.md`](TT-DELIVERY-DECISION-POLICY.md) 三问门：先判主线，再判中心。

---

## 3 · Official Ops 1.1（Post-GO · 一次补完整）

| 平面 | 1.1 范围 |
|------|----------|
| **Public Operations** | Publish · Unpublish · Featured · Priority · Surface · Schedule · Statistics · Preview · Version History · Test Policy |
| **Campaign Center** | Cold Start · Homepage · Market · Community · Festival · Holiday · Regional |
| **Content Center** | Landing · Media · POI Images · Translation · SEO · Publish Queue |

**机读：** `TT_OFFICIAL_OPS_1_1_SCOPE: FULL_ENTERPRISE_BACKOFFICE`

**当前主轨：** PI3 → Mainnet → Business UAT → Production GO → **1.1**

---

## 4 · 准确表述

| ❌ 不说 | ✅ 说 |
|--------|------|
| Phase 2 完成了吗 | **Architecture / Feature / Production 三维** |
| Public Operations 已完成 | **架构 FROZEN · MVP Complete · Feature → 1.1** |
| 新建第五个中心 | **六条原则 · 五步判断 · 归入四中心** |

---

## 5 · 互指

| 文档 | 用途 |
|------|------|
| [`TT-OFFICIAL-OPS-ENTERPRISE-ROADMAP.md`](TT-OFFICIAL-OPS-ENTERPRISE-ROADMAP.md) | Post-GO 1.1 范围 |
| [`TT-ADMIN-PLATFORM-GOVERNANCE-DISCIPLINE.md`](TT-ADMIN-PLATFORM-GOVERNANCE-DISCIPLINE.md) | STABLE_FINAL · Freeze |
| [`TT-TRAVELTRUST-THREE-DIMENSION-STATUS-SSOT.md`](TT-TRAVELTRUST-THREE-DIMENSION-STATUS-SSOT.md) | 原则 ⑥ 三维汇报 |
| [`TT-CAPABILITY-MATRIX-UNIFIED.md`](TT-CAPABILITY-MATRIX-UNIFIED.md) | 统一三列表模板 |

**TT_ADMIN_FOUR_CENTERS_ARCHITECTURE: PERMANENT_FROZEN**
