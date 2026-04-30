# GO_95 · §7.4 · **DID：链上 ↔ `did-rank` · PostgreSQL 语义** · 2026-04-21

## 口径（SSOT）

- **[04-附录-did-rank对接说明.md](../../docs/spec/04-附录-did-rank对接说明.md)**：**`GET /api/v1/did-rank/travelers|guides|itineraries`**；**有 DB → PG 主路径**；**无 DB → `chain_off` 内存榜**；**`rank_basis`** 枚举与 **`sort`/`period`** 机读验收（**§2～§3**）；**`GET /meta` · `did_rank`**（**`guides_community_penalty_exclusion`** 与 **`routes/did_rank`** 同源，批 **686**）。
- **[14-合约-API-ABI-前后端对齐.md](../../docs/spec/14-合约-API-ABI-前后端对齐.md)**：**Registry** 与向导 **链上资格**（**`/staking`** **`StakingRegistryPanel`** 等）— **排行榜 HTTP** 仍以 **04 附录** 为 SSOT，**不**把 **`did-rank`** 误读为链上 `view` 单源。
- **[30-DID排行榜-页面规范.md](../../docs/spec/30-DID排行榜-页面规范.md)** / **[13-1](../../docs/spec/13-1-UI产品级SSOT与页面规范.md)**：**`/did-rank`** 产品面。

## 工程真值（PG ↔ chain_off ↔ `/meta` ↔ 前端）

| 主题 | 位置 |
|------|------|
| **HTTP 路由** | **`crates/api/src/routes/did_rank.rs`**（**`period`/`sort`**、**`rank_basis`**、**PG `list_*_did_rank`** ↔ **`chain_off`** 回退、**160** **`community_penalties`** 剔除） |
| **处罚 SQL 常量** | **`crates/api/src/db/community_penalties.rs`** **`AND_USER_NOT_EXCLUDED_FROM_DID_RANK_GUIDES`**（单测 **`did_rank_penalty_filter_tests`**） |
| **`GET /meta` 观测** | **`crates/api/src/routes/health_meta/meta_helpers.rs`** **`did_rank_guides_community_penalty_exclusion`**；**`routes/health_meta/tests.rs`** **`did_rank_*`** |
| **前端** | **`frontend/app/did-rank/page.tsx`**；**`frontend/lib/apiClient/didRank.ts`**；**`didRankUtils` / `didRankResponseNormalize`** |
| **限流白名单路径** | **`middleware/auth_pause_metrics/mod.rs`** **`/api/v1/did-rank/travelers|guides|itineraries`** |

## 命令结果（仓库根 / `frontend`）

```bash
cargo test -p traveltrust-api routes::did_rank::tests
```

- **结果**：**11 passed**（**`rank_basis`** 与 **smoke** 口径、**`chain_off` 处罚过滤**、**`itineraries` `tourist_id`/`traveler_id`** 等）。

```bash
cargo test -p traveltrust-api health_meta::tests::did_rank
```

- **结果**：**4 passed**（**`did_rank` meta 键序/747**、**`guides_community_penalty_exclusion`** 三态）。

```bash
cd frontend && npx vitest run didRank --reporter=dot
```

- **结果**：**7** files，**53** tests **passed**（**`apiClient/didRank.test.ts`**、**`didRankUtils`/`didRankResponseNormalize`**、**`components/did-rank/*`**）。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**（**04↔router↔`app/did-rank`**）。

## 边界

- **不**替代 **staging** **`check-55-quick-verify` / `smoke-api-public-routes`** 全量 **`rank_basis`** 对拍与 **`jq`** 归档。
- **不**替代 **链上 Registry 字节码** 浏览器终验 / **93** 域矩阵 / **04-附录 §3.1** **信誉聚合 Target** 全文审计。
