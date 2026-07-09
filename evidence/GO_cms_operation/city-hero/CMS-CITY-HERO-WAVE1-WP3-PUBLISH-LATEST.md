# City Hero Wave 1 · WP3 Catalog Publish

| | |
|---|---|
| **Date** | 2026-07-07 |
| **Verdict** | **PASS** |
| **asset_key** | `city_hero_tokyo` |
| **fallback_key** | `hero_japan` (matrix · unchanged) |

## Catalog API

- Query: `http://127.0.0.1:8081/api/v1/catalog/media?asset_kind=city_hero&country_iso=JP&city_slug=tokyo`
- count: **1**
- row: `{"asset_kind":"city_hero","city_slug":"tokyo","asset_key":"city_hero_tokyo","country_iso":"JP","url":"https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/city-hero-tokyo-v1.jpg"}`

## Acceptance

- asset_kind: **PASS**
- city_slug: **PASS**
- asset_key: **PASS**
- status_published: **PASS**
- country_jp: **PASS**
- fallback_key_preserved: **PASS**
- url_live: **PASS**

## Next

WP4 Runtime resolver
