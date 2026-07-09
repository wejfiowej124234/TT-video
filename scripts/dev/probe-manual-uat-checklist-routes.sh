#!/usr/bin/env bash
# Manual UAT C1–E2 · route probe (① API login + FE HTTP reachability).
# SSOT: registry/test-accounts-business-immutable.v1.yaml · Immutable IDs C1–E2
# Does NOT replace ② UI human sign-off (TT-LOCAL-UI-MANUAL-UAT-CHECKLIST §0).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API="${API_BASE:-http://127.0.0.1:8080}"
FE="${FRONTEND_BASE:-http://127.0.0.1:3012}"
OUT="${1:-$ROOT/evidence/manual-uat/sessions/latest/checklist-probes.jsonl}"
PASSWD="Test123!"
mkdir -p "$(dirname "$OUT")"
: >"$OUT"

IS_STAGING=0
if [[ "${TRAVELTRUST_PROBE_STAGING:-0}" == "1" ]] || [[ "$API" == *".fly.dev"* ]] || [[ "$API" == *"staging"* ]]; then
  IS_STAGING=1
fi

log() { echo "$1" | tee -a "${OUT%.jsonl}.log"; }

probe_fe() {
  local id="$1" path="$2"
  local code attempt
  code=000
  for attempt in 1 2 3; do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 8 --max-time 25 -g "${FE}${path}" 2>/dev/null || echo 000)"
    if [[ "$code" =~ ^(200|301|302|307|308)$ ]]; then
      break
    fi
    sleep "$attempt"
  done
  if [[ "$code" =~ ^(200|301|302|307|308)$ ]]; then
    log "OK   $id FE $path HTTP $code"
    echo "{\"id\":\"$id\",\"layer\":\"fe_route\",\"path\":\"$path\",\"http\":$code,\"status\":\"PASS\"}" >>"$OUT"
    return 0
  fi
  log "FAIL $id FE $path HTTP $code"
  echo "{\"id\":\"$id\",\"layer\":\"fe_route\",\"path\":\"$path\",\"http\":$code,\"status\":\"FAIL\"}" >>"$OUT"
  return 1
}

probe_login() {
  local id="$1" email="$2"
  local tmp code token
  tmp="$(mktemp)"
  code="$(curl -sS -o "$tmp" -w '%{http_code}' --max-time 30 -X POST "${API}/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${PASSWD}\"}" 2>/dev/null || echo 000)"
  token="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('token') or '')" "$tmp" 2>/dev/null || true)"
  rm -f "$tmp"
  if [[ "$code" =~ ^2 && -n "$token" ]]; then
    log "OK   $id API login $email"
    echo "{\"id\":\"$id\",\"layer\":\"api_login\",\"email\":\"$email\",\"status\":\"PASS\"}" >>"$OUT"
    return 0
  fi
  log "FAIL $id API login $email HTTP $code"
  echo "{\"id\":\"$id\",\"layer\":\"api_login\",\"email\":\"$email\",\"status\":\"FAIL\",\"http\":\"$code\"}" >>"$OUT"
  return 1
}

probe_login_skip() {
  local id="$1" reason="$2"
  log "SKIP $id — $reason"
  echo "{\"id\":\"$id\",\"layer\":\"api_login\",\"status\":\"SKIP\",\"reason\":\"$reason\"}" >>"$OUT"
}

fail=0
probe_login C1-1 multi-demo@test.com || fail=1
probe_login C2-1 tourist@test.com || fail=1
probe_login C3-1 guide@test.com || fail=1
probe_login C4-1 merchant@test.com || fail=1
probe_login E2-1 provider-did-rank-demo@test.com || fail=1
if [[ "$IS_STAGING" -eq 1 ]]; then
  probe_login_skip E1-2 "E1 TrustGate Local-only (staging_excluded per immutable registry)"
else
  probe_login E1-2 tg_guide_main@trustgate-e2e.local || fail=1
fi

probe_fe C1-2 /me/identities || fail=1
sleep 1
probe_fe C1-3 /me/publish || fail=1
probe_fe C1-4 "/governance?view=region" || fail=1
probe_fe C1-5 /market/acquisition || fail=1
probe_fe C2-2 / || fail=1
probe_fe C2-3 /market || fail=1
probe_fe C2-4 /community || fail=1
probe_fe C2-5 /orders || fail=1
probe_fe C2-6 /admin || fail=1
probe_fe C3-2 /guide || fail=1
probe_fe C3-3 "/market?view=guides" || fail=1
probe_fe C4-2 /provider || fail=1
probe_fe C4-3 /me/identities/merchant/settings || fail=1
probe_fe E1-1 /orders || fail=1
probe_fe E1-2 /guide || fail=1
probe_fe E2-1 /did-rank || fail=1
probe_fe E2-2 "/did-rank?board=acquisition" || fail=1

if [[ "$fail" -eq 0 ]]; then
  log "TT_MANUAL_UAT_ROUTE_PROBE: PASS"
  exit 0
fi
log "TT_MANUAL_UAT_ROUTE_PROBE: FAIL"
exit 1
