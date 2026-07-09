# 104 · Admin Coverage Gap Report（Operations Coverage Audit）

> **ARCHIVED · SUPERSEDED（2026-07-01）**  
> 本文档已归档，**不得**用于 Production Review 或新功能缺口判定。  
> **替代真源：** [101 v2.0.0](./101-CMS与内容运营中心实施蓝图.md) · [TT-OFFICIAL-OPS-CAPABILITY-MATRIX](../../runbook/TT-OFFICIAL-OPS-CAPABILITY-MATRIX.md) · `frontend/app/admin/README.md` · `registry/official-ops-capability-matrix.v1.yaml`

**Version:** 1.1.0 · **最后更新：** 2026-06-08 · **归档：** 2026-07-01  
**文档类型：** **Operations Coverage Audit** — 运营后台覆盖矩阵 + P0/P1/P2 缺口登记  
**审计约束**：**FINAL_SYSTEM_AUDIT: PASS（frozen）** — 本报告 **不**修改 Escrow / 订单状态机 / 治理执行 / 支付 / 已闭业务链；**不**新增功能或业务逻辑，仅登记覆盖率与缺口。  
**基准文档**：[101 v2.0.0](./101-CMS与内容运营中心实施蓝图.md) · [120-S5 Catalog Freeze](./120-S5-Catalog-Release-Freeze-Report.md) · [133-G-S8 Growth Freeze](./133-G-S8-Growth-Release-Freeze-Report.md) · [135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md) · [40-D-Admin机制](./40-D-Admin机制.md) · [FINAL-SYSTEM-AUDIT-REPORT](../../runbook/FINAL-SYSTEM-AUDIT-REPORT.md)

> **SSOT（必读）**：本报告为 **Gap 登记**；HTTP 机读仍以 **[04 §3.4](../../spec/04-后端与API.md)** 为准；Admin 产品叙事 **[70](../../spec/70-管理员系统开发文档.md)**；实现真源 **`frontend/app/admin/`** · **`crates/api/src/routes/admin/`**。

**阶段口径**：**① 本地代码真源**（2026-06-08 扫描 · Post-S5 · Post-G-S8）；Catalog RO+Import **GO** · Growth Admin **GO** · CMS/Official Admin CRUD **HOLD**。

**先读**：[101](./101-CMS与内容运营中心实施蓝图.md) · [40-D](./40-D-Admin机制.md)

---

<a id="ac104-0-exec"></a>

## 0. 执行摘要

| 维度 | 扫描结果 |
|------|----------|
| **Admin 页面** | **75** 路由页（含 S1 新增 `/admin/content` · `/admin/official` · `/admin/growth` Hub） |
| **Admin API** | **~94+** 端点；Growth **`/admin/growth/*` GO**（133）；**0** 条 `/admin/content/*` · `/admin/official/*` |
| **PostgreSQL** | migration 含 `catalog_*` · `ops_*` · growth 表族 **GO**（S1+G-S3/G-S6） |
| **Legacy OPS（P4）** | **较成熟** — 社区审核 · 入驻 · 财务观测 · RBAC · 合规 |
| **P1 Catalog 数据面** | **FREEZE GO** — RO API · Import · Consumer（ENABLED=0） |
| **P1 CMS Admin** | **HOLD** — Hub + RBAC · 无 content CRUD |
| **P2 Official OPS** | **HOLD** — Hub + DDL · seed/env 真源 |
| **P3 Growth** | **FREEZE GO** — G-S1～G-S8 Admin + `/me/referrals` |
| **硬编码运营面（B 层）** | TS fallback · showcase · seed/env — CMS/Official Admin 未替代 |
| **冻结域 Admin** | 订单/Escrow/争议 **只读观测**为主；**禁止**本报告建议改状态机 |

**覆盖评级图例**

| 符号 | 含义 |
|------|------|
| **F** | Full — Admin 可管理（读+写或完整审核链） |
| **P** | Partial — 只读/局部写/Hub 无子能力 |
| **H** | Hardcoded — 依赖 TS/env/seed，无 Admin |
| **M** | Missing — 101 规划态，代码未实现 |
| **S1** | S1 stub — Hub/DDL/RBAC 已建，能力未接通 |
| **Fr** | Frozen — FINAL Audit 域；Admin 仅观测，不可改核心逻辑 |

---

<a id="ac104-1-matrix"></a>

## 1. 运营后台覆盖矩阵（全功能扫描）

### 1.1 图例列

| 列 | 说明 |
|----|------|
| **Admin UI** | `/admin/*` 页面是否存在且可用 |
| **Admin API** | `/api/v1/admin/*` 是否实现 |
| **DB** | PostgreSQL 表/列是否具备 |
| **缺口类型** | CMS · 审核 · 配置 · 运营 · 观测 · 风控 · 统计 |

---

### 1.2 Identity · Auth · KYC

| 功能 | Admin UI | Admin API | DB | 覆盖 | 缺口类型 | 备注 |
|------|----------|-----------|-----|------|----------|------|
| 用户列表/详情 | `/admin/users` **F** | GET users **F** | users **F** | **P** | 审核 · 运营 | KYC 仅 filter；无独立 KYC 工单页 |
| 角色/console-role | `/admin/users/[id]` **P** | PUT console-role **F** | admin_console_roles **F** | **P** | 配置 | users.role 与 console_role 双轨 |
| 注册/登录审计 | `/admin/auth-audit-events` **F** | GET auth-audit-events **F** | auth_audit_events **F** | **F** | 观测 | — |
| KYC 状态变更 | — **M** | — **M** | users.kyc_status **F** | **P** | 审核 | 无 Admin KYC 审核 UI；业务 API 改状态 |
| Wallet 验证 | — **M** | — **M** | wallet_verify_challenges **F** | **M** | 审核 · 观测 | 无 Admin 入口 |
| Session 治理 | — **M** | — **M** | sessions **F** | **M** | 运营 · 风控 | 70 Target 未实现 |
| DSAR / 合规请求 | `/admin/compliance/requests` **F** | GET/PATCH **F** | compliance_data_requests **F** | **F** | 审核 · 合规 | SuperAdmin 写 |

---

### 1.3 Onboarding · Provider · Steward · Acquisition

| 功能 | Admin UI | Admin API | DB | 覆盖 | 缺口类型 | 备注 |
|------|----------|-----------|-----|------|----------|------|
| 商家入驻审核 | `/admin/provider-applications` **F** | provider-applications **F** | onboarding 表族 **F** | **F** | 审核 | Inbox 队列 |
| 主理人入驻审核 | `/admin/steward-applications` **F** | steward-applications **F** | 同上 **F** | **F** | 审核 | — |
| 准入费/权益 | `/admin/onboarding/entitlements` **F** | onboarding entitlements **F** | onboarding_entitlements **F** | **F** | 运营 · 财务 | — |
| 支付事件/webhook | payment-events · webhook-jobs **F** | onboarding API **F** | payment/webhook 表 **F** | **F** | 观测 · 运营 | — |
| 收购发布暂停 | users 详情 **P** | PATCH acquisition-publish-suspend **F** | acquisition 列 **F** | **P** | 运营 · 风控 | 无独立 acquisition 控制台 |
| 旅行收购 listing | — **M** | — **M** | market_listings **F** | **H** | 运营 | 用户 `/market/acquisition` 自服务；Admin 无 listing CMS |

---

### 1.4 Orders · Escrow · Disputes · Reviews（FINAL Audit · Fr）

| 功能 | Admin UI | Admin API | DB | 覆盖 | 缺口类型 | 备注 |
|------|----------|-----------|-----|------|----------|------|
| 订单列表/详情 | `/admin/orders` **F** | GET orders **F** | orders **F** | **P** · **Fr** | 观测 | **只读**；无 Admin 改状态 |
| Escrow 订单页 | — **M** | — **M** | orders.escrow_* **F** | **Fr** | 观测 | 用户 `/escrow/[id]`；Admin 无专页 |
| Escrow 链上索引 | indexer/reconcile **F** | reconcile-reports **F** | event_log 投影 **F** | **P** · **Fr** | 观测 | 对账只读；不改 Escrow 逻辑 |
| 争议列表/详情 | `/admin/disputes` **F** | GET disputes **F** | disputes **F** | **P** · **Fr** | 审核 · 观测 | UI 只读；仲裁写路径在冻结域 |
| Reviews | `/admin/reviews` **F** | GET reviews **F** | reviews **F** | **P** | 观测 | 只读列表 |

---

### 1.5 Community（FINAL Audit · 较完整）

| 功能 | Admin UI | Admin API | DB | 覆盖 | 缺口类型 | 备注 |
|------|----------|-----------|-----|------|----------|------|
| 举报队列 | reports **F** | GET/PATCH reports **F** | community_reports **F** | **F** | 审核 | Inbox 入口 |
| 申诉 | appeals **F** | GET/POST review **F** | community_appeals **F** | **F** | 审核 | — |
|  moderation cases | moderation/cases **F** | GET cases **F** | community_moderation_cases **F** | **F** | 审核 | — |
| 处罚 | penalties **F** | POST penalties **F** | community_penalties **F** | **F** | 风控 | — |
| 评论可见性 | comments/visibility **F** | PATCH comments **F** | community_comments **F** | **F** | 审核 | SuperAdmin |
| 滥用策略 | abuse-policy **F** | PATCH abuse-policy **F** | community_abuse_policy **F** | **F** | 配置 · 风控 | — |
| 风险信号 | risk-signals **F** | GET risk-signals **F** | community_risk_signals **F** | **F** | 风控 · 观测 | — |
| 政策变更日志 | policy-change-logs **F** | GET **F** | community_policy_change_logs **F** | **F** | 观测 | — |
| 排名快照 | ranking/snapshots **F** | GET snapshots **F** | did_rank 表 **F** | **P** | 统计 | 只读快照 |
| **官方攻略创作** | — **M** | — **M** | community_posts **F** | **H** | CMS · 运营 | dev `communityShowcase*` inject |
| UGC 内容 CMS | — **M** | — **M** | community_posts **F** | **M** | CMS | 仅 moderation，非内容编辑台 |

---

### 1.6 Governance · Trust · Cross-domain

| 功能 | Admin UI | Admin API | DB | 覆盖 | 缺口类型 | 备注 |
|------|----------|-----------|-----|------|----------|------|
| Cross-check 对拍 | `/admin/cross-check` **F** | GET cross-check **F** | 多源投影 **F** | **P** | 观测 | 只读 JSON |
| Drift summary | `/admin/drift-summary` **F** | GET drift-summary **F** | 投影 **F** | **P** | 观测 | — |
| 治理提案 Admin | — **M** | observability 内嵌 **P** | governance_proposals **F** | **P** · **Fr** | 观测 · 配置 | 无独立 proposals CRUD 页 |
| 治理池/链上读 | — **M** | cross-check 引用 **P** | 投影 **F** | **P** · **Fr** | 观测 | ③ 链上 GO 另闸 |
| Trust Gate / DID | observability **P** | overview **F** | trust 相关 **F** | **P** | 观测 | 无 trust 专页 |
| **Trust Growth A/B** | `/admin/trust-growth` **F** | PATCH control **F** | trust_growth_* **F** | **F** | 配置 · 统计 | **≠** Growth Center P3 |

---

### 1.7 Finance · Indexer · Platform · Compliance

| 功能 | Admin UI | Admin API | DB | 覆盖 | 缺口类型 | 备注 |
|------|----------|-----------|-----|------|----------|------|
| 财务摘要 | `/admin/finance` **F** | GET finance/summary **F** | 聚合 **F** | **P** | 统计 | 只读 |
| 财务套件/对账 | finance-suite · reconciliation **F** | export **F** | reconciliation_reports **F** | **F** | 观测 · 统计 | — |
| Fee Router 事件 | `/admin/fee-router` **F** | GET routed-events **F** | fee_router_* **F** | **P** | 观测 | — |
| Region Vault | `/admin/region-vault` **F** | GET forwarded-events **F** | region_vault_* **F** | **P** | 观测 | — |
| Indexer 健康/对账 | `/admin/indexer` **F** | indexer/* **F** | chain 投影 **F** | **F** | 观测 | — |
| Observability | `/admin/observability` **F** | GET overview **F** | 多源 **F** | **F** | 观测 | Admin Home KPI 同源 |
| Flags/Policies/Releases | config hub **F** | GET/POST publish **F** | config_* **F** | **F** | 配置 | 审批链 + SuperAdmin publish |
| Scheduler/Jobs | scheduler/jobs **F** | GET/rerun **F** | admin_jobs **F** | **P** | 运营 | rerun 需 approve |
| 审批中心 | `/admin/approvals` **F** | GET/POST approve **F** | admin_approval_requests **F** | **F** | 审核 | 横切 |
| RBAC/权限 | `/admin/permissions` **F** | capabilities/route-matrix **F** | admin_console_roles **F** | **F** | 配置 | v4 含 CMS/Growth perm |
| Media 签发审计 | media/* **F** | GET access-logs **F** | media 表 **F** | **P** | 观测 | 非媒体库 CMS |
| 内部工具审计 | internal-tools/audits **F** | GET **F** | internal_tool_audits **F** | **P** | 观测 | — |

---

### 1.8 Market · Guide · Merchant · Custom Itinerary

| 功能 | Admin UI | Admin API | DB | 覆盖 | 缺口类型 | 备注 |
|------|----------|-----------|-----|------|----------|------|
| Market 公开 listing | — **M** | 用户 POST listings **F** | market_listings **F** | **H** | 运营 · CMS | 商家自服务；Admin 无 listing 审核台 |
| Market demo fallback | — **H** | — | data_origin **F** | **H** | 运营 | `marketSubsiteDemo*` TS |
| Market 冷启动 seed | — **H** | internal seed **H** | guides/orders **F** | **H** | 运营 | env `MARKET_PUBLIC_SHOWCASE` |
| 向导 KYB | `/admin/guides` **F** | GET/PATCH guides **F** | guides **F** | **F** | 审核 | B-080 |
| 商家 KYB | provider-applications **F** | 见 §1.3 **F** | — **F** | **F** | 审核 | — |
| 自定义行程 POI 目录 | — **H** | POST itineraries **F** | itinerary_* **F** | **H** · RO **GO** | CMS | **双读**：TS 默认 · PG RO（120） |
| 国家/城市/交通 | — **H** | meta/core **H** · `GET /catalog/*` **GO** | catalog_* **GO** | **P** | CMS | Admin CRUD **HOLD**（C-S1） |
| 国家定价 | — **H** | — **H** | — **M** | CMS · 配置 | `frontend/lib/countries/*` |
| 行程草稿 Admin | — **M** | — **M** | itinerary_custom_drafts **F** | **M** | 运营 · 观测 | 无 Admin 读用户草稿 |

---

### 1.9 P1 CMS · Content Center（101 M1–M6 · Post-S5）

| 模块 | Admin UI | Admin API | DB / RO | 覆盖 | 缺口类型 | 并行真源 |
|------|----------|-----------|---------|------|----------|----------|
| M1 国家 | Hub only | — **HOLD** | catalog_countries **GO** · RO **GO** | **P** | CMS Admin | TS/core 默认 · PG opt-in |
| M2 城市 | 侧栏 404 | — **HOLD** | catalog_cities **GO** · RO **GO** | **P** | CMS Admin | `geoOptions.ts` · S4 geo |
| M3–M5 POI | 侧栏 404 | — **HOLD** | catalog_pois **GO** · RO **GO** | **P** | CMS Admin | `cityDetails/*` |
| M6 POI 图片 | 侧栏 404 | — **HOLD** | DDL+import+RO **GO** · Admin **HOLD** | **P** | CMS 审核 | `poiImageVerification/*` · 116 |
| 城际交通 | — | RO **GO** | catalog_intercity_routes **GO** | **P** | CMS Admin | `interCityTransport.ts` |
| 国家定价 | — | RO **GO** | catalog_country_pricing **GO** | **P** | CMS Admin | `lib/countries/*` |
| 公众 catalog 读 | — | **`GET /catalog/*` GO** | import **GO** | **F** | — | 112/120 FREEZE |
| FE Consumer | — | flag=0 **FREEZE** | — | **F** | 切流 C-S6 | 113–114 |
| Landing 氛围/SEO | — **H** | — **HOLD** | payload **部分** | **H** | CMS · 配置 | `landingAmbientByCountry.ts` |

---

### 1.10 P2 Official OPS（101 M7–M10）

| 模块 | Admin UI | Admin API | DB | 覆盖 | 缺口类型 | 硬编码/env 真源 |
|------|----------|-----------|-----|------|----------|-----------------|
| M7 官方账号 | Hub **S1** | — **M** | ops_official_accounts **S1** | **M** | 运营 | `seed_*` · `SEED_TEST_ACCOUNTS` |
| M8 官方攻略 | 侧栏 404 **S1** | — **M** | ops_official_guide_posts **S1** | **H** | CMS · 运营 | `communityShowcase*.ts` |
| M9 行程模板 | 侧栏 404 **S1** | — **M** | ops_official_itinerary_templates **S1** | **H** | 运营 | `marketDevVarietyOrders` · seed |
| M10 冷启动 Campaign | 侧栏 404 **S1** | — **M** | ops_cold_start_* **S1** | **H** | 运营 · 配置 | 6+ `NEXT_PUBLIC_*` / env 矩阵 |
| public_catalog_surface | — **M** | internal stats **P** | data_origin 列 **F** | **P** | 观测 · 运营 | 无 Admin 面板 |

---

### 1.11 P3 Growth Center（101 G1–G7 · **G-S8 FREEZE GO**）

| 模块 | Admin UI | Admin API | DB | 覆盖 | 缺口类型 | 冻结备注（133） |
|------|----------|-----------|-----|------|----------|-----------------|
| G1 Referral Codes | referral-codes **F** | Admin CRUD **F** | referral_codes **F** | **F** | — | register `?ref=` **GO** |
| G2 Early Bird | early-bird **F** | PATCH stages **F** | early_bird_stages **F** | **F** | — | Observer **GO** |
| G3 Airdrop | airdrop-campaigns **F** | snapshot/calc **F** | airdrop_* **F** | **F** | 链上 | approve/distribute **HOLD** |
| G4 KOL Center | kol-center **F** | 只读 **F** | 读模型 **F** | **F** | GMV | 无订单投影 |
| G5 Reward Ledger | reward-ledger **F** | reconcile **F** | growth_point_ledger **F** | **F** | 审批 inbox | 人工调账审批 **HOLD** |
| G6 Anti-Fraud | anti-fraud **F** | freeze/unfreeze **F** | growth_fraud_* **F** | **F** | auto-scan | fraud-scan 引擎 **HOLD** |
| G7 Growth Analytics | analytics **F** | 只读 **F** | 聚合 **F** | **F** | — | **≠** trust-growth |
| `/me/referrals` | page **F** | GET me **F** | users growth 列 **F** | **F** | — | G-S4 |
| 链上 GOV 发放 | — | — | — | **HOLD** | ③ | PI3-005 另轨 |

---

### 1.12 Analytics · 统计 · 转化

| 功能 | Admin UI | Admin API | DB | 覆盖 | 缺口类型 | 备注 |
|------|----------|-----------|-----|------|----------|------|
| Admin Home KPI | `/admin` **F** | metrics/home **F** | 聚合 **F** | **P** | 统计 | 队列/disputes 等 |
| 转化漏斗 | `/admin/conversion-analytics` **P** | — **H** | — **M** | **H** | 统计 | **localStorage only**，无服务端 |
| 社区/市场 GMV 运营看板 | — **M** | — **M** | orders **F** | **M** | 统计 | G4 KOL 未实现 |
| Banner/首页 A/B 统计 | trust-growth **F** | observability **F** | trust_growth **F** | **P** | 统计 | 非 Growth Analytics |

---

<a id="ac104-2-summary"></a>

## 2. 覆盖汇总（按 Admin 能力类型）

| 能力类型 | 已具备（F/P） | 硬编码（H） | 缺失/规划（M/S1） |
|----------|---------------|-------------|-------------------|
| **审核** | 社区 · 入驻 · 向导 · 审批 · DSAR | — | KYC 专页 · 官方内容审核 |
| **配置** | flags · policies · releases · trust-growth A/B · abuse-policy | 冷启动 env 矩阵 | Early Bird · Banner CMS · 定价 CMS |
| **运营** | 用户 · onboarding · acquisition suspend · **Growth Admin GO** | showcase · seed · demo listing | Official 账号 · Campaign |
| **观测** | observability · indexer · audit · cross-check · catalog RO | — | public_catalog Admin 面板 |
| **风控** | community penalties · risk-signals · **Growth anti-fraud GO** | — | — |
| **统计** | finance summary · reconcile · home KPI · **Growth analytics GO** | conversion localStorage | KOL GMV 投影 **HOLD** |
| **CMS** | **Catalog RO/Import GO** | cityDetails · countries · landing **默认** | **Admin M1–M6 HOLD**（C-S1～C-S2） |

---

<a id="ac104-3-hardcoded"></a>

## 3. 硬编码依赖清单（无 Admin 入口）

| ID | 资产/机制 | 路径/门闸 | 影响面 | 101 替代 |
|----|-----------|-----------|--------|----------|
| HC-01 | 十国白名单 | `productCountries.ts` · `product_countries.rs` | Landing/Market/Itinerary | M1 catalog |
| HC-02 | 预设城市 | `geoOptions.ts` · `preset_cities.rs` | 筛选/注册/行程 | M2 |
| HC-03 | POI 目录 | `cityDetails/*` (~2800+ 行) | CustomItineraryModal | M3–M5 |
| HC-04 | POI 图片 | `poiImageVerification/*` | 行程卡片图 | M6 |
| HC-05 | 国家定价 | `frontend/lib/countries/*` | 报价 | P1 CMS |
| HC-06 | 社区 showcase | `communityShowcase*.ts` | dev feed inject | M8 |
| HC-07 | Market seed | `seed_market_public_showcase.rs` | env | M9/M10 |
| HC-08 | 示意订单 | `marketDevVarietyOrders.ts` | env | M9 |
| HC-09 | Demo merchant | `marketSubsiteDemo*.ts` | fallback | M7/M10 |
| HC-10 | 冷启动 env | 6+ `NEXT_PUBLIC_*` / TRAVELTRUST_* | 公众面过滤 | M10 |
| HC-11 | 转化漏斗 | `localStorage` | conversion-analytics | P1 服务端漏斗 |
| HC-12 | Landing 氛围 | `landingAmbientByCountry.ts` | `/` 背景 | P2 CMS |

---

<a id="ac104-4-gap-report"></a>

## 4. Admin Coverage Gap Report（P0 / P1 / P2）

### 4.1 P0 — CMS Admin 与 B 层 blocker（101 v2.0.0 · Post-Freeze）

| ID | 缺口 | 域 | 现状 | 目标 | Sprint |
|----|------|-----|------|------|--------|
| **P0-ADM-01** | Admin Content CRUD M1–M5 | P1 | RO **GO** · Admin **HOLD** | `/admin/content/*` + API | **C-S1** |
| **P0-ADM-02** | publish-queue / catalog publish | P1 | 404 | approvals 扩展 | **C-S1** |
| **P0-ADM-03** | M6 POI 图审核闭环 | P1 | RO **GO** · Admin **HOLD** | `/admin/content/poi-images` | **C-S2** |
| **P0-ADM-04** | smoke-admin-content-p0-local | 横切 | 未绿 | exit 0 | **C-S1–C-S2** |

**已关闭（勿再登记 P0）**

| ID | 项 | 判定 |
|----|-----|------|
| ~~P0-ADM-04 Referral~~ | G-S1～G-S8 | **FREEZE GO** |
| ~~P0-ADM-05 Growth Ledger~~ | G-S2 | **FREEZE GO** |
| ~~Catalog RO API~~ | 112/120 | **FREEZE GO** |
| ~~S1 DDL 未应用~~ | migrations | **GO** |

**Official P1/P2（非 A 层阻塞）**

| ID | 缺口 | Sprint |
|----|------|--------|
| **P1-ADM-O1** | M7 Official Accounts | **O-S1** |
| **P1-ADM-O2** | M8 Official Guides | **O-S2** |
| **P2-ADM-O3** | M9 Templates | **O-S3** |
| **P2-ADM-O4** | M10 Cold Start | **O-S4** |

> **不纳入 P0 修复（冻结）**：Escrow 状态写 · 订单状态机 Admin 写 · 治理执行 Admin 写 · 支付 webhook 改路。

> **S2 设计（2026-06-07）**：P0-ADM-01/07/08 的 Catalog 闭环设计见 **[105](./105-S2-Catalog-CMS深度设计评审.md)**；**S2-DB-004 审计**见 **[106-Catalog-CMS-Implementation-Readiness-Report](./106-Catalog-CMS-Implementation-Readiness-Report.md)**（**CONDITIONAL GO** · **不含 Growth**）。

---

### 4.2 P1 — 测试网运营期建议（②）

| ID | 缺口 | 域 | 说明 |
|----|------|-----|------|
| **P1-ADM-01** | 国家/城市 open_status CMS | P1 | 101 P1-01 |
| **P1-ADM-02** | 国家定价 CMS | P1 | `lib/countries/*` |
| **P1-ADM-03** | Featured/推荐池 | P2 | `ops_featured_slots` |
| **P1-ADM-04** | Growth Analytics / KOL GMV 投影 | P3 | G7 **GO** · GMV **HOLD** |
| **P1-ADM-05** | 服务端转化漏斗 | 统计 | 替代 localStorage |
| **P1-ADM-06** | public_catalog_surface Admin | P2 | internal stats → 面板 |
| **P1-ADM-07** | Market listing Admin 审核 | Market | 商家 listing 运营台 |
| **P1-ADM-08** | KYC 专页/工单 | Identity | 用户 KYC 审核 UX |
| **P1-ADM-09** | 治理提案 Admin UI | Governance | 只读 observability → 专页 |
| **P1-ADM-10** | Banner/SEO/i18n CMS | CMS | 与 trust-growth 并存 |
| **P1-ADM-11** | Early Bird + Airdrop Admin 完整 | P3 | **GO** · approve distribute **HOLD** |
| **P1-ADM-12** | Growth Anti-Fraud 中心 | P3 | **GO** · auto-scan **HOLD** |

---

### 4.3 P2 — 公网/后期（③）

| ID | 缺口 | 说明 |
|----|------|------|
| **P2-ADM-01** | 链上 GOV Airdrop distribute Admin | ③ Owner 授权 |
| **P2-ADM-02** | 视频/媒体库 CMS | 270 扩展 |
| **P2-ADM-03** | Help/Terms/法务 CMS | — |
| **P2-ADM-04** | Session 治理 / 黑名单 Admin | 70 Target |
| **P2-ADM-05** | 多语言内容工作流 | — |
| **P2-ADM-06** | Escrow Admin 专页（若产品要求） | 须 frozen 域变更程序 |
| **P2-ADM-07** | 区域运营商分润/GMV 结算 | Growth P2 |

---

<a id="ac104-5-plane"></a>

## 5. 四平面 Admin 覆盖对照（101 v2.0.0）

| 平面 | Admin 组 | 页面 | API | 运营可用度 |
|------|----------|------|-----|------------|
| **P4 Legacy** | operations · community · finance · … | **75** | **~94+** **F/P** | **① 可运营** |
| **P1 Catalog 数据** | — | — | **`GET /catalog/*` GO** | RO+Import **FREEZE** |
| **P1 CMS Admin** | content | 七子页 **GO（C-S1）** | Admin content **GO** | **部分可运营** |
| **P2 Official** | official_ops | Hub · 子链 **404** | **0** official write | **不可运营** · **O-S1** |
| **P3 Growth** | growth | 七子页 **GO** | Admin growth **GO** | **FREEZE 可运营**（133） |

**汇合闸**：`check-c-s1-admin-content-crud-publish-queue.sh` — **C-S1 已绿** · Growth `check-g-s8` — **已绿**

---

<a id="ac104-6-frozen"></a>

## 6. FINAL System Audit 合规声明

| 审计域 | Admin 覆盖策略 | 本报告建议边界 |
|--------|----------------|----------------|
| Order–Escrow–Dispute | 只读 + 对账观测 | **不**登记「Admin 改状态」为 P0 |
| Community | 审核写路径 **已实现** | 维持；official 创作走 P2 |
| Identity–Trust–Governance | 观测/对拍为主 | 治理 **执行** 仍链上/冻结 |
| Admin Security | RBAC v4 已扩展 | 2FA enforce **② 闸** |
| Growth（新增） | **additive only** | 积分 Observer；不改 Escrow |

---

<a id="ac104-7-roadmap"></a>

## 7. 缺口消化顺序（101 v2.0.0 · C-S / O-S）

```
DOC-101-RW（135 · P0 文档）
  → C-S1 Admin Content CRUD + publish-queue（破 120）
  → C-S2 M6 POI 审核
  → C-S3 定价/交通/landing Admin
  → C-S4 revisions · import Admin · 观测面板
  → C-S5 server geo 预备（不默认开 flag）
  → C-S6 Consumer ENABLED=1 opt-in（120 程序）

∥ O-S1 Official Accounts
  → O-S2 Guides
  → O-S3 Templates
  → O-S4 Cold Start Campaign

Growth G-S1～G-S8：FREEZE — 勿重复开发
Catalog S2～S5：FREEZE — 回归 check-s5
```

---

<a id="ac104-8-refs"></a>

## 8. 审计真源索引

| 主题 | 路径 |
|------|------|
| Admin 页面 | `frontend/app/admin/`（**75** pages） |
| Admin API | `crates/api/src/routes/admin/mod.rs` + 子模块 |
| RBAC v4 | `admin_rbac.rs` · `registry/admin-rbac-permissions.v1.yaml` |
| 侧栏 SSOT | `frontend/lib/admin/adminShell*NavLinks.ts` |
| CMS/Growth DDL | `crates/api/migrations/20260607120000_*.sql` 等 |
| 硬编码 catalog | `frontend/lib/cityDetails/` · `geoOptions.ts` |
| 101 合订蓝图 | [101 v2.0.0](./101-CMS与内容运营中心实施蓝图.md) |
| DOC-101-RW | [135](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md) |
| Catalog / Growth 冻结 | [120](./120-S5-Catalog-Release-Freeze-Report.md) · [133](./133-G-S8-Growth-Release-Freeze-Report.md) |
| FINAL Audit | [FINAL-SYSTEM-AUDIT-REPORT.md](../../runbook/FINAL-SYSTEM-AUDIT-REPORT.md) |

---

**报告状态**：**Operations Coverage Audit v1.1.0 · Post-S5/Post-G-S8** · **无代码/业务逻辑变更**  
**登记缺口**：P0 CMS Admin **4** · P1 **12** · P2 **7** · Growth/Catalog 数据面 **已关闭**
