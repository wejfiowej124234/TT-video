# P5-2-B 收口证据索引（Vault 专项对账只读导出 · Admin · 母表/台账封口）

**Epic 总卷**：[**GO_P5_2_CLOSE.md**](GO_P5_2_CLOSE.md)（**`TT-DOC-P5-2-PM-CLOSE-001`**）

**锚点 ID**：**`TT-DOC-P5-2-B-PM-CLOSE-001`**

**过门口径**：与 **[04 §3.5 · `GET …/admin/region-vault/forwarded-events/export`](../docs/spec/04-后端与API.md)**、**[04 · P5-2-A 规格冻结](../docs/spec/04-后端与API.md#p5-2-a--vault-专项对账导出规格冻结--epic-p5-2)**、**[110 §3.1.1](../docs/spec/110-阶段开发链上索引器与事件同步器.md)**、**[14 §1.1.1 RegionVault](../docs/spec/14-合约-API-ABI-前后端对齐.md)** 一致；数据源 **仅** **`region_vault_forwarded_events`**（与 **`governance/vault-forwards`** / Admin 列表 **同投影**），**不**改写 **B-116** 写入、**Σ**、**indexer** 语义。

**收口日期**：2026-04-09

## 外部阻塞已清除（与 P5-2-B 无关）

| 事项 | 说明 |
|------|------|
| **曾阻塞全量封口** | **`cargo test -p traveltrust-api`** 曾因 **`routes::governance_country_ledger::tests::get_country_ledger_de_matches_mock_eth_call_values`** **失败**（**`x-implementation-status`** 期望 **`country_ledger_chain_read`**，实际 **`country_ledger_partial_read`**），导致 **无法用「整包 API 单测全绿」** 作为 **P5-2-B** 最终封口依据。 |
| **根因** | **P5-1-C** **`country-ledger`** 路径对三次 **`eth_call`** 使用 **`tokio::join!`**，与 **FIFO** 型 JSON-RPC mock **出队顺序** 竞态，**与 Vault 导出实现无关**。 |
| **清除方式** | **另开最小修复卡**：**`governance_country_ledger.rs`** 将三次调用改为 **顺序 `await`**；**不**改 **P5-2-B**、**RegionVault** 导出、**B-115**、**B-116** 相关实现。 |
| **当前状态** | **阻塞已解除**：**`cargo test -p traveltrust-api`** **全绿** 可作为 **P5-2-B** 与仓库 **API 包** 门禁。 |

## 交付摘要（P5-2-B）

- **路由**：**`GET /api/v1/admin/region-vault/forwarded-events/export`**（**`format`**=`csv`|`json`；**`limit`** 1～2000；**`chain_id?`**；**`Content-Disposition`/`Content-Type`**；复用 **`x-traveltrust-reconcile-export-sha256`** / 可选 **Ed25519** / **`x-traveltrust-reconcile-export-truncated`**）。
- **审计**：**`admin.region_vault_forwarded.export`**。
- **实现索引**（代码路径以仓库为准）：**`crates/api/src/routes/admin.rs`**、**`crates/api/src/db/region_vault_events.rs`**（**`list_region_vault_forwarded_events_export`** 等）。
- **相序规格（P5-2-C2 · 仅文档）**：离线包目录与 **`vault-forwarded-offline.manifest.json`** 机读字段表见 **[04 · P5-2-C2](../docs/spec/04-后端与API.md#p5-2-c2--vault-专项离线包目录与-manifest-机读规范规格冻结)**；示例 manifest：**[vault-forwarded-offline-manifest.example.json](vault-forwarded-offline-manifest.example.json)**（占位 SHA256，**须替换为真实拉取值**）。
- **Admin/SOP/台账闭环（P5-2-C3 · 仅文档）**：**谁执行 / 已封口 API / C1 组包 / SHA256·Ed25519 / 证据路径** 见 **[70 · 一点五 `#p5-2-c3-vault-offline-sop`](../docs/spec/70-管理员系统开发文档.md#p5-2-c3-vault-offline-sop)**；**任务母表** **P5-2-C3** 行；**evidence** 总索引 [**README · P5-2-C**](README.md#p5-2-c-vault-离线包-c1c2c3-互指)。

## 验收命令（可复核）

```bash
cargo test -p traveltrust-api
bash scripts/run-check-04-routes.sh
```

## 台账互指

- **任务母表**：[**docs/任务母表.md**](../docs/任务母表.md) **P5-2**（**Epic**）· **P5-2-B** 行（**☑ 已封口**）· **P5-2-C3** 行（**Vault 离线包 SOP/台账**）
- **evidence 入口**：[**README · P5-2 Epic**](README.md#p5-2-epic-vault-export-close)（**GO_P5_2_CLOSE**）· [**README · B-116 / P5 分卷**](README.md#b116-feerouter-regionvault-evidence)（本文件 **GO_P5_2_B_CLOSE**）· [**README · P5-2-C**](README.md#p5-2-c-vault-离线包-c1c2c3-互指)

## 明确排除（非 P5-2-B 子卷封口范围）

- **Epic 级排除与总边界** 见 [**GO_P5_2_CLOSE**](GO_P5_2_CLOSE.md) §明确排除 / §边界；**C1/C2/C3** 互指 [**README · P5-2-C**](README.md#p5-2-c-vault-离线包-c1c2c3-互指)
- **B-116** **投影写入**、**`fee-pool-aggregates` Σ**、**reorg**、**economic_aggregate** 语义变更
- **前端** 专项导出 **UI** 产品化（本卷为 **Admin/HTTP 导出** 基线）
