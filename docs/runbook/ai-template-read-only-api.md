# AI 开发模板：新增只读 HTTP 接口（SourceKind · Read Contract · 契约测试 · Route Guard）

**单一入口**：新增 **`/api/v1/governance/*` 或 `/api/v1/admin/*` 只读 GET** 时，**先读本页**；发现入口见 [README.md](../../README.md)「参与开发」、[CONTRIBUTING.md](../../CONTRIBUTING.md)「必读入口」、[任务母表.md](../任务母表.md) 层级表与流程第 4 步。

供 **Task 卡 / AI OS** 使用。本页**仅模板与清单**，不替代 **`docs/spec/04-后端与API.md`** 中的契约句。

**封口禁令（必须遵守）**

- **禁止**修改 **B-115 / B-116 / P5** 已封口实现（含对应 handler、聚合边界、链上读路径的语义）。
- 新增只读接口**不得**为绕过上述封口而改既有封口代码；若与封口域重叠，仅做 **04 文档句**或**外层只读包装**须单独评审。

**已有资产（对齐用）**

| 能力 | 位置 |
|------|------|
| `SourceKind` / `validate_body_matches_source_kind` | `crates/api/src/source_kind.rs` |
| 治理只读 Read Contract | `docs/runbook/read-contract-governance-read-apis.md` |
| 管理只读 Read Contract | `docs/runbook/read-contract-admin-read-apis.md` |
| 治理契约测试 | `crates/api/src/routes/governance_read_contract_contract_tests.rs` |
| 管理契约测试 | `crates/api/src/routes/admin_read_contract_contract_tests.rs` |
| Route Guard（扫描 + 注册表 + GET smoke） | `crates/api/src/routes/read_contract_route_guard.rs` |

---

## 1. 任务卡模板（复制即用）

```markdown
## Task：<短标题> — 新增只读 API

### 目标
- 新增 `GET <路径>`（或 `GET` 与 `POST/PATCH` 同路径时**仅登记 GET** 语义）。
- 遵守 SourceKind / Read Contract；补齐契约测试与 route guard（若落在 guard 范围内）。

### 约束
- **禁止**修改 B-115 / B-116 / P5 已封口实现。
- **禁止**写路径改业务 handler 行为（若本轮仅文档/测试，写明「无代码变更」）。
- 默认测试：`cargo test -p traveltrust-api`。

### 交付物
- [ ] `04` 契约句（若项目约定本轮合 04；否则按协作规则仅 runbook）
- [ ] Read Contract 表（治理 → `read-contract-governance-read-apis.md`；管理 → `read-contract-admin-read-apis.md` 或索引表增行）
- [ ] `governance_read_contract_contract_tests` 或 `admin_read_contract_contract_tests` 中最小断言（或 cross-check 槽位强校验，若适用）
- [ ] `READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS` 同步（**仅当**路径为 `/api/v1/governance/*` 或 `/api/v1/admin/*`）

### 验收
- `cargo test -p traveltrust-api` 全绿
- `read_contract_scan_matches_registry` 通过
- `read_contract_router_get_smoke_for_all_registered_paths` 通过（新路径不得 405）
```

---

## 2. Read Contract 文档模板（单端点一节）

在 **`read-contract-governance-read-apis.md`** 或 **`read-contract-admin-read-apis.md`**（或该文件中的「索引表」）增加一节，**表头固定**：

```markdown
## `GET /api/v1/<domain>/...`

| 项 | 声明 |
|----|------|
| **source_kind** | **chain_ssot** \| **projection** \| **reference**（与 `source_kind.rs` 一致；混合只读需分句写清主径/子读） |
| **允许根级 `data_source`（若有）** | 枚举允许值；**reference** 镜像写「必须缺省」；**列表类 projection** 写「通常缺省；禁止根级 `chain_read` 冒充整表 SSOT」 |
| **fallback** | **按 04** 或 **无** |
| **mock** | **否**（若例外必须在 04 声明） |

**CLI 抽样（可选，AI 用）**：

\`\`\`bash
export BASE=http://127.0.0.1:8080
curl -sS "$BASE/api/v1/<...>" | head -c 400
# admin 需：-H "Authorization: Bearer $TOKEN"
\`\`\`
```

**与 `validate_body_matches_source_kind` 对齐时**：在文档中写明「成功体根级或某槽内子 JSON 须通过某 `SourceKind` 机读校验」（如 cross-check 子槽）。

---

## 3. 契约测试模板（Rust，最小增量）

**原则**：只测**只读**响应；**不** import 写接口；优先复用 `api_meta_state`、既有 Query 默认值。

### 3.1 治理公开只读（无鉴权）

文件：`crates/api/src/routes/governance_read_contract_contract_tests.rs`

```rust
#[tokio::test]
async fn read_contract_<slug>_<short>() {
    let st = api_meta_state(None);
    let body = response_json(
        get_<handler>(State(st), /* Query(...) 若需要 */)
            .await
            .into_response(),
    )
    .await;
    // 择一或组合：
    // validate_body_matches_source_kind(SourceKind::Projection, &body, "<label>").unwrap();
    // assert_list_read_no_chain_read_root(&body, "<label>");
    // assert!(body.get("items").is_some());
}
```

### 3.2 管理只读（需 admin）

文件：`crates/api/src/routes/admin_read_contract_contract_tests.rs`

```rust
#[tokio::test]
async fn read_contract_admin_<slug>() {
    let (st, uid) = state_with_admin_user();
    let res = get_admin_<handler>(State(st), /* Query/Path */, admin_auth_headers(uid))
        .await
        .into_response();
    assert_eq!(res.status(), StatusCode::OK); // 或允许 501/503 时在注释中说明并断言允许集
    let body = response_json(res).await;
    assert!(body["meta"]["build"].is_object());
    // assert_no_root_chain_read(&body, "<label>");
}
```

### 3.3 列表类投影（与治理 fee-routes 同禁令）

```rust
assert_list_read_no_chain_read_root(&body, "<label>");
assert!(body.get("items").is_some());
```

**模块已在** `crates/api/src/routes/mod.rs` 中 `#[cfg(test)] mod ...`；新文件才需增一行 mod。

---

## 4. Route Guard 接入清单（`/api/v1/governance/*` 与 `/api/v1/admin/*`）

仅当新接口路径落在上述前缀时执行；**其他前缀**当前 **不在** `read_contract_route_guard` 扫描范围内。

1. **路由注册**  
   - 在对应 `router()` 中使用 `.route("...", get(...))`（或与 `patch/post` 链式但**含** `get(...)`）。  
   - 扫描器只认上述 **8 个文件**之一内的 `.route`：  
     `admin.rs`, `governance.rs`, `governance_proposals.rs`, `governance_investor_share.rs`, `governance_delegate.rs`, `governance_voting_power.rs`, `governance_country_ledger.rs`, `investor_distribution.rs`（`governance_router()` 段）。

2. **注册表**  
   - 在 `read_contract_route_guard.rs` 的常量 **`READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS`** 中**按字母序**插入完整路径模板字符串（含 `:id` 等占位，与 Axum 路由字面量一致）。

3. **本地验证**  
   - `cargo test -p traveltrust-api read_contract_scan_matches_registry -- --nocapture`  
   - 若失败：对比断言中的 `scanned_only` / `registry_only` 差集，修正注册表或路由写法。

4. **GET smoke**  
   - `read_contract_router_get_smoke_for_all_registered_paths` 会对每条注册路径发 GET；**禁止返回 405**。  
   - 若路径含多类参数，需确认 `materialize_read_contract_path` 的替换规则仍适用；不适用时在**同一测试模块**内扩展 `materialize_read_contract_path`（**仅测试代码**）。

5. **Admin 鉴权**  
   - Smoke 对 `/api/v1/admin/*` 自动带 `Bearer bearer_<uid>`；需保证测试 `state` 中该 uid 为 `admin`/`super_admin` 且 `chain_off` 存在（与现有 `admin_router_state` 一致）。

---

## 5. 自检口诀（提交前）

- SourceKind 与根级 `data_source` **不混用**；列表投影 **不**根级 `chain_read`。  
- Read Contract 表已补；契约测试已调用 **GET handler** 或等价体。  
- 治理/管理新 GET 已写入 **`READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS`**。  
- `cargo test -p traveltrust-api` 通过。
