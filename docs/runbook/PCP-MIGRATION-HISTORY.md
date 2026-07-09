# PCP Migration History · 公开内容平台演进时间线

**Purpose:** 新人一分钟理解「为什么现在是这套架构」。  
**Parent:** [PCP-ARCHITECTURE-FINAL.md](PCP-ARCHITECTURE-FINAL.md) · [TT-PUBLIC-CONTENT-PLATFORM.md](TT-PUBLIC-CONTENT-PLATFORM.md)

---

## 时间线总览

```text
Market Governance (pre-PCP · DDG/OCS runtime)
        ↓
PCP Establishment (Architecture Freeze · SSOT v2)
        ↓
Phase 0 · Community FeedBuilder + governed_community_posts_v1
        ↓
Phase 0.5 · Architecture Validation (Publish/Unpublish · Surface · Builder purity)
        ↓
Phase 1 Batch 1 · MarketBuilder + governed_market_*
        ↓
Phase 1 Batch 2 · CampaignBuilder + governed_campaign_*
        ↓
Phase 1 Final Sign-off · 7/7 domains ALIGNED
        ↓
Phase 1 Freeze / Regression Window
        ↓
Architecture Closure · TT_PCP_ARCHITECTURE: FROZEN
        ↓
( next ) Production Readiness → Phase 2
```

---

## 阶段详情

### Pre-PCP · Market Governance（参考期）

| 项 | 说明 |
|----|------|
| 形态 | `display_status` · surface 过滤在 Rust (`chain_off/market_public_surface.rs`) |
| 问题 | Community / Campaign 各自路径；无统一 Governed View；难以审计 |
| 保留 | DDG · OCS · SOPCP · OCIP 行为 **不变** — 迁入 Builder 层 runtime，非 Governance SQL |

---

### PCP Establishment · 2026-07-04

| 项 | 说明 |
|----|------|
| 交付 | `registry/public-content-platform.v1.yaml` v2 · Architecture Constitution P1–P5 |
| 决策 | Market / Community / Campaign **统一** PCP Governance；禁止平行 fork |
| 机读键 | `TT_PUBLIC_CONTENT_PLATFORM: ESTABLISHED` · `TT_PCP_ARCHITECTURE_FREEZE: ENFORCED` |

---

### Phase 0 · Community（Engineering COMPLETE）

| Migration | View / Module |
|-----------|---------------|
| `20260704100000_governed_community_posts_v1.sql` | `governed_community_posts_v1` |
| Rust | `db/governed_community_posts.rs` · `pcp/feed_builder.rs` |
| API | `GET /api/v1/community/feed` · `GET /api/v1/community/posts/:id` |
| 机读键 | Phase 0 engineering COMPLETE |

---

### Phase 0.5 · Architecture Validation（COMPLETE）

| 验证 | 标准 |
|------|------|
| Publish / Unpublish | Admin → Feed + Detail 同步 |
| Surface OFF/ON | `community_feed` surface 与 governed view 一致 |
| Builder purity | FeedBuilder 无 display_status / surface 判断 |
| Staging | `tt-api-staging` + migration `20260704100000` |
| 机读键 | `TT_PCP_PHASE_0_5: COMPLETE` |

证据：`evidence/GO_public_content_platform/*/phase0.5-validation-chain.json`

---

### Phase 1 Batch 1 · Market 优先域（COMPLETE）

| Migration | Views |
|-----------|-------|
| `20260704110000_governed_market_catalog_v1.sql` | `governed_market_guides_v1` · `governed_market_listings_v1` · `governed_discover_orders_v1` |

| 域 | Builder |
|----|---------|
| Market · Provider · Acquisition · Official Guide | `pcp/market_builder.rs` · `db/market_catalog.rs` |

| Staging deploy | `deployment-01KWMGEA4MFCH99A7ARTW8FF6B` |
| 机读键 | `TT_PCP_PHASE_1_BATCH_1: COMPLETE` |

---

### Phase 1 Batch 2 · Campaign（COMPLETE）

| Migration | Views |
|-----------|-------|
| `20260704120000_governed_campaign_surfaces_v1.sql` | `governed_campaign_surfaces_v1` · `governed_campaign_items_v1` |

| 域 | Builder |
|----|---------|
| Campaign · cold-start surfaces | `pcp/campaign_builder.rs` · `db/campaign_catalog.rs` |

| Staging deploy | `deployment-01KWN3GE35Z29KP6XK8ANCHJ25` |
| 机读键 | `TT_PCP_PHASE_1_BATCH_2: COMPLETE` |

---

### Phase 1 Final Sign-off（COMPLETE）

| 指标 | 结果 |
|------|------|
| 全域对齐 | **7 / 7** domains ALIGNED |
| 子审计 | arch · pipeline · staging · enterprise **PASS** |
| 机读键 | `TT_PCP_PHASE_1: COMPLETE` · `TT_PCP_PHASE_1_FINAL_SIGNOFF: COMPLETE` |

证据：`evidence/GO_public_content_platform/20260703T231140Z/phase1-final-signoff.json`

---

### Phase 1 Freeze / Regression Window（COMPLETE）

| 项 | 说明 |
|----|------|
| 目的 | 冻结 Builder 扩展；全站回归；CI governed-view **预审** |
| 禁止 | SearchBuilder · RecommendationBuilder · 新 Governed migration（无 Phase 2 闸） |
| 机读键 | `TT_PCP_PHASE_1_FREEZE: COMPLETE` · `TT_PCP_PHASE_2: NOT_STARTED` |

证据：`evidence/GO_public_content_platform/20260703T231501Z/phase1-freeze-regression-signoff.json`

---

### Architecture Closure（当前里程碑）

| 项 | 说明 |
|----|------|
| 交付 | 四份终稿文档 + `TT_PCP_ARCHITECTURE: FROZEN` |
| 含义 | PCP 架构不再「迭代中」— 后续变更须 Review |
| 下一闸 | **Production Readiness**（独立）→ **Phase 2**（Owner 确认） |

---

## SQL Migration 索引（Governed Views）

| Migration | Views |
|-----------|-------|
| `20260704100000_governed_community_posts_v1.sql` | Community |
| `20260704110000_governed_market_catalog_v1.sql` | Market catalog |
| `20260704120000_governed_campaign_surfaces_v1.sql` | Campaign surfaces |

**规则：** 新增 Governed View = 新 migration 文件；禁止 in-place 改写已签收 view 语义而不 bump migration。

---

## 审计脚本索引

| 脚本 | 阶段 |
|------|------|
| `audit-pcp-architecture-compliance.cjs` | Phase 0.5+ |
| `validate-pcp-phase0-5-staging.cjs` | Phase 0.5 |
| `validate-pcp-phase1-market-batch-staging.cjs` | Batch 1 |
| `validate-pcp-phase1-campaign-batch-staging.cjs` | Batch 2 |
| `validate-pcp-phase1-final-signoff.cjs` | Phase 1 sign-off |
| `validate-pcp-phase1-freeze-regression.cjs` | Freeze window |
| `audit-pcp-governed-view-ci-enforcement-precheck.cjs` | CI 预审 |
| `validate-pcp-architecture-closure.cjs` | Architecture Closure |
| `audit-pcp-phase1-full-alignment.cjs` | 7/7 矩阵 |
