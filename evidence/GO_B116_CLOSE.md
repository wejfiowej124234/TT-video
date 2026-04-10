# B-116 收口证据索引（FeeRouter / RegionVault 经济投影 MVP · 母表封口）

**过门口径**：项目管理封口与 **任务母表 `B-116`** 行一致；**不**含 **P5 / 84 外环**（逐国链上账本、Vault 专项对账导出、Snapshot 上链强化、UI 等 — **另立 Epic**）。**不**替代发版 **`evidence/GO_YYYYMMDD/`** bundle（目录约定见 [README §目录约定](README.md#目录约定)）。

**收口日期**：2026-04-09  

## 单一技术同锚（规格 / 门禁 / 运维 / 命令）

**[GO_B116_P4.md](GO_B116_P4.md)** — **14**、**110**、**Runbook §2.55**、**`indexer-reconcile-gate.yml`**（**`checks_total`↔`check_anchor`** **106**）、**[README · B-116](README.md#b116-feerouter-regionvault-evidence)** 互指与可复核脚本。

## 子波次完成情况（P1～P4 · 核心闭环）

| 波次 | 交付摘要 |
|------|----------|
| **P1** | **FeeRouter** / **RegionVault**：合约行为、Foundry 覆盖、**`contracts/abi`↔`frontend/dapp/abis`**、**`Deploy.s.sol`** 路径一致性验收 |
| **P2** | **`fee_router_routed_events`** / **`region_vault_forwarded_events`** 写入、**`indexer_tick`**、**reorg** 链域删尾、事件解码；**`cargo test -p traveltrust-api`** 相关用例 |
| **P3** | **`GET …/governance/fee-routes`**、**`vault-forwards`**、**`fee-pool-aggregates`** 形状、分页与投影聚合契约；**`cargo test -p traveltrust-api`** 相关用例 |
| **P4** | 规格 **14/110**、**Runbook**、**CI gate**、**README**、**母表** 同锚；**`TT-DOC-B116-P4-ANCHOR-001`** |

## 验收命令（可复核）

```bash
forge test --root contracts --match-contract "FeeRouterTest|RegionVaultTest"
cargo test -p traveltrust-api
bash scripts/check-55-s13.sh
```

**说明**：全量 **`cargo test -p traveltrust-api`** 在收口窗口内 **672 passed, 0 failed**（以当前仓库 **CI / 本地** 为准）。

## 台账互指

- **任务母表**：[**docs/任务母表.md**](../docs/任务母表.md) **B-116** 行（**☑ 已封口** · **不含 P5-1 本卷**；**P5-1** 另见下行）
- **B-115 边界**（已封口、正交）：[**GO_B115_CLOSE.md**](GO_B115_CLOSE.md)
- **P5-1 边界**（**`country_ledger_ssot_v0`** · 与 **B-116** 投影/聚合 **正交**）：[**GO_P5_1_CLOSE.md**](GO_P5_1_CLOSE.md)

## 明确排除（非本卡封口范围）

- **84 更广 Target**：Vault 专项对账导出等（**83/84** 叙事；**不**因 **P5-1** 收口自动闭合）
- **P5-1**（试点逐国运营账本 **A/B/C**）已 **另卷** 封口 — **[GO_P5_1_CLOSE.md](GO_P5_1_CLOSE.md)**（**本 GO** 仍 **不**含其实现范围）
- **路线扩展**：RegionShareSnapshot 真实链上事件化、Governance / Claim / 分红 **产品级 UI** — **新 Epic 立项**
