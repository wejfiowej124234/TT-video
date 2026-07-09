# Staging Business Resample Report

**Prepared UTC:** `2026-07-01T00:34:37Z`  
**Session:** `staging-business-resample-20260701T003201Z`  
**Scope:** https://tt-web-staging.fly.dev · API https://tt-api-staging.fly.dev  
**Accounts:** C1/C2/C3/C4/E2 only · password `Test123!`  
**Discipline:** 禁止混用本地 :3012 / Anvil / :8080 · 不重开 ① · 不重开 Configuration/PER · 不推翻 ② CLOSED

## Verdict

| Key | Value |
|-----|-------|
| **TT_STAGING_BUSINESS_RESAMPLE** | **PASS** |
| **API probes** | 37/37 PASS |
| **Browser corridors** | 6/6 PASS |
| **Business Defects filed** | **0** (open P0/P1 remain 0) |
| **Phase ③ Entry** | **READY** |

## Corridors sampled

| Corridor | API | UI (browser) |
|----------|-----|--------------|
| Booking Core / Orders | ✅ C1/C2/C3 orders+me | ✅ /orders 7 rows |
| Itinerary | ✅ catalog countries/cities | ✅ /itinerary/new |
| Market | ✅ acquisition+provider listings | ✅ 16 guides |
| Guide | ✅ guide-profile + guides list | ✅ market guide cards |
| Merchant | ✅ merchant-listings (C4/C1) | ⏭ API-only this round |
| DID/Rank | ✅ E2 me + publish-summary | ⏭ API-only |
| Governance read | ✅ proposals public+mine | ✅ /governance portal |

## Machine scripts (also green)

- `TT_PUBLISH_HUB_STAGING: OK`
- `smoke-identity-p2-settings-staging: ALL PASS`

## Honest boundary

- ② Testnet Sign-off + Graduation **CLOSED** unchanged
- This resample **≠** Production GO · **≠** full HAT re-run
- Governance pool UI may show empty DB snapshot — documented read surface, not a regression

## Next

See `evidence/manual-uat/signoff/PHASE3-MAINNET-PREPARATION-ENTRY-20260701T003201Z.md`
