#!/usr/bin/env bash
# Phase ② · 从已 broadcast 日志补跑 Sepolia 对拍 + 证据包（不重播 forge）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVID_ROOT="$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia"
TS="${1:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$EVID_ROOT/${TS}"
LOG="${2:-}"

fail() { echo "finalize-gov-freeze-v1-sepolia-evidence: FAIL $*" >&2; exit 2; }

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  export "$key=$val"
done < "$ENV_FILE"

export USDC_TOKEN_ADDRESS="${USDC_TOKEN_ADDRESS:-${FUND_STACK_TOKEN_ADDRESS:-}}"

if ! cast chain-id --rpc-url "${CHAIN_RPC_URL:-}" >/dev/null 2>&1; then
  export CHAIN_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
fi

if [[ -z "$LOG" ]]; then
  LOG="$(ls -t "$EVID_ROOT"/*/forge-broadcast-*.log 2>/dev/null | head -1 || true)"
fi
[[ -n "$LOG" && -f "$LOG" ]] || fail "broadcast log not found"

mkdir -p "$EVID"
cp "$LOG" "$EVID/" 2>/dev/null || true

GOV_FREEZE_V1_TIMELOCK="$(grep -o 'GOV_FREEZE_V1_TIMELOCK 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1)"
GOV_FREEZE_V1_GOVERNOR="$(grep -o 'GOV_FREEZE_V1_GOVERNOR_PROXY 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1)"
TREASURY_P4_CAP_ADDRESS="$(grep -o 'TREASURY_P4_CAP_PROXY 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1)"
PRIMARY_MARKET_ADDRESS="$(grep -o 'PRIMARY_MARKET_PROXY 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1)"
SEAT_REGISTRY_ADDRESS="$(grep -o 'SEAT_REGISTRY_PROXY 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1)"
REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS="$(grep -o 'REGION_STEWARD_STAKE_POOL_PROXY 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1)"

[[ -n "$GOV_FREEZE_V1_GOVERNOR" ]] || fail "parse governor from log"
[[ -n "$GOV_FREEZE_V1_TIMELOCK" ]] || fail "parse timelock from log"

export GOVERNOR_ADDRESS="$GOV_FREEZE_V1_GOVERNOR"
export TIMELOCK_ADDRESS="$GOV_FREEZE_V1_TIMELOCK"
export TREASURY_P4_CAP_ADDRESS PRIMARY_MARKET_ADDRESS SEAT_REGISTRY_ADDRESS
export REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS
export GOV_FREEZE_V1_EVID_DIR="$EVID"

bash "$ROOT/scripts/dev/verify-gov-freeze-v1-sepolia-onchain.sh"

ENV_APPEND="$EVID/phase2-env-append-${TS}.env"
cat >"$ENV_APPEND" <<EOF
# TTG-TOKENOMICS-FREEZE-V1 · Sepolia ${TS}
GOV_FREEZE_V1_TIMELOCK_ADDRESS=${GOV_FREEZE_V1_TIMELOCK}
GOV_FREEZE_V1_GOVERNOR_ADDRESS=${GOV_FREEZE_V1_GOVERNOR}
TREASURY_P4_CAP_ADDRESS=${TREASURY_P4_CAP_ADDRESS}
PRIMARY_MARKET_ADDRESS=${PRIMARY_MARKET_ADDRESS}
SEAT_REGISTRY_ADDRESS=${SEAT_REGISTRY_ADDRESS}
REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS=${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS}
EOF

cat >"$EVID/PHASE2-GOV-FREEZE-V1-SEPOLIA-BASELINE.md" <<EOF
# Phase ② · TTG-TOKENOMICS-FREEZE-V1 · Sepolia 正式审计基线

**Stamp:** ${TS}  
**Chain:** Sepolia (11155111)  
**SSOT:** docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md  
**Proxy gate:** G24-P-UPGRADE-01 PASS  
**Prerequisites:** G24-P-05～09 PASS  
**Verify:** GOV_FREEZE_V1_SEPOLIA_ONCHAIN_VERIFY: PASS

| 组件 | Proxy 地址 | admin |
|------|------------|-------|
| Governor (GOV-02/03) | ${GOV_FREEZE_V1_GOVERNOR} | Timelock |
| Timelock (GOV-02) | ${GOV_FREEZE_V1_TIMELOCK} | Safe |
| Treasury P4 Cap (GOV-01) | ${TREASURY_P4_CAP_ADDRESS} | Timelock |
| Seat Registry (GOV-03) | ${SEAT_REGISTRY_ADDRESS} | Timelock |
| Primary Market (GOV-04) | ${PRIMARY_MARKET_ADDRESS} | Timelock |
| Stake Pool (GOV-03 hook) | ${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS} | Timelock |

**Reuse:** GOVERNANCE_TOKEN_ADDRESS=${GOVERNANCE_TOKEN_ADDRESS}

**诚实边界:** ② Sepolia 测试网审计基线 · ≠ ③ Production GO · Legal ☐
EOF

ln -sfn "$TS" "$EVID_ROOT/latest"

echo "TT_PHASE2_GOV_FREEZE_V1_SEPOLIA_BASELINE: OK stamp=${TS}"
echo "TT_GOV_FREEZE_V1_SEPOLIA_ADDRESSES: governor=${GOV_FREEZE_V1_GOVERNOR} timelock=${GOV_FREEZE_V1_TIMELOCK} treasury_p4=${TREASURY_P4_CAP_ADDRESS} primary_market=${PRIMARY_MARKET_ADDRESS} seat_registry=${SEAT_REGISTRY_ADDRESS} stake_pool_proxy=${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS}"
