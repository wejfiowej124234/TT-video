#!/usr/bin/env bash
# Phase ③ · Production Fly release 回滚演练（DR · PI3-002 配套）
#
#   bash scripts/dev/run-phase3-fly-release-rollback-drill-prod.sh
#   bash scripts/dev/run-phase3-fly-release-rollback-drill-prod.sh --dry-run
#
# Hard gate: 仅 tt-api-prod / tt-web-prod
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE3_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/prod-rollback-drill-${STAMP}}"
DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

API_APP="${FLY_PROD_API_APP:-tt-api-prod}"
WEB_APP="${FLY_PROD_WEB_APP:-tt-web-prod}"
API_BASE="${PROD_API_BASE:-https://${API_APP}.fly.dev}"
WEB_BASE="${PROD_WEB_BASE:-https://${WEB_APP}.fly.dev}"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/drill.log") 2>&1

fail() { echo "TT_PROD_RELEASE_ROLLBACK_DRILL: FAIL $*" >&2; exit 2; }

health_check() {
  local base="$1"
  curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' "${base%/}/health" 2>/dev/null || echo "000"
}

drill_app() {
  local app="$1" health_url="$2"
  echo "=== prod rollback drill: ${app} ==="
  [[ "$app" =~ ^(tt-api-prod|tt-web-prod)$ ]] || fail "refusing non-prod app: ${app}"

  fly releases -a "$app" --json >"$OUT/${app}-releases.json" 2>&1 || fail "fly releases failed for ${app}"

  local current_img prev_img
  current_img="$(node -e "
    const arr=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
    const r=Array.isArray(arr)?arr[0]:null;
    process.stdout.write(r?.ImageRef||r?.image_ref||'');
  " "$OUT/${app}-releases.json")"
  prev_img="$(node -e "
    const arr=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
    const r=Array.isArray(arr)&&arr.length>1?arr[1]:null;
    process.stdout.write(r?.ImageRef||r?.image_ref||'');
  " "$OUT/${app}-releases.json")"

  echo "current_image=${current_img}" | tee "$OUT/${app}-images.txt"
  echo "previous_image=${prev_img}" >>"$OUT/${app}-images.txt"
  [[ -n "$current_img" ]] || fail "${app}: cannot resolve current image"
  [[ -n "$prev_img" ]] || { echo "WARN ${app}: only one release — skip rollback leg"; return 0; }

  [[ "$DRY" == "1" ]] && { echo "DRY-RUN only"; return 0; }

  fly deploy --image "$prev_img" -a "$app" --strategy immediate 2>&1 | tee "$OUT/${app}-deploy-prev.log"
  sleep 20
  [[ "$(health_check "$health_url")" == "200" ]] || fail "${app} health after rollback not 200"

  fly deploy --image "$current_img" -a "$app" --strategy immediate 2>&1 | tee "$OUT/${app}-deploy-current.log"
  sleep 20
  [[ "$(health_check "$health_url")" == "200" ]] || fail "${app} health after restore not 200"
}

echo "== prod fly rollback drill · ${STAMP} dry=${DRY} =="
command -v fly >/dev/null 2>&1 || fail "fly CLI missing"
fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"

drill_app "$API_APP" "$API_BASE"
drill_app "$WEB_APP" "$WEB_BASE"

echo "READY" >"$OUT/STATUS.txt"
echo "TT_PROD_RELEASE_ROLLBACK_DRILL: OK"
echo "Evidence: ${OUT}"
