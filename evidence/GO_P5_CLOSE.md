# P5 程序族总封口（P5-1～P5-5 · 项目级台账 · 与 B-115/B-116 边界）

**锚点 ID**：**`TT-DOC-P5-PROGRAM-CLOSE-001`**

**定位**：**P5** **不是** 替代 **B-115**（Snapshot / Claim / 分配对账）或 **B-116**（FeeRouter / RegionVault 投影 MVP、**`fee-pool-aggregates` Σ**）的 **实现母域**；**P5** 为 **治理与经济延长线上的程序族**，由 **五个已封口 Epic** 组成。本文档 **汇总** 各 Epic 完成情况、**台账互指** 与 **对 B-115/B-116 的一口读边界**；**实现验收命令** 仍以 **各子卷 GO** 与 **母表对应行** 为 **SSOT**。

**收口日期**：2026-04-09

## 子 Epic 完成情况（P5-1～P5-5）

| Epic | 主题 | 状态 | 项目管理封口 GO | 母表检索 |
|------|------|------|-----------------|----------|
| **P5-1** | 试点辖区运营账本 **`country_ledger_ssot_v0`**（合约 + 投影 + **`GET …/country-ledger/:jurisdiction`**） | ☑ 已封口 | [**GO_P5_1_CLOSE.md**](GO_P5_1_CLOSE.md) · **`TT-DOC-P5-1-PM-CLOSE-001`** | [**P5-1**](../docs/任务母表.md) |
| **P5-2** | Vault 专项对账导出（**P5-2-A/B/C**；含 **P5-2-B** HTTP、**P5-2-C3** SOP） | ☑ 已封口 | [**GO_P5_2_CLOSE.md**](GO_P5_2_CLOSE.md) · **`TT-DOC-P5-2-PM-CLOSE-001`**；子卷 [**GO_P5_2_B_CLOSE.md**](GO_P5_2_B_CLOSE.md) | [**P5-2**](../docs/任务母表.md) |
| **P5-3** | **`RegionShareSnapshotLine`** 链上锚点 + **`indexer_tick`** 物化 **`region_share_snapshot_lines`** | ☑ 已封口 | [**GO_P5_3_CLOSE.md**](GO_P5_3_CLOSE.md) · **`TT-DOC-P5-3-PM-CLOSE-001`** | [**P5-3**](../docs/任务母表.md) |
| **P5-4** | 投资者分配治理前端（**Claim** 钱包交互 + 应计 **GET** 只读 UI + 路由门禁/文档） | ☑ 已封口 | [**GO_P5_4_CLOSE.md**](GO_P5_4_CLOSE.md) · **`TT-DOC-P5-4-PM-CLOSE-001`** | [**P5-4**](../docs/任务母表.md) |
| **P5-5** | **84** 参数与开放费点 **只读** 配置面（**protocol-reference** / **params** / linkage） | ☑ 已封口 | [**GO_P5_5_CLOSE.md**](GO_P5_5_CLOSE.md) · **`TT-DOC-P5-5-PM-CLOSE-001`** | [**P5-5**](../docs/任务母表.md) |

## 与 B-115 的关系（分配 / Snapshot / Claim 母域）

- **B-115** 仍为 **分配对账分域** 的 **项目管理封口** — [**GO_B115_CLOSE.md**](GO_B115_CLOSE.md) · **`TT-DOC-B115-PM-CLOSE-001`**。
- **P5-3** 在 **同一投影表** **`region_share_snapshot_lines`** 上 **补齐** **`RegionShareSnapshotLine`** **链上 emit + indexer** 路径，与 **B-115** 内网物化 **并列**；**不**改写 **B-115** 已封口的 **Claim / accrual / `registerAccrual` / internal 登记** 语义。
- **P5-4** **仅** 前端消费已公开的 **GET** 与 **用户钱包** 调 **`InvestorDistributionClaim`**；**不**扩 **B-115** 合约与 **internal** 写路径语义。
- **P5-5** **84** 镜像与 **cross_check** **旁证** **B-084** **`fee-pool-aggregates`**；**不**替代 **B-115** 分配叙事 **SSOT**。
- **P5-1** 与 **B-115** **正交**（独立 **`CountryPoolLedgerV0`** / **`p5_country_ledger_lines`**），详见 **GO_P5_1_CLOSE** §与 B-115 边界。

## 与 B-116 的关系（FeeRouter / RegionVault / Σ 母域）

- **B-116** 仍为 **经济投影 MVP** 的 **项目管理封口** — [**GO_B116_CLOSE.md**](GO_B116_CLOSE.md) · [**GO_B116_P4.md**](GO_B116_P4.md)。
- **P5-1 / P5-2 / P5-3 / P5-4 / P5-5** 各子卷 **均声明不改写** **B-116** 已封口的 **forward**、**两表写入**、**indexer/reorg**、**`fee-pool-aggregates` Σ** **主语义**；**P5-2** 仅 **只读导出** **`region_vault_forwarded_events`**；**P5-3** 在 **RegionVault** 上 **追加** **并列事件** 解码，**冻结** 与 **B-116** 写入臂 **边界**（见 **GO_P5_3_CLOSE**）。
- **P5-5** 要求 **`cross_check`** 与 **Σ** **机读一致**，**禁止**将 **84 镜像** 或 **Σ** **混读为单一链上瞬时 SSOT**（见 **GO_P5_5_CLOSE**、**B-110** 叙事）。

## 程序层验收（非替代子卷）

- **文档**：本文档与 [**evidence/README · P5 程序族**](README.md#p5-program-master-close)、[**任务母表 · P5**](../docs/任务母表.md) **互指一致**。
- **跨域回归（建议）**：**`bash scripts/run-check-04-routes.sh`**；**`cargo test -p traveltrust-api`**；**`cd frontend && npm test -- --run`** — **具体子域门槛** 见各 **GO_P5_n_CLOSE** 与 **母表** 对应行。

## 台账互指（可点击）

| 文档 | 锚点 |
|------|------|
| **evidence 总入口** | [**README · P5 程序族**](README.md#p5-program-master-close) |
| **任务母表 · P5（程序行）** | [**docs/任务母表.md**](../docs/任务母表.md)（检索 **P5**） |
| **B-115** | [**GO_B115_CLOSE.md**](GO_B115_CLOSE.md) |
| **B-116** | [**GO_B116_CLOSE.md**](GO_B116_CLOSE.md) |
