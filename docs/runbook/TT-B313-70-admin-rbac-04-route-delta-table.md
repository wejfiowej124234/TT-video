# TT-B313 · 70 叙事 / RBAC 与 04 Admin 路由及 `admin::router` 挂载差分审计

**卡号**：`TT-B313-70-ADMIN-RBAC-04-ROUTE-DELTA-TABLE-001` · **母表** `B-313`  
**日期**：2026-04-15  
**范围**：**只读**对拍 **[70](../spec/70-管理员系统开发文档.md)**（运营后台叙事、RBAC、模块清单与 §3.1 矩阵）、**[04 §3.5 Admin API](../spec/04-后端与API.md)**（**「3.5 Admin API（对齐 70 收口）」** 小节；契约表与「当前基线证据」段）、**`crates/api/src/routes/admin/mod.rs`** 的 **`router()`** 挂载；**不**改 **04** 契约表正文、**不**补实现路由（若需实现或改 **04** 状态列，须另开 **TT** 并遵守 **母表 → TT → 代码**）。

**本轮仅读文件清单（≤8）**

| # | 路径 |
|---|------|
| 1 | `docs/spec/70-管理员系统开发文档.md`（读前摘要、§二 RBAC、§三 模块表、§3.1 矩阵） |
| 2 | `docs/spec/04-后端与API.md`（§3.5 Admin API 表行、「当前基线证据」长段） |
| 3 | `crates/api/src/routes/admin/mod.rs`（`pub fn router()` 内 `.route("/api/v1/admin/…"` 清单） |
| 4 | `crates/api/src/routes/mod.rs`（`merge(admin::router())` 挂载上下文） |
| 5 | `docs/spec/87-TravelTrust-角色体系技术文档-融合架构版.md`（与 **70** §二 **域隔离** 互证句；本轮不展开 **87** 全表） |

---

## 1. 权威层级（本轮结论依赖）

| 主题 | 单源（70 读前摘要） | 本轮用法 |
|------|---------------------|----------|
| **Admin HTTP 路径** | **04 §3.5** | 契约表与证据段为「应然」；**实然**以 **`admin/mod.rs`** **`router()`** 为准 |
| **70 模块清单 / §3.1** | 本文 **§三 / §3.1** | 与 **04** 或代码冲突时，**70** 自述「事实 > 目标描述」优先 |

---

## 2. 04 契约 vs 代码挂载（高信号差分）

### 2.1 **`GET /api/v1/admin/observability/alert-rules`（已收口 · 2026-04-15）**

| 方法+路径（04 §3.5） | 04 状态列（摘要） | `admin/mod.rs` |
|----------------------|-------------------|----------------|
| **GET** `/api/v1/admin/observability/alert-rules` | Implemented（只读）；审计键 `admin.observability.alert_rules.read` | **`router()`** 已挂载 **`get_admin_observability_alert_rules`**；**`rules_view`** 与 **`GET …/observability/overview`** 内 **`observability_alerting_v1.rules_config`** 同源装配（**`admin_observability_alert_rules_config`**） |

**结论（复核）**：**B-313** 登记差分已由 **实现路由** + **overview 增补 `observability_alerting_v1`** 闭合；**04 / 70** 证据路径已改为 **`crates/api/src/routes/admin/mod.rs`**。

### 2.2 **04「当前基线证据」与实现路径文件名** — **已修正**

- **04 / 70** 证据路径已统一为 **`crates/api/src/routes/admin/mod.rs`**（`routes/mod.rs`：**`mod admin;`** + **`merge(admin::router())`**）。

---

## 3. **70** 叙事内部一致性（§三 模块表 vs §3.1 矩阵）— **2026-04-15 复核**

| 维度 | **70 §三**（模块清单「代码证据」列） | **70 §3.1**「Job/Scheduler 管控面」行 | **`admin/mod.rs`** |
|------|----------------------------------------|--------------------------------------|----------------------|
| **异步任务（250）** | **Partial**；**`GET …/admin/jobs`** 已挂载；250 文档级全链路仍 **Target** | **Partial**（与 **§三** 一致） | **`GET /api/v1/admin/jobs`** |
| **Scheduler（260）** | **Partial**；**`GET …/scheduler/jobs`** + **`POST …/rerun`** 已挂载；260 文档级全链路仍 **Target** | **Partial**（与 **§三** 一致） | **`GET …/scheduler/jobs`**、**`POST …/rerun`** |

**结论**：**§三** 与 **§3.1**、**`router()`** 已 **对齐**（见 **70** 本轮修订）。

---

## 4. RBAC（70 §二 vs 实现面）— 登记口径

| **70** | 代码事实（本轮不展开 handler 内逐条 audit key） |
|--------|--------------------------------------------------|
| **SuperAdmin / Ops / CS / Risk / Finance / Auditor** 六域角色与 **§2.2～2.3** 阶段域映射（250/260/270） | **70 §3.1** 已写明：当前为 **`admin` / `super_admin`** **最小门禁**；完整六角色 **未**落地 |
| **04 §3.5** 表行普遍要求 **`admin` 或 `super_admin`** | 与 **70**「最小门禁」一致；**与** **87** 前台四类角色 **命名空间隔离** 见 **70** 读前摘要表 |

**结论**：**RBAC「差分」** 主要是 **目标态角色矩阵 vs 二元 admin 角色**；路由层已大量挂载 **community / finance / jobs** 等，**细粒度 ABAC** 仍以 **70**/**530** 等为 **Target**，与本卡「路由是否挂载」正交。

---

## 5. **已挂载 Admin 路径索引（真值 · 摘自 `router()`）**

下列路径均在 **`crates/api/src/routes/admin/mod.rs`** **`router()`** 内 **`.route`** 出现（**GET/POST/PATCH** 混合；完整方法以源码为准）：

`users`、`users/:id`、`users/:id/role-change-request`、`guides`、`guides/:id`、`orders`、`orders/:id`、`finance/summary`、`finance/summary/export`、`fee-router/routed-events`、`region-vault/forwarded-events`、`region-vault/forwarded-events/export`、`schema/migrations`、`disputes`、`disputes/:id`、`reviews`、`reviews/:id`、`observability/overview`、`alerts/incidents/:id`、`audit/operations`、`indexer/health`、`indexer/reconcile-report/:id`、`indexer/reconcile-reports`、`indexer/reconcile-reports/export`、`audit-logs`、`audit-logs/:id`、`approvals`、`approvals/:id`、`approvals/:id/approve`、`flags`、`flags/:id/publish`、`secrets/metadata`、`config/releases`、`config/releases/:id`、`jobs`、`scheduler/jobs`、`scheduler/jobs/:job_code/rerun`、`api-versions`、`lifecycle/state-machines`、`policies`、`policies/:id/publish`、`tenants/scopes`、`tenants/scopes/:id/publish`、`compliance/data-requests` 系列、`internal-tools/audits`、`media/access-logs`、`media/signed-url-tokens`、`community/*`（多行）、`cross-check`、`drift-summary`。

（**04** §3.5 大表与上列 **逐项** 对拍可作为后续 **机读脚本** 或 **B-xxx** 任务；本卡已覆盖 **P0** 契约/叙事 **漂移** 与 **§三↔§3.1** 矛盾。）

---

## 6. 索引与母表

- **母表**：[`docs/任务母表.md`](../任务母表.md) **B-313**  
- **执行索引**：[`docs/AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md) 一览 **323** · **`### TT-B313-70-ADMIN-RBAC-04-ROUTE-DELTA-TABLE-001`**

---

## 7. 验收（本卡 · 含 **B-313** 实现收口复核）

- **§2**：**`GET …/observability/alert-rules`** 已在 **`router()`** 挂载，且 **`rules_view`** 与 **overview `rules_config`** 同源。  
- **§3**：**70** **§三** **↔** **§3.1** **Job/Scheduler** 行已与 **`admin/mod.rs`** 对齐。  
- **§4**：**RBAC** **目标 vs 二元角色** **登记** 仍有效（细粒度角色另卡）。  
- **实现轮**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** **exit** **0**。
