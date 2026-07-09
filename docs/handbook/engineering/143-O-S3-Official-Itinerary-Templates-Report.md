# 143 · O-S3 Official Itinerary Templates Report

> **Sprint**：O-S3 · **Official Itinerary Templates**（M9 · P2 Official OPS）  
> **设计 SSOT**：[135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md) · [101 v2.0 Official §8.3](./101-CMS与内容运营中心实施蓝图.md)  
> **前置**：[142 O-S2 Official Guides](./142-O-S2-Official-Guides-Community-Publishing-Report.md) · [141 O-S1 Official Accounts](./141-O-S1-Official-Accounts-Management-Report.md) · Growth **G-S8 FREEZE**（133）  
> **冻结基准**：[120-S5 Catalog Release Freeze](./120-S5-Catalog-Release-Freeze-Report.md) · [133-G-S8 Growth Freeze](./133-G-S8-Growth-Release-Freeze-Report.md)  
> **日期**：2026-06-08  
> **纪律**：**不修改** `NEXT_PUBLIC_CATALOG_API_ENABLED` · **不碰** 报价主链 · Growth 积分/链上 GOV · 支付 · M10 Campaigns · **不删** `marketDevVarietyOrders`（仅文档声明 Ops 替代路径）  
> **结论**：**O_S3_OFFICIAL_ITINERARY_TEMPLATES_GO**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **模板创建/编辑** | **GO** — CRUD `ops_official_itinerary_templates` |
| **审核发布** | **GO** — submit-review · request-publish · approval · direct publish |
| **Official Account 绑定** | **GO** — `author_account_id` → `ops_official_accounts` |
| **Catalog 国家/城市关联** | **GO** — `country_iso` ↔ `catalog_countries.iso3166` · `city_id` ↔ `catalog_cities` + 一致性校验 |
| **状态流转** | **GO** — `draft → in_review → published → archived` |
| **RBAC** | **GO** — 复用 `admin.official.read/write/publish` |
| **审计日志** | **GO** — `ops.official.itinerary_template.*` → `admin_audit_logs` |
| **Official OPS Hub** | **GO** — Hub 链至 itinerary-templates 子页 · O-S3 copy |
| **冷启动/推荐路线真源** | **GO（Ops 路径）** — `published` + `data_origin=production` 模板为 M10/O-S4 引用 SSOT |

---

## 2. 交付范围（O-S3）

### 2.1 后端

| 模块 | 路径 | 能力 |
|------|------|------|
| DB | `ops_official_itinerary_templates_admin.rs` | list/get/create/patch · workflow · catalog 校验 |
| HTTP | `admin_official_itinerary_templates_http.rs` | `/api/v1/admin/official/itinerary-templates/*` |
| 审批 | `admin/mod.rs` | `ops.itinerary_template.publish` approve handler |

**Admin API 端点（M9）**

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/admin/official/itinerary-templates` | read |
| POST | `/admin/official/itinerary-templates` | write |
| GET/PATCH | `/admin/official/itinerary-templates/:id` | read/write |
| POST | `…/submit-review` · `…/request-publish` · `…/publish` · `…/archive` | write/publish |

**Publish 语义**

- 更新 `ops_official_itinerary_templates`：`publish_status=published` · `data_origin=production` · `published_at`
- 校验绑定 Official Account 活跃 · Catalog 国家/城市引用有效
- **`linked_order_id` / instantiate orders 不在 O-S3 scope**（留待后续 sprint）

### 2.2 前端

| 路由 | 页面 |
|------|------|
| `/admin/official` | Official OPS Hub（O-S3 模块卡 + accounts/guides/templates 链） |
| `/admin/official/itinerary-templates` | 模板列表 · 创建 · 审核 · 发布 · Catalog 关联 |

### 2.3 门禁

| Gate | 命令 |
|------|------|
| O-S3 一键 | `bash scripts/check-o-s3-official-itinerary-templates.sh` |
| Smoke | `bash scripts/dev/smoke-admin-official-itinerary-templates-p0-local.sh` |
| Contract | `frontend/app/admin/official/adminOfficialOs3.contract.test.ts` |
| Playwright | `frontend/e2e/o-s3-official-itinerary-templates.spec.ts` |
| Growth 冻结回归 | `bash scripts/check-g-s8-growth-release-freeze.sh` |
| Catalog 冻结回归 | `bash scripts/check-s5-catalog-release-freeze.sh` |

---

## 3. 边界声明

| 项 | O-S3 变更 | 不变项 |
|----|-----------|--------|
| Admin M9 API/FE | **新增** | M10 cold-start Campaigns **未碰** |
| marketDevVarietyOrders | **Ops 替代路径（文档）** | FE/seed 代码 **未删** |
| Catalog Consumer | **未改** | `ENABLED=0` · 报价主链 |
| Growth / 支付 / GOV | **未改** | 133 冻结 |
| Order instantiate | **未做** | `linked_order_id` 列保留 |

---

## 4. Official OPS 完成度（B 层）

| 模块 | O-S3 后 |
|------|---------|
| M7 Official Accounts | **GO**（O-S1） |
| M8 Official Guides | **GO**（O-S2） |
| M9 Itinerary Templates | **GO** |
| M10 Cold Start | **HOLD**（O-S4） |
| marketDevVarietyOrders ops 替代 | **GO**（Admin publish） |

---

## 5. 下一步

| Sprint | 内容 |
|--------|------|
| **O-S4** | M10 Cold Start preview/deploy/rollback |
| **C-S6** | Consumer opt-in（Catalog 轨，并行） |

**101 路线矩阵**：O-S3 → **GO** · 下一步 **O-S4**
