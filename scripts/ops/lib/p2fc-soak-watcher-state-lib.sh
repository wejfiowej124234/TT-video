#!/usr/bin/env bash
# P2FC · post-soak watcher Soak 四态机（alive / stalled / failed / completed）
# 只升级编排层 · 不改 soak-worker · 不 deploy staging
#
# shellcheck source=scripts/ops/lib/p2fc-soak-watcher-state-lib.sh
set -euo pipefail

# stdout: JSON { soak_state, action, alive, ok_polls, ... }
# action: continue | warn | abort
p2fc_soak_watcher_parse_attest() {
  local line="${1:-}"
  node -e "
const line=String(process.argv[1]||'');
const base={soak_state:'unknown',action:'continue',alive:null,ok_polls:null,fail_polls:null,remaining_sec:null,raw:line};
if(!line){base.soak_state='missing';base.action='abort';console.log(JSON.stringify(base));process.exit(0);}
if(line.startsWith('GO|')){base.soak_state='completed';base.action='continue';console.log(JSON.stringify(base));process.exit(0);}
if(line.startsWith('MISSING|')){base.soak_state='missing';base.action='abort';base.reason='soak_job_missing';console.log(JSON.stringify(base));process.exit(0);}
if(!line.startsWith('INFLIGHT|')){base.soak_state='unknown';base.action='warn';console.log(JSON.stringify(base));process.exit(0);}
const m={};
for(const part of line.replace(/^INFLIGHT\\|/,'').split(' ')){
  let k,v;
  if(part.includes('~=')){ [k,v]=part.split('~='); }
  else { const i=part.indexOf('='); if(i<0) continue; k=part.slice(0,i); v=part.slice(i+1); }
  if(k) m[k]=v;
}
base.alive=Number(m.alive);
base.ok_polls=Number(m.ok_polls);
base.fail_polls=Number(m.fail_polls);
const rem=String(m.remaining_sec||'').replace(/^~=/,'');
base.remaining_sec=rem===''?null:Number(rem);
base.soak_state=base.alive===1?'alive':'failed';
base.action='continue';
console.log(JSON.stringify(base));
" "$line"
}

# 写入/读取 watcher 状态文件（ok_polls 冻结检测）
p2fc_soak_watcher_load_state() {
  local f="$1"
  if [[ -f "$f" ]]; then
    cat "$f"
  else
    echo '{"last_ok_polls":null,"last_ok_polls_at_unix":null,"dead_streak":0,"stall_warned":false}'
  fi
}

p2fc_soak_watcher_save_state() {
  local f="$1" json="$2"
  mkdir -p "$(dirname "$f")"
  printf '%s\n' "$json" >"$f"
}

# 评估四态 + abort/warn 分流；stdout 末行 TT_P2FC_WATCHER:*
# 返回 0=continue 1=warn(仍continue) 2=abort
p2fc_soak_watcher_eval_cycle() {
  local soak_dir="$1" attest_line="$2" state_file="$3"
  local fail_json="$soak_dir/FAIL.json"
  local completed="$soak_dir/COMPLETED.json"
  local dead_streak_max="${P2FC_WATCHER_DEAD_STREAK_ABORT:-3}"
  local stall_sec="${P2FC_WATCHER_STALL_SEC:-7200}"
  local now last_json parsed soak_state action reason
  now="$(date +%s)"

  if [[ -f "$completed" ]]; then
    echo "TT_P2FC_WATCHER: soak_state=completed action=continue"
    return 0
  fi

  if [[ -f "$fail_json" ]]; then
    reason="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).reason||'fail_json')}catch{console.log('fail_json')}" "$fail_json" 2>/dev/null || echo fail_json)"
    echo "TT_P2FC_WATCHER_ABORT: soak_state=failed reason=${reason} signal=FAIL.json" >&2
    return 2
  fi

  parsed="$(p2fc_soak_watcher_parse_attest "$attest_line")"
  soak_state="$(node -e "console.log(JSON.parse(process.argv[1]).soak_state)" "$parsed")"
  local alive ok_polls remaining
  alive="$(node -e "const o=JSON.parse(process.argv[1]);console.log(o.alive==null?'':o.alive)" "$parsed")"
  ok_polls="$(node -e "const o=JSON.parse(process.argv[1]);console.log(o.ok_polls==null?'':o.ok_polls)" "$parsed")"
  remaining="$(node -e "const o=JSON.parse(process.argv[1]);console.log(o.remaining_sec==null?'':o.remaining_sec)" "$parsed")"

  if [[ "$soak_state" == "missing" ]]; then
    echo "TT_P2FC_WATCHER_ABORT: soak_state=failed reason=soak_job_missing signal=attest_MISSING" >&2
    return 2
  fi

  last_json="$(p2fc_soak_watcher_load_state "$state_file")"
  local dead_streak last_ok last_ok_at stall_warned frozen_sec
  dead_streak="$(node -e "console.log(JSON.parse(process.argv[1]).dead_streak||0)" "$last_json")"
  last_ok="$(node -e "const o=JSON.parse(process.argv[1]);console.log(o.last_ok_polls==null?'':o.last_ok_polls)" "$last_json")"
  last_ok_at="$(node -e "const o=JSON.parse(process.argv[1]);console.log(o.last_ok_polls_at_unix==null?'':o.last_ok_polls_at_unix)" "$last_json")"
  stall_warned="$(node -e "console.log(JSON.parse(process.argv[1]).stall_warned?'1':'0')" "$last_json")"

  # --- failed: alive=0 ---
  if [[ "$alive" == "0" ]]; then
    dead_streak=$((dead_streak + 1))
    soak_state="failed"
    if [[ "$dead_streak" -ge "$dead_streak_max" ]]; then
      p2fc_soak_watcher_save_state "$state_file" "$(node -e "
const o=JSON.parse(process.argv[1]);
o.dead_streak=Number(process.argv[2]);
o.evaluated_at_utc=new Date().toISOString();
o.soak_state='failed';
console.log(JSON.stringify(o));
" "$last_json" "$dead_streak")"
      echo "TT_P2FC_WATCHER_ABORT: soak_state=failed reason=alive=0 dead_streak=${dead_streak} attest=${attest_line:-MISSING}" >&2
      return 2
    fi
  elif [[ "$soak_state" == "unknown" ]]; then
    dead_streak=$((dead_streak + 1))
    if [[ "$dead_streak" -ge "$dead_streak_max" ]]; then
      echo "TT_P2FC_WATCHER_ABORT: soak_state=failed reason=unknown_attest dead_streak=${dead_streak}" >&2
      return 2
    fi
  else
    dead_streak=0
  fi

  # --- stalled: alive=1 · ok_polls 冻结 ---
  frozen_sec=0
  if [[ "$soak_state" == "alive" && -n "$ok_polls" ]]; then
    if [[ -z "$last_ok" || "$last_ok" != "$ok_polls" ]]; then
      last_ok="$ok_polls"
      last_ok_at="$now"
      stall_warned=0
    elif [[ -n "$last_ok_at" ]]; then
      frozen_sec=$((now - last_ok_at))
      if [[ "$frozen_sec" -ge "$stall_sec" ]]; then
        soak_state="stalled"
      fi
    fi
  fi

  p2fc_soak_watcher_save_state "$state_file" "$(node -e "
const o=JSON.parse(process.argv[1]);
o.dead_streak=Number(process.argv[2]);
o.last_ok_polls=process.argv[3]===''?null:Number(process.argv[3]);
o.last_ok_polls_at_unix=process.argv[4]===''?null:Number(process.argv[4]);
o.stall_warned=process.argv[5]==='1';
o.frozen_sec=Number(process.argv[6]);
o.soak_state=process.argv[7];
o.evaluated_at_utc=new Date().toISOString();
console.log(JSON.stringify(o));
" "$last_json" "$dead_streak" "${last_ok:-}" "${last_ok_at:-}" "$stall_warned" "$frozen_sec" "$soak_state")"

  if [[ "$soak_state" == "stalled" ]]; then
    echo "TT_P2FC_WATCHER_WARN: soak_state=stalled action=continue ok_polls=${ok_polls} frozen_sec=${frozen_sec} threshold_sec=${stall_sec} remaining=${remaining:-?}" >&2
    return 1
  fi

  echo "TT_P2FC_WATCHER: soak_state=${soak_state} action=continue alive=${alive:-?} ok_polls=${ok_polls:-?} remaining=${remaining:-?} dead_streak=${dead_streak}"
  return 0
}

# 等待 COMPLETED.json · 四态分流
#   $1=ROOT $2=SOAK_DIR $3=LOG $4=STATE_FILE $5=POLL_SEC
p2fc_soak_watcher_wait_completed() {
  local root="$1" soak_dir="$2" log="$3" state_file="$4" poll_sec="${5:-300}"
  local completed="$soak_dir/COMPLETED.json"
  local ts line rc watcher_line

  mkdir -p "$(dirname "$state_file")"
  echo "p2fc-soak-watcher: START state_file=$state_file dead_streak_abort=${P2FC_WATCHER_DEAD_STREAK_ABORT:-3} stall_sec=${P2FC_WATCHER_STALL_SEC:-7200}" | tee -a "$log"

  while [[ ! -f "$completed" ]]; do
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    line="$(P2FC_SOAK_DIR="$soak_dir" bash "$root/scripts/ops/p2fc-soak-attest.sh" 2>/dev/null || true)"
    if [[ -f "$root/scripts/ops/p2fc-record-meta-observability.sh" ]]; then
      bash "$root/scripts/ops/p2fc-record-meta-observability.sh" 2>/dev/null || true
    fi

    set +e
    watcher_line="$(p2fc_soak_watcher_eval_cycle "$soak_dir" "$line" "$state_file")"
    rc=$?
    set -e

    echo "${ts} one-shot: waiting COMPLETED.json attest=${line:-MISSING}" | tee -a "$log"
    echo "${ts} ${watcher_line}" | tee -a "$log"

    if [[ "$rc" -eq 2 ]]; then
      echo "TT_P2FC_WATCHER_ABORT: post-soak chain halted (no deploy) — relaunch soak or clear FAIL after owner review" | tee -a "$log" >&2
      return 2
    fi

    sleep "$poll_sec"
  done

  echo "TT_P2FC_WATCHER: soak_state=completed action=proceed COMPLETED.json" | tee -a "$log"
  return 0
}
