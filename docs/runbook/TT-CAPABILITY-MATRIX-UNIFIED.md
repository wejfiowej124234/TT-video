# TravelTrust · Unified Capability Matrix

**Version:** 1.0.0 · **生效：** 2026-07-01  
**模板：** **Architecture · Feature Level · Production**（全项目统一语言）  
**机读：** [`registry/traveltrust-three-dimension-status.v1.yaml`](../../registry/traveltrust-three-dimension-status.v1.yaml)

> **纪律：** 禁止混用 Phase 2 / Sprint 4 / Roadmap 作为**状态汇报**口径。路线图细节见各域 SSOT；**本表只报三列。**

---

## 0 · 机读键

```text
TT_CAPABILITY_MATRIX_UNIFIED: ACTIVE
TT_CAPABILITY_MATRIX_TEMPLATE: architecture,feature_level,production
TT_FEATURE_LEVELS: MVP,STANDARD,ADVANCED,ENTERPRISE,COMPLETE
TT_ACTIVE_PROGRAM: PHASE3_PRODUCTION_READINESS
TT_DELIVERY_DECISION_POLICY: ENFORCED
TT_PROGRAM_MAINLINE_DISCIPLINE: ENFORCED
TT_PROJECT_PHASE: PRODUCT_DELIVERY
TT_PROGRAM_MAINLINE: PI3,PRODUCTION_READINESS,MAINNET,BUSINESS_UAT,PRODUCTION_GO
TT_ADMIN_PLATFORM_STATUS: STABLE_FINAL
TT_ADMIN_PLATFORM_OWNER: CLOSED
TT_ADMIN_ENTERPRISE_CAPABILITY_COMPLETE: true
TT_ADMIN_CAPABILITY_LEVEL: ENTERPRISE_COMPLETE
TT_PHASE2_ADMIN_FINAL_VALIDATION: GO
TT_ADMIN_PLATFORM_DEV_VALIDATION: CLOSED
TT_ENTERPRISE_CAPABILITY_AUDIT_VERSION: 2.1.0
TT_PAGE_CAPABILITY: COMPLETE
TT_ENTITY_CAPABILITY: COMPLETE
TT_WEB3_CAPABILITY: COMPLETE_SEPOLIA
TT_PRODUCTION_INFRASTRUCTURE: IN_PROGRESS
TT_BUSINESS_FLOW_CAPABILITY: COMPLETE
TT_OPERATIONAL_CAPABILITY: COMPLETE
TT_EVIDENCE_COMPLETENESS: PARTIAL
TT_PRODUCT_CAPABILITY: ENTERPRISE_COMPLETE
TT_PRODUCTION_CAPABILITY: IN_PROGRESS
TT_RELEASE_DECISION: NO_GO
TT_ENTERPRISE_CAPABILITY_AUDIT: ACTIVE
```

---

## 1 · 统一矩阵（项目级）

| Module | Architecture | Feature Level | Production |
|--------|--------------|---------------|------------|
| **Admin Platform** | Stable Final | **Enterprise Complete** | Ready |
| **Content Center** | Stable | Complete | Ready |
| **Official Ops** | Stable | **Enterprise Complete** | Ready |
| **Public Operations** | Stable | **Complete** (MVP scope) | Ready |
| **Market** | Stable | Standard | Ready |
| **Community** | Stable | Standard | Ready |
| **Governance** | Stable | Advanced | Ready |
| **Production Infrastructure** | Stable | — | IN_PROGRESS |
| **Mainnet** | — | — | PENDING |

### 列定义

| 列 | 合法值 | 含义 |
|----|--------|------|
| **Architecture** | `Stable` · `Frozen` | 结构/IA/域边界已冻结 |
| **Feature Level** | `MVP` · `STANDARD` · `ADVANCED` · `ENTERPRISE` · `Complete` | 当前可交付功能档位（**非**缺陷） |
| **Production** | `Ready` · `IN_PROGRESS` · `PENDING` | 上线就绪度（Admin 子模块 Ready **≠** 全站 GO） |

**Feature Level 读法：**

| Level | 典型含义 |
|-------|----------|
| **MVP** | 约定范围闭合 · 足够上线验证 |
| **Standard** | 核心用户旅程完整 · 运营效率达标 |
| **Advanced** | 复杂编排/治理/多角色闭环 |
| **Enterprise** | 策略硬化 · 合规 · 三环境固化 |
| **Complete** | 域内企业可用闭环（如 Content Center 92%+） |

**子模块注记：** Public Operations 为 Official Ops 子模块 · **Admin 40/40 约定范围 COMPLETE**（Statistics · Publish · Featured · Priority · Surface · Schedule · Preview · History · Test Policy · Campaign 六类）· 全愿景 ~40% 属 **STANDARD+ Roadmap** · `ROADMAP_NOT_DEFECT`。

---

## 2 · 域 SSOT 互指

| Module | 深度矩阵 / SSOT |
|--------|----------------|
| Admin Platform | [`TT-ADMIN-PLATFORM-CLOSURE-20260702.md`](TT-ADMIN-PLATFORM-CLOSURE-20260702.md) · [`TT-ADMIN-PLATFORM-FINAL-CONVERGENCE-20260701.md`](TT-ADMIN-PLATFORM-FINAL-CONVERGENCE-20260701.md) |
| Content Center | [`101-CMS与内容运营中心实施蓝图.md`](../handbook/engineering/101-CMS与内容运营中心实施蓝图.md) |
| Official Ops | [`TT-OFFICIAL-OPS-CAPABILITY-MATRIX.md`](TT-OFFICIAL-OPS-CAPABILITY-MATRIX.md) |
| Public Operations | [`TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md`](TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md) |
| Market | [`frontend/app/market/README.md`](../../frontend/app/market/README.md) · 104 §1.8 |
| Community | [`160`](../spec/160-社区系统开发文档.md) · C8 staging GO |
| Governance | [`04 §3.4`](../spec/04-后端与API.md) · Token 治理轨 |
| Production | [`PHASE3-PRODUCTION-PREPARATION.md`](PHASE3-PRODUCTION-PREPARATION.md) · PI3-001～006 |
| **Enterprise Capability Audit** | [`TT-ENTERPRISE-CAPABILITY-AUDIT-20260702.md`](TT-ENTERPRISE-CAPABILITY-AUDIT-20260702.md) |
| Mainnet | [`TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md`](TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md) |

---

## 3 · Current Mainline（项目汇报唯一句式）

**纪律 ①③：** 后台 **不得** 出现在主线汇报。每次汇报只报：

```text
Current Mainline

PI3 → Production Readiness → Mainnet → Business Manual UAT → Production GO
```

**纪律 ②：** `PHASE3_PRODUCTION_GO: NO_GO` 时检查顺序 — PI3 → Mainnet → Business Manual UAT → Go-Live Checklist · **禁止** 归因 Admin。

## 3.1 · 项目主线（保持至 Production GO）

**后台不是当前重点。** 合法工程顺序：

```
Production Infrastructure（PI3）
        │
        ▼
Production Readiness
        │
        ▼
Mainnet
        │
        ▼
Business Manual UAT
        │
        ▼
Production GO
        │
        ▼
Official Ops 1.1 · Feature Level STANDARD
```

| 阶段 | 机读 | 状态 |
|------|------|------|
| PI3 | `PHASE3_PRODUCTION_PREP: ACTIVE` | 🟡 IN_PROGRESS |
| Production Readiness | `TT_PHASE3_CONVERGENCE_GATE: PASS` | Staging 可闭项已 PASS |
| Mainnet | `PI3-005` | ⏳ PENDING |
| Business Manual UAT | — | ⏳ PENDING |
| Production GO | `PHASE3_PRODUCTION_GO: NO_GO` | ⏳ PENDING |
| Official Ops 1.1 | `TT_PUBLIC_DISPLAY_FEATURE_LEVEL_NEXT: STANDARD` | post GO |

---

## 4 · 命名迁移（全项目）

| 禁止（状态汇报） | 改用 |
|------------------|------|
| 「Phase 2 完成没」 | Architecture **Stable** + Feature Level **MVP/Standard/…** |
| Sprint N | **Active Program** + 主线阶段 |
| Roadmap % 当缺陷 | Feature Level + `ROADMAP_NOT_DEFECT` |
| 各模块自造阶段名 | **本表三列** |

**TT_CAPABILITY_MATRIX_UNIFIED: ACTIVE**


## 5 · 交付决策最高裁决

[`TT-DELIVERY-DECISION-POLICY.md`](TT-DELIVERY-DECISION-POLICY.md) · 三问门 · 四问评审

## 5.1 · 最高治理原则

[`TT-PROGRAM-MAINLINE-DISCIPLINE.md`](TT-PROGRAM-MAINLINE-DISCIPLINE.md) · 统一日报 §4 · **禁止跨主线开发**
