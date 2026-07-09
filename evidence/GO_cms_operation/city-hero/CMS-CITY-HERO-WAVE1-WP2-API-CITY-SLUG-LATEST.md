# City Hero Wave 1 · WP2 API city_slug

| | |
|---|---|
| **Date** | 2026-07-07 |
| **Verdict** | **PASS** |

## Query

`GET /api/v1/catalog/media?asset_kind=city_hero&country_iso=JP&city_slug=tokyo`

## Static Checks

- media_query_city_slug: **PASS**
- handler_normalizes_city_slug: **PASS**
- list_catalog_media_city_slug_param: **PASS**
- response_fields: **PASS**
- join_catalog_cities: **PASS**
- stock_pool_key_filter: **PASS**
- api_tests_present: **PASS**
- no_frontend_resolver: **PASS**

## PG Query Regression

- verdict: **PASS**
- sample: `{"asset_kind":"city_hero","city_slug":"tokyo","asset_key":"city_hero_tokyo"}`

## WP6 Reminder

Before WP6 Verify: run full workspace cargo test once E0063 env debt is cleared · do not treat SKIP_PREEXISTING as City Hero failure

## Next

WP3 Catalog Publish (Ops · city_hero_tokyo live asset)
