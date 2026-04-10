# B-115 收口证据索引（Snapshot / Claim / 分配对域 · 母表封口）

**过门口径**：项目管理封口与 **任务母表 `B-115`** 行一致；**不**替代发版 **`evidence/GO_YYYYMMDD/`** bundle（若需 manifest 仍按 [README §目录约定](README.md#目录约定)）。

**收口日期**：2026-04-09  

## 子卡完成情况（1～5）

| 子卡 | 交付摘要 |
|------|----------|
| **B-115-1** | PostgreSQL **`region_share_snapshot_lines`** + **`crates/api/src/db/region_snapshot.rs`**（幂等自然键） |
| **B-115-2** | **`contracts/src/RegionDistributionClaim.sol`** + **`contracts/test/RegionDistributionClaim.t.sol`** + **`contracts/abi/RegionDistributionClaim.json`** ↔ **`frontend/dapp/abis/RegionDistributionClaim.json`** + **`contracts/script/Deploy.s.sol`** |
| **B-115-3** | **`POST /api/v1/internal/investor-distribution-register-accrual`**（**`crates/api/src/routes/investor_distribution.rs`** + DB）链下登记视图，幂等 **`idempotency_keys`** |
| **B-115-4** | **`RegionShareSnapshotLine`** 事件解析（**`crates/api/src/chain/indexer.rs`**）+ **`indexer_tick`** 物化；**`POST /api/v1/internal/region-share-snapshot-line`**（**`crates/api/src/routes/internal.rs`**） |
| **B-115-5** | **`fee-pool-aggregates`** / **`governance/pool`** 与 Snapshot·Claim·分配 **根级正交断言**（**`crates/api/src/db/economic_aggregate.rs`**、**`crates/api/src/routes/governance.rs`** tests）；重复登记幂等路径 + **重复 Claim** 由 **`RegionDistributionClaim.t.sol`** 承担 |

## 验收命令（可复核）

```bash
forge test --root contracts
cargo test -p traveltrust-api
```

**说明**：全量 **`cargo test -p traveltrust-api`** 在收口时 **672 passed, 0 failed**（以当前仓库 CI / 本地为准）。

## 台账互指

- **任务母表**：**[docs/任务母表.md](../docs/任务母表.md)** **B-115** 行（**☑ 已封口**）
- **规格读前（既有）**：**[84](../docs/spec/84-第一阶段10国Country-Pool发行参数总表.md)** 对账分域指针、**[14 §2.1](../docs/spec/14-合约-API-ABI-前后端对齐.md)**、**83** / **04 §3.4**（母表 **来源** 列已列）

## 与 B-116 边界

**B-116** 经济投影 MVP（FeeRouter / RegionVault / **`fee-pool-aggregates`**）与 **B-115** **正交互证**；**84** 文案中「逐国链上账本」等 **更广 Target** 仍以 **83/84** 为准，**不**回滚本 **B-115** 封口范围。

## 与 P5-1 边界

**P5-1**（试点 **`country_ledger_ssot_v0`** · **CountryPoolLedgerV0** + **`p5_country_ledger_lines`** + **`GET …/country-ledger/:j`**）与 **B-115**（Snapshot / Claim / **`region_share_snapshot_lines`**）**正交**：**不**以 **B-115** 表或 **`fee-pool-aggregates`** 作为该国运营账本 SSOT；台账互指 **[GO_P5_1_CLOSE.md](GO_P5_1_CLOSE.md)**。
