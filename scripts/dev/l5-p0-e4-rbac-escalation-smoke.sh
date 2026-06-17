#!/usr/bin/env bash
# L5-P0 · E4 RBAC 越权验收
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/dev/l5-p0-closure-lib.sh"
PROBE_ID="E4"
GATE="scripts/dev/l5-p0-e4-rbac-escalation-smoke.sh"
OUT="${L5_P0_PROBE_OUT:-$ROOT/evidence/l5_operations_deep_audit/p0_closure_probes}"
mkdir -p "$OUT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$OUT/${PROBE_ID}-${STAMP}.log"
PARTIAL="$OUT/p0_closure_record.partial.json"
verdict="HOLD"
mode="static"
exec > >(tee -a "$LOG") 2>&1
trap 'l5_p0_write_probe_result "$PARTIAL" "$PROBE_ID" "$verdict" "$mode" "$LOG" "$STAMP" "$GATE"; echo "TT_L5_P0_E4: $verdict mode=$mode"' EXIT

echo "== L5-P0 E4 · $STAMP =="
[[ -f "$ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh" ]] || exit 0

if l5_p0_api_up && [[ -n "${DATABASE_URL:-${L5_P0_DB:-}}" ]]; then
  mode="live"
  export DATABASE_URL="${DATABASE_URL:-$L5_P0_DB}"
  export TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1
  ts="$(date +%s)"
  CS_EMAIL="l5p0-cs-${ts}@traveltrust.test"
  PASS="Test123!"
  reg="$(l5_p0_curl_json POST "$L5_P0_API/auth/register" "{\"email\":\"$CS_EMAIL\",\"password\":\"$PASS\"}")"
  cs_id="$(l5_p0_json_field "${reg#*|}" user_id)"
  l5_p0_curl_json POST "$L5_P0_API/auth/seed-test-accounts" "{\"promote_admin_email\":\"$CS_EMAIL\"}" >/dev/null
  l5_p0_run_psql -c "UPDATE users SET role = 'admin' WHERE id = '$cs_id'::uuid;
    INSERT INTO admin_console_roles (user_id, console_role) VALUES ('$cs_id'::uuid, 'CS')
    ON CONFLICT (user_id) DO UPDATE SET console_role = 'CS', updated_at = now();" >/dev/null
  login="$(l5_p0_curl_json POST "$L5_P0_API/auth/login" "{\"email\":\"$CS_EMAIL\",\"password\":\"$PASS\"}")"
  CS_TOKEN="$(l5_p0_json_field "${login#*|}" token)"

  [[ "$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/flags/00000000-0000-0000-0000-000000000099/publish" \
    "{\"enabled\":true,\"expected_version\":1}" "$CS_TOKEN" | cut -d'|' -f1)" == "403" ]]
  vr="$(l5_p0_curl_json POST "$L5_P0_API/auth/register" "{\"email\":\"l5v-${ts}@t.test\",\"password\":\"$PASS\"}")"
  vid="$(l5_p0_json_field "${vr#*|}" user_id)"
  [[ "$(l5_p0_curl_json PATCH "$L5_P0_API/api/v1/admin/growth/anti-fraud/users/$vid" \
    "{\"growth_fraud_status\":\"points_frozen\"}" "$CS_TOKEN" | cut -d'|' -f1)" == "403" ]]
  [[ "$(l5_p0_curl_json POST "$L5_P0_API/api/v1/admin/official/cold-start/campaigns" \
    "{\"name\":\"x\",\"surfaces\":[\"home_hero\"]}" "$CS_TOKEN" | cut -d'|' -f1)" == "403" ]]
  noauth="$(curl -sS -o /dev/null -w '%{http_code}' "$L5_P0_API/api/v1/admin/content/publish-queue" 2>/dev/null || echo 000)"
  [[ "$noauth" == "401" || "$noauth" == "403" ]] || l5_p0_fail "unauth $noauth"
  verdict="GO"
fi
