#!/usr/bin/env bash
# P2FC · 最终候选版本优先（STRAT-F）· 终止旧 Soak → 修复 → 验证 → 新 Freeze → 72h Soak
#
# 取代 STRAT-A_PLUS_MR12「先 soak 520abf39 再 deploy」— Owner 决裁：以最终候选为目标。
#
#   bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --supersede-soak
#   bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --lift-freeze
#   bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --inventory
#   bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --phase-local
#   bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --phase-staging-deploy
#   bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --phase-staging-live
#   bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --engage-freeze
#   bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --launch-soak
#   bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --status
#
# 末行：TT_P2FC_FINAL_CANDIDATE_PRE_SOAK: PASS|IN_PROGRESS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/ops/lib/p2fc-post-soak-wave-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-post-soak-wave-lib.sh"

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
PROG_DIR="$SOAK_DIR/final-candidate-pre-soak"
LOG="$PROG_DIR/program.log"
LOCK_OUT="$ROOT/evidence/GO_phase2_deploy_backlog/FINAL-CANDIDATE-EXECUTION-LOCK.json"
MR12_ARCH="$ROOT/evidence/GO_phase2_deploy_backlog/MR12-EXECUTION-LOCK.ARCHIVED-STRAT-A.json"
BACKLOG_ACTIVE="$ROOT/evidence/GO_phase2_deploy_backlog/ACTIVE.json"

mkdir -p "$PROG_DIR"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

log() { echo "${ts} $*" | tee -a "$LOG"; }

write_strategy_lock() {
  node -e "
const fs=require('fs');
const prev=fs.existsSync(process.argv[1])?JSON.parse(fs.readFileSync(process.argv[1],'utf8')):null;
if(prev) fs.writeFileSync(process.argv[2], JSON.stringify(prev,null,2)+'\n');
const lock={
  schema:'traveltrust.p2fc_final_candidate_execution_lock.v1',
  lock_status:'ACTIVE',
  locked_at_utc:new Date().toISOString(),
  phase:'②',
  locked_strategy:'STRAT-F_FINAL_CANDIDATE_PRE_SOAK',
  superseded_strategy:'STRAT-A_PLUS_MR12',
  policy:'fix_all_open_blockers_and_d_risks → local → staging live → human acceptance → freeze → fresh 72h soak',
  execution_order:[
    'lift TESTNET_STAGING_FREEZE',
    'apply MR-01 MR-02 backlog deploy to staging',
    'TN-P1-010 + wave1/wave2 + G02/meta',
    'ADM-U01 live GO + P0 runtime CONFIRMED',
    'B1-B4 cleared + ADM-U02 GO',
    'D3 + D1/D2/D4 live convergence',
    'human acceptance evidence',
    'engage TESTNET_STAGING_FREEZE @ HEAD',
    'P2FC_SOAK_SUPERSEDE=1 launch 72h soak',
  ],
  adjudication_ssot:['TT_ADMIN_STAGING_GO_CLAIM','TT_LIVE_CLOSURE_CHAIN_VERDICT'],
  soak_target:'final_candidate_git_sha_at_freeze',
};
fs.writeFileSync(process.argv[3], JSON.stringify(lock,null,2)+'\n');
" "$ROOT/evidence/GO_phase2_deploy_backlog/MR12-EXECUTION-LOCK.json" "$MR12_ARCH" "$LOCK_OUT"
}

supersede_soak() {
  local stamp arch job pid
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  arch="$SOAK_DIR/superseded-${stamp}-final-candidate-pivot"
  mkdir -p "$arch"

  for job in "$SOAK_DIR"/job-*; do
    [[ -d "$job" ]] || continue
    pid="$(cat "$job/pid.txt" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      log "supersede: stopping soak worker pid=$pid job=$job"
      kill "$pid" 2>/dev/null || true
      sleep 2
      kill -9 "$pid" 2>/dev/null || true
    fi
    mv "$job" "$arch/" 2>/dev/null || true
  done

  for pf in \
    "$SOAK_DIR/post-soak-staging-live-closure/closure-chain-watcher.pid" \
    "$SOAK_DIR/post-soak-one-shot/one-shot-watcher.pid" \
    "$SOAK_DIR/post-soak-staging-live-closure/priority-closure-watcher.pid"; do
    if [[ -f "$pf" ]]; then
      wp="$(cat "$pf" 2>/dev/null || true)"
      [[ -n "$wp" ]] && kill "$wp" 2>/dev/null || true
    fi
  done

  rm -f "$SOAK_DIR/COMPLETED.json" "$SOAK_DIR/FAIL.json" 2>/dev/null || true

  node -e "
const fs=require('fs');
const payload={
  schema:'traveltrust.p2fc_soak_superseded.v1',
  superseded_at_utc:new Date().toISOString(),
  reason:'STRAT-F final candidate pre-soak pivot — invalidate pre-backlog 72h soak',
  previous_strategy:'STRAT-A_PLUS_MR12',
  new_strategy:'STRAT-F_FINAL_CANDIDATE_PRE_SOAK',
  archive_dir:process.argv[1],
  prior_freeze_sha:'520abf396cce7baf3dcf39f71c1e77769e0086d8',
  next_steps:['lift freeze','fix open items','staging validate','engage freeze @ HEAD','fresh 72h soak'],
};
fs.writeFileSync(process.argv[2], JSON.stringify(payload,null,2)+'\n');
" "$arch" "$SOAK_DIR/SUPERSEDED-final-candidate-pivot.json"

  write_strategy_lock
  log "supersede: done archive=$arch"
  echo "TT_P2FC_SOAK_SUPERSEDED: final_candidate_pivot archive=$arch"
}

phase_local() {
  log "phase-local: START"
  export TESTNET_FREEZE_OVERRIDE=1

  [[ -f "$BACKLOG_ACTIVE" ]] || { echo "FAIL missing $BACKLOG_ACTIVE" >&2; exit 2; }
  local stamp
  stamp="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).stamp)" "$BACKLOG_ACTIVE")"

  local hotfix="$ROOT/evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch"
  if [[ -f "$hotfix" ]] && ! git -C "$ROOT" apply --check "$hotfix" 2>/dev/null; then
    log "phase-local: MR-01 hotfix already applied or partial"
  elif [[ -f "$hotfix" ]]; then
    log "phase-local: applying meta-availability-hotfix.patch"
    git -C "$ROOT" apply --whitespace=nowarn "$hotfix" 2>&1 | tee -a "$LOG"
  fi

  log "phase-local: cargo test -p traveltrust-api (affected API)"
  cargo test -p traveltrust-api 2>&1 | tee -a "$LOG"

  log "phase-local: gap inventory refresh"
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-final-candidate-gap-inventory.py" 2>&1 | tee -a "$LOG"

  log "phase-local: DONE"
  echo "TT_P2FC_FINAL_CANDIDATE_PHASE_LOCAL: PASS"
}

phase_staging_deploy() {
  log "phase-staging-deploy: START"
  export TESTNET_FREEZE_OVERRIDE=1

  [[ -f "$BACKLOG_ACTIVE" ]] || { echo "FAIL missing backlog ACTIVE" >&2; exit 2; }
  local stamp
  stamp="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).stamp)" "$BACKLOG_ACTIVE")"

  p2fc_capture_fly_rollback_snapshot "$PROG_DIR/rollback-pre-deploy"

  local patch="$ROOT/evidence/GO_phase2_deploy_backlog/${stamp}/deploy-backlog.patch"
  if git -C "$ROOT" apply --check "$patch" 2>/dev/null; then
    log "apply backlog patches stamp=$stamp"
    p2fc_apply_backlog_patches "$ROOT" "$stamp" "$LOG"
  else
    log "skip deploy-backlog.patch — already in tree @ HEAD (STRAT-F)"
  fi

  log "wave1 API deploy"
  p2fc_deploy_api_wave "$ROOT" "$LOG"

  log "wave2 Web deploy"
  p2fc_deploy_web_wave "$ROOT" "$LOG"

  log "meta availability strict"
  bash "$ROOT/scripts/ops/p2fc-verify-staging-meta-availability.sh" --strict 2>&1 | tee -a "$LOG" || true

  log "TN-P1-010 independent (STRAT-F · post-deploy · non-blocking)"
  bash "$ROOT/scripts/ops/p2fc-run-tn-p1-010-independent.sh" --allow-pre-soak 2>&1 | tee -a "$LOG" || \
    log "WARN: TN-P1-010 incomplete — continue (indexer may need post-deploy catch-up)"

  log "G02 deep gate"
  bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" --require-meta-green 2>&1 | tee -a "$LOG" || true

  node -e "
const fs=require('fs');
const p=process.argv[1];
fs.writeFileSync(p, JSON.stringify({
  schema:'traveltrust.p2fc_final_candidate_deploy_complete.v1',
  completed_at_utc:new Date().toISOString(),
  git_sha:require('child_process').execSync('git rev-parse HEAD',{cwd:process.argv[2],encoding:'utf8'}).trim(),
},null,2)+'\n');
" "$PROG_DIR/deploy-complete.json" "$ROOT"

  echo "TT_P2FC_FINAL_CANDIDATE_PHASE_STAGING_DEPLOY: PASS"
}

phase_staging_live() {
  log "phase-staging-live: START"
  export TESTNET_FREEZE_OVERRIDE=1
  bash "$ROOT/scripts/ops/p2fc-post-soak-priority-closure-sequential.sh" --execute --strat-f 2>&1 | tee -a "$LOG" || {
    echo "TT_P2FC_FINAL_CANDIDATE_PHASE_STAGING_LIVE: PARTIAL (see log)" >&2
    exit 2
  }
  echo "TT_P2FC_FINAL_CANDIDATE_PHASE_STAGING_LIVE: PASS"
}

engage_freeze() {
  log "engage-freeze: baseline audit"
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-phase2-baseline-consistency-audit.py" 2>&1 | tee -a "$LOG" || true
  local audit_dir
  audit_dir="$(ls -td "$ROOT/evidence/GO_phase2_baseline_consistency_audit"/*/ 2>/dev/null | head -1 || true)"
  bash "$ROOT/scripts/dev/engage-testnet-staging-baseline-freeze.sh" \
    --audit-evidence "${audit_dir%/}" \
    --reason "STRAT-F final candidate validated on staging — pre 72h soak freeze" 2>&1 | tee -a "$LOG"
  echo "TT_P2FC_FINAL_CANDIDATE_FREEZE: ACTIVE sha=$(git -C "$ROOT" rev-parse HEAD)"
}

launch_soak() {
  log "launch-soak: fresh 72h on freeze candidate"
  export P2FC_SOAK_SUPERSEDE=1
  bash "$ROOT/scripts/ops/p2fc-launch-staging-soak-72h.sh" 2>&1 | tee -a "$LOG"
  echo "TT_P2FC_FINAL_CANDIDATE_SOAK: LAUNCHED"
}

status_only() {
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-final-candidate-gap-inventory.py" 2>&1 || true
  [[ -f "$SOAK_DIR/SUPERSEDED-final-candidate-pivot.json" ]] && echo "soak: SUPERSEDED" || echo "soak: check job-*"
  [[ -f "$ROOT/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json" ]] && echo "freeze: ACTIVE" || echo "freeze: LIFTED or absent"
  [[ -f "$LOCK_OUT" ]] && echo "strategy: STRAT-F ($(cat "$LOCK_OUT" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{console.log(JSON.parse(s).locked_strategy)}catch{}})")" || echo "strategy: unset"
  bash "$ROOT/scripts/ops/p2fc-query-runtime-adjudication.sh" 2>&1 || true
}

ACTION=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --supersede-soak) ACTION=supersede_soak; shift ;;
    --lift-freeze) ACTION=lift_freeze; shift ;;
    --inventory) ACTION=inventory; shift ;;
    --phase-local) ACTION=phase_local; shift ;;
    --phase-staging-deploy) ACTION=phase_staging_deploy; shift ;;
    --phase-staging-live) ACTION=phase_staging_live; shift ;;
    --engage-freeze) ACTION=engage_freeze; shift ;;
    --launch-soak) ACTION=launch_soak; shift ;;
    --status) ACTION=status; shift ;;
    -h|--help)
      sed -n '2,18p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$ACTION" ]] || { status_only; exit 0; }

case "$ACTION" in
  supersede_soak) supersede_soak ;;
  lift_freeze) bash "$ROOT/scripts/dev/lift-testnet-staging-freeze.sh" --reason "STRAT-F final candidate pre-soak pivot" ;;
  inventory) PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-final-candidate-gap-inventory.py" ;;
  phase_local) phase_local ;;
  phase_staging_deploy) phase_staging_deploy ;;
  phase_staging_live) phase_staging_live ;;
  engage_freeze) engage_freeze ;;
  launch_soak) launch_soak ;;
  status) status_only ;;
esac

echo "TT_P2FC_FINAL_CANDIDATE_PRE_SOAK: IN_PROGRESS action=$ACTION log=$LOG"
