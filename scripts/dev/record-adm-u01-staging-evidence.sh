#!/usr/bin/env bash
# ADM-U01 · Phase ② 证据归档：API 矩阵 + Playwright Shell 机读（须独立 Staging）
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
# shellcheck source=scripts/dev/lib/adm-staging-host-guard.sh
source "$REPO_ROOT/scripts/dev/lib/adm-staging-host-guard.sh"
# shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
source "$REPO_ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
trap staging_adm_u01_cleanup_proxy EXIT

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_ID="${ADM_U01_RUN_ID:-run_${STAMP}}"
EVID="$REPO_ROOT/evidence/GO_staging_admin_rbac_matrix/${RUN_ID}"
mkdir -p "$EVID"

export ADM_U01_STRICT=1
export ADM_U01_EVIDENCE_DIR="$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API_BASE="${STAGING_API_BASE:-${TRAVELTRUST_STAGING_API_BASE:-}}"
export STAGING_API_BASE="${STAGING_API_BASE%/}"

if [[ -z "$STAGING_API_BASE" ]]; then
  echo "FAIL: STAGING_API_BASE required for ADM-U01 (Phase ②)" >&2
  exit 1
fi

if [[ -z "${STAGING_FE_BASE:-}" ]]; then
  echo "FAIL: STAGING_FE_BASE required for ADM-U01 close (Playwright Shell matrix)" >&2
  exit 1
fi
export STAGING_FE_BASE="${STAGING_FE_BASE%/}"

export ADM_U01_PROBE_DELAY="${ADM_U01_PROBE_DELAY:-0.2}"
export ADM_U01_429_SLEEP="${ADM_U01_429_SLEEP:-1.5}"
export STAGING_DATABASE_URL="${STAGING_DATABASE_URL:-postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"

if [[ "$STAGING_DATABASE_URL" == *flycast* ]]; then
  staging_adm_u01_prepare_dsn || {
    echo "FAIL: STAGING_DATABASE_URL flycast requires fly proxy (see /tmp/tt-staging-pg-proxy-deep-gate.log)" >&2
    exit 1
  }
fi

if [[ "${ADM_U01_REQUIRE_PERSISTENT_HOST:-0}" == "1" ]]; then
  adm_staging_require_persistent_api_fe || exit 1
  export ADM_U01_PROVISION_API_BASE="$STAGING_API_BASE"
  export ADM_U01_PROBE_API_BASE="$STAGING_API_BASE"
  export ADM_U01_NO_LOCAL_FE_FALLBACK=1
  export ADM_U01_DEPLOYMENT_KIND="${ADM_U01_DEPLOYMENT_KIND:-persistent_staging}"
else
  # 同机部署：矩阵/注册走本机 API，staging URL 仅 /health + FE 入口（加速；证据注明 deployment_kind）
  export ADM_U01_PROVISION_API_BASE="${ADM_U01_PROVISION_API_BASE:-http://127.0.0.1:8080}"
  export ADM_U01_PROBE_API_BASE="${ADM_U01_PROBE_API_BASE:-http://127.0.0.1:8080}"
fi

{
  echo "TT_ADM_U01_EVIDENCE: START ${STAMP}"
  echo "STAGING_API_BASE=${STAGING_API_BASE}"
  echo "STAGING_FE_BASE=${STAGING_FE_BASE}"
  echo "ADM_U01_RUN_ID=${RUN_ID}"
  echo "ADM_U01_PROVISION_API_BASE=${ADM_U01_PROVISION_API_BASE}"
  echo "ADM_U01_PROBE_API_BASE=${ADM_U01_PROBE_API_BASE}"

  echo "--- API matrix (six roles deny/pass) ---"
  bash "$REPO_ROOT/scripts/gates/smoke-admin-rbac-staging-matrix.sh"

  echo "--- Playwright shell matrix (STAGING_FE_BASE required) ---"
  fe_probe_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 25 \
    -H "Bypass-Tunnel-Reminder: true" "${STAGING_FE_BASE}/admin" || echo 000)"
  echo "staging_fe_admin_probe_http=${fe_probe_code}"
  fe_probe_mode="staging_https"
  if [[ "$fe_probe_code" != "200" && "$fe_probe_code" != "307" && "$fe_probe_code" != "308" ]]; then
    if [[ "${ADM_U01_NO_LOCAL_FE_FALLBACK:-0}" == "1" ]]; then
      echo "FAIL: STAGING_FE_BASE /admin unreachable (${fe_probe_code}); persistent close forbids local FE fallback" >&2
      exit 1
    fi
    local_fe_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 \
      "${ADM_U01_PLAYWRIGHT_FE_BASE:-http://127.0.0.1:3012}/admin" || echo 000)"
    echo "local_fe_admin_probe_http=${local_fe_code}"
    [[ "$local_fe_code" == "200" || "$local_fe_code" == "307" || "$local_fe_code" == "308" ]] || {
      echo "FAIL: STAGING_FE_BASE and local FE /admin unreachable (${fe_probe_code}/${local_fe_code})" >&2
      exit 1
    }
    fe_probe_mode="local_fallback_tunnel_unstable"
    echo "WARN: STAGING_FE_BASE tunnel unstable; Playwright uses local FE (same build)"
  fi
  echo "fe_probe_mode=${fe_probe_mode}" > "$EVID/fe-probe-mode.txt"
  export ADM_U01_STAGING=1
  if [[ "${ADM_U01_NO_LOCAL_FE_FALLBACK:-0}" == "1" && -n "${STAGING_FE_BASE:-}" ]]; then
    export ADM_U01_PLAYWRIGHT_FE_BASE="${STAGING_FE_BASE}"
    export PLAYWRIGHT_BASE_URL="${STAGING_FE_BASE}"
  else
    export ADM_U01_PLAYWRIGHT_FE_BASE="${ADM_U01_PLAYWRIGHT_FE_BASE:-http://127.0.0.1:3012}"
  fi
  export PLAYWRIGHT_API_BASE_URL="${ADM_U01_PROBE_API_BASE}"
  export ADM_U01_EVIDENCE_DIR="$EVID"
  export PLAYWRIGHT_GOTO_TIMEOUT_MS="${PLAYWRIGHT_GOTO_TIMEOUT_MS:-120000}"
  export PLAYWRIGHT_GOTO_RETRY_ATTEMPTS="${PLAYWRIGHT_GOTO_RETRY_ATTEMPTS:-6}"
  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD="${PLAYWRIGHT_RELAX_META_CHAIN_GUARD:-1}"
  export PLAYWRIGHT_REUSE_FE_SERVER=0
  PW_CFG="playwright.config.ts"
  if [[ "${ADM_U01_NO_LOCAL_FE_FALLBACK:-0}" == "1" ]]; then
    PW_CFG="playwright.staging-uat.config.ts"
  fi
  if [[ -n "${STAGING_FE_BASE:-}" ]]; then
    if [[ -f "$EVID/adm-u01-tokens.env" ]]; then
      # shellcheck disable=SC1090
      source "$EVID/adm-u01-tokens.env"
    fi
    (cd "$REPO_ROOT/frontend" && npx playwright test e2e/admin-rbac-staging-six-roles.spec.ts --config="$PW_CFG" --project=chromium) \
      2>&1 | tee "$EVID/playwright-run.log"
    test -f "$EVID/playwright-shell-matrix.json" || { echo "FAIL: playwright-shell-matrix.json missing"; exit 1; }
  fi

  echo "--- merge report ---"
  PY="${PYTHON:-}"
  if [[ -z "$PY" ]]; then
    command -v python >/dev/null 2>&1 && PY=python || PY=python3
  fi
  "$PY" "$REPO_ROOT/scripts/gates/merge-adm-u01-staging-report.py" "$EVID"

  echo "--- validate release_gate ---"
  rg="$(grep -o '"release_gate": "[^"]*"' "$EVID/report.json" | head -1 | sed 's/.*": "\([^"]*\)".*/\1/')"
  echo "release_gate=${rg}"
  [[ "$rg" == "GO" ]] || { echo "FAIL: release_gate not GO"; exit 1; }

  echo "status: PASS" > "$EVID/STATUS.txt"
  echo "phase: ②" >> "$EVID/STATUS.txt"
  echo "artifact: ADM-U01" >> "$EVID/STATUS.txt"
  echo "at: ${STAMP}" >> "$EVID/STATUS.txt"
  echo "TT_ADM_U01_EVIDENCE: PASS ${STAMP}"

  latest_root="$REPO_ROOT/evidence/GO_staging_admin_rbac_matrix"
  mkdir -p "$latest_root"
  if ! ln -sfn "$RUN_ID" "$latest_root/latest" 2>/dev/null; then
    printf '%s\n' "$RUN_ID" > "$latest_root/latest-run-id.txt"
  fi
} 2>&1 | tee "$RUN_LOG"

if ! ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log" 2>/dev/null; then
  cp -f "$RUN_LOG" "$EVID/latest-run.log" 2>/dev/null || true
fi
