# 136 · C-S1 Admin Content CRUD & Publish Queue Report

> **Sprint**：C-S1 · **破 120 程序** Admin Content CRUD + publish-queue  
> **设计 SSOT**：[105-S2 Catalog CMS 深度设计](./105-S2-Catalog-CMS深度设计评审.md) · [135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md)  
> **冻结基准**：[120-S5 Catalog Release Freeze](./120-S5-Catalog-Release-Freeze-Report.md)（Consumer **未切流**）  
> **日期**：2026-06-08  
> **纪律**：**不修改** `NEXT_PUBLIC_CATALOG_API_ENABLED` 默认 · **不碰** 报价 UI 主链 · Growth/支付/链上 GOV  
> **结论**：**C_S1_ADMIN_CONTENT_CRUD_PUBLISH_QUEUE_GO**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **Admin `/api/v1/admin/content/*`** | **GO** — countries/cities/pois/pricing/routes CRUD + workflow |
| **publish-queue** | **GO** — `GET …/publish-queue` · `catalog_publish_pending` |
| **审批 `catalog.entity.publish`** | **GO** — request-publish + `/admin/approvals` approve 路径 |
| **审计 `catalog_content_revisions`** | **GO** — create/update/submit/publish/archive |
| **RBAC** | **GO** — `admin.content.read/write/publish` 接线 |
| **FE Admin 页** | **GO** — countries/cities/pois/pricing/routes/publish-queue |
| **Consumer 默认** | **不变** — `ENABLED=0` · 120 回退策略维持 |
| **B 层运营** | **部分 GO** — CMS Admin MVP · M6/C-S6 仍 HOLD |

---

## 2. 交付范围（C-S1）

### 2.1 后端

| 模块 | 路径 | 能力 |
|------|------|------|
| DB | `crates/api/src/db/catalog_admin.rs` | Admin 行 CRUD · 状态机 · revisions · publish approval |
| HTTP | `crates/api/src/routes/admin/admin_content_http.rs` | M1–M5 + pricing + intercity + publish-queue + revisions |
| 审批 | `mod.rs` · `catalog.entity.publish` | approve → publish_catalog_entity |

**状态机（105 §4.1）**：`draft → in_review → published → archived`

| 动作 | Permission | 端点模式 |
|------|------------|----------|
| CRUD | `content.write` | POST/PATCH |
| submit-review | `content.write` | `…/submit-review` |
| publish | `content.publish` | `…/publish` |
| request-publish | `content.write` | `…/request-publish` → approval |
| archive | `content.write` | `…/archive` |

### 2.2 前端

| 路由 | 页面 |
|------|------|
| `/admin/content` | Hub · C-S1 模块卡 |
| `/admin/content/countries` | M1 CRUD + workflow |
| `/admin/content/cities` | M2 列表 |
| `/admin/content/pois` | M3–M5 列表 |
| `/admin/content/pricing` | 定价模板列表 |
| `/admin/content/intercity-routes` | 交通列表 |
| `/admin/content/publish-queue` | in_review 聚合 |

### 2.3 门禁

| Gate | 命令 |
|------|------|
| C-S1 一键 | `bash scripts/check-c-s1-admin-content-crud-publish-queue.sh` |
| Smoke | `bash scripts/dev/smoke-admin-content-p0-local.sh` |
| Contract | `frontend/app/admin/content/adminContentCs1.contract.test.ts` |
| Playwright | `frontend/e2e/c-s1-admin-content-crud.spec.ts` |
| Catalog 冻结回归 | `bash scripts/check-s5-catalog-release-freeze.sh`（**须** Consumer 默认不变） |

---

## 3. 破 120 边界声明

| 项 | C-S1 变更 | 120 不变项 |
|----|-----------|------------|
| Admin Content API | **新增** | RO API 语义不变 |
| FE Consumer | **未改** | `ENABLED=0` |
| 报价主链 | **未改** | TS + W4 shadow |
| Server geo | **未改** | 默认 core |
| Growth | **未碰** | G-S8 冻结 |

---

## 4. 仍 HOLD（C-S2+）

| ID | 项 | Sprint |
|----|-----|--------|
| M6 | POI 图 Admin 审核闭环 | **C-S2** |
| C-S3 | 定价/交通完整 Admin 编辑 UI | C-S3 |
| C-S6 | Consumer `ENABLED=1` 切流 | C-S6 |
| O-S1～O-S4 | Official OPS | 独立轨 |

---

## 5. 101 v2.0 路线矩阵更新

| Sprint | 状态 | 退出标准 |
|--------|------|----------|
| **C-S1** | **GO（本报告）** | `check-c-s1` · smoke · contract |
| **C-S2** | HOLD | M6 batch→publish E2E |
| **C-S3～C-S6** | HOLD | 见 101 §11 |
| **O-S1～O-S4** | HOLD | Official OPS |

**B 层运营就绪**：CMS Admin **部分 GO**（M1–M5 数据面 + Admin MVP）· 冷启动仍 seed/env **HOLD**

---

## 6. 交叉引用

| 文档 | 关系 |
|------|------|
| [101 v2.0.0](./101-CMS与内容运营中心实施蓝图.md) | 路线矩阵已更新 |
| [104 v1.1.0](./104-Admin-Coverage-Gap-Report.md) | §1.9 Admin 覆盖 |
| [135](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md) | 前置文档 Sprint |

---

**报告状态**：**C_S1_ADMIN_CONTENT_CRUD_PUBLISH_QUEUE_GO** · 下一步 **C-S2** M6 POI 图审核
