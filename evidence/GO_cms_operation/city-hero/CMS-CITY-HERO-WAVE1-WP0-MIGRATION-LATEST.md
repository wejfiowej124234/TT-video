# City Hero Wave 1 · WP0 Migration

| | |
|---|---|
| **Date** | 2026-07-07 |
| **Verdict** | **PASS** |
| **Migration** | `20260707120000_cms_city_hero_asset_kind.sql` |

## Static Checks

- migration_file_exists: **PASS**
- includes_city_hero: **PASS**
- drops_old_check: **PASS**
- adds_named_check: **PASS**
- preserves_existing_kinds: **PASS**
- scope_catalog_media_assets_only: **PASS**

## SQLx

- migrate run: **PASS**
- migrate info (applied): **PASS**

## PostgreSQL

- CHECK includes city_hero: **PASS**
- INSERT city_hero probe: **PASS**
- Reject invalid kind: **PASS**

## Next

WP1 Admin allowlist
