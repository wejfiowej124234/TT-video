# local-full-chromium-matrix-20260516 (phase 1 local)

Evidence folder for `bash scripts/gates/local-e2e-chromium-full-matrix.sh` console logs. Not 93/96-20 full matrix or staging/production.

Run from repo root:
  source scripts/dev/export-database-url-from-root-env.sh
  bash scripts/gates/local-e2e-chromium-full-matrix.sh 2>&1 | tee evidence/local-full-chromium-matrix-20260516/matrix-console.txt

Success: last line `OK: local-e2e-chromium-full-matrix` plus Playwright `N passed` summary.

Email E2E: `run-e2e-default.mjs` aligns `TRAVELTRUST_EMAIL_TRANSPORT=log` when resend is incomplete (see `frontend/scripts/e2e-align-env-from-root.mjs`).
