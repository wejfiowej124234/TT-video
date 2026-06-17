#!/usr/bin/env bash
# Stripe Live onboarding helpers（PI3-003 · prod · no product code）
set -euo pipefail

STRIPE_LIVE_LIB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

stripe_live_lib_fail() { echo "stripe-live-onboarding-lib: FAIL $*" >&2; exit 2; }
stripe_live_lib_ok() { echo "stripe-live-onboarding-lib: OK $*" >&2; }

stripe_live_lib_is_placeholder() {
  local v="${1,,}"
  case "$v" in
    *replace*|*replace_me*|*your-domain*|*your_domain*|*changeme*|*example*|sk_live_...|whsec_...)
      return 0 ;;
  esac
  [[ ${#1} -lt 24 ]] && [[ "$1" == sk_live_* || "$1" == whsec_* ]] && return 0
  return 1
}

stripe_live_lib_merge_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    export "$key=$val"
  done < "$f"
}

stripe_live_lib_load_prod_env() {
  local prod="${PROD_ENV_FILE:-$STRIPE_LIVE_LIB_ROOT/scripts/dev/.env.production.local}"
  stripe_live_lib_merge_env_file "$prod"
  export TRAVELTRUST_ONBOARDING_STRIPE_ENABLED="${TRAVELTRUST_ONBOARDING_STRIPE_ENABLED:-1}"
  if [[ -n "${PROD_API_BASE:-}" ]]; then
    export PROD_API_BASE="${PROD_API_BASE%/}"
  elif [[ -n "${PUBLIC_API_BASE_URL:-}" ]]; then
    export PROD_API_BASE="${PUBLIC_API_BASE_URL%/}"
  fi
}

stripe_live_lib_validate_live_secret_key() {
  local sk="${TRAVELTRUST_STRIPE_SECRET_KEY:-}"
  [[ -n "$sk" ]] || { echo "FAIL TRAVELTRUST_STRIPE_SECRET_KEY unset" >&2; return 1; }
  stripe_live_lib_is_placeholder "$sk" && { echo "FAIL sk_live placeholder" >&2; return 1; }
  [[ "$sk" == sk_live_* ]] || { echo "FAIL must be sk_live_* (not sk_test_*)" >&2; return 1; }
  local body code
  body="$(curl -sS -w "|%{http_code}" -u "${sk}:" https://api.stripe.com/v1/balance 2>/dev/null || echo "|000")"
  code="${body##*|}"
  [[ "$code" == "200" ]] || { echo "FAIL Stripe live balance HTTP ${code}" >&2; return 1; }
  stripe_live_lib_ok "Stripe sk_live key valid (balance HTTP 200)"
  return 0
}

stripe_live_lib_validate_webhook_secret() {
  local whsec="${TRAVELTRUST_STRIPE_WEBHOOK_SECRET:-}"
  [[ -n "$whsec" ]] || { echo "FAIL TRAVELTRUST_STRIPE_WEBHOOK_SECRET unset" >&2; return 1; }
  stripe_live_lib_is_placeholder "$whsec" && { echo "FAIL whsec placeholder" >&2; return 1; }
  [[ "$whsec" == whsec_* ]] || { echo "FAIL whsec_* required" >&2; return 1; }
  stripe_live_lib_ok "TRAVELTRUST_STRIPE_WEBHOOK_SECRET shape OK"
  return 0
}

stripe_live_lib_prod_hook_url() {
  local base="${PROD_API_BASE:-${PUBLIC_API_BASE_URL:-}}"
  [[ -n "$base" ]] || stripe_live_lib_fail "PROD_API_BASE unset"
  echo "${base%/}/api/v1/hooks/stripe/onboarding"
}

stripe_live_lib_stripe_api() {
  local method="$1" path="$2"
  shift 2
  curl -sS -X "$method" -u "${TRAVELTRUST_STRIPE_SECRET_KEY}:" \
    "https://api.stripe.com/v1${path}" "$@"
}

stripe_live_lib_ensure_webhook_endpoint() {
  local hook_url="${1:?hook url}"
  stripe_live_lib_validate_live_secret_key
  local list_json existing_id
  list_json="$(stripe_live_lib_stripe_api GET "/webhook_endpoints?limit=20")"
  existing_id="$(node -e "
    const o=JSON.parse(process.argv[1]);
    const u=process.argv[2];
    const hit=(o.data||[]).find(e=>e.url===u && e.status!=='disabled');
    process.stdout.write(hit?hit.id:'');
  " "$list_json" "$hook_url")"
  if [[ -n "$existing_id" ]]; then
    stripe_live_lib_ok "reuse live webhook endpoint id=${existing_id}"
    if stripe_live_lib_validate_webhook_secret; then
      echo "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}"
      return 0
    fi
    stripe_live_lib_fail "endpoint exists but whsec missing in env"
  fi
  local create_json whsec
  create_json="$(stripe_live_lib_stripe_api POST "/webhook_endpoints" \
    -d "url=${hook_url}" \
    -d "enabled_events[]=payment_intent.succeeded" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "enabled_events[]=charge.refunded" \
    -d "enabled_events[]=charge.dispute.funds_withdrawn")"
  whsec="$(node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.secret||'');" "$create_json")"
  [[ -n "$whsec" && "$whsec" == whsec_* ]] || stripe_live_lib_fail "webhook create failed: ${create_json}"
  export TRAVELTRUST_STRIPE_WEBHOOK_SECRET="$whsec"
  stripe_live_lib_ok "created live webhook endpoint url=${hook_url}"
  echo "$whsec"
}
