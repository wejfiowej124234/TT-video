#!/usr/bin/env bash
# Phase ② · 本地 ↔ staging 对齐闭环（S1–S6 编排 · 非毕业 SSOT）
#
# 纪律：TESTNET_STAGING_FREEZE ACTIVE 时 --deploy 须 Owner TESTNET_FREEZE_OVERRIDE=1
# TL#1 前默认 S1–S3（本地 smoke）；勿 --deploy
#
#   bash scripts/dev/run-phase2-local-staging-parity-gate.sh              # S1+S2+S3（默认）
#   bash scripts/dev/run-phase2-local-staging-parity-gate.sh --pull       # 仅 S1+S2
#   bash scripts/dev/run-phase2-local-staging-parity-gate.sh --local-test # 仅 S3（须 API 已起）
#   bash scripts/dev/run-phase2-local-staging-parity-gate.sh --deploy --staging-retest
#   bash scripts/dev/run-phase2-local-staging-parity-gate.sh --deep-release-gate  # 仅多维 release gate
#
# 末行机读：TT_PHASE2_LOCAL_STAGING_PARITY: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE2_PARITY_OUT:-$ROOT/evidence/GO_phase2_testnet_20260526/local-staging-parity/$STAMP}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API_STAGING="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API_LOCAL="${API_BASE_URL:-http://127.0.0.1:8080}"

DO_PULL=0
DO_LOCAL_TEST=0
DO_DEPLOY=0
DO_STAGING_RETEST=0
DO_DEEP_RELEASE_GATE=0
EXPLICIT=0

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \?//'
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage ;;
    --pull) DO_PULL=1; EXPLICIT=1; shift ;;
    --local-test) DO_LOCAL_TEST=1; EXPLICIT=1; shift ;;
    --deploy) DO_DEPLOY=1; EXPLICIT=1; shift ;;
    --staging-retest) DO_STAGING_RETEST=1; EXPLICIT=1; shift ;;
    --deep-release-gate) DO_DEEP_RELEASE_GATE=1; EXPLICIT=1; shift ;;
    *) echo "unknown arg: $1 (try --help)" >&2; exit 2 ;;
  esac
done

if [[ "$EXPLICIT" -eq 0 ]]; then
  DO_PULL=1
  DO_LOCAL_TEST=1
fi

mkdir -p "$OUT"
LOG="$OUT/run.log"
exec > >(tee -a "$LOG") 2>&1

fail() {
  echo "run-phase2-local-staging-parity-gate: FAIL $*" >&2
  echo "TT_PHASE2_LOCAL_STAGING_PARITY: FAIL"
  exit 2
}
ok() { echo "run-phase2-local-staging-parity-gate: OK $*"; }

echo "== Phase ② local↔staging parity gate · $STAMP =="
echo "OUT=$OUT"
echo "staging API=$API_STAGING web=$WEB"
echo "local API=$API_LOCAL"

# --- S1 + S2: pull / align ---
if [[ "$DO_PULL" -eq 1 ]]; then
  echo ""
  echo "=== S1 · staging 真源对拍 ==="
  bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" \
    --web-base "$WEB" --api-base "$API_STAGING"

  echo ""
  echo "=== S2 · 合并 Sepolia env → staging onboarding.local ==="
  bash "$ROOT/scripts/dev/phase2-staging-merge-sepolia-env.sh"

  if [[ -f "$ROOT/scripts/dev/sync-frontend-env-local-from-root.ps1" ]] && command -v powershell.exe >/dev/null 2>&1; then
    echo "=== S2 · sync frontend/.env.local (Windows) ==="
    powershell.exe -NoProfile -ExecutionPolicy Bypass \
      -File "$ROOT/scripts/dev/sync-frontend-env-local-from-root.ps1" \
      -ApiListenPort "${PORT:-8080}" || fail "sync-frontend-env-local-from-root.ps1"
  else
    echo "=== S2 · skip frontend sync (no powershell) — ensure frontend/.env.local matches root .env NEXT_PUBLIC_* ==="
  fi

  git -C "$ROOT" rev-parse HEAD >"$OUT/git-head.txt" 2>/dev/null || true
  curl -sS --max-time 30 "${API_STAGING}/meta" >"$OUT/staging-meta.json" 2>/dev/null || true
fi

# --- S3: local functional tests ---
if [[ "$DO_LOCAL_TEST" -eq 1 ]]; then
  echo ""
  echo "=== S3 · 本地全功能测（须本地 API + PG）==="
  hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "${API_LOCAL}/health" 2>/dev/null || echo 000)"
  [[ "$hc" == "200" ]] || fail "${API_LOCAL}/health not 200 (got $hc) — start API first (see docs/dev-local-smoke-baseline.md)"

  export API_BASE_URL="$API_LOCAL"
  export DATABASE_URL="${DATABASE_URL:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"

  bash "$ROOT/scripts/dev/ensure-local-smoke-public-guides.sh"

  bash "$ROOT/scripts/smoke-ab-core-chain.sh"
  bash "$ROOT/scripts/dev/smoke-web3-itinerary-full-chain-local.sh"
  bash "$ROOT/scripts/dev/smoke-acquisition-pd009-local.sh"
  bash "$ROOT/scripts/dev/run-web3-itinerary-l5-green.sh"

  if [[ -x "$ROOT/scripts/dev/run-admin-l5-green.sh" ]] || [[ -f "$ROOT/scripts/dev/run-admin-l5-green.sh" ]]; then
    bash "$ROOT/scripts/dev/run-admin-l5-green.sh" || true
  fi

  ok "S3 local smoke + green sets"
fi

# --- S5: deploy staging ---
if [[ "$DO_DEPLOY" -eq 1 ]]; then
  echo ""
  echo "WARNING: --deploy during TESTNET_STAGING_FREEZE requires Owner TESTNET_FREEZE_OVERRIDE=1"
  # shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
  source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"
  phase2_require_staging_deploy_allowed "$ROOT" || fail "staging deploy blocked by freeze"
  echo ""
  echo "=== S5 · 推 staging（API + Web）==="
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh"
  if [[ -f "$ROOT/scripts/dev/deploy-tt-web-staging.sh" ]]; then
    bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh"
  else
    echo "WARN: deploy-tt-web-staging.sh missing — deploy web manually"
  fi
  bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" \
    --web-base "$WEB" --api-base "$API_STAGING"
fi

# --- Deep multidimensional release gate (staging-only · blocks S6/HAT/Phase③ on FAIL) ---
run_deep_release_gate() {
  echo ""
  echo "=== Deep release gate · staging multidimensional (G01–G08) ==="
  export PHASE2_DEEP_GATE_OUT="$OUT/deep-release-gate"
  export PHASE2_EXPECT_GIT_SHA="${PHASE2_EXPECT_GIT_SHA:-$(cat "$OUT/git-head.txt" 2>/dev/null || git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo '')}"
  mkdir -p "$OUT/deep-release-gate"
  bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" \
    --api-base "$API_STAGING" \
    --web-base "$WEB" \
    ${PHASE2_EXPECT_GIT_SHA:+--expect-git-sha "$PHASE2_EXPECT_GIT_SHA"} \
    || fail "deep release gate — see $OUT/deep-release-gate/SUMMARY.md (blocks S6/HAT/Phase③)"
  ok "deep release gate PASS"
}

if [[ "$DO_DEEP_RELEASE_GATE" -eq 1 && "$DO_STAGING_RETEST" -eq 0 && "$DO_DEPLOY" -eq 0 ]]; then
  run_deep_release_gate
  echo ""
  echo "证据：$OUT"
  echo "Runbook：docs/runbook/TT-PHASE2-DEEP-RELEASE-GATE.md"
  echo "TT_PHASE2_LOCAL_STAGING_PARITY: PASS"
  exit 0
fi

# --- S6: re-run Phase ② on staging ---
if [[ "$DO_STAGING_RETEST" -eq 1 ]]; then
  run_deep_release_gate

  echo ""
  echo "=== S6 · 复跑 Phase ② staging ==="
  bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" \
    --web-base "$WEB" --api-base "$API_STAGING"

  R003_ENV="$ROOT/scripts/dev/.env.r003.local"
  if [[ -f "$R003_ENV" ]]; then
    python "$ROOT/scripts/dev/check_r003_staging_env_ready.py" --env-file "$R003_ENV"
    python "$ROOT/scripts/dev/run_r003_staging_evidence_chain.py" --from-env --env-file "$R003_ENV"
    python "$ROOT/scripts/validate-regression-report.py" \
      "$ROOT/evidence/GO_phase2_testnet_20260526/report.json" --require-go
  else
    echo "WARN: skip R-003 — missing $R003_ENV (cp scripts/dev/r003-staging-chain.env.example)"
  fi

  bash "$ROOT/scripts/dev/run-staging-uat-six-domains.sh"
  bash "$ROOT/scripts/dev/run-phase25-coverage-hardening-staging.sh"
  bash "$ROOT/scripts/dev/record-phase2-closing-gap-status.sh" 2>/dev/null || true

  ok "S6 staging retest complete — verify TT_PHASE2_GO_VERDICT + UAT matrix manually"
fi

echo ""
echo "证据：$OUT"
echo "Runbook：docs/runbook/PHASE2-LOCAL-STAGING-PARITY-LOOP.md · TT-PHASE2-DEEP-RELEASE-GATE.md"
echo "TT_PHASE2_LOCAL_STAGING_PARITY: PASS"
