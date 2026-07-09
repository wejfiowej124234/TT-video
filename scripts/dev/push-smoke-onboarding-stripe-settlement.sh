#!/usr/bin/env bash
# ② · 推动 smoke onboarding 收敛链（不重跑 staging / UAT / Deep Gate）
#
# Stripe test confirm → signed webhook → entitlement paid → CONVERGED → 72h Soak
#
#   bash scripts/dev/push-smoke-onboarding-stripe-settlement.sh
#   STRIPE_PI_ID=pi_… ENTITLEMENT_ID=… bash scripts/dev/push-smoke-onboarding-stripe-settlement.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
HOOK_URL="${API}/api/v1/hooks/stripe/onboarding"
LOG="${SMOKE_SETTLEMENT_LOG:-$ROOT/frontend/evidence/GO_local_phase1/site10-phase2-smoke-settlement-push.latest.log}"
SMOKE_LOG="${SMOKE_LOG:-$ROOT/frontend/evidence/GO_local_phase1/site10-phase2-smoke-onboarding-testnet.latest.log}"

exec >>"$LOG" 2>&1
echo ""
echo "== push-smoke-onboarding-stripe-settlement · $(date -u +%Y-%m-%dT%H:%M:%SZ) =="

parse_ids() {
  [[ -f "$SMOKE_LOG" ]] || return 0
  STRIPE_PI_ID="${STRIPE_PI_ID:-$(grep -oE 'pi_[A-Za-z0-9]+' "$SMOKE_LOG" | tail -1 || true)}"
  ENTITLEMENT_ID="${ENTITLEMENT_ID:-$(grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' "$SMOKE_LOG" | head -1 || true)}"
}

parse_ids
STRIPE_PI_ID="${STRIPE_PI_ID:-}"
ENTITLEMENT_ID="${ENTITLEMENT_ID:-}"

[[ -n "$STRIPE_PI_ID" && "$STRIPE_PI_ID" == pi_* ]] || { echo "FAIL: STRIPE_PI_ID required"; exit 2; }
[[ -n "$ENTITLEMENT_ID" ]] || echo "WARN: ENTITLEMENT_ID unset — will verify via Stripe PI only"

# shellcheck source=scripts/dev/stripe-onboarding-testnet-lib.sh
source "$ROOT/scripts/dev/stripe-onboarding-testnet-lib.sh"
stripe_lib_load_staging_env
stripe_lib_validate_stripe_secret_key

admin_entitlement_status() {
  local tok login
  curl -sS --max-time 30 -X POST "$API/auth/seed-test-accounts" \
    -H "Content-Type: application/json" \
    -d '{"promote_admin_email":"tourist@test.com"}' >/dev/null 2>&1 || true
  login="$(curl -sS --max-time 30 -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"tourist@test.com","password":"Test123!"}')"
  tok="$(node -e "try{process.stdout.write(JSON.parse(process.argv[1]).token||'')}catch{}" "$login")"
  [[ -n "$tok" ]] || { echo "unknown"; return 1; }
  curl -sS --max-time 30 -H "Authorization: Bearer $tok" \
    "$API/api/v1/admin/onboarding/entitlements/${ENTITLEMENT_ID}" | \
    node -e "try{const o=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write((o.entitlement&&o.entitlement.status)||'unknown')}catch{process.stdout.write('unknown')}"
}

pi_status() {
  stripe_lib_stripe_api GET "/payment_intents/${STRIPE_PI_ID}" | \
    node -e "try{process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).status||'unknown')}catch{process.stdout.write('unknown')}"
}

cur_pi="$(pi_status || echo unknown)"
cur_ent="unknown"
[[ -n "$ENTITLEMENT_ID" ]] && cur_ent="$(admin_entitlement_status 2>/dev/null || echo unknown)"
echo "before: stripe_pi=$cur_pi entitlement=$cur_ent"

if [[ "$cur_ent" == "paid" ]]; then
  echo "TT_SMOKE_ONBOARDING_SETTLEMENT: CONVERGED (already paid)"
else
  if [[ "$cur_pi" != "succeeded" ]]; then
    echo "== Stripe test confirm (pm_card_visa) =="
    stripe_lib_confirm_payment_intent "$STRIPE_PI_ID"
    sleep 2
  fi

  echo "== deliver payment_intent.succeeded webhook to staging =="
  events_json="$(stripe_lib_fetch_pi_webhook_events "$STRIPE_PI_ID" 5 2>/dev/null || echo '[]')"
  evt_id="$(node -e "
    const a=JSON.parse(process.argv[1]||'[]');
    process.stdout.write(a[0]&&a[0].id?a[0].id:'');
  " "$events_json")"
  if [[ -z "$evt_id" ]]; then
    echo "WARN: no payment_intent.succeeded event yet — listing recent events"
    events_json="$(stripe_lib_stripe_api GET "/events?limit=10&type=payment_intent.succeeded")"
    evt_id="$(node -e "
      const o=JSON.parse(process.argv[1]);
      const pi=process.argv[2];
      const hit=(o.data||[]).find(e=>e.data&&e.data.object&&e.data.object.id===pi);
      process.stdout.write(hit?hit.id:'');
    " "$events_json" "$STRIPE_PI_ID")"
  fi
  [[ -n "$evt_id" ]] || { echo "FAIL: no Stripe payment_intent.succeeded event for $STRIPE_PI_ID"; exit 2; }
  echo "event_id=$evt_id"
  stripe_lib_post_signed_event_to_hook "$evt_id" "$HOOK_URL"
  sleep 3
fi

deadline=$(( $(date +%s) + ${SETTLEMENT_WAIT_SEC:-120} ))
while true; do
  ent_st="unknown"
  [[ -n "$ENTITLEMENT_ID" ]] && ent_st="$(admin_entitlement_status 2>/dev/null || echo unknown)"
  pi_st="$(pi_status || echo unknown)"
  echo "poll: stripe_pi=$pi_st entitlement=$ent_st"
  [[ "$ent_st" == "paid" ]] && break
  if (( $(date +%s) >= deadline )); then
    echo "FAIL: entitlement not paid within ${SETTLEMENT_WAIT_SEC:-120}s"
    exit 2
  fi
  sleep 5
done

echo "TT_SMOKE_ONBOARDING_SETTLEMENT: CONVERGED pi=$STRIPE_PI_ID entitlement=$ENTITLEMENT_ID"
echo "  evidence: $LOG"

export P2FC_SOAK_SUPERSEDE="${P2FC_SOAK_SUPERSEDE:-1}"
export TESTNET_FREEZE_OVERRIDE="${TESTNET_FREEZE_OVERRIDE:-1}"
export STAGING_API_BASE="$API"
bash "$ROOT/scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh"
echo "TT_PHASE2_PRE_SOAK_CHAIN: SOAK_STARTED"
