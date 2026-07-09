# 142 · O-S2 Official Guides & Community Publishing Report

> **Sprint**：O-S2 · **Official Guides & Community Publishing**（M8 · P2 Official OPS）  
> **设计 SSOT**：[135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md) · [101 v2.0 Official §8.3](./101-CMS与内容运营中心实施蓝图.md)  
> **前置**：[141 O-S1 Official Accounts](./141-O-S1-Official-Accounts-Management-Report.md) · Growth **G-S8 FREEZE**（133）  
> **冻结基准**：[120-S5 Catalog Release Freeze](./120-S5-Catalog-Release-Freeze-Report.md) · [133-G-S8 Growth Freeze](./133-G-S8-Growth-Release-Freeze-Report.md)  
> **日期**：2026-06-08  
> **纪律**：**不修改** `NEXT_PUBLIC_CATALOG_API_ENABLED` · **不碰** 报价主链 · Growth 积分/链上 GOV · 支付 · M9/M10 · Campaigns · **不删** `communityShowcase*.ts`（仅文档声明 Ops 替代路径）  
> **结论**：**O_S2_OFFICIAL_GUIDES_COMMUNITY_PUBLISHING_GO**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **Official Guides 管理** | **GO** — CRUD `ops_official_guide_posts` |
| **官方攻略发布** | **GO** — publish → `community_posts` + `content_tier=official` |
| **官方社区内容发布** | **GO** — 同一 publish 投影（body/title/tags/destination/cover） |
| **Guide 绑定 Official Account** | **GO** — `author_account_id` → `ops_official_accounts` · publish 写 `official_account_id` + `user_id` |
| **审核发布状态流转** | **GO** — `draft → in_review → published → archived` |
| **RBAC** | **GO** — 复用 `admin.official.read/write/publish` |
| **审计日志** | **GO** — `ops.official.guide.*` → `admin_audit_logs` |
| **Official OPS Hub** | **GO** — Hub 链至 guides 子页 · O-S2 copy |
| **communityShowcase 替代** | **GO（Ops 路径）** — Admin publish 为 prod 官方内容真源；dev inject **保留** |

---

## 2. 交付范围（O-S2）

### 2.1 后端

| 模块 | 路径 | 能力 |
|------|------|------|
| DB | `ops_official_guide_posts_admin.rs` | list/get/create/patch · workflow · community 投影 |
| HTTP | `admin_official_guides_http.rs` | `/api/v1/admin/official/guides/*` |
| 审批 | `admin/mod.rs` | `ops.official.guide.publish` approve handler |

**Admin API 端点（M8）**

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/admin/official/guides` | read |
| POST | `/admin/official/guides` | write |
| GET/PATCH | `/admin/official/guides/:id` | read/write |
| POST | `…/submit-review` · `…/request-publish` · `…/publish` · `…/archive` | write/publish |

**Publish 语义**

- 写入/更新 `community_posts`：`content_tier='official'` · `official_account_id=author_account_id` · `data_origin='production'` · `visibility_status='public'`
- `user_id` 取自绑定 Official Account 的 `ops_official_accounts.user_id`
- 回写 `ops_official_guide_posts.community_post_id` · `published_at`

### 2.2 前端

| 路由 | 页面 |
|------|------|
| `/admin/official` | Official OPS Hub（O-S2 模块卡 + accounts/guides 链） |
| `/admin/official/guides` | 官方攻略列表 · 创建 · 审核 · 发布 · 作者账号选择 |

### 2.3 门禁

| Gate | 命令 |
|------|------|
| O-S2 一键 | `bash scripts/check-o-s2-official-guides-community-publishing.sh` |
| Smoke | `bash scripts/dev/smoke-admin-official-guides-p0-local.sh` |
| Contract | `frontend/app/admin/official/adminOfficialOs2.contract.test.ts` |
| Playwright | `frontend/e2e/o-s2-official-guides-community-publishing.spec.ts` |
| Growth 冻结回归 | `bash scripts/check-g-s8-growth-release-freeze.sh` |
| Catalog 冻结回归 | `bash scripts/check-s5-catalog-release-freeze.sh` |

---

## 3. 边界声明

| 项 | O-S2 变更 | 不变项 |
|----|-----------|--------|
| Admin M8 API/FE | **新增** | M9 templates · M10 cold-start **未碰** |
| communityShowcase | **Ops 替代路径（文档）** | FE/seed inject 代码 **未删** · dev 仍可用 |
| `community_posts` insert 路径 | Admin publish 专用 SQL | 用户 `insert_post` **未改** |
| Consumer Catalog | **未改** | `ENABLED=0` · 报价主链 |
| Growth / 支付 / GOV | **未改** | 133 冻结 |

---

## 4. Official OPS 完成度（B 层）

| 模块 | O-S2 后 |
|------|---------|
| M7 Official Accounts | **GO**（O-S1） |
| M8 Official Guides | **GO** |
| M9 Templates | **HOLD**（O-S3） |
| M10 Cold Start | **HOLD**（O-S4） |
| communityShowcase ops 替代 | **GO**（Admin publish） |

---

## 5. 下一步

| Sprint | 内容 |
|--------|------|
| **O-S3** | M9 Itinerary Templates Admin |
| **C-S6** | Consumer opt-in（Catalog 轨，并行） |

**101 路线矩阵**：O-S2 → **GO** · 下一步 **O-S3**
