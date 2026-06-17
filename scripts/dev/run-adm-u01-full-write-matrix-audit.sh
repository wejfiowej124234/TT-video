#!/usr/bin/env bash
# ADM-U01 Full Role Write Matrix Audit（② staging · 暂停 Production GO）
#
#   bash scripts/dev/run-adm-u01-full-write-matrix-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_ID="${ADM_U01_RUN_ID:-adm_u01_write_${STAMP}}"
EVID="${ADM_U01_EVIDENCE_DIR:-$ROOT/evidence/adm-u01-full-write-matrix-audit/${RUN_ID}}"
mkdir -p "$EVID"

export REPO_ROOT="$ROOT"
# shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"

cleanup_proxy() { staging_adm_u01_cleanup_proxy; }
trap cleanup_proxy EXIT

export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
export STAGING_FE_BASE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
export STAGING_API_BASE="${STAGING_API_BASE%/}"
export STAGING_FE_BASE="${STAGING_FE_BASE%/}"
export TRAVELTRUST_STAGING_API_BASE="$STAGING_API_BASE"
export ADM_U01_STRICT=1
export ADM_U01_EVIDENCE_DIR="$EVID"
export ADM_U01_REQUIRE_PERSISTENT_HOST="${ADM_U01_REQUIRE_PERSISTENT_HOST:-1}"
export ADM_U01_PROVISION_API_BASE="${ADM_U01_PROVISION_API_BASE:-$STAGING_API_BASE}"
export ADM_U01_PROBE_API_BASE="${ADM_U01_PROBE_API_BASE:-$STAGING_API_BASE}"
export ADM_U01_PROBE_DELAY="${ADM_U01_PROBE_DELAY:-0.15}"
export ADM_U01_DEPLOYMENT_KIND="${ADM_U01_DEPLOYMENT_KIND:-fly_staging_persistent}"

echo "== ADM-U01 Full Role Write Matrix Audit · ${STAMP} =="
echo "api=${STAGING_API_BASE} fe=${STAGING_FE_BASE}"
echo "NOTE: 暂停探针硬化 · 暂停 Production GO"

if ! staging_adm_u01_prepare_dsn; then
  echo "WARN: STAGING_DATABASE_URL unavailable — need fly proxy or pre-set six tokens" >&2
fi

set +e
echo "--- API matrix (six roles) ---"
bash "$ROOT/scripts/gates/smoke-admin-rbac-staging-matrix.sh" 2>&1 | tee "$EVID/api-matrix.log"
API_RC=$?
set -e

if [[ -f "$EVID/adm-u01-tokens.env" ]]; then
  # shellcheck disable=SC1090
  source "$EVID/adm-u01-tokens.env"
fi

PW_RC=0
if [[ "${ADM_U01_SKIP_PLAYWRIGHT:-}" != "1" ]]; then
  fe_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "${STAGING_FE_BASE}/admin" || echo 000)"
  echo "staging_fe_admin_http=${fe_code}"
  if [[ "$fe_code" == "200" || "$fe_code" == "307" || "$fe_code" == "308" ]]; then
    echo "--- Playwright shell visibility ---"
    export ADM_U01_STAGING=1
    export PLAYWRIGHT_API_BASE_URL="${ADM_U01_PROBE_API_BASE}"
    export ADM_U01_PLAYWRIGHT_FE_BASE="${ADM_U01_PLAYWRIGHT_FE_BASE:-$STAGING_FE_BASE}"
    # staging API 无链上 registry 地址 · 跳过 setup-meta-chain 严格门禁
    export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
    set +e
    export ADM_U01_PLAYWRIGHT_FE_BASE="${ADM_U01_PLAYWRIGHT_FE_BASE:-$STAGING_FE_BASE}"
    (cd "$ROOT/frontend" && npx playwright test e2e/admin-rbac-staging-six-roles.spec.ts --project=chromium) \
      2>&1 | tee "$EVID/playwright-run.log"
    PW_RC=$?
    if [[ "$PW_RC" -ne 0 ]] && [[ -z "${ADM_U01_NO_LOCAL_FE_FALLBACK:-}" ]]; then
      local_fe="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 \
        "${ADM_U01_PLAYWRIGHT_FE_BASE_LOCAL:-http://127.0.0.1:3012}/admin" || echo 000)"
      if [[ "$local_fe" == "200" || "$local_fe" == "307" || "$local_fe" == "308" ]]; then
        echo "WARN: staging FE shell failed; retry local FE ${ADM_U01_PLAYWRIGHT_FE_BASE_LOCAL:-http://127.0.0.1:3012}" | tee -a "$EVID/playwright-run.log"
        export ADM_U01_PLAYWRIGHT_FE_BASE="${ADM_U01_PLAYWRIGHT_FE_BASE_LOCAL:-http://127.0.0.1:3012}"
        (cd "$ROOT/frontend" && npx playwright test e2e/admin-rbac-staging-six-roles.spec.ts --project=chromium) \
          2>&1 | tee "$EVID/playwright-run-local-fe.log" || PW_RC=$?
      fi
    fi
    set -e
  else
    echo "SKIP Playwright: STAGING_FE_BASE /admin unreachable (${fe_code})" | tee "$EVID/playwright-skipped.txt"
    echo '{"skipped":true,"reason":"fe_unreachable"}' > "$EVID/playwright-shell-matrix.json"
  fi
else
  echo '{"skipped":true,"reason":"ADM_U01_SKIP_PLAYWRIGHT"}' > "$EVID/playwright-shell-matrix.json"
fi

PY="${PYTHON:-}"
if [[ -z "$PY" ]]; then
  command -v python >/dev/null 2>&1 && PY=python || PY=python3
fi

"$PY" "$ROOT/scripts/dev/generate-adm-u01-full-write-matrix-report.py" \
  --evidence "$EVID" \
  --out "$ROOT/docs/runbook/ADM-U01-FULL-ROLE-WRITE-MATRIX-AUDIT-REPORT.md"

ln -sfn "$(basename "$EVID")" "$ROOT/evidence/adm-u01-full-write-matrix-audit/latest" 2>/dev/null || true

VERDICT="$("$PY" -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['verdict'])" "$EVID/adm-u01-full-write-findings.json")"
echo "ADM_U01_FULL_ROLE_WRITE_MATRIX: $VERDICT"
echo "Report: docs/runbook/ADM-U01-FULL-ROLE-WRITE-MATRIX-AUDIT-REPORT.md"
echo "Evidence: $EVID"

[[ "$VERDICT" == "NO-GO" ]] && exit 1
[[ "$API_RC" -ne 0 ]] && exit 1
exit 0
