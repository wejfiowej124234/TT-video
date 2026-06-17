#!/usr/bin/env bash
# L5-P0 · E3 2FA 覆盖率验收
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/dev/l5-p0-closure-lib.sh"
PROBE_ID="E3"
GATE="scripts/dev/l5-p0-e3-2fa-coverage-smoke.sh"
OUT="${L5_P0_PROBE_OUT:-$ROOT/evidence/l5_operations_deep_audit/p0_closure_probes}"
mkdir -p "$OUT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$OUT/${PROBE_ID}-${STAMP}.log"
PARTIAL="$OUT/p0_closure_record.partial.json"
verdict="HOLD"
mode="static"
exec > >(tee -a "$LOG") 2>&1
trap 'l5_p0_write_probe_result "$PARTIAL" "$PROBE_ID" "$verdict" "$mode" "$LOG" "$STAMP" "$GATE"; echo "TT_L5_P0_E3: $verdict mode=$mode"' EXIT

echo "== L5-P0 E3 · $STAMP =="
rg -q 'admin_2fa_blocks_actor' "$ROOT/crates/api/src/routes/admin/admin_rbac.rs" || exit 0

if l5_p0_api_up && [[ -n "${DATABASE_URL:-${L5_P0_DB:-}}" ]]; then
  mode="live"
  export DATABASE_URL="${DATABASE_URL:-$L5_P0_DB}"
  ts="$(date +%s)"
  l5_p0_setup_super_tokens "$ts"
  session_hdr="$(l5_p0_2fa_session_for_token "$L5_P0_REQ_TOKEN")"

  victim="l5p0-vic-${ts}@traveltrust.test"
  vr="$(l5_p0_curl_json POST "$L5_P0_API/auth/register" "{\"email\":\"$victim\",\"password\":\"Test123!\"}")"
  vid="$(l5_p0_json_field "${vr#*|}" user_id)"

  no2fa="$(l5_p0_curl_json PATCH "$L5_P0_API/api/v1/admin/growth/anti-fraud/users/$vid" \
    "{\"growth_fraud_status\":\"points_frozen\"}" "$L5_P0_REQ_TOKEN")"
  [[ "${no2fa%%|*}" == "403" ]] && echo "${no2fa#*|}" | grep -q 'admin_2fa_required' \
    || l5_p0_fail "expected admin_2fa_required got ${no2fa%%|*}"

  with2fa="$(l5_p0_curl_json PATCH "$L5_P0_API/api/v1/admin/growth/anti-fraud/users/$vid" \
    "{\"growth_fraud_status\":\"points_frozen\"}" "$L5_P0_REQ_TOKEN" "$session_hdr")"
  [[ "${with2fa%%|*}" == "200" ]] || l5_p0_fail "with 2FA expected 200 got ${with2fa%%|*}"

  l5_p0_run_psql -c "UPDATE admin_security_policies SET policy_value = jsonb_set(policy_value, '{enforced}', 'false'::jsonb, true)
    WHERE policy_key = 'admin_2fa_policy';" 2>/dev/null || true
  verdict="GO"
  echo "OK   E3 2FA enforce block + session bypass"
fi
