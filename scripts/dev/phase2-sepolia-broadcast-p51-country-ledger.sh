#!/usr/bin/env bash
# Phase ② · Sepolia · DeployP51CountryLedger --broadcast
#
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#   bash scripts/dev/phase2-sepolia-broadcast-p51-country-ledger.sh
#
# SSOT: docs/runbook/TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
ROOT_ENV="$ROOT/.env"
REGISTRY="$ROOT/registry/protocol-convergence-deployments.v1.yaml"
EVIDENCE="${PHASE2_P51_LEDGER_BROADCAST_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/p51-country-ledger-broadcast/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
SEPOLIA_CHAIN_ID=11155111
PILOT_HEX="${PILOT_JURISDICTION_HEX:-0x4445}"

fail() { echo "phase2-sepolia-broadcast-p51-country-ledger: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-broadcast-p51-country-ledger: OK $*"; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

if ! is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 — see TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST §4"
fi

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

upsert_env_file() {
  local file="$1" key="$2" val="$3"
  [[ -f "$file" ]] || return 0
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    node - "$file" "$key" "$val" <<'NODE'
const fs=require('fs');
const [f,k,v]=process.argv.slice(2);
let t=fs.readFileSync(f,'utf8');
const re=new RegExp(`^${k}=.*$`,'m');
t=re.test(t)?t.replace(re,`${k}=${v}`):t.trimEnd()+`\n${k}=${v}\n`;
fs.writeFileSync(f,t);
NODE
  else
    printf '\n# seq 5 broadcast %s\n%s=%s\n' "$TS" "$key" "$val" >> "$file"
  fi
}

load_env

if [[ -n "$RPC_URL_OVERRIDE" ]]; then
  export CHAIN_RPC_URL="$RPC_URL_OVERRIDE"
fi

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "PRIVATE_KEY unset"
[[ -n "${TIMELOCK_ADDRESS:-}" && "$TIMELOCK_ADDRESS" != *"..."* ]] || fail "TIMELOCK_ADDRESS unset"

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"
command -v node >/dev/null 2>&1 || fail "node not found"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "refusing broadcast: chain_id=$CHAIN_ID"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
[[ "$TIMELOCK_ADDRESS" != "$DEPLOYER" ]] || fail "R-02: TIMELOCK_ADDRESS must not equal deployer EOA"

BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0")"
MIN_WEI=$((50000000000000000))
if [[ "$BAL_WEI" =~ ^[0-9]+$ ]] && (( BAL_WEI < MIN_WEI )); then
  fail "deployer balance ${BAL_WEI} wei < 0.05 ETH"
fi

echo "phase2-sepolia-broadcast-p51-country-ledger: pregate..."
bash "$ROOT/scripts/gates/check-phase2-chain-broadcast-pregate.sh"

echo "phase2-sepolia-broadcast-p51-country-ledger: dry-run (skip spine · ISSUED path)..."
export PHASE2_SKIP_SPINE_AUDIT=1
bash "$ROOT/scripts/dev/phase2-sepolia-p51-country-ledger-dry-run.sh"

mkdir -p "$EVIDENCE"
LOG="$EVIDENCE/forge-broadcast-${TS}.log"

echo "phase2-sepolia-broadcast-p51-country-ledger: broadcasting..."
export PILOT_JURISDICTION_HEX="$PILOT_HEX"
(
  cd "$ROOT/contracts"
  forge script script/DeployP51CountryLedger.s.sol:DeployP51CountryLedgerScript \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --slow \
    -vv 2>&1 | tee "$LOG"
)

grep -q "LEDGER_BINDING_CHECK: OK" "$LOG" || fail "broadcast log missing LEDGER_BINDING_CHECK: OK"

BROADCAST_JSON="$ROOT/contracts/broadcast/DeployP51CountryLedger.s.sol/${SEPOLIA_CHAIN_ID}/run-latest.json"
REPORT="$EVIDENCE/broadcast-${TS}.json"

LEDGER="$(node - "$BROADCAST_JSON" <<'NODE'
const fs = require("fs");
const path = process.argv[2];
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const txs = data.transactions || [];
for (let i = txs.length - 1; i >= 0; i--) {
  const tx = txs[i];
  if (tx.contractName === "CountryPoolLedgerV0" && tx.contractAddress) {
    console.log(tx.contractAddress);
    break;
  }
}
NODE
)"

[[ -n "$LEDGER" && "$LEDGER" == 0x* ]] || fail "could not extract CountryPoolLedgerV0 from $BROADCAST_JSON"

TX_HASH="$(node - "$BROADCAST_JSON" <<'NODE'
const fs = require("fs");
const path = process.argv[2];
const data = JSON.parse(fs.readFileSync(path, "utf8"));
for (const tx of data.transactions || []) {
  if (tx.contractName === "CountryPoolLedgerV0" && tx.hash) {
    console.log(tx.hash);
    break;
  }
}
NODE
)"

SSOT_TOKEN="${COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS:-${FUND_STACK_TOKEN_ADDRESS:-}}"

export COUNTRY_POOL_LEDGER_PILOT_ADDRESS="$LEDGER"
export COUNTRY_POOL_LEDGER_ADDRESS="$LEDGER"
[[ -n "$SSOT_TOKEN" && "$SSOT_TOKEN" != *"..."* ]] && export COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS="$SSOT_TOKEN"

echo "phase2-sepolia-broadcast-p51-country-ledger: backfill env + registry..."
upsert_env_file "$ENV_FILE" "COUNTRY_POOL_LEDGER_PILOT_ADDRESS" "$LEDGER"
upsert_env_file "$ENV_FILE" "COUNTRY_POOL_LEDGER_ADDRESS" "$LEDGER"
if [[ -n "$SSOT_TOKEN" && "$SSOT_TOKEN" != *"..."* ]]; then
  upsert_env_file "$ENV_FILE" "COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS" "$SSOT_TOKEN"
fi

if [[ -f "$ROOT_ENV" ]]; then
  upsert_env_file "$ROOT_ENV" "COUNTRY_POOL_LEDGER_PILOT_ADDRESS" "$LEDGER"
  upsert_env_file "$ROOT_ENV" "COUNTRY_POOL_LEDGER_ADDRESS" "$LEDGER"
  if [[ -n "$SSOT_TOKEN" && "$SSOT_TOKEN" != *"..."* ]]; then
    upsert_env_file "$ROOT_ENV" "COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS" "$SSOT_TOKEN"
  fi
fi

REG_UPDATED="$(date -u +%Y-%m-%dT%H:%MZ)"
node - "$REGISTRY" "$LEDGER" "$REG_UPDATED" <<'NODE'
const fs=require('fs');
const [reg, addr, updated]=process.argv.slice(2);
let y=fs.readFileSync(reg,'utf8');
y=y.replace(/country_pool_ledger_pilot_address:\s*null/, `country_pool_ledger_pilot_address: "${addr}"`);
y=y.replace(/^updated:\s*"[^"]+"/m, `updated: "${updated}"`);
fs.writeFileSync(reg,y);
NODE

VERIFY_RPC="${PHASE2_VERIFY_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
export PHASE2_VERIFY_RPC_URL="$VERIFY_RPC"
export CHAIN_RPC_URL="$VERIFY_RPC"
bash "$ROOT/scripts/dev/phase2-sepolia-p51-country-ledger-verify-bindings.sh" --deployer "$DEPLOYER" \
  || fail "post-broadcast verification failed"

cat > "$REPORT" <<EOF
{
  "schema": "phase2_sepolia_p51_country_ledger_broadcast.v1",
  "timestamp_utc": "$TS",
  "chain_id": $SEPOLIA_CHAIN_ID,
  "deployer": "$DEPLOYER",
  "timelock_address": "$TIMELOCK_ADDRESS",
  "broadcast": true,
  "pilot_jurisdiction": "DE",
  "addresses": {
    "country_pool_ledger_pilot_address": "$LEDGER",
    "country_pool_ledger_address": "$LEDGER",
    "country_ledger_ssot_token_address": "${SSOT_TOKEN:-null}"
  },
  "transaction": {
    "country_pool_ledger_v0": "${TX_HASH:-null}"
  },
  "forge_log": "$(basename "$LOG")",
  "broadcast_json": "${BROADCAST_JSON#$ROOT/}",
  "ssot": "docs/runbook/TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST.md"
}
EOF

ok "broadcast log → $LOG"
ok "report → $REPORT"
echo "TT_PHASE2_SEPOLIA_BROADCAST_ADDRESSES: countryPoolLedgerPilot=$LEDGER countryPoolLedger=$LEDGER"
echo "TT_PHASE2_SEPOLIA_P51_COUNTRY_LEDGER_BROADCAST: OK"
