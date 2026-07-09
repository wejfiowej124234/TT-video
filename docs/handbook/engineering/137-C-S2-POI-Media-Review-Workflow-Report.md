# 137 · C-S2 POI Media Review Workflow Report

> **Sprint**：C-S2 · **M6 POI 图审核闭环**（破 120 程序 · Admin-only）  
> **设计 SSOT**：[105-S2 Catalog CMS 深度设计 §7.3](./105-S2-Catalog-CMS深度设计评审.md) · [135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md)  
> **前置**：[136 C-S1 Admin Content CRUD](./136-C-S1-Admin-Content-CRUD-PublishQueue-Report.md)  
> **冻结基准**：[120-S5 Catalog Release Freeze](./120-S5-Catalog-Release-Freeze-Report.md)（Consumer **未切流**）  
> **日期**：2026-06-08  
> **纪律**：**不修改** `NEXT_PUBLIC_CATALOG_API_ENABLED` 默认 · **不碰** 报价 UI 主链 · Growth/支付/链上 GOV  
> **结论**：**C_S2_POI_MEDIA_REVIEW_WORKFLOW_GO**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **Admin `/api/v1/admin/content/poi-image-batches/*`** | **GO** — list · detail · candidates · select · workflow |
| **候选审核** | **GO** — PATCH candidate approve/reject · POST select winner per POI |
| **发布状态流转** | **GO** — batch `draft/generating → review → published` |
| **审批 `catalog.poi_image.publish`** | **GO** — request-publish + `/admin/approvals` approve 路径 |
| **publish-queue** | **GO** — `poi_image_review_pending` 并入 in_review 聚合 |
| **审计 `catalog_content_revisions`** | **GO** — select · approve/reject · submit_review · publish |
| **RBAC** | **GO** — `admin.content.read/write/publish` 接线 |
| **FE Admin 页** | **GO** — `/admin/content/poi-images` · `/batches/[id]` |
| **Consumer 默认** | **不变** — `ENABLED=0` · 120 回退策略维持 |
| **B 层运营** | **部分 GO** — CMS Admin MVP（C-S1 + C-S2）· Official 仍 HOLD |

---

## 2. 交付范围（C-S2）

### 2.1 后端

| 模块 | 路径 | 能力 |
|------|------|------|
| DB | `crates/api/src/db/catalog_poi_media_admin.rs` | batch 列表/详情 · candidate 审核 · select · publish · approval |
| HTTP | `crates/api/src/routes/admin/admin_poi_media_http.rs` | M6 Admin API |
| 审批 | `mod.rs` · `catalog.poi_image.publish` | approve → `catalog_poi_images_published` upsert |
| publish-queue | `catalog_admin.rs` | M6 batch `status=review` 并入队列 |

**批次状态机（105 §7.3 · DDL）**：`draft → generating → review → published → archived`

| 动作 | Permission | 端点 |
|------|------------|------|
| 列表/详情/候选 | `content.read` | GET poi-image-batches/* |
| 审核/选定 | `content.write` | PATCH candidates · POST select |
| submit-review | `content.write` | POST …/submit-review |
| publish | `content.publish` | POST …/publish |
| request-publish | `content.write` | POST …/request-publish → approval |

**发布写入**：approved candidates → `catalog_poi_images_published`（含 `approved_candidate_id` · scene/license 字段）

### 2.2 前端

| 路由 | 页面 |
|------|------|
| `/admin/content/poi-images` | M6 批次列表 · 覆盖进度 |
| `/admin/content/poi-images/batches/[id]` | 候选对比 · select · approve/reject · 发布动作 |

### 2.3 门禁

| Gate | 命令 |
|------|------|
| C-S2 一键 | `bash scripts/check-c-s2-poi-media-review-workflow.sh` |
| Smoke | `bash scripts/dev/smoke-admin-content-poi-media-p0-local.sh` |
| C-S1–C-S2 汇合 | `bash scripts/dev/smoke-admin-content-p0-local.sh` |
| Contract | `frontend/app/admin/content/adminContentCs2.contract.test.ts` |
| Playwright | `frontend/e2e/c-s2-poi-media-review-workflow.spec.ts` |
| Catalog 冻结回归 | `bash scripts/check-s5-catalog-release-freeze.sh` |

---

## 3. 破 120 边界声明

| 项 | C-S2 变更 | 120 不变项 |
|----|-----------|------------|
| Admin POI Media API | **新增** | RO `GET /catalog/poi-images` 语义不变 |
| published 表写入 | **Admin 路径** | Consumer 仍 TS 默认读 |
| FE Consumer | **未改** | `ENABLED=0` |
| 报价主链 | **未改** | TS + W4 shadow |
| Growth | **未碰** | G-S8 冻结 |

---

## 4. 运营就绪（B 层）

| 能力 | C-S2 后 |
|------|---------|
| Ops 可在 Admin 审 POI 图批次 | **GO** |
| SuperAdmin 审批发布 POI 图 | **GO**（`catalog.poi_image.publish`） |
| 公众面自动切 PG 图 | **HOLD**（C-S6 · `ENABLED=1`） |

---

## 5. 下一步

| Sprint | 内容 |
|--------|------|
| **C-S3** | 定价/hotel tier/transport/landing Admin 深化 |
| **C-S4** | revisions UI · import trigger · 对拍面板 |
| **C-S6** | Consumer opt-in 切流 |

**101 路线矩阵**：C-S2 → **GO** · M6 Admin → **GO** · 下一步 **C-S3**
