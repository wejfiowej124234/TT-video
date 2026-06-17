#!/usr/bin/env bash
# 五角色 · 注册→退出 全链路真人审计（API 探针 + 问题矩阵）
#
#   bash scripts/dev/run-five-role-full-chain-audit.sh
#
# 边界：② staging · ≠ Production GO · 产品/UI 冻结期仅登记缺陷
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${FRCA_OUT:-$ROOT/evidence/five-role-full-chain-audit/${STAMP}}"
API="${FRCA_API_BASE:-${STAGING_API_BASE:-https://tt-api-staging.fly.dev}}"
WEB="${FRCA_WEB_BASE:-${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}}"

mkdir -p "$OUT"
export FRCA_OUT="$OUT"
export FRCA_API_BASE="$API"
export FRCA_WEB_BASE="$WEB"
export FRCA_PASSWORD="${FRCA_PASSWORD:-Test123!}"

echo "== five-role full-chain audit · ${STAMP} =="
echo "api=${API} web=${WEB}"

python "$ROOT/scripts/dev/five-role-full-chain-audit.py" 2>&1 | tee "$OUT/probe.log"

FINDINGS="$OUT/frca-findings.json"
if [[ "${FRCA_SKIP_BROWSER:-}" != "1" ]]; then
  echo "frca: browser leg (logout UI) …"
  export FRCA_BROWSER=1
  export PLAYWRIGHT_BASE_URL="$WEB"
  export PLAYWRIGHT_API_BASE_URL="$API"
  export PLAYWRIGHT_REUSE_FE_SERVER=0
  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
  (cd "$ROOT/frontend" && npx playwright test e2e/five-role-logout-browser.spec.ts \
    --config=playwright.staging-uat.config.ts --project=chromium --reporter=list) \
    2>&1 | tee "$OUT/browser.log" || true
fi

python "$ROOT/scripts/dev/generate-five-role-audit-matrix-report.py" \
  --findings "$FINDINGS" \
  --browser-gaps "$OUT/frca-browser-gaps.json" \
  --out "$ROOT/docs/runbook/FIVE-ROLE-FULL-CHAIN-AUDIT-REPORT.md"

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/five-role-full-chain-audit/latest" 2>/dev/null || true

VERDICT="$(PYTHONIOENCODING=utf-8 python -c "
import json, sys
from pathlib import Path
findings = json.load(open(sys.argv[1], encoding='utf-8'))
verdict = findings.get('verdict', 'UNKNOWN')
gaps_path = Path(sys.argv[2])
if gaps_path.is_file():
    browser_p1 = sum(1 for g in json.loads(gaps_path.read_text(encoding='utf-8')).get('gaps', []) if g.get('priority') == 'P1')
    if browser_p1 and verdict == 'PASS':
        verdict = 'CONDITIONAL'
print(verdict)
" "$FINDINGS" "$OUT/frca-browser-gaps.json")"
echo "FRCA_FIVE_ROLE_FULL_CHAIN: $VERDICT"
echo "Report: docs/runbook/FIVE-ROLE-FULL-CHAIN-AUDIT-REPORT.md"
echo "Evidence: $OUT"
[[ "$VERDICT" == "NO-GO" ]] && exit 1 || exit 0
