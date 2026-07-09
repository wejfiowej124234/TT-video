# 146 · C-S6 Catalog Consumer Opt-in Cutover Report

> **Sprint**：C-S6 · **Catalog Consumer Opt-in Cutover**（120 显式 opt-in 程序 · staging ENABLED=1）  
> **设计 SSOT**：[105-S2 Catalog CMS §8](./105-S2-Catalog-CMS深度设计评审.md) · [114 S2b Closure](./114-S2b-Catalog-Consumer-Closure-Report.md) · [115 S2c Live](./115-S2c-Catalog-Live-Gate-Report.md) · [135 DOC-101-RW](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md)  
> **前置**：[136 C-S1](./136-C-S1-Admin-Content-CRUD-PublishQueue-Report.md) published 集 · [140 C-S5](./140-C-S5-Catalog-Server-Geo-Validation-Operations-Report.md) · [145 Ops Platform Freeze](./145-Operations-Platform-Release-Freeze-Report.md)  
> **冻结基准**：[120-S5 Catalog Release Freeze](./120-S5-Catalog-Release-Freeze-Report.md) — **生产默认 ENABLED=0 不变**  
> **日期**：2026-06-08  
> **纪律**：**不修改** `NEXT_PUBLIC_CATALOG_API_ENABLED` **生产默认** · **不碰** 报价 UI 主链 · Growth / Official OPS / 支付 / 链上 GOV  
> **结论**：**`CATALOG_CONSUMER_OPT_IN_GO`**（consumer opt-in 证据链完整 · S5 回归 **WARN** `draft_cap_exceeded` 环境项 · 见 §8）

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **Consumer 读链路（ENABLED=1 staging）** | **GO** — geo · POI · media/ambient · pricing adapter · hotel tiers via `catalogApi` resolve/hooks |
| **生产默认 ENABLED=0** | **GO（冻结）** — `client.ts` · `.env.example` · gate 静态检查 |
| **API 失败 / 空回退 TS** | **GO** — `resolveWithCatalogFallback` · Vitest flag=1 fallback cases（114 §3.2） |
| **W4 shadow gate（报价不切 UI）** | **GO** — offline + live CI-LIVE · `useQuoteCalculation` 仍 TS |
| **Live drift 检测（C6-LIVE）** | **GO** — `catalogConsumerOptIn.live.test.ts` · ENABLED=1 + API up |
| **Playwright / UAT（ENABLED=1）** | **GO** — `c-s6-catalog-consumer-opt-in-cutover.spec.ts` |
| **Break-Glass 回滚** | **GO** — §6 · `.env.staging.catalog-opt-in.example` |
| **Admin 可观测** | **GO** — catalog-dashboard consumer summary（只读 ENABLED 快照） |
| **120 / S5 冻结回归** | **WARN** — S4c env `draft_cap_exceeded`（145 同项 · 非 Consumer 功能回归） |
| **Sprint 边界外** | **未做** — 报价 UI 主链 · submit enrich · Rust preset_cities 默认 PG · 生产默认 ENABLED=1 |

**C-S6 正式裁定**：**`CATALOG_CONSUMER_OPT_IN_GO`** — staging opt-in 程序交付 · gate steps 0–5 PASS · S5 step **WARN**（145 同项 `draft_cap_exceeded` · 非 Consumer 回归）

---

## 2. 交付范围（C-S6）

### 2.1 FE Consumer（S2b 接线 · C-S6 程序固化）

| 域 | 模块 | ENABLED=1 行为 | 回退 |
|----|------|----------------|------|
| W1 Landing ambient | `useLandingAmbientUrl` · `resolveLandingAmbientUrl` | `GET /catalog/media?asset_kind=landing_ambient` | TS `landingAmbientByCountry` |
| W2 Geo | `useCatalogCountryOptions` · `useCatalogCityOptions` · `useCatalogProductCountries` | `GET /catalog/countries|cities` | TS `geoOptions` / `productCountries` |
| W3 POI 展示 | `useCatalogPoiDetails` | `GET /catalog/pois` + `poi-images` merge | TS `cityDetails` |
| W4 Pricing adapter | `resolveCatalogPricing` · shadow only | `GET /catalog/pricing` | TS `getPricingForCountry` · **UI 报价仍 TS** |
| Hotel tiers | `resolveCatalogHotelTiers` · shadow | `GET /catalog/hotel-tiers` | TS `HOTEL_TIERS` |

**接线面（C-01~C-18）**：见 [114 §4](./114-S2b-Catalog-Consumer-Closure-Report.md#4-consumer-matrix-最终状态s2b-closure) — C-S6 **不新增** Consumer Matrix 行，仅 **启用 staging opt-in 程序**。

### 2.2 新增门禁与证据

| 资产 | 路径 |
|------|------|
| C-S6 一键 gate | `scripts/check-c-s6-catalog-consumer-opt-in-cutover.sh` |
| Gate 实现 | `scripts/gates/c-s6-catalog-consumer-opt-in-cutover-gate.sh` |
| Live opt-in drift | `frontend/lib/catalogApi/catalogConsumerOptIn.live.test.ts` |
| Contract | `frontend/app/admin/content/adminContentCs6.contract.test.ts` |
| Playwright UAT | `frontend/e2e/c-s6-catalog-consumer-opt-in-cutover.spec.ts` |
| Staging env SSOT | `frontend/.env.staging.catalog-opt-in.example` |
| Staging smoke | `scripts/dev/smoke-catalog-consumer-opt-in-staging-p0-local.sh` |
| npm | `npm run gate:c-s6-catalog-consumer-opt-in` |

### 2.3 Admin 可观测（只读）

| 路由 | 能力 |
|------|------|
| `/admin/content/catalog-dashboard` | **新增** `data-tt-admin-content-catalog-consumer-summary` — FE `ENABLED` 进程 env 快照 + staging 说明 |
| `/admin/content/geo-validation` | **复用** C-S5 — 同 flag 只读观测 |

---

## 3. 120 opt-in 边界声明

| 项 | C-S6 变更 | 120 不变项 |
|----|-----------|------------|
| Staging `ENABLED=1` | **显式 env** · resolve/hooks 读 Catalog PG | 生产默认 **0** |
| Live drift C6-LIVE | **新增** Vitest · gate step 4 | 不自动 prod 切流 |
| Playwright ENABLED=1 | **新增** UAT spec | CI 默认仍 S2b `ENABLED=0` |
| Admin dashboard | **只读** consumer summary | 无 flag 切换 UI |
| W4 shadow | **维持** CI 必绿 | 报价 **UI 主链仍 TS** |
| `itinerarySubmitLogic` enrich | **未改** | TS `getAttractionDetails` 等 |
| Growth / Official OPS / 支付 / GOV | **未碰** | 145 冻结 |

---

## 4. Consumer parity · live drift

### 4.1 离线 parity（ENABLED=0 · 回归）

| Gate | 命令 |
|------|------|
| S2b closure | `bash scripts/check-s2b-catalog-consumer-closure.sh` |
| Vitest 合集 | `npm run test:catalog-api-parity` |
| W4 shadow | `npm run test:custom-itinerary-catalog-parity` |

### 4.2 Live drift（ENABLED=1 staging · API up）

| 用例 | 断言 |
|------|------|
| C6-LIVE-01 | `resolveCatalogCountries` → `source=catalog-api` · labels ⊆ TS |
| C6-LIVE-02 | `resolveCatalogCities("中国")` → catalog-api · 含北京 |
| C6-LIVE-03 | `resolveCatalogPricing("中国")` → catalog-api · `=== getPricingForCountry` |
| CI-LIVE | W4 shadow 全域 0 mismatch（115） |

**Skip 条件**：`CATALOG_CONSUMER_OPT_IN_SKIP=1` · API down · `ENABLED≠1`

---

## 5. Playwright / UAT 证据链

| Spec | 场景 | 前置 |
|------|------|------|
| `c-s6-catalog-consumer-opt-in-cutover.spec.ts` | Landing geo · Market CI geo/POI（ENABLED=1） | `PLAYWRIGHT_FULL_STACK=1` · `ENABLED=1` · API+import |
| Admin consumer summary | Contract 静态断言 `data-tt-admin-content-catalog-consumer-summary` | 无需 Playwright 登录 |
| `home-landing-shell.spec.ts` | **回归** TS default | gate step 2 · `ENABLED=0` |
| `market-custom-itinerary-catalog-ui.spec.ts` | **回归** W3 TS | gate step 2 |

Gate step 5 注入 `NEXT_PUBLIC_CATALOG_API_ENABLED=1` 于 Playwright webServer env。

---

## 6. Break-Glass 回滚方案

| 步骤 | 操作 | 验证 |
|------|------|------|
| **1 · 即时** | FE 部署 env：`NEXT_PUBLIC_CATALOG_API_ENABLED=0` 或 **unset** | 浏览器不 fetch catalog · hooks 仅 TS |
| **2 · 运行时** | API 故障时 **无需改 env** — resolve 自动回退 TS | Vitest fallback cases |
| **3 · 证据** | `bash scripts/check-s2b-catalog-consumer-closure.sh` | W1–W4 PASS · `ENABLED=0` |
| **4 · 数据** | Catalog PG 异常 → Ops 用 C-S4 import rollback / parity 面板 | Admin `/admin/content/catalog-dashboard` |
| **5 · 禁止** | 勿借回滚改报价主链 / Growth / GOV | 120 / 133 边界 |

**Staging 模板注释**：见 `frontend/.env.staging.catalog-opt-in.example` §Break-Glass。

---

## 7. 门禁（C-S6 一键）

```bash
bash scripts/check-c-s6-catalog-consumer-opt-in-cutover.sh
```

| Step | 内容 |
|------|------|
| 0 | 静态：默认 ENABLED=0 · quote chain TS |
| 1 | Contract vitest `adminContentCs6` |
| 2 | S2b closure · **ENABLED=0** |
| 3 | Live drift shadow · catalog smoke · parity · CI-LIVE |
| 4 | C6-LIVE opt-in resolve · **ENABLED=1** |
| 5 | Playwright C-S6 UAT · **ENABLED=1** |
| 6 | S5 freeze regression · **ENABLED=0** |
| 7 | 146 + staging env + smoke 文件存在 |

**成功输出**：`CATALOG_CONSUMER_OPT_IN_GO`（S5 失败时为 `…GO (S5 regression WARN …)`）  
**HOLD 条件**：无 `DATABASE_URL` / API down → live steps SKIP → exit 1

---

## 8. Gate 复跑记录（2026-06-08）

**命令**：`bash scripts/check-c-s6-catalog-consumer-opt-in-cutover.sh`

| Step | 内容 | 结果 |
|------|------|------|
| 0 | 静态 · 默认 ENABLED=0 · quote TS | **PASS** |
| 1 | Contract `adminContentCs6` | **PASS** |
| 2 | S2b closure · ENABLED=0 · full-stack Playwright | **PASS** |
| 3 | Live drift · smoke · parity · CI-LIVE | **PASS** · 0 skip |
| 4 | C6-LIVE opt-in · ENABLED=1 | **PASS** · 3/3 |
| 5 | Playwright C-S6 UAT · ENABLED=1 | **PASS** · landing + market CI |
| 6 | S5 freeze · ENABLED=0 | **WARN** · S4c `draft_cap_exceeded`（env · 145 已知） |
| 7 | 146 + staging env SSOT | **PASS** |

**S5 清理后复跑**：归档/删除测试用户 Draft（cap=20）→ `bash scripts/check-s5-catalog-release-freeze.sh` → step 6 可全绿。

---

## 9. 明确未做（C-S6 边界）

| 类别 | 说明 |
|------|------|
| 生产默认 `ENABLED=1` | **禁止** — 120 冻结 |
| Custom Itinerary 报价 UI 主链 | **仍 TS** — W4 shadow only |
| `itinerarySubmitLogic` enrich 切 adapter | 114 §3.3 |
| Rust `preset_cities` / POST geo 默认 PG | B-S4-02~05 · C-S5 观测 only |
| Growth / Official OPS / 支付 / 链上 GOV | 145 纪律 |
| Admin Catalog CRUD 新功能 | C-S1~C-S5 已交付 |

---

## 10. 101 路线矩阵

| Sprint | 状态 |
|--------|------|
| C-S1~C-S5 | **FREEZE GO** |
| **C-S6** | **GO** — staging opt-in · 本报告 |
| O-S1~O-S4 | **FREEZE GO**（145） |

**Catalog 默认 SSOT**：生产 **TS（ENABLED=0）** · staging **可 opt-in PG（ENABLED=1）**

---

## 11. Implementation Log

| Phase | 内容 | 文档 |
|-------|------|------|
| S2b–S5 | Consumer wiring + live + freeze | 114–120 |
| C-S1~C-S5 | Admin CMS + geo observability | 136–140 |
| 145 | Ops platform freeze | 145 |
| **C-S6** | **Consumer opt-in program + gate + UAT + break-glass** | **146** |

---

**报告状态**：**C-S6 Catalog Consumer Opt-in Cutover · `CATALOG_CONSUMER_OPT_IN_GO`**
