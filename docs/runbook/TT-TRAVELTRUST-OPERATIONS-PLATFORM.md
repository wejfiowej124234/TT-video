# TravelTrust Operations Platform (TTOP)

**机读 SSOT：** [`registry/traveltrust-operations-platform.v1.yaml`](../../registry/traveltrust-operations-platform.v1.yaml) (v2)  
**Admin 实现架构（冻结）：** [`TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md`](TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md)  
**菜单 Source→Target：** [`TT-ADMIN-OPERATOR-MAP-SSOT.md`](TT-ADMIN-OPERATOR-MAP-SSOT.md)

## 组织原则（生产阶段）

**按运营职能组织，不按技术模块组织。**

- **对外 / 文档 / RBAC / 团队边界** → 六个 Operations Domain（本 runbook）
- **代码与路由实现** → 冻结的四中心（Content · Official Ops · User Management · Platform）— **不扩中心**

```text
TravelTrust Operations Platform
├── Content Operations      背景 · 视频 · 文案 · 官方攻略内容
├── Catalog Operations    Guide/Provider/Acquisition/Official Guide 发布与维护
├── Campaign Operations   活动创建 · 投放 · 上下线 · Surface
├── Moderation Operations 审核 · 举报 · 违规处理
├── Business Operations   商家 · 向导 · 收购 · 订单走廊
├── Analytics & Growth      数据分析 · 推荐 · 增长策略
└── Platform Settings     RBAC · 作业 · 合规 · Feature Flags（非日常运营）
```

## 六域定义

| 域 | 典型日常工作 | 主要 Admin 路由 |
|----|--------------|-----------------|
| **Content Operations** | 背景图、Banner、Hero、官方图/视频、文案、POI 配图 | `/admin/content/*` |
| **Catalog Operations** | Guide/Provider/Acquisition/Official Guide **发布与维护**；Featured · Priority · Surface；OCS 基线 | `/admin/official/public-operations` · `/admin/official/guides` |
| **Campaign Operations** | 活动创建、item、deploy/下线、活动 Surface | `/admin/official/cold-start` |
| **Moderation Operations** | 入驻审核、举报、违规、申诉、社区审核 | `/admin/onboarding` · `/admin/approvals` · `/admin/community/*` |
| **Business Operations** | 商家/向导/收购业务管理、订单、争议、评价 | `/admin/users` · `/admin/orders` · `/admin/disputes` |
| **Analytics & Growth** | 漏斗、推荐序、热门、Referral/KOL、增长实验 | `/admin/growth` · `/admin/conversion-analytics` |

### Content vs Catalog（关键拆分）

| | Content Operations | Catalog Operations |
|--|-------------------|-------------------|
| **管什么** | 内容长什么样、写什么 | 什么身份、发到哪里、是否上线 |
| **Official Guide** | 正文、封面、标签 | 发布、Featured、Priority、Surface |
| **政策** | 可日更 mutable content | SOPCP · OCIP · OCS |

## 与冻结四中心的关系

| Operations Domain | 实现归属（冻结） |
|-------------------|------------------|
| Content Operations | Content Center |
| Catalog + Campaign Operations | Official Ops |
| Moderation Operations | User Management + Community |
| Business Operations | User Management |
| Analytics & Growth | Growth (+ Official Ops 统计) |
| Platform Settings | Platform Center |

**新功能纪律：** 先归入六域之一 → 映射四中心 → 写 SSOT（P7/P8）→ **不**新增第五中心或第六类技术模块名。

## RBAC 与团队扩展（生产）

- 权限模板按 **operations_domain** 划分（见 registry `rbac_future` 列表）
- **Catalog 发布** 与 **Content 编辑** 分权
- **Moderation** 与 **Business 走廊** 分权
- SuperAdmin 仅应急跨域；日常运营用域内角色
- Admin Console Personas（§10）继续用 ephemeral 邮箱验矩阵 — **不**固定 `content@test.com`

## 测试账号

**不改 C1–C4 不可变 ID**；在 registry 用 `operations_domain` 标注语义。  
OCS `@ocs.traveltrust.app` = **Catalog Operations** 官方生产身份。

**绑定原则：** 测试账号验证业务能力；官方运营账号承载用户可见内容。  
C1–C4 **永不**进入 Public Catalog（Guide · Provider · Acquisition · Official Guide · Campaign）。泄漏 → **DDG FAIL**。

详见：[`TT-DISPLAY-DATA-GOVERNANCE.md`](TT-DISPLAY-DATA-GOVERNANCE.md) §0.1

## OCS / SOPCP / OCIP

- **Catalog Operations** 维护唯一 Public Catalog（SOPCP）与稳定 UUID（OCIP）
- **Content Operations** 日更素材与文案
- **Campaign Operations** 活动投放，item 锚定 OCIP UUID

## 第三层：Operations Workflow

**SSOT：** [`registry/traveltrust-operations-workflow.v1.yaml`](../../registry/traveltrust-operations-workflow.v1.yaml) · [`TT-TRAVELTRUST-OPERATIONS-WORKFLOW.md`](TT-TRAVELTRUST-OPERATIONS-WORKFLOW.md)

每个 Operations Domain 有生命周期（Draft → Review → Publish → …），Admin 按 **Workflow** 组织，不是裸 CRUD。Guide 运营路径示例：

```text
Catalog → Publish Queue → Surface → Featured → Campaign → Analytics
```

## Local ↔ Staging 官方运营基线镜像（Phase ②）

**目标：** Local 与 Staging 共用同一套 OCS · SOPCP · OCIP · Workflow · Public Catalog，**不得**混入 ① 本地 seed / smoke / canonical 第二套运营数据。

**权威：** Staging API + Staging PostgreSQL（Phase ② SSOT）。

### 启动（推荐）

```bash
bash scripts/dev/start-api-local-staging-db-mirror.sh
```

- `fly proxy 15432:5432` → Staging Postgres
- Local `traveltrust-api` 进程 + Staging DB（无 pg_dump 版本偏差）
- **必须** `TRAVELTRUST_DEPLOYMENT_PROFILE=staging_mirror`、`TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=0`（禁止 C3 杭州 seed 泄漏到 `GET /guides`）
- **不得**使用根 `.env` 的 `DATABASE_URL=127.0.0.1:5432/traveltrust` 或 `profile=local`

### 闭环审计

```bash
bash scripts/dev/close-local-staging-ops-alignment.sh
```

验收：`PHASE2_LOCAL_STAGING_ALIGNMENT=PASS` · `blocking_count=0`。

证据根目录：`evidence/GO_operations_platform_alignment/<UTC>/`  
Sign-off：`evidence/manual-uat/signoff/LOCAL-STAGING-OPS-PLATFORM-ALIGNMENT-SIGNOFF-<UTC>.md`

### 治理 Gate（Evidence Reused · 策略生效，非重跑）

| Gate | 状态 | 含义 |
|------|------|------|
| RC Governance | CLOSED (Evidence Reused) | 已完成，未命中重跑条件 |
| DDG Governance | CLOSED (Evidence Reused) | 已完成，未命中重跑条件 |
| OCS Governance | CLOSED (Evidence Reused) | 已完成，未命中重跑条件 |
| Evidence Reuse Policy | ENFORCED | `CLOSED_UNLESS_TOUCHED` 生效 |

**Production 运营基线** 在 PI3 Production GO 完成后建立，不属于本次 Local ↔ Staging 收口范围。

## Market Subsite Frontend Race Fix（前端竞态 · 非数据治理）

**分类：** `Market Subsite Frontend Race Fix` — **前端 catalog 请求竞态**（首屏条数偏少、刷新后恢复），**不是** DDG / OCS / SOPCP 数据治理缺陷。

**症状：** `/market/provider` 与 `/market/acquisition` 首次进入偶现「2 条 → 刷新后 10 条」；根因为 `useMarketStandaloneBusinessPage` 无 epoch 守卫 + `localStorage` 国家偏好与 URL 查询竞态，**非** Public Catalog 真源不一致。

**修复：**

- `frontend/components/market/useMarketStandaloneBusinessPage.ts` — B-061 epoch guard、`useLayoutEffect` 国家偏好、`300ms` debounce
- `frontend/components/market/MarketSubsiteFilterBar.tsx` — 移除重复 `localStorage` hydration
- `frontend/components/market/MarketSubsiteMasonry.tsx` — 移除子节点重复 `data-listing-id`
- `frontend/e2e/market-subsite-catalog-race-regression.spec.ts` — `Set` 去重 + `gotoStaging` 重试 + acquisition `jp` 零结果 parity

**Staging 回归（v48 · Phase②）：** `frontend/e2e/market-subsite-catalog-race-regression.spec.ts`（`@staging`：provider + acquisition × 6 场景 vs API + **`data-tt-subsite-country` / `data-tt-subsite-list-count`**）

**Local Phase①（staging_mirror）：** 同上 spec 的 `@local_mirror` tag；API `127.0.0.1:8080` + Next `127.0.0.1:3012`

**真源审计：** `node scripts/dev/audit-market-subsite-race-fix-source-truth.cjs` — Phase①/② API 对拍 + 前端 fix marker 校验

**已知项归类（收口 · 非重开 DDG）：**

| 现象 | 归类 |
|------|------|
| 刷新后只显示 2 条（Kyoto+Tokyo） | **Fixed** — 前端竞态 + localStorage/URL hydration；非「目录只有 2 条」 |
| 部署后 staging 冷启动 | **Fixed** — `gotoWeb` 三次重试 + backoff |
| Masonry 重复 `data-listing-id` | **Fixed** — e2e `Set` 去重 + 组件去重 |
| Acquisition `country=jp` API=0 | **Expected Difference** — API 按 `destinationCountryIso` 过滤；UI 与 API 同为 0 |
| `ERR_CONNECTION_CLOSED` / API 瞬时 non-ok | **Transient Flake** — goto + API 三次重试 |

**状态：** **CLOSED**（stamp `20260703T104800Z` · Phase① 12/12 + Phase② 12/12 · source-truth audit **blocking_count=0**）

### Market Runtime 收口状态（与 CI Build 分离）

| 层 | 状态 |
|----|------|
| **API Truth** | **PASS** |
| **Frontend Runtime** | **PASS** |
| **Browser Runtime** | **PASS**（`data-tt-subsite-country` / `data-tt-subsite-list-count`） |
| **Source Truth** | **PASS** |
| **Evidence** | **CLOSED** |

**用户验收（首次打开即正确 · 非 Debug）：**

1. 打开 https://tt-web-staging.fly.dev/market/provider（或 `/market/acquisition`）
2. DevTools → Elements → `<main data-testid="market-provider-page">`
3. 期望：**`data-tt-subsite-country="all"`** · **`data-tt-subsite-list-count="10"`**
4. 子站筛选条点 **「全部国家」** 后条数仍为 10；点 **日本** 后 provider=2 / acquisition=0

**Debug Procedure（仅运维 · 不得作为用户验收步骤）：**

```javascript
// 仅当怀疑旧 prefs 污染时使用 — 见 Runbook Debug，非产品正常路径
localStorage.removeItem('tt_market_subsite_country_pref_provider');
localStorage.removeItem('tt_market_subsite_country_pref_acquisition');
location.reload();
```

### CI Build（单独登记 · 不属于 Market Race Fix）

| 项 | 值 |
|----|-----|
| **ID** | `CI-BUILD-20260703-V49-OOM` |
| **Severity** | **Low** |
| **Category** | **Build Infrastructure** |
| **Status** | **OPEN** |
| **说明** | v49 remote `npm run build` OOM；**v48 已上线** · 不挡 Market Runtime CLOSED |
| **Runbook** | [`TT-CI-BUILD-STABILITY.md`](TT-CI-BUILD-STABILITY.md) |
| **Evidence** | `evidence/GO_ci_build_stability/20260703T113000Z/` |

```bash
# 真源审计（Phase① API 须已起：start-api-local-staging-db-mirror.sh）
AUDIT_STAMP=20260703T104800Z node scripts/dev/audit-market-subsite-race-fix-source-truth.cjs

# Phase② staging 浏览器回归
MARKET_SUBSITE_RACE_TARGET=staging STAGING_WEB_BASE=https://tt-web-staging.fly.dev \
STAGING_API_BASE=https://tt-api-staging.fly.dev \
cd frontend && npx playwright test e2e/market-subsite-catalog-race-regression.spec.ts --grep @staging

# Phase① local_mirror
MARKET_SUBSITE_RACE_TARGET=local LOCAL_WEB_BASE=http://127.0.0.1:3012 LOCAL_API_BASE=http://127.0.0.1:8080 \
cd frontend && npx playwright test e2e/market-subsite-catalog-race-regression.spec.ts --grep @local_mirror

# 一键收口（含 build + deploy）
bash scripts/dev/close-market-subsite-frontend-race-fix.sh
# 已部署后仅复跑：bash scripts/dev/close-market-subsite-frontend-race-fix.sh --skip-deploy
```

**治理 Gate（保持 CLOSED · 不重开数据治理）：**

| Gate | 状态 | 说明 |
|------|------|------|
| OCS | CLOSED (Evidence Reused) | 未因本子站 UI 竞态重开 |
| DDG | CLOSED (Evidence Reused) | 非 Public Catalog 泄漏类缺陷 |
| SOPCP | CLOSED (Evidence Reused) | 未触碰 SOPCP 发布面 |

证据：`evidence/GO_market_subsite_frontend_race_fix/20260703T104800Z/race-fix-closure.json`  
Sign-off：`evidence/manual-uat/signoff/MARKET-SUBSITE-FRONTEND-RACE-FIX-SIGNOFF-20260703T104800Z.md`
