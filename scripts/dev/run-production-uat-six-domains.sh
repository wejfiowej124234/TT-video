#!/usr/bin/env bash
# Production six-domain UAT（PI3-004 · Owner · no seed on prod）
#
#   PROD_WEB_BASE=https://app.<domain> PROD_API_BASE=https://api.<domain> \
#     bash scripts/dev/run-production-uat-six-domains.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB="${PROD_WEB_BASE:-}"
API="${PROD_API_BASE:-}"
OUT="${PROD_UAT_OUT:-$ROOT/evidence/pi3_004_production_readiness_verification/prod-uat-six-domains-$(date -u +%Y%m%dT%H%M%SZ)}"
BASELINE="$ROOT/evidence/pi3_004_production_readiness_verification/baseline_record.v1.json"

[[ -n "$WEB" && -n "$API" && "$WEB" != *example.com* ]] || {
  echo "run-production-uat-six-domains: set PROD_WEB_BASE and PROD_API_BASE" >&2
  exit 2
}

export PLAYWRIGHT_BASE_URL="${WEB%/}"
export PLAYWRIGHT_API_BASE_URL="${API%/}"
export PLAYWRIGHT_REUSE_FE_SERVER=0
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_EXPECT_CHAIN_ID=11155111
export STAGING_UAT_SIX_DOMAINS=1
export STAGING_UAT_OUT="$OUT"
export PROD_UAT_EMAIL="${PROD_UAT_EMAIL:-}"
export PROD_UAT_PASSWORD="${PROD_UAT_PASSWORD:-}"

mkdir -p "$OUT"

echo "== production six-domain UAT · scope=Sepolia =="
bash "$ROOT/scripts/dev/check-production-web-alignment.sh" 2>&1 | tee "$OUT/alignment.log" || true

if [[ -z "$PROD_UAT_EMAIL" || -z "$PROD_UAT_PASSWORD" ]]; then
  echo "WARN: PROD_UAT_EMAIL/PASSWORD unset — Playwright may skip auth-gated routes"
else
  LOGIN_JSON="$(curl -sS -X POST "${API%/}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${PROD_UAT_EMAIL}\",\"password\":\"${PROD_UAT_PASSWORD}\"}" 2>/dev/null || echo '{}')"
  export STAGING_UAT_BEARER_TOKEN="$(echo "$LOGIN_JSON" | python -c "import sys,json; print((json.load(sys.stdin).get('token') or '').strip())" 2>/dev/null || true)"
  export STAGING_UAT_USER_ID="$(echo "$LOGIN_JSON" | python -c "import sys,json; print((json.load(sys.stdin).get('user_id') or '').strip())" 2>/dev/null || true)"
  export STAGING_UAT_EMAIL="$PROD_UAT_EMAIL"
  export STAGING_UAT_PASSWORD="$PROD_UAT_PASSWORD"
fi

cd "$ROOT/frontend"
npx playwright test e2e/staging-uat-six-domains.spec.ts \
  --config=playwright.staging-uat.config.ts \
  --project=chromium \
  --reporter=list 2>&1 | tee "$OUT/playwright.log"

UAT_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
python - "$BASELINE" "$UAT_UTC" "$OUT/uat-findings.json" <<'PY'
import json, sys
from pathlib import Path
baseline, uat_utc, findings = sys.argv[1:4]
p = Path(baseline)
data = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
data["six_domain_uat_prod_utc"] = uat_utc
if Path(findings).is_file():
    data["six_domain_findings"] = findings.replace("\\", "/")
p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY

echo "READY" >"$OUT/STATUS.txt"
echo "TT_PRODUCTION_UAT_SIX_DOMAINS: OK"
echo "Evidence: ${OUT}"
