# Local verification slice — 2026-05-12

**Phase**: Local only (Docker Postgres + API + Next). Not staging or production.

## Chromium full matrix (first run)

- See repo log `evidence/GO_20260512/local-e2e-chromium-full-matrix.log` if present.
- Outcome: 4 failed + 1 flaky before fixes (f1-f4 funded label, auth-register URL wait, b468 gotoLoginWhenReady, smoke /orders/new, market-d8 tab).

## Fixes applied

- `frontend/e2e/helpers/gotoLoginWhenReady.ts`, `auth-register-login-market-chain.spec.ts`, `smoke.spec.ts`, `93-matrix-path-f1-f4.spec.ts`, `market-d8.spec.ts`.

## Re-run subset after fixes

- `node ./scripts/run-e2e-default.mjs --project=chromium` on the five spec files above: **exit 0**.

## Full 333 matrix

- Re-run locally: `bash scripts/gates/local-e2e-chromium-full-matrix.sh` and update this README when 0 failed.

## Full chromium matrix — re-run 2026-05-12 (post-fix)

- Command: `bash scripts/gates/local-e2e-chromium-full-matrix.sh` (with `DATABASE_URL` from root `.env`).
- Log: `evidence/GO_20260512/full-matrix-rerun.log`
- Result: **`OK: local-e2e-chromium-full-matrix`**, **`FULL_MATRIX_EXIT=0`**, **323 passed**, **10 skipped**, **~37.2m** (machine-dependent).
- **0 failed** in this run (prior 4 failures + 1 flaky addressed by E2E timeout / `toPass` hardening).
