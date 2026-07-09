# 115 · S2c Catalog Live Gate Report

> **Sprint**：S2c · **Catalog Consumer Live Verification**  
> **审计 SSOT**：[113-S2b-Catalog-Consumer-Audit-Report](./113-S2b-Catalog-Consumer-Audit-Report.md) · [114-S2b-Catalog-Consumer-Closure-Report](./114-S2b-Catalog-Consumer-Closure-Report.md) · [112-S2-API-RO-Audit-Report](./112-S2-API-RO-Audit-Report.md)  
> **日期**：2026-06-07  
> **状态**：**LIVE FULL GO** — 真实 API + committed import · live skip **清零** · **`NEXT_PUBLIC_CATALOG_API_ENABLED=0` 仍默认**

---

## 1. 结论

| 维度 | 判定 |
|------|------|
| Catalog RO API smoke（7 端点） | **GO** |
| API ↔ TS live 对拍（API-01~14） | **GO** — **0 skip** |
| Custom Itinerary W4 live shadow（CI-LIVE） | **GO** — **0 skip** |
| S2b closure gate（W1–W4 · ENABLED=0） | **GO** |
| 新增 UI / Admin CRUD / Growth / OPS | **未做（边界保持）** |
| 默认 `ENABLED=1` | **未做** |
| 报价主链 UI 切 API | **NO-GO（刻意保留）** — 仍 TS + shadow |

**S2c 正式标记**：**Catalog Consumer 在真实 API 数据下 FULL GO**；可进入下一阶段讨论（W5 POI 图、Rust preset_cities、报价 UI 切流等），**须**新 Sprint scope + **不得**默认 `ENABLED=1`。

---

## 2. 环境与前提

### 2.1 API / DB

| 项 | 值 |
|----|-----|
| **API base** | `http://127.0.0.1:8080`（`CATALOG_API_BASE_URL`） |
| **启动方式** | `bash scripts/dev/start-api-for-playwright.sh`（`cargo run -p traveltrust-api`） |
| **DATABASE_URL** | `postgres://traveltrust:traveltrust@localhost:5432/traveltrust`（根 `.env`） |
| **STRICT_SESSION_GATE** | `1` — Catalog GET **无 Bearer**（middleware 公众只读豁免 `/api/v1/catalog/*`） |
| **NEXT_PUBLIC_CATALOG_API_ENABLED** | **`0`**（live gate 脚本强制；E2E 仍 TS-only） |

### 2.2 Catalog import

| 项 | 值 |
|----|-----|
| **最新 committed batch** | `863285a9-df58-4959-9d54-12dc178992bb` |
| **input_hash** | `10687d3e5350b49fcd11d15a74ae4f7fa3f19751bbfe25c086100b666e58e971` |
| **status** | `committed` · mode `apply` |
| **Smoke 行数** | countries **10** · cities **38** · pois **330** · pricing **10** · intercity **234** · media **13** · hotel-tiers **3** |

**前提**：须 API 已编译含 S2 catalog 路由 + PG 内 committed import；旧二进制无 catalog 公众豁免时 smoke 会 **401**（本次 gate 前已重启 API）。

### 2.3 Skip 清零

| 变量 | S2c gate 设置 | 效果 |
|------|---------------|------|
| `CATALOG_API_PARITY_SKIP` | **unset** | API-01~14 **执行** |
| `SKIP_CATALOG_API_PARITY` | **unset** | 同上 |
| `CUSTOM_ITINERARY_CATALOG_PARITY_SKIP` | **unset** | CI-LIVE **执行** |

**对比 S2b closure（114 §9）**：offline 时 API-01 / CI-LIVE **console.warn skip**；S2c 在 API up + import committed 下 **无 skip 日志**。

---

## 3. 统一门禁（S2c 固化）

| # | 门禁 | 命令 |
|---|------|------|
| **ALL** | **S2c live gate** | `bash scripts/check-s2c-catalog-live-gate.sh` |
| 0 | Preflight health | curl `/health` → 200 |
| 1 | `catalog-api-smoke.sh` | 7 RO 端点 + pricing 全字段 shape |
| 2 | `test:catalog-api-parity` | Vitest 含 live API-01~14 |
| 3 | `test:custom-itinerary-catalog-parity` | Vitest 含 CI-LIVE |
| 4 | S2b closure gate | W1–W4 Vitest + Playwright · `ENABLED=0` |

**npm**：`cd frontend && npm run gate:s2c-catalog-live`

---

## 4. Live 对拍结果（W1–W4）

### 4.1 W1 · Landing ambient（API-14 · media）

| 用例 | 结果 | 说明 |
|------|------|------|
| API-14 landing media URLs | **PASS** | `countries.payload.landing_ambient.image_url` ↔ TS `landingAmbientImageUrl` |
| API media landing_ambient count | **PASS** | count ≥ 10 |
| Smoke `/catalog/media` | **PASS** | count=13 |

### 4.2 W2 · Geo / ISO（API-01~03）

| 用例 | 结果 | 说明 |
|------|------|------|
| API-01 countries count | **PASS** | 10 = `PRODUCT_COUNTRIES.length` |
| API-02 cities count | **PASS** | 38 |
| API-03 per-country city counts | **PASS** | 十国 ↔ `CITIES_BY_COUNTRY` |

### 4.3 W3 · POI 展示（API-06/07）

| 用例 | 结果 | 说明 |
|------|------|------|
| API-06/07 POI per city | **PASS** | attraction/food count ↔ TS `getAttractionDetails` / `getFoodDetails` |
| Smoke `/catalog/pois` | **PASS** | count=330 |

### 4.4 W4 · Pricing / hotel / intercity / shadow

| 用例 | 结果 | 说明 |
|------|------|------|
| API-08 hotel tiers | **PASS** | 3 tiers · label_key / multiplier ↔ TS |
| API-10/11/11b pricing | **PASS** | 十国 cents 全字段 ↔ `getPricingForCountry` |
| API-12 intercity 东京→大阪 | **PASS** | modes ↔ TS |
| CI-01~03 offline shadow | **PASS** | 4 tests |
| **CI-LIVE** full shadow | **PASS** | live PG 数据 · mismatchCount=0 |

**Vitest 汇总（step 2）**：**69 passed** · **9 files** · API-01~14 + CI-LIVE **全部执行**（~19s 含 POI 逐城）。

---

## 5. 失败回退行为（live 验证不变）

S2c **不**改 UI；回退矩阵与 [114 §3](./114-S2b-Catalog-Consumer-Closure-Report.md#31-feature-flag) 一致：

| 模式 | 行为 | S2c 验证 |
|------|------|----------|
| `ENABLED=0`（默认） | 不 fetch catalog；UI 读 TS | S2b closure E2E **PASS** |
| `ENABLED=1` + API 成功 | hooks TS 首屏 → client 升级 API | Vitest mock + **live 对拍** 证明 API 数据 ≡ TS |
| `ENABLED=1` + API 失败/空 | 保持/回退 TS | Vitest fallback cases（114 §3.2） |
| 报价主链 | **始终 TS** | CI-LIVE shadow 证明 adapter 不改变 quote |

---

## 6. S2b closure 复验（step 4 · ENABLED=0）

| Step | 结果 |
|------|------|
| [1/4] `test:catalog-api-parity` | **69 passed**（含 live API-01~14 + CI-LIVE） |
| [2/4] `test:custom-itinerary-catalog-parity` | **4 passed**（含 CI-LIVE ~479ms） |
| [3/4] `home-landing-shell.spec.ts` | **5 passed**, 1 skipped |
| [4/4] `market-custom-itinerary-catalog-ui.spec.ts` | **2 passed**, 1 skipped |

**总耗时**：~92s（含 Playwright）

---

## 7. 明确未做 / 下一阶段门槛

| 项 | S2c 边界 |
|----|----------|
| Admin Catalog CRUD / 审核 UI | **未做** |
| Growth / Referral / Official OPS | **未做** |
| Custom Itinerary 报价/hotel/transport **UI 切 API** | **未做** |
| `NEXT_PUBLIC_CATALOG_API_ENABLED=1` 默认 | **未做** |
| C-12 POI hero / `poi-images` RO | **未做（W5）** |
| Rust `preset_cities` / `meta.product_countries` → catalog | **未做** |

**允许进入下一阶段**：**是** — Consumer + Live 对拍 FULL GO；任何 **报价 UI 切流** 或 **ENABLED 默认改 1** 须单独 Sprint 与显式签字。

---

## 8. 验证记录（2026-06-07）

**命令**：`bash scripts/check-s2c-catalog-live-gate.sh`  
**结果**：**PASS** · exit 0 · ~92s

```
catalog-api-smoke: PASS
test:catalog-api-parity: 69 passed (API-01~14 live, CI-LIVE live)
test:custom-itinerary-catalog-parity: 4 passed (CI-LIVE live)
S2b closure gate: PASS (W1–W4)
S2c catalog live gate: PASS
```

---

## 9. 相关 Implementation Log

| Phase | 内容 | 文档 |
|-------|------|------|
| S2b 1–8 | Consumer wiring + offline closure | 113 §11 · **114** |
| **S2c** | **Live gate + 本报告** | 113 §11 · **115** |

---

**报告状态**：**S2c LIVE FULL GO · Catalog Consumer 真实 API 数据验证完成**
