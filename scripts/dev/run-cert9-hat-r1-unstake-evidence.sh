#!/usr/bin/env bash
# Cert #9 · HAT-R1 step-10 unstake (requestRelease) — requires Cert #8 finalize
#
#   export HAT_R1_LIVE_WALLET_OK=1 HAT_R1_PHASE_B_PAUSED=0
#   export HAT_R1_CHAIN_RPC_URL=https://sepolia.gateway.tenderly.co
#   bash scripts/dev/run-cert9-hat-r1-unstake-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_EVID="$(hat_r1_resolve_evid_dir "$ROOT")"
export HAT_R1_EVID="$HAT_EVID"

[[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
  echo "cert9-unstake-evidence: FAIL set HAT_R1_LIVE_WALLET_OK=1" >&2
  exit 2
}
[[ "${HAT_R1_PHASE_B_PAUSED:-1}" == "0" ]] || {
  echo "cert9-unstake-evidence: FAIL HAT_R1_PHASE_B_PAUSED must be 0" >&2
  exit 2
}
[[ -f "$HAT_EVID/step-10-treasury-execute/tx-execute.json" ]] || {
  echo "cert9-unstake-evidence: FAIL Cert #8 treasury execute evidence required (step-10-treasury-execute)" >&2
  exit 2
}

fail() { echo "cert9-unstake-evidence: FAIL $*" >&2; exit 2; }

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

PK="${HAT_R1_WALLET_PK:-${PRIVATE_KEY:-${B407_PRIVATE_KEY:-}}}"
[[ -n "$PK" ]] || fail "wallet PK required"
case "$PK" in 0x*) ;; *) PK="0x${PK}" ;; esac
export HAT_R1_PK="$PK"
export PRIVATE_KEY="$PK"
WALLET="$(cast wallet address --private-key "$PK")"
RPC="${HAT_R1_CHAIN_RPC_URL:-${CHAIN_RPC_URL:-https://sepolia.gateway.tenderly.co}}"
export CHAIN_RPC_URL="$RPC"

[[ -n "${REGION_STEWARD_STAKE_POOL_ADDRESS:-}" ]] || fail "REGION_STEWARD_STAKE_POOL_ADDRESS unset"
JUR="${HAT_R1_STEWARD_JURISDICTION:-CN}"
J_HEX="$(python -c "print(bytes('$JUR','ascii').hex().rjust(4,'0'))")"

command -v cast >/dev/null 2>&1 || fail "cast required"
command -v jq >/dev/null 2>&1 || fail "jq required"

echo "CERT9_HAT_R1_UNSTAKE: START wallet=${WALLET} jurisdiction=${JUR} evid=${HAT_EVID}"

if [[ ! -f "$HAT_EVID/step-10-unstake/exit-read.json" ]]; then
  hat_r1_page_manifest "step-10-unstake"
  REL_TX="$(hat_r1_cast_send_capture "step-10-unstake" "requestRelease" \
    "$REGION_STEWARD_STAKE_POOL_ADDRESS" "requestRelease(bytes2)" "0x${J_HEX}")"
  RELEASABLE="$(cast call "$REGION_STEWARD_STAKE_POOL_ADDRESS" "releasableAmount(address,bytes2)(uint256)" "$WALLET" "0x${J_HEX}" --rpc-url "$RPC" | awk '{print $1}')"
  hat_r1_save_json "$HAT_EVID/step-10-unstake/exit-read.json" "$(jq -n \
    --arg tx "$REL_TX" --arg rel "$RELEASABLE" --arg jur "$JUR" \
    '{request_release_tx:$tx,releasable_now:$rel,jurisdiction:$jur,note:"claimReleased after vest delay"}')"
  hat_r1_api_get "step-10-unstake" "stake-status" "/api/v1/steward/stake-status?jurisdiction=${JUR}&wallet=${WALLET}" >/dev/null || true
  hat_r1_db_snapshot "step-10-unstake"
  echo "CERT9_HAT_R1_UNSTAKE: requestRelease tx=${REL_TX} releasable=${RELEASABLE}"
fi

echo "CERT9_HAT_R1_UNSTAKE: OK"
echo "TT_CERT9_UNSTAKE_EVIDENCE: PASS"
