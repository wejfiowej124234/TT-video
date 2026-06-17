#!/usr/bin/env bash
# P2FC · 72h soak attestation (COMPLETED.json only · never inline 72h in orchestrator)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_ROOT="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H}"
COMPLETED="$SOAK_ROOT/COMPLETED.json"
REQUIRED="${P2FC_SOAK_REQUIRED_SEC:-259200}"

if [[ -f "$COMPLETED" ]]; then
  echo "GO|$COMPLETED"
  exit 0
fi

best_job=""
best_ok=0
best_pid=""
best_alive=0

scan_root="${P2FC_SOAK_DIR:-$SOAK_ROOT}"
if [[ -d "$scan_root" ]]; then
  for job in "$scan_root"/job-*; do
    [[ -d "$job" ]] || continue
    [[ -f "$job/pid.txt" ]] || continue
    pid="$(cat "$job/pid.txt" 2>/dev/null || echo "")"
    alive=0
    [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && alive=1
    ok_polls="$(grep -c 'health=200' "$job/soak.log" 2>/dev/null || echo 0)"
    if [[ "$ok_polls" -gt "$best_ok" ]] || { [[ "$ok_polls" -eq "$best_ok" ]] && [[ "$alive" -gt "$best_alive" ]]; }; then
      best_ok="$ok_polls"
      best_job="$job"
      best_pid="$pid"
      best_alive="$alive"
    fi
  done
fi

if [[ -n "$best_job" ]]; then
  fail_polls="$(grep -E 'health=(000|[^2])' "$best_job/soak.log" 2>/dev/null | grep -vc 'health=200' || echo 0)"
  elapsed=$((best_ok * ${P2FC_SOAK_POLL_SEC:-60}))
  remaining=$((REQUIRED - elapsed))
  [[ "$remaining" -lt 0 ]] && remaining=0
  echo "INFLIGHT|job=$best_job pid=$best_pid alive=$best_alive ok_polls=$best_ok fail_polls=$fail_polls elapsed_sec~=$elapsed remaining_sec~=$remaining required_sec=$REQUIRED"
  exit 2
fi

echo "MISSING|no COMPLETED.json and no soak job dir under $scan_root"
exit 3
