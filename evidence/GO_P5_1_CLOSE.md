# P5-1 收口证据索引（试点逐国链上账本 · `country_ledger_ssot_v0` · 母表/台账封口）

**锚点 ID**：**`TT-DOC-P5-1-PM-CLOSE-001`**

**过门口径**：与规格 **[P5-1-逐国链上账本SSOT-一国辖区端到端](../docs/spec/P5-1-逐国链上账本SSOT-一国辖区端到端.md)**、**[04 §3.4 · `GET …/governance/country-ledger/:jurisdiction`](../docs/spec/04-后端与API.md)**、**[14 §1.1 · CountryPoolLedgerV0](../docs/spec/14-合约-API-ABI-前后端对齐.md)** 一致；**不**替代发版 **`evidence/GO_YYYYMMDD/`** bundle（目录约定见 [README §目录约定](README.md#目录约定)）。

**收口日期**：2026-04-08

## 子波次完成情况（P5-1-A / B / C）

| 波次 | 交付摘要 |
|------|----------|
| **P5-1-A** | **`CountryPoolLedgerV0`**：试点 **`bytes2("DE")`**、**`credit`**、**`CountryLedgerCredited`**；**`balance` / `totalCredited` / `version()`**（**`version` = `country_ledger_ssot_v0`**）；Foundry **`CountryPoolLedgerV0.t.sol`**；ABI 入仓 **`contracts/abi/CountryPoolLedgerV0.json`** ↔ **`frontend/dapp/abis`**；**`DeployP51CountryLedger.s.sol`**（**不**改 **`Deploy.s.sol`**） |
| **P5-1-B** | **`p5_country_ledger_lines`** 投影表；**`CountryLedgerCredited`** 专用解码 **`crates/api/src/chain/country_ledger.rs`**；**`indexer_tick`** **追加**拉取 **`COUNTRY_POOL_LEDGER_ADDRESS`** + 写入投影（**禁止**从 **`fee_router_routed_events`** / **`region_vault_forwarded_events`** 派生 SSOT 行）；**`cargo test -p traveltrust-api`** 含 **`indexer_tick_persists_country_ledger_credited_when_db_configured`** |
| **P5-1-C** | **`GET /api/v1/governance/country-ledger/:jurisdiction`**（**`routes/governance_country_ledger.rs`**）：根级 **`rule_version`=`country_ledger_ssot_v0`**；**`eth_call`** **`pilotJurisdiction` / `balance` / `totalCredited` / `version()`**；**`COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS`**（与 **`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`** **分键**）；根级 **不得**含 **B-110** 型键（**`fee_pool_aggregates` / `country_pool*` / `treasury_*pool*`**）；单测 **`get_country_ledger_de_matches_mock_eth_call_values`** |

## 与 B-115 边界（已封口 · 正交）

| 维度 | B-115（Snapshot / Claim / 分配） | P5-1 |
|------|----------------------------------|------|
| **叙事** | **RegionShareSnapshotLine**、**`region_share_snapshot_lines`**、**`RegionDistributionClaim`**、投资者分配 Σ | **试点辖区 J\*** **运营账本** **`country_ledger_ssot_v0`** |
| **禁止** | — | **不**承担 **B-115** 投资者分配 **Σ**；**不**把 **`fee-pool-aggregates`** 或 **B-115 表** 当作本账本 SSOT |
| **索引** | **`RegionShareSnapshotLine`** 与 **RegionVault** 同址拉取（已封口实现） | **`CountryLedgerCredited`** **独立 topic** + **独立表** **`p5_country_ledger_lines`**；**不**改 **B-115** 既有解析臂语义 |

**互证**：[**GO_B115_CLOSE.md**](GO_B115_CLOSE.md)

## 与 B-116 边界（已封口 · 正交）

| 维度 | B-116（FeeRouter / RegionVault 经济投影 MVP） | P5-1 |
|------|-----------------------------------------------|------|
| **叙事** | **`PlatformFeeRouted` / `RegionVaultForwarded`** → 投影表 → **`fee-routes` / `vault-forwards` / `fee-pool-aggregates`** | **CountryPoolLedgerV0** **显式 `credit`** + 链上 view + 可选投影行 |
| **禁止** | — | **禁止**从 **`fee_router_routed_events`** / **`region_vault_forwarded_events`** **派生** **`p5_country_ledger_lines`** SSOT；**不**改 **B-116** 已封口 **indexer** 分支与聚合语义 |
| **HTTP** | **`governance/pool`** 等 **B-110** 根键域 | **`country-ledger/:j`** **独立路由**；根级 **B-110 池键缺席**（单测断言） |

**互证**：[**GO_B116_CLOSE.md**](GO_B116_CLOSE.md) · [**GO_B116_P4.md**](GO_B116_P4.md)

## 验收命令（可复核）

```bash
forge test --root contracts --match-contract CountryPoolLedgerV0Test
cargo test -p traveltrust-api
```

**说明**：以当前仓库 **CI / 本地** **`cargo test -p traveltrust-api`** 全绿为准（含 **P5-1-B/C** 相关用例）。

## 台账互指

- **任务母表**：[**docs/任务母表.md**](../docs/任务母表.md) **P5-1** 行（**☑ 已封口**）
- **evidence 入口**：[**README · P5-1**](README.md#p5-1-country-ledger-ssot-v0-close)

## 明确排除（非 P5-1 封口范围）

- **84 / 83** 文案中更广 **Target**（如 Vault 专项对账导出、多辖区产品化 UI 等）**不**因本收口自动变为 **Implemented**
- **reorg 回滚是否删 `p5_country_ledger_lines`** 等运维深化：**未**纳入本 **GO** 封口条；若需与 **`event_log`** 链域对齐，**另开工单**
