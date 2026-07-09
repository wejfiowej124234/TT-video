#!/usr/bin/env bash
# P2FC · post-soak 四阻断项只读观测（Soak 窗口 · 不 deploy · 不重启 · 不改策略）
#
# 观测 L5 预审确认的 4 项 open 态 + MR12 execution lock 一致性（零漂移）：
#   B1 TN-P1-010 · B2 Wave1 itineraries hub · B3 G06–G08 · B4 db 复合依赖
#
#   bash scripts/ops/p2fc-watch-post-soak-blockers-readonly.sh           # 单次
#   bash scripts/ops/p2fc-watch-post-soak-blockers-readonly.sh --watch   # 轮询（默认 600s）
#
# COMPLETED.json 前须 mr12_drift=false · lock=FROZEN · strategy=STRAT-A_PLUS_MR12
# 末行：TT_P2FC_POST_SOAK_BLOCKERS_WATCH: INFLIGHT|HANDOFF|DRIFT
#       TT_MR12_EXECUTION_LOCK: FROZEN|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
AUDIT_DIR="$SOAK_DIR/post-soak-preblock-l5-audit"
LOG="$AUDIT_DIR/blocker-watch.log"
PID_FILE="$AUDIT_DIR/blocker-watch.pid"
SNAP="$AUDIT_DIR/blocker-watch.latest.json"
MR12_BASELINE="$AUDIT_DIR/blocker-watch-mr12-baseline.json"
LOCK_PATH="$ROOT/evidence/GO_phase2_deploy_backlog/MR12-EXECUTION-LOCK.json"
READY_PATH="$ROOT/evidence/GO_phase2_deploy_backlog/POST_SOAK_EXECUTE_READY.json"
POLL_SEC="${P2FC_BLOCKER_WATCH_POLL_SEC:-600}"
WATCH=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=1; shift ;;
    -h|--help)
      sed -n '2,16p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$AUDIT_DIR"

mr12_consistency_check() {
  local verify_line="" verify_rc=0
  set +e
  verify_line="$(bash "$ROOT/scripts/ops/p2fc-verify-mr12-execution-lock.sh" 2>&1 | grep -E '^TT_MR12_EXECUTION_LOCK:' | tail -1)"
  verify_rc=$?
  set -e
  echo "${verify_line:-TT_MR12_EXECUTION_LOCK: FAIL no_output}"
  return "$verify_rc"
}

ensure_mr12_baseline() {
  [[ -f "$MR12_BASELINE" ]] && return 0
  [[ -f "$LOCK_PATH" ]] || return 0
  node -e "
const fs=require('fs');
const lock=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const ready=fs.existsSync(process.argv[2])?JSON.parse(fs.readFileSync(process.argv[2],'utf8')):{};
const baseline={
  schema:'traveltrust.p2fc_mr12_blocker_watch_baseline.v1',
  recorded_at_utc:new Date().toISOString(),
  locked_strategy:lock.locked_strategy,
  rejected_strategies:lock.rejected_strategies,
  entrypoint:lock.entrypoint,
  mr_changes:lock.mr_changes,
  execution_order:ready.execution_order||lock.execution_sequence_locked?.map(s=>s.action),
  lock_status:lock.lock_status,
};
fs.writeFileSync(process.argv[3], JSON.stringify(baseline,null,2)+'\n');
" "$LOCK_PATH" "$READY_PATH" "$MR12_BASELINE"
}

run_once() {
  local ts soak_line completed=0 verdict="INFLIGHT"
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  soak_line="$(P2FC_SOAK_DIR="$SOAK_DIR" P2FC_SOAK_ATTEST_FAST=1 bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" 2>&1 || true)"

  [[ -f "$SOAK_DIR/COMPLETED.json" ]] && completed=1

  ensure_mr12_baseline

  local mr12_verify_line="" mr12_verify_rc=0
  mr12_verify_line="$(mr12_consistency_check)" || mr12_verify_rc=$?

  local mr12_lock="missing"
  if [[ -f "$LOCK_PATH" ]]; then
    mr12_lock="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).lock_status||'unknown')}catch{console.log('unreadable')}" "$LOCK_PATH")"
  fi

  local tn_gate="{}"
  tn_gate="$(node "$ROOT/scripts/dev/lib/tn-p1-010-graduation-gate.mjs" --root "$ROOT" --soak-dir "$SOAK_DIR" --status-only 2>/dev/null || echo '{}')"

  local checkpoint="{}"
  [[ -f "$SOAK_DIR/post-soak-one-shot/checkpoint.json" ]] && \
    checkpoint="$(cat "$SOAK_DIR/post-soak-one-shot/checkpoint.json" 2>/dev/null || echo '{}')"

  local tn_phase="pending"
  tn_phase="$(node -e "try{const c=JSON.parse(process.argv[1]);console.log((c.phases||{}).tn_p1_010?.status||'pending')}catch{console.log('pending')}" "$checkpoint")"

  local one_shot_exec=0
  if [[ -f "$SOAK_DIR/post-soak-one-shot/checkpoint.json" ]]; then
    node -e "
const c=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
const p=c.phases||{};
const execPhases=['tn_p1_010','rollback_snapshot','apply_patches','wave1_api_deploy','wave2_web_deploy','meta_availability','g02_deep_gate','graduation'];
process.exit(execPhases.some(k=>p[k]?.status==='RUNNING'||p[k]?.status==='PASS')?0:1);
" "$SOAK_DIR/post-soak-one-shot/checkpoint.json" 2>/dev/null && one_shot_exec=1 || true
  fi

  [[ "$completed" -eq 1 ]] && verdict="HANDOFF"
  [[ "$tn_phase" == "PASS" && "$completed" -eq 1 ]] && verdict="CLEARED_PARTIAL"

  local tmp_in="$AUDIT_DIR/.blocker-watch-input.json"
  node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  ts:process.argv[2],
  soak_line:process.argv[3],
  completed:process.argv[4]==='1',
  mr12_lock:process.argv[5],
  mr12_verify_rc:Number(process.argv[6]),
  mr12_verify_line:process.argv[7],
  one_shot_exec:process.argv[8]==='1',
  tn_gate:JSON.parse(process.argv[9]||'{}'),
  tn_phase:process.argv[10],
  verdict:process.argv[11],
  snap:process.argv[12],
  log:process.argv[13],
  lock_path:process.argv[14],
  ready_path:process.argv[15],
  baseline_path:process.argv[16],
},null,0));
" "$tmp_in" "$ts" "$soak_line" "$completed" "$mr12_lock" "$mr12_verify_rc" "$mr12_verify_line" \
  "$one_shot_exec" "$tn_gate" "$tn_phase" "$verdict" "$SNAP" "$LOG" "$LOCK_PATH" "$READY_PATH" "$MR12_BASELINE"

  TMP_IN="$tmp_in" node <<'NODE'
const fs = require('fs');
const inp = JSON.parse(fs.readFileSync(process.env.TMP_IN, 'utf8'));
const load = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

const lock = load(inp.lock_path);
const ready = load(inp.ready_path);
const baseline = load(inp.baseline_path);

const driftFields = [];
if (baseline && lock) {
  if (lock.locked_strategy !== baseline.locked_strategy) driftFields.push('locked_strategy');
  if (lock.entrypoint !== baseline.entrypoint) driftFields.push('entrypoint');
  if (JSON.stringify(lock.rejected_strategies || []) !== JSON.stringify(baseline.rejected_strategies || [])) {
    driftFields.push('rejected_strategies');
  }
  if (JSON.stringify(lock.mr_changes || []) !== JSON.stringify(baseline.mr_changes || [])) {
    driftFields.push('mr_changes');
  }
}
if (ready && baseline && ready.execution_strategy && ready.execution_strategy !== baseline.locked_strategy) {
  driftFields.push('ready_execution_strategy');
}

const mr12Drift = driftFields.length > 0;
const mr12Consistent = inp.mr12_verify_rc === 0 && inp.mr12_lock === 'FROZEN' && !mr12Drift;

let verdict = inp.verdict;
if (mr12Drift || inp.mr12_verify_rc !== 0 || inp.mr12_lock !== 'FROZEN') {
  verdict = 'DRIFT';
}

const blockers = [
  { id: 'B1_TN_P1_010', ref: 'TN-B04', phase: inp.completed ? 'post-soak-execute' : 'defer-soak',
    status: inp.tn_gate.pass ? 'cleared' : 'open',
    note: inp.completed ? 'COMPLETED — await MR12 step-1 tn_p1_010' : 'await COMPLETED.json' },
  { id: 'B2_W1_ITINERARIES_HUB', ref: 'W1-B01', phase: 'post-soak-execute', status: 'open',
    note: 'MR-02 defer itineraries.rs from wave1 first deploy (Δ195 hub)' },
  { id: 'B3_G06_G08', ref: 'G06-G08', phase: inp.completed ? 'post-soak-execute' : 'defer-soak', status: 'open',
    note: 'G06 soak · G07 TN+indexer · G08 deep surface — post one-shot chain' },
  { id: 'B4_DB_COMPOUND', ref: 'TN-B02/B03', phase: 'post-soak-execute', status: 'open',
    note: 'db/mod.rs + itineraries compound — TN-P1-010 before wave1' },
];

const openCount = blockers.filter((b) => b.status === 'open').length;

const payload = {
  schema: 'traveltrust.p2fc_post_soak_blocker_watch.v2',
  observed_at_utc: inp.ts,
  soak_attest: inp.soak_line,
  completed_json: inp.completed,
  read_only: true,
  no_deploy: true,
  no_restart: true,
  no_strategy_change: true,
  execution_strategy: 'STRAT-A_PLUS_MR12',
  mr12_execution_lock: {
    lock_status: inp.mr12_lock,
    verify_line: inp.mr12_verify_line,
    verify_rc: inp.mr12_verify_rc,
    consistent: mr12Consistent,
    drift: mr12Drift,
    drift_fields: driftFields,
    zero_drift_pre_completed: inp.completed ? null : !mr12Drift && mr12Consistent,
  },
  one_shot_watcher: 'scripts/ops/p2fc-post-soak-one-shot-execute.sh --watch',
  one_shot_exec_started: inp.one_shot_exec,
  tn_graduation_gate: inp.tn_gate,
  blockers,
  open_blocker_count: openCount,
  checkpoint_tn_phase: inp.tn_phase,
  verdict,
};

if (inp.completed && inp.one_shot_exec) {
  payload.handoff_note = 'COMPLETED seen — MR12 one-shot executing (existing watcher)';
}

fs.writeFileSync(inp.snap, JSON.stringify(payload, null, 2) + '\n');
const logLine = `${inp.ts} TT_P2FC_POST_SOAK_BLOCKERS_WATCH: ${verdict} open=${openCount} mr12_drift=${mr12Drift} lock=${inp.mr12_lock} completed=${inp.completed ? 1 : 0} tn_phase=${inp.tn_phase}`;
fs.appendFileSync(inp.log, logLine + '\n');
console.log(logLine);
if (inp.mr12_verify_line) console.log(inp.mr12_verify_line);
NODE
  rm -f "$tmp_in"
}

if [[ "$WATCH" -eq 0 ]]; then
  run_once
  exit 0
fi

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "p2fc-watch-post-soak-blockers: already running pid=${old_pid} log=${LOG}"
    exit 0
  fi
fi

nohup bash -c "
  ROOT=\"$ROOT\"
  POLL_SEC=\"$POLL_SEC\"
  while true; do
    bash \"\$ROOT/scripts/ops/p2fc-watch-post-soak-blockers-readonly.sh\" || true
    sleep \"\$POLL_SEC\"
  done
" >>"$LOG" 2>&1 &

echo $! >"$PID_FILE"
run_once
echo "p2fc-watch-post-soak-blockers: watch started pid=$(cat "$PID_FILE") poll_sec=${POLL_SEC} log=${LOG}"
exit 0
