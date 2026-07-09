#!/usr/bin/env bash
# TN-P1-010 · 索引器深度对账 + FeeRouter 走廊（② · ops only · 无新业务）
# LEGACY · READ-ONLY — fee_router_owner_is_timelock 引用 LEGACY Timelock 0x0359…（cutover 旁证）
#
# tick → replay → reconcile(persist) 直至 missing_projection=0 · compound_pass=true
# 可选 FeeRouter.distribute（须 B407_OWNER_PK=FeeRouter.owner · router 余额>0）
#
#   export STAGING_API_BASE=https://tt-api-staging.fly.dev
#   bash scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh
#
# 可选：TN_P1_010_SYNC_STAGING_RPC=1 先 fly secrets 同步 CHAIN_RPC_URL（须 fly auth）
# 须 scripts/dev/.env.staging-onboarding.local：INTERNAL_API_SECRET · Sepolia 合约地址
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-010-indexer-reconcile-${STAMP}"
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

_staging_onboarding="$ROOT/scripts/dev/.env.staging-onboarding.local"
if [[ -f "$_staging_onboarding" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ "$line" == INTERNAL_API_SECRET=* ]] || continue
    val="${line#INTERNAL_API_SECRET=}"
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    [[ -n "$val" ]] && export INTERNAL_API_SECRET="$val"
  done < "$_staging_onboarding"
fi
unset _staging_onboarding
SEC="${INTERNAL_API_SECRET:-}"
export CHAIN_RPC_URL="$RPC"
export P2B407_RPC_URL="$RPC"
export STAGING_API_BASE="$STAGING_API"
export API_BASE_URL="$STAGING_API"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1,publicnode.com,drpc.org"

FR="${FEE_ROUTER_ADDRESS:-0x81A8009210c5215100564c6E4123F672c4459306}"
TOK="${FUND_STACK_TOKEN_ADDRESS:-0x241948bE49a778490c8A4Ae8D98b7537fE001f63}"
SEC="${INTERNAL_API_SECRET:-}"

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_010_INDEXER_RECONCILE_EVIDENCE: START ${STAMP}"
echo "api=${STAGING_API} rpc=${RPC}"

if [[ "${TN_P1_010_SYNC_STAGING_RPC:-0}" == "1" ]]; then
  echo ""
  echo "== Step 0: sync staging Fly CHAIN_RPC_URL =="
  TESTNET_FREEZE_OVERRIDE=1 bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" --secrets-only \
    | tee "$EVID/fly-rpc-sync.log"
fi

[[ -n "$SEC" ]] || { echo "FAIL: INTERNAL_API_SECRET unset" >&2; exit 2; }
command -v jq >/dev/null 2>&1 || { echo "FAIL: jq required" >&2; exit 2; }
command -v cast >/dev/null 2>&1 || { echo "FAIL: cast required" >&2; exit 2; }

curl_internal() {
  local path="$1" body="${2:-{}}"
  curl --noproxy "*" -sS -X POST \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${SEC}" \
    -d "$body" \
    "${STAGING_API}${path}"
}

echo ""
echo "== Step 1: indexer-tick loop (until ok or cap) =="
TICK_OK=0
CAUGHT_UP=0
for i in $(seq 1 150); do
  curl_internal "/api/v1/internal/indexer-tick" '{}' | tee "$EVID/indexer-tick-${i}.json" >"$EVID/indexer-tick-latest.json"
  if jq -e '.status == "ok"' "$EVID/indexer-tick-latest.json" >/dev/null 2>&1; then
    TICK_OK=1
    fb="$(jq -r '.from_block // 0' "$EVID/indexer-tick-latest.json")"
    tb="$(jq -r '.to_block // 0' "$EVID/indexer-tick-latest.json")"
    fub="$(jq -r '.indexer_finalized_upper_bound // .to_block // 0' "$EVID/indexer-tick-latest.json")"
    msg="$(jq -r '.message // empty' "$EVID/indexer-tick-latest.json")"
    echo "indexer-tick ok attempt ${i} from=${fb} to=${tb} finalized=${fub} msg=${msg:-applied}"
    if [[ "$msg" == "no_new_blocks" || "$msg" == "awaiting_finality" ]]; then
      CAUGHT_UP=1
      break
    fi
    if [[ "$tb" -ge "$fub" && "$fub" -gt 0 ]]; then
      CAUGHT_UP=1
      break
    fi
  else
    err="$(jq -r '.error // .message // empty' "$EVID/indexer-tick-latest.json" 2>/dev/null || true)"
    echo "indexer-tick attempt ${i} not ok: ${err:-unknown}"
  fi
  sleep 2
done
[[ "$TICK_OK" == "1" ]] || { echo "FAIL: indexer-tick never returned ok" >&2; exit 2; }
[[ "$CAUGHT_UP" == "1" ]] || echo "WARN: tick loop ended before chain tip catch-up — continuing replay/reconcile"

echo ""
echo "== Step 2: indexer-replay =="
curl_internal "/api/v1/internal/indexer-replay" '{}' | tee "$EVID/indexer-replay.json"

echo ""
echo "== Step 3: FeeRouter distribute (optional) =="
ROUTER_BAL="$(cast call "$TOK" "balanceOf(address)(uint256)" "$FR" --rpc-url "$RPC" 2>/dev/null | awk '{print $1}' || echo "0")"
echo "fee_router_balance=${ROUTER_BAL}" | tee "$EVID/fee-router-balance.txt"
DISTRIBUTE_SKIPPED=1
if [[ -n "${ROUTER_BAL:-}" && "$ROUTER_BAL" != "0" && -n "${B407_OWNER_PK:-}" ]]; then
  export B407_FEE_ROUTER="$FR"
  export B407_RPC_URL="$RPC"
  export B407_SKIP_RELEASE=1
  export B407_TX_RECORD_JSON="$EVID/distribute-tx.json"
  if bash "$ROOT/scripts/ops/b407-exec-chain-release-distribute.sh" | tee "$EVID/distribute.log"; then
    DISTRIBUTE_SKIPPED=0
    curl_internal "/api/v1/internal/indexer-tick" '{}' | tee "$EVID/indexer-tick-post-distribute.json"
  else
    echo "WARN: distribute failed — continuing reconcile" | tee "$EVID/distribute-warn.txt"
  fi
else
  node -e "console.log(JSON.stringify({
    skipped:true,
    reason:'router_balance_zero_or_B407_OWNER_PK_unset',
    router_balance:process.argv[1],
    fee_router_owner_is_timelock:'0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f',
    platform_fee_bps_default:0
  },null,2))" "$ROUTER_BAL" >"$EVID/distribute-skipped.json"
fi

echo ""
echo "== Step 4: indexer-reconcile (persist + rpc samples + fee router obs) =="
RECON_BODY='{"persist":true,"rpc_escrow_samples":3,"include_event_log_escrow_coverage":true,"include_fee_router_platform_fee_routed_log_count_chain_vs_db_observability":true}'
curl_internal "/api/v1/internal/indexer-reconcile" "$RECON_BODY" | tee "$EVID/indexer-reconcile.json"

node -e "
const fs=require('fs');
const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const gate=j.orders_projection_reconcile_gate||{};
const bd=gate.breakdown||{};
const miss=Number(bd.missing_projection??-1);
const compound=!!j.reconcile_compound_pass;
const clean=!!j.projection_reconcile_clean;
if(miss!==0){console.error('FAIL missing_projection',miss);process.exit(2);}
if(!compound){console.error('FAIL reconcile_compound_pass false');process.exit(2);}
if(!clean){console.error('FAIL projection_reconcile_clean false');process.exit(2);}
console.log('reconcile_assertions_ok',JSON.stringify({missing_projection:miss,reconcile_compound_pass:compound,projection_reconcile_clean:clean}));
" "$EVID/indexer-reconcile.json" | tee "$EVID/reconcile-assertions.json"

node -e "
const fs=require('fs');
const recon=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const freezeSha=process.argv[7]||null;
const soakCompletedPath=process.argv[8]||'';
const allowPreSoak=process.argv[9]==='1';
let soakCompletedAfter=null;
if(soakCompletedPath&&fs.existsSync(soakCompletedPath)){
  try{soakCompletedAfter=JSON.parse(fs.readFileSync(soakCompletedPath,'utf8')).completed_at||null;}catch{}
}
if(!soakCompletedAfter&&!allowPreSoak){
  console.error('FAIL: TN-P1-010 GO report requires post-soak COMPLETED.json (set TN_P1_010_ALLOW_PRE_SOAK=1 for dev-only)');
  process.exit(4);
}
const summary={
  schema:'tn_p1_010_indexer_reconcile_staging.v1',
  stamp:process.argv[2],
  phase:'② testnet',
  api:process.argv[3],
  rpc:process.argv[4],
  distribute_skipped:process.argv[5]==='1',
  reconcile_compound_pass:recon.reconcile_compound_pass,
  missing_projection:recon.orders_projection_reconcile_gate?.breakdown?.missing_projection??null,
  projection_reconcile_clean:recon.projection_reconcile_clean,
  freeze_git_sha:freezeSha,
  soak_completed_after:soakCompletedAfter,
  release_gate:'GO',
  honest_boundary:'Sepolia staging indexer tick/replay/reconcile compound clean · post-soak @ freeze SHA · FeeRouter.distribute only when router balance>0 · ≠ ③ mainnet'
};
fs.writeFileSync(process.argv[6], JSON.stringify(summary,null,2)+'\n');
" "$EVID/indexer-reconcile.json" "$STAMP" "$STAGING_API" "$RPC" "$DISTRIBUTE_SKIPPED" "$EVID/report.json" \
  "${TN_P1_010_EXPECT_FREEZE_GIT_SHA:-$(node -e "try{const f=process.argv[1];console.log(JSON.parse(require('fs').readFileSync(f,'utf8')).git_sha)}catch{}" "$ROOT/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json" 2>/dev/null || echo "")}" \
  "${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}/COMPLETED.json" \
  "${TN_P1_010_ALLOW_PRE_SOAK:-0}"

cat >"$EVID/STATUS.txt" <<EOF
status: PASS
phase: ②
artifact: TN-P1-010 indexer reconcile
at: ${STAMP}
release_gate: GO
EOF

echo ""
echo "TT_TN_P1_010_INDEXER_RECONCILE_EVIDENCE: PASS ${STAMP}"
echo "evidence: ${EVID}"
