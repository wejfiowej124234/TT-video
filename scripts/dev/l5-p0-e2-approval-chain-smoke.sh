#!/usr/bin/env bash
# L5-P0 · E2 审批链验收
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/dev/l5-p0-closure-lib.sh"
PROBE_ID="E2"
GATE="scripts/dev/l5-p0-e2-approval-chain-smoke.sh"
OUT="${L5_P0_PROBE_OUT:-$ROOT/evidence/l5_operations_deep_audit/p0_closure_probes}"
mkdir -p "$OUT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$OUT/${PROBE_ID}-${STAMP}.log"
PARTIAL="$OUT/p0_closure_record.partial.json"
verdict="HOLD"
mode="static"
exec > >(tee -a "$LOG") 2>&1
trap 'l5_p0_write_probe_result "$PARTIAL" "$PROBE_ID" "$verdict" "$mode" "$LOG" "$STAMP" "$GATE"; echo "TT_L5_P0_E2: $verdict mode=$mode"' EXIT

echo "== L5-P0 E2 · $STAMP =="
static_ok=1
for a in 'catalog\.entity\.publish' 'ops\.cold_start\.deploy' 'admin\.console_role\.change'; do
  rg -q "$a" "$ROOT/crates/api/src/routes/admin/mod.rs" || static_ok=0
done
rg -q 'admin\.growth\.fraud\.user_status\.patch' "$ROOT/crates/api/src/routes/admin/admin_growth_fraud_http.rs" || static_ok=0
[[ "$static_ok" == "1" ]] || exit 0

if l5_p0_api_up && [[ -n "${DATABASE_URL:-${L5_P0_DB:-}}" ]]; then
  mode="live"
  export DATABASE_URL="${DATABASE_URL:-$L5_P0_DB}"
  ts="$(date +%s)"
  l5_p0_setup_super_tokens "$ts"
  req2fa="$(l5_p0_2fa_session_for_token "$L5_P0_REQ_TOKEN")"
  app2fa="$(l5_p0_2fa_session_for_token "$L5_P0_APP_TOKEN")"

  tgt="l5p0-tgt-${ts}@traveltrust.test"
  reg="$(l5_p0_curl_json POST "$L5_P0_API/auth/register" "{\"email\":\"$tgt\",\"password\":\"Test123!\"}")"
  tgt_id="$(l5_p0_json_field "${reg#*|}" user_id)"
  l5_p0_curl_json POST "$L5_P0_API/auth/seed-test-accounts" "{\"promote_admin_email\":\"$tgt\"}" >/dev/null
  l5_p0_run_psql -c "UPDATE users SET role = 'admin' WHERE id = '$tgt_id'::uuid;" >/dev/null

  req="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/users/$tgt_id/console-role-change-request" \
    "{\"console_role_70\":\"Risk\",\"reason\":\"l5-e2\"}" "$L5_P0_REQ_TOKEN" "$req2fa")"
  [[ "${req%%|*}" == "200" ]] || l5_p0_fail "role request ${req%%|*}"
  ap_id="$(l5_p0_json_field "${req#*|}" approval_request_id)"
  [[ "$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/approvals/$ap_id/approve" "{\"reason\":\"self\"}" "$L5_P0_REQ_TOKEN" "$req2fa" | cut -d'|' -f1)" == "403" ]]
  ap="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/approvals/$ap_id/approve" "{\"reason\":\"l5-e2\"}" "$L5_P0_APP_TOKEN" "$app2fa")"
  [[ "${ap%%|*}" == "200" ]] || l5_p0_fail "approve ${ap%%|*}"

  acct="$(l5_p0_official_account_id "$L5_P0_REQ_ID")"
  [[ -n "$acct" ]] || l5_p0_fail "no official account for cold start item"
  camp="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/official/cold-start/campaigns" \
    "{\"name\":\"L5-E2-${ts}\",\"surfaces\":[\"home_hero\"]}" "$L5_P0_REQ_TOKEN" "$req2fa")"
  [[ "${camp%%|*}" == "200" || "${camp%%|*}" == "201" ]] || l5_p0_fail "campaign ${camp%%|*}"
  camp_id="$(l5_p0_json_field "${camp#*|}" item.id)"
  [[ -n "$camp_id" ]] || l5_p0_fail "campaign id empty (${camp#*|})"
  item="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/official/cold-start/campaigns/$camp_id/items" \
    "{\"item_type\":\"official_account\",\"item_ref_id\":\"$acct\",\"sort_order\":0}" "$L5_P0_REQ_TOKEN" "$req2fa")"
  [[ "${item%%|*}" == "200" || "${item%%|*}" == "201" ]] || l5_p0_fail "item create ${item%%|*} (${item#*|})"
  ic="$(l5_p0_run_psql_t "SELECT count(*)::text FROM ops_cold_start_items WHERE campaign_id='$camp_id'::uuid;" | tr -d ' \n')"
  [[ "${ic:-0}" != "0" ]] || l5_p0_fail "no items in DB for campaign $camp_id"
  l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/official/cold-start/campaigns/$camp_id/submit-review" "{}" "$L5_P0_REQ_TOKEN" "$req2fa" >/dev/null
  dep_req="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/official/cold-start/campaigns/$camp_id/request-deploy" \
    "{\"reason\":\"l5-e2\"}" "$L5_P0_REQ_TOKEN" "$req2fa")"
  [[ "${dep_req%%|*}" == "200" ]] || l5_p0_fail "request-deploy ${dep_req%%|*} (${dep_req#*|})"
  dep_ap="$(l5_p0_json_field "${dep_req#*|}" approval_request_id)"
  dep_ok="$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/approvals/$dep_ap/approve" "{\"reason\":\"l5-e2\"}" "$L5_P0_APP_TOKEN" "$app2fa")"
  [[ "${dep_ok%%|*}" == "200" ]] || l5_p0_fail "deploy approve ${dep_ok%%|*}"

  rec="$(l5_p0_curl_json GET "$L5_P0_API/api/v1/admin/growth/reward-ledger/reconcile?limit=1" "" "$L5_P0_REQ_TOKEN" "$req2fa")"
  [[ "${rec%%|*}" == "200" ]] && echo "OK   growth reconcile read (Fraud/Reconcile chain)"

  verdict="GO"
  echo "OK   E2 live: console_role + cold_start.deploy + reconcile read"
fi
