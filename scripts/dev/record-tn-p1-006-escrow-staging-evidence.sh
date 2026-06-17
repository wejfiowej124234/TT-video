#!/usr/bin/env bash
# TN-P1-006 · WEB3-P2-003 · Sepolia Escrow 全链验证（② · 仅 ops · 无新业务）
#
# create → fund → release + refund(独立 escrow) → indexer-tick/reconcile → 证据
#
#   export STAGING_API_BASE=https://tt-api-staging.fly.dev
#   bash scripts/dev/record-tn-p1-006-escrow-staging-evidence.sh
#
# 须 .env：B407_TRAVELER_PK · B407_GUIDE_PK · B407_FACTORY_DEPLOYER_PK
# 须 scripts/dev/.env.staging-onboarding.local：INTERNAL_API_SECRET · Sepolia 合约地址
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-006-escrow-${STAMP}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API="${STAGING_API%/}"
RPC="${P2B407_RPC_URL:-${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}}"

merge_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    export "$key=$val"
  done < "$f"
}

merge_env "$ROOT/.env"
merge_env "$ROOT/scripts/dev/.env.staging-onboarding.local"

# Staging /meta SSOT（覆盖 .env 里 Anvil 地址）
export CHAIN_RPC_URL="$RPC"
export P2B407_RPC_URL="$RPC"
export ESCROW_FACTORY_ADDRESS="${ESCROW_FACTORY_ADDRESS:-0xbf746B6a330e61416c6D87aB9b0758f7107C8006}"
export FEE_ROUTER_ADDRESS="${FEE_ROUTER_ADDRESS:-0x81A8009210c5215100564c6E4123F672c4459306}"
export FUND_STACK_TOKEN_ADDRESS="${FUND_STACK_TOKEN_ADDRESS:-0x241948bE49a778490c8A4Ae8D98b7537fE001f63}"
export PAYMENT_TOKEN="${PAYMENT_TOKEN:-$FUND_STACK_TOKEN_ADDRESS}"
export STAGING_API_BASE="$STAGING_API"
export API_BASE="$STAGING_API"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1,publicnode.com"

STEPS="$EVID/steps"
export P2B407_EVID_ROOT="$STEPS"

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_006_ESCROW_EVIDENCE: START ${STAMP}"
echo "api=${STAGING_API} rpc=${RPC}"

echo ""
echo "== Step 0: preflight (Sepolia keys + /meta 对拍) =="
bash "$ROOT/scripts/dev/check-phase2-web3-p2-003-b407-preflight.sh" | tee "$EVID/preflight.log"

meta_file="$(mktemp)"
curl --noproxy "*" -sS --max-time 25 "${STAGING_API}/meta" >"$meta_file"
node -e "
const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
const c=j.chain?.contracts||{};
const exp={factory:process.env.ESCROW_FACTORY_ADDRESS?.toLowerCase(), fee:process.env.FEE_ROUTER_ADDRESS?.toLowerCase()};
const got={factory:String(c.escrow_factory_address||'').toLowerCase(), fee:String(c.fee_router_address||'').toLowerCase(), chain_id:String(j.chain?.chain_id||'')};
if(got.chain_id!=='11155111'){console.error('FAIL chain_id',got.chain_id);process.exit(1);}
if(exp.factory!==got.factory||exp.fee!==got.fee){console.error('FAIL meta mismatch',exp,got);process.exit(1);}
console.log('meta-chain-ok',JSON.stringify(got));
" "$meta_file" | tee "$EVID/meta-alignment.json"
cp "$meta_file" "$EVID/staging-meta.json"
rm -f "$meta_file"

echo ""
echo "== Step 1: WEB3-P2-003 sprint (create → fund → indexer sync) =="
P2B407_SKIP_PRA=1 bash "$ROOT/scripts/dev/record-phase2-web3-p2-003-b407-sprint-evidence.sh" \
  2>&1 | tee "$EVID/sprint-record.log"

grep -q "TT_PHASE2_WEB3_P2_003_B407_SPRINT_EVIDENCE: OK" "$EVID/sprint-record.log"

SPRINT_STEPS="$(ls -dt "$ROOT/frontend/evidence/GO_phase2_web3_p2_003_b407_sprint"/steps-* 2>/dev/null | head -1)"
[[ -n "$SPRINT_STEPS" && -f "$SPRINT_STEPS/SUMMARY.json" ]] || {
  echo "FAIL: missing sprint SUMMARY.json" >&2
  exit 2
}
cp -r "$SPRINT_STEPS" "$EVID/sprint-steps"
ln -sfn "$(basename "$EVID/sprint-steps")" "$EVID/sprint-steps-latest" 2>/dev/null || true

ESCROW_ADDR="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).escrow_address)" "$EVID/sprint-steps/SUMMARY.json")"
ORDER_ID="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).order_id)" "$EVID/sprint-steps/SUMMARY.json")"
DEPOSIT_TX="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).deposit_tx||'')" "$EVID/sprint-steps/SUMMARY.json")"

echo ""
echo "== Step 2: on-chain release (Funded → Completed) =="
export B407_ESCROW_ADDRESS="$ESCROW_ADDR"
export B407_ESCROW="$ESCROW_ADDR"
export B407_FEE_ROUTER="$FEE_ROUTER_ADDRESS"
export B407_RPC_URL="$RPC"
export B407_RELAYER_PK="${B407_RELAYER_PK:-${B407_FACTORY_DEPLOYER_PK:-}}"
export B407_SKIP_DISTRIBUTE=1
export B407_TX_RECORD_JSON="$EVID/release-tx.json"
bash "$ROOT/scripts/ops/b407-exec-chain-release-distribute.sh" | tee "$EVID/release.log"

REL_ST="$(cast call "$ESCROW_ADDR" "status()(uint8)" --rpc-url "$RPC" | tr -d '\r\n' | awk '{print $1}')"
[[ "$REL_ST" == "3" ]] || { echo "FAIL: expected Escrow status Completed(3) got ${REL_ST}" >&2; exit 2; }
echo "release_status=${REL_ST}" | tee "$EVID/release-status.txt"

echo ""
echo "== Step 3: refund terminal (独立 escrow · on-chain only) =="
# shellcheck source=scripts/dev/lib/phase2-web3-p2-003-b407-lib.sh
source "$ROOT/scripts/dev/lib/phase2-web3-p2-003-b407-lib.sh"
p2b407_preflight_chain_keys
REFUND_ORDER_ID="$(node -e "console.log(crypto.randomUUID())")"
REFUND_ORDER_B32="$(p2b407_order_uuid_to_bytes32 "$REFUND_ORDER_ID")"
REFUND_AMT="$(p2b407_amount_wei "${B407_ORDER_AMOUNT:-100}")"
REFUND_ESCROW="$(p2b407_create_escrow_on_chain "$REFUND_ORDER_ID" "$REFUND_ORDER_B32" "$REFUND_AMT")"
p2b407_deposit_real_token "$REFUND_ESCROW" "$REFUND_AMT"
REFUND_TX="$(cast send "$REFUND_ESCROW" "refund()" --rpc-url "$RPC" --private-key "${P2B407_TRAVELER_PK}" --json 2>&1 | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(s).transactionHash||'')}catch{}})")"
[[ -n "$REFUND_TX" ]] || { echo "FAIL: refund tx" >&2; exit 2; }
REF_ST="$(cast call "$REFUND_ESCROW" "status()(uint8)" --rpc-url "$RPC" | tr -d '\r\n' | awk '{print $1}')"
[[ "$REF_ST" == "4" ]] || { echo "FAIL: expected Refunded(4) got ${REF_ST}" >&2; exit 2; }
node -e "console.log(JSON.stringify({order_id:process.argv[1],escrow:process.argv[2],refund_tx:process.argv[3],status:4,honest_boundary:'on-chain refund leg without API order bind'},null,2))" \
  "$REFUND_ORDER_ID" "$REFUND_ESCROW" "$REFUND_TX" >"$EVID/refund-leg.json"

echo ""
echo "== Step 4: indexer-tick + reconcile (staging) =="
SEC="${INTERNAL_API_SECRET:-}"
if [[ -n "$SEC" ]]; then
  curl --noproxy "*" -sS -X POST \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${SEC}" \
    -d '{}' \
    "${STAGING_API}/api/v1/internal/indexer-tick" | tee "$EVID/indexer-tick.json"
  echo ""
  curl --noproxy "*" -sS -X POST \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${SEC}" \
    -d '{"persist":false}' \
    "${STAGING_API}/api/v1/internal/indexer-reconcile" | tee "$EVID/indexer-reconcile.json"
else
  echo "WARN: INTERNAL_API_SECRET unset — skip indexer internal calls" | tee "$EVID/indexer-skip.txt"
fi

node -e "
const fs=require('fs');
const summary={
  schema:'tn_p1_006_escrow_staging.v1',
  stamp:process.argv[1],
  phase:'② testnet',
  api:process.argv[2],
  rpc:process.argv[3],
  order_id:process.argv[4],
  escrow_address:process.argv[5],
  deposit_tx:process.argv[6],
  release_tx:JSON.parse(fs.readFileSync(process.argv[7],'utf8')).release_tx_hash||null,
  refund_leg:JSON.parse(fs.readFileSync(process.argv[8],'utf8')),
  release_gate:'GO',
  honest_boundary:'Sepolia MockERC20 fund track · create+fund+release(API corridor)+refund(on-chain leg) · ≠ ③ mainnet USDC'
};
fs.writeFileSync(process.argv[9], JSON.stringify(summary,null,2)+'\n');
" "$STAMP" "$STAGING_API" "$RPC" "$ORDER_ID" "$ESCROW_ADDR" "$DEPOSIT_TX" \
  "$EVID/release-tx.json" "$EVID/refund-leg.json" "$EVID/report.json"

cat >"$EVID/STATUS.txt" <<EOF
status: PASS
phase: ②
artifact: TN-P1-006 WEB3-P2-003
at: ${STAMP}
release_gate: GO
EOF

echo ""
echo "TT_TN_P1_006_ESCROW_EVIDENCE: PASS ${STAMP}"
echo "evidence: ${EVID}"
