# 141 · O-S1 Official Accounts Management Report

> **Sprint**：O-S1 · **Official Accounts Management**（M7 · P2 Official OPS）  
> **设计 SSOT**：[135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md) · [101 v2.0 Official §8.3](./101-CMS与内容运营中心实施蓝图.md)  
> **前置**：[140 C-S5 Server Geo Validation](./140-C-S5-Catalog-Server-Geo-Validation-Operations-Report.md) · Growth **G-S8 FREEZE**（133）  
> **冻结基准**：[120-S5 Catalog Release Freeze](./120-S5-Catalog-Release-Freeze-Report.md) · [133-G-S8 Growth Freeze](./133-G-S8-Growth-Release-Freeze-Report.md)  
> **日期**：2026-06-08  
> **纪律**：**不修改** `NEXT_PUBLIC_CATALOG_API_ENABLED` · **不碰** 报价主链 · Growth 积分/链上 GOV · 支付 · M8/M9/M10 · Campaigns  
> **结论**：**O_S1_OFFICIAL_ACCOUNTS_MANAGEMENT_GO**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **官方账号创建** | **GO** — POST `/admin/official/accounts` + batch-create |
| **资料管理** | **GO** — PATCH display_label · metadata · showcase/data_origin |
| **状态流转** | **GO** — metadata.review_status draft→in_review→published→archived |
| **审核发布** | **GO** — submit-review · request-publish · approval · direct publish |
| **RBAC** | **GO** — `admin.official.read/write/publish` |
| **审计日志** | **GO** — `ops.official.account.*` → `admin_audit_logs` |
| **G1 KOL 绑码** | **GO** — `referral_codes.official_account_id` + bind-referral-code |
| **SEED 替代路径** | **GO** — Ops 可 Admin 创建官方/KOL 账号；**dev** `SEED_TEST_ACCOUNTS` 机制保留 |
| **Official OPS Hub** | **GO** — Hub 链至 accounts 子页 |

---

## 2. 交付范围（O-S1）

### 2.1 后端

| 模块 | 路径 | 能力 |
|------|------|------|
| DB | `ops_official_accounts_admin.rs` | CRUD · workflow · KOL bind · approval |
| HTTP | `admin_official_accounts_http.rs` | `/api/v1/admin/official/accounts/*` |
| 审批 | `admin/mod.rs` | `ops.official.account.publish` approve handler |

**Admin API 端点（M7）**

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/admin/official/accounts` | read |
| POST | `/admin/official/accounts` | write |
| POST | `/admin/official/accounts/batch-create` | write |
| GET/PATCH | `/admin/official/accounts/:id` | read/write |
| POST | `…/submit-review` · `…/request-publish` · `…/publish` · `…/archive` | write/publish |
| POST | `…/link-guide` · `…/link-provider` · `…/bind-referral-code` | write |

### 2.2 前端

| 路由 | 页面 |
|------|------|
| `/admin/official` | Official OPS Hub（O-S1 模块卡） |
| `/admin/official/accounts` | 官方账号列表 · 创建 · 审核 · KOL 绑码 |

### 2.3 门禁

| Gate | 命令 |
|------|------|
| O-S1 一键 | `bash scripts/check-o-s1-official-accounts-management.sh` |
| Smoke | `bash scripts/dev/smoke-admin-official-accounts-p0-local.sh` |
| Contract | `frontend/app/admin/official/adminOfficialOs1.contract.test.ts` |
| Playwright | `frontend/e2e/o-s1-official-accounts-management.spec.ts` |
| Growth 冻结回归 | `bash scripts/check-g-s8-growth-release-freeze.sh` |
| Catalog 冻结回归 | `bash scripts/check-s5-catalog-release-freeze.sh` |

---

## 3. 边界声明

| 项 | O-S1 变更 | 不变项 |
|----|-----------|--------|
| Admin M7 API/FE | **新增** | M8 guides · M9 templates · M10 cold-start **未碰** |
| KOL bind | 写 `referral_codes.official_account_id` | Growth 积分公式/链上 **133 不变** |
| SEED_TEST_ACCOUNTS | Ops 路径替代 | dev 一键 seed **保留** · prod **=0** |
| Consumer Catalog | **未改** | `ENABLED=0` · 报价主链 |

---

## 4. Official OPS 完成度（B 层）

| 模块 | O-S1 后 |
|------|---------|
| M7 Official Accounts | **GO** |
| M8 Guides | **HOLD**（O-S2） |
| M9 Templates | **HOLD**（O-S3） |
| M10 Cold Start | **HOLD**（O-S4） |
| 冷启动 step 2 batch-create | **GO**（Admin 路径） |

---

## 5. 下一步

| Sprint | 内容 |
|--------|------|
| **O-S2** | M8 Guides → `community_posts` official publish |
| **C-S6** | Consumer opt-in（Catalog 轨，并行） |

**101 路线矩阵**：O-S1 → **GO** · 下一步 **O-S2**
