#!/usr/bin/env bash
# Admin Frontend Deep Audit（② staging · 暂停 Production GO）
#
#   bash scripts/dev/run-admin-frontend-deep-audit.sh
#
# 产出：功能矩阵 · 权限矩阵 · 问题矩阵 · 证据链
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${AFDA_OUT:-$ROOT/evidence/admin-frontend-deep-audit/${STAMP}}"
API="${AFDA_API_BASE:-${STAGING_API_BASE:-https://tt-api-staging.fly.dev}}"
WEB="${AFDA_WEB_BASE:-${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}}"

mkdir -p "$OUT"
export AFDA_OUT="$OUT"
export AFDA_API_BASE="$API"
export AFDA_WEB_BASE="$WEB"
export AFDA_ADMIN_EMAIL="${AFDA_ADMIN_EMAIL:-${STAGING_AUDIT_EMAIL:-tourist@test.com}}"
export AFDA_PASSWORD="${AFDA_PASSWORD:-${STAGING_AUDIT_PASSWORD:-Test123!}}"

echo "== Admin Frontend Deep Audit · ${STAMP} =="
echo "api=${API} web=${WEB} admin=${AFDA_ADMIN_EMAIL}"
echo "NOTE: Production GO 推进已暂停 · 本审计 ≠ ③ GO"

echo "afda: surface inventory …"
python "$ROOT/scripts/dev/inventory_admin_deep_audit.py" \
  --write "$OUT/inventory-surface.md" 2>&1 | tee "$OUT/inventory.log"

echo "afda: API + RBAC probe …"
set +e
python "$ROOT/scripts/dev/admin-frontend-deep-audit.py" 2>&1 | tee "$OUT/api-probe.log"
API_EXIT=$?
set -e

FINDINGS="$OUT/afda-findings.json"
BROWSER_MATRIX="$OUT/afda-browser-matrix.json"

if [[ "${AFDA_SKIP_BROWSER:-}" != "1" ]]; then
  echo "afda: browser leg (UI reachability) …"
  export AFDA_BROWSER=1
  export PLAYWRIGHT_BASE_URL="$WEB"
  export PLAYWRIGHT_API_BASE_URL="$API"
  export PLAYWRIGHT_REUSE_FE_SERVER=0
  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
  (cd "$ROOT/frontend" && npx playwright test e2e/admin-frontend-deep-audit-browser.spec.ts \
    --config=playwright.staging-uat.config.ts --project=chromium --reporter=list) \
    2>&1 | tee "$OUT/browser.log" || true
fi

if [[ "${AFDA_SKIP_RBAC_MATRIX:-}" != "1" ]] && [[ -f "$ROOT/scripts/gates/run-admin-rbac-staging-matrix.py" ]]; then
  echo "afda: optional ADM-U01 six-role matrix …"
  export STAGING_API_BASE="$API"
  export ADM_U01_EVIDENCE_DIR="$OUT/adm-u01-matrix"
  mkdir -p "$ADM_U01_EVIDENCE_DIR"
  python "$ROOT/scripts/gates/run-admin-rbac-staging-matrix.py" 2>&1 | tee "$OUT/rbac-matrix.log" || true
fi

python "$ROOT/scripts/dev/generate-admin-frontend-deep-audit-report.py" \
  --findings "$FINDINGS" \
  --browser-matrix "$BROWSER_MATRIX" \
  --inventory "$OUT/inventory-surface.md" \
  --out "$ROOT/docs/runbook/ADMIN-FRONTEND-DEEP-AUDIT-REPORT.md"

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/admin-frontend-deep-audit/latest" 2>/dev/null || true

VERDICT="$(PYTHONIOENCODING=utf-8 python -c "
import json, sys
from pathlib import Path
data = json.load(open(sys.argv[1], encoding='utf-8'))
v = data.get('verdict', 'UNKNOWN')
bp = Path(sys.argv[2])
if bp.is_file():
    for g in json.load(bp.open(encoding='utf-8')).get('gaps', []):
        if g.get('priority') == 'P0' and v != 'NO-GO':
            v = 'NO-GO'
        elif g.get('priority') == 'P1' and v == 'PASS':
            v = 'CONDITIONAL'
print(v)
" "$FINDINGS" "$BROWSER_MATRIX")"

echo "AFDA_ADMIN_FRONTEND_DEEP: $VERDICT"
echo "Report: docs/runbook/ADMIN-FRONTEND-DEEP-AUDIT-REPORT.md"
echo "Evidence: $OUT"

[[ "$VERDICT" == "NO-GO" ]] && exit 1
[[ "$API_EXIT" -ne 0 ]] && exit 1
exit 0
