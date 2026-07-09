#!/usr/bin/env bash
# ① Site10 · G3 pre-100 内存压力后 guest likes/collects 稳定性验证（不改断言模型）
#
# 复现 rerun18：~98/846 处 FE memory watcher restart → collects 访客 poll 假红。
# 模式：
#   stability  暖机（data-state 前全 spec 文件）+ 同 FE 探针 · __NEXT_DISABLE_MEMORY_WATCHER + 可选 heap
#   split      暖机后杀 3012 · 冷 FE 仅跑 guest likes/collects 探针
#   all        stability 后 split（对照）
#
# 用法（仓库根）：
#   bash scripts/dev/run-site10-g3-guest-gate-fe-restart-stability.sh stability
#   bash scripts/dev/run-site10-g3-guest-gate-fe-restart-stability.sh split
#   bash scripts/dev/run-site10-g3-guest-gate-fe-restart-stability.sh all
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
MODE="${1:-stability}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$EVID/site10-g3-guest-gate-fe-stability-${MODE}-${STAMP}.log"

# shellcheck source=scripts/dev/export-database-url-from-root-env.sh
source "$ROOT/scripts/dev/export-database-url-from-root-env.sh"

export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
export PLAYWRIGHT_E2E_STABILITY="${PLAYWRIGHT_E2E_STABILITY:-1}"
export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
export PLAYWRIGHT_REUSE_FE_SERVER="${PLAYWRIGHT_REUSE_FE_SERVER:-0}"
export PLAYWRIGHT_SKIP_NEXT_PURGE="${PLAYWRIGHT_SKIP_NEXT_PURGE:-1}"
export PLAYWRIGHT_LOCAL_SITE10_MATRIX="${PLAYWRIGHT_LOCAL_SITE10_MATRIX:-1}"
export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE="${TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE:-1}"
export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE="${NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE:-1}"
unset REQUIRE_IDEMPOTENCY_KEY

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG"; }

kill_fe_port() {
  local port="${1:-3012}"
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command \
      "\$p = @(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); foreach (\$x in \$p) { if (\$x -and \$x -ne 0) { Stop-Process -Id \$x -Force -ErrorAction SilentlyContinue } }" \
      >/dev/null 2>&1 || true
  else
    bash -lc "pids=\$(lsof -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null || true); if [ -n \"\$pids\" ]; then kill -9 \$pids 2>/dev/null || true; fi" || true
  fi
}

mapfile -t PRE100_FILES < <(
  for f in "$ROOT/frontend/e2e"/*.spec.ts "$ROOT/frontend/e2e"/*.body.ts; do
    [[ -f "$f" ]] || continue
    basename "$f"
  done | sort | awk '/^community-me-data-state\.spec\.ts$/{exit} {print "e2e/" $0}'
)

GUEST_PROBE=(
  "e2e/community-me-data-state.spec.ts"
  "e2e/community-me-l5-a-parity-closeout.spec.ts"
)
GUEST_GREP='赞过列表访客|收藏列表访客|guest collects dedicated|guest likes dedicated'

run_warmup() {
  log "warmup: ${#PRE100_FILES[@]} spec files before community-me-data-state (same FE)"
  cd "$ROOT/frontend"
  set +e
  npx playwright test "${PRE100_FILES[@]}" --project=chromium --workers=1 2>&1 | tee -a "$LOG"
  local rc=${PIPESTATUS[0]}
  set -e
  log "warmup exit_code=$rc (non-zero allowed; probe is acceptance signal)"
  local restart_n
  restart_n="$(grep -c "memory threshold, restarting" "$LOG" 2>/dev/null || echo 0)"
  log "warmup FE memory restart count so far: ${restart_n}"
}

run_guest_probe() {
  local label="$1"
  log "guest probe ($label): likes/collects auth-gate · same assertion model"
  cd "$ROOT/frontend"
  set +e
  npx playwright test "${GUEST_PROBE[@]}" --grep "$GUEST_GREP" --project=chromium --workers=1 2>&1 | tee -a "$LOG"
  local rc=${PIPESTATUS[0]}
  set -e
  log "guest probe ($label) exit_code=$rc"
  return "$rc"
}

run_warmup_and_probe_same_fe() {
  local label="$1"
  log "unified run ($label): ${#PRE100_FILES[@]} pre100 files + data-state guest lines (same FE session)"
  cd "$ROOT/frontend"
  set +e
  npx playwright test "${PRE100_FILES[@]}" \
    e2e/community-me-data-state.spec.ts:50 \
    e2e/community-me-data-state.spec.ts:62 \
    --project=chromium --workers=1 2>&1 | tee -a "$LOG"
  local rc=${PIPESTATUS[0]}
  set -e
  log "unified pre100+guest-data-state exit_code=$rc"
  local restart_n
  restart_n="$(grep -c "memory threshold, restarting" "$LOG" 2>/dev/null || echo 0)"
  log "FE memory restart count: ${restart_n}"
  return "$rc"
}

run_guest_probe_parity() {
  local label="$1"
  log "parity guest probe ($label): collects/likes · reuse FE when up"
  cd "$ROOT/frontend"
  export PLAYWRIGHT_REUSE_FE_SERVER=1
  set +e
  npx playwright test e2e/community-me-l5-a-parity-closeout.spec.ts \
    --grep "guest collects dedicated|guest likes dedicated" \
    --project=chromium --workers=1 2>&1 | tee -a "$LOG"
  local rc=${PIPESTATUS[0]}
  set -e
  log "parity guest probe ($label) exit_code=$rc"
  return "$rc"
}

run_stability_mode() {
  export PLAYWRIGHT_SITE10_MATRIX_FE_STABILITY=1
  export PLAYWRIGHT_SITE10_FE_HEAP_MB="${PLAYWRIGHT_SITE10_FE_HEAP_MB:-16384}"
  export PLAYWRIGHT_REUSE_FE_SERVER=0
  log "mode=stability · __NEXT_DISABLE_MEMORY_WATCHER=1 · heap=${PLAYWRIGHT_SITE10_FE_HEAP_MB}MB"
  run_warmup_and_probe_same_fe "stability-same-fe"
  local rc_data=$?
  run_guest_probe_parity "post-data-state-same-fe"
  local rc_parity=$?
  if [[ "$rc_data" -ne 0 || "$rc_parity" -ne 0 ]]; then
    return 1
  fi
  return 0
}

run_split_mode() {
  unset PLAYWRIGHT_SITE10_MATRIX_FE_STABILITY
  unset PLAYWRIGHT_SITE10_FE_HEAP_MB
  log "mode=split · warmup then cold FE before guest probe"
  run_warmup
  log "split: killing FE :3012 for cold guest probe"
  kill_fe_port 3012
  sleep 3
  export PLAYWRIGHT_REUSE_FE_SERVER=0
  run_guest_probe "post-warmup-cold-fe"
}

log "=== site10 g3 guest-gate FE restart stability · mode=$MODE · $STAMP ==="
log "PRE100_FILES=${#PRE100_FILES[@]} · log=$LOG"

case "$MODE" in
  stability)
    run_stability_mode
    rc=$?
    ;;
  split)
    run_split_mode
    rc=$?
    ;;
  all)
    run_stability_mode
    rc_s=$?
    kill_fe_port 3012
    sleep 2
    run_split_mode
    rc_p=$?
    rc=$((rc_s != 0 ? rc_s : rc_p))
    ;;
  *)
    echo "usage: $0 {stability|split|all}" >&2
    exit 2
    ;;
esac

restarts="$(grep -c "memory threshold, restarting" "$LOG" 2>/dev/null || echo 0)"
collects_fail="$(grep -c "收藏列表访客" "$LOG" | head -1 || true)"
log "summary: FE_restart_log_lines=$restarts · guest_probe_exit=$rc · log=$LOG"
if [[ "$rc" -eq 0 && "$restarts" -eq 0 ]]; then
  log "TT_SITE10_GUEST_GATE_FE_STABILITY: OK (collects/likes probe green · no FE restart in log)"
elif [[ "$rc" -eq 0 ]]; then
  log "TT_SITE10_GUEST_GATE_FE_STABILITY: PARTIAL (probe green but FE restart seen — check log)"
else
  log "TT_SITE10_GUEST_GATE_FE_STABILITY: FAIL (guest probe red — see log; do not expand assertion model)"
fi
exit "$rc"
