# P5-2 收口证据索引（Vault 专项对账导出 · Epic A/B/C · 母表/台账总卷）

**锚点 ID**：**`TT-DOC-P5-2-PM-CLOSE-001`**

**过门口径**：**Epic P5-2** 在 **不扩展** **B-116** **投影写入** / **`fee-pool-aggregates` Σ** / **indexer** 语义、**不**侵入 **B-115**、**P5-1**、**P5-5** **已封口实现** 的前提下，交付 **RegionVault `RegionVaultForwarded`** 表 **`region_vault_forwarded_events`** 的 **规格（A）**、**Admin 只读导出 HTTP（B）** 与 **离线包运维闭环（C）**。叙事互指 **[14 §1.1.1 RegionVault](../docs/spec/14-合约-API-ABI-前后端对齐.md)**、**[110 §3.1.1](../docs/spec/110-阶段开发链上索引器与事件同步器.md)**、**[84 读前摘要 · 转出审计](../docs/spec/84-第一阶段10国Country-Pool发行参数总表.md)**。

**收口日期**：2026-04-09

## 子波次完成情况（P5-2-A / B / C）

| 代号 | 交付摘要 | 权威入口 |
|------|----------|----------|
| **P5-2-A** | **HTTP 侧规格冻结**：最小列集、数据源 **仅** **`region_vault_forwarded_events`**、与 **`vault-forwards`** / **`fee-pool-aggregates` Σ** 的关系、**Ed25519** 复用对账导出头名 | **[04 · P5-2-A](../docs/spec/04-后端与API.md#p5-2-a--vault-专项对账导出规格冻结--epic-p5-2)** |
| **P5-2-B** | **`GET /api/v1/admin/region-vault/forwarded-events/export`**（**CSV/JSON**）；**SHA256** / 可选 **Ed25519** / **truncated** 头；审计 **`admin.region_vault_forwarded.export`** | **[GO_P5_2_B_CLOSE.md](GO_P5_2_B_CLOSE.md)**（**`TT-DOC-P5-2-B-PM-CLOSE-001`** · **API/实现子卷**） |
| **P5-2-C1** | 只读运维脚本 **`vault-forwarded-export-fetch.sh`**（**`.ps1`**）拉取 **B** 响应并落盘侧车 | **[scripts/vault-forwarded-export-fetch.sh](../scripts/vault-forwarded-export-fetch.sh)**、**[scripts/README.md](../scripts/README.md)**、**[Runbook §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)** |
| **P5-2-C2** | 离线包目录 + **`vault-forwarded-offline.manifest.json`** 机读规范 + **[示例 JSON](vault-forwarded-offline-manifest.example.json)** | **[04 · P5-2-C2](../docs/spec/04-后端与API.md#p5-2-c2--vault-专项离线包目录与-manifest-机读规范规格冻结)** |
| **P5-2-C3** | **Admin/SOP/台账**：执行角色、API、组包、**SHA256**/**Ed25519**、证据路径 | **[70 · 一点五 `#p5-2-c3-vault-offline-sop`](../docs/spec/70-管理员系统开发文档.md#p5-2-c3-vault-offline-sop)**、**[任务母表 · P5-2-C3](../docs/任务母表.md)** |

## 与 B-115 / B-116 / P5-1 / P5-5 边界（冻结）

| 域 | P5-2 允许 | **禁止**（本 Epic **不**承担） |
|----|-----------|--------------------------------|
| **B-115** | 只读导出 **Vault 转出投影行** 与 **Snapshot/Claim/分配** **并列存档**；对账在 **表外/脚本** 按 **04** 叙述 | **不**改 **`region_share_snapshot_lines`**、**`RegionDistributionClaim`** 登记链、投资者分配 **SSOT** |
| **B-116** | **读** **`region_vault_forwarded_events`**（与 **`internal/indexer-tick`** 写入结果 **同源**）；导出 **不** 改写 **Σ** **`build_fee_pool_aggregate_body`** | **不**改 **indexer**、**reorg** 删尾、**`economic_aggregate`**、**两投影表写入** 语义 |
| **P5-1** | **正交**：**国账本** **`country_ledger_ssot_v0`** 与 **Vault 转出流水** **分文件/分 `package_kind`** | **不**把 **`country-ledger`** 或 **`p5_country_ledger_lines`** **并入** Vault 离线包 **无说明**；**不**从 **`fee_router_routed_events`/`region_vault_forwarded_events`** **派生** 国账本 SSOT 行（**P5-1** 自有规则） |
| **P5-5** | **正交**：**84 文档镜像**、**`protocol-reference`** **不得** 作为本导出 **行级真值**（**04 P5-2-A** 已冻结） | **不**扩展 **`protocol_reference_json`** **充当** 本导出数据源；**不**用 **`cross_check`** **替代** 投影流水 |

## 验收命令（可复核 · 聚合）

```bash
cargo test -p traveltrust-api
bash scripts/run-check-04-routes.sh
# 离线拉取（须有效 ADMIN_BEARER_TOKEN 与可达 API）：
# ADMIN_BEARER_TOKEN='…' bash scripts/vault-forwarded-export-fetch.sh
```

## 台账互指

- **任务母表**：[**docs/任务母表.md**](../docs/任务母表.md) **P5-2**（**Epic**）· **P5-2-B** · **P5-2-C3**
- **evidence 总入口**：[**README · P5-2 Epic**](README.md#p5-2-epic-vault-export-close) · [**README · P5-2-C**](README.md#p5-2-c-vault-离线包-c1c2c3-互指)
- **API 子卷**：[**GO_P5_2_B_CLOSE.md**](GO_P5_2_B_CLOSE.md)

## 明确排除（非 P5-2 Epic 本卷）

- **Admin 前端** 专项导出 **一键 UI**（当前为 **HTTP + 脚本 + SOP**）
- **多链**/**多环境** 批量编排产品化（运维可 **多次** 调用脚本 + 分目录留痕）
- **83/84** 更广 **Target** 叙事中 **未** 在 **04** 单独立项的 **其它** 导出形态
