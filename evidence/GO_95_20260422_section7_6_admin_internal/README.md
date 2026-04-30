# GO_95 · §7.6 · Admin 与 internal · 域级审计

**日期**：2026-04-22  
**范围**：**`95` §7.6** 三行；**不**替代 **70** 全文深测、**93** Admin 全矩阵、**140** 网关/外网探测留痕、**F-030** 行完成。

## 1. 非 admin 调 admin API 全拒

**真值**：

- **`crates/api/src/routes/admin/mod.rs`** **`require_admin_actor`**：先会话用户，再 **`chain_off` 内 `users[uid].role`**；**非** `admin`/`super_admin` → **403** **`admin_required`**（注释链 **70** 最小收口）。
- **`read_contract_route_guard`** 与 **04 §3.5** 对拍由仓库 **`run-check-04-routes.sh`** 保证。

**机读**：

```bash
cargo test -p traveltrust-api routes::admin::tests
# test result: ok. 172 passed
```

- 子集：大量 **`admin_*_forbidden_for_non_admin*`** / **`_forbidden_for_non_admin_actor`**（**`tests.rs`** 内 **`assert_eq!(body["error"], "admin_required")`** 等）。

**不闭边界**：**未**在本文逐 route 证明 **100%** 行均走 `require_admin_actor` — 以 **静态 gate 函数 + 172 条板测绿 + 04 闸** 为域级闭证；若发现旁路需 **开 §9**。

## 2. admin 写审计可查

**真值**：

- **PG 表落点**：**`db/admin/audit_and_lists.rs`** **`insert_admin_audit_log`** / **`list_admin_audit_logs`** / **`fetch_admin_audit_log_by_id`**（**`admin_audit_logs`**）。
- **写路径**：**`write_admin_audit_log_best_effort`**（**`admin/mod.rs`**）— 在多数 admin 变更加 **best-effort** 行；**读路径**：**`GET /api/v1/admin/audit-logs`**、**`GET …/admin/audit/operations`**、**`GET …/admin/audit-logs/:id`**（路由表见 **admin/mod.rs** `merge` 附近）。

**机读**：同上 **`routes::admin::tests`**（含 **audit-operations**/**audit-log by id**/**forbidden** 等用例子集），**不**在此展开为 **PG·IT 全量**（须 **`DATABASE_URL`** 时行级对拍，归 **§8.2**/**ISS**）。

## 3. `INTERNAL_API_SECRET`、**`/api/v1/internal/`** 与 **140 / R-002**

**中间件**：

- **`crates/api/src/middleware/auth_pause_metrics/mod.rs`** **`internal_api_secret_gate_layer`**：路径前缀 **`/api/v1/internal/`**；**`INTERNAL_API_SECRET`** 非空时须 **`X-Internal-Api-Secret`** 等值，否则 **403** **`internal_api_forbidden`**；**未设 secret** 时**不**拦截（与 **`internal/common.rs`** **`internal_operator_secret_required_response`** 注释：Release 纵深、部分 internal 在 **not(test)** 下另要求 **503** 缺密钥 等，分轨）。

- **`crates/api/src/router.rs`** 全站 **` .layer(from_fn(internal_api_secret_gate_layer))`**（在进 **`api_router()`** 之前）。

**`GET /meta`**： **`internal_api_secret_configured`**（**`health_meta/handlers.rs`**，与 **§7.3** 机读可互证）。

**机读**：

```bash
cargo test -p traveltrust-api internal_gate_tests
# 6 passed (middleware::auth_pause_metrics::tests::internal_gate_tests::...)
```

**文档对读**：

- **[140](../../docs/spec/140-阶段开发云部署与交付架构.md)**：**`/api/v1/internal/*` 禁止公网直连**、**internal 边界**、**`internal-drill-gate.yml`** 等（**Partial** 仍见 140 表 — **不**用本文单独宣称「网关已上生产」）。
- **[R-002](../../docs/spec/R-002-回归执行闭环与发布准入.md)**：Indexer/internal 对用户域 **N/A** 叙述（与 **93** 一致）。

**不闭边界**：**WAF/网关 ACL** 级 **外网 403** 以 **140** 证据包（**`internal_external_probe.log`** 等）为准；**本包** 仅为 **应用层 `INTERNAL_API_SECRET` + 头** 子证。

## 4. 机读复跑（登记日）

```bash
cargo test -p traveltrust-api internal_gate_tests
# 6 passed
cargo test -p traveltrust-api routes::admin::tests
# 172 passed
bash scripts/run-check-04-routes.sh
# exit 0
```

**`python -c`（**`95` §0.2** 同批）**：`round(100*((15/33)+(37/78)+(1/22))/4)` → **24**
