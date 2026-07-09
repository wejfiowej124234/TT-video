#!/usr/bin/env bash
# P2FC · Live Closure Chain · post-soak staging 唯一真源总链（② · MR12 freeze 不变）
#
# 系统裁决（闭环未满足前统一）：
#   Admin GO=NO · Phase② Closure=NO · Production GO=NO
#
# Prep/Static/Tunnel/Local/Smoke/Watcher/Health/Audit-WARN/MR12-Prep-Only
# 仅作准备态证据，不得替代 Live Evidence 或 GO 结论。
#
# COMPLETED.json 后唯一执行入口（顺序固定）：
#   bash scripts/ops/p2fc-post-soak-staging-live-closure-chain.sh --watch
#
# 裁决依据：release_gate · runtime evidence · closure SSOT
# 查询：bash scripts/ops/p2fc-query-live-closure-verdict.sh
#
#   bash scripts/ops/p2fc-post-soak-staging-live-closure-chain.sh --prep-only
#   bash scripts/ops/p2fc-post-soak-staging-live-closure-chain.sh --watch
#   bash scripts/ops/p2fc-post-soak-staging-live-closure-chain.sh   # 须已有 COMPLETED.json
#
# 末行：TT_P2FC_POST_SOAK_STAGING_LIVE_CLOSURE_CHAIN: PASS|PREP_ONLY|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/ops/lib/p2fc-soak-watcher-state-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-soak-watcher-state-lib.sh"

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
COMPLETED="$SOAK_DIR/COMPLETED.json"
CLOSURE_DIR="$SOAK_DIR/post-soak-staging-live-closure"
LOG="$CLOSURE_DIR/closure-chain.log"
STATE="$CLOSURE_DIR/closure-watcher-state.json"
POLL_SEC="${P2FC_CLOSURE_CHAIN_POLL_SEC:-300}"
WATCH=0
PREP_ONLY=0
SKIP_U02=0
ADMIN_ONLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=1; shift ;;
    --prep-only) PREP_ONLY=1; shift ;;
    --skip-u02) SKIP_U02=1; shift ;;
    --admin-only) ADMIN_ONLY=1; shift ;;
    -h|--help)
      sed -n '2,18p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$CLOSURE_DIR"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

write_plan() {
  node -e "
const fs=require('fs');
const plan={
  schema:'traveltrust.p2fc_post_soak_staging_live_closure_plan.v1',
  prepared_at_utc:new Date().toISOString(),
  mr12_unchanged:true,
  prep_is_not_go:true,
  trigger:process.argv[1]+'/COMPLETED.json',
  execution_order:[
    {step:0, gate:'evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json', note:'S0 Soak complete'},
    {step:1, script:'scripts/ops/p2fc-post-soak-one-shot-execute.sh', gate:'TT_P2FC_POST_SOAK_ONE_SHOT: PASS', note:'S1 MR12'},
    {step:2, script:'scripts/dev/record-adm-u01-staging-evidence.sh', gate:'ADM-U01 release_gate GO', note:'S2 ADM-U01 live'},
    {step:3, script:'scripts/ops/p2fc-verify-p0-rbac-bypass-runtime.sh', gate:'TT_P2FC_P0_RBAC_BYPASS_RUNTIME: CONFIRMED', note:'S3 P0 runtime'},
    {step:4, script:'scripts/dev/gen-p2fc-post-soak-staging-live-closure-evidence.py', gate:'open_blocker_count=0', note:'S4 B1-B4'},
    {step:5, script:'scripts/dev/record-adm-u02-staging-evidence.sh', gate:'TT_ADM_U02_STAGING_EVIDENCE PASS + GO', note:'S5 ADM-U02 live'},
    {step:6, script:'scripts/dev/gen-p2fc-web3-live-risk-convergence.py', gate:'D3 verdict PASS', note:'S6 D3'},
    {step:7, script:'scripts/dev/gen-p2fc-web3-live-risk-convergence.py', gate:'D124 open_warn_count=0', note:'S7 D1/D2/D4'},
    {step:8, script:'scripts/ops/p2fc-gate-admin-staging-go-claim.sh', gate:'TT_ADMIN_STAGING_GO_CLAIM ALLOWED', note:'runtime adjudication only'},
  ],
  execution_order_summary:'S0 COMPLETED → S1 MR12 → S2 ADM-U01 → S3 P0 → S4 B1-B4 → S5 ADM-U02 → S6 D3 → S7 D1/D2/D4 → TT_ADMIN_STAGING_GO_CLAIM + TT_LIVE_CLOSURE_CHAIN_VERDICT',
  unique_closure_loop:[
    'COMPLETED.json',
    'MR12 one-shot PASS',
    'ADM-U01 live release_gate=GO (persistent_host)',
    'P0 Runtime CONFIRMED',
    'TT_ADMIN_STAGING_GO_CLAIM=ALLOWED',
  ],
  forbidden_as_admin_go_or_phase2_closure_or_production_go:[
    'prep_ready','static_p0_confirmed','tunnel_ephemeral','local_smoke',
    'watcher_alive','health_200_only','meta_unreachable','mr12_prep_only',
  ],
  discipline_audit:'scripts/ops/p2fc-audit-admin-go-closure-discipline-readonly.sh',
  admin_go_ssot:'TT_ADMIN_STAGING_GO_CLAIM',
  admin_go_ssot_registry:'registry/admin-staging-go-claim-ssot.v1.yaml',
  admin_go_query:'scripts/ops/p2fc-query-admin-staging-go-claim.sh',
  live_closure_chain_ssot:'registry/live-closure-chain-ssot.v1.yaml',
  live_closure_verdict_query:'scripts/ops/p2fc-query-live-closure-verdict.sh',
  runtime_adjudication_query:'scripts/ops/p2fc-query-runtime-adjudication.sh',
  runtime_adjudication_ssot:['TT_LIVE_CLOSURE_CHAIN_VERDICT','TT_ADMIN_STAGING_GO_CLAIM'],
  post_completed_only_entrypoint:'scripts/ops/p2fc-post-soak-staging-live-closure-chain.sh --watch',
  default_verdicts:{admin_go:'NO',phase2_closure:'NO',production_go:'NO'},
  adjudication_basis_only:['release_gate','runtime_evidence','closure_ssot'],
  orchestrators:{
    one_shot_watcher:'scripts/ops/p2fc-post-soak-one-shot-execute.sh --watch',
    priority_sequential:'scripts/ops/p2fc-post-soak-priority-closure-sequential.sh --execute',
    master:'scripts/ops/p2fc-post-soak-staging-live-closure-chain.sh --watch',
  },
  honest_boundary:'① prep/static CONFIRMED ≠ ② live GO',
};
fs.writeFileSync(process.argv[2], JSON.stringify(plan,null,2)+'\n');
" "$SOAK_DIR" "$CLOSURE_DIR/execution-plan.json"
}

run_prep() {
  {
    echo "${ts} closure-chain prep: START"
    bash "$ROOT/scripts/ops/p2fc-verify-mr12-execution-lock.sh"
    PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-adm-u01-staging-live-prep.py" \
      --soak-dir "$SOAK_DIR" --merge-web3-ssot 2>&1 | tail -5 || true
    write_plan
    bash "$ROOT/scripts/ops/p2fc-audit-admin-go-closure-discipline-readonly.sh" 2>&1 | tail -1 || true
  bash "$ROOT/scripts/ops/p2fc-query-runtime-adjudication.sh" --refresh 2>&1 | tail -2 || true
    echo "${ts} closure-chain prep: done (no deploy · no fly capture · soak unchanged)"
  } >>"$LOG" 2>&1
  echo "TT_P2FC_POST_SOAK_STAGING_LIVE_CLOSURE_CHAIN: PREP_ONLY plan=$CLOSURE_DIR/execution-plan.json"
}

[[ "$PREP_ONLY" -eq 1 ]] && { run_prep; exit 0; }

wait_completed() {
  p2fc_soak_watcher_wait_completed "$ROOT" "$SOAK_DIR" "$LOG" "$STATE" "$POLL_SEC"
}

if [[ "$WATCH" -eq 1 && "$ADMIN_ONLY" -eq 0 ]]; then
  echo $$ >"$CLOSURE_DIR/closure-chain-watcher.pid"
  echo "${ts} closure-chain: watch for COMPLETED.json poll=${POLL_SEC}s" >>"$LOG"
  wait_completed || {
    echo "TT_P2FC_POST_SOAK_STAGING_LIVE_CLOSURE_CHAIN: FAIL watcher_abort" >&2
    exit 2
  }
fi

[[ -f "$COMPLETED" ]] || {
  echo "closure-chain: FAIL missing $COMPLETED (use --watch or --prep-only during soak)" >&2
  exit 2
}

{
  echo "${ts} closure-chain: COMPLETED.json detected"
  bash "$ROOT/scripts/ops/p2fc-verify-mr12-execution-lock.sh"

  if [[ "$ADMIN_ONLY" -eq 0 ]]; then
    if grep -q 'TT_P2FC_POST_SOAK_ONE_SHOT: PASS' "$SOAK_DIR/post-soak-one-shot/one-shot.log" 2>/dev/null; then
      echo "closure-chain: MR12 one-shot already PASS — priority chain will skip S1"
    else
      echo "closure-chain: MR12 pending — priority sequential will run S1"
    fi
  fi

  echo "--- Priority closure sequential (S0–S7 · GO gate after D3/D124) ---"
  if [[ "$ADMIN_ONLY" -eq 1 ]]; then
    bash "$ROOT/scripts/ops/p2fc-run-post-soak-admin-staging-live-chain.sh" 2>&1 | tee -a "$LOG"
    PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-post-soak-staging-live-closure-evidence.py" \
      --soak-dir "$SOAK_DIR" 2>&1 | tee -a "$LOG"
  else
    bash "$ROOT/scripts/ops/p2fc-post-soak-priority-closure-sequential.sh" --execute 2>&1 | tee -a "$LOG"
  fi

  bash "$ROOT/scripts/ops/p2fc-query-runtime-adjudication.sh" --refresh 2>&1 | tee -a "$LOG" || true

  echo "${ts} TT_P2FC_POST_SOAK_STAGING_LIVE_CLOSURE_CHAIN: PASS"
} 2>&1 | tee -a "$LOG"

exit 0
