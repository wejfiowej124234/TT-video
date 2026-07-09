#!/usr/bin/env bash
# ② · 等待 smoke-onboarding Stripe/webhook 收敛 → 自动启动 72h P2FC Soak
#
# 纪律：不重跑 staging deploy / UAT / Deep Gate / smoke 全链
#
#   bash scripts/dev/wait-smoke-onboarding-settlement-then-soak.sh
#
# 可选：
#   STRIPE_PI_ID=pi_… ENTITLEMENT_ID=…  SMOKE_SETTLEMENT_POLL_SEC=30  SMOKE_SETTLEMENT_TIMEOUT_SEC=86400
#   P2FC_SOAK_SUPERSEDE=1（默认 1 ·  supersede 旧 job）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SMOKE_LOG="${SMOKE_LOG:-$ROOT/frontend/evidence/GO_local_phase1/site10-phase2-smoke-onboarding-testnet.latest.log}"
OUT_LOG="${SMOKE_SETTLEMENT_LOG:-$ROOT/frontend/evidence/GO_local_phase1/site10-phase2-smoke-settlement-watch.latest.log}"
STATE="${SMOKE_SETTLEMENT_STATE:-$ROOT/frontend/evidence/GO_local_phase1/site10-phase2-smoke-settlement.watch.json}"
POLL_SEC="${SMOKE_SETTLEMENT_POLL_SEC:-30}"
TIMEOUT_SEC="${SMOKE_SETTLEMENT_TIMEOUT_SEC:-86400}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
ADMIN_EMAIL="${SMOKE_SETTLEMENT_ADMIN_EMAIL:-tourist@test.com}"
ADMIN_PASSWORD="${SMOKE_SETTLEMENT_ADMIN_PASSWORD:-Test123!}"

exec >>"$OUT_LOG" 2>&1
echo ""
echo "== wait-smoke-onboarding-settlement-then-soak · $(date -u +%Y-%m-%dT%H:%M:%SZ) =="

parse_from_smoke_log() {
  [[ -f "$SMOKE_LOG" ]] || return 1
  local line
  line="$(grep -E 'stripe_payment_intent_id|pi_[A-Za-z0-9]+' "$SMOKE_LOG" | head -1 || true)"
  STRIPE_PI_ID="${STRIPE_PI_ID:-$(echo "$line" | grep -oE 'pi_[A-Za-z0-9]+' | head -1 || true)}"
  line="$(grep -E 'entitlement_id' "$SMOKE_LOG" | head -1 || true)"
  ENTITLEMENT_ID="${ENTITLEMENT_ID:-$(echo "$line" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1 || true)}"
}

STRIPE_PI_ID="${STRIPE_PI_ID:-}"
ENTITLEMENT_ID="${ENTITLEMENT_ID:-}"
parse_from_smoke_log || true

[[ -n "$STRIPE_PI_ID" && "$STRIPE_PI_ID" == pi_* ]] || {
  echo "FAIL: STRIPE_PI_ID unset — set env or ensure $SMOKE_LOG contains pi_…"
  exit 2
}
[[ -n "$ENTITLEMENT_ID" ]] || {
  echo "FAIL: ENTITLEMENT_ID unset — set env or ensure smoke log contains entitlement_id"
  exit 2
}

node -e "
const fs=require('fs');
const p=process.argv[1];
const o={
  schema:'smoke_settlement_watch.v1',
  started_at:new Date().toISOString(),
  stripe_pi_id:process.argv[2],
  entitlement_id:process.argv[3],
  api_base:process.argv[4],
  poll_sec:Number(process.argv[5]),
  timeout_sec:Number(process.argv[6]),
  policy:'no_staging_rerun'
};
fs.writeFileSync(p, JSON.stringify(o,null,2)+'\n');
" "$STATE" "$STRIPE_PI_ID" "$ENTITLEMENT_ID" "$API" "$POLL_SEC" "$TIMEOUT_SEC"

# shellcheck source=scripts/dev/stripe-onboarding-testnet-lib.sh
source "$ROOT/scripts/dev/stripe-onboarding-testnet-lib.sh"
stripe_lib_load_staging_env

curl_json() {
  local method="$1" url="$2" body="${3:-}" token="${4:-}"
  local args=(--noproxy "*" -sS --max-time 25 -w "|%{http_code}" -X "$method" "$url" -H "Content-Type: application/json")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$body" ]] && args+=(-d "$body")
  curl "${args[@]}"
}

admin_token() {
  local attempt login i
  for i in 1 2 3; do
    curl_json POST "$API/auth/seed-test-accounts" '{"promote_admin_email":"'"$ADMIN_EMAIL"'"}' >/dev/null 2>&1 || true
    login="$(curl_json POST "$API/auth/login" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")"
    if [[ "${login%%|*}" == "200" ]]; then
      node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.token||'');" "${login#*|}"
      return 0
    fi
    sleep 2
  done
  return 1
}

stripe_pi_status() {
  stripe_lib_stripe_api GET "/payment_intents/${STRIPE_PI_ID}" 2>/dev/null | \
    node -e "try{process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).status||'unknown')}catch{process.stdout.write('unknown')}"
}

entitlement_status() {
  local tok="$1"
  local resp code body
  resp="$(curl_json GET "$API/api/v1/admin/onboarding/entitlements/${ENTITLEMENT_ID}" "" "$tok")"
  code="${resp%%|*}"
  body="${resp#*|}"
  [[ "$code" == "200" ]] || { echo "http_${code}"; return 0; }
  node -e "try{const o=JSON.parse(process.argv[1]); process.stdout.write((o.entitlement&&o.entitlement.status)||o.status||'unknown')}catch{process.stdout.write('unknown')}" "$body"
}

start_soak_if_ready() {
  if [[ -f "$ROOT/evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json" ]]; then
    echo "TT_PHASE2_PRE_SOAK_CHAIN: SOAK_ALREADY_COMPLETE"
    return 0
  fi
  for d in "$ROOT/evidence/P2FC_SOAK_72H_STAGING"/job-*; do
    [[ -d "$d" ]] || continue
    pid="$(cat "$d/pid.txt" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "TT_PHASE2_PRE_SOAK_CHAIN: SOAK_ALREADY_INFLIGHT job=$(basename "$d") pid=$pid"
      return 0
    fi
  done
  export P2FC_SOAK_SUPERSEDE="${P2FC_SOAK_SUPERSEDE:-1}"
  export TESTNET_FREEZE_OVERRIDE="${TESTNET_FREEZE_OVERRIDE:-1}"
  export STAGING_API_BASE="$API"
  bash "$ROOT/scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh"
  echo "TT_PHASE2_PRE_SOAK_CHAIN: SOAK_STARTED"
}

start=$(date +%s)
echo "watch: pi=$STRIPE_PI_ID entitlement=$ENTITLEMENT_ID poll=${POLL_SEC}s timeout=${TIMEOUT_SEC}s"

while true; do
  now=$(date +%s)
  if (( TIMEOUT_SEC > 0 && now - start >= TIMEOUT_SEC )); then
    echo "TT_SMOKE_ONBOARDING_SETTLEMENT: TIMEOUT (${TIMEOUT_SEC}s)"
    exit 2
  fi

  pi_st="$(stripe_pi_status || echo unknown)"
  ent_st="unknown"
  tok="$(admin_token 2>/dev/null || true)"
  if [[ -n "$tok" ]]; then
    ent_st="$(entitlement_status "$tok")"
  else
    echo "  warn: admin login failed this poll"
  fi

  echo "$(date -u +%H:%M:%S) poll stripe_pi=$pi_st entitlement=$ent_st"

  if [[ "$ent_st" == "paid" ]]; then
    echo "TT_SMOKE_ONBOARDING_SETTLEMENT: CONVERGED pi=$STRIPE_PI_ID entitlement=$ENTITLEMENT_ID stripe_pi=$pi_st"
    echo "  evidence: $OUT_LOG"
    start_soak_if_ready
    echo "TT_SMOKE_ONBOARDING_SETTLEMENT_WATCH: DONE"
    exit 0
  fi

  if [[ "$pi_st" == "succeeded" && "$ent_st" != "paid" ]]; then
    echo "  note: Stripe PI succeeded — awaiting staging webhook → entitlement paid"
  fi

  sleep "$POLL_SEC"
done
