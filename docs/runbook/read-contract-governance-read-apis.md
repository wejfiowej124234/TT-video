# 读取来源声明（Read Contract）— 治理相关只读 API

供 **Task 卡 / AI OS** 使用：每个端点必须写明 **source_kind**、**允许根级 `data_source`（若有）**、**fallback**、**mock**，避免 **source 混用** 与 **projection 冒充 chain**。

**`SourceKind` 三枚举（机读）**：与 **`crates/api/src/source_kind.rs`** 一致 — **`chain_ssot`** | **`projection`** | **`reference`**。

**全局禁令**

- **`GET …/admin/cross-check`** 三槽已由 **`validate_body_matches_source_kind`** 强校验（见 **`admin_cross_check.rs`**）。
- **不允许 mock** 充当链上主读；**不允许** 未在 **04** 声明的 **fallback**。

---

## 语义与根级 `data_source` 速查

| SourceKind | 含义（治理域） | 典型根级 `data_source`（若存在） |
|------------|----------------|----------------------------------|
| **chain_ssot** | 链上主读或治理池泳道（**非** 84 镜像、**非** FeeRouter Σ 根） | **`chain_read`** \| **`database`** \| **`database_empty`** \| **`placeholder`** |
| **projection** | 投影表 / 链下 MVP / 占位聚合 | **`projection`** \| **`placeholder`** \| **`database`**（仅 **非 cross-check 槽** 的 DB 只读，见各节） \| **`governance_proposals_projection`** \| **`chain_off_mvp`** 等（见各节） |
| **reference** | **84** 文档镜像 | **不得** 出现根级 **`data_source`**；须 **`doc_ref` + `doc_version`** |

**投影事件列表**（**fee-routes** / **vault-forwards**）：归类 **projection**；有数据时根级常 **无** **`data_source`**；**禁止** 根级 **`data_source: chain_read`** 冒充整表链上 SSOT。

---

## `GET /api/v1/governance/pool`

| 项 | 声明 |
|----|------|
| **source_kind** | **chain_ssot**（治理池泳道；与 **cross-check** 槽一致） |
| **允许根级 `data_source`** | **`chain_read`** \| **`database`** \| **`database_empty`** \| **`placeholder`** |
| **fallback** | **按 04**；**禁止** 未文档化冒充 |
| **mock** | **否** |

---

## `GET /api/v1/governance/rewards`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（DB 或占位；**非** 链上 Claim SSOT） |
| **允许根级 `data_source`** | **`database`** \| **`placeholder`** |
| **fallback** | **按 04** |
| **mock** | **否** |

---

## `GET /api/v1/governance/proposals`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（**`governance_proposals_projection`**）或 **chain_off_mvp** 等（见 **04**） |
| **允许根级 `data_source`** | **`governance_proposals_projection`** \| **`chain_off_mvp`** 等 |
| **fallback** | **按 04**（索引/Governor 模式切换） |
| **mock** | **否** |

---

## `GET /api/v1/governance/proposals/:proposal_id`

| 项 | 声明 |
|----|------|
| **source_kind** | 同列表；详情与计票字段见 **04** |
| **mock** | **否** |

---

## `GET /api/v1/governance/proposal-status/:proposal_id`

| 项 | 声明 |
|----|------|
| **source_kind（主径）** | **chain_ssot**（**`eth_call` `state`** 成功 → **`is_chain_ssot: true`**） |
| **source_kind（次径）** | **projection**（**`data_source: governance_proposals_projection`**） |
| **其他** | **chain_off_mvp** / **501** 等见 **04** |
| **fallback** | **按 04** |
| **mock** | **否** |

---

## `GET /api/v1/governance/delegate`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（链下 MVP 委托图） |
| **允许根级 `data_source`** | **`chain_off_mvp`** 等（见 **04**） |
| **mock** | **否** |

---

## `GET /api/v1/governance/voting-power`

| 项 | 声明 |
|----|------|
| **source_kind** | **混合只读**：信号票 **projection**；**`on_chain_vote_weight`** 等子树为 **chain_ssot** 子读（见 **04** / **B-092**） |
| **根级** | 以 **`vote_kind` / `weight_ssot`** 等为 SSOT 叙事锚点 |
| **mock** | **否** |

---

## `GET /api/v1/governance/investor-share-reconcile`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（**`Transfer` 重放** + 链上 **`totalSupply`** 对拍；根级 **`data_source`** 见 **04**） |
| **mock** | **否** |

---

## `GET /api/v1/governance/investor-distribution-accruals`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（应计分录表只读） |
| **mock** | **否** |

---

## `GET /api/v1/governance/fee-routes`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（**`PlatformFeeRouted`** 投影行） |
| **根级 `data_source`** | **通常缺省**（有 **`items`/`page`**）；占位时见 **`X-Implementation-Status`**；**禁止** 根级 **`chain_read`** |
| **mock** | **否** |

---

## `GET /api/v1/governance/vault-forwards`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（**`RegionVaultForwarded`** 投影行） |
| **根级 `data_source`** | 同 **fee-routes** |
| **mock** | **否** |

---

## `GET /api/v1/governance/fee-pool-aggregates`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（与 **cross-check** 槽一致） |
| **允许根级 `data_source`** | **`projection`** \| **`placeholder`** |
| **mock** | **否** |

---

## `GET /api/v1/governance/protocol-reference`

| 项 | 声明 |
|----|------|
| **source_kind** | **reference**（与 **cross-check** 槽一致） |
| **根级 `data_source`** | **必须缺省** |
| **mock** | **否** |

---

## `GET /api/v1/governance/protocol-reference/pending`

| 项 | 声明 |
|----|------|
| **source_kind** | **reference**（镜像 + **`pending_package_source`**） |
| **根级 `data_source`** | **必须缺省** |
| **mock** | **否** |

---

## `GET /api/v1/governance/params`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（占位聚合） |
| **允许根级 `data_source`** | **`placeholder`** |
| **mock** | **否** |

---

## `GET /api/v1/governance/country-ledger/:jurisdiction`（P5-1-C · 规格封口域）

| 项 | 声明 |
|----|------|
| **source_kind** | **chain_ssot**（**`country_ledger_ssot_v0`** **eth_call** 泳道；见 **04**） |
| **说明** | **仅文档扩面**；**不** 在本任务中改 **P5** 实现 |

---

## `GET /api/v1/country-ledger/:jurisdiction`（Task B-1）

| 项 | 声明 |
|----|------|
| **source_kind** | **chain_ssot**（配置命中戳 **`data_source: chain_ssot`**） |
| **fallback** | **否** |
| **mock** | **否** |

---

## `GET /api/v1/admin/cross-check`

（同前：三槽 **`SourceKind` + 子体 `data_source` 强校验**。）

---

## `GET /api/v1/admin/drift-summary`

（同前：与 **cross-check** 同源派生。）

---

## CLI 可执行步骤（抽样 · AI 用）

**默认** `PORT=8080`、`BASE=http://127.0.0.1:8080`。公开 **governance** 只读无需登录（**admin** 路由需 **Bearer + admin**）。

```bash
export BASE=http://127.0.0.1:8080

curl -sS "$BASE/api/v1/governance/protocol-reference" | head -c 400
curl -sS "$BASE/api/v1/governance/protocol-reference/pending" | head -c 400
curl -sS "$BASE/api/v1/governance/params" | head -c 400
curl -sS "$BASE/api/v1/governance/pool" | head -c 400
curl -sS "$BASE/api/v1/governance/fee-pool-aggregates" | head -c 400
curl -sS "$BASE/api/v1/governance/fee-routes" | head -c 400
curl -sS "$BASE/api/v1/governance/vault-forwards" | head -c 400
curl -sS "$BASE/api/v1/governance/proposals" | head -c 400
```

**admin**（需替换 **`$TOKEN`**）：

```bash
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/admin/cross-check" | head -c 500
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/admin/drift-summary" | head -c 400
```

---

## 相关代码

- **`SourceKind`** / **`validate_body_matches_source_kind`**：`crates/api/src/source_kind.rs`
- **cross-check 聚合**：`crates/api/src/routes/admin_cross_check.rs`
- **契约测试（最小）**：`crates/api/src/routes/governance_read_contract_contract_tests.rs`
