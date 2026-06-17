#!/usr/bin/env bash
# Finalize GovFreeze V2 after successful broadcast (verify + env append + optional TTG fund)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="${1:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID_ROOT="$ROOT/evidence/GO_phase2_gov_freeze_v2_clean_baseline"
EVID="$EVID_ROOT/${STAMP}"
mkdir -p "$EVID"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

export USDC_TOKEN_ADDRESS="${USDC_TOKEN_ADDRESS:-${FUND_STACK_TOKEN_ADDRESS:-}}"

: "${GOV_FREEZE_V2_TIMELOCK_ADDRESS:?}"
: "${GOV_FREEZE_V2_GOVERNOR_ADDRESS:?}"
: "${GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS:?}"

export GOV_FREEZE_V2_EVID_DIR="$EVID"
bash "$ROOT/scripts/dev/verify-gov-freeze-v2-sepolia-onchain.sh"

TTG_FUND="${GOV_FREEZE_V2_PRIMARY_MARKET_TTG_FUND:-2000000000000000000000000}"
if [[ -n "${GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS:-}" ]]; then
  cast send "$GOVERNANCE_TOKEN_ADDRESS" \
    "transfer(address,uint256)" "$GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS" "$TTG_FUND" \
    --rpc-url "$CHAIN_RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    >>"$EVID/post-deploy-ttg-fund.log" 2>&1 || true
fi

cat >"$EVID/phase2-env-append-${STAMP}.env" <<EOF
# GOV-FREEZE-V2-CLEAN-BASELINE · Sepolia ${STAMP}
GOV_FREEZE_V2_BASELINE_ACTIVE=1
GOV_FREEZE_V2_BASELINE_STAMP=${STAMP}
GOV_FREEZE_V2_TIMELOCK_ADDRESS=${GOV_FREEZE_V2_TIMELOCK_ADDRESS}
GOV_FREEZE_V2_GOVERNOR_ADDRESS=${GOV_FREEZE_V2_GOVERNOR_ADDRESS}
GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS=${GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS}
GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS=${GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS}
GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS=${GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS}
GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS=${GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS}
GOVERNANCE_TOKEN_ADDRESS=${GOVERNANCE_TOKEN_ADDRESS}
EOF

ln -sfn "$STAMP" "$EVID_ROOT/latest"
echo "GOV_FREEZE_V2_FINALIZE: OK evidence=$EVID"
