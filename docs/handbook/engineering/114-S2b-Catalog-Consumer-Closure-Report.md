# 114 · S2b Catalog Consumer Closure Report

> **Sprint**：S2b Phase 8 · **Consumer Mapping + Low-risk UI Wiring CLOSURE**  
> **审计 SSOT**：[113-S2b-Catalog-Consumer-Audit-Report](./113-S2b-Catalog-Consumer-Audit-Report.md) · [112-S2-API-RO-Audit-Report](./112-S2-API-RO-Audit-Report.md)  
> **日期**：2026-06-07  
> **状态**：**CLOSURE GO** — 门禁固化 · **`NEXT_PUBLIC_CATALOG_API_ENABLED=0` 默认** · Custom Itinerary **报价主链仍 TS** + W4 shadow/double-read

---

## 1. 结论

| 维度 | 判定 |
|------|------|
| Consumer Matrix（C-01~C-18 低风险接线） | **GO** — 见 §4 |
| W1 Landing ambient | **GO** — Vitest + Playwright |
| W2 Geo / ISO 读链路 | **GO** — Vitest hooks |
| W3 Custom Itinerary geo/POI **展示** | **GO** — Vitest + Playwright |
| W4 Custom Itinerary **报价 shadow** | **GO** — offline 必绿 · live 随 API |
| 报价主链 UI 切 API | **NO-GO（刻意保留）** — `useQuoteCalculation` 等仍 TS |
| Admin CRUD / Growth / Official OPS | **未做（Sprint 边界）** |
| 默认 `ENABLED=1` | **未做** |

**S2b 正式标记**：**Consumer Mapping + Low-risk UI Wiring GO**；下一阶段（S3+ / W5）方可讨论报价 UI 切流、POI 图 API、Rust preset_cities。

---

## 2. 统一门禁（Phase 8 固化）

| # | 门禁 | 波次 | 命令 |
|---|------|------|------|
| 1 | `test:catalog-api-parity` | W1–W4 Vitest 合集 | `cd frontend && npm run test:catalog-api-parity` |
| 2 | `test:custom-itinerary-catalog-parity` | W4 shadow | `cd frontend && npm run test:custom-itinerary-catalog-parity` |
| 3 | `home-landing-shell.spec.ts` | W1 E2E | `npx playwright test e2e/home-landing-shell.spec.ts` |
| 4 | `market-custom-itinerary-catalog-ui.spec.ts` | W3 E2E | `npx playwright test e2e/market-custom-itinerary-catalog-ui.spec.ts` |
| **ALL** | **S2b closure gate** | W1–W4 | `bash scripts/check-s2b-catalog-consumer-closure.sh` |

**环境默认值（closure 脚本强制）**：

- `NEXT_PUBLIC_CATALOG_API_ENABLED=0`
- `CATALOG_API_BASE_URL=http://127.0.0.1:8080`（live 对拍可选；offline 不依赖 API）

---

## 3. 行为矩阵（flag / 回退 / hydration / 报价）

### 3.1 Feature flag

| 模式 | 条件 | 运行时行为 | 门禁覆盖 |
|------|------|------------|----------|
| **TS-only（生产默认）** | `ENABLED=0` | 不发起 catalog fetch；UI 读 TS SSOT | E2E 全 suite · Vitest flag=0 cases |
| **API-primary UI** | `ENABLED=1` | hooks 首屏 TS → client 升级 API | Vitest mock API 成功 |
| **API fallback** | `ENABLED=1` + API 失败/空 | 保持/回退 TS | Vitest mock fallback · W4 shadow |

### 3.2 分域门禁明细

| 域 | flag=0 | flag=1 API 成功 | flag=1 回退 TS | hydration 首屏=TS | 报价不变 |
|----|--------|-----------------|----------------|-------------------|----------|
| Landing ambient (W1) | `useLandingAmbientUrl.test` | 同文件 upgrade | resolve ts source | ✓ | N/A |
| Geo countries/cities (W2) | `useCatalogGeo.test` | upgrade | fallback | ✓ | N/A |
| Subsites ISO (W2) | `useCatalogProductCountries` in geo test | upgrade | fallback | ✓ | N/A |
| CI geo/POI UI (W3) | `customItineraryCatalogUi.test` | `useCatalogPoi.test` | fallback | ✓ | ✓ quote sample |
| CI POI 展示 (W3) | `useCatalogPoi.test` | upgrade | fallback | ✓ | N/A |
| CI 报价 shadow (W4) | `CI-01~03` offline | `CI-LIVE`（API up） | shadow ts source | N/A | ✓ tourist/guide |
| Pricing adapter (W4) | `catalogResolve` · contract | mock API | empty → TS | N/A | ✓ shadow compare |

### 3.3 Custom Itinerary 报价边界（closure 后仍有效）

| 模块 | 数据源 | shadow/double-read |
|------|--------|-------------------|
| `useQuoteCalculation` | **TS** `getPricingForCountry` | W4 offline + live |
| `quoteCalculationTourist/Guide/Shared` | **TS** `CountryPricingConfig` | 同上 |
| Hotels / city transport UI | **TS** `getHotels` · `CITY_TRANSPORT_*` | W4 shadow tiers/transport |
| Intercity mode UI | **TS** `getInterCityTransportModes` | W4 shadow intercity |
| `itinerarySubmitLogic` enrich | **TS** `getAttractionDetails` 等 | W4 POI value shadow |

---

## 4. Consumer Matrix 最终状态（S2b closure）

| ID | 状态 | 说明 |
|----|------|------|
| C-01, C-02 | **W1 已接线** | ambient · `useLandingAmbientUrl` |
| C-03, C-04 | **W2 已接线** | hero + market 筛选 geo |
| C-05, C-06 | **W3 已接线** | CI modal geo + POI **展示** |
| C-07~C-11 | **W4 shadow only** | 报价/enrich **UI 仍 TS** |
| C-12 | **W5 GO** | POI hero · `GET /catalog/poi-images` · 116 |
| C-13~C-18 | **W2 已接线** | subsites · escrow · itinerary/new · register |
| C-19~C-20 | **⚪ 非 CMS** | market listings · KYB |
| C-21~C-22 | **🔴 后端/永久对拍** | Rust POST · import runner |

完整行级矩阵见 [113 §3](./113-S2b-Catalog-Consumer-Audit-Report.md#3-consumer-matrix)。

---

## 5. W3 / W4 边界（closure 冻结）

| 波次 | 已交付 | 明确未交付 |
|------|--------|------------|
| **W3** | 国家/城市/POI **展示** adapter 接线 | 城际/酒店 picker 切 API · submit enrich |
| **W4** | shadow compare 门禁 · adapter 层 | 报价 **主读** 切 API · UI pricing 切流 |

**规则**：W4 shadow **必须**在 CI 保持绿；任何报价 UI 切流须新 Sprint + 显式 scope，且不得默认 `ENABLED=1`。

---

## 6. 验证命令（本地 / CI）

```bash
# 一键 closure（推荐）
bash scripts/check-s2b-catalog-consumer-closure.sh

# 分项
bash scripts/check-catalog-api-parity.sh
bash scripts/gates/custom-itinerary-catalog-parity.sh
cd frontend && npx playwright test e2e/home-landing-shell.spec.ts
cd frontend && npx playwright test e2e/market-custom-itinerary-catalog-ui.spec.ts
```

**可选 live 对拍**（需 API + catalog import committed）：

```bash
export CATALOG_API_BASE_URL=http://127.0.0.1:8080
unset CATALOG_API_PARITY_SKIP CUSTOM_ITINERARY_CATALOG_PARITY_SKIP
cd frontend && npm run test:catalog-api-parity
cd frontend && npm run test:custom-itinerary-catalog-parity
```

---

## 7. 明确未做（S2b 全 Sprint 边界）

- Admin Catalog CRUD / 审核 UI  
- Growth / Referral / Official OPS  
- Custom Itinerary **pricing / hotel / transport** UI 切 Catalog API  
- `NEXT_PUBLIC_CATALOG_API_ENABLED=1` 默认值  
- Rust `preset_cities` / `meta.product_countries` 改读 PG  
- `GET /catalog/poi-images/:poi_id`（C-12）

---

## 8. 相关 Implementation Log

| Phase | 内容 | 文档 |
|-------|------|------|
| 1–2 | RO API · pricing 全字段 | 113 §11 |
| 3 | Adapter 基础层 | 113 §11 |
| 4 / W1 | Landing ambient | 113 §11 |
| 5 / W2 | Geo 读链路 | 113 §11 |
| 6 / W4 | CI 报价 shadow gate | 113 §11 |
| 7 / W3 | CI geo/POI 展示 | 113 §11 |
| **8** | **Closure gate + 本报告** | 113 §11 · **114** |

---

## 9. Closure gate 验证记录（2026-06-07）

**命令**：`bash scripts/check-s2b-catalog-consumer-closure.sh`  
**环境**：`NEXT_PUBLIC_CATALOG_API_ENABLED=0` · `CATALOG_API_BASE_URL=http://127.0.0.1:8080`  
**结果**：**PASS** · exit 0 · ~49s

| Step | 门禁 | 结果 |
|------|------|------|
| [1/4] | `test:catalog-api-parity` | **69 passed** (9 files) · API-01 / CI-LIVE skip（API 未起，offline 预期） |
| [2/4] | `test:custom-itinerary-catalog-parity` | **4 passed** · CI-LIVE skip |
| [3/4] | `home-landing-shell.spec.ts` (`--project=chromium`) | **5 passed**, 1 skipped（setup 依赖） |
| [4/4] | `market-custom-itinerary-catalog-ui.spec.ts` (`--project=chromium`) | **2 passed**, 1 skipped |

**flag=0 E2E 覆盖**：Landing ambient TS 首屏 · hero country pills TS geo · CI modal country/city/attraction pills TS geo（无 API 依赖）。

**S2c live**：见 [115-S2c-Catalog-Live-Gate-Report](./115-S2c-Catalog-Live-Gate-Report.md) — API up + import committed 下 API-01~14 / CI-LIVE **skip 清零**。

---

**报告状态**：**S2b CLOSURE GO · Consumer Mapping + Low-risk UI Wiring 完成**
