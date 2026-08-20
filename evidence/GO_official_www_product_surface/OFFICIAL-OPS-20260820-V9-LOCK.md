# Official OPS-2026.08.20-v9 · Lock evidence

**STATUS:** `TODAYS_OFFICIAL_STABLE_LOCKED`  
**Owner lock:** `2026-08-20 15:20` Asia/Tokyo  
**Baseline:** `TT-OFFICIAL-OPS-20260820-V9`  
**Human:** [`docs/runbook/TT-OFFICIAL-PRODUCT-BASELINE-OPS-20260820-V9-LATEST.md`](../../docs/runbook/TT-OFFICIAL-PRODUCT-BASELINE-OPS-20260820-V9-LATEST.md)  
**Machine:** [`docs/runbook/TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json`](../../docs/runbook/TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json)

## Live observe (freeze moment)

| Probe | Result |
|-------|--------|
| `GET /api/release-identity` | `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` |
| Fly image | `tt-web-prod:hybrid-live-auth-pin-nontarget-v9-20260820` |
| Digest | `sha256:b80bccb5f5c8c0e2b6e854c49f83fbbeb2ecefad70290339a8db6105eb608b16` |
| Machines | `683d613c295458` · `d8d0d71ce67718` · version `396` · started |
| Public bootstrap | `/tt-session-cookie-bootstrap.js` head = **v8** · `SKIP_ME_FETCH=0` |
| API `/meta/build` | `8df2ab21…` untouched |

## Why v9 (not misnamed v8)

Misnamed tag `hybrid-live-auth-pin-nontarget-v8-20260820` still shipped bootstrap **v7** → Header stayed guest after login.  
Durable login-good image = **v9** (bootstrap **v8** baked).

## Honest boundary

This freeze ≠ **Production GO** (`TT_PRODUCTION_GO: NO_GO`).
