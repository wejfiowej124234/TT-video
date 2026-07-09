# Official Cold Start Dataset · Phase 1 · Sign-off · 20260703T044855Z

**Verdict:** `TT_OFFICIAL_COLD_START_DATASET_PHASE1: CLOSED`  
**Environment:** Staging · `https://tt-api-staging.fly.dev` · API deploy `deployment-01KWK533SGKGS5PBAVB6NMTKN0`  
**Web:** `https://tt-web-staging.fly.dev`

## Coverage (10/10)

| Metric | Result |
|--------|--------|
| Official ops accounts | 5/5 |
| Complete country chains | 10/10 |
| Cold-start campaigns deployed | 10/10 |

## Surface Coverage

| Surface | OCS rows visible (public/admin) |
|---------|----------------------------------|
| Guides (production) | 14 |
| Market · Provider | 11 |
| Market · Acquisition | 10 |
| Cold Start · home_hero | 200 OK |
| Campaigns deployed | 10 |

## Data governance (post-apply DDG)

| Class | Count |
|-------|-------|
| PRODUCT_DATA_DEFECT | 0 |
| TEST_DATA_LEAKAGE | 0 |

OCS `@ocs.traveltrust.app` production guides exempt from legacy non-canonical seed rule via `isOfficialColdStartRow` + `state.json` ID allowlist.

## Audits

- `run-official-cold-start-dataset.cjs` · complete
- `validate-official-cold-start-dataset.cjs` · **PASS** (blocking=0)
- `staging-full-site-display-governance-audit.cjs` · **PASS** (blocking=0)

## Evidence bundle

`evidence/GO_official_cold_start_dataset/20260703T044855Z/`

- `state.json` · entity ID map
- `ocs-run-report.json` · apply summary
- `ocs-validate.json` · Coverage + Surface Coverage
- `fs-dg-post.json` · DDG post-apply

## Deferred (Post-MVP)

- Community 100 posts · historical orders 20 (no Admin write API)
- Campaign item_refs slug fixes re-deploy (manifest corrected; optional re-apply campaigns)

**Signed:** Agent acceptance run 2026-07-03 UTC
