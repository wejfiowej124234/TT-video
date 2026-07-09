# TT-OFFICIAL-OPS-ENTERPRISE-ROADMAP · 企业级运营能力路线图

**生效：** 2026-07-01  
**性质：** Product Delivery 阶段 · **Roadmap 登记** · **非**当前执行队列  
**架构 SSOT：** [`TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md`](TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md)  
**决策入口：** [`TT-DELIVERY-DECISION-POLICY.md`](TT-DELIVERY-DECISION-POLICY.md)  
**当前主轨：** PI3 → Production Readiness → Mainnet → Business UAT → Production GO

---

## 0 · 机读键

```text
TT_ADMIN_ARCHITECTURE_MODEL: FOUR_CENTERS
TT_ADMIN_FOUR_CENTERS: FROZEN
TT_ADMIN_GOVERNANCE_PRINCIPLES: EIGHT_PERMANENT
TT_OFFICIAL_OPS_ARCHITECTURE: STABLE
TT_PUBLIC_OPERATIONS_ARCHITECTURE: STABLE
TT_PUBLIC_OPERATIONS_MVP: COMPLETE
TT_PUBLIC_OPERATIONS_ENTERPRISE_OPS: DEFERRED
TT_OFFICIAL_OPS_1_1_SCOPE: FULL_ENTERPRISE_BACKOFFICE
TT_MUST_HAVE_VS_MUST_NOW: DISTINGUISHED
TT_ADMIN_ROUTING_DISCIPLINE: FIVE_STEP
TT_ADMIN_NO_NEW_ADMIN_MODULES: true
```

---

## 1 · Admin 终态：三大业务中心 + 平台中心

见 [`TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md`](TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md) §2。

**五步归属判断** — 都不是则 **禁止新增后台模块**，必须重新归类。

---

## 2 · 核心区分（必须具备 ≠ 必须现在做）

| 能力 | 企业级最终必须有 | 必须现在做（PI3 前） | 归属 |
|------|------------------|----------------------|------|
| 四大中心骨架 | ✅ | ✅ **Architecture Stable** | Admin |
| User Management 主体审核 | ✅ | ✅ | User Management |
| 企业运营后台全量 | ✅ | ❌ | Official Ops **1.1** |
| Content CMS 完整 | ✅ | ❌ | Content Center **1.1** |
| Platform Center 运维面 | ✅ | ✅ 槽位已有 | Platform Center |

---

## 3 · 准确表述

| ❌ 不准确 | ✅ 准确 |
|----------|--------|
| Public Operations 已完成 | **四大中心架构 Stable** |
| | **Public Operations MVP Complete** |
| | **企业运营后台 → Official Ops 1.1 一次补完整** |

---

## 4 · 演进顺序

```
① PI3 → ② Mainnet → ③ Business UAT → ④ Production GO
                                              ↓
                    ⑤ Official Ops 1.1（企业后台一次补完整 · 不分碎片化小版本）
```

---

## 5 · Official Ops 1.1 · 一次补完整

### Public Operations

Publish · Unpublish · Featured · Priority · Surface · Schedule · Statistics · Preview · Version History · Test Policy

### Campaign Center

Cold Start · Homepage · Market · Community · Festival · Holiday · Regional Campaign

### Content Center（同包补齐）

Landing Background · Media Assets · POI Images · Translation · SEO · Publish Queue

**机读：** `TT_OFFICIAL_OPS_1_1_SCOPE: FULL_ENTERPRISE_BACKOFFICE`

**交付清单（逐项 ☐）：** [`TT-OFFICIAL-OPS-1.1-DELIVERY-MANIFEST.md`](TT-OFFICIAL-OPS-1.1-DELIVERY-MANIFEST.md) · [`registry/official-ops-1.1-delivery-manifest.v1.yaml`](../../registry/official-ops-1.1-delivery-manifest.v1.yaml)

### 后续（非碎片化）

- Official Ops **Analytics** · 推荐池
- **2.0** Production Policy · 三环境硬化

---

## 6 · 与 Freeze / 主线的关系

| 问题 | 答案 |
|------|------|
| 现在做？ | **否** — 除非 PI3/Mainnet/UAT **阻断** |
| 何时做？ | **Production GO 后 · 1.1 一次补完整** |
| 改架构？ | **否** — 四中心 Stable |
| 新模块？ | **禁止** — 五步判断归入四中心 |

---

## 7 · 互指

| 文档 | 用途 |
|------|------|
| [`TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md`](TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md) | 四中心 · 五步判断 · 各中心边界 |
| [`TT-OFFICIAL-OPS-1.1-DELIVERY-MANIFEST.md`](TT-OFFICIAL-OPS-1.1-DELIVERY-MANIFEST.md) | **1.1 企业运营后台交付清单**（逐项 ☐） |
| [`TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md`](TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md) | Public Ops 设计 SSOT |
| [`TT-OFFICIAL-OPS-CAPABILITY-MATRIX.md`](TT-OFFICIAL-OPS-CAPABILITY-MATRIX.md) | 能力矩阵 |
| [`TT-PROGRAM-MAINLINE-DISCIPLINE.md`](TT-PROGRAM-MAINLINE-DISCIPLINE.md) | 主线纪律 |

**TT_OFFICIAL_OPS_ENTERPRISE_ROADMAP: ACTIVE**
