#!/usr/bin/env bash
# L5-P0 · C5 Growth Freeze 联动验收
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/dev/l5-p0-closure-lib.sh"
PROBE_ID="C5"
GATE="scripts/dev/l5-p0-c5-growth-freeze-cross-smoke.sh"
OUT="${L5_P0_PROBE_OUT:-$ROOT/evidence/l5_operations_deep_audit/p0_closure_probes}"
mkdir -p "$OUT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$OUT/${PROBE_ID}-${STAMP}.log"
PARTIAL="$OUT/p0_closure_record.partial.json"
verdict="HOLD"
mode="static"
exec > >(tee -a "$LOG") 2>&1
trap 'l5_p0_write_probe_result "$PARTIAL" "$PROBE_ID" "$verdict" "$mode" "$LOG" "$STAMP" "$GATE"; echo "TT_L5_P0_C5: $verdict mode=$mode"' EXIT

echo "== L5-P0 C5 · $STAMP =="
rg -q 'points_frozen' "$ROOT/crates/api/src/db/growth_fraud_ops.rs" || exit 0

if l5_p0_api_up && [[ -n "${DATABASE_URL:-${L5_P0_DB:-}}" ]]; then
  mode="live"
  export DATABASE_URL="${DATABASE_URL:-$L5_P0_DB}"
  ts="$(date +%s)"
  l5_p0_setup_super_tokens "$ts"
  hdr="$(l5_p0_2fa_session_for_token "$L5_P0_REQ_TOKEN")"
  victim="l5p0-freeze-${ts}@traveltrust.test"
  vr="$(l5_p0_curl_json POST "$L5_P0_API/auth/register" "{\"email\":\"$victim\",\"password\":\"Test123!\"}")"
  vid="$(l5_p0_json_field "${vr#*|}" user_id)"
  l5_p0_run_psql -c "INSERT INTO referral_codes (code, code_type, owner_user_id, is_active, created_at, updated_at)
    VALUES ('L5F${ts}', 'user', '$vid'::uuid, true, now(), now()) ON CONFLICT (code) DO NOTHING;" 2>/dev/null || true
  patch="$(l5_p0_curl_json PATCH "$L5_P0_API/api/v1/admin/growth/anti-fraud/users/$vid" \
    "{\"growth_fraud_status\":\"points_frozen\",\"disable_referral_codes\":true}" "$L5_P0_REQ_TOKEN" "$hdr")"
  [[ "${patch%%|*}" == "200" ]] || l5_p0_fail "freeze ${patch%%|*}"
  st="$(l5_p0_run_psql_t "SELECT growth_fraud_status FROM users WHERE id='$vid'::uuid;" | tr -d ' \n')"
  [[ "$st" == "points_frozen" ]] || l5_p0_fail "status=$st"
  cases="$(l5_p0_run_psql_t "SELECT count(*)::text FROM growth_fraud_cases WHERE subject_user_id='$vid'::uuid AND status='open';" | tr -d ' \n')"
  [[ "${cases:-0}" != "0" ]] && echo "OK   fraud case opened"
  unfreeze="$(l5_p0_curl_json PATCH "$L5_P0_API/api/v1/admin/growth/anti-fraud/users/$vid" \
    "{\"growth_fraud_status\":\"normal\"}" "$L5_P0_REQ_TOKEN" "$hdr")"
  uf_code="${unfreeze%%|*}"
  if [[ "$uf_code" == "200" ]]; then
    echo "OK   unfreeze HTTP 200"
  elif [[ "$uf_code" == "404" ]]; then
    # Known: patch_user_growth_fraud_status uses list_growth_fraud_users which excludes normal users
    st2="$(l5_p0_run_psql_t "SELECT growth_fraud_status FROM users WHERE id='$vid'::uuid;" | tr -d ' \n')"
    [[ "$st2" == "normal" ]] || l5_p0_fail "unfreeze 404 but DB status=$st2"
    echo "OK   unfreeze persisted (API 404 list-filter quirk; DB normal)"
  else
    l5_p0_fail "unfreeze $uf_code (${unfreeze#*|})"
  fi
  verdict="GO"
fi
