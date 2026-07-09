#!/usr/bin/env bash
# P2FC · MR12 执行路径冻结锁 · 只读验证（不 deploy · 不改 soak/watcher 进程）
#
#   bash scripts/ops/p2fc-verify-mr12-execution-lock.sh
#
# 末行：TT_MR12_EXECUTION_LOCK: FROZEN|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCK="${P2FC_MR12_LOCK:-$ROOT/evidence/GO_phase2_deploy_backlog/MR12-EXECUTION-LOCK.json}"
READY="$ROOT/evidence/GO_phase2_deploy_backlog/POST_SOAK_EXECUTE_READY.json"
HOTFIX="$ROOT/evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch"
MR_EVAL="$ROOT/evidence/P2FC_SOAK_72H_STAGING/l5-stability-audit/mr-execution-benefit-evaluation.json"
VERDICT="FROZEN"
FAILS=0

fail() {
  echo "TT_MR12_EXECUTION_LOCK: FAIL $1" >&2
  FAILS=$((FAILS + 1))
  VERDICT="FAIL"
}

[[ -f "$LOCK" ]] || fail "missing_lock=$LOCK"

node -e "
const fs=require('fs');
const lock=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const ready=fs.existsSync(process.argv[2])?JSON.parse(fs.readFileSync(process.argv[2],'utf8')):{};
const fails=[];
if(lock.locked_strategy!=='STRAT-A_PLUS_MR12') fails.push('locked_strategy');
if(!Array.isArray(lock.rejected_strategies)||!lock.rejected_strategies.includes('STRAT-B_WAVE0_FIRST')) fails.push('reject_strat_b');
if(lock.lock_status!=='FROZEN') fails.push('lock_status');
if(lock.entrypoint!=='scripts/ops/p2fc-post-soak-one-shot-execute.sh') fails.push('entrypoint');
if(!lock.mr_changes||!lock.mr_changes.includes('MR-01')||!lock.mr_changes.includes('MR-02')) fails.push('mr_changes');
if(ready.execution_strategy&&ready.execution_strategy!==lock.locked_strategy) fails.push('ready_strategy_mismatch');
if(fails.length){ console.error('NODE_FAIL:'+fails.join(',')); process.exit(2); }
" "$LOCK" "$READY" 2>/dev/null || fail "lock_schema_or_ready_mismatch"

[[ -f "$HOTFIX" ]] || fail "missing_hotfix=$HOTFIX"

if [[ -f "$MR_EVAL" ]]; then
  dec="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).strat_b_decision.verdict||'')}catch{}" "$MR_EVAL")"
  [[ "$dec" == "KEEP_DEFAULT_ONE_SHOT_APPLY_MR12" ]] || fail "mr_eval_decision=$dec"
fi

if [[ "$FAILS" -gt 0 ]]; then
  echo "TT_MR12_EXECUTION_LOCK: FAIL count=$FAILS lock=$LOCK"
  exit 2
fi

echo "TT_MR12_EXECUTION_LOCK: FROZEN strategy=STRAT-A_PLUS_MR12 reject=STRAT-B entrypoint=one-shot"
exit 0
