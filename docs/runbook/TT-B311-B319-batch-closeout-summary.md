# B-311～B-319 批次收官总结（Runbook）

**日期**：2026-04-15  
**范围**：母表 **B-311**～**B-319** 对应 TT 已封口互证；本页为批次级 **索引 + 语义边界 + 结论类型** 汇总，细节仍以各卡专用 runbook 为准。

---

## 1. 批次一览

| 母表 | TT 卡号（节选） | 主规格 / 主题 | 封口形态 | 专用 Runbook / 产物 |
|------|-----------------|---------------|----------|---------------------|
| **B-311** | `TT-B311-87-USERS-ROLE-PREFLIGHT-INVENTORY-001` | **87** · `users.role` 迁移前只读盘点 | **只读 SQL + Runbook**（不改 DDL/枚举） | [`users-role-preflight-inventory.md`](./users-role-preflight-inventory.md) · [`scripts/sql/users_role_preflight_inventory.sql`](../../scripts/sql/users_role_preflight_inventory.sql) |
| **B-312** | `TT-B312-88-FIVE-ROUTES-SHELL-UX-MATRIX-AUDIT-001` | **88 / 86** · 五主路由壳层 Loading 与矩阵 | **只读审计**（**0** 实现 diff） | [`TT-B312-five-routes-shell-ux-matrix-audit.md`](./TT-B312-five-routes-shell-ux-matrix-audit.md) |
| **B-313** | `TT-B313-70-ADMIN-RBAC-04-ROUTE-DELTA-TABLE-001` | **70 / 04** · Admin 路由与 RBAC 叙事对拍 | **审计 + `traveltrust-api` 实现收口** | [`TT-B313-70-admin-rbac-04-route-delta-table.md`](./TT-B313-70-admin-rbac-04-route-delta-table.md) |
| **B-314** | `TT-B314-04-INTERNAL-REQUIRE-REFS-GATE-DOC-001` | **04** · internal 场景元数据门禁 | **docs-only**（纪律句登记） | [`TT-B314-04-internal-require-refs-gate-doc.md`](./TT-B314-04-internal-require-refs-gate-doc.md) |
| **B-315** | `TT-B315-53-ORDER-TERMINAL-VS-ESCROW-SSOT-001` | **53 / 04 / 14** · 订单终端态 vs Escrow | **docs-only 审计** | [`TT-B315-53-order-terminal-vs-escrow-ssot-audit.md`](./TT-B315-53-order-terminal-vs-escrow-ssot-audit.md) |
| **B-316** | `TT-B316-14-ABI-FORGE-SYNC-ANTI-DRIFT-HINT-001` | **14** · ABI forge 同步防 drift | **docs-only**（流程提示登记） | [`TT-B316-14-abi-forge-sync-anti-drift-hint.md`](./TT-B316-14-abi-forge-sync-anti-drift-hint.md) |
| **B-317** | `TT-B317-83-84-COUNTRY-LEDGER-PROJECTION-GLOSSARY-001` | **83/84** vs **110** · Country Ledger 与投影 | **docs-only**（Glossary） | [`TT-B317-83-84-country-ledger-projection-glossary.md`](./TT-B317-83-84-country-ledger-projection-glossary.md) |
| **B-318** | `TT-B318-FEE-ROUTER-INTERNAL-EXPORT-FIELD-GLOSSARY-001` | FeeRouter · internal 导出与 admin 边界 | **docs-only**（Glossary） | [`TT-B318-fee-router-internal-export-field-glossary.md`](./TT-B318-fee-router-internal-export-field-glossary.md) |
| **B-319** | `TT-B319-FRONTEND-429-RETRY-04-ALIGNMENT-001` | 前端 **429** 与 **04 / 53 / 13-1** 对齐 | **docs-only**（登记） | [`TT-B319-frontend-429-retry-04-alignment-audit.md`](./TT-B319-frontend-429-retry-04-alignment-audit.md) |

**互证索引**：[`docs/AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md) 一览 **321～329** 与各 `### TT-B31x...` 节。

---

## 2. 已对齐的语义边界（归纳）

### 2.1 角色与数据迁移（B-311）

- **允许集真值**以 `crates/api/src/routes/admin/mod.rs` 中 **`is_supported_target_role`** 为 SSOT；只读 SQL 的 `NOT IN` 列表须与其 **同批维护**。
- **本批不收紧**：不改 `users.role` 的 DEFAULT/CHECK/应用枚举；DDL 与兼容期 **另开 TT**。

### 2.2 五主路由壳层 UX（B-312）

- **壳层** = layout + 段级 `loading.tsx` + Suspense；**不含**子页业务空态全文（**88 §3.2** 另卡）。
- **86 纪律**：`loading` 仅骨架类表现，**不**承载营销级粒子/R3F；全量 Experience 装饰留在成功态 layout/page。
- **`/` home loading**：相对 **88** 为 **可接受差分**（符合 **86**）；若要强对齐 **88** 点阵连续，须单开实现 TT + **07** 口径。

### 2.3 Admin 契约、证据路径与 RBAC 叙事（B-313）

- **HTTP 路径应然**：**04 §3.5**；**实然**：**`admin::router()`**（`crates/api/src/routes/admin/mod.rs`）。
- **70 内部**：模块清单 **§三** 与 **§3.1** 矩阵冲突时，**70** 自述「事实 > 目标描述」优先；**Job/Scheduler** 行已与代码挂载对齐登记。
- **RBAC**：**04** 表行普遍要求 **`admin` / `super_admin`** 最小门禁；**六域细粒度角色**仍为 **Target**，与「路由是否挂载」正交。

### 2.4 元数据门禁（B-314）

- 涉及 **`crates/api/src/routes/internal/**`** 或 **`scripts/gates/**`** 的改动：建议 **`CRATES_METADATA_GATE_REQUIRE_REFS=1`** 执行门禁，且 **BASE/HEAD 显式可解析**，避免静默跳过。

### 2.5 订单与 Escrow（B-315）

- **53 / 04 / 14** 在订单主状态与 Escrow 资金终态上 **同轨**；争议后资金终态语义一致。
- **`POST …/confirm-completion`** 为链下进度确认，**非**单笔放款动作。

### 2.6 ABI 与 forge 同步（B-316）

- **`contracts/abi`** 为 ABI 单源；**`frontend/dapp/abis`** 同步并受检查约束。
- 运维顺序入口：**`ops/RUNBOOK.md`** §12.4（`sync-abi-from-forge` → `check-55-s13` → Contract ABI Gate）；本卡 **不**新增 gate、**不**改脚本判定。

### 2.7 Country Pool 叙事 vs 链上投影（B-317）

- **83/84**：业务/参数与协议叙事层；**110**：索引与运维对账投影层 — **互补非替代**。
- **`economic_projection_row_counts`** 等为运维观察值，**不等同** Snapshot/Claim 终局；终局能力见 **83** 附录目标态。

### 2.8 FeeRouter 字段与路由边界（B-318）

- **public**：`GET /api/v1/governance/fee-routes`（公开契约，不承载 admin 导出语义）。
- **admin / 导出**：`…/admin/fee-router/routed-events` 及 **export**；漂移观测键 **不改** public 契约形状。

### 2.9 429 与前端错误契约（B-319）

- **04** 机器键：`rate_limit_exceeded` / `critical_write_rate_limit_exceeded`；前端 **不自造** 第二套错误码体系。
- **53**：失败可恢复（重试/返回）；**13-1**：异常态 i18n 映射，禁止裸显后端键名。

---

## 3. 「无差分 / docs-only」结论（批次共性）

| 结论类型 | 涉及卡 | 说明 |
|----------|--------|------|
| **实现零 diff（只读审计）** | **B-312** | 五主路由壳层矩阵对拍完成，**未**改 `frontend/app/**/page.tsx` 业务逻辑。 |
| **docs-only 封口** | **B-314～B-319**（及 **B-316** 全卡） | 补登记、Glossary、纪律句或对齐说明；**不**改 `crates/**` 业务实现（**B-314** 明确不增删 **04** §3.4/§3.5 表行）。 |
| **叙事/契约无 Happy Path 改造需求** | **B-315** | 终端态与 Escrow 未发现需立即改实现的缺口。 |
| **ABI 流程已互指、无新增契约差分** | **B-316** | 以 **14**/**04**/**07** 既有互指与 RUNBOOK 顺序为准。 |
| **429 对齐以文档登记收口** | **B-319** | 退避/错误包说明已登记；**分桶 admin/public** 叙事承接到 **B-354**（见母表/索引）。 |

---

## 4. 触发过的实现修复与验收（典型：B-313）

本批次中 **唯一以「契约漂移闭合」为主线的代码轮** 为 **B-313**（其余为只读 SQL、只读前端审计或纯文档）。

| 项 | 内容 |
|----|------|
| **P0 差分** | **04 §3.5** 已列 **`GET /api/v1/admin/observability/alert-rules`**；需在 **`router()`** 挂载并与 **overview** 的 **`observability_alerting_v1.rules_config`** 同源装配。 |
| **实现收口** | **`get_admin_observability_alert_rules`** 已挂载；**`rules_view`** 与 **`GET …/observability/overview`** 内 **`observability_alerting_v1`** 同源；**`read_contract`** 路径登记（**`READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS`** 等）与 **04/70** 证据路径统一为 **`crates/api/src/routes/admin/mod.rs`**。 |
| **验收命令（卡面登记）** | `cargo test -p traveltrust-api`；`bash scripts/run-check-04-routes.sh` **exit 0**。 |

**B-311** 非「缺陷修复」，而是 **交付物**：可复跑只读 SQL + Runbook，供迁移前存档；**87** §11.1.1 机读表互证。

---

## 5. 运维与后续衔接（Runbook 提示）

- **迁移前**：对目标库执行 **B-311** SQL，第二节非允许集 **须为空** 或已登记豁免策略。
- **Admin 变更**：以 **04 §3.5** + **`admin/mod.rs`** 双源对拍；大表逐项机读对拍可拆 **B-xxx**。
- **internal / gate 改动**：遵守 **B-314** `REQUIRE_REFS` 执行纪律。
- **五主路由首页级 Empty 与 88 §3.2 逐条对拍**：勿与 **B-347** 断点审计混为单卡（见 **B-312** runbook 与 from-stash 互指）。
- **429 分桶与限流文档**：**B-354** 承 **B-319** 叙事。

---

## 6. 本页用途

- **批次复盘**：一屏看清 **311～319** 的主题簇、文档 vs 代码、以及 **B-313** 实现特例。
- ** onboard**：新成员从本页跳转各 **TT-B31x-*.md** 读证据与边界。
- **门禁**：不替代 **母表**、**04** 契约表或 **cargo test**；细节以专用 runbook 与代码为准。
