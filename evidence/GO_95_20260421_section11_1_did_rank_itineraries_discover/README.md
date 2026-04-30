# GO_95 · §11.1 · **`did-rank/itineraries`** + **`discover/orders`** 卫星闭证 · 2026-04-21

## 口径

- **§11.1**：卫星能力在并入 **§3/§8.2** 前单独跟踪；本包仅证明 **HTTP 契约 + 机读测** 已对齐 **04**/**路由门禁**，**不**替代 **93**/**staging**/**§8.2** 增行（本条 **不**强制新增 **F-033**）。
- **DID · itineraries**：**[04-附录-did-rank对接说明.md](../../docs/spec/04-附录-did-rank对接说明.md)** **`GET /api/v1/did-rank/itineraries`**；**§7.1 域 K** 已声明 **`/did-rank` 页内未调用** `itineraries`（与 **30** 一致）。
- **Discover**：**[04-后端与API.md](../../docs/spec/04-后端与API.md)** **`GET /api/v1/discover/orders`**；**§7.1 域 N** 证据包 **`…section7_1_domain_n/`**。

## 工程真值

| 主题 | 位置 |
|------|------|
| **`did-rank/itineraries`** | **`crates/api/src/routes/did_rank.rs`** **`get_did_rank_itineraries`**（**PG** **`list_itineraries_did_rank_*`** ↔ **`chain_off`** **`rank_basis`** 回退）；**`routes::did_rank::tests::did_rank_itineraries_chain_off_completed_mirrors_tourist_traveler_id`** |
| **`discover/orders`** | **`frontend/lib/api.ts`** **`routes.discoverOrders`**；**`frontend/lib/apiClient/discover.ts`**；**`frontend/components/market/useMarketPage.ts`**；**`frontend/middleware.ts`** **`/discover` → `/market`** |

## 命令（仓库根）

```bash
cargo test -p traveltrust-api routes::did_rank::tests
```

- **结果**：**11 passed**（含 **`did_rank_itineraries_chain_off_completed_mirrors_tourist_traveler_id`**）。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**（**04 ↔ router ↔ app**）。

## 边界

- **不**替代 **§8.2** 为 **`itineraries`** 单列 **「行完成」**；**不**替代 **93 B** **`discover/orders`** 全量域回归。
- **Discover** 子站 **94 / market listings** 扇面仍归 **§7.1 域 F**，见 **域 N** 证据包 **§与 `/market` 产品 IA**。
