# PCP Architecture Final · TravelTrust Public Content Platform

**Status:** **FROZEN** · Architecture Closure  
**Machine key:** `TT_PCP_ARCHITECTURE: FROZEN`  
**Parent SSOT:** [TT-PUBLIC-CONTENT-PLATFORM.md](TT-PUBLIC-CONTENT-PLATFORM.md) · [registry/public-content-platform.v1.yaml](../../registry/public-content-platform.v1.yaml)

---

## 1. 唯一架构（写死）

TravelTrust 公开内容不再按「业务模块各自治理」演进。自 Phase 1 签收起，**唯一合法公开内容架构**为：

```text
TravelTrust
    ↓
PCP (Public Content Platform)
    ↓
Governance (display lifecycle · surface · schedule · tier · audit)
    ↓
Engine (framework · builder registry · ranking hooks · cache)
    ↓
Builder (domain plugin · Feed · Market · Campaign · …)
    ↓
Public API (sole HTTP exit · governed payload only)
    ↓
Frontend (render · routing · client state)
```

**标准数据链路（每一公开域必须可映射）：**

```text
Database → PCP Governance → Public Engine Builder → Public API → Frontend
```

任何新增公开能力（Video · Live · AI Feed · Search · Recommendation）**只能**在 Engine 层新增 Builder 插件，**不得**在业务模块内 fork 一套 Governance。

---

## 2. 架构宪法（FROZEN · 不可单方修改）

| ID | 原则 | 含义 |
|----|------|------|
| **P1** | Database is never Public | 存储 ≠ 展示；业务表不直接作为公众读面 |
| **P2** | Governed Views only | 公众 API 只消费 Governed View 或 Builder 输出 |
| **P3** | Moderation ≠ Governance | 法务/安全门闸与运营/编辑门闸独立 |
| **P4** | Governance owns capability | 能力归 PCP；业务模块消费能力，禁止平行实现 |
| **P5** | Builder required | 每一公开 surface 必须有 Builder 插件 |

违反 P2 / P4 / P5 的变更 **不得** 在 Architecture Closure 冻结后默许合入；须 Architecture Review + Owner 书面批准。

---

## 3. 两层平台（产品底座）

Architecture Closure 后，TravelTrust 产品底座分为两个稳定平台：

### Platform A · Trust & Settlement

| 域 | 能力 |
|----|------|
| Identity | 用户 · 会话 · 多身份 |
| Wallet | 链上/链下钱包 |
| Governance (on-chain) | 提案 · 质押 · 链上治理 |
| Settlement | Escrow · 支付 · 结算 |
| RBAC | Admin · Provider · 角色矩阵 |

### Platform B · PCP (Public Content)

| 域 | 能力 |
|----|------|
| Governance (editorial) | display_status · surface · schedule · tier · Public Ops |
| Builder | FeedBuilder · MarketBuilder · CampaignBuilder · (future plugins) |
| Public Content | Community · Market · Provider · Acquisition · Campaign · Guides |
| Evidence | 机读审计 · Staging 验证链 · alignment 矩阵 |

**边界：** Platform A 不承载「公众内容如何展示」决策；Platform B 不承载资金/身份/链上治理。交叉点（如 Admin Public Content Center 写 display_*）走 **Public Operations 写路径**，读路径仍经 Governed View。

---

## 4. 已冻结 Builder 插件（Phase 1 签收基线）

| Builder | Domain(s) | Governed View(s) | Module |
|---------|-----------|------------------|--------|
| **FeedBuilder** | Community | `governed_community_posts_v1` | `crates/api/src/pcp/feed_builder.rs` |
| **MarketBuilder** | Market · Provider · Acquisition · Official Guide | `governed_market_guides_v1` · `governed_market_listings_v1` · `governed_discover_orders_v1` | `crates/api/src/pcp/market_builder.rs` |
| **CampaignBuilder** | Campaign | `governed_campaign_surfaces_v1` · `governed_campaign_items_v1` | `crates/api/src/pcp/campaign_builder.rs` |

**DDG / OCS / SOPCP / OCIP：** 仍为 Governance 子能力（registry 真源），在 Builder 层做 **runtime 过滤**（如 `data_origin` · dev email · showcase_eligible），**不**在 Builder 内重复 SQL Governance 规则。

---

## 5. 七域对齐状态（Architecture Closure 基线）

| Domain | Builder | 7/7 layers |
|--------|---------|------------|
| Community | FeedBuilder | ALIGNED |
| Market | MarketBuilder | ALIGNED |
| Provider | MarketBuilder (variant) | ALIGNED |
| Acquisition | MarketBuilder (variant) | ALIGNED |
| Official Guide | MarketBuilder (guides) | ALIGNED |
| Campaign | CampaignBuilder | ALIGNED |
| Admin Public Content Center | Governance write console | ALIGNED |

证据：`evidence/GO_public_content_platform/*/phase1-freeze-regression-signoff.json`

---

## 6. 冻结后变更规则

| 变更类型 | 要求 |
|----------|------|
| 新 Builder 插件 | Architecture Review · Builder Contract · 新 Governed View migration · 验证链 evidence |
| 修改 Governance 规则 | PCP Owner Review · 不得破坏已签收 7/7 域 |
| 修改 Governed View 定义 | 新 migration ID · Staging 全链回归 · 禁止 silent drift |
| 修改 Builder Contract | 同步四份 Closure 文档 + registry |
| SearchBuilder / RecommendationBuilder | **Phase 2** — Architecture Closure 冻结期间 **禁止** |

**机读键：**

- `TT_PCP_ARCHITECTURE: FROZEN`
- `TT_PCP_PHASE_1: COMPLETE`
- `TT_PCP_PHASE_1_FREEZE: COMPLETE`
- `TT_PCP_PHASE_2: NOT_STARTED`

---

## 7. 相关文档（Architecture Closure 四件套）

| # | 文档 | 用途 |
|---|------|------|
| ① | **本文** | 唯一架构终稿 |
| ② | [PCP-MIGRATION-HISTORY.md](PCP-MIGRATION-HISTORY.md) | 演进时间线 |
| ③ | [PCP-PLATFORM-CAPABILITY-MATRIX.md](PCP-PLATFORM-CAPABILITY-MATRIX.md) | 能力归属矩阵 |
| ④ | [PCP-DEVELOPER-GUIDE.md](PCP-DEVELOPER-GUIDE.md) | 新功能接入 Builder Contract |

---

## 8. 程序节奏（Closure 之后）

```text
Phase 1 COMPLETE
    ↓
Architecture Closure  ← 当前：TT_PCP_ARCHITECTURE FROZEN
    ↓
Production Readiness  ← 全站生产就绪评审（独立闸）
    ↓
Phase 2               ← Owner 书面确认后：SearchBuilder · RecommendationBuilder · CI workflow
```

**禁止跳阶：** 不得用 Phase 2 功能开发代替 Architecture Closure 或 Production Readiness。
