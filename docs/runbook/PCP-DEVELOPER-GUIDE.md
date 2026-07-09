# PCP Developer Guide · 公开内容开发指南

**Audience:** 后端 · 前端 · 全栈 — 在 **Architecture Closure 冻结** 后接入任何新公开内容能力。  
**First rule:** 第一件事 **不是** 写 SQL 或改业务表读路径 — 先对齐 **Builder Contract** 与 [PCP-PLATFORM-CAPABILITY-MATRIX.md](PCP-PLATFORM-CAPABILITY-MATRIX.md)。

**Architecture:** [PCP-ARCHITECTURE-FINAL.md](PCP-ARCHITECTURE-FINAL.md) · **History:** [PCP-MIGRATION-HISTORY.md](PCP-MIGRATION-HISTORY.md)

---

## 1. Builder Contract（写死）

```text
Input:  Governed Public View (SQL) + optional DDG/OCS runtime filters
Output: Public DTO (stable JSON shape for existing or new Public API)
Rules:
  - Builder MUST NOT duplicate Governance (display_status · surface · schedule in Rust)
  - Builder MUST NOT read raw business tables for public catalog when db_pool available
  - Public API MUST delegate to Builder / db catalog module
  - Frontend MUST consume Public API only
```

**参考实现：**

| Builder | File | Catalog |
|---------|------|---------|
| FeedBuilder | `crates/api/src/pcp/feed_builder.rs` | `db/community.rs` + `governed_community_posts_v1` |
| MarketBuilder | `crates/api/src/pcp/market_builder.rs` | `db/market_catalog.rs` |
| CampaignBuilder | `crates/api/src/pcp/campaign_builder.rs` | `db/campaign_catalog.rs` |

---

## 2. 新公开能力 checklist（Video · Live · AI Feed · Search · …）

### Step 0 · 架构评审（强制）

- [ ] 查 [Capability Matrix](PCP-PLATFORM-CAPABILITY-MATRIX.md) — 确认 Governance 不 fork
- [ ] Owner / Architecture Review 书面记录（Architecture FROZEN 后 **必须**）
- [ ] 确认不在 Phase 1 Freeze 禁止项（见 registry `TT_PCP_ARCHITECTURE: FROZEN`）

### Step 1 · Governance（SQL）

1. 新增 migration：`crates/api/migrations/YYYYMMDDHHMMSS_governed_<domain>_v1.sql`
2. 定义 `governed_*_v1` view — **只** 含 display lifecycle · surface · schedule
3. 添加 `db/governed_<domain>.rs` 常量
4. 添加 `db/<domain>_catalog.rs` — 所有公众读 SQL **只** 查 view

**不要** 在 view 里做 DDG email 启发式 — 放 Builder。

### Step 2 · Builder（Rust）

1. 新增 `crates/api/src/pcp/<name>_builder.rs`
2. `pub const BUILDER_ID` · `DOMAIN`
3. Re-export catalog reads + DDG helpers from `chain_off/*` if needed
4. 注册 `pcp/mod.rs`
5. **禁止** `display_status = 'published'` 字符串出现在 builder 文件

### Step 3 · Public API

1. Route handler 调用 `db::` catalog 或 `pcp::*_builder` re-export
2. 使用 `with_pg_transient_retry` 等与现有 official/market 路由一致
3. 匿名可读路由加入 architecture compliance 扫描

### Step 4 · Frontend

1. 新 hook 只调 Public API（见 `frontend/lib/coldStartCampaign/` 模式）
2. E2E contract test 引用 API path
3. 五主路由 UI 冻结规则仍适用 — 仅数据链

### Step 5 · 验证与 evidence

```bash
# 域 batch 验证（仿 market/campaign）
node scripts/dev/validate-pcp-phase1-<your-domain>-batch-staging.cjs

# 全矩阵不得回退
node scripts/dev/audit-pcp-phase1-full-alignment.cjs
node scripts/dev/validate-pcp-phase1-freeze-regression.cjs
```

- [ ] Staging migration applied on `tt-api-staging`
- [ ] evidence JSON under `evidence/GO_public_content_platform/<stamp>/`
- [ ] 更新 [PCP-MIGRATION-HISTORY.md](PCP-MIGRATION-HISTORY.md) 一行

---

## 3. 扩展现有 Builder（无新域）

| 场景 | 做法 |
|------|------|
| 新 surface ID | Governance：Public Ops surface 枚举 + governed view `display_surfaces` |
| 新 item type (Campaign) | `campaign_catalog.rs` `resolve_item` — OCS 规则不变 |
| 新 listing variant | `market_catalog.rs` `list_governed_market_listings_by_variant` |
| DDG 新 heuristic | **仅** `chain_off/market_public_surface.rs` — 不碰 SQL view |

---

## 4. Admin 写路径 vs 公众读路径

| 路径 | 层 | 示例 |
|------|-----|------|
| **Write** | Governance · Public Ops | `PATCH display_status` · deploy campaign |
| **Read (public)** | Governed View → Builder → API | `GET /community/feed` |

**禁止** 公众 API 写 display_*（除 authenticated 作者自己的 draft，且仍非 public catalog）。

---

## 5. 本地开发命令

```bash
# 架构合规
node scripts/dev/audit-pcp-architecture-compliance.cjs

# Phase 1 冻结回归（Architecture Closure 后每次 PCP _touch 建议跑）
node scripts/dev/validate-pcp-phase1-freeze-regression.cjs

# Architecture Closure 签收
node scripts/dev/validate-pcp-architecture-closure.cjs
```

Rust：

```bash
cargo check -p traveltrust-api
cargo test -p traveltrust-api  # 受影响模块
```

---

## 6. Phase 2 预留（当前禁止实现）

| Plugin | 状态 | 开门条件 |
|--------|------|----------|
| SearchBuilder | NOT_STARTED | Architecture Closure + Production Readiness + Owner Phase 2 |
| RecommendationBuilder | NOT_STARTED | 同上 |
| VideoBuilder / LiveBuilder / AIBuilder | 未规划 | 同上 + 新 Architecture Review |

**冻结期：** `TT_PCP_ARCHITECTURE: FROZEN` 期间不得合入上述 Builder 骨架。

---

## 7. 常见问题

**Q: 能否在 chain_off 内存 store 里 filter display_status？**  
A: 仅 **db_pool 不可用** 时的 chain_off 降级；PostgreSQL 路径 **必须** Governed View。

**Q: Campaign item 为何还查 `ops_official_accounts`？**  
A: OCS entity eligibility — Builder 层 ref resolution，不是 Campaign Governance fork。

**Q: 改 governed view 要几步？**  
A: 新 migration · Staging deploy · batch validation · migration history 一行 · 不得 silent edit 旧 migration。

---

## 8. 文档维护

变更 Builder Contract 或 Capability 归属时，**同批**更新：

1. [PCP-ARCHITECTURE-FINAL.md](PCP-ARCHITECTURE-FINAL.md)
2. [PCP-PLATFORM-CAPABILITY-MATRIX.md](PCP-PLATFORM-CAPABILITY-MATRIX.md)
3. [registry/public-content-platform.v1.yaml](../../registry/public-content-platform.v1.yaml)
4. 本指南相关章节

Architecture FROZEN 下，上述更新 = **Architecture Review** 事项，非普通 PR。
