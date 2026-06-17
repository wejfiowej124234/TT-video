#!/usr/bin/env bash
# L5-P0 · D3 Cold Start Consumer 实时联动验收
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/dev/l5-p0-closure-lib.sh"
PROBE_ID="D3"
GATE="scripts/dev/l5-p0-d3-cold-start-linkage-smoke.sh"
OUT="${L5_P0_PROBE_OUT:-$ROOT/evidence/l5_operations_deep_audit/p0_closure_probes}"
mkdir -p "$OUT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$OUT/${PROBE_ID}-${STAMP}.log"
PARTIAL="$OUT/p0_closure_record.partial.json"
verdict="HOLD"
mode="static"
exec > >(tee -a "$LOG") 2>&1
trap 'l5_p0_write_probe_result "$PARTIAL" "$PROBE_ID" "$verdict" "$mode" "$LOG" "$STAMP" "$GATE"; echo "TT_L5_P0_D3: $verdict mode=$mode"' EXIT

echo "== L5-P0 D3 · $STAMP =="
rg -q 'get_deployed_cold_start_campaign_for_surface' "$ROOT/crates/api/src/db/ops_cold_start_campaigns_consumer.rs" || exit 0

if l5_p0_api_up && [[ -n "${DATABASE_URL:-${L5_P0_DB:-}}" ]]; then
  mode="live"
  export DATABASE_URL="${DATABASE_URL:-$L5_P0_DB}"
  ts="$(date +%s)"
  cname="L5-D3-${ts}"
  l5_p0_setup_super_tokens "$ts"
  req2fa="$(l5_p0_2fa_session_for_token "$L5_P0_REQ_TOKEN")"
  acct="$(l5_p0_official_account_id "$L5_P0_REQ_ID")"
  [[ -n "$acct" ]] || l5_p0_fail "no official account"

  camp="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/official/cold-start/campaigns" \
    "{\"name\":\"$cname\",\"surfaces\":[\"home_hero\"]}" "$L5_P0_REQ_TOKEN" "$req2fa")"
  [[ "${camp%%|*}" == "200" || "${camp%%|*}" == "201" ]] || l5_p0_fail "create ${camp%%|*}"
  camp_id="$(echo "${camp#*|}" | node -e "const o=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(o.item?.id||'');")"
  l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/official/cold-start/campaigns/$camp_id/items" \
    "{\"item_type\":\"official_account\",\"item_ref_id\":\"$acct\",\"sort_order\":0}" "$L5_P0_REQ_TOKEN" "$req2fa" >/dev/null
  l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/official/cold-start/campaigns/$camp_id/submit-review" "{}" "$L5_P0_REQ_TOKEN" "$req2fa" >/dev/null
  dep="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/official/cold-start/campaigns/$camp_id/deploy" "{}" "$L5_P0_REQ_TOKEN" "$req2fa")"
  [[ "${dep%%|*}" == "200" ]] || l5_p0_fail "deploy ${dep%%|*} (${dep#*|})"

  after="$(curl -fsS "$L5_P0_API/api/v1/official/cold-start/surfaces/home_hero")"
  echo "$after" | grep -q "$cname" || l5_p0_fail "consumer missing campaign after deploy"

  rb="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/official/cold-start/campaigns/$camp_id/rollback" "{}" "$L5_P0_REQ_TOKEN" "$req2fa")"
  [[ "${rb%%|*}" == "200" ]] || l5_p0_fail "rollback ${rb%%|*}"
  post="$(curl -fsS "$L5_P0_API/api/v1/official/cold-start/surfaces/home_hero")"
  echo "$post" | grep -q "$cname" && l5_p0_fail "consumer still shows campaign after rollback"
  verdict="GO"
  echo "OK   D3 deploy→consumer→rollback"
fi
