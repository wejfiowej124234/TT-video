# GO_95 · §7.4 · **FeeRouter / RegionVault / governance 只读 API** · 2026-04-21

## 口径（SSOT）

- **[110-阶段开发链上索引器与事件同步器.md](../../docs/spec/110-阶段开发链上索引器与事件同步器.md)** **§3.1.1** 表：**FeeRouter `PlatformFeeRouted`**（**`fee_router_routed_events`**）· **RegionVault `RegionVaultForwarded`**（**`region_vault_forwarded_events`**）；**只读 API** 行：**`GET /api/v1/governance/fee-routes`**、**`GET /api/v1/admin/fee-router/routed-events`**；**`GET /api/v1/governance/vault-forwards`**、**`GET /api/v1/admin/region-vault/forwarded-events`**；**`GET /meta` → `chain.contracts.fee_router_address` / `region_vault_address`**（与 **Runbook §7.1**、**14** 同址叙事）。
- **[14-合约-API-ABI-前后端对齐.md](../../docs/spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1**（**B-116** 经济投影 / evidence 互指）。

## 工程真值（路由 ↔ DB ↔ 契约测）

| 主题 | 位置 |
|------|------|
| **Governance 子路由** | **`crates/api/src/routes/governance/router.rs`** **`/api/v1/governance/fee-routes`**、**`/api/v1/governance/vault-forwards`** |
| **Handler 与 110/14 注释** | **`crates/api/src/routes/governance/governance_reads.rs`** **`get_governance_fee_routes`**（**FeeRouter `PlatformFeeRouted`**）/**`get_governance_vault_forwards`**（**RegionVault `RegionVaultForwarded`**） |
| **DB 列表 / 统计 / 删除尾块** | **`crates/api/src/db/fee_router_events.rs`**、**`crates/api/src/db/region_vault_events.rs`** |
| **Admin 只读** | **`crates/api/src/routes/admin/mod.rs`** **`GET …/admin/fee-router/routed-events`**、**`GET …/admin/region-vault/forwarded-events`**（及 export） |
| **`GET /meta` 合约地址块** | **`crates/api/src/routes/health_meta/handlers.rs`** **`fee_router_address`** / **`region_vault_address`**（与 **`ChainConfig`** 同源） |
| **Read Contract 路由守卫** | **`crates/api/src/routes/read_contract_route_guard.rs`** 字面量表含 **`/api/v1/governance/fee-routes`**、**`/api/v1/governance/vault-forwards`** |
| **SourceKind 契约（只读形状）** | **`crates/api/src/routes/governance_read_contract_contract_tests.rs`** **`fee-routes`** / **`vault-forwards`** |

## 命令结果（仓库根）

```bash
cargo test -p traveltrust-api governance_read_contract_contract_tests::
```

- **结果**：**7 passed**（含 **`read_contract_fee_routes_*`**、**`read_contract_vault_forwards_*`**）。

```bash
cargo test -p traveltrust-api fee_router_events::
```

- **结果**：**5 passed**（**`fee_router_routed_events`** 分页/limit/cursor/删尾）。

```bash
cargo test -p traveltrust-api region_vault_events::
```

- **结果**：**3 passed**（**`region_vault_forwarded_events`** 分页/删尾）。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**。

## 边界

- **不**替代 **`POST …/internal/indexer-tick`** 在 **staging** 上 **真链** 拉 **`PlatformFeeRouted` / `RegionVaultForwarded`** 的全量验收；**不**替代 **83/84** 按国链上账本 **Target** 叙述。
- **不**替代 **Admin** 浏览器侧 **`admin.fee_router_routed.read`** 等 **审计** 全记录（见 **110** / **Runbook**）。
