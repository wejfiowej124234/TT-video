# 139 · C-S4 Catalog Revision & Import Operations Report

> **Sprint**：C-S4 · **Catalog Revision & Import Operations**（破 120 程序 · Admin-only）  
> **设计 SSOT**：[105-S2 Catalog CMS 深度设计 §9](./105-S2-Catalog-CMS深度设计评审.md) · [135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md)  
> **前置**：[138 C-S3 Catalog Operations Admin](./138-C-S3-Catalog-Operations-Admin-Report.md)  
> **冻结基准**：[120-S5 Catalog Release Freeze](./120-S5-Catalog-Release-Freeze-Report.md)（Consumer **未切流**）  
> **日期**：2026-06-08  
> **纪律**：**不修改** `NEXT_PUBLIC_CATALOG_API_ENABLED` 默认 · **不碰** 报价 UI 主链 · Growth/支付/链上 GOV · Official OPS  
> **结论**：**C_S4_CATALOG_REVISION_IMPORT_OPERATIONS_GO**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **revisions UI** | **GO** — list/detail with before/after JSON |
| **revision compare** | **GO** — entity + version A/B side-by-side |
| **import trigger** | **GO** — `POST /import/trigger` → `catalog.import.trigger` approval |
| **import history** | **GO** — `import_batch_id` aggregation across catalog tables |
| **rollback history** | **GO** — `action=rollback` revision rows |
| **rollback action** | **GO** — partial restore (publish_status + payload for country/city/poi) |
| **Catalog parity dashboard** | **GO** — P-01/02/06/08/10/12 DB count checks |
| **Catalog observability** | **GO** — publish breakdown + revision/import stats + parity |
| **Admin 审计** | **GO** — `catalog_content_revisions` + approval audit trail |
| **RBAC** | **GO** — `admin.content.read/write/publish` |
| **FE Content Center** | **GO** — revisions · compare · import-ops · catalog-dashboard |
| **Consumer 默认** | **不变** — `ENABLED=0` |

---

## 2. 交付范围（C-S4）

### 2.1 后端

| 模块 | 路径 | 能力 |
|------|------|------|
| DB | `catalog_revision_ops_admin.rs` | revision detail/compare · rollback · import batches · parity · observability |
| HTTP | `admin_catalog_revision_http.rs` | `/admin/content/revisions/*` · `/import/*` · `/catalog/parity` · `/catalog/observability` |
| 审批 | `admin/mod.rs` | `catalog.import.trigger` approve → audit + CLI hint（**不** subprocess 执行 import） |

**Admin API 端点（105 §Admin · C-S4）**

| 资源 | 端点 |
|------|------|
| 修订列表（含 JSON） | `GET /admin/content/revisions/detail` |
| 修订单条 | `GET /admin/content/revisions/:id` |
| 修订对比 | `GET /admin/content/revisions/compare` |
| 回滚历史 | `GET /admin/content/revisions/rollback-history` |
| 回滚执行 | `POST /admin/content/revisions/rollback` |
| 导入历史 | `GET /admin/content/import/history` |
| 导入触发 | `POST /admin/content/import/trigger` |
| 对拍面板 | `GET /admin/content/catalog/parity` |
| 观测汇总 | `GET /admin/content/catalog/observability` |

### 2.2 前端

| 路由 | 页面 |
|------|------|
| `/admin/content/revisions` | 修订审计列表 |
| `/admin/content/revisions/compare` | 版本对比（before/after JSON） |
| `/admin/content/import-operations` | import trigger · 导入/回滚历史 |
| `/admin/content/catalog-dashboard` | parity + observability 面板 |

### 2.3 门禁

| Gate | 命令 |
|------|------|
| C-S4 一键 | `bash scripts/check-c-s4-catalog-revision-import-operations.sh` |
| Smoke | `bash scripts/dev/smoke-admin-content-catalog-revision-p0-local.sh` |
| Contract | `frontend/app/admin/content/adminContentCs4.contract.test.ts` |
| Playwright | `frontend/e2e/c-s4-catalog-revision-import-operations.spec.ts` |
| Catalog 冻结回归 | `bash scripts/check-s5-catalog-release-freeze.sh` |

---

## 3. 破 120 边界声明

| 项 | C-S4 变更 | 120 不变项 |
|----|-----------|------------|
| Admin revision/import/obs API | **新增** | RO `GET /catalog/*` 语义不变 |
| Import trigger approve | **审计 + CLI 指引** | 不自动跑 `scripts/catalog-import` |
| Parity | **DB count 子集 P-01/02/06/08/10/12** | 非 TS `parity.ts` 全量 P-01..P-16 |
| FE Consumer | **未改** | `ENABLED=0` · TS 报价主链 |
| Growth / Official OPS | **未碰** | 133 / O-S 轨 HOLD |

---

## 4. 运营就绪（B 层）

| 能力 | C-S4 后 |
|------|---------|
| Ops 可查阅 revision 审计与版本对比 | **GO** |
| Ops 可申请 import trigger（审批后 CLI 执行） | **GO** |
| Ops 可查看 import/rollback 历史 | **GO** |
| Ops 可查看 catalog parity 与 publish 分布 | **GO** |
| 公众面自动切 PG 定价/媒体 | **HOLD**（C-S6） |

---

## 5. 已知限制（C-S5 候选）

| 项 | 现状 |
|----|------|
| Import approve 后执行 | 需人工/CI 跑 `scripts/catalog-import/cli.ts` |
| Parity 覆盖 | DB count 子集，非 manifest/index.json 全链路 |
| Rollback 字段 | country/city/poi payload + publish_status；非全表字段 |
| Bulk ops | **C-S5** |

---

## 6. 下一步

| Sprint | 内容 |
|--------|------|
| **C-S5** | bulk ops · 全量 parity · import manifest 读取 |
| **C-S6** | Consumer opt-in 切流 |

**101 路线矩阵**：C-S4 → **GO** · 下一步 **C-S5**
