# 138 · C-S3 Catalog Operations Admin Report

> **Sprint**：C-S3 · **Catalog Operations Admin**（破 120 程序 · Admin-only）  
> **设计 SSOT**：[105-S2 Catalog CMS 深度设计 §9](./105-S2-Catalog-CMS深度设计评审.md) · [135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md)  
> **前置**：[137 C-S2 POI Media Review](./137-C-S2-POI-Media-Review-Workflow-Report.md)  
> **冻结基准**：[120-S5 Catalog Release Freeze](./120-S5-Catalog-Release-Freeze-Report.md)（Consumer **未切流**）  
> **日期**：2026-06-08  
> **纪律**：**不修改** `NEXT_PUBLIC_CATALOG_API_ENABLED` 默认 · **不碰** 报价 UI 主链 · Growth/支付/链上 GOV · Official OPS  
> **结论**：**C_S3_CATALOG_OPERATIONS_ADMIN_GO**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **pricing-templates** | **GO** — list/patch + submit/publish/archive/request-publish（C-S1 增强） |
| **intercity-routes** | **GO** — list/patch + 完整 workflow + request-publish |
| **hotel-tiers** | **GO** — list/get/patch + workflow + approval |
| **transport-region-rules** | **GO** — list/get/patch + workflow + approval |
| **media-assets** | **GO** — list/get/create/patch + workflow + approval |
| **landing-ambient** | **GO** — GET/PATCH country `payload.landing_ambient` |
| **publish-queue** | **GO** — hotel tiers · transport rules · media assets 并入 |
| **审批 `catalog.entity.publish`** | **GO** — 新实体类型扩展 |
| **审计 `catalog_content_revisions`** | **GO** — create/update/workflow/landing_ambient |
| **RBAC** | **GO** — `admin.content.read/write/publish` |
| **FE Content Center** | **GO** — 四新子页 + 侧栏/Hub |
| **Consumer 默认** | **不变** — `ENABLED=0` |

---

## 2. 交付范围（C-S3）

### 2.1 后端

| 模块 | 路径 | 能力 |
|------|------|------|
| DB | `catalog_ops_admin.rs` | hotel tiers · transport rules · media assets · landing ambient |
| HTTP | `admin_catalog_ops_http.rs` | `/api/v1/admin/content/hotel-tiers/*` 等 |
| 扩展 | `catalog_admin.rs` | publish-queue · approval entity types |
| 增强 | `admin_content_http.rs` | pricing/routes request-publish · archive |

**Admin API 端点（105 §Admin）**

| 资源 | 端点前缀 |
|------|----------|
| 国家定价 | `/admin/content/pricing-templates/*`（增强） |
| 城际交通 | `/admin/content/intercity-routes/*`（增强） |
| 酒店档次 | `/admin/content/hotel-tiers/*` |
| 区域交通 | `/admin/content/transport-region-rules/*` |
| 媒体库 | `/admin/content/media-assets/*` |
| Landing 氛围 | `/admin/content/countries/:id/landing-ambient` |

### 2.2 前端

| 路由 | 页面 |
|------|------|
| `/admin/content/hotel-tiers` | 三档 hotel tier 列表 |
| `/admin/content/transport-region-rules` | 十国区域交通默认 modes |
| `/admin/content/media-assets` | 媒体库（含 landing_ambient） |
| `/admin/content/landing-ambient` | 各国 Landing 氛围一览 |

### 2.3 门禁

| Gate | 命令 |
|------|------|
| C-S3 一键 | `bash scripts/check-c-s3-catalog-operations-admin.sh` |
| Smoke | `bash scripts/dev/smoke-admin-content-catalog-ops-p0-local.sh` |
| Contract | `frontend/app/admin/content/adminContentCs3.contract.test.ts` |
| Playwright | `frontend/e2e/c-s3-catalog-operations-admin.spec.ts` |
| Catalog 冻结回归 | `bash scripts/check-s5-catalog-release-freeze.sh` |

---

## 3. 破 120 边界声明

| 项 | C-S3 变更 | 120 不变项 |
|----|-----------|------------|
| Admin Operations API | **新增/增强** | RO `GET /catalog/*` 语义不变 |
| FE Consumer | **未改** | `ENABLED=0` · TS 报价主链 |
| Growth / Official OPS | **未碰** | 133 / O-S 轨 HOLD |

---

## 4. 运营就绪（B 层）

| 能力 | C-S3 后 |
|------|---------|
| Ops 可 Admin 编辑定价/交通/酒店/媒体/Landing | **GO** |
| publish-queue 统一聚合 Operations 实体 | **GO** |
| 公众面自动切 PG 定价/媒体 | **HOLD**（C-S6） |

---

## 5. 下一步

| Sprint | 内容 |
|--------|------|
| **C-S4** | revisions UI · import trigger · 对拍面板 |
| **C-S6** | Consumer opt-in 切流 |

**101 路线矩阵**：C-S3 → **GO** · 下一步 **C-S4**
