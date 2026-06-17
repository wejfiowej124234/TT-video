#!/usr/bin/env bash
# Phase ② · Stripe onboarding testnet helpers（G4/G5 · 非 Mock）
# shellcheck disable=SC2034
set -euo pipefail

STRIPE_LIB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

stripe_lib_fail() { echo "stripe-onboarding-testnet-lib: FAIL $*" >&2; exit 2; }
stripe_lib_ok() { echo "stripe-onboarding-testnet-lib: OK $*" >&2; }

stripe_lib_is_placeholder() {
  local v="${1,,}"
  case "$v" in
    *replace*|*replace_me*|*your-staging*|*your_staging*|*changeme*|*example*|*staging-api.example*|sk_test_...|whsec_...)
      return 0 ;;
  esac
  [[ ${#1} -lt 24 ]] && [[ "$1" == sk_test_* || "$1" == whsec_* ]] && return 0
  return 1
}

stripe_lib_merge_env_file() {
  local f="$1"
  local skip_placeholders="${2:-0}"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    if [[ "$skip_placeholders" == "1" ]] && stripe_lib_is_placeholder "$val"; then
      continue
    fi
    export "$key=$val"
  done < "$f"
}

stripe_lib_load_staging_env() {
  local onboarding="${STAGING_ENV_FILE:-$STRIPE_LIB_ROOT/scripts/dev/.env.staging-onboarding.local}"
  local secrets="$STRIPE_LIB_ROOT/scripts/dev/.env.staging-secrets.local"
  stripe_lib_merge_env_file "$onboarding"
  stripe_lib_merge_env_file "$secrets" 1
  if [[ -n "${API_BASE_URL:-}" && -z "${API_BASE:-}" ]]; then
    export API_BASE="${API_BASE_URL%/}"
  fi
  if [[ -z "${INTERNAL_API_SECRET:-}" && -f "$STRIPE_LIB_ROOT/.env" ]]; then
    stripe_lib_merge_env_file "$STRIPE_LIB_ROOT/.env"
    # Only keep INTERNAL_API_SECRET from root .env — do not inherit LOCAL_DEV / ① DB.
    unset TRAVELTRUST_ONBOARDING_LOCAL_DEV || true
  fi
  export TRAVELTRUST_ONBOARDING_STRIPE_ENABLED="${TRAVELTRUST_ONBOARDING_STRIPE_ENABLED:-1}"
  unset TRAVELTRUST_ONBOARDING_LOCAL_DEV || true
}

stripe_lib_curl_health() {
  local base="${1%/}"
  curl -sS -o /dev/null -w "%{http_code}" \
    -H "Bypass-Tunnel-Reminder: true" \
    --max-time 15 "${base}/health" 2>/dev/null || echo "000"
}

stripe_lib_validate_stripe_secret_key() {
  local sk="${TRAVELTRUST_STRIPE_SECRET_KEY:-}"
  if [[ -z "$sk" ]]; then
    echo "stripe-onboarding-testnet-lib: FAIL TRAVELTRUST_STRIPE_SECRET_KEY unset" >&2
    return 1
  fi
  if stripe_lib_is_placeholder "$sk"; then
    echo "stripe-onboarding-testnet-lib: FAIL TRAVELTRUST_STRIPE_SECRET_KEY is placeholder — fill scripts/dev/.env.staging-secrets.local" >&2
    return 1
  fi
  if [[ "$sk" != sk_test_* ]]; then
    echo "stripe-onboarding-testnet-lib: FAIL TRAVELTRUST_STRIPE_SECRET_KEY must be sk_test_*" >&2
    return 1
  fi
  local body code
  body="$(curl -sS -w "|%{http_code}" -u "${sk}:" https://api.stripe.com/v1/balance 2>/dev/null || echo "|000")"
  code="${body##*|}"
  if [[ "$code" != "200" ]]; then
    echo "stripe-onboarding-testnet-lib: FAIL Stripe balance API HTTP $code — invalid sk_test key" >&2
    return 1
  fi
  stripe_lib_ok "Stripe sk_test key valid (balance HTTP 200)"
  return 0
}

stripe_lib_stripe_api() {
  local method="$1" path="$2"
  shift 2
  curl -sS -X "$method" -u "${TRAVELTRUST_STRIPE_SECRET_KEY}:" \
    "https://api.stripe.com/v1${path}" "$@"
}

stripe_lib_ensure_webhook_endpoint() {
  local hook_url="${1:?hook url}"
  local sk="${TRAVELTRUST_STRIPE_SECRET_KEY:?}"
  stripe_lib_validate_stripe_secret_key

  local list_json existing_id existing_secret
  list_json="$(stripe_lib_stripe_api GET "/webhook_endpoints?limit=20")"
  existing_id="$(node -e "
    const o=JSON.parse(process.argv[1]);
    const u=process.argv[2];
    const hit=(o.data||[]).find(e=>e.url===u && e.status!=='disabled');
    process.stdout.write(hit?hit.id:'');
  " "$list_json" "$hook_url")"

  if [[ -n "$existing_id" ]]; then
    stripe_lib_ok "reuse Stripe webhook endpoint id=$existing_id url=$hook_url"
    # Stripe does not return secret on list; caller must already have whsec in env or recreate.
    if [[ -n "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET:-}" ]] && ! stripe_lib_is_placeholder "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}"; then
      echo "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}"
      return 0
    fi
    stripe_lib_fail "webhook endpoint exists but TRAVELTRUST_STRIPE_WEBHOOK_SECRET missing — delete endpoint in Dashboard or set whsec from creation"
  fi

  local create_json whsec
  create_json="$(stripe_lib_stripe_api POST "/webhook_endpoints" \
    -d "url=${hook_url}" \
    -d "enabled_events[]=payment_intent.succeeded" \
    -d "enabled_events[]=checkout.session.completed")"
  whsec="$(node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(o.secret||'');" "$create_json")"
  [[ -n "$whsec" && "$whsec" == whsec_* ]] || stripe_lib_fail "Stripe webhook endpoint create failed: $create_json"
  export TRAVELTRUST_STRIPE_WEBHOOK_SECRET="$whsec"
  stripe_lib_ok "created Stripe webhook endpoint url=$hook_url"
  echo "$whsec"
}

stripe_lib_confirm_payment_intent() {
  local pi_id="$1"
  [[ -n "$pi_id" && "$pi_id" == pi_* ]] || stripe_lib_fail "invalid payment_intent id: $pi_id"
  stripe_lib_validate_stripe_secret_key
  local return_url="${STRIPE_PI_CONFIRM_RETURN_URL:-https://tt-api-staging.fly.dev/health}"
  local resp code body
  # PIs created with automatic_payment_methods require return_url on server-side confirm
  # (Stripe test: pm_card_visa + return_url → succeeded).
  resp="$(curl -sS -w "|%{http_code}" -u "${TRAVELTRUST_STRIPE_SECRET_KEY}:" \
    -X POST "https://api.stripe.com/v1/payment_intents/${pi_id}/confirm" \
    -d payment_method=pm_card_visa \
    -d "return_url=${return_url}" 2>/dev/null || echo "|000")"
  code="${resp##*|}"
  body="${resp%|*}"
  echo "$body"
  [[ "$code" == "200" ]] || stripe_lib_fail "Stripe PI confirm HTTP $code body=$body"
  local status
  status="$(node -e "try{process.stdout.write(JSON.parse(process.argv[1]).status||'')}catch{process.stdout.write('')}" "$body")"
  [[ "$status" == "succeeded" ]] || stripe_lib_fail "PI confirm status=$status (expected succeeded)"
  stripe_lib_ok "Stripe PI $pi_id confirmed (succeeded)"
}

stripe_lib_fetch_pi_webhook_events() {
  local pi_id="$1"
  local limit="${2:-5}"
  stripe_lib_stripe_api GET "/events?limit=${limit}&type=payment_intent.succeeded" | \
    node -e "
      const o=JSON.parse(require('fs').readFileSync(0,'utf8'));
      const pi=process.argv[1];
      const rows=(o.data||[]).filter(e=>{
        const obj=e.data&&e.data.object;
        return obj&&obj.id===pi;
      });
      process.stdout.write(JSON.stringify(rows,null,2));
    " "$pi_id"
}

stripe_lib_webhook_endpoint_id_for_url() {
  local hook_url="$1"
  stripe_lib_stripe_api GET "/webhook_endpoints?limit=20" | \
    node -e "
      const o=JSON.parse(require('fs').readFileSync(0,'utf8'));
      const u=process.argv[1];
      const hit=(o.data||[]).find(e=>e.url===u && e.status!=='disabled');
      process.stdout.write(hit?hit.id:'');
    " "$hook_url"
}

# Staging Fly: auto-delivery may 400/stall; Stripe CLI resend is the supported retry path (ONB-P2-003).
stripe_lib_resend_event_to_hook() {
  local event_id="$1"
  local endpoint_id="$2"
  [[ -n "$event_id" && -n "$endpoint_id" ]] || stripe_lib_fail "resend requires event_id and endpoint_id"
  command -v stripe >/dev/null 2>&1 || stripe_lib_fail "stripe CLI required for events resend"
  STRIPE_API_KEY="${TRAVELTRUST_STRIPE_SECRET_KEY}" stripe events resend "$event_id" \
    --webhook-endpoint "$endpoint_id" 2>&1
}

# POST Stripe event JSON to hook with whsec signature (same verify path as Dashboard delivery).
stripe_lib_post_signed_event_to_hook() {
  local event_id="$1"
  local hook_url="$2"
  [[ -n "$event_id" && -n "$hook_url" ]] || stripe_lib_fail "post_signed_event requires event_id and hook_url"
  stripe_lib_validate_stripe_secret_key
  local body code out
  body="$(stripe_lib_stripe_api GET "/events/${event_id}")"
  out="$(WHSEC="${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}" HOOK="${hook_url}" node -e "
    const crypto=require('crypto');
    const body=process.argv[1];
    const secret=Buffer.from(process.env.WHSEC.replace(/^whsec_/,''),'base64');
    const ts=Math.floor(Date.now()/1000);
    const sig=crypto.createHmac('sha256',secret).update(ts+'.'+body).digest('hex');
    fetch(process.env.HOOK,{method:'POST',headers:{'Content-Type':'application/json','Stripe-Signature':'t='+ts+',v1='+sig},body})
      .then(async r=>{const t=await r.text(); process.stdout.write(r.status+'|'+t);})
      .catch(e=>{process.stdout.write('000|'+e.message);});
  " "$body")"
  code="${out%%|*}"
  echo "${out#*|}"
  [[ "$code" == "200" ]] || stripe_lib_fail "signed event POST HTTP $code body=${out#*|}"
  stripe_lib_ok "signed Stripe event $event_id delivered to $hook_url"
}

stripe_lib_start_localtunnel() {
  local port="${1:-8080}"
  local pid_file="${STAGING_TUNNEL_PID_FILE:-$STRIPE_LIB_ROOT/evidence/GO_phase2_testnet_20260526/closing-gap/G4-stripe-g4/localtunnel.pid}"
  local log_file="${pid_file%.pid}.log"
  mkdir -p "$(dirname "$pid_file")"

  if [[ -f "$pid_file" ]]; then
    local old_pid
    old_pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
      local old_url
      old_url="$(grep -oE 'https://[a-zA-Z0-9.-]+\.loca\.lt' "$log_file" 2>/dev/null | head -1 || true)"
      if [[ -n "$old_url" ]] && [[ "$(stripe_lib_curl_health "$old_url")" == "200" ]]; then
        stripe_lib_ok "reuse localtunnel pid=$old_pid url=$old_url"
        echo "$old_url"
        return 0
      fi
      kill "$old_pid" 2>/dev/null || true
    fi
  fi

  npx --yes localtunnel --port "$port" >"$log_file" 2>&1 &
  local tp=$!
  echo "$tp" >"$pid_file"
  sleep 7
  local url
  url="$(grep -oE 'https://[a-zA-Z0-9.-]+\.loca\.lt' "$log_file" | head -1)"
  [[ -n "$url" ]] || stripe_lib_fail "localtunnel did not print URL — see $log_file"
  local hc
  hc="$(stripe_lib_curl_health "$url")"
  [[ "$hc" == "200" ]] || stripe_lib_fail "localtunnel ${url}/health HTTP $hc (API must listen on :$port)"
  stripe_lib_ok "localtunnel url=$url"
  echo "$url"
}

stripe_lib_patch_onboarding_env() {
  local env_file="${STAGING_ENV_FILE:-$STRIPE_LIB_ROOT/scripts/dev/.env.staging-onboarding.local}"
  local api_base="$1"
  local whsec="${2:-}"
  [[ -f "$env_file" ]] || stripe_lib_fail "missing $env_file"
  if grep -qE '^[[:space:]]*API_BASE=' "$env_file"; then
    sed -i.bak "s|^[[:space:]]*API_BASE=.*|API_BASE=${api_base}|" "$env_file" && rm -f "${env_file}.bak"
  else
    echo "API_BASE=${api_base}" >>"$env_file"
  fi
  if [[ -n "$whsec" ]]; then
    if grep -qE '^[[:space:]]*TRAVELTRUST_STRIPE_WEBHOOK_SECRET=' "$env_file"; then
      sed -i.bak "s|^[[:space:]]*TRAVELTRUST_STRIPE_WEBHOOK_SECRET=.*|TRAVELTRUST_STRIPE_WEBHOOK_SECRET=${whsec}|" "$env_file" && rm -f "${env_file}.bak"
    else
      echo "TRAVELTRUST_STRIPE_WEBHOOK_SECRET=${whsec}" >>"$env_file"
    fi
  fi
  if [[ -n "${INTERNAL_API_SECRET:-}" ]] && ! grep -qE '^[[:space:]]*INTERNAL_API_SECRET=' "$env_file" 2>/dev/null; then
    echo "INTERNAL_API_SECRET=${INTERNAL_API_SECRET}" >>"$env_file"
  fi
}
