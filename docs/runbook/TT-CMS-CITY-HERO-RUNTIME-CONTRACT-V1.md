# City Hero · Runtime Contract V1

**Version:** 1.0.0 · **生效：** 2026-07-07  
**状态：** **CONTRACT_ONLY** · 设计真源 · **未实现**

**上级（只读 · 不得修改）：** [P1 Standard v1.1 FROZEN](TT-CMS-P1-CONTENT-FAMILY-STANDARD.md) · [city-hero-brief.v1.yaml](../../data/catalog/city-hero-brief.v1.yaml) · [city-hero-matrix.v1.yaml](../../data/catalog/city-hero-matrix.v1.yaml)

**机读：** `data/catalog/city-hero-runtime-contract.v1.yaml` · `TT_CMS_CITY_HERO_RUNTIME_CONTRACT`

---

## 1 · API 读取

| 项 | 约定 |
|----|------|
| **Endpoint** | `GET /api/v1/catalog/media` |
| **Query** | `asset_kind=city_hero` · `country_iso={ISO}` · **`city_slug={slug}`（planned）** |
| **示例** | `?asset_kind=city_hero&country_iso=JP&city_slug=tokyo` |
| **响应** | `items[].url` · `country_iso` · `version` · （planned）`city_slug` / `stock_pool_key` = `asset_key` |
| **Resolver（planned）** | `frontend/lib/catalogApi/resolveCityHero.ts` · `ENABLED=1` → catalog |

> **诚实边界：** 当前 staging `MediaQuery` 仅 `asset_kind` + `country_iso` · 实现阶段须扩展 `city_slug`（或 `city_id`）并将 `city_hero` 加入 admin allowlist。

**Matrix 绑定：** 行 `asset_key`（例 `city_hero_tokyo`）= catalog 行 `stock_pool_key` 或 `license.usage`。

---

## 2 · Fallback 规则

```text
① city_hero（country_iso + city_slug）
        ↓ 空 / 失败
② hero_{country} → landing_ambient（country_iso）  例 hero_japan → JP da-hero
        ↓ 空 / 失败
③ TS static（Expected Difference · 不得计为 L5 PASS）
```

| Matrix 行 | asset_key | fallback_key | ② 读面 |
|-----------|-------------|--------------|--------|
| 东京 | `city_hero_tokyo` | `hero_japan` | `landing_ambient` · `country_iso=JP` |

**Resolver 返回：** `{ data, source, asset_key, fallback_key, fallback_used }`  
**禁止：** Production 长期 Unsplash · 把 `source=ts` 当 Verify PASS。

---

## 3 · Consumer Mapping

| 页面 | Route | 使用 | 触发 |
|------|-------|------|------|
| **Home** | `/` | ✅ | 用户选择国家+城市 · 城市主视觉 |
| **Travel** | `/traveltrust` | ✅ | 目的地/城市叙事块 |
| Guide / Market / Community / … | — | ❌ | Brief 已排除 |

Matrix **consumer** 列 `Home · Travel` = 两页共用同一 `asset_key` · Verify 可分站探针。

---

## 4 · Verify 探针

**Script（planned）：** `node scripts/dev/run-cms-content-l5-city-hero-verify.cjs --matrix-id CH-JP-TOKYO-001`

| 探针 | 检查 |
|------|------|
| **catalog** | media 返回 ≥1 · url 非空 · asset_key 对齐 |
| **api** | HEAD · ≥16KB · MIME jpeg/webp |
| **decode** | ≥1920×1080 |
| **l5** | 无 unsplash/pexels · geo=JP |
| **fallback_drill** | 无 city 行时走 `hero_japan` · `fallback_used=true` |
| **consumer_home / travel** | ② staging 可见 catalog 源（Wave 1 至少 Home PASS） |

**Registry 只收：** `TT_CMS_CITY_HERO_ROW_VERIFY` = **PASS | FAIL**

---

## 5 · Evidence Schema

```json
{
  "schema": "traveltrust.cms_p1_family_verify.v1",
  "family": "city_hero",
  "matrix_id": "CH-JP-TOKYO-001",
  "asset_key": "city_hero_tokyo",
  "fallback_key": "hero_japan",
  "country_iso": "JP",
  "city_slug": "tokyo",
  "TT_CMS_CITY_HERO_ROW_VERIFY": "PASS",
  "gate_result": "PASS",
  "source": "catalog-api",
  "fallback_used": false,
  "checks": {
    "catalog": "PASS",
    "api": "PASS",
    "decode": "PASS",
    "l5": "PASS",
    "fallback_drill": "PASS",
    "consumer_home": "PASS",
    "consumer_travel": "SKIP"
  }
}
```

**路径：**

- `evidence/GO_cms_content_l5/city-hero/rows/CH-JP-TOKYO-001.EVIDENCE.json`
- `evidence/GO_cms_operation/city-hero/CMS-CITY-HERO-VERIFY-LATEST.json`

---

## 6 · Wave 1 东京验收口径

| 字段 | 值 |
|------|-----|
| **matrix_id** | `CH-JP-TOKYO-001` |
| **asset_key** | `city_hero_tokyo` |
| **fallback_key** | `hero_japan` |

**必须 PASS：**

- Catalog publish 东京 city_hero · live url
- Verify script exit 0 · 分辨率/L5/无 external stock
- Home consumer ② staging 读 catalog（非 ts）
- Matrix gates：`catalog_publish` · `verify` · `evidence_complete`

**必须 NOT：**

- Wave 1 完成前批量其余 37 城
- 仅凭 Wave 1 将 Registry 改为 Frozen
- `ts_fallback` 计为 PASS

**完成键：** `TT_CMS_CITY_HERO_WAVE1_TOKYO: PASS`

---

## 实现前禁止

Admin · API 改动 · Catalog ingest · Resolver · Frontend · Upload · **不修改** Registry / Ownership Matrix / P1 Standard。

**刷新 Evidence：** `node scripts/dev/run-cms-city-hero-runtime-contract.cjs`

---

*TT-CMS-CITY-HERO-RUNTIME-CONTRACT v1.0.0 · CONTRACT_ONLY · 2026-07-07*
