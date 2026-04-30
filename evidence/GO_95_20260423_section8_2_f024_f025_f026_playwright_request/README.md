# GO_95 · §8.2 · F-024 / F-025 / F-026 · Playwright `request` E2E

**Version tie:** 95 **v1.4.222**  
**Date:** 2026-04-23

## 1. Scope

| F | Playwright test (serial) | HTTP surface |
|---|---------------------------|--------------|
| **F-024** | `f024-f025-f026-request.spec.ts` · first test | `POST /api/v1/guides` → `POST …/guides/:id/stake` → `GET /api/v1/guides?city=Shanghai` |
| **F-025** | same file · second test | order `accept` → `mock-pay` → `POST …/orders/:id/dispute` → `GET /api/v1/disputes` → `GET …/disputes/:id` |
| **F-026** | same file · third test | escrowed order → `POST|GET /api/v1/orders/:id/messages` |

## 2. Preconditions

- **`DATABASE_URL`** → migrated Postgres (local `docker compose` or equivalent).
- **`P3_CHAIN_OFF=1`** (script sets this).
- **`mock-pay`** must not be **501** (same gate as other chain-off B-domain E2Es).

## 3. Command (reproducer)

From repo root:

```bash
cd frontend
export DATABASE_URL="${DATABASE_URL:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"
npm run e2e:api-b-gde-dsp-msg-024-026-local
```

**Expected:** `3 passed` (project **`api-b-gde-dsp-msg-024-026-chromium`**).

## 4. Honest boundaries

- **F-024:** E2E proves **chain-off** stake + **city-filtered** list contains the guide; **on-chain** `GuideIdentityStakingPool` tx and **`/staking` UI** remain **ISS-007** / **MANUAL-P1 B-GDE-003** narrative.
- **F-025:** E2E proves **open dispute** + **Postgres-backed** list/detail; **resolve / admin / bilateral close** not claimed here.
- **F-026:** E2E proves **POST + GET** message round-trip on an **escrowed** order; does not close **ISS-007** CI matrix / **`report.json`**.

## 5. Last run (Cursor agent)

- **Command:** `npm run e2e:api-b-gde-dsp-msg-024-026-local`
- **Result:** **exit 0** · **`3 passed`** (~4s worker time; API built via script).
