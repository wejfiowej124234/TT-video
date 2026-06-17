#!/usr/bin/env bash
# Phase ③ · P0-3 · Staging Fly release 回滚演练（API + Web）
#
#   bash scripts/dev/run-phase3-fly-release-rollback-drill.sh
#   bash scripts/dev/run-phase3-fly-release-rollback-drill.sh --dry-run
#
# 流程：记录 current image → deploy previous → /health → redeploy current → /health
# Hard gate: 仅 tt-api-staging / tt-web-staging
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE3_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/rollback-drill-${STAMP}}"
DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

API_APP="${FLY_STAGING_API_APP:-tt-api-staging}"
WEB_APP="${FLY_STAGING_WEB_APP:-tt-web-staging}"
ALLOWED="${API_APP}|${WEB_APP}"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/drill.log") 2>&1

fail() { echo "TT_PHASE3_RELEASE_ROLLBACK_DRILL: FAIL $*" >&2; exit 2; }

health_check() {
  local base="$1"
  curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' "${base%/}/health" 2>/dev/null || echo "000"
}

drill_app() {
  local app="$1" health_url="$2"
  echo "=== rollback drill: ${app} ==="
  [[ "$app" =~ ^(tt-api-staging|tt-web-staging)$ ]] || fail "refusing non-staging app: ${app}"

  fly releases -a "$app" --json 2>/dev/null > "$OUT/${app}-releases.json" || \
    fly releases -a "$app" 2>&1 | tee "$OUT/${app}-releases.txt"

  local current_img prev_img
  current_img="$(fly releases -a "$app" --json 2>/dev/null | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
      try {
        const arr=JSON.parse(d);
        const r=Array.isArray(arr)?arr[0]:null;
        process.stdout.write(r?.ImageRef||r?.image_ref||'');
      } catch { process.stdout.write(''); }
    });")"
  prev_img="$(fly releases -a "$app" --json 2>/dev/null | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
      try {
        const arr=JSON.parse(d);
        const r=Array.isArray(arr)&&arr.length>1?arr[1]:null;
        process.stdout.write(r?.ImageRef||r?.image_ref||'');
      } catch { process.stdout.write(''); }
    });")"

  echo "current_image=${current_img}" | tee "$OUT/${app}-images.txt"
  echo "previous_image=${prev_img}" >> "$OUT/${app}-images.txt"

  [[ -n "$current_img" ]] || fail "${app}: cannot resolve current image"
  [[ -n "$prev_img" ]] || { echo "WARN ${app}: only one release — skip rollback leg"; return 0; }

  local h0 h1 h2
  h0="$(health_check "$health_url")"
  echo "health_before=${h0}" | tee -a "$OUT/${app}-health.txt"

  if [[ "$DRY" == "1" ]]; then
    echo "DRY-RUN: would fly deploy --image ${prev_img} -a ${app}"
    echo "DRY-RUN: would fly deploy --image ${current_img} -a ${app}"
    return 0
  fi

  echo "deploy previous image …"
  fly deploy --image "$prev_img" -a "$app" --strategy immediate 2>&1 | tee "$OUT/${app}-deploy-prev.log"
  sleep 15
  h1="$(health_check "$health_url")"
  echo "health_after_rollback=${h1}" | tee -a "$OUT/${app}-health.txt"
  [[ "$h1" == "200" ]] || fail "${app} health after rollback got ${h1}"

  echo "redeploy current image …"
  fly deploy --image "$current_img" -a "$app" --strategy immediate 2>&1 | tee "$OUT/${app}-deploy-current.log"
  sleep 15
  h2="$(health_check "$health_url")"
  echo "health_after_restore=${h2}" | tee -a "$OUT/${app}-health.txt"
  [[ "$h2" == "200" ]] || fail "${app} health after restore got ${h2}"
}

echo "== phase3 fly release rollback drill · ${STAMP} dry=${DRY} =="
command -v fly >/dev/null 2>&1 || fail "fly CLI missing"
fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"

drill_app "$API_APP" "https://${API_APP}.fly.dev"
drill_app "$WEB_APP" "https://${WEB_APP}.fly.dev"

cat > "$OUT/drill-record.json" <<EOF
{
  "schema": "phase3_release_rollback_drill.v1",
  "at": "${STAMP}",
  "dry_run": ${DRY},
  "apps": ["${API_APP}", "${WEB_APP}"],
  "allowed_pattern": "${ALLOWED}"
}
EOF

echo "READY" > "$OUT/STATUS.txt"
echo "TT_PHASE3_RELEASE_ROLLBACK_DRILL: OK"
echo "Evidence: ${OUT}"
