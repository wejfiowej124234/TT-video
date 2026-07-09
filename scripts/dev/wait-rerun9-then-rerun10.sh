#!/usr/bin/env bash
# 等 rerun9 矩阵结束 → rerun10（最新代码）→ check-gates → parse-fails
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
ACCEPT="$EVID/site10.acceptance.latest.log"
RERUN_LOG="$EVID/site10-full-rerun6.log"
ORCH_LOG="$EVID/site10-rerun10-orchestrator.log"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$ORCH_LOG"; }

matrix_still_running() {
  if tasklist 2>/dev/null | grep -qiE 'playwright|ms-playwright'; then
    return 0
  fi
  if tasklist 2>/dev/null | grep -i node | grep -qi playwright; then
    return 0
  fi
  # node 大内存进程 + accept log 近期有 [N/949] 更新
  return 1
}

log "orchestrator: waiting for rerun9 to finish (skip old-bundle analysis)"

baseline_exit_count="$(grep -c 'matrix exit_code=' "$RERUN_LOG" 2>/dev/null || echo 0)"
prev_idx=""
stable=0

while true; do
  if grep -q "OK: local-e2e-chromium-full-matrix" "$ACCEPT" 2>/dev/null; then
    log "rerun9 done: G3 marker in accept log"
    break
  fi

  exit_count="$(grep -c 'matrix exit_code=' "$RERUN_LOG" 2>/dev/null || echo 0)"
  if [[ "$exit_count" -gt "$baseline_exit_count" ]]; then
    log "rerun9 done: new matrix exit_code line ($(grep 'matrix exit_code=' "$RERUN_LOG" | tail -1))"
    break
  fi

  last_line="$(grep -E '\[[0-9]+/949\]' "$ACCEPT" 2>/dev/null | tail -1 || true)"
  idx="$(echo "$last_line" | sed -n 's/.*\[\([0-9]*\)\/949\].*/\1/p')"
  if [[ "$idx" == "949" ]]; then
    log "rerun9 at 949/949; waiting 120s for summary…"
    sleep 120
    break
  fi

  if [[ -n "$idx" && "$idx" == "$prev_idx" ]]; then
    stable=$((stable + 1))
  else
    stable=0
    prev_idx="$idx"
  fi

  if [[ $stable -ge 30 ]] && ! matrix_still_running; then
    log "rerun9 appears stopped at ${idx:-?}/949 (no progress 30 min, no playwright process)"
    break
  fi

  log "rerun9 … ${idx:-?}/949 (stable_polls=$stable)"
  sleep 60
done

log "=== rerun10 $(date -u +%Y-%m-%dT%H:%M:%SZ) · latest 31/31 fixes ==="
echo "=== rerun10 $(date -u +%Y-%m-%dT%H:%M:%SZ) · post-rerun9 · latest code ===" | tee -a "$RERUN_LOG"

# shellcheck source=scripts/dev/export-database-url-from-root-env.sh
source "$ROOT/scripts/dev/export-database-url-from-root-env.sh" 2>/dev/null || true
export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}" SEED_TEST_ACCOUNTS=1
export ENTERPRISE_SITE_10_FULL_E2E=1 PLAYWRIGHT_FULL_STACK=1 PLAYWRIGHT_E2E_STABILITY=1
export PLAYWRIGHT_REUSE_API_SERVER=1 PLAYWRIGHT_SKIP_NEXT_PURGE=1 PLAYWRIGHT_LOCAL_SITE10_MATRIX=1
export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1
unset REQUIRE_IDEMPOTENCY_KEY

code="$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL:-http://127.0.0.1:8080}/health" 2>/dev/null || echo "000")"
if [[ "$code" != "200" ]]; then
  log "starting API (health=$code)"
  nohup bash "$ROOT/scripts/dev/start-api-for-playwright.sh" >>"$EVID/site10-api-sidecar.log" 2>&1 &
  for _ in $(seq 1 40); do
    code="$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL:-http://127.0.0.1:8080}/health" 2>/dev/null || echo "000")"
    [[ "$code" == "200" ]] && break
    sleep 2
  done
fi

set +e
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" run-matrix 2>&1 | tee -a "$RERUN_LOG"
rc=${PIPESTATUS[0]}
set -e
log "rerun10 matrix exit_code=$rc"

log "--- check-gates ---"
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" check-gates 2>&1 | tee -a "$ORCH_LOG" || true

log "--- parse-fails (rerun10 only) ---"
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/parse-site10-failures.py" "$ACCEPT" 2>&1 | tee -a "$ORCH_LOG"

log "orchestrator complete · next: fix rerun10 REAL FAIL buckets until G1/G2/G3 OK"
