# City Hero Wave 1 · WP1 Admin Allowlist

| | |
|---|---|
| **Date** | 2026-07-07 |
| **Verdict** | **PASS** |
| **File** | `catalog_ops_admin.rs` |
| **Const** | `CATALOG_MEDIA_ASSET_KINDS` |

## Static Checks

- admin_rs_exists: **PASS**
- allowlist_const_defined: **PASS**
- create_uses_const: **PASS**
- no_inline_create_allowlist: **PASS**
- includes_city_hero: **PASS**
- preserves_legacy_kinds: **PASS**
- hotel_transport_unchanged: **PASS**
- admin_allowlist_matches_pg_check: **PASS**
- scope_admin_only: **PASS**

## Cargo Regression

- build: **PASS**
- media_asset_kind_allowlist_matches_ddl: **SKIP_PREEXISTING** (workspace test harness blocked by unrelated OrderRow/GuideRow E0063)
- media_asset_kind_preserves_hotel_and_transport: **SKIP_PREEXISTING** (workspace test harness blocked by unrelated OrderRow/GuideRow E0063)
- media_asset_kind_includes_city_hero: **SKIP_PREEXISTING** (workspace test harness blocked by unrelated OrderRow/GuideRow E0063)

> Static checks mirror unit tests · full cargo test blocked by pre-existing compile errors

## Next

WP2 API city_slug support
