#!/usr/bin/env bash
# ① ADM-U02 本地预备（非 Phase ② staging GO）
#
#   bash scripts/dev/run-admin-adm-u02-local-prep.sh
#   ADM_U02_LOCAL_PREP=1 bash scripts/dev/run-admin-adm-u02-local-prep.sh   # + Playwright
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

echo "=== 1/3 smoke-admin-adm-u02-local ==="
bash "$REPO_ROOT/scripts/dev/smoke-admin-adm-u02-local.sh"

if [[ "${ADM_U02_LOCAL_PREP:-0}" == "1" ]]; then
  echo "=== 2/3 ADM-U02 Playwright API (local) ==="
  export PLAYWRIGHT_API_BASE_URL="${PLAYWRIGHT_API_BASE_URL:-http://127.0.0.1:8080}"
  (cd "$REPO_ROOT/frontend" && npx playwright test e2e/admin-adm-u02-permissions-local.spec.ts --project=chromium)
else
  echo "=== skip Playwright API (set ADM_U02_LOCAL_PREP=1) ==="
fi

if [[ "${ADM_U02_UI_PREP:-0}" == "1" ]]; then
  echo "=== 3/3 ADM-U02 Playwright permissions UI (local) ==="
  export ADM_U02_PLAYWRIGHT_FE_BASE="${ADM_U02_PLAYWRIGHT_FE_BASE:-http://127.0.0.1:3012}"
  export PLAYWRIGHT_API_BASE_URL="${PLAYWRIGHT_API_BASE_URL:-http://127.0.0.1:8080}"
  (cd "$REPO_ROOT/frontend" && npx playwright test e2e/admin-adm-u02-permissions-ui-local.spec.ts --project=chromium)
else
  echo "=== skip Playwright UI (set ADM_U02_UI_PREP=1) ==="
fi

echo "TT_ADMIN_ADM_U02_LOCAL_PREP: OK"
