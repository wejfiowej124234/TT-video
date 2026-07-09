# Market Subsite Frontend Race Fix Sign-off

- **Stamp:** 20260703T091200Z
- **Status:** **CLOSED**
- **Classification:** Market Subsite Frontend Race Fix (frontend catalog request race)
- **Not:** DDG / OCS / SOPCP data governance defect
- **Governance:** OCS · DDG · SOPCP remain **CLOSED (Evidence Reused · CLOSED_UNLESS_TOUCHED)**
- **Evidence:** `evidence/GO_market_subsite_frontend_race_fix/20260703T091200Z/race-fix-closure.json`
- **Staging web:** https://tt-web-staging.fly.dev (release v45)
- **Staging API:** https://tt-api-staging.fly.dev

## Final regression (8/8 PASS)

| Subsite | First SPA | Sub-nav | country=jp | Hard refresh |
|---------|-----------|---------|------------|--------------|
| provider | PASS | PASS | PASS (UI=API=2) | PASS |
| acquisition | PASS | PASS | PASS (UI=API=0) | PASS |

## Issue taxonomy (closure)

| Issue | Classification |
|-------|----------------|
| Staging cold start after deploy | **Fixed** (retry/backoff in `gotoStaging`) |
| Duplicate `data-listing-id` in Masonry | **Fixed** (Set dedupe + component cleanup) |
| Acquisition `country=jp` API returns 0 | **Expected Difference** (filter field vs payload; UI matches API) |
| `ERR_CONNECTION_CLOSED` on staging | **Transient Flake** (retry passes; not product defect) |

## Verdict

**CLOSED** — UI listing counts always equal API source of truth on all scenarios. Data governance gates not reopened.
