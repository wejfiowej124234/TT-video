# Single Official Baseline (SOB) · Full-Site Audit Report

**Stamp:** `20260703T053800Z`  
**Environment:** Staging · `https://tt-api-staging.fly.dev`  
**Policy:** One production baseline — Official Cold Start Dataset (OCS) only  

## Verdict: PASS (blocking=0, dup=0)

| Surface | Count | OCS expected |
|---------|-------|--------------|
| Guides | 10 | 10 |
| Provider | 10 | 10 |
| Acquisition | 10 | 10 |
| Official Guides | 10 | 10 |
| Campaigns deployed | 10 | 10 |

## Duplicate inventory (remediated)

| ID | Surface | Classification | Action |
|----|---------|----------------|--------|
| 650fbaff-… | guides | TEST_SEED (C3) | unpublish + SEED_GUIDE_PUBLIC_MARKET=0 |
| 00000000-…0311–314 | guides | CANONICAL_SHOWCASE | unpublish |
| 0f0749b5-… | provider | LEGACY_PRODUCTION | unpublish (SOB align) |

## Expected Difference (Registry)

C3/C1 accounts retained for login/联调 — not on public catalog post-OCS.

Scripts: `audit-single-official-baseline.cjs` · `align-single-official-baseline-staging.cjs`
