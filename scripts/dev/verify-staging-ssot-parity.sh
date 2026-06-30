#!/usr/bin/env bash
# PER · staging SSOT parity: deploy/fly/tt-web-staging/build.env.example NEXT_PUBLIC_* vs GET /meta
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="${FLY_STAGING_API_APP:-tt-api-staging}"
API_BASE="https://${APP}.fly.dev"
EXAMPLE="$ROOT/deploy/fly/tt-web-staging/build.env.example"

fail=0
ok() { echo "OK   $*"; }
die() { echo "FAIL $*"; fail=1; }

declare -A MAP=(
  [NEXT_PUBLIC_REGISTRY_ADDRESS]=registry_address
  [NEXT_PUBLIC_FEE_ROUTER_ADDRESS]=fee_router_address
  [NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS]=escrow_factory_address
  [NEXT_PUBLIC_GOVERNOR_ADDRESS]=governor_address
  [NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS]=governance_token_address
  [NEXT_PUBLIC_GUIDE_STAKING_ADDRESS]=guide_staking_address
  [NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS]=staking_provider_address
  [NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS]=region_steward_stake_pool_address
)

meta="$(curl -sf --max-time 90 "${API_BASE}/meta")"
contracts="$(echo "$meta" | python -c "import json,sys; print(json.dumps(json.load(sys.stdin).get('chain',{}).get('contracts',{})))")"
chain_id="$(echo "$meta" | python -c "import json,sys; print(json.load(sys.stdin).get('chain',{}).get('chain_id',''))")"

exp_chain="$(grep -E '^NEXT_PUBLIC_CHAIN_ID=' "$EXAMPLE" | head -1 | cut -d= -f2- | tr -d '\r' || true)"
[[ "$chain_id" == "$exp_chain" ]] && ok "chain_id=$chain_id" || die "chain_id got=$chain_id expected=$exp_chain"

while IFS= read -r line; do
  [[ "$line" =~ ^NEXT_PUBLIC_.*= ]] || continue
  [[ "$line" =~ ^# ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  val="$(echo "$val" | tr '[:upper:]' '[:lower:]' | tr -d '\r')"
  [[ -n "$val" && "$val" == 0x* ]] || continue
  mk="${MAP[$key]:-}"
  [[ -n "$mk" ]] || continue
  got="$(echo "$contracts" | python -c "import json,sys; d=json.load(sys.stdin); print((d.get('$mk') or '').lower())")"
  if [[ -n "$got" && "$got" == "$val" ]]; then
    ok "$key == meta.$mk"
  else
    die "$key example=$val meta.$mk=${got:-null}"
  fi
done <"$EXAMPLE"

profile="$(curl -sf --max-time 45 "${API_BASE}/meta/build" | python -c "import json,sys; print(json.load(sys.stdin).get('deployment_profile') or '')" 2>/dev/null || true)"
[[ "$profile" == "staging" ]] && ok "deployment_profile=staging" || die "deployment_profile=${profile:-null}"

if [[ "$fail" -eq 0 ]]; then
  echo "TT_STAGING_SSOT_PARITY: PASS"
  exit 0
fi
exit 1
