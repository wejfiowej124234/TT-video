#!/usr/bin/env bash
# P2FC · 72h soak attestation (COMPLETED.json only · never inline 72h in orchestrator)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_ROOT="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
COMPLETED="$SOAK_ROOT/COMPLETED.json"
REQUIRED="${P2FC_SOAK_REQUIRED_SEC:-259200}"

if [[ -f "$COMPLETED" ]]; then
  echo "GO|$COMPLETED"
  exit 0
fi

job_alive() {
  local pid
  pid="$(cat "$1/pid.txt" 2>/dev/null || echo "")"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

job_stamp() {
  basename "$1"
}

job_ok_polls() {
  grep -c 'health=200' "$1/soak.log" 2>/dev/null || echo 0
}

# Prefer: (1) alive worker (2) newest job-* stamp (3) most ok polls
job_is_better() {
  local candidate="$1" current="$2"
  local c_alive=0 cur_alive=0
  job_alive "$candidate" && c_alive=1
  job_alive "$current" && cur_alive=1
  if [[ "$c_alive" -gt "$cur_alive" ]]; then
    return 0
  fi
  if [[ "$c_alive" -lt "$cur_alive" ]]; then
    return 1
  fi
  local c_stamp cur_stamp
  c_stamp="$(job_stamp "$candidate")"
  cur_stamp="$(job_stamp "$current")"
  if [[ "$c_stamp" > "$cur_stamp" ]]; then
    return 0
  fi
  if [[ "$c_stamp" < "$cur_stamp" ]]; then
    return 1
  fi
  [[ "$(job_ok_polls "$candidate")" -gt "$(job_ok_polls "$current")" ]]
}

best_job=""
best_pid=""
best_alive=0
best_ok=0

scan_root="${P2FC_SOAK_DIR:-$SOAK_ROOT}"
if [[ -d "$scan_root" ]]; then
  for job in "$scan_root"/job-*; do
    [[ -d "$job" ]] || continue
    [[ -f "$job/pid.txt" ]] || continue
    if [[ -z "$best_job" ]] || job_is_better "$job" "$best_job"; then
      best_job="$job"
      best_pid="$(cat "$job/pid.txt" 2>/dev/null || echo "")"
      best_ok="$(job_ok_polls "$job")"
      best_alive=0
      job_alive "$job" && best_alive=1
    fi
  done
fi

if [[ -n "$best_job" ]]; then
  fail_polls="$(grep -E 'health=(000|[^2])' "$best_job/soak.log" 2>/dev/null | grep -vc 'health=200' || echo 0)"
  poll_sec="${P2FC_SOAK_POLL_SEC:-60}"
  if [[ -f "$best_job/job.json" ]]; then
    poll_sec="$(node -e "
      try {
        const j = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
        process.stdout.write(String(j.poll_sec || process.argv[2]));
      } catch {
        process.stdout.write(process.argv[2]);
      }
    " "$best_job/job.json" "$poll_sec")"
  fi
  elapsed=$((best_ok * poll_sec))
  remaining=$((REQUIRED - elapsed))
  [[ "$remaining" -lt 0 ]] && remaining=0
  echo "INFLIGHT|job=$best_job pid=$best_pid alive=$best_alive ok_polls=$best_ok fail_polls=$fail_polls elapsed_sec~=$elapsed remaining_sec~=$remaining required_sec=$REQUIRED"
  exit 2
fi

echo "MISSING|no COMPLETED.json and no soak job dir under $scan_root"
exit 3
