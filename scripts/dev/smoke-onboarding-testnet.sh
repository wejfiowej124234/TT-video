#!/usr/bin/env bash
# ② 测试网 · onboarding 垂直烟测（ONB-P2-006 · 窄 ②）
#
# 前置：G-0～G-4 预检 exit 0 · staging API HTTPS · Stripe test · 非零 amount
# 禁止：① internal webhook / local-dev mark-paid 作为 ② 唯一 paid 证据
#
# 用法：
#   cp scripts/dev/staging-onboarding.env.example scripts/dev/.env.staging-onboarding.local
#   # 填 API_BASE · sk_test · whsec · 确保 staging API 已部署且 LOCAL_DEV=0
#   bash scripts/dev/check-phase2-onboarding-staging-ready.sh
#   bash scripts/dev/smoke-onboarding-testnet.sh
#
# 可选：
#   MARK_PAID_MODE=stripe_webhook|wait_stripe|internal_json
#     stripe_webhook — 须已配置 Dashboard/listen 真投递（默认，创建 PI 后等待 paid）
#     wait_stripe     — 轮询 entitlements 直至 paid（用户须在浏览器完成 Elements 支付）
#     internal_json   — 仅 staging 内网策略允许；**不**满足 ONB-P2-003 充分证据
#   STRIPE_AUTO_CONFIRM=1 — 创建 PI 后 curl Stripe API confirm（pm_card_visa · ② 真 test mode）
#   SMOKE_PAYMENT_FLOW_LOG / SMOKE_WEBHOOK_LOG — 拆分 payment-flow / webhook 旁证
#   SMOKE_SKIP_STEWARD=1
#   STRIPE_PI_TIMEOUT_SEC=300
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
MARK_PAID_MODE="${MARK_PAID_MODE:-stripe_webhook}"
STRIPE_AUTO_CONFIRM="${STRIPE_AUTO_CONFIRM:-0}"

fail() { echo "smoke-onboarding-testnet: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-onboarding-testnet: OK $*" >&2; }

log_payment() {
  if [[ -n "${SMOKE_PAYMENT_FLOW_LOG:-}" ]]; then
    echo "$*" >>"${SMOKE_PAYMENT_FLOW_LOG}"
  fi
  echo "$*"
}

log_webhook() {
  if [[ -n "${SMOKE_WEBHOOK_LOG:-}" ]]; then
    echo "$*" >>"${SMOKE_WEBHOOK_LOG}"
  fi
  echo "$*"
}

echo "== smoke-onboarding-testnet (② · ONB-P2-006 · requires staging pregate) =="

bash "$ROOT/scripts/dev/check-phase2-onboarding-staging-ready.sh"

load_env_file() {
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    export "$key=$val"
  done < "$ENV_FILE"
}

load_env_file

# Merge staging secrets when onboarding.local still has placeholders.
if [[ -f "$ROOT/scripts/dev/.env.staging-secrets.local" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    case "${val,,}" in
      *replace*|*replace_me*) continue ;;
    esac
    cur="${!key:-}"
    if [[ -z "$cur" || "$cur" == *REPLACE* || "$cur" == "sk_test_..." || "$cur" == "whsec_..." ]]; then
      export "$key=$val"
    fi
  done < "$ROOT/scripts/dev/.env.staging-secrets.local"
fi

if [[ -n "${ONBOARDING_SMOKE_API_BASE:-}" ]]; then
  API_BASE="${ONBOARDING_SMOKE_API_BASE%/}"
fi

API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
PASSWORD="${SMOKE_TEST_PASSWORD:-Test123!}"
EVIDENCE_DIR="${PHASE2_EVIDENCE_DIR:-evidence/GO_phase2_testnet_20260526}"
mkdir -p "$ROOT/$EVIDENCE_DIR/onboarding-smoke"
LOG="$ROOT/$EVIDENCE_DIR/onboarding-smoke/run-${STAMP}.log"
exec > >(tee -a "$LOG") 2>&1

json_field() {
  node -e "const o=JSON.parse(process.argv[1]); const k=process.argv[2]; process.stdout.write(String(o[k]??''));" "$1" "$2"
}

# shellcheck source=scripts/dev/lib/smoke-auth-register.sh
source "$ROOT/scripts/dev/lib/smoke-auth-register.sh"

curl_json() {
  local method="$1" url="$2" body="${3:-}" token="${4:-}" idem="${5:-}"
  local args=(-sS -w "|%{http_code}" -X "$method" "$url" -H "Content-Type: application/json")
  [[ "$url" == *loca.lt* ]] && args+=(-H "Bypass-Tunnel-Reminder: true")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$idem" ]] && args+=(-H "Idempotency-Key: $idem")
  [[ -n "$body" ]] && args+=(-d "$body")
  local out
  out="$(curl "${args[@]}")"
  printf '%s|%s' "${out##*|}" "${out%|*}"
}

assert_fee_schedule_triple() {
  node -e "
    const bundle = {
      quote: JSON.parse(process.argv[1]),
      paymentIntent: JSON.parse(process.argv[2]),
      entitlement: JSON.parse(process.argv[3]),
    };
    process.stdout.write(JSON.stringify(bundle));
  " "$1" "$2" "$3" | node "$ROOT/scripts/dev/assert-fee-schedule-v1-alignment.mjs" --stdin
}

assert_quad_stripe() {
  local quote="$1" pay="$2" ent="$3" pi_id="$4"
  node -e "
    process.stdout.write(JSON.stringify({
      quote: JSON.parse(process.argv[1]),
      paymentIntent: JSON.parse(process.argv[2]),
      entitlement: JSON.parse(process.argv[3]),
    }));
  " "$quote" "$pay" "$ent" | node "$ROOT/scripts/dev/assert-onboarding-fee-schedule-quad-party.mjs" --stdin --stripe-pi "$pi_id"
}

wait_entitlement_paid() {
  local token="$1" idem="$2" timeout="${STRIPE_PI_TIMEOUT_SEC:-300}"
  local start now ent ent_body
  start=$(date +%s)
  while true; do
    ent="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$token")"
    [[ "${ent%%|*}" == "200" ]] || fail "entitlements HTTP ${ent%%|*}"
    ent_body="${ent#*|}"
    if echo "$ent_body" | grep -q '"status".*"paid"'; then
      ok "entitlement paid (idem=$idem)"
      printf '%s' "$ent_body"
      return 0
    fi
    now=$(date +%s)
    if (( now - start >= timeout )); then
      fail "timeout waiting paid (${timeout}s) — complete Stripe payment or fix webhook (ONB-P2-003)"
    fi
    sleep 3
  done
}

mark_paid_internal() {
  local token="$1" idem="$2"
  [[ -n "${INTERNAL_API_SECRET:-}" ]] || fail "INTERNAL_API_SECRET required for internal_json"
  export API_BASE_URL="$API_BASE"
  local wh
  wh="$(bash "$ROOT/scripts/dev/onboarding-webhook-local.sh" "$idem" "evt_testnet_${STAMP}")"
  echo "$wh" | grep -qiE '"accepted".*true|"status".*"ok"|paid' || fail "internal webhook failed: $wh"
  ok "internal webhook paid (NOT sufficient alone for ONB-P2-003 sign-off)"
}

run_provider_stripe_path() {
  local email="onb-tn-prov-${STAMP}@traveltrust.test"
  local token idem quote pay ent ent_body row pi_id stripe_ref

  token="$(register_user "$email" "provider")"

  idem="$(node -e "console.log(crypto.randomUUID())")"
  quote="$(curl_json GET "$API_BASE/api/v1/onboarding/quote?role=provider&jurisdictions=US" "" "$token")"
  [[ "${quote%%|*}" == "200" ]] || fail "quote HTTP ${quote%%|*}"

  pay="$(curl_json POST "$API_BASE/api/v1/onboarding/payment-intents" '{"role":"provider","jurisdictions":"US"}' "$token" "$idem")"
  [[ "${pay%%|*}" == "200" ]] || fail "payment-intent HTTP ${pay%%|*} body=${pay#*|}"

  local pay_body="${pay#*|}"
  log_payment "== payment-intent =="
  log_payment "$pay_body"
  echo "$pay_body" | grep -q '"client_secret"' || fail "expected Stripe client_secret (enable STRIPE on staging API)"
  pi_id="$(node -e "
    const o=JSON.parse(process.argv[1]);
    const m=o.meta||{};
    const p=o.psp||{};
    process.stdout.write(
      m.stripe_payment_intent_id||p.stripe_payment_intent_id||p.provider_payment_ref||''
    );
  " "$pay_body")"

  ent="$(curl_json GET "$API_BASE/api/v1/onboarding/entitlements/me" "" "$token")"
  ent_body="${ent#*|}"
  row="$(node -e "const a=JSON.parse(process.argv[1]).entitlements; if(!a||!a[0]) process.exit(1); process.stdout.write(JSON.stringify(a[0]));" "$ent_body")"
  assert_fee_schedule_triple "${quote#*|}" "$pay_body" "$row"

  case "$MARK_PAID_MODE" in
    internal_json)
      mark_paid_internal "$token" "$idem"
      ent_body="$(wait_entitlement_paid "$token" "$idem")"
      ;;
    stripe_webhook|wait_stripe)
      if [[ "$STRIPE_AUTO_CONFIRM" == "1" && -n "${pi_id:-}" ]]; then
        ok "STRIPE_AUTO_CONFIRM=1 — confirming PI via Stripe test API (pm_card_visa)"
        # shellcheck source=scripts/dev/stripe-onboarding-testnet-lib.sh
        source "$ROOT/scripts/dev/stripe-onboarding-testnet-lib.sh"
        local confirm_body events_json
        confirm_body="$(stripe_lib_confirm_payment_intent "$pi_id")"
        log_payment "== stripe confirm =="
        log_payment "$confirm_body"
        sleep 2
        events_json="$(stripe_lib_fetch_pi_webhook_events "$pi_id" 3 2>/dev/null || echo '[]')"
        log_webhook "== stripe payment_intent.succeeded events (Stripe API) =="
        log_webhook "$events_json"
        evt_id="$(node -e "
          const a=JSON.parse(process.argv[1]||'[]');
          process.stdout.write(a[0]&&a[0].id?a[0].id:'');
        " "$events_json")"
        if [[ -n "${evt_id:-}" ]]; then
          hook_url="${API_BASE}/api/v1/hooks/stripe/onboarding"
          we_id="$(stripe_lib_webhook_endpoint_id_for_url "$hook_url" 2>/dev/null || true)"
          if [[ -n "${we_id:-}" ]]; then
            ok "stripe events resend ${evt_id} -> ${we_id} (staging webhook delivery)"
            resend_json="$(stripe_lib_resend_event_to_hook "$evt_id" "$we_id" 2>/dev/null || echo '{}')"
            log_webhook "== stripe events resend =="
            log_webhook "$resend_json"
          fi
          deliver_json="$(stripe_lib_post_signed_event_to_hook "$evt_id" "$hook_url" 2>/dev/null || echo 'FAIL')"
          log_webhook "== signed webhook POST (Stripe event + whsec) =="
          log_webhook "$deliver_json"
        fi
        sleep 3
      else
        ok "awaiting Stripe payment + webhook (mode=$MARK_PAID_MODE pi=${pi_id:-unknown})"
        echo "  → Open staging /me/onboarding and pay with test card, or stripe listen → staging hook URL"
      fi
      ent_body="$(wait_entitlement_paid "$token" "$idem")"
      log_webhook "== entitlement paid =="
      log_webhook "$ent_body"
      ;;
    *)
      fail "unknown MARK_PAID_MODE=$MARK_PAID_MODE"
      ;;
  esac

  row="$(node -e "const a=JSON.parse(process.argv[1]).entitlements; process.stdout.write(JSON.stringify(a[0]));" "$ent_body")"
  if [[ -n "${pi_id:-}" ]]; then
    assert_quad_stripe "${quote#*|}" "$pay_body" "$row" "$pi_id"
    ok "ONB-P2-005 quad-party (Stripe PI $pi_id)"
  else
    ok "WARN: no pi_id for quad-party — triple only"
  fi

  local rc
  rc="$(curl_json POST "$API_BASE/api/v1/onboarding/role-confirm" '{"role":"provider"}' "$token" "rc-tn-${STAMP}")"
  [[ "${rc%%|*}" == "200" ]] || fail "role-confirm HTTP ${rc%%|*}"
  ok "provider ② path complete (B轨 paid)"
}

run_provider_stripe_path

echo ""
echo "TT_SMOKE_ONBOARDING_TESTNET: OK (② staging · Stripe test · see $LOG)"
echo "  Honest boundary: NOT staging report.json GO · NOT ③ Production GO"
echo "  SSOT: docs/runbook/PHASE2-ENTERPRISE-GAP-AUDIT.md"
