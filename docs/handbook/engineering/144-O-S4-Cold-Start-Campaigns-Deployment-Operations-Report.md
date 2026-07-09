# 144 · O-S4 Cold Start Campaigns & Deployment Operations Report

> **Sprint**：O-S4 · **Cold Start Campaigns & Deployment Operations**（M10 · P2 Official OPS）  
> **设计 SSOT**：[135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md) · [101 v2.0 Official §8.3](./101-CMS与内容运营中心实施蓝图.md)  
> **前置**：[143 O-S3 Itinerary Templates](./143-O-S3-Official-Itinerary-Templates-Report.md) · [142 O-S2](./142-O-S2-Official-Guides-Community-Publishing-Report.md) · [141 O-S1](./141-O-S1-Official-Accounts-Management-Report.md) · Growth **G-S8 FREEZE**（133）  
> **冻结基准**：[120-S5 Catalog Release Freeze](./120-S5-Catalog-Release-Freeze-Report.md) · [133-G-S8 Growth Freeze](./133-G-S8-Growth-Release-Freeze-Report.md)  
> **日期**：2026-06-08  
> **纪律**：**不修改** `NEXT_PUBLIC_CATALOG_API_ENABLED` · **不碰** 报价主链 · Growth 积分/链上 GOV · 支付 · **不实现** `referral_code` item（Growth 冻结）  
> **结论**：**O_S4_COLD_START_CAMPAIGNS_DEPLOYMENT_OPERATIONS_GO**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **Campaign CRUD** | **GO** — `ops_cold_start_campaigns` |
| **Surface 配置** | **GO** — `surfaces TEXT[]` Admin 编辑 |
| **Deploy/Rollback** | **GO** — deploy · rollback · `deployed_at` / `rolled_back_at` |
| **发布状态流转** | **GO** — `publish_status`: draft → in_review → published → archived |
| **Deploy 状态** | **GO** — `status`: draft → in_review → deployed → rolled_back → archived |
| **Official Account / Template 关联** | **GO** — `ops_cold_start_items` item_type 校验 |
| **RBAC** | **GO** — 复用 `admin.official.read/write/publish` |
| **审批** | **GO** — `ops.cold_start.deploy` |
| **审计日志** | **GO** — `ops.cold_start.*` → `admin_audit_logs` |
| **Official OPS Hub** | **GO** — Hub 链至 cold-start 子页 · O-S4 copy |
| **env/seed 替代** | **GO（Ops 路径）** — Admin Campaign 为 prod 冷启动真源 |

---

## 2. 交付范围（O-S4）

### 2.1 后端

| 模块 | 路径 | 能力 |
|------|------|------|
| DB | `ops_cold_start_campaigns_admin.rs` | Campaign CRUD · items · deploy/rollback · approval |
| HTTP | `admin_cold_start_http.rs` | `/api/v1/admin/official/cold-start/campaigns/*` |
| 审批 | `admin/mod.rs` | `ops.cold_start.deploy` approve handler |

**Admin API 端点（M10）**

| 方法 | 路径 | 权限 |
|------|------|------|
| GET/POST | `/admin/official/cold-start/campaigns` | read/write |
| GET/PATCH | `…/campaigns/:id` | read/write |
| POST | `…/submit-review` · `…/request-deploy` · `…/deploy` · `…/rollback` · `…/archive` | write/publish |
| POST/DELETE | `…/campaigns/:id/items` · `…/items/:item_id` | write |

**Item 类型（O-S4 scope）**

| item_type | 校验 |
|-----------|------|
| `official_account` | `ops_official_accounts.id` 存在 |
| `itinerary_template` | 已 `publish_status=published` |
| `guide_post` | 已 `publish_status=published`（API 支持 · FE 可选） |

**Deploy 语义**

- `deploy`：`publish_status=published` · `status=deployed` · items `pending→active`
- `rollback`：`status=rolled_back` · items `active→rolled_back`（`publish_status` 保持 published）
- **未写** Growth `referral_codes` · **未改** env 变量读取逻辑

### 2.2 前端

| 路由 | 页面 |
|------|------|
| `/admin/official` | Official OPS Hub（O-S4 全模块卡） |
| `/admin/official/cold-start` | Campaign 列表 · 创建 · Surface · Items · Deploy/Rollback |

### 2.3 门禁

| Gate | 命令 |
|------|------|
| O-S4 一键 | `bash scripts/check-o-s4-cold-start-campaigns-deployment-operations.sh` |
| Smoke | `bash scripts/dev/smoke-admin-official-cold-start-p0-local.sh` |
| Contract | `frontend/app/admin/official/adminOfficialOs4.contract.test.ts` |
| Playwright | `frontend/e2e/o-s4-cold-start-campaigns-deployment-operations.spec.ts` |
| Growth 冻结回归 | `bash scripts/check-g-s8-growth-release-freeze.sh` |
| Catalog 冻结回归 | `bash scripts/check-s5-catalog-release-freeze.sh` |

---

## 3. 边界声明

| 项 | O-S4 变更 | 不变项 |
|----|-----------|--------|
| Admin M10 API/FE | **新增** | Consumer FE env 读取代码 **未删** |
| env 矩阵 | **Ops 替代路径（文档）** | `NEXT_PUBLIC_*` dev 机制 **保留** |
| Growth referral_code item | **未实现** | 133 Growth 冻结 |
| Catalog Consumer | **未改** | `ENABLED=0` · 报价主链 |
| 支付 / 链上 GOV | **未改** | — |

---

## 4. Official OPS 完成度（B 层）

| 模块 | O-S4 后 |
|------|---------|
| M7 Official Accounts | **GO**（O-S1） |
| M8 Official Guides | **GO**（O-S2） |
| M9 Itinerary Templates | **GO**（O-S3） |
| M10 Cold Start | **GO** |
| P2 Official OPS 全轨 | **GO**（O-S1～O-S4） |

---

## 5. 下一步

| Sprint | 内容 |
|--------|------|
| **C-S6** | Consumer opt-in（Catalog 轨） |
| **Post-O-S** | public_catalog_surface Admin 面板 · Consumer 读 deployed campaigns（可选） |

**101 路线矩阵**：O-S4 → **GO** · Official OPS **M7–M10 全 GO**
