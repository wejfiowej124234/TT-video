# TT-OFFICIAL-COLD-START-DATASET · 官方运营冷启动数据集

**Version:** 1.0.0 · **生效：** 2026-07-03  
**机读：** [`registry/official-cold-start-dataset.v1.yaml`](../../registry/official-cold-start-dataset.v1.yaml)  
**Manifest：** [`data/official-cold-start/dataset.v1.json`](../../data/official-cold-start/dataset.v1.json)

## 目的

在 **RC / DDG 已 CLOSED** 的前提下，用 **Official Ops · Admin Public Operations** 建立可长期保留的 **官方冷启动基线**，模拟平台上线第 1/7/30 天运营态——**不**使用 smoke/demo/probe/multi-demo 数据。

## 原则

| 规则 | 说明 |
|------|------|
| 无测试泄漏 | 内容不含 probe/smoke/multi-demo/联调 等启发式词 |
| 无直连 SQL | 编排器只调 Admin / 用户 Market API |
| production 来源 | 实体经 **Publish** 后 `data_origin=production` |
| 公众过滤 | 符合 `public_catalog_only` · DDG · ML-DG |
| 可迁移 | Staging 验证后可按同 manifest 用于 Production |

## 数据集规模（Phase 1 · 已实现）

| 类型 | 数量 |
|------|------|
| 官方运营账号 | 5 |
| 向导 Guides | 10（10 国/城） |
| 商家 Provider | 10 |
| 收购 Acquisition | 10 |
| 官方攻略 Official Guides | 10 |
| 冷启动 Campaign | 10 surface bundles → **Official Cold Start Campaign** |
| Community Surface | **OCS Surface Expansion**（manifest `community_post` · 编排器扩展） |
| 历史订单 | **deferred**（Post-MVP） |

## OCS Surface Expansion（Official Surface Expansion）

**禁止命名：** Community Cold Start · Community Admin · `community-cold-start.v1.json` · Phase 1.5 Community Surface。

**单一真源原则（写死）：**

> 任何公众页面（Public Surface）不得拥有独立内容真源；所有官方内容必须来源于 **OCS Manifest**（`dataset.v1.json` + `state.json`）。

**消费面（均为 Surface · 非独立产品）：**

```text
Official Cold Start Dataset（唯一 Manifest）
        │
   Home · Market · Community · Explore · Destination Hub · Campaign · Guide · Provider
```

**Community Feed 只能来自 OCS — 禁止：**

- Community Seed · Community Showcase · Community Cold Start · 第二套 Community Manifest
- `TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE`（②③）
- `seed_community_public_showcase.rs` 作为公众主路径

**编排器（唯一 apply 路径 · 不新建脚本）：**

```text
Official Identity → Guide → Provider → Acquisition → Official Guide → Community Post → Campaign
```

全部 manifest item · 扩展 `run-official-cold-start-dataset.*` · **禁止** `run-official-community-cold-start.sh`

**Admin Official（非 Community Admin）：**

Guide · Provider · Market · Campaign · **Community Surface** — 同一 `/admin/official` Hub

**Destination Hub：** `destination_slug` 聚合 Guide · Community · Provider · Campaign（Explore 演进 · App 复用）

| 统一项 | 规则 |
|--------|------|
| **Manifest** | 仅 [`dataset.v1.json`](../../data/official-cold-start/dataset.v1.json) · `community_post` 为 manifest item |
| **Campaign** | **Official Cold Start Campaign** · 各 `home_*` / `market_*` / `community_*` 均为 Surface |
| **运营** | 改 manifest（`priority` · `surfaces` · `body_markdown`）· 不改代码 |

**Phase 1 CLOSED** · **OCS Surface Expansion** 状态机：

```text
IMPLEMENTING → READY_FOR_STAGING_VERIFICATION → VERIFIED
```

**当前：** `TT_OCS_SURFACE_EXPANSION: VERIFIED`（Staging · `20260704T073209Z` · 10/10 PASS · `OCS_STRICT_LEGACY_MEDIA=1`）

**证据：** `evidence/GO_official_cold_start_dataset/ocs-surface-expansion-staging/20260704T073209Z/`

**10 项机读验收（全部 PASS）：** OCS_MANIFEST · **OCS_SINGLE_SOURCE** · OFFICIAL_IDENTITY · PUBLIC_OPERATIONS · **SURFACE_CONSISTENCY** · COMMUNITY_FEED · CAMPAIGN · DESTINATION · REVERSE_GOVERNANCE · MEDIA（**`OCS_STRICT_LEGACY_MEDIA=1` 默认硬闸**）

### Staging 运营链路验收（写死 · 非「10 条帖子」计数）

| 验收项 | 应达到 |
|--------|--------|
| OCS Manifest | 10 条 `community_post` 均由 `run-official-cold-start-dataset.*` 创建 · 非 SQL/seed |
| Official Identity | 每条绑定 `author_account_slug` 对应 Official Account |
| Public Operations | Publish / Unpublish / Priority / Featured / Surface 可控 |
| Community Feed | 官方内容来自 `governed_community_posts_v1` 路径 · 无 test/demo 泄漏 |
| Campaign | `community_post` item_ref · 无第二数据源 |
| Destination（Round 1） | manifest `destination_slug` · 帖子 `destination` · Explore `api-aggregate-v1` · **不新建 Hub API** |
| Media | 无 Showcase / Sample / 阻断型 Legacy URL（manifest unsplash → enhancement · 后续 CDN） |
| Data Leakage | Demo / Showcase / Seed / Test = 0 |
| **Reverse Governance** | Publish → Feed 可见 → Unpublish → Feed / Explore / Campaign 同步失效 |

**反向治理（必过）：** 任选 OCS 官方帖（默认 `tokyo-photo`）走完 Publish → Feed → Unpublish → 消失 → Campaign 引用失效。

**执行（Staging 独立证据）：**

```bash
bash scripts/dev/run-ocs-surface-expansion-staging.sh
# 或分步：
# bash scripts/dev/run-official-cold-start-dataset.sh
# STATE=evidence/.../state.json API=https://tt-api-staging.fly.dev \
#   node scripts/dev/validate-ocs-surface-expansion-staging.cjs
```

通过后：`TT_OCS_SURFACE_EXPANSION: VERIFIED` · 证据根目录 `evidence/GO_official_cold_start_dataset/ocs-surface-expansion-staging/<UTC>/`

**诚实边界：** Staging **`TT_OCS_SURFACE_EXPANSION: VERIFIED`** = ② 运营数据基线 · **≠** G3-01 Production Network · **≠** Production GO · Destination Hub 完整聚合 **G3 后再做**。

### OCS Post-Apply DDG Remediation（收尾 · 非 G3）

**不是**新平台能力 · **不是**新 G 阶段 · **仅** OCS Surface Expansion 收尾。

```text
TT_OCS_SURFACE_EXPANSION: VERIFIED
        ↓
TT_OCS_POST_APPLY_DDG: PASS
        ↓
G3 Official Content Baseline V1 READY
        ↓
G3-01 Production Network（PLANNED）
```

| 目标 | 说明 |
|------|------|
| Official Avatar | manifest + Staging 全部 `/api/v1/uploads/guides/ocs/{chain}/v1-avatar.jpg` |
| DDG Heuristics | **FALSE_POSITIVE** / **EXPECTED_OFFICIAL** / **REAL_LEAK** 三层 |
| DDG Scan | `staging-full-site-display-governance-audit.cjs` **PASS** |
| Evidence | `evidence/GO_official_cold_start_dataset/ocs-post-apply-ddg-remediation/<UTC>/` |

**当前：** `TT_OCS_POST_APPLY_DDG: PASS`（Staging · `20260704T075847Z` · Avatar 10/10 · DDG blocking=0）

**证据：** `evidence/GO_official_cold_start_dataset/ocs-post-apply-ddg-remediation/20260704T075847Z/`

**执行：**

```bash
bash scripts/dev/run-ocs-post-apply-ddg-remediation.sh
```

**OCS 职责已闭合。** 不再继续优化 OCS Surface Expansion / Post-Apply DDG。

**Market listing legacy Unsplash cover（约 41 条 ADVISORY）** → 单独数据治理轨 **[Market Media DDG Remediation](TT-MARKET-MEDIA-DDG-REMEDIATION.md)**（**非 OCS 名下**）。

### Official Asset Baseline V1（写死 · Platform Frozen · OCS Single Source）

**机读键：** `TT_OCS_OFFICIAL_ASSET_BASELINE: V1` · `TT_OCS_ASSET_VERIFICATION: PASS`（Staging 验收后）

| 层 | SSOT |
|----|------|
| 内容 Manifest | `data/official-cold-start/dataset.v1.json` |
| 媒体 Manifest | `data/official-cold-start/assets.v1.json` |
| 二进制 | `data/official-cold-start/media/` → 部署 `data/community_post_media/` |

**Publish Gate（五项全部 PASS 方可发布）：** Metadata · Asset · Governance · Surface · Verification

| 脚本 | 作用 |
|------|------|
| `generate-ocs-official-media-assets.cjs` | 生成 assets.v1.json + 60 个 JPG + 同步 dataset URL |
| `bootstrap-ocs-official-assets.cjs` | 本地/Fly SSH 落盘（Staging/Production 共用路径） |
| `remediate-ocs-official-media-bindings-staging.cjs` | 已发布实体 URL 与 Manifest 对齐 |
| `verify-ocs-official-assets.cjs` | HEAD 200 · MIME · Content-Length · 图片可解码 |
| `run-ocs-official-asset-baseline.sh` | 一键 generate → bootstrap → bind → verify |

**禁止：** 已发布官方内容引用不存在媒体 · Feed 404 · 占位图 · Unsplash/Legacy 残留。

**执行（② Staging）：**

```bash
bash scripts/dev/run-ocs-official-asset-baseline.sh
# 或嵌入 OCS Surface Expansion：
bash scripts/dev/run-ocs-surface-expansion-staging.sh
```

**诚实边界：** ② Asset VERIFIED **≠** ③ Production CDN · Fly 卷/镜像须含 `community_post_media` 二进制。

---

## Official Content Baseline · V1 · READY

| 字段 | 值 |
|------|-----|
| **Version** | **V1** |
| **Status** | **READY** |
| **Machine key** | `TT_OCS_OFFICIAL_CONTENT_BASELINE: V1_READY` |

**版本纪律（写死）：** 新增官方城市 · Official Identity · Surface → **V1 → V1.1 → V2** — **不**原地改 `READY`。Production GO 引用 **pinned version**（如 **Official Content Baseline V1**），不是「当前最新」。

**长期原则（写死）：** `READY` 之后任何新增官方内容 **必须** 经 **OCS Manifest**（`dataset.v1.json` + `run-official-cold-start-dataset.*`）编排；禁止直接写库 / Seed / Showcase / 独立 Admin 发布。

**适用面（同一官方来源）：** Guide · Community · Provider · Acquisition · Campaign · Destination

---

## Release Train · 当前下一步

OCS 已完成职责。正式切回 Release Train：

```text
Official Content Baseline V1 · READY
        ↓
G3-01 Production Network · PLANNED
        ↓
IMPLEMENTING
        ↓
VERIFIED
```

专册：[`G3-PRODUCTION-DOMAINS.md`](G3-PRODUCTION-DOMAINS.md) · [`G3-01-PRODUCTION-NETWORK.md`](G3-01-PRODUCTION-NETWORK.md)

G3-01 专注 **Domain · DNS · TLS · CDN · WAF · CORS** — **不回到内容体系**。

并行可选（不阻塞 G3-01）：[`TT-MARKET-MEDIA-DDG-REMEDIATION.md`](TT-MARKET-MEDIA-DDG-REMEDIATION.md)

**机读：** [`official-cold-start-dataset.v1.yaml`](../../registry/official-cold-start-dataset.v1.yaml) · `staging_verification`

## 执行

```bash
# Staging 全量应用 + DDG 后置扫描
bash scripts/dev/run-official-cold-start-dataset.sh

# 仅编排（自定义 API）
API_BASE=https://tt-api-staging.fly.dev node scripts/dev/run-official-cold-start-dataset.cjs
```

环境变量：

- `TT_OCS_ACCOUNT_PASSWORD` — OCS 账号密码（默认 `OcsBaseline2026!`）
- `ADMIN_EMAIL` / `ADMIN_PASS` — SuperAdmin（默认 `tourist@test.com`）

## 流程（Admin 链路）

```text
Admin 登录
  → Official Accounts（production · publish）
  → 向导/商家账号登录 → POST guides / market listings
  → Public Operations publish + surfaces
  → Official Guides create → publish
  → Campaigns create → items → deploy
```

## 验收（Phase 1 · Staging CLOSED · 20260703T044855Z）

按以下顺序验收，**不**仅以脚本 exit 0 为准：

| 步骤 | 命令 / 检查 | 通过标准 |
|------|-------------|----------|
| Apply | `bash scripts/dev/run-official-cold-start-dataset.sh` | 5 ops 账号 · 10 链 · 10 Campaign |
| **Coverage** | `validate-official-cold-start-dataset.cjs` | chains **10/10** · ops **5/5** · campaigns **10/10** |
| **Surface Coverage** | 同上 | 首页/home_hero · Market provider/acquisition · Guides · Campaign 均 ≥1 条官方数据 |
| DDG | 后置 `staging-full-site-display-governance-audit.cjs` | `PRODUCT_DATA_DEFECT=0` · `TEST_DATA_LEAKAGE=0` |
| 展示 | Staging Web 抽查 | 非仅 DB 有数据；排序/关联可跳转 |
| 运营链 | 每城 ≥1 条 | Guide → Provider → Acquisition → Official Guide → Campaign |

```bash
STATE=evidence/GO_official_cold_start_dataset/<UTC>/state.json \
  node scripts/dev/validate-official-cold-start-dataset.cjs
```

**Market listing surfaces（必配）：** `provider` → `market_provider` + `market_feed`；`acquisition` → `market_acquisition` + `market_feed`。

**Merchant 账号：** apply 前自动调用 `POST …/accounts/:id/bootstrap-market`（provider / acquisition 门闸 + entitlement）。

## 证据

`evidence/GO_official_cold_start_dataset/<UTC>/`

- `state.json` — 实体 ID 映射（幂等重跑）
- `ocs-validate.json` — Coverage + Surface Coverage
- `ocs-l5-enterprise-audit.json` — L5 多维审计机读
- `OCS-L5-ENTERPRISE-AUDIT-REPORT.md` — 企业级审计报告
- `fs-dg-post.json` — 后置 DDG 扫描

## L5 企业级审计（Phase 1 · CLOSED）

```bash
STATE=evidence/GO_official_cold_start_dataset/<UTC>/state.json \
  OUT=evidence/GO_official_cold_start_dataset/<UTC>/ocs-l5-enterprise-audit.json \
  node scripts/dev/audit-official-cold-start-dataset-l5.cjs
```

**RC / DDG：CLOSED (Evidence Reused)** — 审计复用 `CLOSED_UNLESS_TOUCHED` 下已有 evidence；仅执行 OCS 维度的 live API 校验。

| 结果 | Staging `20260703T051500Z` |
|------|----------------------------|
| L5 评分 | **120/120 · L5_ENTERPRISE_BASELINE** |
| 基线结论 | **APPROVED** 作为 Staging 官方冷启动运营基线 |
| Blocking | 0 |
| Post-GO | Community/Orders deferred · 可选 browser UAT |

Sign-off: `evidence/manual-uat/signoff/OCS-L5-ENTERPRISE-AUDIT-SIGNOFF-20260703T051500Z.md`

## Enterprise L5 Readiness · Official Cold Start Baseline Audit

**不重开 RC/DDG** — 仅审计 OCS 基线 + 复用 CLOSED governance evidence。

```bash
STATE=evidence/GO_official_cold_start_dataset/<UTC>/state.json \
  OUT=evidence/GO_official_cold_start_dataset/<UTC>/ocs-baseline-readiness-audit.json \
  node scripts/dev/audit-official-cold-start-baseline-readiness.cjs
```

八维：产品 · 运营 · 数据治理 · RBAC · Public Operations · 冷启动 · 运营维护 · 发布治理

| 结果 | Staging `20260703T052100Z` |
|------|----------------------------|
| Verdict | **PASS · L5_ENTERPRISE_READINESS · 100/100** |
| Blocking / Major | **0 / 0** |
| Minor | 5 (campaign item 部分缺失 — 首次 slug ref) |
| Phase 1 freeze | **YES** |
| Production baseline | **After parity apply + PI3** |
| Official Ops 1.1 | **Not met** (Community/Orders/RBAC — Post-GO) |

报告：`OCS-ENTERPRISE-L5-READINESS-AUDIT-REPORT.md`  
Sign-off：`OCS-BASELINE-READINESS-SIGNOFF-20260703T052100Z.md`

## 与 DDG 关系

OCS 已纳入 **Evidence Reuse Policy** · **`CLOSED_UNLESS_TOUCHED`**（与 RC / DDG 同级）。

| 机读键 | 值 |
|--------|-----|
| `TT_OFFICIAL_COLD_START_DATASET` | `CLOSED` |
| `TT_OFFICIAL_COLD_START_RERUN_POLICY` | `CLOSED_UNLESS_TOUCHED` |

**默认：不得重新 apply / 重新生成。** 复用 `latest_staging_apply` evidence 与 `state.json`。

**重跑触发（六类 · 路径清单见 `registry/evidence-reuse-policy.v1.yaml`）：**

1. **manifest 修改** — `data/official-cold-start/**`
2. **Campaign 结构修改** — cold-start campaigns / items schema & Admin API
3. **Official Account 模型修改** — `ops_official_accounts` · Admin HTTP
4. **Public Surface 修改** — display surfaces · public catalog filters
5. **data_origin 修改** — migrations · catalog origin rules
6. **Official Ops API 修改** — Public Operations · Official Guides · consumer routes

重跑 apply 后须同步：`validate-official-cold-start-dataset.cjs` + `staging-full-site-display-governance-audit.cjs`。

**不** 自动重开 RC。DDG 的 OCS 路径已移至 OCS gate 独占；仅 OCS 重跑时连带 DDG post-scan。

## 三层运营体系

| 层 | SSOT | 作用 |
|----|------|------|
| L1 数据治理 | DDG · SOPCP · OCIP · OCS | Official Dataset → Identity → Public Catalog |
| L2 运营平台 | [`traveltrust-operations-platform.v1.yaml`](../../registry/traveltrust-operations-platform.v1.yaml) | Content · Catalog · Campaign · … |
| L3 运营流程 | [`traveltrust-operations-workflow.v1.yaml`](../../registry/traveltrust-operations-workflow.v1.yaml) | 各域生命周期 Workflow |

OCS apply 走 **Catalog Workflow**（publish → surface）与 **Campaign Workflow**（deploy）；见 [`TT-TRAVELTRUST-OPERATIONS-WORKFLOW.md`](TT-TRAVELTRUST-OPERATIONS-WORKFLOW.md)。

## Single Official Public Catalog Policy (SOPCP)

**机读 SSOT：** [`registry/single-official-public-catalog-policy.v1.yaml`](../../registry/single-official-public-catalog-policy.v1.yaml)

### 核心区分（企业通用模式）

```text
Database（库内可并存）          Public Catalog（用户只见一套）
─────────────────────          ─────────────────────────────
OCS · production      →  show   Official Cold Start Dataset
Canonical · showcase  →  hide   （unpublish，行保留）
Smoke / Test / Demo   →  hide   （Expected Difference · 联调）
Draft                 →  hide
Archive / Historical  →  hide
```

**本策略约束的是 Public Catalog，不是要求数据库只有一套数据。**

**长期规则（SOPCP + OCIP）：** 每条官方冷启动实体须保持稳定身份；日常运营 **修改现有实体**（价格、简介、头像、标签等），**不得**为同一业务位重复新建官方实体。仅当业务语义根本变化（新增城市、新增业务线、manifest 正式修订）方可新增链路与 UUID。

对标 Airbnb / Booking / Shopify / Uber：库内可同时存在历史、测试、Seed、Draft、Archived、Production；**用户可见面**仅一套 Official Production Dataset。

### 运营纪律

新增或变更城市内容时：

- ✅ **正确：** 在 OCS 既有链上 **原地更新**（例：东京摄影师 → 更新资料 → 继续运营）
- ❌ **错误：** 同城再 publish 第二、第三条 parallel 向导/商家链（东京摄影师2、东京摄影师3）

### 展示面与 OCS 映射

| Public Surface | Consumer API | Catalog 可见 |
|----------------|--------------|--------------|
| Guides | `GET /api/v1/guides` | OCS 10 guides · published |
| Provider | `GET /market/provider/listings` | OCS 10 provider · published |
| Acquisition | `GET /market/acquisition/listings` | OCS 10 acquisition · published |
| Official Guides | Admin published | OCS 10 |
| Campaign | cold-start surfaces | OCS 10 bundles · **Official Cold Start Campaign** |
| Community Feed | `GET /community/feed` | OCS Surface Expansion · `chains[].community_post` only |
| Community Featured | governed surfaces | OCS · `community_featured` surface |
| Destination Hub | Explore | OCS · `destination_slug` 聚合全链 |

### 审计与对齐（仅 Public Catalog）

```bash
# 只读：检查各 Public Surface 是否仅暴露 OCS（不检查 DB 总行数）
STATE=evidence/GO_official_cold_start_dataset/<UTC>/state.json \
  OUT=evidence/GO_official_cold_start_dataset/<UTC>/single-official-baseline-audit.json \
  node scripts/dev/audit-single-official-baseline.cjs

# Staging：将非 OCS 从 Public Catalog 下架（unpublish · DB 行保留）
STATE=evidence/GO_official_cold_start_dataset/<UTC>/state.json \
  OUT=evidence/GO_official_cold_start_dataset/<UTC>/single-official-baseline-align.json \
  node scripts/dev/align-single-official-baseline-staging.cjs
```

| 结果 | Staging `20260703T053800Z` |
|------|----------------------------|
| Verdict | **PASS** |
| Public Catalog 重复城市 | 0 |
| 非 OCS 公众行 | 0（对齐后） |
| DB 删除 | **无**（仅 unpublish） |

Sign-off: `evidence/manual-uat/signoff/SINGLE-OFFICIAL-PUBLIC-CATALOG-POLICY-SIGNOFF-20260703T054500Z.md`

（脚本文件名保留 `single-official-baseline` 别名以兼容已有 evidence；语义 = SOPCP。）

## Official Catalog Identity Policy (OCIP)

**机读 SSOT：** [`registry/official-catalog-identity-policy.v1.yaml`](../../registry/official-catalog-identity-policy.v1.yaml)

### 企业四层栈

```text
Official Dataset (OCS manifest + state.json)
        ↓
Canonical Identity — immutable（chain_id · slug · UUID 永不替换）
        ↓
Mutable Content — 可改（价格 · 简介 · 头像 · 视频 · 标签）
        ↓
Public Catalog (SOPCP) — 用户只见一套
```

**不是：** Apply → 新建 → 再新建 → 再新建。

### 东京示例

| 层级 | 键 | 规则 |
|------|-----|------|
| Manifest | `chain.id=tokyo-photo` · `guide.slug=tokyo-photo-guide` | 逻辑身份，不变 |
| state.json | `guide:tokyo-photo` → `b4d9ecf8-…` | **UUID 首次分配后不变** |
| 运营 | PATCH bio · hourly_rate · avatar | 同一 UUID 上改内容 |
| 禁止 | POST 新 Guide 替代东京链 | 不得 `东京摄影师2` |

Provider / Acquisition / Official Guide / Campaign **item_ref_id** 均引用 **同一套 state UUID**，Orders · Reviews · Community 同源。

### 编排器契约

`run-official-cold-start-dataset.cjs`：`state_map_key` 已存在 → **跳过 CREATE**，复用 `state.json` 中 UUID（`CLOSED_UNLESS_TOUCHED`）。

### 审计

```bash
STATE=evidence/GO_official_cold_start_dataset/<UTC>/state.json \
  OUT=evidence/GO_official_cold_start_dataset/<UTC>/official-catalog-identity-audit.json \
  node scripts/dev/audit-official-catalog-identity.cjs
```

Sign-off: `evidence/manual-uat/signoff/OFFICIAL-CATALOG-IDENTITY-POLICY-SIGNOFF-20260703T054700Z.md`
