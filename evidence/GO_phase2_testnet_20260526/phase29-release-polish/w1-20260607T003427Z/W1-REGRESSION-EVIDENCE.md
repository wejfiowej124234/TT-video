# Phase ②.9 · W1 Regression Evidence

**Batch:** RP-001 + RP-012  
**Stamp:** w1-20260607T003427Z  
**DEV_GATE:** OPEN  
**Phase ③:** HOLD

## Deliverables

| ID | Change | Files |
|----|--------|-------|
| RP-001 | `/market` filter search affordance (`type=search`, `role=search`, i18n label/placeholder) | `StickyFilterBar.tsx`, `marketingUi.ts`, `locales/*` |
| RP-012 | Auth login/register errors: `AuthL5FormError` + `aria-live=assertive` | `AuthL5FormError.tsx`, login + register forms |

## Regression

| Gate | Result | Evidence |
|------|--------|----------|
| L0 | **PASS** exit 0 | `l0-ci-local-delivery-minimum.log` (see terminal 83042) |
| MKT | **PASS** 133 tests | `mkt-web3-itinerary-l5-green.log` |
| AUTH | **PASS** 29 tests | `auth-w1-vitest.log` |
| HAT (local `/market`) | **PASS** | `local-hat-market-browser.log` |
| HAT (staging full) | **PASS** P0/P1=0 P2=1 | `hat-staging-full.log` · `evidence/phase28-human-acceptance/20260607T003521Z/` |

## Notes

- Staging HAT PASS retains P2=1 (merchant seed); **RP-001 searchbox** validated on **local** dev @ `:3012` with W1 code.
- Deploy staging (S5) required for staging to reflect RP-001 UI.
- No API/DB/RBAC/order/funds logic touched.
