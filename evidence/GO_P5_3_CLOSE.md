# P5-3 收口证据索引（RegionShareSnapshot 链上锚点 · Epic P5-3-1/2/3 · 母表/台账总卷）

**锚点 ID**：**`TT-DOC-P5-3-PM-CLOSE-001`**

**过门口径**：**Epic P5-3** 在 **不扩展** **B-115** / **B-116** / **P5-1** / **P5-2** / **P5-5** **已封口写路径**、**投影表语义**、**聚合规则** 与 **链上根级 SSOT 读数闸** 的前提下，交付 **`RegionShareSnapshotLine`** 的 **链上发出（P5-3-1）**、**`indexer_tick` 经 `REGION_VAULT_ADDRESS` 拉取并幂等写入 `region_share_snapshot_lines`（P5-3-2）** 与 **规格/证据/README/母表台账闭环（P5-3-3 · 本卷）**。叙事互指 **[14 §1.1.1 RegionVault](../docs/spec/14-合约-API-ABI-前后端对齐.md)**、**[110 §3.1.1](../docs/spec/110-阶段开发链上索引器与事件同步器.md)**、**[83 / 84 Snapshot 分域](../docs/spec/83-区域治理与收益分配-协议白皮书.md)**、**[04 · P5-3](../docs/spec/04-后端与API.md#p5-3--regionsharesnapshot-链上锚点规格冻结--epic-p5-3)**；分配域母表封口仍归 **B-115** — **[GO_B115_CLOSE.md](GO_B115_CLOSE.md)**。

**收口日期**：2026-04-09

## 子卡完成情况（P5-3-1 / P5-3-2 / P5-3-3）

| 代号 | 交付摘要 | 权威入口 / 验收 |
|------|----------|-----------------|
| **P5-3-1** | **`RegionVault`** 新增 **`emitRegionShareSnapshotLine`**（**`onlyOwner`**）；事件 ABI 与 **`crates/api/src/chain/indexer.rs`** **`parse_region_share_snapshot_line`** / **`REGION_SHARE_SNAPSHOT_LINE_EVENT_SIGNATURE`** **逐字段一致**；Foundry 测 **`topic0`** 与 **`log.data` ≡ `abi.encode(string, uint256, uint256)`**；**`Deploy.s.sol`** 打印可复核 **`topic0`** | **`contracts/src/RegionVault.sol`**、**`contracts/test/RegionVault.t.sol`**、**`contracts/script/Deploy.s.sol`**；**`forge test`**（仓库根 **`contracts`**） |
| **P5-3-2** | **`indexer_tick`** 合并 **`REGION_VAULT_ADDRESS`** **`eth_getLogs`** 中的真实 **`RegionShareSnapshotLine`**；**`chain_off::event_name_from_topic0`** 注册 topic0；订单投影分支 **`matches!`** 显式排除 **`RegionShareSnapshotLine`**；**重复 tick** 不重复插入 **`event_log` / `region_share_snapshot_lines`** | **`crates/api/src/routes/internal.rs`**、**`crates/api/src/chain_off/reconcile.rs`**、**`crates/api/src/chain/indexer.rs`**（**未改** **`parse_*` ABI 形状**）；**`cargo test -p traveltrust-api`** |
| **P5-3-3** | **规格 · 证据 · README · 母表**：本 **GO**、**04 · P5-3**、**evidence/README** **§P5-3 Epic**、**任务母表** **P5-3** 行与子行 | 本文档；**[04 · P5-3](../docs/spec/04-后端与API.md#p5-3--regionsharesnapshot-链上锚点规格冻结--epic-p5-3)**；**[README · P5-3 Epic](README.md#p5-3-epic-regionshare-snapshot-onchain-anchor)** |

## 与 B-115 / B-116 / P5-1 / P5-2 / P5-5 边界（冻结）

| 域 | P5-3 允许 / 叙事 | **禁止**（本 Epic **不**改写已封口域） |
|----|------------------|----------------------------------------|
| **B-115** | **`region_share_snapshot_lines`** 仍为 **Snapshot 行级 SSOT（分配域并列）**；**P5-3** **补齐**链上 **emit** 与 **indexer 物化路径**，与 **B-115-4** **同表同解析器** 叙述衔接 | **不**改 **`RegionDistributionClaim`**、**accrual 登记**、**`fee-pool-aggregates` 与 Snapshot 根级正交** 等 **B-115** 已封口语义；**不**把 **Claim** 链上真值 **并入** 本 Epic |
| **B-116** | **读侧** 共用 **`REGION_VAULT_ADDRESS`** 与 **`RegionVaultForwarded`** **同合约拉取合并**（**110** 叙事）；**不**新增 **FeeRouter**/**Σ** 写入义务 | **不**改 **`forward` / `distribute`**、**`fee_router_routed_events` / `region_vault_forwarded_events` 写入**、**`economic_aggregate`**、**reorg 删尾** 规则 |
| **P5-1** | **正交**：**`CountryLedgerCredited`** / **`p5_country_ledger_lines`** **独立 topic**；**indexer_tick** 并列拉取 | **不**从 **`region_share_snapshot_lines`** **派生** 国账本 SSOT；**不**改 **P5-1** 合约/表/路由 |
| **P5-2** | **正交**：**Vault 转出导出** 数据源 **仅** **`region_vault_forwarded_events`** | **不**把 **Snapshot 导出** 与 **P5-2-B export** **混为同一 `package_kind`** **无说明**；**不**改 **P5-2** HTTP/脚本/manifest 封口 |
| **P5-5** | **正交**：**84 文档镜像** **不得**作为 **`RegionShareSnapshotLine`** **行级链上真值** | **不**扩展 **`protocol-reference`** **替代** **链上 log + DB 投影** |

## 验收命令（可复核 · 聚合）

```bash
forge test --root contracts
cargo test -p traveltrust-api
bash scripts/run-check-04-routes.sh
```

**环境（链上实跑留痕，非 CI 必选）**：**`REGION_VAULT_ADDRESS`** = 部署的 **RegionVault**；**`CHAIN_RPC_URL`**；owner 调用 **`emitRegionShareSnapshotLine`** 后 **`POST …/internal/indexer-tick`**，响应 **`region_share_snapshot_lines_new`** 与 **`events_new`** 按 **110 / Runbook §2.55** 复核；重复 tick **幂等** 见 **`internal.rs`** 集成测 **`indexer_tick_persists_region_share_snapshot_line_when_db_configured`**（需 **`DATABASE_URL`**）。

## 台账互指

- **任务母表**：[**docs/任务母表.md**](../docs/任务母表.md) **P5-3** · **P5-3-1** · **P5-3-2** · **P5-3-3**
- **evidence 总入口**：[**README · P5-3 Epic**](README.md#p5-3-epic-regionshare-snapshot-onchain-anchor)
- **分配域母表封口（仍归 B-115）**：[**GO_B115_CLOSE.md**](GO_B115_CLOSE.md)

## 明确排除（非 P5-3 Epic 本卷）

- **产品级 Admin UI** 专页展示 Snapshot 锚点（当前以 **链浏览器 + `event_log` + DB 查询** 为主）
- **83/84** 更广 **Target** 中 **未** 在 **04** 单独立项的 **其它** Snapshot 产品叙事（仍按各文 **Target** 登记）
- **多链批量编排** Snapshot emit（运维可 **按链** 重复部署与 tick）
