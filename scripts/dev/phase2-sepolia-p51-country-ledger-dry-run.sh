#!/usr/bin/env bash
# Phase ② · Sepolia DeployP51CountryLedger dry-run（无 --broadcast）
#
#   bash scripts/dev/phase2-sepolia-p51-country-ledger-dry-run.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVIDENCE="${PHASE2_P51_LEDGER_DRY_RUN_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/p51-country-ledger-dry-run/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
PILOT_HEX="${PILOT_JURISDICTION_HEX:-0x4445}"

fail() { echo "phase2-sepolia-p51-country-ledger-dry-run: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-p51-country-ledger-dry-run: OK $*"; }

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"

RPC_URL_OVERRIDE="${CHAIN_RPC_URL:-}"

load_env() {
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$ENV_FILE"
}

load_env

if [[ -n "$RPC_URL_OVERRIDE" ]]; then
  export CHAIN_RPC_URL="$RPC_URL_OVERRIDE"
fi

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "PRIVATE_KEY unset"
[[ -n "${TIMELOCK_ADDRESS:-}" && "$TIMELOCK_ADDRESS" != *"..."* ]] || fail "TIMELOCK_ADDRESS unset"
[[ -n "${COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS:-}" && "$COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS" != *"..."* ]] \
  || fail "COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS unset — complete seq 4 first"

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
[[ "$TIMELOCK_ADDRESS" != "$DEPLOYER" ]] || fail "R-02: TIMELOCK_ADDRESS must not equal deployer EOA"

NONCE="$(cast nonce "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "unknown")"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0")"
CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "${CHAIN_ID:-11155111}")"
[[ "$CHAIN_ID" == "11155111" ]] || fail "chain_id=$CHAIN_ID (required Sepolia 11155111)"

mkdir -p "$EVIDENCE"
LOG="$EVIDENCE/forge-p51-ledger-dry-run-${TS}.log"
REPORT="$EVIDENCE/precheck.json"

echo "phase2-sepolia-p51-country-ledger-dry-run: spine gate (seq 1–4)..."
if [[ "${PHASE2_SKIP_SPINE_AUDIT:-}" == "1" ]]; then
  echo "phase2-sepolia-p51-country-ledger-dry-run: SKIP spine re-audit (PHASE2_SKIP_SPINE_AUDIT=1 · requires TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION PASS)"
  test -f "$ROOT/docs/runbook/TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION.md" \
    || fail "missing TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION.md"
else
  export PHASE2_VERIFY_RPC_URL="${PHASE2_VERIFY_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
  bash "$ROOT/scripts/dev/phase2-sepolia-spine-audit.sh" \
    || fail "spine audit failed — fix seq 1–4 or set PHASE2_SKIP_SPINE_AUDIT=1 after final attestation PASS"
fi

echo "phase2-sepolia-p51-country-ledger-dry-run: broadcast pregate..."
bash "$ROOT/scripts/gates/check-phase2-chain-broadcast-pregate.sh" >/dev/null \
  || fail "check-phase2-chain-broadcast-pregate.sh failed"

echo "phase2-sepolia-p51-country-ledger-dry-run: protocol quote parity (static · no HTTP)..."
bash "$ROOT/scripts/gates/check-protocol-quote-parity.sh" >/dev/null \
  || fail "check-protocol-quote-parity.sh failed"

export PILOT_JURISDICTION_HEX="$PILOT_HEX"
(
  cd "$ROOT/contracts"
  forge script script/DeployP51CountryLedger.s.sol:DeployP51CountryLedgerScript \
    --rpc-url "$CHAIN_RPC_URL" \
    --slow \
    -vv 2>&1 | tee "$LOG"
) || fail "DeployP51CountryLedger dry-run failed"

grep -q "LEDGER_BINDING_CHECK: OK" "$LOG" || fail "missing LEDGER_BINDING_CHECK: OK"
grep -q "ledger_owner_is_timelock true" "$LOG" || fail "expected ledger_owner_is_timelock true"
grep -q "ledger_owner_not_deployer true" "$LOG" || fail "expected ledger_owner_not_deployer true (R-02)"

bash "$ROOT/scripts/dev/phase2-sepolia-p51-country-ledger-verify-bindings.sh" \
  --from-log "$LOG" --timelock "$TIMELOCK_ADDRESS" --deployer "$DEPLOYER" \
  || fail "P51 ledger binding verification failed"

GAS_EST="$(grep -E 'Estimated total gas|Estimated amount required' "$LOG" | tail -6 | tr '\n' ' ' || echo "see log")"
LEDGER="$(grep -E '^  COUNTRY_POOL_LEDGER_PILOT ' "$LOG" | tail -1 | awk '{print $2}' || echo null)"

cat > "$REPORT" <<EOF
{
  "schema": "phase2_sepolia_p51_country_ledger_dry_run_precheck.v1",
  "timestamp_utc": "$TS",
  "chain_id": $CHAIN_ID,
  "deployer": "$DEPLOYER",
  "deployer_nonce": "$NONCE",
  "deployer_balance_wei": "$BAL_WEI",
  "timelock_address": "$TIMELOCK_ADDRESS",
  "pilot_jurisdiction": "DE",
  "pilot_jurisdiction_hex": "$PILOT_HEX",
  "ledger_owner_must_be_timelock": true,
  "ledger_owner_must_not_be_deployer": true,
  "broadcast": false,
  "simulated_addresses": {
    "country_pool_ledger_pilot_address": "$LEDGER"
  },
  "binding_check": "LEDGER_BINDING_CHECK: OK",
  "gas_estimate_note": "$GAS_EST",
  "forge_log": "$(basename "$LOG")",
  "api_note": "post-broadcast set COUNTRY_POOL_LEDGER_PILOT_ADDRESS + COUNTRY_POOL_LEDGER_ADDRESS (API/indexer)",
  "ssot": "docs/runbook/TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST.md"
}
EOF

ok "dry-run log → $LOG"
ok "precheck → $REPORT"
echo "TT_PHASE2_SEPOLIA_P51_COUNTRY_LEDGER_DRY_RUN: OK (no broadcast)"
