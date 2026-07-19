#!/usr/bin/env bash
# L5-A Sepolia wired EscrowFactory Clean Redeploy (Release Identity must be pinned first).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
SEPOLIA_CHAIN_ID=11155111
EV_ROOT="$ROOT/evidence/GO_phase2_fcg_full_capability_v2_sepolia"
PENDING="$EV_ROOT/pending"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$EV_ROOT/broadcast-wired/${TS}"

fail() { echo "fcg-v2-wired-redeploy: FAIL $*" >&2; exit 2; }
ok() { echo "fcg-v2-wired-redeploy: OK $*"; }

# shellcheck disable=SC1091
source "$ROOT/scripts/dev/load-fcg-v2-clean-deploy-env.sh"

HEAD="$(git rev-parse HEAD)"
PIN="$PENDING/CDR-19-L5A-RELEASE-SHA-PIN-LATEST.json"
[[ -f "$PIN" ]] || fail "missing $PIN — run Release Identity pin first"
PIN_SHA="$(python -c "import json;print(json.load(open(r'$PIN',encoding='utf-8'))['Release_SHA'])")"
[[ "$HEAD" == "$PIN_SHA" ]] || fail "HEAD=$HEAD != pinned $PIN_SHA"

python "$ROOT/scripts/dev/check-fcg-v2-clean-deploy-broadcast-preflight.py" \
  || fail "broadcast preflight not PASS (may need expected SHA update)"

[[ "${TRAVELTRUST_FCG_V2_BROADCAST_OK:-}" == "1" ]] || fail "TRAVELTRUST_FCG_V2_BROADCAST_OK!=1"
[[ "${FCG_V2_WANT_BROADCAST:-}" == "1" ]] || fail "FCG_V2_WANT_BROADCAST!=1"
[[ -n "${PRIVATE_KEY:-}" && -n "${USDC_TOKEN_ADDRESS:-}" && -n "${SEPOLIA_RPC_URL:-}" ]] \
  || fail "deploy env incomplete"

CHAIN_ID="$(cast chain-id --rpc-url "$SEPOLIA_RPC_URL")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "chain_id=$CHAIN_ID"

mkdir -p "$EVID" "$PENDING"
ok "LIVE broadcast DeployFcgV2WiredEscrowFactorySepolia"
(
  cd "$ROOT/contracts"
  forge script script/DeployFcgV2WiredEscrowFactorySepolia.s.sol:DeployFcgV2WiredEscrowFactorySepolia \
    --rpc-url "$SEPOLIA_RPC_URL" \
    --broadcast \
    --private-key "$PRIVATE_KEY" \
    -vvv
) | tee "$EVID/forge-broadcast.log"

BROADCAST_JSON="$(ls -1t "$ROOT/contracts/broadcast/DeployFcgV2WiredEscrowFactorySepolia.s.sol/$SEPOLIA_CHAIN_ID/"*.json 2>/dev/null | head -1 || true)"
[[ -n "$BROADCAST_JSON" ]] || fail "missing broadcast JSON"
cp -f "$BROADCAST_JSON" "$EVID/broadcast-run-latest.json"
cp -f "$BROADCAST_JSON" "$PENDING/FCG-V2-WIRED-BROADCAST-RUN-LATEST.json"

python "$ROOT/scripts/dev/bind-fcg-v2-wired-redeploy-after-broadcast.py"
ok "wired redeploy bound — next five-layer rebind consistency"
