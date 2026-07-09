# 113 · S2b Catalog Consumer Audit Report

> **Sprint**：S2b Catalog Consumer Audit — **Consumer Mapping only**（无 FE 接线 · 无 Admin CRUD · 无 Growth · 无 OPS）  
> **规范 SSOT**：[105-S2-Catalog-CMS深度设计评审](./105-S2-Catalog-CMS深度设计评审.md) §8 · §9 · [112-S2-API-RO-Audit-Report](./112-S2-API-RO-Audit-Report.md)  
> **扫描范围**：`frontend/` 运行时 + `scripts/catalog-import/` + `crates/` 校验链 · **2026-06-07**  
> **状态**：**CLOSURE GO + LIVE FULL GO + W5 POI Media GO + S4 Alignment GO** — [114](./114-S2b-Catalog-Consumer-Closure-Report.md) · [115](./115-S2c-Catalog-Live-Gate-Report.md) · [116](./116-S3-W5-POI-Media-Catalog-Report.md) · [117](./117-S4-Catalog-Server-Validation-Alignment-Report.md) · **`NEXT_PUBLIC_CATALOG_API_ENABLED=0` 默认**

---

## 1. 结论

| 维度 | 判定 |
|------|------|
| 全栈 Catalog 消费方扫描 | **PASS** — 见 §3 Consumer Matrix |
| TS 真源模块清单 | **PASS** — 见 §2 |
| S2-API-RO 端点 → FE adapter | **PASS（读路径）** — hotel-tiers · pricing · geo · pois · **POI 图 API 未实现** |
| `catalogApi` 低风险 UI 接线 | **GO** — W1 ambient · W2 geo · W3 CI geo/POI 展示 · **`ENABLED=0` 默认** |
| Custom Itinerary 报价主链 | **仍 TS** — W4 shadow/double-read 门禁必绿 |
| 必须先 continue 双读 | **Custom Itinerary 报价** · **Import Runner** · **Rust preset_cities** |

**S2b Sprint 交付**：Consumer Matrix + 切换波次 + Phases 1–8 低风险接线 + **Closure GO**（114）。

---

## 2. TS 真源依赖清单

### 2.1 模块 SSOT（生产 import 路径）

| 模块 | 路径 | 导出（消费方常用） | DB / API 镜像 |
|------|------|-------------------|---------------|
| **productCountries** | `frontend/lib/productCountries.ts` | `PRODUCT_COUNTRIES`, `isAllowedProductIso3166`, `isAllowedProductZhCountryName` | `catalog_countries` · **无** dedicated API 校验端点 |
| **geoOptions** | `frontend/lib/geoOptions.ts` | `COUNTRY_OPTIONS`, `CITIES_BY_COUNTRY`, `LANGUAGES_BY_COUNTRY`, `SERVICE_TYPE_OPTIONS`, `productCountryZhForCityName` | `catalog_countries` + `catalog_cities` · `GET /catalog/countries|cities` |
| **countries / pricing** | `frontend/lib/countries/index.ts` + `{cn,jp,…}.ts` | `BY_COUNTRY`, `getPricingForCountry`, `getPricingCountryKeys`, `DEFAULT_COUNTRY` | `catalog_pricing_templates` · `GET /catalog/pricing`（cents + JSON 子字段） |
| **cityDetails · attractions** | `frontend/lib/cityDetails/attractions.ts` | `getAttractionDetails`, `AttractionDetail` | `catalog_pois` `poi_type=attraction` |
| **cityDetails · food** | `frontend/lib/cityDetails/food.ts` | `getFoodDetails`, `FoodDetail` | `catalog_pois` `poi_type=food` |
| **cityDetails · hotels** | `frontend/lib/cityDetails/hotels.ts` | `HOTEL_TIERS`, `getHotels`, `getHotelDetails`, `resolveHotelSubmitLabel` | `catalog_hotel_tier_definitions` · `GET /catalog/hotel-tiers` |
| **cityDetails · hotelTierPricing** | `frontend/lib/cityDetails/hotelTierPricing.ts` | `HOTEL_TIER_MULTIPLIER`, `hotelNightRatePerPerson` | tier `multiplier` 在 PG · **无** RO API |
| **cityDetails · interCityTransport** | `frontend/lib/cityDetails/interCityTransport.ts` | `getInterCityTransportModes`, `normalizeInterCityTransport`, `getInterCityTransportLabelKey` | `catalog_intercity_routes`（modes）+ pricing 内 `intercityPricePerPerson` |
| **cityDetails · stock / overrides** | `itineraryStockImages.ts`, `attractionImageOverrides.ts` | `ITINERARY_STOCK`, `isExternalItineraryStockImage` | `catalog_media_assets` · POI hero **未** RO |
| **landingAmbient** | `frontend/lib/landingAmbientByCountry.ts` | `landingAmbientImageUrl`, `LANDING_AMBIENT_BY_COUNTRY_ZH` | `countries.payload.landing_ambient` · `GET /catalog/media?asset_kind=landing_ambient` |
| **catalogApi（客户端）** | `frontend/lib/catalogApi/client.ts` | `fetchCatalog*`, `isCatalogApiEnabled` | S2-API-RO 六 GET · **测试专用** |

### 2.2 非 UI 但依赖 TS 真源

| 消费者 | 路径 | 用途 |
|--------|------|------|
| Import Runner | `scripts/catalog-import/{phases,parity,plan}.ts` | 109 import · P-01~P-16 对拍 |
| Slug map gate | `scripts/gates/check-catalog-slug-map.ts` | city_slug 与 `CITIES_BY_COUNTRY` 锁死 |
| Rust core | `crates/core` `product_countries`, `preset_cities` | `POST /itineraries` 校验 · `GET /meta.product_countries` |
| Rust API | `crates/api/src/chain_off/itineraries.rs` | destination / city 预设城市门闸 |

### 2.3 测试 / 对拍（非运行时）

| 文件 | 对拍对象 |
|------|----------|
| `frontend/lib/catalogApi/catalogApiParity.test.ts` | API ↔ TS（S2-API-RO） |
| `frontend/lib/cityDetails/cityDetailsCoverage.test.ts` | 十国 POI 覆盖 |
| `frontend/lib/cityDetails/poiMediaCompleteness.test.ts` | POI 图完整性 |
| `frontend/lib/countries/index.test.ts` | pricing ↔ COUNTRY_OPTIONS |
| `frontend/lib/cityDetails/interCityTransport.test.ts` | 城际 mode 矩阵 |
| `frontend/lib/cityDetails/hotelTierPricing.test.ts` | tier multiplier |
| `frontend/lib/catalogApi/customItineraryCatalogParity.test.ts` | **Custom Itinerary 报价链 shadow compare**（Phase 6 W4） |
| `frontend/components/market/CustomItineraryModal/customItineraryCatalogUi.test.ts` | **W3 geo/POI 展示**（Phase 7） |
| `scripts/check-s2b-catalog-consumer-closure.sh` | **S2b closure gate**（Phase 8 · 114） |
| `scripts/check-s2c-catalog-live-gate.sh` | **S2c live gate**（Phase 9 · 115） |
| `scripts/check-s3-w5-poi-media-catalog-gate.sh` | **S3/W5 POI media gate**（Phase 10 · 116） |
| `scripts/check-s4-catalog-server-validation-alignment.sh` | **S4 server validation gate**（Phase 11 · 117） |
| `scripts/check-s4b-meta-product-countries-catalog-alignment.sh` | **S4b meta product_countries gate**（Phase 12 · 118） |
| `scripts/check-s4c-catalog-geo-server-final-revalidation.sh` | **S4c catalog geo final revalidation**（Phase 13 · 119） |
| `scripts/check-s5-catalog-release-freeze.sh` | **S5 catalog release freeze**（Phase 14 · 120） |
| `scripts/check-phase3-entry-recheck.sh` | **Phase ③ entry recheck**（post-S5 · runbook） |

---

## 3. Consumer Matrix

**图例**  
- **数据源**：TS = 同步模块读 · API = `GET /api/v1/catalog/*` · Meta = `GET /meta.product_countries` · PG-mkt = market listings DB  
- **切换**：🟢 可先切 · 🟡 需 adapter · 🔴 必须双读 / API 缺口 · ⚪ 不建议切（非 Catalog CMS）

| ID | 路由 / 面 | 组件 / 模块 | 数据域 | 当前 TS 入口 | Catalog API 替换 | 切换 |
|----|-----------|-------------|--------|--------------|------------------|------|
| C-01 | `/` | `LandingHomeAmbientBackdrop` | landing ambient 图 | `useLandingAmbientUrl` → TS/API | `resolveLandingAmbientUrl` · media | **Phase 4 W1 已接线** |
| C-02 | `/` | `ItineraryResultsSection` | 同上 | 同上 | 同上 | **Phase 4 W1 已接线** |
| C-03 | `/` | `LandingHeroForm` / `LandingHeroCityField` | 国家/城市下拉 | `useCatalogCountryOptions` / `useCatalogCityOptions` | `GET /catalog/countries`, `GET /catalog/cities?country_iso=` | **Phase 5 W2 已接线** |
| C-04 | `/market` | `StickyFilterBar` | 筛选国家/城市 | `useCatalogCountryOptions` / `useCatalogCityOptions` | countries + cities API；**languages/service_types 仍 TS**；`useMarketPage*` URL 校验仍 TS | **Phase 5 W2 已接线（筛选 UI）** |
| C-05 | `/market` | `CustomItineraryModal` · 国家/城市 | 表单 geo | `useCatalogCountryOptions` / `useCatalogCityOptions` | catalog countries/cities adapter | **Phase 7 W3 已接线** |
| C-06 | `/market` | `CustomItineraryModal` · 景区/美食 | POI 列表展示 | `useCatalogPoiDetails` · `resolveCatalogPoiDetails` | `GET /catalog/pois` + `catalogPoiAdapter` | **Phase 7 W3 已接线（展示）** · submit enrich 仍 TS |
| C-07 | `/market` | `CustomItineraryModal` · 酒店档位 | 三档 picker | `getHotels`, `HOTEL_TIERS` | `resolveCatalogHotelTiers` | 🔴 W3 UI · **Phase 6 shadow 对拍** |
| C-08 | `/market` | `CustomItineraryModal` · 报价 | pricing 全字段 | `getPricingForCountry` | `resolveCatalogPricing` | 🔴 UI 不切 · **Phase 6 shadow 对拍** |
| C-09 | `/market` | `CustomItineraryModal` · 城际 | mode 矩阵 + 价 | `getInterCityTransportModes` + pricing | routes + `catalogIntercityAdapter` | 🔴 W3 UI · **Phase 6 shadow 对拍** |
| C-10 | `/market` | `CustomItineraryModal` · 酒店夜价 | tier × base | `hotelNightRatePerPerson` + multiplier | pricing + hotel-tiers | 🔴 UI 不切 · **Phase 6 shadow 对拍** |
| C-11 | `/market` | `CustomItineraryModal` · 提交 enrich | POI/hotel 标签 | `itinerarySubmitLogic` | pois + tiers adapter | 🔴 W4 UI · **Phase 6 shadow 对拍（POI value）** |
| C-12 | `/market` | `CustomItineraryModal` · 媒体预览 | stock / external 图 | `useCatalogPoiDetails` · `resolveCatalogPoiDetails` + **poi-images** | `GET /catalog/poi-images` · adapter merge | **S3/W5 GO**（116） |
| C-13 | `/market/provider` | `MarketSubsiteFilterBar`, Studio modals | ISO 白名单 | `useCatalogProductCountries` | countries ISO 列表 | **Phase 5 W2 已接线** |
| C-14 | `/market/acquisition` | 同上 | ISO 白名单 | `useCatalogProductCountries` | 同上 | **Phase 5 W2 已接线** |
| C-15 | `/escrow/[id]` | `EscrowDetail` | 城市合法性 UI | `useCatalogCityOptions` | cities API；`isAllowedProductZhCountryName` 仍 TS · meta 校验 **仍须 Rust** | **Phase 5 W2 已接线（城市下拉）** · 🔴 后端 |
| C-16 | `/itinerary/new` | `page`, `ItineraryNewFormBlock` | geo 下拉 | `useCatalogCountryOptions` / `useCatalogCityOptions` | countries/cities adapter；`fromOrderPrefill` / `draftHydrateMap` 校验仍 TS | **Phase 5 W2 已接线** |
| C-17 | `/guide/register` | `GuideRegisterServiceFields` | 国家 ISO 下拉 | `useGuideRegisterCountryOptions` | countries + TS `guideRegisterLabelKey` merge | **Phase 5 W2 已接线（国家）** · 城市/语言仍 `guideRegisterGeo` TS |
| C-18 | `/provider/register` | `ProviderRegisterMainForm` | 国家选项 | `useGuideRegisterCountryOptions` | countries adapter | **Phase 5 W2 已接线** |
| C-19 | lib | `marketCatalogAdapter.ts` | market **listings** | PG `market_listings` | ⚪ **非** CMS catalog API | ⚪ |
| C-20 | lib | `publishActionBlockedKeys`, KYB 规则 | ISO 门闸 | `isAllowedProductIso3166` | meta / core · **非** catalog GET | ⚪ |
| C-21 | API | `POST /api/v1/itineraries` | destination + preset cities | Rust `preset_cities` + `product_countries` | catalog PG 只读（opt-in） | **S4 PARTIAL GO**（117 · parity 绿 · meta/PATCH 仍 core） |
| C-22 | scripts | `catalog-import/*` | 全量 TS→PG | 全部 §2.1 模块 | N/A（import 真源仍为 TS 直至 S6+） | 🔴 永久对拍 |

---

## 4. Catalog API 替换路径（TS 函数 → HTTP → 未来 Adapter）

| TS 真源调用 | Catalog API（现状） | 未来 Adapter 文件（**未建** · 105 §9 建议名） | 形状差异 / 备注 |
|-------------|---------------------|-----------------------------------------------|-----------------|
| `PRODUCT_COUNTRIES` | `GET /catalog/countries` | `resolveCatalogProductCountries` · `useCatalogProductCountries` | API 无 `guideRegisterLabelKey`；TS merge |
| `COUNTRY_OPTIONS` | 派生 countries | `resolveCatalogCountries` · `useCatalogCountryOptions` | **Phase 5 W2 UI 已接线** |
| `CITIES_BY_COUNTRY[countryZh]` | `GET /catalog/cities?country_iso=` | `resolveCatalogCities` · `useCatalogCityOptions` | **Phase 5 W2 UI 已接线** |
| `getPricingForCountry(nameZh)` | `GET /catalog/pricing?country_iso=` | `resolveCatalogPricing` | **Phase 3 adapter 已建**（UI 未接） |
| `getPricingCountryKeys()` | `GET /catalog/pricing` | 同上 | keys = `country_name_zh` 或 ISO 映射 |
| `getAttractionDetails(city)` | `GET /catalog/pois` | `resolveCatalogPoiDetails` · `useCatalogPoiDetails` | **Phase 7 W3 展示已接线** · submit 仍 TS |
| `getFoodDetails(city)` | `?type=food` | 同上 | 同上 |
| `getHotels()` / `getHotelDetails()` | `GET /catalog/hotel-tiers` | `resolveCatalogHotelTiers` | **Phase 6 shadow 对拍** |
| `HOTEL_TIER_MULTIPLIER` | `GET /catalog/hotel-tiers` `multiplier` | 同上 | 同上 |
| `getInterCityTransportModes(a,b)` | `GET /catalog/intercity-routes` | `catalogIntercityAdapter.ts` | **Phase 6 shadow 对拍** |
| `landingAmbientImageUrl(countryZh)` | countries.payload 或 media | `catalogMediaAdapter.ts` | API-14 已对拍 |
| `LANGUAGES_BY_COUNTRY` | **无** | — | 109 P1；S2b **不切** |
| `SERVICE_TYPE_OPTIONS` | **无** | — | 同上 |
| `ITINERARY_STOCK` / POI hero | media 部分 | — | M6 / `poi-images` P1 |

---

## 5. API 缺口（阻塞 `flag=1` 全量切换）

| 缺口 | 105 参考 | 阻塞消费方 | 优先级 |
|------|----------|------------|--------|
| `GET /catalog/hotel-tiers` | §3.2 | C-07, C-10, quote | ~~**P0**~~ **DONE**（113 §11 Phase 1） |
| Pricing 全字段 JSON + client 类型 | §9.1 | C-08, C-09 | ~~**P0**~~ **DONE**（113 §11 Phase 2） |
| `GET /catalog/poi-images/:poi_id` | §7 | C-12, M6 | ~~**P1**~~ **RO DONE**（116 · Admin publish 仍 OPS） |
| Custom Itinerary **UI** 切 adapter | §7 W3/W4 | C-05~C-06 展示 **DONE** · C-07~C-11 报价/enrich **仍 TS** |
| `GET /catalog/countries/:iso` 单条 | §3.2 | 减少 payload | P2 |
| Languages / service types CMS | 106 P1 | C-04, C-17 | P2 |
| `GET /meta.product_countries` 读 catalog | §8.4 step 1 | C-21 后端 | **S4b DONE**（118 · opt-in） |

---

## 6. Feature Flag 切换方案

### 6.1 环境变量

| 变量 | 默认 | 语义 |
|------|------|------|
| `NEXT_PUBLIC_CATALOG_API_ENABLED` | `0` | **`1`** 时 UI **允许**调用 Catalog API adapter；**`0`** 时 **禁止**网络读 catalog（仅 TS） |
| `CATALOG_API_BASE_URL` | 继承 `NEXT_PUBLIC_API_BASE_URL` | 对拍 / Node 测试覆盖基址 |
| `CATALOG_API_PARITY_SKIP` | unset | CI 无 API 时跳过 vitest 对拍 |

### 6.2 推荐 Adapter 入口（S2b 实施时新建 · 本 Sprint 不建）

```text
frontend/lib/catalogApi/
  client.ts              # 已有 · raw fetch
  catalogGeoAdapter.ts   # getCountryOptions / getCitiesByCountry
  catalogPricingAdapter.ts # getPricingForCountry 同构
  catalogPoiAdapter.ts
  catalogHotelTierAdapter.ts
  catalogIntercityAdapter.ts
  catalogMediaAdapter.ts
  index.ts               # resolveCatalog*(): flag ? adapter : TS re-export
```

### 6.3 切换模式

| 模式 | 条件 | 行为 |
|------|------|------|
| **TS-only**（当前） | `ENABLED=0` | 全部 §2.1 同步 import |
| **Shadow** | `ENABLED=1` + dev 对拍 | UI 仍 TS；并行 fetch API · console/metrics diff（可选） |
| **API-primary** | `ENABLED=1` + adapter 绿集 | UI 读 adapter；TS 作 fallback（105 §6.3 紧急降级） |
| **Dual-read gate** | CI | `test:catalog-api-parity` + Custom Itinerary vitest **必须** PASS 方可升 API-primary |

### 6.4 Fallback 规则（105 §6.3）

1. `ENABLED=0` → 不发起 catalog fetch  
2. API 非 200 / 空 `items` → **回退 TS**（S6 前 **必须**保留）  
3. 报价数值 diff \> 0 → **阻塞切换**（Custom Itinerary 硬门禁）

---

## 7. 切换波次裁决

### W1 · 可先切（🟢 · 低风险 · API 已对拍）

| 页面 | 消费方 | 前置 |
|------|--------|------|
| `/` | `LandingHomeAmbientBackdrop`, `ItineraryResultsSection` | API-14 PASS · 仅只读图 URL · **不动** FIVE-MAIN layout |

**门禁**：`landingAmbientByCountry.test.ts` + API-14 · 无报价逻辑。

### W2 · 需 adapter（🟡 · geo / ISO · 无报价）

| 页面 | 消费方 |
|------|--------|
| `/` hero 国家/城市（若未来开放动态列表） | C-03 |
| `/market` 筛选条 | C-04 |
| `/market/provider`, `/market/acquisition` | C-13, C-14 |
| `/escrow/[id]`, `/itinerary/new`, `/guide/register`, `/provider/register` | C-15~C-18 |

**门禁**：countries+cities adapter 单元测试 · `geoOptions` 形状等价 · **Rust preset_cities 仍独立**（切换 FE 不改变 POST 校验）。

### W3 · Custom Itinerary 非报价（🟢 geo/POI 展示 **DONE** · 报价/交通仍 TS）

| 模块 | 状态 |
|------|------|
| 国家/城市下拉 | **Phase 7** `useCatalogCountryOptions` / `useCatalogCityOptions` |
| POI 列表展示（游客日卡） | **Phase 7** `useCatalogPoiDetails` · 图/文案 TS merge fallback |
| 城际 mode UI | **仍 TS** `getInterCityTransportModes`（W4 边界） |
| 酒店 picker / 市内交通 overlay | **仍 TS** `getHotels` / `CITY_TRANSPORT_*` |
| `itinerarySubmitLogic` enrich | **仍 TS** `getAttractionDetails` 等（W4 边界） |

**门禁**：`useCatalogPoi.test.ts` · `customItineraryCatalogUi.test.ts` · `market-custom-itinerary-catalog-ui.spec.ts` · W4 shadow 仍必绿。

### W4 · Custom Itinerary 报价链（🔴 · shadow gate **DONE** · UI 仍 TS）

| 模块 | 状态 |
|------|------|
| `useQuoteCalculation`, `quoteCalculationTourist/Guide/Shared` | **Phase 6 shadow 对拍** · UI **仍** `getPricingForCountry` |
| `itinerarySubmitLogic`, `customItineraryBlockedKeys` | shadow POI value / tiers · enrich **未切** |
| 城际 mode + 价 | `catalogIntercityAdapter` shadow · UI 仍 TS |

**门禁（已交付）**：

- `customItineraryCatalogShadowCompare.ts` — 九域 shadow compare + mismatch 明细 + `formatCatalogShadowReport`
- `customItineraryCatalogParity.test.ts` — CI-01~03 offline **必绿** · CI-LIVE（API 可用时）
- `scripts/gates/custom-itinerary-catalog-parity.sh` · `npm run test:custom-itinerary-catalog-parity`
- `useQuoteCalculation.test.ts` — W4 样本报价 shadow

**仍阻塞 API-primary UI 切换（W4 残余）**：

| 阻塞项 | 说明 |
|--------|------|
| Custom Itinerary **主读路径** | `useItineraryForm` / modal 组件 **禁止** 本 Phase 切 adapter |
| POI 图 / stock / M6 | C-12 · `poi-images` API 未实现 |
| `itinerarySubmitLogic` enrich | 需 W3/W5 显式 scope 才切 |
| Live API shadow 红 | import 未 committed 或 PG 漂移 → CI-LIVE FAIL |
| Rust `POST /itineraries` | `preset_cities` 仍硬编码 · 与 FE decouple |

### W5 · 媒体 / M6（🔴 · S3 后）

POI hero · `ITINERARY_STOCK` · `poi-images` API · Admin M6 publish。

### 必须继续双读对拍（不可跳过）

| 范围 | 原因 |
|------|------|
| **Import Runner** `parity.ts` P-01~P-16 | TS 为 import 真源直至 S6+ |
| **`catalogApiParity.test.ts`** | S2-API-RO 回归 |
| **Custom Itinerary 报价**（W4） | **Phase 6 shadow gate** · UI 仍 TS · live API 对拍随 import |
| **`cityDetails/*` 测试套件** | POI 图 · coverage · intercity |
| **Rust `POST /itineraries`** | `preset_cities` 硬编码 · 与 FE 切换 decouple |

---

## 8. Custom Itinerary 专表（全栈 Catalog 唯一重消费者）

| 文件 | TS 依赖 |
|------|---------|
| `useItineraryForm.ts` | `useCatalogCityOptions` · quote/pricing **仍 TS** |
| `TouristForm` / `GuideForm` | `useCatalogCountryOptions` |
| `TouristDayCardAttractions/Food` | `useCatalogPoiDetails` |
| `useQuoteCalculation.ts` | `getPricingForCountry`（**仍 TS**） |
| `constants.ts` | `getPricingForCountry`, `ITINERARY_STOCK`（**仍 TS**） |
| `itinerarySubmitLogic.ts` | **仍 TS** pricing + `getAttractionDetails` enrich |
| `quoteCalculationTourist.ts` | `hotelNightRatePerPerson` |
| `quoteCalculationGuide.ts` / `Shared.ts` | `CountryPricingConfig` |
| `lib/catalogApi/customItineraryCatalogShadowCompare.ts` | **W4 shadow 对拍**（测试/CI · 非 UI） |
| `TouristDayCardAttractions.tsx` | `getAttractionDetails` |
| `TouristDayCardFood.tsx` | `getFoodDetails` |
| `TouristDayCardTransportAndHotels.tsx` | `getHotels`, `getHotelDetails` |
| `GuideDayCard.tsx` | 同上 |
| `*CrossCityAndCity.tsx` | `getInterCityTransportModes`, labels |
| `GuideFeeAndTransportSection.tsx` | `getInterCityTransportLabelKey` |
| `ItineraryMediaPreviewCard.tsx` | `isExternalItineraryStockImage` |

**挂载路由**：`app/market/MarketPageClient.tsx` → dynamic `CustomItineraryModal`

**105 §9 设计**：公式 **不改** · 仅 `getPricingForCountry` 等 **数据源** 换 adapter。

---

## 9. 明确未做（Sprint 边界）

- Admin Catalog CRUD / 审核 UI  
- Growth / Referral / Official OPS  
- ~~`catalog*Adapter.ts` 实现 · UI 接线~~ → **Phase 3~6 adapter + W2 geo UI · Custom Itinerary UI 仍 TS**  
- `NEXT_PUBLIC_CATALOG_API_ENABLED=1` 默认值变更  
- Custom Itinerary **主读** 切 Catalog API（Phase 6 仅 shadow gate · Phase 7 仅 geo/POI **展示**）  
- pricing / hotel / transport / submit enrich 切 adapter（W4 边界）
- ~~`GET /catalog/hotel-tiers` 等新端点~~ → **Phase 1 已交付 RO API**（§11）  
- Rust `preset_cities` 改读 PG  
- ~~`GET /meta.product_countries` 改读 PG~~ → **S4b DONE**（118 · opt-in · 746 契约保持）

---

## 10. 下一步建议（S2b Implementation）

1. ~~**P0 API**：`GET /catalog/hotel-tiers`~~ → **Phase 1 DONE**（§11）  
2. ~~**P0 续**：pricing handler 全字段 expose~~ → **Phase 2 DONE**（§11）  
3. ~~**Adapter 层**：`catalogPricingAdapter` + `catalogGeoAdapter`（W2）~~ → **Phase 3 DONE**（§11）  
4. ~~**W1 试点**：Landing ambient · `resolveLandingAmbientUrl()` + flag~~ → **Phase 4 DONE**（§11）  
5. ~~**W2 geo 读链路**~~ → **Phase 5 DONE**（§11）  
6. ~~**W4 门禁**：`customItineraryCatalogParity.test.ts` 报价 shadow 对拍~~ → **Phase 6 DONE**（§11）  
7. ~~**W3**：Custom Itinerary geo/POI **展示** UI~~ → **Phase 7 DONE**（§11）  
8. ~~**Phase 8 closure**~~ → **DONE**（§11 · [114](./114-S2b-Catalog-Consumer-Closure-Report.md)）  
9. ~~**S2c live gate**~~ → **DONE**（§11 · [115](./115-S2c-Catalog-Live-Gate-Report.md)）  
10. ~~**S3/W5 POI media**~~ → **DONE**（§11 · [116](./116-S3-W5-POI-Media-Catalog-Report.md)）  
11. ~~**S4 server validation alignment**~~ → **DONE**（§11 · [117](./117-S4-Catalog-Server-Validation-Alignment-Report.md)）  
12. ~~**S4b meta product_countries**~~ → **DONE**（§11 · [118](./118-S4b-Meta-Product-Countries-Catalog-Alignment-Report.md)）  
13. ~~**S4c catalog geo final revalidation**~~ → **FINAL GO**（§11 · [119](./119-S4c-Catalog-Geo-Server-Final-Revalidation-Report.md)）  
14. ~~**S5 catalog release freeze**~~ → **CATALOG_RELEASE_FREEZE_GO**（§11 · [120](./120-S5-Catalog-Release-Freeze-Report.md)）  
15. **S6+**：B-S4-02~06 · 报价 UI 切流 · core 静态表退役  
13. **04 §3.4**：登记 catalog RO 路由

---

## 11. Implementation Log

### Phase 1 · P0 `GET /api/v1/catalog/hotel-tiers`（2026-06-07）

| 项 | 交付 |
|----|------|
| **路由** | `GET /api/v1/catalog/hotel-tiers` — 无 query · `{ status, count, items }` |
| **过滤** | `publish_status = published` only |
| **行投影** | `tier_code`, `sort_order`, `multiplier`, `label_key`, `description_key`, `submit_label_zh`, `version`, `stock_image_url`（LEFT JOIN published media） |
| **503** | 无 DB 池 → `catalog_db_unavailable` |
| **Auth** | `/api/v1/catalog/` 白名单（`STRICT_SESSION_GATE=1` 匿名 GET OK） |
| **Rust** | `db/catalog.rs` `list_catalog_hotel_tiers` · `handlers::get_hotel_tiers` |
| **单测** | `catalog_ro_*` 含 hotel-tiers count · 503 双路径 |
| **Smoke** | `scripts/gates/catalog-api-smoke.sh` 第 7 端点 |
| **Parity** | `catalogApiParity.test.ts` API-08 / API-08b ↔ `HOTEL_TIERS` + `HOTEL_TIER_MULTIPLIER` |
| **Client** | `fetchCatalogHotelTiers()`（**无 UI 接线**） |
| **未做** | Admin CRUD · Growth · OPS · adapter · `ENABLED=1` |

**验证**：

```bash
DATABASE_URL=postgres://... cargo test catalog_ro_ -p traveltrust-api
bash scripts/gates/catalog-api-smoke.sh
bash scripts/check-catalog-api-parity.sh
```

---

### Phase 2 · Pricing 全字段 expose（2026-06-07）

| 项 | 交付 |
|----|------|
| **端点** | `GET /api/v1/catalog/pricing` — 行投影已含 **全部** `catalog_pricing_templates` published 列 |
| **标量（cents）** | `per_attraction_cents`, `per_food_cents`, `hotel_base_per_night_cents` |
| **JSON（cents）** | `city_transport_price` `{ sedan, suv, van }` · `intercity_price_per_person` `{ flight, rail }` · `guide_levels_per_day` `{ primary, intermediate, advanced, expert }` |
| **元数据** | `currency_code`, `country_iso`, `country_name_zh`, `version` |
| **Client 类型** | `frontend/lib/catalogApi/types.ts` · `CatalogPricingItem` + `CATALOG_*_KEYS` |
| **Contract** | `catalogApiPricing.contract.test.ts`（静态 · 无 HTTP） |
| **Parity** | API-11 CN 全字段 · API-11b 十国全字段 ↔ `getPricingForCountry` |
| **Rust 单测** | `catalog_ro_*` pricing JSON 键 · CN cents 样本值 |
| **Smoke** | `catalog-api-smoke.sh` pricing 全字段 shape 断言 |
| **未做** | `catalogPricingAdapter` · UI · `ENABLED=1` · Admin/Growth/OPS |

**验证**：

```bash
DATABASE_URL=postgres://... cargo test catalog_ro_ -p traveltrust-api
cd frontend && npm run test:catalog-api-parity   # contract 无 API 亦可绿
CATALOG_API_BASE_URL=http://127.0.0.1:8080 bash scripts/gates/catalog-api-smoke.sh
```

---

### Phase 3 · Catalog Adapter 基础层（2026-06-07）

| 项 | 交付 |
|----|------|
| **Geo** | `catalogGeoAdapter.ts` — `mapApiCountries/Cities` · `read*FromTs` |
| **Pricing** | `catalogPricingAdapter.ts` — `mapCatalogPricingItemToConfig`（cents→元） |
| **Hotel tiers** | `catalogHotelTierAdapter.ts` — `mapApiHotelTiersToResolved` |
| **统一入口** | `resolve.ts` — `resolveCatalogCountries/Cities/Pricing/HotelTiers` |
| **策略** | `ENABLED=0` → TS · `=1` → API 优先 · 失败/空 → 回退 TS · `{ data, source }` |
| **DI** | `deps.ts` — `createDefaultCatalogResolveDeps()`（Vitest mock） |
| **出口** | `index.ts` — 公共 re-export（**无** page/component import） |
| **单测** | `catalogResolve.test.ts` — flag=0 · mock 成功 · 失败回退 · 字段映射 |
| **未做** | UI / Custom Itinerary 切流 · `ENABLED=1` 默认 · Admin/Growth/OPS |

**验证**：

```bash
cd frontend && npm run test:catalog-api-parity   # 含 catalogResolve.test.ts
```

---

### Phase 4 / W1 · Landing ambient 试点（2026-06-07）

| 项 | 交付 |
|----|------|
| **读函数** | `resolveLandingAmbientUrl(countryZh)` — `media?asset_kind=landing_ambient&country_iso=` |
| **Hook** | `useLandingAmbientUrl` — 首屏 TS · `ENABLED=1` client 升级 · 无 hydration mismatch |
| **接线** | `LandingHomeAmbientBackdrop` · `ItineraryResultsSection`（destinationCover） |
| **策略** | `ENABLED=0` 默认 TS · `=1` API 优先 · 失败/空 → TS |
| **Client** | `fetchCatalogMedia({ assetKind, countryIso })` |
| **Vitest** | `resolveLandingAmbient.test.ts` · `useLandingAmbientUrl.test.ts` |
| **Playwright** | `home-landing-shell.spec.ts` — backdrop `data-tt-home-ambient-src` 稳定 |
| **未做** | Custom Itinerary · 报价链 · `ENABLED=1` 默认 · Admin/Growth/OPS |

**验证**：

```bash
cd frontend && npm run test:catalog-api-parity
npx playwright test e2e/home-landing-shell.spec.ts
```

---

### Phase 5 / W2 · Geo adapter 读链路（2026-06-07）

| 项 | 交付 |
|----|------|
| **Adapter 扩展** | `mapApiCountriesToProductCountries` · `readProductCountriesFromTs` · `resolveCatalogProductCountries` |
| **Hooks** | `useCatalogCountryOptions` · `useCatalogCityOptions` · `useCatalogProductCountries` · `useGuideRegisterCountryOptions` |
| **策略** | `ENABLED=0` 默认 TS · `=1` Catalog API countries/cities 优先 · 失败/空 → TS · 首屏 TS 无 hydration mismatch |
| **接线** | `/` hero · `/market` `StickyFilterBar` · subsites（`MarketSubsiteFilterBar` + Studio modals）· `/escrow/[id]` 城市下拉 · `/itinerary/new` · `/guide/register` · `/provider/register` |
| **Vitest** | `useCatalogGeo.test.ts` · `catalogResolve.test.ts`（product countries） |
| **Playwright** | `home-landing-shell.spec.ts` — 国家 pill + 城市 quick-pick（flag=0） |
| **未做** | Custom Itinerary 报价链 · pricing 切流 · `useMarketPage*` URL 校验仍 TS · Admin/Growth/OPS · **`ENABLED=1` 默认** |

**验证**：

```bash
cd frontend && npm run test:catalog-api-parity
npx playwright test e2e/home-landing-shell.spec.ts
```

---

### Phase 6 / W4 · Custom Itinerary 报价链 shadow gate（2026-06-07）

| 项 | 交付 |
|----|------|
| **Adapter 扩展** | `catalogPoiAdapter.ts` · `catalogIntercityAdapter.ts` |
| **Shadow SSOT** | `customItineraryCatalogShadowCompare.ts` — geo · pricing · hotel tiers · POI · intercity · quote tourist/guide |
| **输出** | `CatalogShadowCompareReport` · `formatCatalogShadowReport()` mismatch 明细 · per-domain summary |
| **Vitest** | `customItineraryCatalogParity.test.ts` — CI-01 offline 全域 · CI-02 pricing · CI-03 quote · CI-LIVE（API up） |
| **扩展** | `useQuoteCalculation.test.ts` W4 样本 · 并入 `test:catalog-api-parity` |
| **Gate** | `scripts/gates/custom-itinerary-catalog-parity.sh` · `npm run test:custom-itinerary-catalog-parity` |
| **策略** | **不切** Custom Itinerary UI · **不改变**报价结果 · `ENABLED=0` 默认 |
| **未做** | Modal 主读切 API · pricing/POI UI 切流 · Admin/Growth/OPS · **`ENABLED=1` 默认** |

**验证**：

```bash
cd frontend && npm run test:custom-itinerary-catalog-parity
bash scripts/gates/custom-itinerary-catalog-parity.sh
cd frontend && npm run test:catalog-api-parity   # 含 CI-01~03
```

---

### Phase 7 / W3 · Custom Itinerary geo + POI 展示（2026-06-07）

| 项 | 交付 |
|----|------|
| **Resolve** | `resolveCatalogPoiDetails` · `deps.fetchPois` |
| **Adapter** | `catalogPoiAdapter` 扩展 `mapApiPoisToDetails` / `readPoiDetailsFromTs` |
| **Hooks** | `useCatalogPoiDetails` · 复用 `useCatalogCountryOptions` / `useCatalogCityOptions` |
| **接线** | `useItineraryForm` · `TouristForm` / `GuideForm` · `TouristDayCardAttractions` / `Food` |
| **策略** | `ENABLED=0` 默认 TS · `=1` API 优先 · 失败/空 → TS · 首屏 TS |
| **W4 边界** | `useQuoteCalculation` · `constants` pricing · hotels · city/intercity transport · `itinerarySubmitLogic` **仍 TS** |
| **Vitest** | `useCatalogPoi.test.ts` · `customItineraryCatalogUi.test.ts` · `catalogResolve` POI · W4 shadow 保留 |
| **Playwright** | `market-custom-itinerary-catalog-ui.spec.ts` — 国家/城市/故宫 pill（flag=0） |
| **未做** | 报价/pricing/hotel/transport 切流 · submit enrich · Admin/Growth/OPS · **`ENABLED=1` 默认** |

**验证**：

```bash
cd frontend && npm run test:catalog-api-parity
npx vitest run components/market/CustomItineraryModal/useQuoteCalculation.test.ts
npx playwright test e2e/market-custom-itinerary-catalog-ui.spec.ts
bash scripts/gates/custom-itinerary-catalog-parity.sh
```

---

### Phase 8 · Catalog Consumer Closure Gate（2026-06-07）

| 项 | 交付 |
|----|------|
| **统一门禁** | `scripts/gates/s2b-catalog-consumer-closure-gate.sh` · `scripts/check-s2b-catalog-consumer-closure.sh` |
| **Vitest** | `test:catalog-api-parity` + `test:custom-itinerary-catalog-parity` |
| **Playwright** | `home-landing-shell.spec.ts` · `market-custom-itinerary-catalog-ui.spec.ts` |
| **Closure 报告** | [114-S2b-Catalog-Consumer-Closure-Report.md](./114-S2b-Catalog-Consumer-Closure-Report.md) |
| **默认** | `NEXT_PUBLIC_CATALOG_API_ENABLED=0`（closure 脚本强制） |
| **边界** | 报价主链仍 TS · W4 shadow 保留 · 无 Admin/Growth/OPS |

**验证**：

```bash
bash scripts/check-s2b-catalog-consumer-closure.sh
```

---

### Phase 9 · S2c Catalog Live Gate（2026-06-07）

| 项 | 交付 |
|----|------|
| **统一门禁** | `scripts/gates/s2c-catalog-live-gate.sh` · `scripts/check-s2c-catalog-live-gate.sh` |
| **Smoke** | `catalog-api-smoke.sh`（7 RO 端点） |
| **Live parity** | `test:catalog-api-parity` · API-01~14 **无 skip** |
| **CI-LIVE** | `test:custom-itinerary-catalog-parity` · W4 live shadow **无 skip** |
| **S2b 复验** | closure gate · `ENABLED=0` |
| **Live 报告** | [115-S2c-Catalog-Live-Gate-Report.md](./115-S2c-Catalog-Live-Gate-Report.md) |
| **前提** | API `:8080` + PG committed import · **不**默认 `ENABLED=1` |

**验证**：

```bash
bash scripts/check-s2c-catalog-live-gate.sh
```

---

### Phase 10 · S3/W5 POI Media Catalog（2026-06-07）

| 项 | 交付 |
|----|------|
| **RO API** | `GET /catalog/poi-images` · `GET /catalog/poi-images/:poi_id` |
| **Adapter** | `catalogPoiMediaAdapter.ts` · `resolveCatalogPoiDetails` 并行 merge |
| **UI** | CI POI 卡片经 `useCatalogPoiDetails` · **无新组件** |
| **门禁** | `scripts/check-s3-w5-poi-media-catalog-gate.sh` |
| **报告** | [116-S3-W5-POI-Media-Catalog-Report.md](./116-S3-W5-POI-Media-Catalog-Report.md) |
| **边界** | 报价/enrich 仍 TS · 无 Admin/Growth · `ENABLED=0` 默认 |

**验证**：

```bash
bash scripts/check-s3-w5-poi-media-catalog-gate.sh
```

---

### Phase 11 · S4 Catalog Server Validation Alignment（2026-06-07）

| 项 | 交付 |
|----|------|
| **Parity gate** | `catalog_server_validation_parity` · core ↔ PG countries/cities |
| **Adapter** | `catalog_geo_validation.rs` · `CATALOG_SERVER_GEO_VALIDATION` opt-in |
| **POST 接线** | `POST /itineraries` · `POST /itineraries/custom` country（非 day_plans 全量） |
| **报告** | [117-S4-Catalog-Server-Validation-Alignment-Report.md](./117-S4-Catalog-Server-Validation-Alignment-Report.md) |
| **边界** | meta 仍 core · PATCH 仍 core · 无 FE/报价改动 |

**验证**：

```bash
bash scripts/check-s4-catalog-server-validation-alignment.sh
```

---

### Phase 12 · S4b Meta Product Countries Catalog Alignment（2026-06-07）

| 项 | 交付 |
|----|------|
| **B-S4-01** | `GET /meta.product_countries` opt-in 读 published `catalog_countries` |
| **Resolver** | `resolve_meta_product_countries` · 共用 `CATALOG_SERVER_GEO_VALIDATION` |
| **746 契约** | 七键顺序不变 · `read_source=` 仅在 `dual_write_order` |
| **Contract tests** | core 默认 · catalog 成功 · PG Err/行数回退 · GET /meta 集成 |
| **报告** | [118-S4b-Meta-Product-Countries-Catalog-Alignment-Report.md](./118-S4b-Meta-Product-Countries-Catalog-Alignment-Report.md) |
| **边界** | 无 FE/报价/submit enrich · `NEXT_PUBLIC_CATALOG_API_ENABLED` 仍 0 |

**验证**：

```bash
bash scripts/check-s4b-meta-product-countries-catalog-alignment.sh
```

---

### Phase 13 · S4c Catalog Geo Server Final Revalidation（2026-06-07）

| 项 | 交付 |
|----|------|
| **终验** | 重启 S4b API · flag=0/1 live `/meta` + POST custom geo |
| **WARN 清零** | `read_source=` 严格 smoke · 无旧二进制 WARN |
| **门禁** | S4 + S4b + S2c 同一 gate 串联 |
| **报告** | [119-S4c-Catalog-Geo-Server-Final-Revalidation-Report.md](./119-S4c-Catalog-Geo-Server-Final-Revalidation-Report.md) |
| **结论** | **Catalog Geo Server Alignment FINAL GO** |
| **边界** | 无新功能 · 无 FE/报价改动 |

**验证**：

```bash
bash scripts/check-s4c-catalog-geo-server-final-revalidation.sh
```

---

### Phase 14 · S5 Catalog Release Freeze（2026-06-07）

| 项 | 交付 |
|----|------|
| **证据包** | 113–119 gates/reports/flags/回退/禁止项汇总 |
| **一键 gate** | `check-s5-catalog-release-freeze.sh` → S2c + S3/W5 + S4c |
| **结论** | **CATALOG_RELEASE_FREEZE_GO** |
| **报告** | [120-S5-Catalog-Release-Freeze-Report.md](./120-S5-Catalog-Release-Freeze-Report.md) |
| **边界** | 无新功能 · 无 FE/报价改动 · `ENABLED=0` 默认 |

**验证**：

```bash
bash scripts/check-s5-catalog-release-freeze.sh
```

---

**报告状态**：**S2b CLOSURE + S2c LIVE + S3/W5 + S4 + S4b + S4c + S5 FREEZE GO** — [114](./114-S2b-Catalog-Consumer-Closure-Report.md) · [115](./115-S2c-Catalog-Live-Gate-Report.md) · [116](./116-S3-W5-POI-Media-Catalog-Report.md) · [117](./117-S4-Catalog-Server-Validation-Alignment-Report.md) · [118](./118-S4b-Meta-Product-Countries-Catalog-Alignment-Report.md) · [119](./119-S4c-Catalog-Geo-Server-Final-Revalidation-Report.md) · [120](./120-S5-Catalog-Release-Freeze-Report.md)
