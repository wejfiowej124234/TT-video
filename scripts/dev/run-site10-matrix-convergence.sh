#!/usr/bin/env bash
# ① Site10 · 三项闸收敛循环（844 宽矩阵轨 · 旁证）
#
# G2/G3 收敛签字真源（2026-06-23）：run-site10-r22b-denoised-regression-matrix.sh check-gates
#   → TT_SITE10_G2G3_CONVERGENCE_READY: OK（22-key · 非 846/844 冒充）
#
# 本脚本三项闸（844 轨 · 非 G2G3 收敛真源）：
#   G1  P1 切片顺序复跑  TT_SITE10_P1_SLICES_RECHECK: OK  或 recheck pass=25
#   G2  全站企业编排      TT_ENTERPRISE_SITE_10_LOCAL: OK
#   G3  Chromium 全矩阵   OK: local-e2e-chromium-full-matrix
#
# 用法（仓库根）：
#   source scripts/dev/export-database-url-from-root-env.sh
#   export P3_CHAIN_OFF=1 ENTERPRISE_SITE_10_FULL_E2E=1 PLAYWRIGHT_E2E_STABILITY=1
#   export PLAYWRIGHT_REUSE_API_SERVER=1 PLAYWRIGHT_SKIP_NEXT_PURGE=1 PLAYWRIGHT_LOCAL_SITE10_MATRIX=1
#   unset REQUIRE_IDEMPOTENCY_KEY
#   bash scripts/dev/run-site10-matrix-convergence.sh check-gates
#   bash scripts/dev/run-site10-matrix-convergence.sh run-matrix    # 写 site10-full-rerunN.log
#   bash scripts/dev/run-site10-matrix-convergence.sh parse-fails # 真实 FAIL 分桶
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_local_phase1"
ACCEPT_LOG="$EVID/site10.acceptance.latest.log"
RECHECK_LOG="$EVID/site10-p1-slices-recheck.latest.log"
API_BASE="${API_BASE_URL:-http://127.0.0.1:8080}"

ensure_api_health() {
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/health" 2>/dev/null || echo "000")"
  if [[ "$code" != "200" ]]; then
    echo "site10-convergence: starting API (health was ${code})…" >&2
    # shellcheck source=scripts/dev/export-database-url-from-root-env.sh
    source "$ROOT/scripts/dev/export-database-url-from-root-env.sh"
    export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}" SEED_TEST_ACCOUNTS=1
    export API_RATE_LIMIT_PER_MINUTE=0 CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE=0
    nohup bash "$ROOT/scripts/dev/start-api-for-playwright.sh" >>"$EVID/site10-api-sidecar.log" 2>&1 &
    for _ in $(seq 1 40); do
      code="$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/health" 2>/dev/null || echo "000")"
      [[ "$code" == "200" ]] && return 0
      sleep 2
    done
    echo "site10-convergence: FAIL API /health not 200 after wait" >&2
    return 1
  fi
}

check_gates() {
  local g1=0 g2=0 g3=0
  if [[ -f "$RECHECK_LOG" ]] && grep -q "TT_SITE10_P1_SLICES_RECHECK: OK" "$RECHECK_LOG" 2>/dev/null; then
    g1=1
  elif [[ -f "$RECHECK_LOG" ]] && grep -qE "# summary pass=25 fail=0" "$RECHECK_LOG" 2>/dev/null; then
    g1=1
  elif [[ -f "$RECHECK_LOG" ]] && grep -q "effective P1: 25/25" "$RECHECK_LOG" 2>/dev/null; then
    g1=1
  fi
  if [[ -f "$ACCEPT_LOG" ]] && grep -q "TT_ENTERPRISE_SITE_10_LOCAL: OK" "$ACCEPT_LOG" 2>/dev/null; then
    g2=1
  fi
  if [[ -f "$ACCEPT_LOG" ]] && grep -q "OK: local-e2e-chromium-full-matrix" "$ACCEPT_LOG" 2>/dev/null; then
    g3=1
  fi
  echo "G1 P1 slices recheck: $([[ $g1 -eq 1 ]] && echo OK || echo FAIL)"
  echo "G2 TT_ENTERPRISE_SITE_10_LOCAL: $([[ $g2 -eq 1 ]] && echo OK || echo FAIL)"
  echo "G3 local-e2e-chromium-full-matrix: $([[ $g3 -eq 1 ]] && echo OK || echo FAIL)"
  if [[ $g1 -eq 1 && $g2 -eq 1 && $g3 -eq 1 ]]; then
    echo "TT_SITE10_THREE_GATES: OK (① · ready for phase freeze review · not ②③ GO)"
    return 0
  fi
  echo "TT_SITE10_THREE_GATES: FAIL ($((3 - g1 - g2 - g3)) gate(s) open)" >&2
  return 1
}

run_matrix() {
  ensure_api_health
  local lock_file="$EVID/site10-matrix-run.lock"
  if [[ -f "$lock_file" ]]; then
    echo "site10-convergence: FAIL another matrix run in progress (lock: $(cat "$lock_file" 2>/dev/null || echo busy))" >&2
    return 1
  fi
  # shellcheck source=scripts/dev/export-database-url-from-root-env.sh
  source "$ROOT/scripts/dev/export-database-url-from-root-env.sh"
  export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
  export ENTERPRISE_SITE_10_FULL_E2E="${ENTERPRISE_SITE_10_FULL_E2E:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_E2E_STABILITY="${PLAYWRIGHT_E2E_STABILITY:-1}"
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_REUSE_FE_SERVER="${PLAYWRIGHT_REUSE_FE_SERVER:-0}"
  export PLAYWRIGHT_SKIP_NEXT_PURGE="${PLAYWRIGHT_SKIP_NEXT_PURGE:-1}"
  export PLAYWRIGHT_LOCAL_SITE10_MATRIX="${PLAYWRIGHT_LOCAL_SITE10_MATRIX:-1}"
  export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE="${TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE:-1}"
  export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE="${NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE:-1}"
  # rerun19+ · FE stability validated (memory restart=0): disable Next dev memory watcher + 16GB heap
  export PLAYWRIGHT_SITE10_MATRIX_FE_STABILITY="${PLAYWRIGHT_SITE10_MATRIX_FE_STABILITY:-1}"
  export PLAYWRIGHT_SITE10_FE_HEAP_MB="${PLAYWRIGHT_SITE10_FE_HEAP_MB:-16384}"
  unset REQUIRE_IDEMPOTENCY_KEY
  local stamp run_log
  stamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  run_log="$EVID/site10-full-rerun6.log"
  echo "$stamp $$" >"$lock_file"
  trap 'rm -f "$lock_file"' RETURN
  echo "=== convergence run-matrix $stamp ===" | tee -a "$run_log"
  set +e
  bash "$ROOT/scripts/dev/record-enterprise-site-10-acceptance-log.sh" 2>&1 | tee -a "$run_log"
  local rc=${PIPESTATUS[0]}
  set -e
  echo "# matrix exit_code=$rc · $stamp" | tee -a "$run_log"
  return "$rc"
}

parse_fails() {
  python "$ROOT/scripts/dev/parse-site10-failures.py" "$ACCEPT_LOG"
}

cmd="${1:-check-gates}"
case "$cmd" in
  check-gates) check_gates ;;
  run-matrix) run_matrix ;;
  parse-fails) parse_fails ;;
  *)
    echo "usage: $0 {check-gates|run-matrix|parse-fails}" >&2
    exit 2
    ;;
esac
