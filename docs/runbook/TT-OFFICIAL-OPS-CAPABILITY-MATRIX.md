# TT-OFFICIAL-OPS-CAPABILITY-MATRIX

**Version:** 1.1.0 · **生效：** 2026-07-01  
**状态：** **STABLE · Official Ops 1.0 · ARCHITECTURE FROZEN**  
**用途：** **Production Readiness Review** 标准评审材料 — 能力矩阵（Capability Matrix），非功能清单

**域冻结登记：** Content Center · Official Ops（ops 平面）· Public Operations（MVP）· Capability Matrix · Campaign（Cold Start）作为 **Official Ops 1.0** 整体冻结；增强项归属 **1.1 / 1.2 / 2.0**，**不**推翻 1.0 架构。

**互指：**

| 文档 | 关系 |
|------|------|
| [`TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md`](TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md) | **三大业务中心 + Platform Center** · 五步归属判断 · 禁止新模块 |
| [`TT-OFFICIAL-OPS-ENTERPRISE-ROADMAP.md`](TT-OFFICIAL-OPS-ENTERPRISE-ROADMAP.md) | **必须具备 vs 必须现在做** · Official Ops 1.1 全量范围 |
| [`TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md`](TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md) | Public Operations · 架构 Stable · MVP Complete |
| [`TT-TRAVELTRUST-THREE-DIMENSION-STATUS-SSOT.md`](TT-TRAVELTRUST-THREE-DIMENSION-STATUS-SSOT.md) | **三维度状态** Architecture · Feature · Production |
| [`101-CMS与内容运营中心实施蓝图.md`](../handbook/engineering/101-CMS与内容运营中心实施蓝图.md) | M1–M10 · C-S/O-S 冻结真源 |
| [`104-Admin-Coverage-Gap-Report.md`](../handbook/engineering/104-Admin-Coverage-Gap-Report.md) | Admin 全站缺口基线（含 Market listing 等域外项） |
| [`PHASE3-PRODUCTION-PREPARATION.md`](PHASE3-PRODUCTION-PREPARATION.md) | **当前主轨** · Production GO |
| [`registry/official-ops-capability-matrix.v1.yaml`](../../registry/official-ops-capability-matrix.v1.yaml) | 机读摘要 |

| [`registry/official-ops-capability-matrix.v1.yaml`](../../registry/official-ops-capability-matrix.v1.yaml) | 机读摘要 |
| [`registry/official-ops-domain.v1.yaml`](../../registry/official-ops-domain.v1.yaml) | **Official Ops 1.0 域冻结** 机读登记 |

---

## Official Ops 1.0 · 域冻结（Architecture Freeze）

**企业节奏：** Architecture Freeze → Feature Freeze → Production Readiness → Go Live → Version 1.1+

### 四层成熟度（均已闭合 · 1.0）

| 层 | 内容 | 状态 |
|----|------|------|
| **L1 企业定位** | Official Ops = 市场/社区/交易类公众运营；与 Content Center（catalog/media）分域 | **✅ COMPLETE** |
| **L2 四大中心** | **User Management** + **Content Center** + **Official Ops** + **Platform Center**（见 [`TT-ADMIN-THREE-CENTERS-ARCHITECTURE`](TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md)） | **✅ COMPLETE** |
| **L3 模块职责** | Public Operations · Campaign（Cold Start）· Official Guides · Official Accounts · Templates | **✅ COMPLETE** |
| **L4 能力矩阵** | 本文件 — Production Review **单页真源** | **✅ COMPLETE** |

```text
Official Ops 1.0（STABLE · ARCHITECTURE FROZEN）
│
├── Content Center          /admin/content          [冻结 · 92% 能力]
├── Official Accounts       /admin/official/accounts
├── Official Guides         /admin/official/guides
├── Templates               /admin/official/itinerary-templates
├── Campaign (Cold Start)   /admin/official/cold-start
└── Public Operations MVP   /admin/official/public-operations
```

### 版本演进（禁止在 1.0 上改架构）

| 版本 | Feature Level | 时机 | 范围 | 架构 |
|------|---------------|------|------|------|
| **1.0** | **MVP** | **现在 · 冻结** | Statistics · data_origin · TEST | **FROZEN** |
| **1.1** | **STANDARD** | post **Production GO** | Publish · Featured · Priority · Surface · `display_*` | 架构内增强 |
| **1.2** | **ADVANCED** | post GO | Campaign 合并 · Schedule · 推荐池 | 同上 |
| **2.0** | **ENTERPRISE** | post GO | Production Policy · 三环境硬化 | 同上 |

**纪律：** 状态汇报用 **Architecture Version + Feature Level + Production** 三轨；**禁止**单独问「Phase 2 完成没」。

---


## 0.5 · 项目级统一矩阵

全模块状态汇报 **唯一模板**：**Architecture · Feature Level · Production**

→ [`TT-CAPABILITY-MATRIX-UNIFIED.md`](TT-CAPABILITY-MATRIX-UNIFIED.md)

本文件为 **Official Ops 域** 明细矩阵；**禁止**在本文件外自造 Phase/Sprint 状态名。

## 0 · 机读键

```text
TT_OFFICIAL_OPS_STATUS: STABLE
TT_OFFICIAL_OPS_VERSION: 1.0
TT_OFFICIAL_OPS_ARCHITECTURE: FROZEN
TT_OFFICIAL_OPS_DEV_FROZEN: true
TT_OFFICIAL_OPS_FEATURE_FROZEN: true
TT_OFFICIAL_OPS_DEFER_UNTIL: PRODUCTION_GO
TT_OFFICIAL_OPS_ACTIVE_PROGRAM: PHASE3_PRODUCTION_READINESS
TT_OFFICIAL_OPS_DOMAIN_REGISTRY: registry/official-ops-domain.v1.yaml
TT_OFFICIAL_OPS_CAPABILITY_MATRIX: ACTIVE
TT_OFFICIAL_OPS_CAPABILITY_MATRIX_VERSION: v1.1.0
TT_OFFICIAL_OPS_REVIEW_DOC: docs/runbook/TT-OFFICIAL-OPS-CAPABILITY-MATRIX.md
TT_PUBLIC_DISPLAY_STATUS: MVP_COMPLETE
TT_PUBLIC_DISPLAY_VERSION: v1.0
```

**状态图例（全文统一）：**

| 标记 | 含义 |
|------|------|
| **✅ Complete** | 企业可用；Admin + API + 审计/发布链闭环 |
| **✅ MVP** | **约定范围内**已闭合；**不等于**全愿景完成 |
| **⚠️ Partial** | 已有能力但 UI/切流/运营体验未对齐 API 或企业预期 |
| **⏳ Planned** | SSOT 已规划 · **post Production GO**（或标明 Phase） |
| **❌ Not started** | 未实现 · 非当前阶段目标 |
| **—** | 不属于本平面（见边界列） |

**完成度双轨（Public Operations 必读）：**

| 轨道 | 完成度 | 分类 |
|------|--------|------|
| **MVP（Phase 0+1 约定范围）** | **100%** | 已闭合 · `MVP_COMPLETE` |
| **全愿景（Publish/Surface/Campaign/Policy）** | **~40%**（矩阵精算 38%） | **Roadmap** · **非缺陷** · 不挡 GO |

**完成度条说明：** 平面百分比 = **本矩阵「Complete 定义」**；Public Operations **须同时报 MVP 100% 与愿景 ~40%**，禁止混读为「后台只做了四成」。

---

## 1 · 整体完成度（Admin 运营双平面）

评审时 **先看本节**，再下钻 §2 矩阵。

```text
Admin 运营体系（Content Center + Official Ops）
│
├── Content Center（CMS · catalog/media 资产）
│    ████████████████████░  92%
│    C-S1～C-S5 FREEZE GO · 少数 Admin 页 UI 薄于 API
│
├── Official Ops · 官方内容运营（M7–M10 · ops_*）
│    ███████████████████░░  95%
│    O-S1～O-S4 FREEZE GO · Official Guides featured UI 小缺口
│
├── Public Operations（展示数据治理 · MVP v1.0）
│    MVP ████████████████████ 100%  ·  全愿景 ████████░░░░░░░░ ~40%
│    Statistics + data_origin + TEST 规范 · 非运营控制台
│
└── Cold Start（Campaign · 独立路由）
     █████████████████████  100%（O-S4 scope）
     菜单并入 Public Operations · post GO Phase 3
```

| 平面 | 完成度 | 判定 | 一句话 |
|------|--------|------|--------|
| **Content Center** | **92%** | **GO（运营可用）** | Catalog Admin + POI 图审核闭环；Landing/Media/部分列表 UI 偏弱 |
| **Official Ops（ops 内容）** | **95%** | **GO** | Accounts · 官方攻略 · 行程模板 · 审批发布链 |
| **Public Operations** | **架构 Stable** · **MVP 100%** · 企业级运营 **→ 1.1**（精算 38%） | **MVP FROZEN** · **ROADMAP_NOT_DEFECT** | Statistics 已够 0+1；Publish/Surface 等 **post GO** |
| **Cold Start** | **100%** | **GO** | Campaign CRUD · surfaces · deploy/rollback；**入口未合并** |

**架构统一（已发生，非「全功能做完」）：**

- **入口统一：** Admin 侧栏 `content` 组 vs `official_ops` 组（[`adminShellContentNavLinks.ts`](../../frontend/lib/admin/adminShellContentNavLinks.ts) · [`adminShellOfficialOpsNavLinks.ts`](../../frontend/lib/admin/adminShellOfficialOpsNavLinks.ts)）
- **域边界统一：** CMS = catalog/media；Official Ops = 市场/社区/交易类 **展示运营**（§2.3 SSOT）
- **路线图统一：** Public Operations 单模块吸收 Statistics → Publish → Surface → Campaign（**逻辑分层 · UI 渐进合并**）

---

## 2 · 能力矩阵

### 2.1 Content Center（CMS）

| 能力 | Admin 路由 | 状态 | 企业使用 | 备注 |
|------|------------|------|----------|------|
| 国家目录 M1 | `/admin/content/countries` | **✅ Complete** | 可用 | CRUD + submit-review + publish |
| 城市目录 M2 | `/admin/content/cities` | **⚠️ Partial** | 只读为主 | 列表 + `publish_status`；**无**国家级发布操作列 |
| POI（景区/酒店/美食）M3–M5 | `/admin/content/pois` | **⚠️ Partial** | 只读为主 | 同上；数据面 `GET /catalog/*` **GO** |
| POI 图片 M6 | `/admin/content/poi-images` | **✅ Complete** | 可用 | 批次审核 · select · publish；公众 `GET /catalog/poi-images` |
| Landing 背景 | `/admin/content/landing-ambient` | **⚠️ Partial** | **偏弱** | API `GET/PATCH …/landing-ambient` **GO**；Admin **只读一览** |
| Media Assets | `/admin/content/media-assets` | **⚠️ Partial** | **偏弱** | API CRUD + workflow **GO**（C-S3）；Admin **只读列表** |
| 国家定价 | `/admin/content/pricing` | **⚠️ Partial** | 列表观测 | workflow API 有；UI 未全暴露 |
| 城际交通 / 酒店档 / 区域交通 | `intercity-routes` · `hotel-tiers` · `transport-region-rules` | **⚠️ Partial** | 列表 + 状态 | 与国家页成熟度不一致 |
| Publish Queue | `/admin/content/publish-queue` | **✅ Complete** | 可用 | in_review 聚合 |
| Catalog Dashboard / Geo / Import | `catalog-dashboard` · `geo-validation` · `import-operations` | **✅ Complete** | 运维可用 | 观测与导入 |
| Catalog Revisions | `/admin/content/revisions` | **✅ Complete** | 可用 | 修订对比 |
| **公众 Catalog 切流** | —（`NEXT_PUBLIC_CATALOG_API_ENABLED`） | **⚠️ Partial** | **Production 默认关** | Staging opt-in **GO**（C-S6）；发版需显式决策 |
| TS fallback 并行读 | — | **✅ Complete** | 默认真源 | `ENABLED=0` 时 TS；**非缺陷** · 切流策略项 |

**Content Center 边界：** 上述能力 **不得**迁入 Public Operations（[`TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md` §2.3](TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md)）。

---

### 2.2 Official Ops · 官方内容（ops_* · M7–M10）

| 能力 | Admin 路由 | 状态 | 企业使用 | 备注 |
|------|------------|------|----------|------|
| Official Accounts M7 | `/admin/official/accounts` | **✅ Complete** | 可用 | 创建 · 审核 · publish · referral bind |
| Official Guides（官方攻略帖）M8 | `/admin/official/guides` | **✅ Complete** | 基本可用 | 发布至 `community_posts`；DB/API 有 `featured` · **Admin UI 未暴露** |
| Itinerary Templates M9 | `/admin/official/itinerary-templates` | **✅ Complete** | 可用 | 全发布链 · Catalog 关联 |
| Cold Start Campaign M10 | `/admin/official/cold-start` | **✅ Complete** | 可用 | surfaces · items · deploy/rollback · 审批 |
| Official Ops Hub KPI | `/admin/official` | **✅ Complete** | 可用 | 账号/攻略/模板/待审计数 |
| RBAC | — | **✅ Complete** | 可用 | `OFFICIAL_READ/WRITE/PUBLISH` |

**与 Legacy Admin 区分：**

| 能力 | 路由 | 状态 | 备注 |
|------|------|------|------|
| 向导 KYB（入驻审核） | `/admin/guides` | **✅ Complete** | **审核域** · ≠ 市场展示 Publish |
| 订单台账 | `/admin/orders` | **✅ Complete** | 只读 + `data_origin` 列（Phase 0+1） |

---

### 2.3 Public Operations（展示数据 · MVP v1.0 · DEV FROZEN）

| 能力 | Admin / 产品面 | 状态 | 阶段 | 备注 |
|------|----------------|------|------|------|
| Statistics（data_origin 分桶） | `/admin/official/public-operations` | **✅ MVP** | 0+1 | guides/orders/listings/community + provider/acquisition |
| `filter_enabled` 展示 | 同上 | **✅ MVP** | 0+1 | `TRAVELTRUST_PUBLIC_CATALOG_SURFACE` 同源 |
| `data_origin` Admin 列 | `/admin/guides` · `/admin/orders` | **✅ MVP** | 0+1 | 只读 |
| 市场卡片 `[TEST]` 标签 | `/market` | **✅ MVP** | 0 | `data_origin=test` + dev showcase 启发式 |
| Smoke 不污染 C3 bio | `smoke-identity-p2-settings-staging.sh` | **✅ MVP** | 0 | 烟测后恢复 canonical |
| Staging/Prod 禁用公众 mock | 前端 gate | **✅ MVP** | 0 | `NODE_ENV=production` |
| 展示数据 SSOT / runbook | 文档 | **✅ MVP** | 0+1 | 机读键 · gate |
| **Publish / Unpublish**（市场实体） | — | **⏳ Planned** | **2** | `guides`/`orders`/`market_listings` 展示上下线 |
| **Featured**（市场/社区 feed） | — | **⏳ Planned** | **2** | `ops_featured_slots` · 官方攻略 `featured` Admin 待对齐 |
| **Priority**（排序） | — | **⏳ Planned** | **2** | `display_priority` 未迁移 |
| **Surface**（实体级版面） | — | **⏳ Planned** | **2** | `display_surfaces[]`；Campaign 仅有 campaign-level surfaces |
| **Schedule**（定时上下线） | — | **⏳ Planned** | **3** | `display_start_at` / `display_end_at` |
| **Campaign 菜单合并** | — | **⏳ Planned** | **3** | Cold Start → Public Operations Tab |
| **Recommendation**（推荐池） | — | **⏳ Planned** | **2–3** | 104 P1-ADM-03 · 无 Admin |
| TEST/SMOKE **policy 台** | — | **⏳ Planned** | **2** | `show_test_data` 等；现仅标签+统计 |
| Production 展示策略硬化 | — | **⏳ Planned** | **4** | 去 env 公众种子 · 全环境 policy |

**定位（写死）：** 当前 Public Operations = **运营监控中心**；**不是**完整 **运营控制中心**。

---

### 2.4 域外 · 勿与 Official Ops 混评

| 能力 | 所属平面 | 状态 | 备注 |
|------|----------|------|------|
| Growth Center（推荐码/早鸟/空投…） | P3 Growth | **✅ Complete** | G-S8 FREEZE · `/admin/growth/*` |
| Market listing 商家自服务 | Market | **✅ Complete** | 用户 POST · **无** Admin listing 审核台 |
| Market listing Admin 审核 | — | **❌ Not started** | 104 §1.8 · 非 MVP 阻塞 |
| Escrow / 订单状态机 | P4 Legacy | **✅ Complete** | 不在本矩阵演进范围 |
| Community 审核 | P4 Legacy | **✅ Complete** | `/admin/community/*` |

---

### 2.5 未来模块索引（Official Ops 演进 · post GO）

以下能力 **已在架构叙事中预留**，**当前无独立 Admin 子模块**：

```text
Official Ops（目标态 · 单入口 Public Operations）
├── Statistics          ✅ MVP（已交付）
├── Official Accounts   ✅（独立子页保留）
├── Official Guides     ✅（独立子页保留）
├── Templates           ✅（独立子页保留）
├── Campaign            ⏳ Phase 3（吸收 Cold Start）
├── Publish / Surface   ⏳ Phase 2–3
├── Featured            ⏳ Phase 2
├── Priority            ⏳ Phase 2
├── Recommendation      ⏳ Phase 2–3
└── Schedule            ⏳ Phase 3
```

---

## 3 · Production Readiness 影响

**评审口径：** 对照 [`PHASE3-PRODUCTION-PREPARATION.md`](PHASE3-PRODUCTION-PREPARATION.md) · **本矩阵不替代** PI3 / GO 审计脚本。

### 3.1 Production GO — 阻断项（Official Ops / CMS 域）

| 项 | 阻断？ | 说明 |
|----|--------|------|
| Public Operations STANDARD+ 未做 | **否** | **Feature Level Roadmap** · DEV FROZEN |
| Publish / Featured / Priority / Surface | **否** | 非发版前承诺 |
| Cold Start 未并入 Public Operations 菜单 | **否** | Phase 3 · 功能已 GO |
| Public Operations MVP Statistics | **否** | Phase 0+1 已 PASS |
| CMS Admin C-S1～C-S5 | **否** | 101 / 145 FREEZE GO |

**Official Ops + Content Center 域内：当前 **无 Production GO 硬阻断**（与 B 层 101 运营就绪裁定一致）。**

### 3.2 Production GO — 建议项（非阻断 · 运营体验）

| 建议 | 优先级 | 理由 |
|------|--------|------|
| **Landing 背景 Admin UI 增强** | P2 建议 | API 已有 PATCH · 运营不应依赖 API/DB |
| **Media Assets Admin UI 增强** | P2 建议 | 同上 |
| **城市 / POI 列表发布操作对齐国家页** | P3 建议 | 减少「能看不能发」 |
| **Catalog `ENABLED` Production 切流决策** | **P1 决策** | 非代码缺口 · **发版责任人**在 C-S6 策略签字 |
| **官方攻略 `featured` Admin 字段** | P3 建议 | 后端已有 · 小 UI 补齐 |

### 3.3 Post Production GO — 按 SSOT 顺序演进

| 顺序 | 能力包 | SSOT Phase |
|------|--------|------------|
| 1 | `display_*` 统一 · 读面收敛 · TEST policy | **Phase 2** → **Official Ops 1.1** |
| 2 | Publish · Featured · Priority · Surface · Recommendation | **Phase 2** → **Official Ops 1.1** |
| 3 | Campaign 合并 · Schedule · 完整 Public Operations 控制台 | **Phase 3** → **Official Ops 1.2** |
| 4 | Production policy · 三环境固化 · 去 Mock | **Phase 4** → **Official Ops 2.0** |

**纪律：** Production GO 前 **不得**开工「⏳ Planned」项；**不得**修改 Official Ops **1.0 架构**（见 §「域冻结」· `TT_OFFICIAL_OPS_ARCHITECTURE: FROZEN`）。

---

## 4 · 评审用法（Production Readiness Review）

1. 打开 **§1** 看双平面完成度条。  
2. 对关切能力在 **§2** 查状态列（✅ / ⚠️ / ⏳）。  
3. 用 **§3** 区分 **阻断 vs 建议 vs post-GO**。  
4. 设计/范围争议回 **Public Operations SSOT**；实现冻结回 **101 + O-S/C-S 报告**。

**Gate（文档存在 + 机读键）：**

```bash
bash scripts/gates/check-official-ops-public-operations-ssot.sh
```

---

## 5 · 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.1.0 | 2026-07-01 | **Official Ops 1.0 域冻结**：`STABLE` · `ARCHITECTURE FROZEN` · 四层成熟度 · 1.1/1.2/2.0 路线图 |
| 1.0.0 | 2026-07-01 | 初版：Official Ops + Content Center 能力矩阵 · Production Review 标准材料 |

**项目级总表：** [`TT-CAPABILITY-MATRIX-UNIFIED.md`](TT-CAPABILITY-MATRIX-UNIFIED.md) · **本文件仅为 Official Ops 域 SSOT。**
