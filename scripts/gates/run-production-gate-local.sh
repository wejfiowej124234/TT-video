#!/usr/bin/env bash
# Local stable production gate (core smoke). Does NOT run full Sepolia-deferred E2E.
#
# E2E 不稳定时勿盲跑全量：先 `bash scripts/gates/e2e-stability-probe.sh`（见 docs/runbook/E2E-STABILITY-MINIMAL-PROBE.md）。
#
# Usage:
#   bash scripts/gates/run-production-gate-local.sh [--base main] [--skip-e2e] [--skip-api-tests]
#
# Second step (chain / deferred E2E only):
#   bash scripts/gates/run-production-gate-chain-deferred.sh
#
# Python: set PYTHON_BIN or source scripts/gates/_resolve_python_bin.sh (python before broken python3 shims). Do not use py -3.
#
# Environment model:
# - Local smoke isolates CHAIN_RPC_URL / CHAIN_WS_URL (empty) so /meta does not hit Sepolia probes.
# - DATABASE_URL must point at a running Postgres (local gate auth/session are durable).
# - STRICT_SESSION_GATE=1 for Playwright (no X-User-Id shortcuts in local smoke paths).
# - Chromium E2E excludes describe titles matching @e2e-sepolia-deferred.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

BASE_REF="main"
SKIP_E2E=0
SKIP_API_TESTS=0
LOCAL_RELAX_DIFF_POLICIES="${LOCAL_RELAX_DIFF_POLICIES:-1}"
if [[ -z "${PYTHON_BIN:-}" ]]; then
  # shellcheck source=scripts/gates/_resolve_python_bin.sh
  source "$ROOT/scripts/gates/_resolve_python_bin.sh"
fi
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "run-production-gate-local: python not found (set PYTHON_BIN or install python/python3)" >&2
  exit 1
fi
if ! "$PYTHON_BIN" -c 'import sys; print(sys.version)' >/dev/null 2>&1; then
  if [[ "$PYTHON_BIN" != "python" ]] && command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  fi
fi
if ! "$PYTHON_BIN" -c 'import sys; print(sys.version)' >/dev/null 2>&1; then
  echo "run-production-gate-local: usable python interpreter not found" >&2
  exit 1
fi
export PYTHON_BIN

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_REF="${2:-main}"
      shift 2
      ;;
    --skip-e2e)
      SKIP_E2E=1
      shift
      ;;
    --skip-api-tests)
      SKIP_API_TESTS=1
      shift
      ;;
    *)
      echo "run-production-gate-local: unknown option: $1" >&2
      exit 1
      ;;
  esac
done

RUN_ID="local-$(date +%Y%m%d-%H%M%S)"
OUT_DIR="evidence/production-gate-${RUN_ID}"
mkdir -p "$OUT_DIR"

# 三项结论（EXIT trap 保证任一路径退出都会打印）
GATE_LOCAL_SMOKE_STATUS="NOT_RUN"
REPORT_VALIDATE_STATUS="NOT_REACHED"
PRODUCTION_GATE_LOCAL="BLOCKED"

gate_emit_three_conclusions() {
  echo "LOCAL_SMOKE_GATE: ${GATE_LOCAL_SMOKE_STATUS}"
  echo "REPORT_VALIDATE: ${REPORT_VALIDATE_STATUS}"
  echo "PRODUCTION_GATE_LOCAL: ${PRODUCTION_GATE_LOCAL}"
}
trap gate_emit_three_conclusions EXIT

require_local_postgres() {
  local db_url="${DATABASE_URL:-}"
  if [[ -z "$db_url" ]] && [[ -f "$ROOT/.env" ]]; then
    db_url="$("$PYTHON_BIN" "$ROOT/scripts/gates/read_dotenv_value.py" "$ROOT/.env" DATABASE_URL)"
  fi
  if [[ -z "$db_url" ]]; then
    echo "run-production-gate-local: DATABASE_URL missing — set in environment or root .env (local gate requires Postgres)" >&2
    exit 1
  fi
  export DATABASE_URL="$db_url"

  if "$PYTHON_BIN" "$ROOT/scripts/gates/pg_tcp_check.py"; then
    return 0
  fi

  if command -v docker >/dev/null 2>&1 && [[ "$db_url" == *"@localhost:"* || "$db_url" == *"@127.0.0.1:"* ]]; then
    echo "run-production-gate-local: Postgres TCP check failed; trying: docker compose up -d postgres" >&2
    docker compose -f "$ROOT/docker-compose.yml" up -d postgres
    for _ in {1..60}; do
      if docker inspect --format='{{json .State.Health.Status}}' traveltrust-postgres 2>/dev/null | grep -q healthy; then
        break
      fi
      sleep 1
    done
  fi

  if "$PYTHON_BIN" "$ROOT/scripts/gates/pg_tcp_check.py"; then
    return 0
  fi
  echo "run-production-gate-local: Postgres still unreachable — start DB or fix DATABASE_URL" >&2
  exit 1
}

write_local_smoke_status() {
  echo "$1" >"$OUT_DIR/LOCAL_SMOKE_GATE.status"
  echo "run-production-gate-local: LOCAL_SMOKE_GATE=$1 (evidence: $OUT_DIR/LOCAL_SMOKE_GATE.status)"
}

echo "=== [1/8] verify gate SSOT ==="
"$PYTHON_BIN" scripts/gates/verify_production_gate_config.py
echo "=== [1b/8] auth-email-resend gate (no-op unless TRAVELTRUST_EMAIL_TRANSPORT=resend) ==="
bash scripts/gates/check-auth-email-resend-gate.sh

echo "=== [2/8] B-421 doclink gate ==="
bash scripts/check-runbook-golive-doclink-gate.sh

echo "=== [3/8] legacy+broadcast batch gate ==="
bash scripts/gates/broadcast-batch-all-required.sh

if [[ "$SKIP_API_TESTS" == "0" ]]; then
  echo "=== [4/8] cargo test -p traveltrust-api ==="
  cargo test -p traveltrust-api -- --test-threads=1
else
  echo "=== [4/8] cargo test -p traveltrust-api (skipped by --skip-api-tests) ==="
fi

echo "=== [5/8] 96-15 orchestration (or waiver) ==="
if [[ -f "gates/waivers/96-15.waiver.json" ]]; then
  "$PYTHON_BIN" scripts/gates/resolve_96_15_waiver.py gates/waivers/96-15.waiver.json
  echo "tier-96-15: skipped by active waiver"
else
  ORCH_OUT="evidence/GO_96_15_pr_${RUN_ID}"
  mkdir -p "$ORCH_OUT/deep_evidence"
  "$PYTHON_BIN" scripts/release/verify_96_booklets_registry.py --out "$ORCH_OUT/96_booklets_registry.json"
  "$PYTHON_BIN" scripts/release/run_96_15_orchestration.py \
    --out-dir "$ORCH_OUT" \
    --executor "local-${RUN_ID}" \
    --tier-a1-readme gates/tier_a_ci/README.md \
    --tier-a2-markdown gates/tier_a_ci/59_p0_table.md \
    --require-tier-a-semiauto \
    --require-tier-a-all-pass \
    --require-tier-bc-all-pass
fi

echo "=== [6/8] report policy checks ==="
if [[ "$LOCAL_RELAX_DIFF_POLICIES" == "1" ]]; then
  echo "local mode: validating final truth pointer report (diff policies relaxed)" >&2
  FINAL_REPORT="$(tr -d '\r' < gates/final_truth_report_path.txt | head -n 1)"
  test -n "$FINAL_REPORT"
  test -f "$FINAL_REPORT"
  if ! "$PYTHON_BIN" scripts/validate-regression-report.py "$FINAL_REPORT" --require-go --fail-on-case-not-run; then
    REPORT_VALIDATE_STATUS="BLOCKED"
    exit 1
  fi
  if ! "$PYTHON_BIN" scripts/gates/check_report_production_readiness.py "$FINAL_REPORT"; then
    REPORT_VALIDATE_STATUS="BLOCKED"
    exit 1
  fi
else
  export GITHUB_EVENT_NAME="pull_request"
  export GITHUB_BASE_REF="$BASE_REF"
  unset GITHUB_EVENT_BEFORE
  export GITHUB_SHA="$(git rev-parse HEAD)"
  export LOCAL_GATE_INCLUDE_WORKTREE="1"
  if ! "$PYTHON_BIN" scripts/gates/check_pr_partial_go_expiry.py; then
    REPORT_VALIDATE_STATUS="BLOCKED"
    exit 1
  fi
  if ! "$PYTHON_BIN" scripts/gates/check_report_single_truth.py; then
    REPORT_VALIDATE_STATUS="BLOCKED"
    exit 1
  fi
  if ! "$PYTHON_BIN" scripts/gates/check_pr_final_truth_presence.py; then
    REPORT_VALIDATE_STATUS="BLOCKED"
    exit 1
  fi
fi
REPORT_VALIDATE_STATUS="PASS"

export GATE_CHAIN_DEFERRED_STATUS="NOT_RUN"

if [[ "$SKIP_E2E" == "0" ]]; then
  echo "=== [7/8] local core smoke E2E + R-002 check ==="
  require_local_postgres

  export EVIDENCE_DIR="evidence/GO_$(date +%Y%m%d)"
  export TRAVELTRUST_R002_REPORT_PARENT="$EVIDENCE_DIR"
  export P3_CHAIN_OFF="1"
  export CARGO_INCREMENTAL="0"
  # 与 start-api-for-playwright 一致：全栈 E2E 高频登录易触发 per-email 429，导致 53 主路径等 goto 超时
  export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
  export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
  export GITHUB_RUN_ID="$RUN_ID"
  export GITHUB_SHA="$(git rev-parse HEAD)"

  export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="0"
  export TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS="0"
  export TRAVELTRUST_DEPLOYMENT_PROFILE="local"

  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD="1"
  export STRICT_SESSION_GATE="1"
  export PLAYWRIGHT_E2E_STABILITY="1"
  export PLAYWRIGHT_REUSE_FE_SERVER="${PLAYWRIGHT_REUSE_FE_SERVER:-0}"
  # Stale :8080 API may lack DATABASE_URL (health OK skips rebuild); force fresh binary + Playwright-owned process.
  export TRAVELTRUST_GATE_ENSURE_FRESH_API="1"
  export PLAYWRIGHT_REUSE_API_SERVER="0"

  # Isolate root .env Sepolia / RPC for this smoke (process env wins over dotenv fill in API).
  export CHAIN_RPC_URL=""
  export CHAIN_WS_URL=""

  export PLAYWRIGHT_GREP_INVERT="${PLAYWRIGHT_GREP_INVERT:-@e2e-sepolia-deferred}"

  # F-025 / CI e2e 同源：未显式设置时注入仲裁种子邮箱，避免 `POST /auth/register` 仍为 tourist。
  export P3_SEED_ARBITRATOR_EMAIL="${P3_SEED_ARBITRATOR_EMAIL:-e2e-ci-arbitrator-seed@traveltrust.test}"
  export PLAYWRIGHT_ARBITRATOR_SEED_EMAIL="${PLAYWRIGHT_ARBITRATOR_SEED_EMAIL:-e2e-ci-arbitrator-seed@traveltrust.test}"

  # 全量 E2E 长跑：单 worker + 抬高 Node 堆，降低 Next dev「memory threshold restart」与并行争用
  export PLAYWRIGHT_WORKERS="1"
  export PLAYWRIGHT_PARALLEL="0"
  if [[ -z "${NODE_OPTIONS:-}" ]]; then
    export NODE_OPTIONS="--max-old-space-size=8192"
  else
    export NODE_OPTIONS="--max-old-space-size=8192 ${NODE_OPTIONS}"
  fi

  set +e
  (
    # 与 e2e-stability-probe.sh 同源：走 run-e2e-default.mjs，Windows 上回收端口 / 杀陈旧 API / cargo build，避免裸 playwright 占口失败。
    cd frontend && node ./scripts/run-e2e-default.mjs --project=chromium --grep-invert "$PLAYWRIGHT_GREP_INVERT"
  )
  EC=$?
  set -e

  if [[ "$EC" -ne 0 ]]; then
    export GATE_LOCAL_SMOKE_STATUS="BLOCKED"
    GATE_LOCAL_SMOKE_STATUS="BLOCKED"
    REPORT_VALIDATE_STATUS="BLOCKED"
    PRODUCTION_GATE_LOCAL="BLOCKED"
    write_local_smoke_status "BLOCKED"
    "$PYTHON_BIN" scripts/gen-r002-iss007-prereport.py || true
    echo "=== [8/8] write local manifest (after E2E failure) ==="
    TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    export REPORT_VALIDATE_STATUS PRODUCTION_GATE_LOCAL
    export OUT_DIR TS RUN_ID BASE_REF SKIP_E2E SKIP_API_TESTS GATE_LOCAL_SMOKE_STATUS GATE_CHAIN_DEFERRED_STATUS
    "$PYTHON_BIN" scripts/gates/write_local_manifest.py || true
    exit "$EC"
  fi

  export GATE_LOCAL_SMOKE_STATUS="PASS"
  GATE_LOCAL_SMOKE_STATUS="PASS"
  write_local_smoke_status "PASS"

  "$PYTHON_BIN" scripts/gen-r002-iss007-prereport.py
  RPT="${EVIDENCE_DIR}/r002_iss007_prereport/report.json"
  test -f "$RPT"
  if ! "$PYTHON_BIN" scripts/validate-regression-report.py "$RPT" --fail-on-no-go --fail-on-case-not-run; then
    REPORT_VALIDATE_STATUS="BLOCKED"
    PRODUCTION_GATE_LOCAL="BLOCKED"
    exit 1
  fi
else
  echo "=== [7/8] local E2E + R-002 (skipped by --skip-e2e) ==="
  export GATE_LOCAL_SMOKE_STATUS="SKIPPED"
  GATE_LOCAL_SMOKE_STATUS="SKIPPED"
  write_local_smoke_status "SKIPPED"
fi

echo "=== [8/8] write local manifest ==="
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
export REPORT_VALIDATE_STATUS PRODUCTION_GATE_LOCAL
export OUT_DIR TS RUN_ID BASE_REF SKIP_E2E SKIP_API_TESTS GATE_LOCAL_SMOKE_STATUS GATE_CHAIN_DEFERRED_STATUS
PRODUCTION_GATE_LOCAL="PASS"
export PRODUCTION_GATE_LOCAL
"$PYTHON_BIN" scripts/gates/write_local_manifest.py
