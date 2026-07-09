# Provider + Acquisition · Display Data Governance Issue List

**Stamp:** `20260702T103734Z` · **Environment:** staging  
**Verdict:** **PASS** (Guide-depth parity for automated gates)

## Issue List

| ID | Surface | Classification | Status | Summary |
|----|---------|----------------|--------|---------|
| PD-ML-001 | Provider + Acquisition (API) | **PRODUCT_DEFECT** | **FIXED** (code) | Public `GET …/listings` ignored `display_status`/surface/schedule — Admin unpublish could not hide cards |
| PD-ML-002 | Provider + Acquisition (API) | **PRODUCT_DEFECT** | **FIXED** (code) | `insert_market_listing` left `display_status=draft` for new production rows |
| PD-ML-003 | Provider + Acquisition (API) | **PRODUCT_DEFECT** | **FIXED** (code) | Public list/detail omitted `data_origin` — no Guide-parity audit field |
| EN-ML-001 | Provider | **ENHANCEMENT** | OPEN (Post-GO) | 13/13 cards share placeholder media (no per-id media pool) |
| EN-ML-002 | Acquisition | **ENHANCEMENT** | OPEN (Post-GO) | 9/9 cards share placeholder media |

## Staging verification (this run)

| Layer | Result |
|-------|--------|
| ML display governance audit | **PASS** · defects 0 |
| FE-API strict S12 | **0 blocking / 0 warnings** |
| BDV UAT-04 / UAT-09 | **PASS** |
| ERR-PROVIDER / ERR-ACQUISITION | **PASS** |
| V-MARKET-PROVIDER / V-MARKET-ACQUISITION | **PASS** |
| Admin ↔ Public parity | provider 13/13 · acquisition 9/9 |

## Code fixes (deploy to staging API for PD-ML-001～003 live)

- `crates/api/src/db/market_listings.rs` — `public_catalog_only` on public list; `select_public_market_listing_by_id`; display fields on insert
- `crates/api/src/routes/market_subsite.rs` — expose `data_origin`; detail uses public catalog selector
- Integration test: `public_catalog_surface_hides_admin_unpublished_provider_listing`

**Note:** PD-ML-001～003 fixes are in branch; redeploy `tt-api-staging` to enforce `display_status` gate on live API.
