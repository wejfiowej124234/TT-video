# TT-PUBLIC-CONTENT-PLATFORM · Public Content Platform（PCP）

**机读 SSOT：** [`registry/public-content-platform.v1.yaml`](../../registry/public-content-platform.v1.yaml) v2  
**平台状态（关卷 · 唯一口径）：** [PCP-PLATFORM-STATUS.md](PCP-PLATFORM-STATUS.md) · **`PCP · FROZEN · VERIFIED · ALIGNED · CLOSED`**  
**性质：** Platform B **已关卷** — 变更仅 [Architecture Review](PCP-ARCHITECTURE-REVIEW-GATE.md) · **非当前项目主线**

> **统一回答：** Community / Market / Campaign / Governance / Builder → **PCP FROZEN · VERIFIED · ALIGNED · CLOSED** — 见 [PCP-PLATFORM-STATUS.md](PCP-PLATFORM-STATUS.md)  
> **当前项目主线：** [Production Readiness Program](TT-PRODUCTION-READINESS-PROGRAM.md) → **Production GO**（不是 Builder）

**Architecture Closure 四件套：**

| 文档 | 用途 |
|------|------|
| [PCP-ARCHITECTURE-FINAL.md](PCP-ARCHITECTURE-FINAL.md) | 唯一架构终稿 |
| [PCP-MIGRATION-HISTORY.md](PCP-MIGRATION-HISTORY.md) | 演进时间线 |
| [PCP-PLATFORM-CAPABILITY-MATRIX.md](PCP-PLATFORM-CAPABILITY-MATRIX.md) | 能力归属矩阵 |
| [PCP-DEVELOPER-GUIDE.md](PCP-DEVELOPER-GUIDE.md) | Builder Contract 接入指南 |

---

## 标准表述

> **Market / Community / Campaign 都有数据治理，但不各自维护一套治理实现；它们统一使用 PCP 提供的 Governance 能力。**

**程序节奏（写死）：**

```text
Phase 1 COMPLETE
    ↓
Architecture Closure  ← TT_PCP_ARCHITECTURE: FROZEN（当前）
    ↓
Production Readiness
    ↓
Phase 2  （Owner 书面确认 · SearchBuilder / RecommendationBuilder）
```

```text
Database → PCP Governance → Public Engine Builder → Public API → Frontend
```

**长期运营：** 一套治理规则 · 一套后台 · 一套审计 · 一套发布/下架/排序/定时 — 多业务复用。

---

## 架构宪法（FROZEN）

| ID | 原则 |
|----|------|
| **P1** | **Database is never Public.** |
| **P2** | **All Public APIs consume Governed Views only.** 绕过 Governance = 违反 P2 |
| **P3** | **Moderation and Governance are independent.** |
| **P4** | **Governance owns capability; business modules consume capability.** |
| **P5** | **Every public surface must be built by a Builder.** |

---

## 能力矩阵（Capability Matrix）

| Capability | Governance | Engine | Builder | API | Frontend |
|------------|:------------:|:------:|:-------:|:---:|:--------:|
| DDG | ✅ 拥有 | — | — | 消费 | 消费 |
| OCS | ✅ 拥有 | — | — | 消费 | 消费 |
| SOPCP | ✅ 拥有 | — | — | 消费 | 消费 |
| OCIP | ✅ 拥有 | — | — | 消费 | 消费 |
| Lifecycle | ✅ 拥有 | 读取 | 实现 | 输出 | 展示 |
| Surface | ✅ 拥有 | 读取 | 实现 | 输出 | 展示 |
| Priority | ✅ 拥有 | 排序 | 实现 | 输出 | 展示 |
| Schedule | ✅ 拥有 | 读取 | 实现 | 输出 | 展示 |
| Content Tier | ✅ 拥有 | 读取 | 实现 | 输出 | 展示 |
| Recommendation | — | ✅ 拥有 | 实现 | 输出 | 展示 |
| Moderation | 并列 Gate | — | — | 前置条件 | — |

---

## Builder Contract（接口契约）

```text
Governed View  →  Builder  →  Public DTO
```

| Builder | Governed View | Public API | Phase 0 |
|---------|---------------|------------|---------|
| **FeedBuilder** | `governed_community_posts_v1` | `GET /api/v1/community/feed` | ✅ 已接线 |
| **MarketBuilder** | market governed paths | `/guides` · listings … | 参考实现 · **未改** |
| **CampaignBuilder** | campaign surfaces | cold-start surfaces | 部分 |

**FeedBuilder 实现路径：**

- Migration: `crates/api/migrations/20260704100000_governed_community_posts_v1.sql`
- Governed module: `crates/api/src/db/governed_community_posts.rs`
- PCP: `crates/api/src/pcp/feed_builder.rs`
- 新帖 `data_origin=production` → `display_status=published`（Governance 写入）

**纪律：** 新增 Video / Live / AI → 只加 Builder — **Engine 框架不改**。

---

## PCP Governance 组成

DDG + OCS + SOPCP + OCIP + Lifecycle + Surface + Priority + Schedule + Tier + Audit + Public Operations + Approval Workflow

---

## 已 CLOSED Gate — 未重开

DDG · OCS · SOPCP · OCIP · Market Runtime · Enterprise SSOT · Public Ops MVP — **均未重开**。

---

## Phase 0 Engineering（COMPLETE）

**范围：** 仅 Community · Market 保持 Reference Implementation

| 项 | 状态 |
|----|------|
| `governed_community_posts_v1` view | ✅ |
| Feed 查询改读 Governed View | ✅ |
| 公开详情 Governance 检查 | ✅ |
| `pcp/feed_builder` 模块 | ✅ |
| MarketBuilder | 未修改 |

**证据：** `evidence/GO_public_content_platform/20260704T013000Z/phase0-feedbuilder.json`

---

## Phase 0.5 Architecture Validation（**COMPLETE** · 2026-07-03）

**TT_PCP_PHASE_0_5: COMPLETE** — Staging 已部署 Phase 0 Community Governance；验证链与全链路审计均 PASS（Blocking gaps = 0）。

**Staging 部署：** `tt-api-staging:deployment-01KWMEFYZZQKPB641ZSM4X0KNP` · git `fea685b08156` · migration `20260704100000_governed_community_posts_v1.sql`

```bash
node scripts/dev/audit-pcp-full-pipeline-alignment.cjs
```

**固定顺序（不可跳过 Staging）：**

```text
① Local Architecture Validation  →  TT_PCP_ARCHITECTURE_COMPLIANCE  ✅
        ↓
② Staging Runtime Validation     →  Publish/Unpublish · Surface · Builder  ✅
        ↓
③ Evidence
        ↓
④ TT_PCP_PHASE_0_5 COMPLETE      →  20260703T170629Z
```

**证据：**
- `evidence/GO_public_content_platform/20260703T170629Z/phase0.5-validation-chain.json`
- `evidence/GO_public_content_platform/20260703T170644Z/PCP-FULL-PIPELINE-ALIGNMENT-REPORT.md`

**命令：**

```bash
# 完整验证链（推荐）
node scripts/dev/validate-pcp-phase0-5-staging.cjs

# 仅本地架构合规
node scripts/dev/audit-pcp-architecture-compliance.cjs
```

**Staging 四项运行态验证：**

| # | 场景 | 验收标准 |
|---|------|----------|
| 1 | **Publish / Unpublish 闭环** | Admin Unpublish → Feed 立即消失 → Detail 不可见 → Publish → 恢复 |
| 2 | **Surface 验证** | `community_feed` OFF → Feed/Detail 不可见 → ON → 恢复 |
| 3 | **Builder 纯度** | FeedBuilder 无 `display_status` / `surface` / `tier` 判断 |
| 4 | **Architecture Compliance** | `TT_PCP_ARCHITECTURE_COMPLIANCE` 全部 PASS |

**原则：** 平台能力以运行结果为准，不是文档或编译。**不要**在 Staging 未验证时 Sign-off。

---

## Phase 1 Architecture Alignment（**COMPLETE** · Final Sign-off）

---



---

## Architecture Closure（**COMPLETE** · 20260703T231905Z）

**机读键：** `TT_PCP_ARCHITECTURE: FROZEN` · `TT_PCP_ARCHITECTURE_CLOSURE: COMPLETE`

**程序节奏：**

```text
Phase 1 COMPLETE → Architecture Closure (FROZEN) → Production Readiness → Phase 2 (Owner gate)
```

**四份终稿（Architecture Closure 四件套）：**

| # | 文档 |
|---|------|
| ① | [PCP-ARCHITECTURE-FINAL.md](PCP-ARCHITECTURE-FINAL.md) |
| ② | [PCP-MIGRATION-HISTORY.md](PCP-MIGRATION-HISTORY.md) |
| ③ | [PCP-PLATFORM-CAPABILITY-MATRIX.md](PCP-PLATFORM-CAPABILITY-MATRIX.md) |
| ④ | [PCP-DEVELOPER-GUIDE.md](PCP-DEVELOPER-GUIDE.md) |

**冻结后变更：** 任何 Builder · Governance · Capability 修改 → **Architecture Review**（禁止 silent drift）。

**Phase 2：** `NOT_STARTED` — Owner 书面确认后方可启动 SearchBuilder / RecommendationBuilder。

**签收命令：** `node scripts/dev/validate-pcp-architecture-closure.cjs`

**真实性审计（Phase ①/② · 只读 · 不改架构）：** `node scripts/dev/audit-pcp-authenticity-phase12-final.cjs` → `evidence/GO_public_content_platform/<stamp>/PCP-PHASE12-ALIGNMENT-FINAL-REPORT.md`

## Phase 1 Freeze / Regression Window（**COMPLETE** · 20260703T231501Z）

**签收：** `TT_PCP_PHASE_1_FREEZE: COMPLETE` · 7/7 ALIGNED 本地 + Staging 无漂移 · `TT_PCP_PHASE_2: NOT_STARTED`

**目的：** Phase 1 工程已 COMPLETE — 在开启 Phase 2 前，冻结 Builder 面扩展，执行全站回归 + CI governed-view 预审，确认 7/7 ALIGNED 在本地与 Staging 无漂移。

**冻结范围（写死）：** 禁止新增 `SearchBuilder` · `RecommendationBuilder` · 新 Governed View migration · 新 Public Builder plugin，直至 `TT_PCP_PHASE_1_FREEZE: COMPLETE`。

**命令：**

```bash
node scripts/dev/validate-pcp-phase1-freeze-regression.cjs
node scripts/dev/audit-pcp-governed-view-ci-enforcement-precheck.cjs
```

**Phase 2 开门条件：** `TT_PCP_PHASE_1_FREEZE: COMPLETE` + Owner 书面确认 Phase 2 范围。



**目标：** 以 PCP 为唯一公开内容治理架构，逐域对齐 Governance → Builder → Public API → Frontend → Registry → Runbook → Evidence，消除 REFERENCE_IMPL · PARTIAL · OLD_READ_PATH。

**标准链路：** Database → PCP Governance → MarketBuilder → Public API → Frontend

**Batch 1 范围（Market 优先域）：** Market · Provider · Acquisition · Official Guide — 共享 `governed_market_*` 视图与 `pcp/market_builder.rs`。**CampaignBuilder 待 Batch 1 Staging 审计 PASS 后启动。**

**命令：**

```bash
node scripts/dev/validate-pcp-phase1-market-batch-staging.cjs
node scripts/dev/audit-pcp-phase1-full-alignment.cjs
node scripts/dev/validate-pcp-phase0-5-staging.cjs   # Community 回归
```

**Batch 1 工程交付：**

| 组件 | 路径 |
|------|------|
| Governed Views | `20260704110000_governed_market_catalog_v1.sql` → `governed_market_guides_v1` · `governed_market_listings_v1` · `governed_discover_orders_v1` |
| MarketBuilder | `crates/api/src/pcp/market_builder.rs` |
| DB read path | `crates/api/src/db/market_catalog.rs` |
| DDG（不变） | `chain_off/market_public_surface.rs` — `data_origin` · dev email · display_origin |
| Provider / Acquisition | 同一 MarketBuilder — `list_governed_market_listings_by_variant`（variant=provider\|acquisition） |
| Official Guide | `governed_market_guides_v1` + OCS tier — `GET /api/v1/guides` |

**当前基线：** Phase 1 **COMPLETE** · 7/7 domains ALIGNED · `TT_PCP_PHASE_1: COMPLETE`

**Phase 1 后续（Phase 2 范围，非 Phase 1）：**

1. SearchBuilder / RecommendationBuilder
2. Public APIs governed-views-only CI enforcement
3. audit_log_v1

**Batch 2 范围（Campaign）：** `governed_campaign_surfaces_v1` · `governed_campaign_items_v1` · `pcp/campaign_builder.rs` — `GET /official/cold-start/surfaces/*`

**Batch 2 工程交付：**

| 组件 | 路径 |
|------|------|
| Governed Views | `20260704120000_governed_campaign_surfaces_v1.sql` |
| CampaignBuilder | `crates/api/src/pcp/campaign_builder.rs` |
| DB read path | `crates/api/src/db/campaign_catalog.rs` |
| Consumer delegate | `ops_cold_start_campaigns_consumer.rs` → governed catalog |
| OCS entity refs | unchanged resolve rules (accounts · templates · guides · orders · listings · posts) |

**Final Sign-off 命令（7/7 ALIGNED 后）：**

```bash
node scripts/dev/validate-pcp-phase1-final-signoff.cjs
```

**Phase 1 Final Sign-off（20260703T231140Z）：** `TT_PCP_PHASE_1: COMPLETE` · **7/7 domains ALIGNED**

| 指标 | 结果 |
|------|------|
| Batch 2 域 | Campaign — **7/7 ALIGNED** |
| Phase 1 全域 | **7 / 7** |
| Staging 部署 | `tt-api-staging:deployment-01KWN3GE35Z29KP6XK8ANCHJ25` |
| Migration | `20260704120000_governed_campaign_surfaces_v1.sql` |
| Final evidence | `evidence/GO_public_content_platform/20260703T231140Z/phase1-final-signoff.json` |

**Batch 1 签收（20260703T173627Z）：** `TT_PCP_PHASE_1_BATCH_1: COMPLETE`

| 指标 | 结果 |
|------|------|
| Batch 1 域 | Market · Provider · Acquisition · Official Guide — **7/7 ALIGNED** |
| Staging 部署 | `tt-api-staging:deployment-01KWMGEA4MFCH99A7ARTW8FF6B` |
| Migration | `20260704110000_governed_market_catalog_v1.sql` |
| Community 回归 | Phase 0.5 **16/16 PASS** |

**证据：**
- `evidence/GO_public_content_platform/20260703T173627Z/phase1-market-batch-validation-chain.json`
- `evidence/GO_public_content_platform/20260703T174738Z/PCP-PHASE1-FULL-ALIGNMENT-REPORT.md`

---

## 下一步（PCP 已冻结 · 主线已切换）

**PCP 不再作为日常开发主线。** 变更 Governance / Builder / Capability / Public API Pipeline / Public Content Center → 仅 [PCP-ARCHITECTURE-REVIEW-GATE.md](PCP-ARCHITECTURE-REVIEW-GATE.md)（Review → Approve → Implementation）。

**当前项目主线：**

```text
Architecture Closure (FROZEN)
    ↓
Production Readiness Program   ← ACTIVE
    ↓
Production GO
    ↓
Mainnet / Public Launch
```

**入口：** [TT-PRODUCTION-READINESS-PROGRAM.md](TT-PRODUCTION-READINESS-PROGRAM.md) · 机读 [`registry/production-readiness-program.v1.yaml`](../../registry/production-readiness-program.v1.yaml)

**本阶段不做：** Phase 2 Builder · SearchBuilder · RecommendationBuilder · 无 Approve 的 PCP 架构改动。

---

## 相关 SSOT

| 文档 | 关系 |
|------|------|
| [`TT-DISPLAY-DATA-GOVERNANCE.md`](TT-DISPLAY-DATA-GOVERNANCE.md) | PCP Governance · DDG |
| [`TT-OFFICIAL-COLD-START-DATASET.md`](TT-OFFICIAL-COLD-START-DATASET.md) | Official Tier Bootstrap |
| [`TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md`](TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md) | Operations Gate |

**机读键：** `TT_PUBLIC_CONTENT_PLATFORM: ESTABLISHED` · `TT_PCP_ARCHITECTURE_FREEZE: ENFORCED`
