#!/usr/bin/env bash
# ADM-U02 · Phase ② 证据：Staging API smoke + Playwright（须与 ADM-U01 同一 Staging）
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
# shellcheck source=scripts/dev/lib/adm-staging-host-guard.sh
source "$REPO_ROOT/scripts/dev/lib/adm-staging-host-guard.sh"
# shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
source "$REPO_ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
trap staging_adm_u01_cleanup_proxy EXIT

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_ID="${ADM_U02_RUN_ID:-run_${STAMP}}"
EVID="$REPO_ROOT/evidence/GO_staging_admin_adm_u02/${RUN_ID}"
mkdir -p "$EVID"

export ADM_U02_STRICT=1
export ADM_U02_STAGING=1
export ADM_U02_EVIDENCE_DIR="$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API_BASE="${STAGING_API_BASE:-${TRAVELTRUST_STAGING_API_BASE:-}}"
export STAGING_API_BASE="${STAGING_API_BASE%/}"
[[ -n "$STAGING_API_BASE" ]] || { echo "FAIL: STAGING_API_BASE required (Phase ②)" >&2; exit 1; }

adm_staging_require_strict_api || exit 1

if [[ "${ADM_U02_REQUIRE_PERSISTENT_HOST:-0}" == "1" ]]; then
  adm_staging_require_persistent_api_fe || exit 1
fi

export STAGING_DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"
[[ -n "${STAGING_DATABASE_URL:-}" ]] || {
  echo "FAIL: STAGING_DATABASE_URL required for ADM-U02 staging smoke (psql + 2FA reset)" >&2
  exit 1
}

if [[ "$STAGING_DATABASE_URL" == *flycast* ]]; then
  staging_adm_u01_prepare_dsn || {
    echo "FAIL: STAGING_DATABASE_URL flycast requires fly proxy" >&2
    exit 1
  }
fi
export DATABASE_URL="$STAGING_DATABASE_URL"

{
  echo "TT_ADM_U02_STAGING_EVIDENCE: START ${STAMP}"
  echo "STAGING_API_BASE=${STAGING_API_BASE}"
  echo "ADM_U02_RUN_ID=${RUN_ID}"
  echo "ADM_U02_REQUIRE_PERSISTENT_HOST=${ADM_U02_REQUIRE_PERSISTENT_HOST:-0}"

  echo "--- API smoke (approval + 2FA + audit) ---"
  bash "$REPO_ROOT/scripts/dev/smoke-admin-adm-u02-staging.sh" 2>&1 | tee "$EVID/smoke-run.log"
  rg -q 'TT_ADM_U02_STAGING: PASS' "$EVID/smoke-run.log" || {
    echo "FAIL: smoke did not emit TT_ADM_U02_STAGING: PASS"
    exit 1
  }

  echo "--- Playwright API matrix (same staging base) ---"
  export PLAYWRIGHT_API_BASE_URL="$STAGING_API_BASE"
  export DATABASE_URL="$STAGING_DATABASE_URL"
  export ADM_U02_STAGING=1
  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD="${PLAYWRIGHT_RELAX_META_CHAIN_GUARD:-1}"
  export PLAYWRIGHT_GOTO_TIMEOUT_MS="${PLAYWRIGHT_GOTO_TIMEOUT_MS:-120000}"
  set -o pipefail
  (cd "$REPO_ROOT/frontend" && npx playwright test e2e/admin-adm-u02-permissions-local.spec.ts --config=playwright.staging-uat.config.ts --project=chromium) \
    2>&1 | tee "$EVID/playwright-run.log"
  pw_rc="${PIPESTATUS[0]}"
  echo "playwright_exit=${pw_rc}" > "$EVID/playwright-exit.txt"
  [[ "$pw_rc" -eq 0 ]] || { echo "FAIL: Playwright ADM-U02 staging exit ${pw_rc}"; exit 1; }

  echo "--- merge report ---"
  PY="${PYTHON:-}"
  if [[ -z "$PY" ]]; then
    command -v python >/dev/null 2>&1 && PY=python || PY=python3
  fi
  "$PY" "$REPO_ROOT/scripts/gates/merge-adm-u02-staging-report.py" "$EVID"

  rg="$(grep -o '"release_gate": "[^"]*"' "$EVID/report.json" | head -1 | sed 's/.*": "\([^"]*\)".*/\1/')"
  echo "release_gate=${rg}"
  [[ "$rg" == "GO" ]] || { echo "FAIL: release_gate not GO"; exit 1; }

  echo "status: PASS" > "$EVID/STATUS.txt"
  echo "phase: ②" >> "$EVID/STATUS.txt"
  echo "artifact: ADM-U02" >> "$EVID/STATUS.txt"
  echo "at: ${STAMP}" >> "$EVID/STATUS.txt"
  echo "TT_ADM_U02_STAGING_EVIDENCE: PASS ${STAMP}"
  echo "TT_ADM_U02_EVIDENCE: PASS ${STAMP}"

  latest_root="$REPO_ROOT/evidence/GO_staging_admin_adm_u02"
  mkdir -p "$latest_root"
  if ! ln -sfn "$RUN_ID" "$latest_root/latest" 2>/dev/null; then
    printf '%s\n' "$RUN_ID" > "$latest_root/latest-run-id.txt"
  fi
} 2>&1 | tee "$RUN_LOG"

if ! ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log" 2>/dev/null; then
  cp -f "$RUN_LOG" "$EVID/latest-run.log" 2>/dev/null || true
fi
