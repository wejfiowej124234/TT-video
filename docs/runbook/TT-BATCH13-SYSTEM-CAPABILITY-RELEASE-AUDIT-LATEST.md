# Batch-13 · 系统级能力 + 发布级评分审计（截图域 · 真实能力）

**Machine:** `TT_ADMIN_BATCH13_SYSTEM_CAPABILITY_RELEASE_AUDIT`  
**Stamp:** `20260726T070500Z` · **Batch-14 accept cite:** `20260726T133500Z`  
**Verdict:** `B13_SYSTEM_CAPABILITY_RELEASE_GRADE_NO` · **HU-495 gate OPEN · 21/30**（禁止假关 30/30）  
**证据基线：** Owner 截图 `B13-01…05` · 仓库代码真源（①）· **非** Staging 全矩阵 GO · **非** Production GO  
**截图目录：** `evidence/manual-uat/sessions/20260726T063000Z-batch13-content-prep/batch13-screenshots/`（相对 living bake `5d73c50d` **STALE** · 须 C-01～C-08 复截）  
**§5 机读矩阵：** [`HU495-SECTION5-MATRIX-LATEST.json`](../../evidence/GO_batch14_collective_fix/HU495-SECTION5-MATRIX-LATEST.json)  
**验收卷：** [`HU495-487-490-ACCEPTANCE-LATEST.json`](../../evidence/GO_batch14_collective_fix/HU495-487-490-ACCEPTANCE-LATEST.json)  
**JSON：** [`TT-BATCH13-SYSTEM-CAPABILITY-RELEASE-AUDIT-LATEST.json`](./TT-BATCH13-SYSTEM-CAPABILITY-RELEASE-AUDIT-LATEST.json)  
**满分路径：** [`L5-RELEASE-GRADE-FULL-SCORE-PATH`](./TT-BATCH13-L5-RELEASE-GRADE-FULL-SCORE-PATH-LATEST.md)  
**能力满分细致方案（冲 30/30）：** [`CAPABILITY-FULL-SCORE-UPGRADE`](./TT-BATCH13-CAPABILITY-FULL-SCORE-UPGRADE-PLAN-LATEST.md)  
**Patch：** `PATCH-STG-019` · living bake `5d73c50d` · tip cite `ea71c577` IMMOBILE  
**≠ Hard Gate unlock · ≠ Cutover · ≠ Production GO · ≠ 4.x 当 5.0**

---

## 0 · 阶段与诚实边界（写死）

**阶段口径：** ① 本地代码真源 → ② Staging 真人复验 → ③ 公网/生产（须顺序 · 禁止跳阶）

| 项 | 本审计 |
|----|--------|
| **有没有收口** | **否（发布级）** — 能力接线存在，但向导审详裂脑 + 概况非全真数 |
| **有没有 UI 冻结** | **否**（Batch-13 内容准备）· Batch-12 走廊 **FROZEN** 禁回流 |
| **① 有页面/API** | **≠** ② Staging 发布级真实能力签收 |
| **灰域 /「暂无统计」** | **≠** 假数字；**=** 未接线 KPI / total=null 的诚实空态（仍挡发布级完整感） |
| **特权比 87/338** | **真实 PG 计数**，可被**种子/测试角色污染**（非 UI mock） |

---

## 1 · Owner 五问 · 真实能力总表（硬结论）

| # | 问题 | 结论 | 分（/5） | 发布级可否宣称「具备」 |
|---|------|------|----------|------------------------|
| **Q1** | 是否具备**审批向导**功能？ | **PARTIAL** | **3.0** | **否** — UI/PATCH 有；详单/审核读 **memory-only**，与 PG 列表可裂脑 |
| **Q2** | 是否具备**查看向导提交资料**？ | **PARTIAL** | **3.5** | **条件具备** — 证件 URL 可预览；护照号**永不回传**（哈希） |
| **Q3** | 是否与向导申请页提交资料**对齐**？ | **PARTIAL** | **3.5** | **否（满分对齐）** — 核心字段对齐；护照明文/证件类型缺口 |
| **Q4** | 是否具备**商家入驻**能力？ | **YES（①）** | **4.5** | **接近** — 提交→列表→材料预览→审批准驳全接线；仍须 ② 真人复验 |
| **Q5** | 是否具备**区域主理人审核**能力？ | **YES 动作 / PARTIAL 材料** | **4.0** | **条件具备** — 审批准驳有；材料预览弱于商家（无证照链） |
| **Q6** | 系统概况是否**全部真实数据**、无假占位？ | **NO（发布标准）** | **2.5** | **否** — 禁假绿做到了；但多域无 live KPI · 经营/向导库存常 memory/null · 非「全真数发布」 |

**能力总分：** **21.0 / 30**（平均 **3.5 / 5**）  
**系统级发布级总判：** **`RELEASE_GRADE: NO`**  
**工作台八维现状（旁证）：** **24 / 40**（见既有审计）· 目标仍 **每维 5.0**

```text
「代码里有审批页」≠「发布级具备真实审批能力」
「灰灯 / 暂无统计」≠「假数据」——但仍 ≠「发布级全真数」
商家 / 主理人 ① 接线 YES · 向导审详裂脑 = 发布级 P0 挡板
```

---

## 2 · 向导三角（勿混）

| 面 | 路由 | 真实职责 | 发布级用途 |
|----|------|----------|------------|
| **申请队列** | `/admin/guide-applications` · `[id]` | 入驻 intake · `AdminGuideApplicationReviewCard` · `needs_more_info` · 批准可升 `users.role=guide` | **主审入口（应唯一）** |
| **目录台账** | `/admin/guides` · `[id]` | 注册/监管台账 · `AdminGuideRegistrationReviewCard` · **无**补件态 · 批准**不**等同入驻升角色 | 监管 · **勿当申请主审** |
| **官网 CMS** | `/admin/official/guides` | 平台内容 | 非申请人审核 |

**证据：** `frontend/lib/admin/guidesTriangleL5.ts` · 两套 PATCH（`…/guide-application-review` vs `PATCH /admin/guides/:id`）。

---

## 3 · Q1～Q3 向导 · 证据链

### 3.1 审批（Q1）

| 层 | 路径 |
|----|------|
| 列表 FE | `app/admin/guide-applications/AdminGuideApplicationsPageMain.tsx` → `GET /api/v1/admin/guide-applications`（可 **Postgres**） |
| 详情 FE | `app/admin/guide-applications/[id]` → `AdminGuideApplicationReviewCard` |
| 审核 API | `PATCH /api/v1/admin/users/:id/guide-application-review` · `PERM_ONBOARDING_REVIEW` |
| 详情 GET | `get_guide_application_for_user_admin_impl` — **仅读 chain_off memory**（`guide_profile.rs` · **无 db_pool 分支**） |
| 审核写 | 先改 memory；有 pool 时 **best-effort** `update_guide_registration_review` + 批准升角色 |

**挡板（发布级 P0）：** PG 列表有行 → 详情/审核若 memory 无行 → `application: null` / `guide_application_not_found`。  
**新 HU：** **HU-491**。

### 3.2 查看资料（Q2）

| 展示 | 字段 |
|------|------|
| 有 | status · submitted_at · city · country · real_name · wallet · languages · service_types · bio · hourly_rate · 三证 URL 预览 |
| 类型有未渲染 | `avatar_url` |
| 永不展示 | `passport_number`（仅存 hash） |

### 3.3 与 `/guide/register` 对齐（Q3）

| 字段 | 申请页提交 | Admin 审卡 | 对齐 |
|------|------------|------------|------|
| city / country / languages / service_types / bio / wallet / real_name | ✅ | ✅ | **ALIGNED** |
| id_photo / language_cert / guide_license URLs | ✅ | ✅ 预览 | **ALIGNED** |
| passport / idNumber | ✅ → hash | ❌ 不回传 | **MISSING（合规设计）** |
| idType（草稿） | 草稿 | 不落库 | **MISSING** |
| hourly_rate / avatar | 申请页不采 | 展示/类型 | **PARTIAL** |

**新 HU：** **HU-492**（双审面+状态词统一）· 护照明文是否运营必看 = Owner 合规决策（非本批默认造明文）。

---

## 4 · Q4 商家入驻 · 证据链

| 能力 | 结论 | 证据 |
|------|------|------|
| 公网提交 | **YES** | `/provider/register` → `POST /api/v1/provider-applications` |
| Admin 列表 | **YES** | `/admin/provider-applications` · PG `role_applications` kind=`provider_onboarding` |
| 材料可见 | **YES** | `AdminProviderApplicationReviewCard` · 执照/许可/保险/法人证等 URL 预览 |
| 审批动作 | **YES** | `PATCH …/provider-application-review` · approved→`users.role=provider` · 审计日志 |

**发布级缺口：** 须 Staging 真人提交→审→角色生效截图（本审计未跑 E2E）· 记入 **HU-490** 签收材料。

---

## 5 · Q5 区域主理人 · 证据链

| 能力 | 结论 | 证据 |
|------|------|------|
| 公网提交 | **YES** | `/steward/register` → `POST /api/v1/steward/applications` |
| Admin 列表 | **YES** | `/admin/steward-applications` · PG kind=`region_steward_onboarding` |
| 审批动作 | **YES** | `PATCH …/steward-application-review` · `PERM_STEWARD_REVIEW` · approved→`region_steward` |
| 材料可见 | **PARTIAL** | 文本/辖区/钱包/动机 · **无**商家级证照预览链 |

**新 HU：** **HU-494**（主理人材料预览对齐商家卡，若申请侧有上传）。

---

## 6 · Q6 系统概况 · 「必须真实数据」逐项

**组件：** `AdminHomeSystemOverview*` · `useAdminHomeSystemOverview` · `adminHomeDomainHealth.ts`  
**SSOT：** `frontend/evidence/GO_local_admin_workspace_closure/ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`

| 块 | 数据源 | 是否「真数」 | 发布级判定 |
|----|--------|--------------|------------|
| 用户总数 / 7 日新增 | `GET …/metrics/home-overview` · PG 或 memory · **有 source 标签** | 有 pool 时 **真** | **PASS（有标签）** |
| 四通道待办 | Inbox 各队列 API `total` | **真计数（上限内）** | **PASS** |
| 链 · 滞后 | observability overview | **真**（含 Sepolia chain_id） | **PASS** |
| 控制台角色 / 超管比 | `by_console_role` 实算 | **真计数** · 可**种子污染** | **FAIL 叙事**（HU-478） |
| 订单 / 争议 KPI | admin list `total` · 常 **memory** | 非全库 PG KPI | **FAIL 发布全真** |
| 向导目录库存 | guides `total`；null→「暂无统计」 | **诚实空** · 非假数 | **FAIL 发布完整**（HU-481） |
| 域灯 内容/官方/增长 | **固定 `tone: unknown`** · CTA | **无 KPI** · 非假绿 | **FAIL 发布完整**（HU-480） |
| 域灯 财务/治理 | **固定 `neutral`** | 导航态 · 无假余额 | **诚实 · 仍非全真运营灯** |
| 经营域灯 | memory/unknown → 禁假绿 clamp（HU-449） | **诚实降级** | **PASS 诚实 / FAIL 完整感** |

**硬结论：**

1. **未发现**系统概况路径硬编码假 KPI 数字充绿。  
2. Owner 要求「**所有数据必须真实、不要假占位**」按**发布级**解读 → **当前不满足**（多域无 live · 库存空 · 经营源常非 `real_db` · 特权比脏种子）。  
3. 「暂无统计 / 灰域」= **诚实边界**，**不能**改成假绿凑发布。

**新 HU：** **HU-493** = 系统概况发布级真数闸（每数值磁贴 `source=real_db` **或** Owner 书面接受的设计空态 + 徽章；库存/经营必须可指证）。

---

## 7 · 系统级发布评分卡（本轮）

### 7.1 能力六问（上表）· 21.0 / 30

| 档 | 含义 |
|----|------|
| **5.0** | ② Staging 可证：提交→审→材料→角色 · 无裂脑 · 概况数值全真或设计空态签收 |
| **4.0～4.5** | ① 全接线 · 材料齐 · 差 Staging 签收或材料弱 |
| **3.0～3.5** | 有 UI/API 但 SSOT/对齐裂脑或不完整 |
| **≤2.5** | 发布标准下不可宣称「全真数 / 全具备」 |

### 7.2 与八维发布路径关系

| 轨 | 分 | 状态 |
|----|-----|------|
| 工作台八维（既有） | **24 / 40** | 目标 **40/40 · 每维 5.0** |
| 本轮能力六问 | **21 / 30** | 目标 **30 / 30** |
| 发布级总判 | **NO** | 闸 **HU-487** + **HU-495**（能力总闸） |

### 7.3 发布级签收前必须闭合（能力轨）

| 优先级 | HU | 项 |
|--------|-----|-----|
| **P0** | **491** | 向导申请详情/审核 **Postgres SSOT**（消 memory 裂脑） |
| **P0** | **493** | 系统概况发布级真数闸（库存/经营/`real_db` 或签收空态） |
| **P0** | **478** | 特权比叙事可信（种子清洗或演示明示） |
| **P1** | **492** | 向导双审面合并 / 状态词统一 |
| **P1** | **480 · 481 · 489** | 灰域语义 · 库存 · 官网对照（既有） |
| **P1** | **494** | 主理人材料预览对齐 |
| **P0** | **495** | **系统能力发布总闸**：Q1～Q6 全 ≥4.5 且 Q6=5.0 · Staging 截图证 |

---

## 8 · 截图域 UX/功能速扫（B13-01～05）

| 截图 | 表面 | 系统能力相关结论 |
|------|------|------------------|
| B13-01 | 工作台 | 待办/Inbox 链真实队列；Chrome/橙条/空态词典 = UX 债（HU-479/484/485） |
| B13-02 | 侧栏 | 入驻组含向导/商家/主理人入口（① 有路由） |
| B13-03 | 顶栏 | 三枢纽 vs 侧栏五组 IA（HU-486）；**非**能力有无 |
| B13-04 | 系统概况 | 真标签 + 灰域 + 库存空 + 特权比脏 = **发布级真数 FAIL** |
| B13-05 | 经营明细/手册 | 文案工程师向（HU-482）；非入驻能力本身 |

---

## 9 · 下一步（内容准备 · 不改代码）

1. 本包已入册 · OPEN **HU-491～495** · **冲满分细致步骤**见 [`CAPABILITY-UPGRADE`](./TT-BATCH13-CAPABILITY-FULL-SCORE-UPGRADE-PLAN-LATEST.md)  
2. 集体改合流序：**491 → 493 → 481 → 480 → 478 → 492 → 494 → … → 495 → 487 → 490**  
3. Owner 口令「开始第 13 批集体改」前 **禁止**改码  
4. Hard Gate / Cutover / Production GO **另口令**

```text
TT_ADMIN_BATCH13_SYSTEM_CAPABILITY_RELEASE_AUDIT: PASS_WITH_GAPS
TT_ADMIN_BATCH13_SYSTEM_CAPABILITY_SCORE: 21/30
TT_ADMIN_BATCH13_SYSTEM_CAPABILITY_TARGET: 30/30
TT_ADMIN_BATCH13_CAPABILITY_FULL_SCORE_UPGRADE_PLAN: ACTIVE
TT_ADMIN_BATCH13_SYSTEM_CAPABILITY_AVG: 3.5
TT_ADMIN_BATCH13_Q1_GUIDE_APPROVE: PARTIAL
TT_ADMIN_BATCH13_Q2_GUIDE_MATERIALS: PARTIAL
TT_ADMIN_BATCH13_Q3_GUIDE_FIELD_ALIGN: PARTIAL
TT_ADMIN_BATCH13_Q4_PROVIDER_ONBOARD: YES_PHASE1
TT_ADMIN_BATCH13_Q5_STEWARD_REVIEW: YES_ACTIONS_PARTIAL_MATERIALS
TT_ADMIN_BATCH13_Q6_OVERVIEW_ALL_REAL: NO
TT_ADMIN_BATCH13_RELEASE_GRADE: NO
TT_ADMIN_BATCH13_GATE_495: OPEN
TT_ADMIN_BATCH13_NEXT_HU: 496
TT_ADMIN_BATCH13_OPEN_COUNT: 18
TT_HARD_GATE_LOCKED: true
TT_CUTOVER_LOCKED: true
TT_PRODUCTION_GO: NO_GO
冲满分细致方案已入册 · 假绿已禁 · 全真数未达 · 向导审详裂脑 = P0
```
