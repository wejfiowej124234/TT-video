#!/usr/bin/env bash
# Admin Security Closure · 复跑 ADM-U01 API + Shell Browser + AMWA + 汇总报告
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
CLOSURE_EVID="$ROOT/evidence/admin-security-closure/${STAMP}"
mkdir -p "$CLOSURE_EVID"

export REPO_ROOT="$ROOT"
export ADM_U01_PROBE_API_BASE="${ADM_U01_PROBE_API_BASE:-http://127.0.0.1:8080}"
USE_LOCAL_PROBE=0
if [[ "$ADM_U01_PROBE_API_BASE" == *127.0.0.1* || "$ADM_U01_PROBE_API_BASE" == *localhost* ]]; then
  USE_LOCAL_PROBE=1
fi
if [[ "$USE_LOCAL_PROBE" != "1" ]]; then
  # shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
  source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
  trap staging_adm_u01_cleanup_proxy EXIT
fi

export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
export STAGING_API_BASE="${STAGING_API_BASE%/}"
export TRAVELTRUST_STAGING_API_BASE="$STAGING_API_BASE"
export ADM_U01_PROVISION_API_BASE="${ADM_U01_PROVISION_API_BASE:-$ADM_U01_PROBE_API_BASE}"
export API_REWRITE_TARGET="${API_REWRITE_TARGET:-$ADM_U01_PROBE_API_BASE}"
export TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT="${TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT:-1}"

echo "== Admin Security Closure Audit · ${STAMP} =="
echo "probe_api=${ADM_U01_PROBE_API_BASE} fe_rewrite=${API_REWRITE_TARGET}"

if [[ "$ADM_U01_PROBE_API_BASE" == *127.0.0.1* || "$ADM_U01_PROBE_API_BASE" == *localhost* ]]; then
  if [[ -f "$ROOT/.env" ]]; then
    local_dsn="$(grep -E '^DATABASE_URL=' "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '\r' | tr -d '"' | tr -d "'")"
    if [[ -n "$local_dsn" ]]; then
      export STAGING_DATABASE_URL="$local_dsn"
      unset STAGING_PG_PROXY_PID || true
      echo "closure: local probe → local DATABASE_URL for six-role provision"
    fi
  fi
else
  staging_adm_u01_prepare_dsn || true
fi

# 确保本地 API 可达
if ! curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${ADM_U01_PROBE_API_BASE}/health" | grep -q 200; then
  echo "WARN: local API ${ADM_U01_PROBE_API_BASE} not up — falling back to STAGING_API_BASE for probes"
  export ADM_U01_PROBE_API_BASE="$STAGING_API_BASE"
  export ADM_U01_PROVISION_API_BASE="$STAGING_API_BASE"
  export API_REWRITE_TARGET="$STAGING_API_BASE"
fi

set +e
echo "--- 1/3 ADM-U01 API Matrix ---"
export ADM_U01_STRICT=1
export ADM_U01_EVIDENCE_DIR="$CLOSURE_EVID/adm-u01-api"
bash "$ROOT/scripts/gates/smoke-admin-rbac-staging-matrix.sh" 2>&1 | tee "$CLOSURE_EVID/adm-u01-api.log"
API_RC=$?

echo "--- 2/3 Shell Browser Audit ---"
if [[ -f "$CLOSURE_EVID/adm-u01-api/adm-u01-tokens.env" ]]; then
  # shellcheck disable=SC1090
  source "$CLOSURE_EVID/adm-u01-api/adm-u01-tokens.env"
fi
export ADM_U01_SHELL_EVIDENCE_DIR="$CLOSURE_EVID/shell-browser"
mkdir -p "$CLOSURE_EVID/shell-browser"
api_matrix="$CLOSURE_EVID/adm-u01-api/matrix-api-results.json"
shell_matrix="$CLOSURE_EVID/shell-browser/matrix-api-results.json"
api_tokens="$CLOSURE_EVID/adm-u01-api/adm-u01-tokens.env"
shell_tokens="$CLOSURE_EVID/shell-browser/adm-u01-tokens.env"
[[ -f "$api_matrix" && "$api_matrix" != "$shell_matrix" ]] && cp -f "$api_matrix" "$shell_matrix"
[[ -f "$api_tokens" && "$api_tokens" != "$shell_tokens" ]] && cp -f "$api_tokens" "$shell_tokens"
export ADM_U01_API_MATRIX_PATH="$shell_matrix"
bash "$ROOT/scripts/dev/run-adm-u01-shell-browser-audit.sh" 2>&1 | tee "$CLOSURE_EVID/shell-browser.log"
SHELL_RC=$?

echo "--- 3/3 AMWA ---"
export AMWA_OUT="$CLOSURE_EVID/amwa"
export AMWA_API_BASE="${ADM_U01_PROBE_API_BASE}"
bash "$ROOT/scripts/dev/run-admin-mutating-actions-audit.sh" 2>&1 | tee "$CLOSURE_EVID/amwa.log"
AMWA_RC=$?
set -e

PY="${PYTHON:-python}"
"$PY" "$ROOT/scripts/dev/generate-admin-security-closure-report.py" \
  --out "$ROOT/docs/runbook/ADMIN-SECURITY-CLOSURE-REPORT.md" \
  --adm-u01-api "$CLOSURE_EVID/adm-u01-api/matrix-api-results.json" \
  --shell-browser "$CLOSURE_EVID/shell-browser/adm-u01-shell-browser-findings.json" \
  --amwa "$CLOSURE_EVID/amwa/amwa-findings.json"

ln -sfn "$(basename "$CLOSURE_EVID")" "$ROOT/evidence/admin-security-closure/latest" 2>/dev/null || true

REPORT_MD="$ROOT/docs/runbook/ADMIN-SECURITY-CLOSURE-REPORT.md"
VERDICT="$("$PY" -c "import re,sys; t=open(sys.argv[1],encoding='utf-8').read(); m=re.search(r'ADMIN_SECURITY_CLOSURE: (\w+)', t); print(m.group(1) if m else 'UNKNOWN')" "$REPORT_MD")"
echo "ADMIN_SECURITY_CLOSURE: $VERDICT"
echo "Report: docs/runbook/ADMIN-SECURITY-CLOSURE-REPORT.md"

[[ "$API_RC" -ne 0 || "$SHELL_RC" -ne 0 || "$AMWA_RC" -ne 0 ]] && exit 1
exit 0
