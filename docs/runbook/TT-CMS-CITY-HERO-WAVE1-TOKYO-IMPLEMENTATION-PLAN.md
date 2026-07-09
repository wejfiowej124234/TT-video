# City Hero · Wave 1 东京 · Implementation Plan

**Version:** 1.0.0 · **生效：** 2026-07-07  
**状态：** **PLAN_ONLY** · 实现规划 · **未写代码**

**上级（只读 · 不得修改）：** [P1 Standard v1.1 FROZEN](TT-CMS-P1-CONTENT-FAMILY-STANDARD.md) · [Runtime Contract V1](TT-CMS-CITY-HERO-RUNTIME-CONTRACT-V1.md)（Review PASS） · [Brief](../../data/catalog/city-hero-brief.v1.yaml) · [Matrix](../../data/catalog/city-hero-matrix.v1.yaml)

**机读：** `data/catalog/city-hero-wave1-tokyo-implementation-plan.v1.yaml` · `TT_CMS_CITY_HERO_WAVE1_TOKYO_IMPLEMENTATION_PLAN`

**验收键（实现完成后）：** `TT_CMS_CITY_HERO_WAVE1_TOKYO: PASS`

---

## 0 · 范围锁定

| 字段 | 值 |
|------|-----|
| **matrix_id** | `CH-JP-TOKYO-001` |
| **asset_key** | `city_hero_tokyo` |
| **fallback_key** | `hero_japan` → `landing_ambient` · `country_iso=JP` |
| **city_slug** | `tokyo` |
| **Consumers** | Home `/` · Travel `/traveltrust` only |

**禁止：** 批量其他 37 城 · Wave 1 单独 Registry Frozen · 把 `source=ts` 计为 L5/Verify PASS · 修改 P0 POI Hero Evidence。

---

## 1 · 实现顺序（Work Packages）

```text
WP0 DB migration (city_hero CHECK)
    ├── WP1 Admin allowlist
    └── WP2 API read (city_slug)
            ├── WP3 Catalog publish (Ops)
            ├── WP4 Runtime resolver
            │       └── WP5 Consumer Home/Travel
            └── WP6 Verify + Evidence + Closure
```

---

## 2 · WP0 · DB Migration

**问题：** `catalog_media_assets.asset_kind` CHECK 不含 `city_hero`（migration `20260607130000`）。

**规划：**

- 新 migration：`ALTER TABLE catalog_media_assets` 扩展 CHECK 加入 `'city_hero'`
- 不改历史 migration 文件

**完成标准：** staging/prod 可 INSERT `asset_kind=city_hero` 不违反 CHECK。

---

## 3 · WP1 · Admin Allowlist

**现状：** `catalog_ops_admin.rs` create/patch allowlist = `poi_hero | landing_ambient | hotel_tier_stock | transport_stock | generic`。

**规划变更（实现阶段）：**

| 文件 | 变更 |
|------|------|
| `crates/api/src/db/catalog_ops_admin.rs` | 两处 allowlist 数组加入 `"city_hero"` |
| Admin Catalog Dashboard（可选） | media 列表 filter 增加 `city_hero` |

**东京 Catalog 绑定（Ops 发布时）：**

| 字段 | 值 |
|------|-----|
| `asset_kind` | `city_hero` |
| `stock_pool_key` | `city_hero_tokyo` |
| `country_id` | JP 对应 UUID |
| `city_id` | `catalog_cities.slug = tokyo` |
| `publish_status` | `published` |
| `source_type` | `upload`（非 unsplash） |

Brief 最低标准：≥1920×1080 · ≥16KB · JPEG/WebP。

---

## 4 · WP2 · API Read

**Endpoint：** `GET /api/v1/catalog/media`

**Query（扩展后）：**

```http
GET /api/v1/catalog/media?asset_kind=city_hero&country_iso=JP&city_slug=tokyo
```

**规划变更：**

| 层 | 文件 | 变更 |
|----|------|------|
| HTTP | `handlers.rs` · `MediaQuery` | 增加 `city_slug: Option<String>` |
| DB | `catalog.rs` · `list_catalog_media` | JOIN `catalog_cities` · filter `c.slug = $3` |
| 响应 | `CatalogMediaRow` | 可选返回 `stock_pool_key` · `city_slug` |
| Client | `frontend/lib/catalogApi/client.ts` | `fetchCatalogMedia({ citySlug })` |

**成功标准：**

- 东京行 published 后 `count >= 1`
- `city_slug=tokyo` 仅返回东京行（不泄漏大阪/福冈）
- `stock_pool_key === city_hero_tokyo`

**诚实边界（当前 staging）：** `city_slug` 被忽略 · `city_hero` count=0 · 属 Contract Review 已记录差距。

---

## 5 · WP3 · Catalog Publish（Ops · 非代码）

实现 WP0–WP2 后，由 Content Ops 发布单行资产：

1. Admin 创建 `catalog_media_assets` 行（binding 见 §3）
2. Review → Publish（revision 可追溯）
3. Staging 探针：`curl` 上述 API 返回 live url

**不在本规划阶段执行上传。**

---

## 6 · WP4 · Runtime Resolver

**新文件（规划）：** `frontend/lib/catalogApi/resolveCityHero.ts`

**模式：** 对齐 `resolveLandingAmbient.ts` · `NEXT_PUBLIC_CATALOG_API_ENABLED=1` 时走 catalog。

**Fallback 链：**

```text
① GET city_hero + country_iso + city_slug
        ↓ empty / error
② GET landing_ambient + country_iso  (hero_japan → JP)
        ↓ empty / error
③ TS static  (不得计 L5 PASS)
```

**返回形：**

```typescript
{
  data: string;           // url
  source: "catalog-api" | "catalog-api-fallback" | "ts";
  asset_key?: string;
  fallback_key?: string;
  fallback_used: boolean;
}
```

**单测：** `resolveCityHero.test.ts` — primary · fallback · ts · disabled flag。

---

## 7 · WP5 · Consumer Wiring

| Consumer | Route | 规划接入点 | Wave 1 最低要求 |
|----------|-------|------------|-----------------|
| **Home** | `/` | `LandingHomeAmbientBackdrop` — 用户选城市后调用 `resolveCityHero` | `consumer_home` probe **PASS** · `source=catalog-api` |
| **Travel** | `/traveltrust` | `TravelTrustPageCinematicCanvas` 或城市叙事块 | `consumer_travel` **PASS** 或 documented **SKIP** |

**新 Hook（规划）：** `useCityHeroUrl.ts` — hydration-safe · 同 `useLandingAmbientUrl` 模式。

**排除页面：** Guide · Market · Community · Governance · Me（Brief 已锁）。

---

## 8 · WP6 · Verify Script + Evidence

**Script（规划）：**

```bash
node scripts/dev/run-cms-content-l5-city-hero-verify.cjs --matrix-id CH-JP-TOKYO-001
API=https://tt-api-staging.fly.dev node scripts/dev/run-cms-content-l5-city-hero-verify.cjs --matrix-id CH-JP-TOKYO-001
```

**探针（对齐 Contract + P1）：**

| 探针 | 检查 |
|------|------|
| catalog | media ≥1 · url · asset_key 对齐 |
| api | HEAD ≥16KB · jpeg/webp |
| decode | ≥1920×1080 |
| l5 | 无 unsplash/pexels · geo=JP |
| fallback_drill | 无 city 行时 landing_ambient JP · `fallback_used=true` |
| consumer_home | staging 可见 catalog-api |
| consumer_travel | PASS 或 SKIP |

**Evidence 路径：**

```text
evidence/GO_cms_content_l5/city-hero/rows/CH-JP-TOKYO-001.EVIDENCE.json
evidence/GO_cms_operation/city-hero/CMS-CITY-HERO-VERIFY-LATEST.json
evidence/GO_cms_operation/city-hero/CMS-CITY-HERO-WAVE1-TOKYO-CLOSURE-LATEST.json
```

**Row Evidence 示例键：**

```json
{
  "schema": "traveltrust.cms_p1_family_verify.v1",
  "family": "city_hero",
  "matrix_id": "CH-JP-TOKYO-001",
  "TT_CMS_CITY_HERO_ROW_VERIFY": "PASS",
  "gate_result": "PASS",
  "asset_key": "city_hero_tokyo",
  "fallback_key": "hero_japan",
  "country_iso": "JP",
  "city_slug": "tokyo",
  "source": "catalog-api",
  "fallback_used": false
}
```

---

## 9 · P1 六门 · Wave 1 验收

| 门 | Wave 1 通过条件 |
|----|-----------------|
| Catalog Ready | 东京行 published + revision |
| Runtime Ready | API query 返回 live url |
| Consumer Ready | Home catalog-api · Travel  documented |
| Verify PASS | script exit 0 · `TT_CMS_CITY_HERO_ROW_VERIFY=PASS` |
| Evidence PASS | row + latest + closure 齐全 |
| L5 PASS | 无 external stock · ts 不算 PASS |

**Wave 1 _closure 键：**

```json
{
  "TT_CMS_CITY_HERO_WAVE1_TOKYO": "PASS",
  "TT_CMS_CITY_HERO_ROW_VERIFY": "PASS",
  "matrix_id": "CH-JP-TOKYO-001"
}
```

---

## 10 · 实现后检查清单

- [ ] WP0 migration applied staging
- [ ] WP1 Admin 可创建 `city_hero` media
- [ ] WP2 API `city_slug=tokyo` 精确返回
- [ ] WP3 Ops 发布东京资产（非 stock）
- [ ] WP4 resolver 单测绿
- [ ] WP5 Home ② staging 见 catalog-api
- [ ] WP6 verify exit 0 · Evidence 三路径写入
- [ ] `TT_CMS_CITY_HERO_WAVE1_TOKYO: PASS`
- [ ] Registry **不** Frozen（留 Wave 2 首尔）

---

## 11 · 未修改（本规划阶段）

Registry · Ownership Matrix · P1 Standard · Brief/Matrix/Contract · Admin/API/Runtime/Frontend 代码 · 无资产上传

**Evidence：** `evidence/GO_cms_operation/city-hero/CMS-CITY-HERO-WAVE1-TOKYO-IMPLEMENTATION-PLAN-LATEST.json`
