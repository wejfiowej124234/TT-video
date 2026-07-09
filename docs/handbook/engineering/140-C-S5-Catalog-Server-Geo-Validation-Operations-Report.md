# 140 · C-S5 Catalog Server Geo Validation Operations Report

> **Sprint**：C-S5 · **Catalog Server Geo Validation Operations**（117/118/119 · 破 120 程序 · Admin-only）  
> **设计 SSOT**：[105-S2 Catalog CMS 深度设计 §8.4](./105-S2-Catalog-CMS深度设计评审.md) · [135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md)  
> **前置**：[139 C-S4 Revision & Import Ops](./139-C-S4-Catalog-Revision-Import-Operations-Report.md) · [119 S4c Final Revalidation](./119-S4c-Catalog-Geo-Server-Final-Revalidation-Report.md)  
> **冻结基准**：[120-S5 Catalog Release Freeze](./120-S5-Catalog-Release-Freeze-Report.md)（**默认行为不变**）  
> **日期**：2026-06-08  
> **纪律**：**不修改** `CATALOG_SERVER_GEO_VALIDATION` / `NEXT_PUBLIC_CATALOG_API_ENABLED` 默认 · **不碰** 报价 UI 主链 · Growth/支付/链上 GOV · Official OPS  
> **结论**：**C_S5_CATALOG_SERVER_GEO_VALIDATION_OPERATIONS_GO**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **Admin Geo Validation Dashboard** | **GO** — `/admin/content/geo-validation` |
| **meta.product_countries 对拍** | **GO** — core ↔ published catalog_countries 逐国比对 |
| **catalog-pg / core 双源状态** | **GO** — `read_source` · POST geo 读源 · `dual_write_order` |
| **validation drift 检测** | **GO** — core↔PG parity · published count · read_source 一致性 |
| **flag 可观测** | **GO** — `CATALOG_SERVER_GEO_VALIDATION` + FE `ENABLED` 只读快照 |
| **验证历史 · 审计** | **GO** — `admin_audit_logs` · `catalog.geo.validation.*` |
| **Catalog Dashboard 集成** | **GO** — geo summary 区块 |
| **Consumer / Server 默认** | **不变** — `ENABLED=0` · `GEO_VALIDATION=0` |

---

## 2. 交付范围（C-S5）

### 2.1 后端

| 模块 | 路径 | 能力 |
|------|------|------|
| DB | `catalog_geo_validation_ops_admin.rs` | summary · meta parity · drift · audit history |
| HTTP | `admin_catalog_revision_http.rs` | 3 个 geo-validation Admin 端点 |
| 复用 | `catalog_geo_validation.rs` | `assert_core_catalog_geo_parity` · `resolve_meta_product_countries` |

**Admin API 端点**

| 端点 | 能力 |
|------|------|
| `GET /admin/content/catalog/geo-validation` | 完整 summary + 写入 snapshot 审计 |
| `GET /admin/content/catalog/geo-validation/history` | `catalog.geo.*` 审计历史 |
| `GET /admin/content/catalog/geo-validation/meta-parity` | meta.product_countries 逐国对拍 |

### 2.2 前端

| 路由 | 页面 |
|------|------|
| `/admin/content/geo-validation` | Geo Validation Dashboard（完整面板） |
| `/admin/content/catalog-dashboard` | 嵌入 geo summary 区块 |

### 2.3 门禁

| Gate | 命令 |
|------|------|
| C-S5 一键 | `bash scripts/check-c-s5-catalog-server-geo-validation-operations.sh` |
| Smoke | `bash scripts/dev/smoke-admin-content-catalog-geo-validation-p0-local.sh` |
| Contract | `frontend/app/admin/content/adminContentCs5.contract.test.ts` |
| Playwright | `frontend/e2e/c-s5-catalog-server-geo-validation-operations.spec.ts` |
| S4 回归 | `bash scripts/check-s4c-catalog-geo-server-final-revalidation.sh` |
| Catalog 冻结 | `bash scripts/check-s5-catalog-release-freeze.sh` |

---

## 3. 破 120 边界声明

| 项 | C-S5 变更 | 120 不变项 |
|----|-----------|------------|
| Admin geo observability API | **新增只读** | 无 flag 切换 UI |
| Dashboard 加载 | **写 audit snapshot** | 不改变运行时 geo 读源 |
| Drift 检测 | **Admin 展示** | 不自动修复 / 不 subprocess import |
| `CATALOG_SERVER_GEO_VALIDATION` | **观测 env 真值** | 默认 **0/unset** |
| `NEXT_PUBLIC_CATALOG_API_ENABLED` | **观测（进程 env）** | 默认 **0** · FE TS 主链 |

---

## 4. 运营就绪（B 层 · CMS）

| 能力 | C-S5 后 |
|------|---------|
| Ops 可观测 Server Geo flag 与 read_source | **GO** |
| Ops 可查看 meta.product_countries 对拍 | **GO** |
| Ops 可查看 drift 与 B-S4-02～06 OPEN 项 | **GO** |
| Ops 可查阅 geo 验证审计历史 | **GO** |
| 运行时默认切 catalog-pg geo | **HOLD**（120 break-glass · C-S6 无关） |
| 公众面 Consumer 切 PG | **HOLD**（C-S6） |

---

## 5. 已知限制（C-S6 候选）

| 项 | 现状 |
|----|------|
| B-S4-02～04 | PATCH cities · day_plans · guides ISO 仍 core |
| Flag 切换 | Admin **只读**；改 env 须 120 程序 |
| FE ENABLED | API 进程未必设置；note 说明 frontend-only |

---

## 6. 下一步

| Sprint | 内容 |
|--------|------|
| **C-S6** | Consumer `NEXT_PUBLIC_CATALOG_API_ENABLED=1` opt-in 切流 + 120 全量回归 |

**101 路线矩阵**：C-S5 → **GO** · 下一步 **C-S6**
