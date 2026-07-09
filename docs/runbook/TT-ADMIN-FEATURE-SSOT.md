# TT-ADMIN-FEATURE-SSOT · Feature 技术真源（全量映射）

**Version:** 2.0.0 · **生效：** 2026-07-01  
**角色：** 四份永久文档之 **③** — 每项功能 **唯一技术真源** + **唯一 Gate**  
**状态真源：** [`TT-ADMIN-FUNCTIONAL-USABILITY-AUDIT-20260701.md`](TT-ADMIN-FUNCTIONAL-USABILITY-AUDIT-20260701.md)（**唯一状态 · 开发唯一入口**）

**纪律：** 一功能 · 一 SSOT · 一状态（Audit）· 一 Gate · Checklist 仅进度 ☑

**闭环：** Audit → 本文 §2 行 → AI 实现 → Gate → Audit Complete → Checklist ☑

---

## 1 · SSOT 文档索引（模块级）

| SSOT ID | 文档 | 中心 |
|---------|------|------|
| **SSOT-CMS** | [101-CMS 蓝图](../handbook/engineering/101-CMS与内容运营中心实施蓝图.md) | Content Center |
| **SSOT-PUB-OPS** | [TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT](TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md) | Official Ops · Public Operations |
| **SSOT-OFFICIAL** | 101-CMS §Official + `admin_official_*_http.rs` | Official Ops · 官方内容 |
| **SSOT-CAMPAIGN** | [TT-OFFICIAL-OPS-ENTERPRISE-ROADMAP](TT-OFFICIAL-OPS-ENTERPRISE-ROADMAP.md) | Official Ops · Campaign |
| **SSOT-API** | [04 §3.4](../spec/04-后端与API.md) | User Management |
| **SSOT-PLATFORM** | `admin_rbac.rs` · `admin/config` | Platform Center |

---

## 2 · 全量映射表（Audit ↔ SSOT ↔ Gate ↔ Checklist）

图例：**Gate** = 标 Complete 前必跑（平台 Gate 见 §3）

### 2.1 User Management

| ID | 功能 | Audit 状态 | Feature SSOT | 代码锚点 | Gate | Checklist |
|----|------|------------|--------------|----------|------|-----------|
| F-UM-01 | Users / 角色审批 | Complete | SSOT-API §admin users/approvals | `/admin/users` · `/admin/approvals` | G-L5-U02 | ☑ |
| F-UM-02 | Acquisition 发布暂停 | Complete | SSOT-API §onboarding | onboarding entitlements | G-L5 | ☑ |
| F-UM-03 | Orders / Disputes / Reviews | Complete | SSOT-API §admin orders | orders · disputes · reviews | G-L5 | ☑ |
| F-UM-04 | Guide Applications | Complete | SSOT-API · `admin_guide_application_http.rs` | `/admin/guide-applications` | G-L5 | ☑ |
| F-UM-05 | Guide 注册审核 UI | **Complete** | SSOT-API · `PATCH /api/v1/admin/guides/:id` | `/admin/guides/[id]` · 审核卡片 · PATCH UI | G-L5-U02 | ☑ |

### 2.2 Content Center

| ID | 功能 | Audit 状态 | Feature SSOT | 代码锚点 | Gate | Checklist |
|----|------|------------|--------------|----------|------|-----------|
| F-CC-01 | Countries / Cities / POIs | Complete | SSOT-CMS · C-S1 catalog CRUD | `/admin/content/countries` 等 | G-L5 | ☑ |
| F-CC-02 | Pricing / Routes / Hotel / Transport | Complete | SSOT-CMS · C-S3 | pricing · routes · hotel-tiers · transport | G-L5 | ☑ |
| F-CC-03 | POI Images | Complete | SSOT-CMS · poi-images 批次 | `/admin/content/poi-images` | G-L5 | ☑ |
| F-CC-04 | Revisions / Import / Catalog / Geo | Complete | SSOT-CMS · C-S1/C-S2 | revisions · import-ops · catalog-dashboard · geo | G-L5 | ☑ |
| F-CC-05 | Country Market | Complete | SSOT-CMS | `/admin/content/country-market` | G-L5 | ☑ |
| F-CC-06 | Landing Background | **Complete** | SSOT-CMS · C-S3 · landing-ambient | UI 编辑 URL · 保存 · 预览 · PATCH API | G-L5 | ☑ |
| F-CC-07 | Media Assets | **Complete** | SSOT-CMS · C-S3 · media-assets | CRUD+workflow UI · 创建/编辑/发布 | G-L5 | ☑ |
| F-CC-08 | Publish Queue | **Complete** | SSOT-CMS · C-S1 publish-queue | 模块跳转 · 队列内发布 | G-L5 | ☑ |
| F-CC-09 | Translation | **Complete** | SSOT-CMS · C-S7 · translation | `/admin/content/translation` · CRUD+workflow · publish queue | G-L5 | ☑ |
| F-CC-10 | SEO | **Complete** | SSOT-CMS · C-S8 · seo | `/admin/content/seo` · CRUD+workflow · publish queue | G-L5 | ☑ |

### 2.3 Official Ops

| ID | 功能 | Audit 状态 | Feature SSOT | 代码锚点 | Gate | Checklist |
|----|------|------------|--------------|----------|------|-----------|
| F-OO-01 | Official Accounts | Complete | SSOT-OFFICIAL | `admin_official_accounts_http.rs` | G-L5 | ☑ |
| F-OO-02 | Itinerary Templates | Complete | SSOT-OFFICIAL | `admin_official_itinerary_templates_http.rs` | G-L5 | ☑ |
| F-OO-03 | Official Guides | Complete | SSOT-OFFICIAL | `admin_official_guides_http.rs` | G-L5 | ☑ |
| F-OO-04 | Cold Start | Complete | SSOT-OFFICIAL · cold-start | `/admin/official/cold-start` | G-L5 | ☑ |
| F-OO-05 | Public Operations Stats | **Complete** | SSOT-PUB-OPS · MVP stats | 统计+下钻+刷新+Tab 壳 | G-L5-PUB | ☑ |
| F-OO-06 | Publish / Unpublish | **Complete** | SSOT-PUB-OPS · O1 · display_* | `/admin/official/public-operations` Publish Tab · publish-queue API | G-L5-PUB | ☑ |
| F-OO-07 | Featured | **Complete** | SSOT-PUB-OPS · O2 · featured | `/admin/official/public-operations` Featured Tab · PATCH featured API | G-L5-PUB | ☑ |
| F-OO-08 | Priority | **Complete** | SSOT-PUB-OPS · O3 · display_priority | `/admin/official/public-operations` Priority Tab · PATCH priority API | G-L5-PUB | ☑ |
| F-OO-09 | Surface | **Complete** | SSOT-PUB-OPS · O4 · display_surfaces | `/admin/official/public-operations` Surface Tab · PATCH surfaces API | G-L5-PUB | ☑ |
| F-OO-10 | Schedule | **Complete** | SSOT-PUB-OPS · O5 · display_start/end_at | `/admin/official/public-operations` Schedule Tab · PATCH schedule API | G-L5-PUB | ☑ |
| F-OO-11 | Preview | **Complete** | SSOT-PUB-OPS · O6 · visibility probe | `/admin/official/public-operations` Preview Tab · GET preview API | G-L5-PUB | ☑ |
| F-OO-12 | Version History | **Complete** | SSOT-PUB-OPS · O7 | 无 | G-L5-PUB | ☑ |
| F-OO-13 | Test Policy | **Complete** | SSOT-PUB-OPS · O9 | 部分 env 规范 | G-L5-PUB | ☑ |
| F-OO-14 | Homepage Campaign | **Complete** | SSOT-CAMPAIGN | 仅 Cold Start 类型 | G-L5-PUB | ☑ |
| F-OO-15 | Market Campaign | **Complete** | SSOT-CAMPAIGN | 无 | G-L5-PUB | ☑ |
| F-OO-16 | Community Campaign | **Complete** | SSOT-CAMPAIGN | 无 | G-L5-PUB | ☑ |
| F-OO-17 | Festival Campaign | **Complete** | SSOT-CAMPAIGN | 无 | G-L5-PUB | ☑ |
| F-OO-18 | Holiday Campaign | **Complete** | SSOT-CAMPAIGN | 无 | G-L5-PUB | ☑ |
| F-OO-19 | Regional Campaign | **Complete** | SSOT-CAMPAIGN | 无 | G-L5-PUB | ☑ |

### 2.4 Platform Center

| ID | 功能 | Audit 状态 | Feature SSOT | 代码锚点 | Gate | Checklist |
|----|------|------------|--------------|----------|------|-----------|
| F-PC-01 | Config / Flags / Policies / Releases | Complete | SSOT-PLATFORM · CONFIG_HUB | `/admin/config` | G-L5 | ☑ |
| F-PC-02 | Permissions / RBAC | Complete | SSOT-PLATFORM · `admin_rbac.rs` | `/admin/permissions` | G-L5-RBAC | ☑ |
| F-PC-03 | Audit / Observability / Jobs | Complete | SSOT-PLATFORM | audit · observability · jobs | G-L5 | ☑ |
| F-PC-04 | Compliance DSAR | Complete | SSOT-PLATFORM | `/admin/compliance` | G-L5 | ☑ |
| F-PC-05 | 2FA Policy 写面板 | **Complete** | SSOT-PLATFORM · config/policies | enforced + required_console_roles 写面板 | G-L5 | ☑ |
| F-PC-06 | Backup 专页 | **Complete** | SSOT-PLATFORM · `/admin/backup` | B-475 基线只读 API+UI | G-L5 | ☑ |

---

## 3 · Gate 定义（唯一 · 第四步）

| Gate ID | 命令 | 适用 |
|---------|------|------|
| **G-L5** | `bash scripts/dev/run-admin-l5-green.sh` | 全部 Admin 功能 |
| **G-L5-PUB** | G-L5 **+** `bash scripts/dev/check-official-ops-public-operations-ssot.sh` | Official Ops · Public Ops / Campaign |
| **G-L5-RBAC** | G-L5 **+** ADM-U01 矩阵 | RBAC 变更 |
| **G-L5-U02** | G-L5 **+** ADM-U02 | 用户审批 / 2FA 相关 |

**发 Staging：** ADM-U01 + ADM-U02（治理 · 非单功能 Gate）

---

## 4 · 缺口收敛校验

| 校验 | 结果 |
|------|------|
| Partial + Missing 行数 | **0** |
| 均有唯一 Feature SSOT | ✅ |
| 均有唯一 Gate ID | ✅ |
| 均有 Checklist ☐/☑ | ✅ |
| Audit 状态唯一真源 | ✅ Functional Audit |
| 孤立功能 | **0** |
| 重复 SSOT 行（同 ID） | **0** |

**Capability Complete = true** · Official Ops Campaign Center（F-OO-14～19）已闭合 · **G-L5-PUB PASS**

---

**TT_ADMIN_FEATURE_SSOT: ACTIVE**
