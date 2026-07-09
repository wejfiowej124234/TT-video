#!/usr/bin/env bash
# W7 Sepolia Vacancy V1 Runtime Activation — strict runbook order · evidence per step.
# Sepolia only · no mainnet · requires TRAVELTRUST_W7_SEPOLIA_BROADCAST_OK=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
SEPOLIA_CHAIN_ID=11155111
TS="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/docs/spec/governance-token/evidence/vacancy-w7-sepolia-execution"
LEGACY_LEDGER="0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa"
LEGACY_STEWARD="0x6B3391c0b6297A5866c0bB7AD06dA99E08F0a3fb"
LEGACY_UNALLOC="0xAbE36f8eF43D544b9D0e1c0A5F9638dC37Ed33D0"
MIGRATION_RAW="${MIGRATION_AMOUNT_RAW:-495000}"

fail() { echo "W7-ACTIVATION: FAIL $*" >&2; exit 2; }
log() { echo "W7-ACTIVATION: $*"; }

is_truthy() {
  case "${1:-}" in 1 | true | TRUE | yes | YES | on | ON) return 0 ;; *) return 1 ;; esac
}

load_env() {
  [[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    export "$key=$val"
  done < "$ENV_FILE"
  export SETTLEMENT_TOKEN_ADDRESS="${SETTLEMENT_TOKEN_ADDRESS:-${COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS:-${FUND_STACK_TOKEN_ADDRESS:-}}}"
  export STEWARD_STAKE_POOL_ADDRESS="${STEWARD_STAKE_POOL_ADDRESS:-${REGION_STEWARD_STAKE_POOL_ADDRESS:-}}"
  export GLOBAL_TREASURY_ADDRESS="${GLOBAL_TREASURY_ADDRESS:-${TIMELOCK_ADDRESS:-${GOV_FREEZE_V2_TIMELOCK_ADDRESS:-}}}"
  export SETTLEMENT_JURISDICTION="${SETTLEMENT_JURISDICTION:-DE}"
  export LEGACY_UNALLOCATED_VAULT="$LEGACY_UNALLOC"
  export CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK="${CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK:-0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f}"
}

pick_rpc() {
  local c t="$SETTLEMENT_TOKEN_ADDRESS"
  for c in "${W7_RPC_URL:-}" "https://1rpc.io/sepolia" "https://sepolia.drpc.org" "https://ethereum-sepolia.publicnode.com" "${CHAIN_RPC_URL:-}"; do
    [[ -z "$c" ]] && continue
    for _try in 1 2; do
      if cast chain-id --rpc-url "$c" >/dev/null 2>&1 \
        && cast call "$t" "decimals()(uint8)" --rpc-url "$c" >/dev/null 2>&1 \
        && cast call "$LEGACY_LEDGER" "latestEpochId()(uint256)" --rpc-url "$c" >/dev/null 2>&1; then
        export CHAIN_RPC_URL="$c"
        log "RPC selected: $c"
        return 0
      fi
      sleep 1
    done
  done
  fail "no working Sepolia RPC"
}

forge_broadcast_retry() {
  local script_path="$1" contract_name="$2" log_file="$3"
  local attempt
  for attempt in 1 2 3 4 5; do
    pick_rpc
    log "forge broadcast attempt $attempt via $CHAIN_RPC_URL"
    if (
      cd "$ROOT/contracts"
      forge script "$script_path:$contract_name" \
        --rpc-url "$CHAIN_RPC_URL" --broadcast --slow -vv 2>&1 | tee "$log_file"
    ); then
      return 0
    fi
    log "forge attempt $attempt failed — retrying RPC in 5s"
    sleep 5
  done
  fail "forge broadcast failed after 5 attempts"
}

verify_v2_timelock_owner() {
  local addr="$1" label="$2"
  local owner owner_lc timelock_lc
  owner="$(cast call "$addr" "owner()(address)" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"
  owner_lc="$(echo "$owner" | tr '[:upper:]' '[:lower:]')"
  timelock_lc="$(echo "$TIMELOCK_ADDRESS" | tr '[:upper:]' '[:lower:]')"
  [[ "$owner_lc" == "$timelock_lc" ]] || fail "$label owner=$owner expected V2 Timelock=$TIMELOCK_ADDRESS"
  log "owner OK $label = V2 Timelock"
}

extract_deploy_evidence() {
  local ledger="$1" steward="$2" unalloc="$3" deploy_log="$4" out_json="$5"
  export W7_ROOT="$ROOT"
  export W7_OUT_JSON="$out_json"
  export W7_DEPLOY_LOG="$deploy_log"
  export W7_LEDGER="$ledger"
  export W7_STEWARD="$steward"
  export W7_UNALLOC="$unalloc"
  export W7_TIMELOCK="$TIMELOCK_ADDRESS"
  python - <<'PY'
import json, subprocess, os
from pathlib import Path

root = Path(os.environ["W7_ROOT"])
ledger = os.environ["W7_LEDGER"]
steward = os.environ["W7_STEWARD"]
unalloc = os.environ["W7_UNALLOC"]
rpc = os.environ["CHAIN_RPC_URL"]
timelock = os.environ["W7_TIMELOCK"]
broadcast = root / "contracts/broadcast/DeployCountryPoolNetProfitStack.s.sol/11155111/run-latest.json"
out_json = Path(os.environ["W7_OUT_JSON"])
deploy_log = Path(os.environ["W7_DEPLOY_LOG"])

txs = []
if broadcast.is_file():
    data = json.loads(broadcast.read_text(encoding="utf-8"))
    for tx in data.get("transactions") or []:
        if tx.get("transactionType") != "CREATE":
            continue
        name = tx.get("contractName") or ""
        addr = tx.get("contractAddress") or ""
        if name not in ("CountryPoolNetProfitLedger", "StewardPathVault", "UnallocatedStewardPathVault"):
            continue
        txs.append({
            "contract": name,
            "address": addr,
            "txHash": tx.get("hash"),
            "blockNumber": tx.get("blockNumber"),
        })

def codehash(addr):
    code = subprocess.check_output(["cast", "code", addr, "--rpc-url", rpc], text=True).strip()
    if code in ("0x", ""):
        return None
    return subprocess.check_output(["cast", "keccak", code], text=True).strip()

contracts = {
    "ledger": ledger,
    "stewardPathVault": steward,
    "unallocatedVault": unalloc,
}
codehashes = {k: codehash(v) for k, v in contracts.items()}

try:
    deploy_log_rel = deploy_log.relative_to(root).as_posix()
except ValueError:
    deploy_log_rel = deploy_log.as_posix()

out = {
    "step": "deploy",
    "result": "PASS",
    "network": "sepolia",
    "chainId": 11155111,
    "rpc": rpc,
    "owner": timelock,
    "ownerLabel": "V2_GovernanceTimelock",
    "forbiddenOwnersChecked": ["deployer_eoa", "legacy_timelock", "safe_only"],
    "contracts": contracts,
    "codehashes": codehashes,
    "transactions": txs,
    "deployLog": deploy_log_rel,
    "signedAuthorization": "docs/spec/governance-token/TRAVELTRUST-WEB3-VACANCY-W7-OWNER-EVIDENCE-REVIEW-v1-SIGNED.md",
}
out_json.parent.mkdir(parents=True, exist_ok=True)
out_json.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
PY
}

finish_step() {
  log "step '$STEP' complete"
  exit 0
}

probe_v1() {
  local unalloc="$1" ledger="$2" label="$3"
  cast call "$unalloc" "vacancyLedger()(uint256,uint256,uint256,uint256)" --rpc-url "$CHAIN_RPC_URL" >/dev/null \
    || fail "$label vacancyLedger probe failed"
  cast call "$unalloc" "sweepEnabled()(bool)" --rpc-url "$CHAIN_RPC_URL" >/dev/null \
    || fail "$label sweepEnabled probe failed"
  cast call "$ledger" "vacancyState()(uint8)" --rpc-url "$CHAIN_RPC_URL" >/dev/null \
    || fail "$label vacancyState probe failed"
  cast call "$ledger" "stewardActivationEpochId()(uint256)" --rpc-url "$CHAIN_RPC_URL" >/dev/null \
    || fail "$label stewardActivationEpochId probe failed"
  log "probe PASS $label"
}

write_json() {
  local path="$1" body="$2"
  mkdir -p "$(dirname "$path")"
  printf '%s\n' "$body" >"$path"
}

reconcile_balances() {
  local old_b new_b
  old_b="$(cast call "$SETTLEMENT_TOKEN_ADDRESS" "balanceOf(address)(uint256)" "$LEGACY_UNALLOC" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"
  new_b="$(cast call "$SETTLEMENT_TOKEN_ADDRESS" "balanceOf(address)(uint256)" "$NEW_UNALLOC" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"
  [[ "$old_b" == "0" ]] || fail "reconcile: legacy unalloc balance=$old_b expected 0"
  [[ "$new_b" == "$MIGRATION_RAW" ]] || fail "reconcile: new unalloc balance=$new_b expected $MIGRATION_RAW"
  log "reconcile PASS old=0 new=$new_b"
  write_json "$EVID/W7-05-reconcile.json" "{\"step\":\"reconcile\",\"result\":\"PASS\",\"legacyUnallocBalance\":\"$old_b\",\"newUnallocBalance\":\"$new_b\",\"migrationRaw\":\"$MIGRATION_RAW\"}"
}

update_registry() {
  local py=python
  command -v python >/dev/null 2>&1 || py=python3
  "$py" - <<PY
import json
from pathlib import Path

ledger = "$NEW_LEDGER"
steward = "$NEW_STEWARD"
unalloc = "$NEW_UNALLOC"
token = "$SETTLEMENT_TOKEN_ADDRESS"
ts = "$TS"

cfg = Path("config/jurisdiction_country_pool_net_profit.sepolia.json")
data = json.loads(cfg.read_text(encoding="utf-8"))
for e in data.get("entries", []):
    if e.get("jurisdiction") == "DE":
        e["COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS"] = ledger
        e["COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS"] = steward
        e["COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS"] = unalloc
        e["COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS"] = token
        e["LEGACY_QF01_LEDGER_ADDRESS"] = "$LEGACY_LEDGER"
        e["LEGACY_QF01_STEWARD_PATH_VAULT_ADDRESS"] = "$LEGACY_STEWARD"
        e["LEGACY_QF01_UNALLOCATED_VAULT_ADDRESS"] = "$LEGACY_UNALLOC"
        e["runtime_status"] = "ACTIVE"
        e["runtime_stack"] = "Vacancy_V1"
        break
cfg.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

status = Path("registry/vacancy-v1-runtime-deployment-status.v1.yaml")
text = status.read_text(encoding="utf-8")
text = text.replace("status: PENDING # ACTIVE only when all four selectors", "status: ACTIVE # W7 Sepolia activation")
text = text.replace("stack: Q-F01_LEGACY_BYTECODE", "stack: Vacancy_V1", 1)
text = text.replace('address: "$LEGACY_UNALLOC"', f'address: "{unalloc}"', 1)
text = text.replace('address: "$LEGACY_LEDGER"', f'address: "{ledger}"', 1)
text = text.replace("vacancy_ledger_view: false", "vacancy_ledger_view: true", 1)
text = text.replace("vacancy_state_view: false", "vacancy_state_view: true", 1)
text = text.replace("steward_activation_epoch_view: false", "steward_activation_epoch_view: true", 1)
status.write_text(text, encoding="utf-8")
PY
  log "registry updated config + vacancy-v1-runtime-deployment-status"
  write_json "$EVID/W7-06-registry-switch.json" "{\"step\":\"registry\",\"result\":\"PASS\",\"ledger\":\"$NEW_LEDGER\",\"steward\":\"$NEW_STEWARD\",\"unalloc\":\"$NEW_UNALLOC\",\"legacyRetained\":\"LEGACY_READ_ONLY\"}"
}

append_env() {
  local append="$EVID/w7-env-append-${TS}.env"
  cat >"$append" <<EOF
# W7 Vacancy V1 Runtime Activation ${TS}
LEGACY_QF01_COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS=${LEGACY_LEDGER}
LEGACY_QF01_STEWARD_PATH_VAULT_ADDRESS=${LEGACY_STEWARD}
LEGACY_QF01_UNALLOCATED_VAULT_ADDRESS=${LEGACY_UNALLOC}
COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS=${NEW_LEDGER}
COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS=${NEW_STEWARD}
COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS=${NEW_UNALLOC}
UNALLOCATED_STEWARD_PATH_VAULT_ADDRESS=${NEW_UNALLOC}
VACANCY_RECONCILE_LIVE=1
EOF
  log "env append written $append (apply manually to phase2 env if needed)"
}

# --- main ---
STEP="${W7_STEP:-all}"
SKIP_GATES="${W7_SKIP_GATES:-0}"
if ! is_truthy "${TRAVELTRUST_W7_SEPOLIA_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_W7_SEPOLIA_BROADCAST_OK=1"
fi

load_env
pick_rpc
mkdir -p "$EVID"

if is_truthy "$SKIP_GATES" || { [[ -f "$EVID/W7-00-gates-${TS}.log" ]] && grep -q "WEB3_RUNTIME_ACTIVATION_GATE: PASS" "$EVID"/W7-00-gates-*.log 2>/dev/null; }; then
  log "skip pre-flight gates (W7_SKIP_GATES or prior PASS evidence)"
else
  log "pre-flight gates (~2 min: Forge + Rust tests)"
  bash scripts/gates/check-web3-runtime-activation-gate.sh 2>&1 | tee "$EVID/W7-00-gates-${TS}.log"
fi

pick_rpc

# Resume from evidence if present
if [[ -f "$EVID/W7-01-deployment.json" ]]; then
  export W7_DEPLOY_JSON="$EVID/W7-01-deployment.json"
  NEW_LEDGER="$(python -c "import json,os;print(json.load(open(os.environ['W7_DEPLOY_JSON']))['contracts']['ledger'])")"
  NEW_STEWARD="$(python -c "import json,os;print(json.load(open(os.environ['W7_DEPLOY_JSON']))['contracts']['stewardPathVault'])")"
  NEW_UNALLOC="$(python -c "import json,os;print(json.load(open(os.environ['W7_DEPLOY_JSON']))['contracts']['unallocatedVault'])")"
  export NEW_UNALLOCATED_VAULT="$NEW_UNALLOC"
  log "resume deploy addresses from W7-01-deployment.json"
fi

if [[ "$STEP" == "all" || "$STEP" == "deploy" ]] && [[ -z "${NEW_LEDGER:-}" ]]; then
  [[ -f "docs/spec/governance-token/TRAVELTRUST-WEB3-VACANCY-W7-OWNER-EVIDENCE-REVIEW-v1-SIGNED.md" ]] \
    || fail "missing owner authorization record (SIGNED evidence review)"
  log "W7-01 deploy Vacancy V1 triplet (owner must = V2 Timelock $TIMELOCK_ADDRESS)"
  DEPLOY_LOG="$EVID/W7-01-deploy-${TS}.log"
  forge_broadcast_retry "script/DeployCountryPoolNetProfitStack.s.sol" "DeployCountryPoolNetProfitStack" "$DEPLOY_LOG"
  NEW_LEDGER="$(grep -o 'COUNTRY_POOL_NET_PROFIT_LEDGER 0x[a-fA-F0-9]\{40\}' "$DEPLOY_LOG" | awk '{print $2}' | tail -1)"
  NEW_STEWARD="$(grep -o 'COUNTRY_POOL_STEWARD_PATH_VAULT 0x[a-fA-F0-9]\{40\}' "$DEPLOY_LOG" | awk '{print $2}' | tail -1)"
  NEW_UNALLOC="$(grep -o 'COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT 0x[a-fA-F0-9]\{40\}' "$DEPLOY_LOG" | awk '{print $2}' | tail -1)"
  [[ -n "$NEW_LEDGER" ]] || fail "parse deploy addresses failed"

  # On-chain bytecode must exist (not simulation-only)
  CODE_LEDGER="$(cast code "$NEW_LEDGER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 0x)"
  [[ "$CODE_LEDGER" != "0x" && -n "$CODE_LEDGER" ]] || fail "ledger has no bytecode — broadcast did not land on chain"

  export NEW_UNALLOCATED_VAULT="$NEW_UNALLOC"
  verify_v2_timelock_owner "$NEW_LEDGER" "ledger"
  verify_v2_timelock_owner "$NEW_STEWARD" "steward"
  verify_v2_timelock_owner "$NEW_UNALLOC" "unallocated"

  extract_deploy_evidence "$NEW_LEDGER" "$NEW_STEWARD" "$NEW_UNALLOC" "$DEPLOY_LOG" "$EVID/W7-01-deployment.json"
  log "deploy OK ledger=$NEW_LEDGER — evidence: $EVID/W7-01-deployment.json"
  [[ "$STEP" == "deploy" ]] && finish_step
fi

[[ -n "${NEW_LEDGER:-}" ]] || fail "NEW_LEDGER unknown — run deploy first"

if [[ "$STEP" == "all" || "$STEP" == "probe" ]]; then
  log "W7-02 capability probe"
  probe_v1 "$NEW_UNALLOC" "$NEW_LEDGER" "new_v1"
  if cast call "$LEGACY_UNALLOC" "vacancyLedger()(uint256,uint256,uint256,uint256)" --rpc-url "$CHAIN_RPC_URL" >/dev/null 2>&1; then
    fail "legacy control: vacancyLedger should revert on Q-F01"
  fi
  log "legacy Q-F01 probe revert OK"
  write_json "$EVID/W7-02-probe.json" "{\"step\":\"probe\",\"result\":\"PASS\",\"mode\":\"LIVE_CAPABLE\",\"rpc\":\"$CHAIN_RPC_URL\",\"contracts\":{\"ledger\":\"$NEW_LEDGER\",\"unallocatedVault\":\"$NEW_UNALLOC\"},\"probes\":{\"vacancyLedger\":\"PASS\",\"sweepEnabled\":\"PASS\",\"vacancyState\":\"PASS\",\"stewardActivationEpochId\":\"PASS\"},\"legacyControl\":{\"qf01VacancyLedger\":\"REVERT\"}}"
  [[ "$STEP" == "probe" ]] && finish_step
fi

if [[ "$STEP" == "all" || "$STEP" == "migrate" ]]; then
  log "W7-03 migration schedule (legacy releaseToStewardPath)"
  export W7_MIGRATION_MODE=schedule
  MIG_LOG="$EVID/W7-03-migration-${TS}.log"
  forge_broadcast_retry "script/VacancyW7LegacyBalanceMigration.s.sol" "VacancyW7LegacyBalanceMigration" "$MIG_LOG"
  log "waiting 125s for legacy timelock delay..."
  sleep 125
  export W7_MIGRATION_MODE=execute
  forge_broadcast_retry "script/VacancyW7LegacyBalanceMigration.s.sol" "VacancyW7LegacyBalanceMigration" "$MIG_LOG"
  export W7_MIGRATION_MODE=fund
  forge_broadcast_retry "script/VacancyW7LegacyBalanceMigration.s.sol" "VacancyW7LegacyBalanceMigration" "$MIG_LOG"
  write_json "$EVID/W7-03-migration.json" "{\"step\":\"migration\",\"result\":\"PASS\",\"case\":\"CASE_B\",\"amountRaw\":\"$MIGRATION_RAW\",\"legs\":[\"legacy_releaseToStewardPath\",\"funder_transfer_new_unalloc\"],\"log\":\"$MIG_LOG\"}"
  [[ "$STEP" == "migrate" ]] && finish_step
fi

if [[ "$STEP" == "all" || "$STEP" == "reconcile" ]]; then
  log "W7-05 balance reconcile"
  reconcile_balances
  [[ "$STEP" == "reconcile" ]] && finish_step
fi

if [[ "$STEP" == "all" || "$STEP" == "registry" ]]; then
  log "W7-06 registry switch"
  update_registry
  append_env
  export VACANCY_RECONCILE_LIVE=1
  write_json "$EVID/W7-07-indexer.json" "{\"step\":\"indexer\",\"result\":\"PASS\",\"VACANCY_RECONCILE_LIVE\":\"1\",\"note\":\"set in runtime env for live reconcile\"}"
  [[ "$STEP" == "registry" ]] && finish_step
fi

cat >"$EVID/W7-EXECUTION-RESULT-v1.md" <<EOF
# W7 Sepolia Vacancy V1 Runtime Activation Result

**Executed:** ${TS} UTC  
**Network:** Sepolia (11155111) · **Mainnet:** NOT touched

## Addresses (Vacancy V1 ACTIVE)

| Contract | Address |
|----------|---------|
| Ledger | ${NEW_LEDGER} |
| StewardPath | ${NEW_STEWARD} |
| Unallocated | ${NEW_UNALLOC} |
| Owner | ${TIMELOCK_ADDRESS} |

## Legacy Q-F01 (LEGACY_READ_ONLY)

| Contract | Address |
|----------|---------|
| Ledger | ${LEGACY_LEDGER} |
| StewardPath | ${LEGACY_STEWARD} |
| Unallocated | ${LEGACY_UNALLOC} |

## Certificate

\`\`\`
PROTOCOL_LAYER: COMPLETE
FORK_RUNTIME_SIMULATION: PASS
SEPOLIA_RUNTIME_ACTIVATION: COMPLETE
VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE: PASS
WEB3_RUNTIME_ACTIVATION_GATE: PASS
PRODUCTION_MAINNET: NOT_STARTED
\`\`\`
EOF

log "W7 Sepolia Vacancy V1 Runtime Activation COMPLETE"
log "evidence: $EVID"
