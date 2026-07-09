# PCP Platform Capability Matrix · 能力归属矩阵

**Purpose:** 新增任何公开内容功能时，先查表 — **放哪一层、谁拥有、禁止什么**。  
**Parent:** [PCP-ARCHITECTURE-FINAL.md](PCP-ARCHITECTURE-FINAL.md) · [registry/public-content-platform.v1.yaml](../../registry/public-content-platform.v1.yaml)

---

## 列定义

| 列 | 含义 |
|----|------|
| **Governance** | PCP 编辑/运营门闸 · SQL Governed View · Public Ops |
| **Engine** | Public Engine 框架 · registry · ranking · cache |
| **Builder** | 域插件 · 读 Governed View · 输出 Public DTO |
| **API** | HTTP 公众出口 |
| **Frontend** | UI 渲染 |

**图例：** **owns** = 唯一真源 · **consumes** = 只读消费 · **implements** = 在框架内实现 · **—** = 不介入

---

## 核心能力矩阵

| Capability | Governance | Engine | Builder | API | Frontend | Registry / Runbook |
|------------|------------|--------|---------|-----|----------|-------------------|
| **DDG** (Display Data Governance) | **owns** audit · data_origin policy | — | runtime filter (MarketBuilder) | consumes | consumes | `registry/display-data-governance.v1.yaml` |
| **OCS** (Official Cold Start dataset) | **owns** official tier bootstrap | — | item ref resolution (CampaignBuilder) | consumes | consumes | `registry/official-cold-start-dataset.v1.yaml` |
| **SOPCP** (Single Official Public Catalog Policy) | **owns** surface catalog policy | reads | implements surface keys | outputs | displays | `registry/single-official-public-catalog-policy.v1.yaml` |
| **OCIP** (Official Catalog Identity) | **owns** canonical identity | — | guide/account identity checks | consumes | consumes | `registry/official-catalog-identity-policy.v1.yaml` |
| **Lifecycle** (display_status) | **owns** publish/unpublish workflow | reads | — (SQL view) | outputs | displays | Public Ops MVP |
| **Surface** (display_surfaces) | **owns** assignment | reads | — (SQL view) | outputs | displays | Public Ops MVP |
| **Schedule** (display_start/end) | **owns** | reads | — (SQL view) | outputs | displays | Public Ops MVP |
| **Priority** (featured · display_priority) | **owns** | sorting hooks | sort helpers only | outputs | displays | Public Ops MVP |
| **Content Tier** | **owns** tier policy | reads | Feed tier mix (future) | outputs | displays | community `content_tier` |
| **Moderation** | adjacent gate (legal/safety) | — | — | precondition | — | Moderation Center |
| **Recommendation** | — | **owns** (future) | **implements** (Phase 2) | outputs | displays | deferred |
| **Search** | — | **owns** (future) | **implements** (Phase 2) | outputs | displays | deferred |
| **Audit / Approval** | **owns** | — | — | Admin write | Admin UI | Public Operations |
| **Public Ops Write** | **owns** Admin console | — | N/A (write path) | `/admin/official/public-operations/*` | `/admin/official/public-operations` | `public-operations-mvp.v1.yaml` |

---

## 内容域 × Builder 矩阵

| Content Domain | Governed View(s) | Builder | Public API (examples) | Frontend |
|----------------|------------------|---------|----------------------|----------|
| **Community** | `governed_community_posts_v1` | FeedBuilder | `/api/v1/community/feed` | `/community/*` |
| **Market** | `governed_market_*` | MarketBuilder | `/api/v1/discover/orders` · `/api/v1/guides` | `/market` |
| **Provider** | `governed_market_listings_v1` (variant=provider) | MarketBuilder | `/api/v1/market/provider/listings` | `/market/provider` |
| **Acquisition** | `governed_market_listings_v1` (variant=acquisition) | MarketBuilder | `/api/v1/market/acquisition/listings` | `/market/acquisition` |
| **Official Guide** | `governed_market_guides_v1` | MarketBuilder | `/api/v1/guides` | `/guides` |
| **Campaign** | `governed_campaign_surfaces_v1` | CampaignBuilder | `/api/v1/official/cold-start/surfaces/:surface` | home_hero · market_feed · community_feed embed |
| **Admin Public Content Center** | write to entity tables | — (Governance write) | Admin Public Ops | `/admin/official/public-operations` |

---

## 禁止模式（Architecture FROZEN 后）

| 禁止 | 原因 | 正确做法 |
|------|------|----------|
| 业务模块内 `WHERE display_status = 'published'` 作为公众读唯一路径 | 违反 P2 | Governed View + Builder |
| 新域 fork 独立 Governance 表/规则 | 违反 P4 | 扩展 Public Ops entity + Governed View |
| Public API 直读 `community_posts` / `market_listings` / `ops_cold_start_campaigns` | 违反 P2 | `db/*_catalog.rs` + Builder |
| Builder 内实现 publish/unpublish | 违反分层 | Admin Public Ops + SQL view |
| Frontend 写 display_* | 违反边界 | Admin 或 API 写路径 |
| 跳过 Moderation 直接 publish | 违反 P3 | Moderation → Operations 顺序 |

---

## 新增能力决策树

```text
新功能是否暴露给公众/匿名？
  NO  → Platform A 或 Admin 内部 — 不在 PCP Builder 范围
  YES → 是否新 content type / surface？
          YES → ① 查本矩阵归属 ② Governed View migration ③ Builder plugin ④ 验证链 evidence
          NO  → 现有 Builder 扩展 payload — 仍须 Architecture Review
```

**Phase 2 才开放：** Recommendation · Search · Video · Live · AI Feed — 均走 **新 Builder 行**，Governance 列 **不变**。

---

## 交叉引用

| 子能力 SSOT | 文档 |
|-------------|------|
| DDG | [TT-DISPLAY-DATA-GOVERNANCE.md](TT-DISPLAY-DATA-GOVERNANCE.md) |
| Public Ops | [TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md](TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md) |
| PCP Hub | [TT-PUBLIC-CONTENT-PLATFORM.md](TT-PUBLIC-CONTENT-PLATFORM.md) |
| 开发者接入 | [PCP-DEVELOPER-GUIDE.md](PCP-DEVELOPER-GUIDE.md) |
