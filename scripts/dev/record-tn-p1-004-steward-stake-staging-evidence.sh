#!/usr/bin/env bash
# TN-P1-004 · Sepolia Stake 主链验证（② · ops · 无新业务）
# LEGACY · READ-ONLY — 默认 TTG fallback 为 Pre–GovFreeze-V2；ACTIVE: .env.phase2-chain-deploy.local
#
# 只读（live Sepolia RPC）+ staging API + 写路径等价烟测（Sepolia state fork）
#
#   export STAGING_API_BASE=https://tt-api-staging.fly.dev
#   bash scripts/dev/record-tn-p1-004-steward-stake-staging-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-004-steward-stake-${STAMP}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API="${STAGING_API%/}"
RPC="${STEWARD_RPC_URL:-${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}}"

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
    [[ -n "${!key:-}" ]] && continue
    export "$key=$val"
  done < "$f"
}

merge_env "$ROOT/.env"
merge_env "$ROOT/scripts/dev/.env.staging-onboarding.local"

# Staging /meta SSOT（覆盖 LEGACY 默认池/TTG 地址）
meta_contracts="$(curl --noproxy "*" -sS --max-time 45 "${STAGING_API}/meta" | node -e "
let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{
  const m=JSON.parse(s); const c=m.chain?.contracts||{};
  process.stdout.write(JSON.stringify({pool:c.region_steward_stake_pool_address,ttg:c.governance_token_address}));
});")"
POOL_META="$(node -e "const j=JSON.parse(process.argv[1]);process.stdout.write(j.pool||'');" "$meta_contracts")"
TTG_META="$(node -e "const j=JSON.parse(process.argv[1]);process.stdout.write(j.ttg||'');" "$meta_contracts")"
merge_env "$ROOT/scripts/dev/.env.phase2-chain-deploy.local"

POOL="${REGION_STEWARD_STAKE_POOL_ADDRESS:-0x16F914f3D50f7Aa02665589e715F94CA3b7Ab47c}"
TTG="${STEWARD_TTG_ADDRESS:-${GOVERNANCE_TOKEN_ADDRESS:-0xaC2E29AC7089e4863C21dAF232cF8bbb025d91ca}}"  # LEGACY TTG fallback
[[ -n "$POOL_META" ]] && POOL="$POOL_META"
[[ -n "$TTG_META" ]] && TTG="$TTG_META"
export REGION_STEWARD_STAKE_POOL_ADDRESS="$POOL"
export GOVERNANCE_TOKEN_ADDRESS="$TTG"
export STEWARD_TTG_ADDRESS="$TTG"

export CHAIN_RPC_URL="$RPC"
export STAGING_API_BASE="$STAGING_API"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1,publicnode.com"

export CHAIN_ID="${CHAIN_ID:-11155111}"

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_004_STEWARD_STAKE_EVIDENCE: START ${STAMP}"
echo "api=${STAGING_API} rpc=${RPC}"

echo ""
echo "== Step 0: live Sepolia preflight =="
CID="$(cast chain-id --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n' || true)"
if [[ "$CID" != "11155111" ]]; then
  CID="$(curl --noproxy "*" -sS --max-time 45 -X POST "$RPC" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);process.stdout.write(parseInt(j.result||'0x0',16).toString())})")"
fi
[[ "$CID" == "11155111" ]] || { echo "FAIL chain_id $CID" >&2; exit 2; }
POOL_CODE="$(cast code "$POOL" --rpc-url "$RPC" 2>/dev/null | tr -d ' \n' || true)"
if [[ -z "$POOL_CODE" || "$POOL_CODE" == "0x" ]]; then
  POOL_CODE="$(curl --noproxy "*" -sS --max-time 45 -X POST "$RPC" \
    -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"${POOL}\",\"latest\"],\"id\":1}" \
    | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{process.stdout.write(JSON.parse(s).result||'')})")"
fi
[[ -n "$POOL_CODE" && "$POOL_CODE" != "0x" ]] || { echo "FAIL no pool code at $POOL" >&2; exit 2; }
VER="$(cast call "$POOL" "version()(string)" --rpc-url "$RPC" | tr -d '"')"
MIN_CN="$(cast call "$POOL" "minStakeAmount(bytes2)(uint256)" 0x434e --rpc-url "$RPC" | awk '{print $1}')"
DELAY="$(cast call "$POOL" "releaseDelaySeconds()(uint256)" --rpc-url "$RPC" | awk '{print $1}')"
APPROVE_LIVE="reverts"
if cast call "$TTG" "approve(address,uint256)(bool)" "$POOL" 1 --rpc-url "$RPC" >/dev/null 2>&1; then
  APPROVE_LIVE="ok"
fi
node -e "console.log(JSON.stringify({chain_id:process.argv[1],pool:process.argv[2],ttg:process.argv[3],pool_version:process.argv[4],min_stake_cn:process.argv[5],release_delay_seconds:process.argv[6],ttg_approve_on_live_chain:process.argv[7]},null,2))" \
  "$CID" "$POOL" "$TTG" "$VER" "$MIN_CN" "$DELAY" "$APPROVE_LIVE" | tee "$EVID/preflight-live.json"

echo ""
echo "== Step 1: readonly smoke =="
bash "$ROOT/scripts/dev/smoke-steward-stake-testnet-readonly.sh" | tee "$EVID/readonly-smoke.log"
grep -q "TT_SMOKE_STEWARD_STAKE_TESTNET_READONLY: OK" "$EVID/readonly-smoke.log"

echo ""
echo "== Step 2: staging API stake-quote + stake-status =="
# shellcheck source=scripts/dev/lib/phase2-web3-p2-003-b407-lib.sh
source "$ROOT/scripts/dev/lib/phase2-web3-p2-003-b407-lib.sh"
p2b407_load_env
_staker_pk="$(p2b407_normalize_hex_pk "${STEWARD_STAKER_PK:-${B407_TRAVELER_PK:-${PRIVATE_KEY:-}}}")"
p2b407_check_pk_decodable "STEWARD_STAKER_PK (or B407_TRAVELER_PK / PRIVATE_KEY)" "$_staker_pk" || exit 2
export STEWARD_STAKER_PK="$_staker_pk"
STAKER="$(cast wallet address --private-key "$_staker_pk" | tr -d '\r\n')"
unset _staker_pk

QUOTE="$(curl --noproxy "*" -sS "${STAGING_API}/api/v1/steward/stake-quote?jurisdictions=CN")"
echo "$QUOTE" | tee "$EVID/stake-quote.json"
echo "$QUOTE" | grep -q '"ttg_symbol":"TTG"' || { echo "FAIL stake-quote" >&2; exit 2; }

STATUS="$(curl --noproxy "*" -sS "${STAGING_API}/api/v1/steward/stake-status?jurisdiction=CN&wallet=${STAKER}")"
echo "$STATUS" | tee "$EVID/stake-status.json"
echo "$STATUS" | grep -q '"pool_address"' || { echo "FAIL stake-status" >&2; exit 2; }
node -e "
const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
const exp=process.argv[2].toLowerCase();
if(String(j.pool_address||'').toLowerCase()!==exp){console.error('pool mismatch',j.pool_address,exp);process.exit(1);}
if(String(j.chain_id)!=='11155111'){console.error('chain_id',j.chain_id);process.exit(1);}
" "$EVID/stake-status.json" "$POOL"

echo ""
echo "== Step 3: write-path equivalent (Sepolia state fork) =="
WRITE_JSON_PATH="$EVID/write-fork-summary.json"
export STEWARD_WRITE_JSON="$WRITE_JSON_PATH"
bash "$ROOT/scripts/dev/smoke-steward-stake-sepolia-write.sh" 2>&1 | tee "$EVID/write-fork-smoke.log"
grep -q "TT_SMOKE_STEWARD_STAKE_SEPOLIA_WRITE: OK" "$EVID/write-fork-smoke.log"
[[ -f "$WRITE_JSON_PATH" ]] || { echo "FAIL: missing write-fork-summary.json" >&2; exit 2; }

node -e "
const fs=require('fs');
const pre=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const write=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const summary={
  schema:'tn_p1_004_steward_stake_staging.v1',
  stamp:process.argv[3],
  phase:'② testnet',
  api:process.argv[4],
  rpc:process.argv[5],
  pool_address:process.argv[6],
  ttg_address:process.argv[7],
  staker_wallet:process.argv[8],
  live_preflight:pre,
  write_fork:write,
  release_gate:'GO',
  honest_boundary:'Live Sepolia readonly+API PASS · write equivalent on Sepolia fork (approve→stake→position→requestRelease) · live stake() blocked until TTG redeploy with approve · ≠ FeeRouter/indexer (TN-P1-010) · ≠ ③ mainnet'
};
fs.writeFileSync(process.argv[9], JSON.stringify(summary,null,2)+'\n');
" "$EVID/preflight-live.json" "$EVID/write-fork-summary.json" "$STAMP" "$STAGING_API" "$RPC" "$POOL" "$TTG" "$STAKER" "$EVID/report.json"

cat >"$EVID/STATUS.txt" <<EOF
status: PASS
phase: ②
artifact: TN-P1-004 Sepolia Stake
at: ${STAMP}
release_gate: GO
EOF

echo ""
echo "TT_TN_P1_004_STEWARD_STAKE_EVIDENCE: PASS ${STAMP}"
echo "evidence: ${EVID}"
