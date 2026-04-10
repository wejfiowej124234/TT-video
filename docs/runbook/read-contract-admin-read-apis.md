# 读取来源声明（Read Contract）— Admin 只读 GET API

供 **Task 卡 / AI OS** 使用：与 **governance** 只读契约同形（见 **`read-contract-governance-read-apis.md`**），覆盖 **`GET /api/v1/admin/*`**。**不写路径**、**不改 handler**；本页仅声明 **SourceKind** 语义与根级 **`data_source`** 约定。

**`SourceKind` 三枚举（机读）**：与 **`crates/api/src/source_kind.rs`** 一致 — **`chain_ssot`** | **`projection`** | **`reference`**。

**鉴权**：除另有说明外，均需 **`Authorization: Bearer …`** 且用户角色为 **`admin`** 或 **`super_admin`**；无 **`chain_off`** 时多数入口返回 **501**（与实现一致）。

**全局禁令**

- **列表 / 分页类 Admin 投影**（DB 或内存 **`items`**）：**禁止** 在响应**根级**使用 **`data_source: chain_read`** 冒充整表链上 SSOT（与 **fee-routes / vault-forwards** 治理列表同禁令）。
- **`GET …/admin/cross-check`**：三槽子体由 **`validate_body_matches_source_kind`** 约束（**`admin_cross_check.rs`**）；外廓根级**不**承载子槽语义。
- **不允许 mock** 充当链上主读；**不允许** 未在 **04** 声明的 **fallback**。

---

## 语义与根级 `data_source` 速查（Admin 域）

| SourceKind | 含义（Admin 域） | 典型根级 `data_source`（若存在） |
|------------|------------------|----------------------------------|
| **chain_ssot** | 仅当响应体**显式**承载链上主读泳道（Admin 侧极少；**cross-check** 槽内子 JSON 可能含 **`chain_read`** 等，见槽内声明） | 子体见 **`source_kind`** 槽；Admin 外廓列表**不**用 **`chain_read`** 根 |
| **projection** | PostgreSQL 投影、**`chain_off`** 内存台账、占位/汇总、**CSV 导出**的源数据仍为投影 | **通常根级缺省**；有 **`items`/`page`** 时 **`meta.source`** 常为 **`db`** / **`memory`**；FeeRouter / RegionVault 管理列表同 **治理** 列表禁令 |
| **reference** | **仅** **84** 类文档镜像（**`doc_ref` + `doc_version`**）；Admin **audit/operations** 为**静态动作码目录**，**不是** **reference** 机读槽（无 **`doc_ref`**） | **reference** 镜像：**必须** 缺省根级 **`data_source`**；静态目录：**缺省** 根级 **`data_source`** |

---

## 聚合与对拍（与 governance 文档交叉引用）

### `GET /api/v1/admin/cross-check`

| 项 | 声明 |
|----|------|
| **source_kind** | **外廓**：封装体；**`fee_pool_projection.body`** → **projection**；**`governance_pool_chain.body`** → **chain_ssot**；**`protocol_reference.body`** → **reference** |
| **根级 `data_source`** | **外廓必须缺省**（语义在子槽 **`body`**） |
| **mock** | **否** |

### `GET /api/v1/admin/drift-summary`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（由 **cross-check** 派生的只读摘要 **`drift_detected` / `delta`**） |
| **根级 `data_source`** | **缺省**；**禁止** **`chain_read`** |
| **mock** | **否** |

### `GET /api/v1/admin/audit/operations`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（进程内**静态动作码目录** **`action_catalog_v1`**；**非** DB 事件流、**非** **84** **`reference`** 镜像） |
| **根级 `data_source`** | **缺省** |
| **mock** | **否** |

### `GET /api/v1/admin/indexer/health`

| 项 | 声明 |
|----|------|
| **source_kind** | **projection**（**`ApiMetaState`** 哨兵 + 可选 DB 调和字段；**观测**用途，**非** FeeRouter Σ SSOT） |
| **根级 `data_source`** | **缺省** |
| **mock** | **否** |

---

## 只读 GET 路径索引（`source_kind` · 根级 `data_source`）

**约定**：下列凡含 **`items`** 或 DB 分页的管理列表，均为 **projection**；根级 **`data_source`** **通常缺省**；**禁止**根级 **`chain_read`**。导出类 **GET**（**`export`**）数据源与对应列表相同，仍为 **projection**。

| `GET` 路径 | source_kind | 根级 `data_source` |
|------------|-------------|-------------------|
| `/api/v1/admin/users` | projection | 缺省或见 **`meta`**；禁 **`chain_read`** |
| `/api/v1/admin/users/:id` | projection | 同上 |
| `/api/v1/admin/guides` | projection | 同上 |
| `/api/v1/admin/guides/:id` | projection | 同上 |
| `/api/v1/admin/orders` | projection | 同上 |
| `/api/v1/admin/orders/:id` | projection | 同上 |
| `/api/v1/admin/finance/summary` | projection | 同上 |
| `/api/v1/admin/finance/summary/export` | projection | 同上 |
| `/api/v1/admin/fee-router/routed-events` | projection | 缺省；禁 **`chain_read`** |
| `/api/v1/admin/region-vault/forwarded-events` | projection | 同上 |
| `/api/v1/admin/region-vault/forwarded-events/export` | projection | 同上 |
| `/api/v1/admin/schema/migrations` | projection | 缺省 |
| `/api/v1/admin/disputes` | projection | 缺省；禁 **`chain_read`** |
| `/api/v1/admin/disputes/:id` | projection | 同上 |
| `/api/v1/admin/reviews` | projection | 同上 |
| `/api/v1/admin/reviews/:id` | projection | 同上 |
| `/api/v1/admin/observability/overview` | projection | 缺省 |
| `/api/v1/admin/alerts/incidents/:id` | projection | 缺省 |
| `/api/v1/admin/audit/operations` | projection（静态目录） | 缺省 |
| `/api/v1/admin/indexer/health` | projection | 缺省 |
| `/api/v1/admin/indexer/reconcile-report/:id` | projection | 缺省 |
| `/api/v1/admin/indexer/reconcile-reports` | projection | 缺省 |
| `/api/v1/admin/indexer/reconcile-reports/export` | projection | 缺省 |
| `/api/v1/admin/audit-logs` | projection | 缺省 |
| `/api/v1/admin/audit-logs/:id` | projection | 缺省 |
| `/api/v1/admin/approvals` | projection | 缺省 |
| `/api/v1/admin/approvals/:id` | projection | 缺省 |
| `/api/v1/admin/flags` | projection | 缺省 |
| `/api/v1/admin/secrets/metadata` | projection | 缺省 |
| `/api/v1/admin/config/releases` | projection | 缺省 |
| `/api/v1/admin/config/releases/:id` | projection | 缺省 |
| `/api/v1/admin/jobs` | projection | 缺省 |
| `/api/v1/admin/scheduler/jobs` | projection | 缺省 |
| `/api/v1/admin/api-versions` | projection | 缺省 |
| `/api/v1/admin/lifecycle/state-machines` | projection | 缺省 |
| `/api/v1/admin/policies` | projection | 缺省 |
| `/api/v1/admin/tenants/scopes` | projection | 缺省 |
| `/api/v1/admin/compliance/data-requests` | projection | 缺省 |
| `/api/v1/admin/compliance/data-requests/:request_id/events` | projection | 缺省 |
| `/api/v1/admin/internal-tools/audits` | projection | 缺省 |
| `/api/v1/admin/media/access-logs` | projection | 缺省 |
| `/api/v1/admin/media/signed-url-tokens` | projection | 缺省 |
| `/api/v1/admin/community/reports` | projection | 缺省 |
| `/api/v1/admin/community/appeals` | projection | 缺省 |
| `/api/v1/admin/community/ranking/snapshots` | projection | 缺省 |
| `/api/v1/admin/community/penalties` | projection | 缺省 |
| `/api/v1/admin/community/moderation/cases` | projection | 缺省 |
| `/api/v1/admin/community/risk-signals` | projection | 缺省 |
| `/api/v1/admin/community/policy-change-logs` | projection | 缺省 |
| `/api/v1/admin/cross-check` | 见上节（三槽） | 外廓缺省 |
| `/api/v1/admin/drift-summary` | projection | 缺省 |

**P5 / B-115 / B-116**：**`GET …/governance/country-ledger/...`** 等封口域的 **Read Contract** 以 **governance** runbook 与 **04** 为准；本表不重复实现细节。

---

## CLI 可执行步骤（AI 用）

**默认** `BASE=http://127.0.0.1:8080`。将 **`$TOKEN`** 换为 **`admin`** 登录返回的 Bearer（联调可用与单测一致的 **`Bearer bearer_<uuid>`** 形态，取决于部署的会话策略）。

```bash
export BASE=http://127.0.0.1:8080
export TOKEN='your_admin_bearer_here'

curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/admin/cross-check" | head -c 600
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/admin/drift-summary" | head -c 400
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/admin/audit/operations" | head -c 400
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/admin/indexer/health" | head -c 400
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/admin/fee-router/routed-events" | head -c 400
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/admin/region-vault/forwarded-events" | head -c 400
```

---

## 相关代码

- **`SourceKind`** / **`validate_body_matches_source_kind`**：`crates/api/src/source_kind.rs`
- **cross-check 聚合**：`crates/api/src/routes/admin_cross_check.rs`
- **契约测试（最小）**：`crates/api/src/routes/admin_read_contract_contract_tests.rs`
- **Governance 只读契约（对照）**：`docs/runbook/read-contract-governance-read-apis.md`
