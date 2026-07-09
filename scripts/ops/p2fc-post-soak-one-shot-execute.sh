#!/usr/bin/env bash
# P2FC · post-soak 一次性执行链（TN-P1-010 → Wave1 API → Wave2 Web → G02 → Graduation）
#
#   bash scripts/ops/p2fc-post-soak-one-shot-execute.sh --watch     # 等 COMPLETED.json 后执行
#   bash scripts/ops/p2fc-post-soak-one-shot-execute.sh --prep-only   # 只读准备（不 deploy）
#   bash scripts/ops/p2fc-post-soak-one-shot-execute.sh             # 须已有 COMPLETED.json
#
# 纪律：--prep-only 不触碰 staging deploy · --watch 不杀 soak · 四态 watcher 防假死
# 回滚：每波 deploy 前捕获 fly snapshot；失败见 wave-rollback-plan/latest.json
#
# 末行：TT_P2FC_POST_SOAK_ONE_SHOT: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/ops/lib/p2fc-post-soak-wave-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-post-soak-wave-lib.sh"
# shellcheck source=scripts/ops/lib/p2fc-soak-watcher-state-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-soak-watcher-state-lib.sh"

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
COMPLETED="$SOAK_DIR/COMPLETED.json"
BACKLOG_ACTIVE="$ROOT/evidence/GO_phase2_deploy_backlog/ACTIVE.json"
EXEC_DIR="$SOAK_DIR/post-soak-one-shot"
CHECKPOINT="$EXEC_DIR/checkpoint.json"
LOG="$EXEC_DIR/one-shot.log"
WATCHER_STATE="$EXEC_DIR/soak-watcher-state.json"
WATCH=0
PREP_ONLY=0
POLL_SEC="${P2FC_POST_SOAK_POLL_SEC:-300}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=1; shift ;;
    --prep-only) PREP_ONLY=1; shift ;;
    -h|--help)
      sed -n '2,16p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$EXEC_DIR"
: >"$CHECKPOINT"
echo '{"schema":"traveltrust.p2fc_post_soak_checkpoint.v1","phases":{}}' >"$CHECKPOINT"

on_fail() {
  local phase="$1" msg="$2"
  p2fc_wave_checkpoint "$CHECKPOINT" "$phase" "FAIL" "$msg"
  echo "TT_P2FC_POST_SOAK_ONE_SHOT: FAIL phase=$phase $msg" | tee -a "$LOG" >&2
  if [[ -f "$EXEC_DIR/fly-rollback-snapshot.json" ]]; then
    echo "rollback: see $EXEC_DIR/ROLLBACK-SNAPSHOT.md and evidence/GO_phase2_deploy_backlog/wave-rollback-plan/latest.json" | tee -a "$LOG"
  fi
  exit 2
}

wait_completed() {
  p2fc_soak_watcher_wait_completed "$ROOT" "$SOAK_DIR" "$LOG" "$WATCHER_STATE" "$POLL_SEC"
}

run_prep() {
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "${ts} one-shot prep: START" | tee -a "$LOG"
  p2fc_wave_checkpoint "$CHECKPOINT" "prep" "RUNNING" "read-only materials"

  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-deploy-wave-rollback-plan.py" \
    --capture-fly --out-dir "$EXEC_DIR/wave-plan" 2>&1 | tee -a "$LOG"
  cp -f "$ROOT/evidence/GO_phase2_deploy_backlog/wave-rollback-plan/latest.json" "$EXEC_DIR/wave-rollback-plan.json" 2>/dev/null || true

  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-graduation-review-pack.py" 2>&1 | tee -a "$LOG"
  cp -f "$ROOT/evidence/GO_phase2_testnet_graduation/review-pack/latest.json" "$EXEC_DIR/graduation-review-pack.json" 2>/dev/null || true

  P2FC_PRE_ACCEPT_OUT="$EXEC_DIR/pre-accept" bash "$ROOT/scripts/ops/p2fc-pre-accept-g02-graduation-convergence.sh" \
    2>&1 | tee -a "$LOG" || true

  p2fc_capture_fly_rollback_snapshot "$EXEC_DIR"

  node -e "
const fs=require('fs');
const payload={
  schema:'traveltrust.p2fc_post_soak_execute_active.v1',
  prepared_at_utc:new Date().toISOString(),
  soak_dir:process.argv[1],
  apply_after:process.argv[1]+'/COMPLETED.json',
  entrypoint:'scripts/ops/p2fc-post-soak-one-shot-execute.sh',
  legacy_entrypoint:'scripts/ops/p2fc-post-soak-deploy-backlog-and-graduate.sh',
  execution_order:[
    'TN-P1-010 independent',
    'fly rollback snapshot',
    'apply backlog+hotfix',
    'Wave1 deploy API',
    'Wave2 deploy Web',
    'meta availability strict',
    'G02 deep gate',
    'graduation closure',
  ],
};
fs.writeFileSync(process.argv[2], JSON.stringify(payload,null,2)+'\n');
" "$SOAK_DIR" "$ROOT/evidence/GO_phase2_deploy_backlog/POST_SOAK_EXECUTE_READY.json"

  p2fc_wave_checkpoint "$CHECKPOINT" "prep" "PASS" "materials ready"
  echo "TT_P2FC_POST_SOAK_PREP: PASS dir=$EXEC_DIR"
}

run_execute() {
  local ts stamp
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "${ts} one-shot execute: START" | tee -a "$LOG"

  [[ -f "$BACKLOG_ACTIVE" ]] || on_fail "preflight" "missing $BACKLOG_ACTIVE"
  stamp="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).stamp)" "$BACKLOG_ACTIVE")"

  # Step 1 · 执行链
  p2fc_wave_checkpoint "$CHECKPOINT" "tn_p1_010" "RUNNING" ""
  if ! bash "$ROOT/scripts/ops/p2fc-run-tn-p1-010-independent.sh" 2>&1 | tee -a "$LOG"; then
    on_fail "tn_p1_010" "TN-P1-010 independent failed"
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "tn_p1_010" "PASS" ""

  # Step 2 · 回滚快照
  p2fc_capture_fly_rollback_snapshot "$EXEC_DIR"
  p2fc_wave_checkpoint "$CHECKPOINT" "rollback_snapshot" "PASS" "$EXEC_DIR/fly-rollback-snapshot.json"

  # Step 3 · 打补丁
  p2fc_wave_checkpoint "$CHECKPOINT" "apply_patches" "RUNNING" "stamp=$stamp"
  if ! p2fc_apply_backlog_patches "$ROOT" "$stamp" "$LOG"; then
    on_fail "apply_patches" "patch apply failed"
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "apply_patches" "PASS" ""

  # Step 4 · Wave1 API
  p2fc_wave_checkpoint "$CHECKPOINT" "wave1_api_deploy" "RUNNING" ""
  if ! p2fc_deploy_api_wave "$ROOT" "$LOG"; then
    prev_img="$(node -e "try{const j=require(process.argv[1]);console.log(j.apps['tt-api-staging'].previous_image||'')}catch{}" "$EXEC_DIR/fly-rollback-snapshot.json" 2>/dev/null || true)"
    [[ -n "$prev_img" ]] && p2fc_rollback_fly_app "tt-api-staging" "$prev_img" "$LOG" || true
    on_fail "wave1_api_deploy" "API deploy failed"
  fi
  hc="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' --max-time 30 "${STAGING_API_BASE:-https://tt-api-staging.fly.dev}/health" 2>/dev/null || echo 000)"
  [[ "$hc" == "200" ]] || on_fail "wave1_api_deploy" "health=$hc after API deploy"
  p2fc_wave_checkpoint "$CHECKPOINT" "wave1_api_deploy" "PASS" "health=200"

  # Step 5 · Wave2 Web
  p2fc_wave_checkpoint "$CHECKPOINT" "wave2_web_deploy" "RUNNING" ""
  if ! p2fc_deploy_web_wave "$ROOT" "$LOG"; then
    prev_img="$(node -e "try{const j=require(process.argv[1]);console.log(j.apps['tt-web-staging'].previous_image||'')}catch{}" "$EXEC_DIR/fly-rollback-snapshot.json" 2>/dev/null || true)"
    [[ -n "$prev_img" ]] && p2fc_rollback_fly_app "tt-web-staging" "$prev_img" "$LOG" || true
    on_fail "wave2_web_deploy" "Web deploy failed"
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "wave2_web_deploy" "PASS" ""

  # Step 6 · meta 验收
  p2fc_wave_checkpoint "$CHECKPOINT" "meta_availability" "RUNNING" ""
  export PHASE2_REQUIRE_META_GREEN=1
  export PHASE2_META_OBSERVABILITY_ONLY=0
  if ! bash "$ROOT/scripts/ops/p2fc-verify-staging-meta-availability.sh" --strict 2>&1 | tee -a "$LOG"; then
    on_fail "meta_availability" "/meta not 200"
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "meta_availability" "PASS" ""

  # Step 7 · G02
  p2fc_wave_checkpoint "$CHECKPOINT" "g02_deep_gate" "RUNNING" ""
  export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
  export STAGING_WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
  export PHASE2_EXPECT_GIT_SHA="$(git -C "$ROOT" rev-parse HEAD)"
  if ! bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" --skip-rbac --require-meta-green 2>&1 | tee -a "$LOG"; then
    on_fail "g02_deep_gate" "Deep gate G02 failed"
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "g02_deep_gate" "PASS" ""

  # Step 8 · Graduation
  p2fc_wave_checkpoint "$CHECKPOINT" "graduation" "RUNNING" ""
  export P2FC_SOAK_DIR="$SOAK_DIR"
  if ! bash "$ROOT/scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh" 2>&1 | tee -a "$LOG"; then
    on_fail "graduation" "graduation closure failed"
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "graduation" "PASS" ""

  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-graduation-review-pack.py" 2>&1 | tee -a "$LOG" || true

  echo "${ts} TT_P2FC_POST_SOAK_ONE_SHOT: PASS checkpoint=$CHECKPOINT"
}

# --- main ---
run_prep

if [[ "$PREP_ONLY" -eq 1 ]]; then
  echo "TT_P2FC_POST_SOAK_ONE_SHOT: PREP_ONLY (no deploy)"
  exit 0
fi

if [[ "$WATCH" -eq 1 ]]; then
  echo $$ >"$EXEC_DIR/one-shot-watcher.pid"
  p2fc_wave_checkpoint "$CHECKPOINT" "wait_completed" "RUNNING" "soak_watcher_four_state"
  if ! wait_completed; then
    p2fc_wave_checkpoint "$CHECKPOINT" "wait_completed" "ABORT" "soak_watcher_abort"
    echo "TT_P2FC_POST_SOAK_ONE_SHOT: FAIL phase=wait_completed watcher_abort" >&2
    exit 2
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "wait_completed" "PASS" "COMPLETED.json"
fi

[[ -f "$COMPLETED" ]] || {
  echo "one-shot: FAIL missing $COMPLETED (use --watch or --prep-only)" >&2
  exit 2
}

run_execute
exit 0
