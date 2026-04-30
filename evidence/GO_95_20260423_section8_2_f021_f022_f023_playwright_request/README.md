# §95 · §8.2 · F-021 / F-022 / F-023 — Playwright request E2E (2026-04-23)

## 1. Scope

| F | Checks |
|---|--------|
| F-021 | POST /api/v1/market/provider/listings -> listing_id; GET .../provider/listings -> items[].id contains id |
| F-022 | POST /api/v1/market/acquisition/listings (acquisition_carry_studio_v1) -> same for acquisition |
| F-023 | POST /api/v1/guides -> GET /api/v1/guides/:id (city) -> GET .../availability (guide_id, occupied_ranges); Bearer on GET :id and availability (auth_placeholder_layer on full app) |

## 2. Command

Requires DATABASE_URL (migrated), P3_CHAIN_OFF=1.

```bash
cd frontend
npm run e2e:api-mkt-guides-021-023-local
```

Result: 3 passed, exit 0.

## 3. Four-verify pointers

- Code: frontend/e2e/f021-f022-f023-request.spec.ts; scripts/run-e2e-api-mkt-guides-021-023-local.mjs; playwright project api-mkt-guides-021-023-chromium
- Routes: crates/api/src/routes/market_subsite.rs; routes/guides.rs + chain_off/guides.rs
- State: npm run above -> 3 passed
- Data: market_listings; guides; auth/register session Bearer

## 4. Boundaries

F-021/022: HTTP publish + public catalog GET only; UI/drafts/detail still ISS-007.

F-023: public GET /guides list and F-024 stake still ISS-007; ISS-009 for multi-replica schedule.

## 5. 95 ledger (v1.4.221)

Section 8.2 E2E + row complete for F-021 F-022 F-023; section 3.1 checked; ISS-002 21/33 done, 12/33 remaining.
