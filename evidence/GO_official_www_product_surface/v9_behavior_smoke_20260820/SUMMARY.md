# V9 behavior smoke · 2026-08-20

**Track:** ① local behavior chain + ② Staging www×API  
**Web3 / FTB:** deferred (out of scope)  
**≠** Production GO · **≠** Reality Closure PASS

## Pin

| Plane | Value |
|-------|-------|
| Product pin | `3e356617a498b0faac42e4ae457343d36294a770` |
| Official www | `3e356617` @ `2026-08-20T00:51:57Z` |
| Staging www | `3e356617` @ `2026-08-20T10:50:46Z` |
| Official API | `8df2ab21…` · chain=`1` |
| Staging API | `1915ec4d…` · chain=`11155111` (ED · sha≠pin) |

## Gates

| Gate | Result |
|------|--------|
| `TT_OFFICIAL_V9_1TO1_MAP` | PASS |
| `TT_OFFICIAL_V9_PLANE_MAP` | PASS |

## ② Staging

| Check | Result | Notes |
|-------|--------|-------|
| Identity P2 smoke | PASS | Idempotency-Key on writes; UTF-8 node restore for C3 bio |
| Login matrix C1 C2 C3 C4 E2 | PASS | Skip E1 on Staging |
| `/traveltrust` | unlock present · faq absent | Matches V9 product surface |
| Page surfaces | `PAGE_SURFACE_DRIFT` | `landing_ambient_count_11_ne_10` = **ED CONFIRM_DESIGN** (not defect) |

## ① Local

| Check | Result | Notes |
|-------|--------|-------|
| API | listening `:8080` | Fresh DB `traveltrust_v9_beh` (existing `traveltrust` blocked by migration checksum drift on `20260708120000`) |
| Identity P2 smoke | PASS | |
| Login matrix C1–C4 · E2 | PASS | E1 `admin@test.com` → 401 (not in this seed set; Local-only optional) |

## Script fixes locked this wave

- `scripts/dev/smoke-identity-p2-settings-staging.sh`
  - Staging write path: `Idempotency-Key`
  - C3 bio restore via Node UTF-8 (Windows shell mangled Chinese → HTTP 400 `invalid unicode`)

## Honest boundary

① local PASS + ② Staging smoke PASS ≠ Official bake ≠ Production GO ≠ Web3 upgrade.
