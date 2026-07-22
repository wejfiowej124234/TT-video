#!/usr/bin/env bash
# Candidate v2 · Settlement Timelock finalize (post-ETA) + L5 Runtime Final Evidence
#
# Refuses until block.timestamp >= settlement ETA (172800s delay).
# Writes ONLY under evidence/GO_fg15_observation_48h_candidate_v2/
# FORBIDDEN: Hard Gate flip · PSG Recalculate · FG-15-A mutation · mainnet
#
#   export TRAVELTRUST_WEB3_CANDIDATE_V2_SEPOLIA_DEPLOY_OK=1
#   bash scripts/dev/run-web3-candidate-v2-settlement-finalize.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/web3-phase-boundary.sh
source "$ROOT/scripts/dev/lib/web3-phase-boundary.sh"
# shellcheck source=scripts/dev/lib/web3-candidate-v2-mainline.sh
source "$ROOT/scripts/dev/lib/web3-candidate-v2-mainline.sh"
web3_mainline_refuse_fg15_a_as_active "settlement-finalize" || exit $?

ENV_FILE="${WEB3_CANDIDATE_V2_DEPLOY_ENV:-${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}}"
OPS_JSON="${CAND_MP_OPS_JSON:-$ROOT/evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json}"
EVID_ROOT="$ROOT/evidence/GO_fg15_observation_48h_candidate_v2"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$EVID_ROOT/money-path/finalize-${TS}"
SEPOLIA_CHAIN_ID=11155111

fail() { echo "cand-v2-settle-fin: FAIL $*" >&2; exit 2; }
ok() { echo "cand-v2-settle-fin: OK $*"; }
warn() { echo "cand-v2-settle-fin: WAIT $*" >&2; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

is_truthy "${TRAVELTRUST_WEB3_CANDIDATE_V2_SEPOLIA_DEPLOY_OK:-}" || fail "OWNER_OK!=1"
[[ -f "$ENV_FILE" ]] || fail "missing env"
[[ -f "$OPS_JSON" ]] || fail "missing ops standby JSON: $OPS_JSON"

load_env() {
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"; val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$ENV_FILE"
}
load_env
export TRAVELTRUST_WEB3_CANDIDATE_V2_SEPOLIA_DEPLOY_OK=1

CID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL")"
[[ "$CID" == "$SEPOLIA_CHAIN_ID" ]] || fail "not Sepolia chain_id=$CID"
web3_refuse_mainnet_broadcast_unless_phase3 "$CID" "cand-v2-settle-fin" || fail "mainnet refused"

# Load ops + ETA gate
eval "$(node - "$OPS_JSON" <<'NODE'
const fs=require('fs');
const j=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const eta=Number(j.settlement_eta_unix);
const now=Math.floor(Date.now()/1000);
console.log(`ETA=${eta}`);
console.log(`NOW=${now}`);
console.log(`REMAINING=${eta-now}`);
if (now < eta) {
  console.log('ETA_PASSED=0');
} else {
  console.log('ETA_PASSED=1');
}
const toHex=d=>'0x'+BigInt(d).toString(16).padStart(64,'0');
console.log(`export CAND_MP_OP_READY=${toHex(j.ops.op_ready_decimal)}`);
console.log(`export CAND_MP_OP_DISTABLE=${toHex(j.ops.op_distable_decimal)}`);
console.log(`export CAND_MP_OP_DISTRIBUTE=${toHex(j.ops.op_distribute_decimal)}`);
console.log(`export CAND_MP_ORDER_HAPPY=${j.order_happy_uint}`);
NODE
)"

if [[ "${ETA_PASSED:-0}" != "1" ]]; then
  warn "Timelock ETA not reached — remaining=${REMAINING}s (eta_utc from standby JSON)"
  warn "Hard Gate stays REFUSED · PSG Recalculate FORBIDDEN · FG-15-B still RUNNING"
  warn "Re-run this script after ETA=${ETA}"
  exit 3
fi

ok "ETA passed — executing Settlement finalize on Sepolia"
mkdir -p "$EVID"
LOG="$EVID/settlement-finalize-broadcast.log"

(
  cd "$ROOT/contracts"
  forge script script/ExecuteCandidateV2SettlementTimelock.s.sol:ExecuteCandidateV2SettlementTimelock \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --slow \
    -vv 2>&1
) | tee "$LOG"

grep -q "CANDIDATE_V2_SETTLEMENT_FINALIZE.*OK" "$LOG" || fail "finalize marker missing"

node - "$EVID/CANDIDATE-V2-LIVE-MONEY-PATH-L5-RUNTIME-FINAL-LATEST.json" \
  "$TS" "$SETTLEMENT_ROUTER_ADDRESS" "$ESCROW_FACTORY_V2_ADDRESS" <<'NODE'
const fs=require('fs');
const [out, ts, sr, factory]=process.argv.slice(2);
const prevPath='evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-LIVE-MONEY-PATH-L5-RUNTIME-LATEST.json';
let prev={};
try { prev=JSON.parse(fs.readFileSync(prevPath,'utf8')); } catch {}
const body={
  schema:'traveltrust.web3_candidate_v2_live_money_path_l5_runtime_final.v1',
  recorded_utc: ts,
  track_id:'FG-15-B',
  candidate_id:'WEB3-CANDIDATE-V2-FUND-SAFETY-P0',
  chain_id:'11155111',
  hard_gate:'CUTOVER_REFUSED',
  real_eth_wave:'FORBIDDEN',
  psg_recalculate:'BLOCKED_UNTIL_FG15_B_ELAPSED',
  prior: prev,
  settlement_finalize:{
    status:'PASS',
    flow:'Timelock.execute(markReady→markDistributable→distribute)',
    settlement_router: sr,
    escrow_factory_v2: factory
  },
  verdict:'L5_RUNTIME_FINAL_GO',
  note:'Settlement Distributed on-chain. Still wait FG-15-B ELAPSED before Web3 L5 Cert / PSG Recalculate.'
};
fs.writeFileSync(out, JSON.stringify(body,null,2)+'\n');
fs.copyFileSync(out, 'evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-LIVE-MONEY-PATH-L5-RUNTIME-FINAL-LATEST.json');
console.log('wrote', out);
NODE

ok "L5 Runtime Final Evidence written"
ok "Hard Gate REFUSED · no PSG Recalculate · wait FG-15-B ELAPSED"
exit 0
