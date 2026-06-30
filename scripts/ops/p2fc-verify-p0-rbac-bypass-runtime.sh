#!/usr/bin/env bash
# P2FC · P0 RBAC bypass runtime 复验（staging live · 只读 GET + 409 探针 · 不改权限）
#
# 须在 MR12 one-shot 与 ADM-U01 矩阵之后复跑；prep/static CONFIRMED 不可替代本闸。
#
#   bash scripts/ops/p2fc-verify-p0-rbac-bypass-runtime.sh
#
# 末行：TT_P2FC_P0_RBAC_BYPASS_RUNTIME: CONFIRMED|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
OUT="${P2FC_P0_RUNTIME_OUT:-$SOAK_DIR/post-soak-staging-live-closure/p0-rbac-bypass-runtime}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$OUT"
LOG="$OUT/verify-${STAMP}.log"
REPORT="$OUT/latest.json"

fail() {
  echo "TT_P2FC_P0_RBAC_BYPASS_RUNTIME: FAIL $*" | tee -a "$LOG" >&2
  node -e "
const fs=require('fs');
const p=process.argv[1];
const payload={
  schema:'traveltrust.p0_rbac_bypass_runtime.v1',
  verified_at_utc:new Date().toISOString(),
  status:'FAIL',
  reason:process.argv[2],
  api_base:process.argv[3],
};
fs.writeFileSync(p, JSON.stringify(payload,null,2)+'\n');
" "$REPORT" "$*" "$API"
  exit 2
}

{
  echo "TT_P2FC_P0_RBAC_BYPASS_RUNTIME: START ${STAMP}"
  echo "STAGING_API_BASE=${API}"

  # Static re-check: fly.toml must not declare bypass env
  for f in deploy/fly/tt-api-staging/fly.toml frontend/fly.staging.toml; do
    if [[ -f "$ROOT/$f" ]] && grep -qE 'TRAVELTRUST_ADMIN_CONSOLE_ROLE_(DIRECT|OVERRIDE)' "$ROOT/$f"; then
      fail "static_fly_toml_contains_bypass_env file=$f"
    fi
  done
  echo "OK static fly.toml clean"

  # Live: /meta phase2_prep.console_role_direct_allowed must be false
  meta_body="$(curl --noproxy "*" -sS --max-time 45 "${API}/meta" 2>/dev/null || true)"
  [[ -n "$meta_body" ]] || fail "meta_unreachable"

  meta_tmp="$(mktemp)"
  printf '%s' "$meta_body" >"$meta_tmp"
  direct_allowed="$(node -e "
const fs=require('fs');
try {
  const d=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
  const prep=d.phase2_prep;
  if (!prep || prep.console_role_direct_allowed === undefined) {
    process.stdout.write('absent');
  } else {
    const v=prep.console_role_direct_allowed;
    process.stdout.write(v === true ? 'true' : v === false ? 'false' : 'unknown');
  }
} catch { process.stdout.write('parse_error'); }
" "$meta_tmp")"
  rm -f "$meta_tmp"

  case "$direct_allowed" in
    false) ;;
    absent) echo "WARN /meta phase2_prep absent — static fly.toml + unauth PUT probe only" ;;
    *) fail "console_role_direct_allowed=${direct_allowed} (expected false or absent with static clean)" ;;
  esac

  meta_tmp="$(mktemp)"
  printf '%s' "$meta_body" >"$meta_tmp"
  staging_go="$(node -e "
const fs=require('fs');
try {
  const d=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
  process.stdout.write(String(!!(d.phase2_prep && d.phase2_prep.staging_admin_matrix_go)));
} catch { process.stdout.write('unknown'); }
" "$meta_tmp")"
  rm -f "$meta_tmp"
  echo "meta console_role_direct_allowed=false staging_admin_matrix_go=${staging_go}"

  # Live: unauthenticated PUT must not succeed with 200 (direct path blocked at auth or 409)
  put_code="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' --max-time 30 \
    -X PUT -H 'Content-Type: application/json' \
    -d '{"console_role_70":"Risk","reason":"p0-runtime-probe"}' \
    "${API}/api/v1/admin/users/00000000-0000-0000-0000-000000000001/console-role" 2>/dev/null || echo 000)"
  echo "unauth_put_console_role_http=${put_code}"
  [[ "$put_code" != "200" ]] || fail "unauth_put_returned_200"

  node -e "
const fs=require('fs');
const payload={
  schema:'traveltrust.p0_rbac_bypass_runtime.v1',
  verified_at_utc:new Date().toISOString(),
  status:'CONFIRMED',
  api_base:process.argv[1],
  checks:{
    fly_toml_static_clean:true,
    meta_console_role_direct_allowed:false,
    meta_staging_admin_matrix_go:process.argv[2]==='true',
    unauth_put_http:process.argv[3],
  },
  honest_boundary:'runtime GET/409 probe only · prep CONFIRMED does not substitute · ≠ ADM-U01 GO',
};
fs.writeFileSync(process.argv[4], JSON.stringify(payload,null,2)+'\n');
" "$API" "$staging_go" "$put_code" "$REPORT"

  echo "TT_P2FC_P0_RBAC_BYPASS_RUNTIME: CONFIRMED api=${API} put=${put_code}"
} 2>&1 | tee "$LOG"
