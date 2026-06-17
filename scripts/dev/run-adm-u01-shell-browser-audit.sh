#!/usr/bin/env bash
# ADM-U01 Shell Browser Audit（② staging · 暂停 Production GO）
#
#   bash scripts/dev/run-adm-u01-shell-browser-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID_RAW="${ADM_U01_SHELL_EVIDENCE_DIR:-$ROOT/evidence/adm-u01-shell-browser-audit/${STAMP}}"
EVID="$(cd "$ROOT" && mkdir -p "$EVID_RAW" && cd "$EVID_RAW" && pwd)"
export ADM_U01_SHELL_EVIDENCE_DIR="$EVID"

export REPO_ROOT="$ROOT"
export ADM_U01_PROBE_API_BASE="${ADM_U01_PROBE_API_BASE:-}"
USE_LOCAL_PROBE=0
if [[ -n "$ADM_U01_PROBE_API_BASE" && ( "$ADM_U01_PROBE_API_BASE" == *127.0.0.1* || "$ADM_U01_PROBE_API_BASE" == *localhost* ) ]]; then
  USE_LOCAL_PROBE=1
fi
if [[ "$USE_LOCAL_PROBE" != "1" ]]; then
  # shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
  source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
  cleanup_proxy() { staging_adm_u01_cleanup_proxy; }
  trap cleanup_proxy EXIT
fi

export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
export STAGING_API_BASE="${STAGING_API_BASE%/}"
export TRAVELTRUST_STAGING_API_BASE="$STAGING_API_BASE"
export ADM_U01_STRICT=1
export ADM_U01_PROBE_API_BASE="${ADM_U01_PROBE_API_BASE:-$STAGING_API_BASE}"
export ADM_U01_PROVISION_API_BASE="${ADM_U01_PROVISION_API_BASE:-$ADM_U01_PROBE_API_BASE}"
PROBE_API="${ADM_U01_PROBE_API_BASE%/}"
export ADM_U01_EVIDENCE_DIR="${ADM_U01_EVIDENCE_DIR:-$EVID/api-matrix}"
export ADM_U01_SHELL_EVIDENCE_DIR="$EVID"
if [[ -z "${ADM_U01_API_MATRIX_PATH:-}" ]]; then
  export ADM_U01_API_MATRIX_PATH="$(cd "$ROOT" && mkdir -p "$EVID" && cd "$EVID" && pwd)/matrix-api-results.json"
fi

FE_BASE="${ADM_U01_PLAYWRIGHT_FE_BASE:-http://127.0.0.1:3012}"
FE_BASE="${FE_BASE%/}"

echo "== ADM-U01 Shell Browser Audit · ${STAMP} =="
echo "api=${STAGING_API_BASE} fe=${FE_BASE}"
echo "NOTE: 本机 FE 须 API_REWRITE_TARGET 指向 staging（见下）"

if [[ "$USE_LOCAL_PROBE" == "1" ]]; then
  if [[ -f "$ROOT/.env" ]]; then
    local_dsn="$(grep -E '^DATABASE_URL=' "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '\r' | tr -d '"' | tr -d "'")"
    if [[ -n "$local_dsn" ]]; then
      export STAGING_DATABASE_URL="$local_dsn"
      echo "shell-audit: local probe → local DATABASE_URL for six-role provision"
    fi
  fi
elif ! staging_adm_u01_prepare_dsn; then
  echo "WARN: STAGING_DATABASE_URL unavailable" >&2
fi

# API 矩阵（对拍用）
mkdir -p "$(dirname "$ADM_U01_API_MATRIX_PATH")"
if [[ ! -f "$ADM_U01_API_MATRIX_PATH" ]]; then
  echo "--- provision API matrix ---"
  export ADM_U01_EVIDENCE_DIR="$(dirname "$ADM_U01_API_MATRIX_PATH")"
  bash "$ROOT/scripts/gates/smoke-admin-rbac-staging-matrix.sh" 2>&1 | tee "$EVID/api-matrix.log"
  cp -f "$ADM_U01_EVIDENCE_DIR/matrix-api-results.json" "$ADM_U01_API_MATRIX_PATH" 2>/dev/null || true
  tok_src="$ADM_U01_EVIDENCE_DIR/adm-u01-tokens.env"
  tok_dst="$EVID/adm-u01-tokens.env"
  if [[ -f "$tok_src" && "$tok_src" != "$tok_dst" ]]; then
    cp -f "$tok_src" "$tok_dst"
  fi
fi

if [[ -f "$EVID/adm-u01-tokens.env" ]]; then
  # shellcheck disable=SC1090
  source "$EVID/adm-u01-tokens.env"
elif [[ -f "$(dirname "$ADM_U01_API_MATRIX_PATH")/adm-u01-tokens.env" ]]; then
  # shellcheck disable=SC1090
  source "$(dirname "$ADM_U01_API_MATRIX_PATH")/adm-u01-tokens.env"
  tok_src="$(dirname "$ADM_U01_API_MATRIX_PATH")/adm-u01-tokens.env"
  tok_dst="$EVID/adm-u01-tokens.env"
  if [[ "$tok_src" != "$tok_dst" ]]; then
    cp -f "$tok_src" "$tok_dst"
  fi
fi

if [[ -z "${TRAVELTRUST_ADMIN_TOKEN_SUPER:-}" ]]; then
  echo "FAIL: six role tokens missing — run API matrix provision first" >&2
  exit 1
fi

# 本机 FE → API 代理探针（closure 本地跑时指向 ADM_U01_PROBE_API_BASE）
export API_REWRITE_TARGET="${API_REWRITE_TARGET:-$PROBE_API}"
fe_health="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${FE_BASE}/health" || echo 000)"
echo "fe_health=${fe_health} rewrite_target=${API_REWRITE_TARGET} probe_api=${PROBE_API}"

cap_probe="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 25 \
  -H "Authorization: Bearer ${TRAVELTRUST_ADMIN_TOKEN_SUPER}" \
  "${FE_BASE}/api/v1/admin/capabilities" || echo 000)"
echo "fe_capabilities_via_rewrite_http=${cap_probe}"

if [[ "$cap_probe" != "200" ]]; then
  echo "FAIL: FE ${FE_BASE} 未将 /api/v1 代理到 staging（capabilities HTTP ${cap_probe})" >&2
  echo "请在本机 FE 进程设置 API_REWRITE_TARGET=${API_REWRITE_TARGET} 后重启 npm run dev" >&2
  exit 1
fi

export ADM_U01_SHELL_BROWSER=1
export ADM_U01_PLAYWRIGHT_FE_BASE="$FE_BASE"
export PLAYWRIGHT_API_BASE_URL="$PROBE_API"
export PLAYWRIGHT_BASE_URL="$FE_BASE"
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_REUSE_FE_SERVER="${PLAYWRIGHT_REUSE_FE_SERVER:-1}"

set +e
echo "--- Playwright Shell Browser Audit ---"
(
  cd "$ROOT/frontend"
  export API_REWRITE_TARGET="${API_REWRITE_TARGET:-$PROBE_API}"
  npx playwright test e2e/admin-adm-u01-shell-browser-audit.spec.ts --project=chromium
) 2>&1 | tee "$EVID/playwright-shell-browser.log"
PW_RC=$?
set -e

FINDINGS="$EVID/adm-u01-shell-browser-findings.json"
if [[ ! -f "$FINDINGS" && -f "$ROOT/frontend/$EVID/adm-u01-shell-browser-findings.json" ]]; then
  cp -f "$ROOT/frontend/$EVID/adm-u01-shell-browser-findings.json" "$FINDINGS"
fi
if [[ ! -f "$FINDINGS" ]]; then
  echo "FAIL: findings missing at $FINDINGS" >&2
  exit 1
fi

PY="${PYTHON:-}"
if [[ -z "$PY" ]]; then
  command -v python >/dev/null 2>&1 && PY=python || PY=python3
fi

"$PY" "$ROOT/scripts/dev/generate-adm-u01-shell-browser-audit-report.py" \
  --findings "$FINDINGS" \
  --out "$ROOT/docs/runbook/ADM-U01-SHELL-BROWSER-AUDIT-REPORT.md"

# 同步 legacy shell matrix 文件名
cp -f "$FINDINGS" "$EVID/adm-u01-shell-browser-matrix.json" 2>/dev/null || true
"$PY" -c "
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
evid = Path(sys.argv[2])
d = json.loads(p.read_text(encoding='utf-8'))
legacy = {
    'artifact': 'adm-u01-playwright-shell',
    'phase': '②',
    'rows': d.get('shell_matrix', []),
    'summary': {
        'total': len(d.get('shell_matrix', [])),
        'pass': sum(1 for r in d.get('shell_matrix', []) if r.get('status') == 'PASS'),
        'fail': sum(1 for r in d.get('shell_matrix', []) if r.get('status') == 'FAIL'),
    },
    'playwright_fe_base': d.get('fe_base'),
    'generated_at': d.get('generated_at'),
}
(evid / 'playwright-shell-matrix.json').write_text(json.dumps(legacy, indent=2), encoding='utf-8')
" "$FINDINGS" "$EVID"

ln -sfn "$(basename "$EVID")" "$ROOT/evidence/adm-u01-shell-browser-audit/latest" 2>/dev/null || true

VERDICT="$("$PY" -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['verdict'])" "$FINDINGS")"
echo "ADM_U01_SHELL_BROWSER: $VERDICT"
echo "Report: docs/runbook/ADM-U01-SHELL-BROWSER-AUDIT-REPORT.md"
echo "Evidence: $EVID"

if [[ "$VERDICT" == "NO-GO" ]]; then
  exit 1
fi
if [[ "$PW_RC" -ne 0 ]]; then
  echo "FAIL: Playwright exit ${PW_RC} (findings verdict=${VERDICT})" >&2
  exit 1
fi
exit 0
