#!/usr/bin/env bash
# L3 · Local First Convergence Gate（① 本地 · 含 L1–L4）
#
# 唯一发布主链 SSOT: docs/runbook/TT-LOCAL-FIRST-CONVERGENCE.md
# 本脚本 = L3（可选 L1/L2/L4/baseline）；不含 L6/S5/S6/H1
#   bash scripts/dev/run-local-first-convergence-gate.sh --with-baseline-audit
#   bash scripts/dev/run-local-first-convergence-gate.sh --with-local-smoke
#   bash scripts/dev/run-local-first-convergence-gate.sh --with-complexity
#   bash scripts/dev/run-local-first-convergence-gate.sh --with-cargo-test
#   bash scripts/dev/run-local-first-convergence-gate.sh --full-pre-deploy
#
# SSOT: docs/runbook/TT-LOCAL-FIRST-CONVERGENCE.md
# 末行：TT_LOCAL_FIRST_CONVERGENCE_GATE: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${LOCAL_FIRST_CONVERGENCE_OUT:-$ROOT/evidence/GO_phase2_testnet_graduation/local-first-convergence-gate/$STAMP}"
WITH_BASELINE=0
WITH_SMOKE=0
WITH_COMPLEXITY=0
WITH_CARGO=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-baseline-audit) WITH_BASELINE=1; shift ;;
    --with-local-smoke) WITH_SMOKE=1; shift ;;
    --with-complexity) WITH_COMPLEXITY=1; shift ;;
    --with-cargo-test) WITH_CARGO=1; shift ;;
    --full-pre-deploy)
      WITH_BASELINE=1
      WITH_SMOKE=1
      WITH_COMPLEXITY=1
      WITH_CARGO=1
      shift
      ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

fail() {
  echo "run-local-first-convergence-gate: FAIL $*" >&2
  echo "TT_LOCAL_FIRST_CONVERGENCE_GATE: FAIL"
  exit 2
}

# L2 须独占 PG + 无 :8080 侧写（b081 mock RPC · admin IT 与 seed API 竞态）。
stop_local_api_if_listening() {
  local port="${PLAYWRIGHT_API_PORT:-8080}"
  local pid
  pid="$(netstat -ano 2>/dev/null | grep ":${port}" | grep LISTENING | awk '{print $NF}' | head -1 || true)"
  if [[ -n "$pid" ]]; then
    echo "L2 prep: stopping PID ${pid} on :${port} (avoid PG/RPC sidecar during cargo test) ..."
    taskkill //F //PID "$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    sleep 2
  fi
}

ensure_local_api_for_smoke() {
  local api_base="${API_BASE_URL:-http://127.0.0.1:8080}"
  local hc
  hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${api_base}/health" 2>/dev/null || echo 000)"
  [[ "$hc" == "200" ]] && return 0
  echo "L4 prep: starting local API for smoke (${api_base}) ..."
  export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"
  export DID_RANK_SEED_MARKET_DEMO="${DID_RANK_SEED_MARKET_DEMO:-1}"
  export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
  export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
  export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-1}"
  export TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT="${TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT:-1}"
  nohup bash "$ROOT/scripts/dev/start-api-for-playwright.sh" >"$EVID/api-sidecar.log" 2>&1 &
  local i
  for i in $(seq 1 90); do
    hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 4 "${api_base}/health" 2>/dev/null || echo 000)"
    [[ "$hc" == "200" ]] && { echo "L4 prep: API health=200"; return 0; }
    sleep 2
  done
  fail "local API failed to start for smoke (see $EVID/api-sidecar.log)"
}

# ① 本地 env：与 start-api-for-playwright / start-api-with-seed 同源
# shellcheck source=scripts/dev/lib/local-smoke-preflight.sh
source "$ROOT/scripts/dev/lib/local-smoke-preflight.sh"
local_smoke_load_repo_env
export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-1}"
export TRAVELTRUST_COMPLEXITY_CONVERGENCE_FREEZE="${TRAVELTRUST_COMPLEXITY_CONVERGENCE_FREEZE:-1}"
export TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE="${TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE:-1}"
export TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT="${TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT:-1}"

HEAD_SHA="$(git -C "$ROOT" rev-parse HEAD)"
echo "== Local First convergence gate · $STAMP =="
echo "HEAD=$HEAD_SHA"
echo "OUT=$EVID"

rm -f "$ROOT/evidence/.tmp-ssot-meta.json" "$ROOT/evidence/.tmp-ssot-web-meta.json"

echo ""
echo "=== alignment audit (fresh meta · drift classification) ==="
set +e
node "$ROOT/scripts/dev/emit-local-first-alignment-audit.mjs" \
  --evidence-dir "$EVID/alignment-audit"
ALIGN_RC=$?
set -e

P0_COUNT="$(PYTHONIOENCODING=utf-8 python -c "
import json
from pathlib import Path
p = Path(r'$EVID/alignment-audit/audit.json')
j = json.loads(p.read_text(encoding='utf-8'))
print(sum(1 for g in j.get('gaps', []) if g.get('sev') == 'P0'))
" 2>/dev/null || echo 0)"

if [[ "$P0_COUNT" != "0" ]]; then
  fail "alignment audit P0 gaps=$P0_COUNT"
fi

if [[ "$ALIGN_RC" -ne 0 ]]; then
  echo "NOTE: TT_LOCAL_FIRST_ALIGNMENT not 100% (exit $ALIGN_RC) — OK if only INFO/P1/LOCAL_AHEAD/PHASE3-WIP"
fi

if ! grep -q '"runtime_drift": false' "$EVID/alignment-audit/audit.json" 2>/dev/null; then
  fail "runtime drift detected (not LOCAL_AHEAD)"
fi
grep -E 'TT_LOCAL_FIRST_(ALIGNMENT|RUNTIME_DRIFT):' "$EVID/alignment-audit/SUMMARY.md" 2>/dev/null || true

if [[ "$WITH_COMPLEXITY" -eq 1 ]]; then
  echo ""
  echo "=== L1 · complexity convergence ledger sync ==="
  bash "$ROOT/scripts/dev/validate-complexity-convergence-ledger-sync.sh" \
    || fail "complexity convergence sync"
fi

if [[ "$WITH_CARGO" -eq 1 ]]; then
  echo ""
  echo "=== L2 · target regression (cargo test -p traveltrust-api · --test-threads=1) ==="
  stop_local_api_if_listening
  export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
  export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
  cargo test -p traveltrust-api -- --test-threads=1 2>&1 | tee "$EVID/l2-cargo-test.log" || fail "cargo test traveltrust-api"
fi

if [[ "$WITH_BASELINE" -eq 1 ]]; then
  echo ""
  echo "=== baseline consistency audit @ HEAD (read-only) ==="
  python "$ROOT/scripts/dev/gen-phase2-baseline-consistency-audit.py" \
    --expect-sha "$HEAD_SHA" \
    --out-dir "$EVID/baseline-consistency" || fail "baseline consistency audit"
fi

if [[ "$WITH_SMOKE" -eq 1 ]]; then
  echo ""
  echo "=== L4 · local smoke (parity gate local-test) ==="
  ensure_local_api_for_smoke
  bash "$ROOT/scripts/dev/run-phase2-local-staging-parity-gate.sh" --local-test \
    2>&1 | tee "$EVID/l4-local-smoke.log" || fail "local-staging parity L4"
fi

echo ""
echo "run-local-first-convergence-gate: OK"
echo "TT_LOCAL_FIRST_CONVERGENCE_GATE: PASS"
echo "Honest: PASS = local SSOT + no runtime drift · ≠ staging deploy · ≠ Production GO"
