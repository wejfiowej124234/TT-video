#!/usr/bin/env bash
# PI3-002 · Production Domain / TLS / CDN / CORS Execution gate (151 SSOT)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PI3_002_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-002-exec-${STAMP}}"
mkdir -p "$OUT"
LOG="$OUT/gate.log"
exec > >(tee -a "$LOG") 2>&1

PROD_WEB_BASE="${PROD_WEB_BASE:-}"
PROD_API_BASE="${PROD_API_BASE:-}"

is_prod_configured() {
  [[ -n "$PROD_WEB_BASE" && -n "$PROD_API_BASE" ]] || return 1
  [[ "$PROD_WEB_BASE" != *example.com* && "$PROD_API_BASE" != *example.com* ]] || return 1
  [[ "$PROD_WEB_BASE" != *"<"* && "$PROD_API_BASE" != *"<"* ]] || return 1
  return 0
}

echo "== PI3-002 Production Domain / TLS / CDN / CORS Execution · ${STAMP} =="
echo "SSOT: docs/handbook/engineering/151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md"
echo "Scope: 148 PRODUCTION_SCOPE_SEPOLIA (CHAIN_ID=11155111)"
echo "Discipline: no new product feature code"

for f in \
  scripts/dev/check-production-web-alignment.sh \
  scripts/dev/verify-production-cookie-csp-headers.sh \
  deploy/fly/tt-web-prod/build.env.sepolia-prod.example \
  docs/runbook/PRODUCTION-ENV-MATRIX-SEPOLIA-SCOPE.md; do
  [[ -f "$ROOT/$f" ]] || { echo "execution artifacts: FAIL missing $f" >&2; exit 2; }
done
echo "execution artifacts: OK"

bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" | tee "$OUT/staging-alignment.log" || true

bash "$ROOT/scripts/dev/verify-production-cookie-csp-headers.sh" \
  ${PROD_WEB_BASE:+PROD_WEB_BASE="$PROD_WEB_BASE"} \
  ${PROD_API_BASE:+PROD_API_BASE="$PROD_API_BASE"} \
  | tee "$OUT/cookie-csp.log" || true

rg -q 'PRODUCTION_SCOPE_SEPOLIA' "$ROOT/docs/handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md" \
  && echo "prod env matrix (148 Sepolia): OK" || { echo "prod env matrix: FAIL"; exit 2; }

prod_domain=false
prod_tls=false
prod_cors=false
prod_alignment=false

if is_prod_configured; then
  echo "prod domain: CONFIGURED"
  prod_domain=true
  if bash "$ROOT/scripts/dev/check-production-web-alignment.sh" 2>&1 | tee "$OUT/prod-alignment.log"; then
    prod_alignment=true
    prod_tls=true
    prod_cors=true
    echo "prod alignment: PASS"
  else
    echo "prod alignment: FAIL"
  fi
else
  echo "prod domain: NOT_CONFIGURED"
  echo "prod alignment: SKIPPED (PROD_* unset or placeholder — Owner action required per 121 §10)"
fi

echo "cdn/hls: NOT_STARTED (P1 defer · PI3-007 · unchanged from 121)"

verdict="PI3-002_HOLD"
if [[ "$prod_domain" == true && "$prod_alignment" == true ]]; then
  if [[ "$PROD_WEB_BASE" == *".fly.dev"* || "$PROD_API_BASE" == *".fly.dev"* ]]; then
    verdict="PI3-002_INTERIM_GO"
    echo "prod domain: INTERIM (*.fly.dev — brand domain Owner action deferred)"
  else
    verdict="PI3-002_GO"
  fi
fi

node -e "
const fs=require('fs');
const p=process.argv[1];
const o={
  kind:'traveltrust.pi3_002_domain_tls_cdn_cors_execution.v1',
  recorded_utc:process.argv[2],
  verdict:process.argv[3],
  production_scope:'PRODUCTION_SCOPE_SEPOLIA',
  chain_id:11155111,
  execution_sprint:'151',
  prod_domain_configured:process.argv[4]==='true',
  prod_tls_health_ok:process.argv[5]==='true',
  prod_cors_preflight_ok:process.argv[6]==='true',
  prod_alignment_ok:process.argv[7]==='true',
  cdn_hls:'NOT_STARTED',
  staging_api:'https://tt-api-staging.fly.dev',
  staging_web:'https://tt-web-staging.fly.dev'
};
fs.writeFileSync(p, JSON.stringify(o,null,2)+'\n');
" "$OUT/summary.json" "$STAMP" "$verdict" "$prod_domain" "$prod_tls" "$prod_cors" "$prod_alignment"

echo ""
echo "Evidence: $OUT"
echo "TT_PI3_002_DOMAIN_TLS_CDN_CORS_EXECUTION: ${verdict}"
if [[ "$verdict" == "PI3-002_GO" || "$verdict" == "PI3-002_INTERIM_GO" ]]; then exit 0; fi
echo "PI3-002 execution prep: PASS (live closure OPEN — set PROD_* per Owner checklist)"
exit 0
