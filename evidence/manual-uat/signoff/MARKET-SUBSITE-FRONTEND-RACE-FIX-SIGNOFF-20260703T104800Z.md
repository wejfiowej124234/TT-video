# Market Subsite Frontend Race Fix Sign-off

- **Stamp:** 20260703T104800Z
- **Status:** **CLOSED**
- **Classification:** Frontend Runtime — subsite catalog state recovery + request race (NOT OCS/DDG/SOPCP)
- **Governance:** OCS · DDG · SOPCP **CLOSED (Evidence Reused · CLOSED_UNLESS_TOUCHED)**
- **Git:** `bb1fb639` — v47 effectiveCountry SSOT + browser truth attrs
- **Staging web:** https://tt-web-staging.fly.dev · **v48** · `deployment-01KWKTAYPE5Q61Q4X80S6Y3R9F`
- **Evidence:** `evidence/GO_market_subsite_frontend_race_fix/20260703T104800Z/race-fix-closure.json`

## Browser truth (mandatory)

Every Playwright scenario asserts on `<main>`:

- `data-tt-subsite-country` — effective country (`all` | `JP`)
- `data-tt-subsite-list-count` — masonry count = API count

## Dual-environment regression (12/12 each)

| Surface | all | jp |
|---------|-----|-----|
| provider Phase①/② | UI=API=10 | UI=API=2 |
| acquisition Phase①/② | UI=API=10 | UI=API=0 |

Source-truth audit: **PASS · blocking_count=0**

## Verdict

**CLOSED** — Frontend runtime parity proven; data governance gates not reopened.
