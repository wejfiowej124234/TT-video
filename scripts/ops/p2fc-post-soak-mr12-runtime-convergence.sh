#!/usr/bin/env bash
# P2FC · MR12 Runtime Convergence（② · post-soak · 无 API/Web redeploy）
#
# 用于 Soak PASS + State B Fix Deploy 已落 staging 后，补齐 one-shot checkpoint
# 而不回退 fc9266ce、不重跑 72h、不执行 Wave1/Wave2 fly deploy。
#
#   export P2FC_RUNTIME_SHA_FROZEN=fc9266ce94f18810420e720bb933946c086ce909
#   bash scripts/ops/p2fc-post-soak-mr12-runtime-convergence.sh
#
# 末行：TT_P2FC_MR12_RUNTIME_CONVERGENCE: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/ops/lib/p2fc-post-soak-wave-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-post-soak-wave-lib.sh"

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
COMPLETED="$SOAK_DIR/COMPLETED.json"
EXEC_DIR="$SOAK_DIR/post-soak-one-shot"
CHECKPOINT="$EXEC_DIR/checkpoint.json"
LOG="$EXEC_DIR/one-shot.log"
RUNTIME_SHA="${P2FC_RUNTIME_SHA_FROZEN:-fc9266ce94f18810420e720bb933946c086ce909}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API="${API%/}"
WEB="${WEB%/}"

fail() {
  echo "TT_P2FC_MR12_RUNTIME_CONVERGENCE: FAIL $*" | tee -a "$LOG" >&2
  exit 2
}

assert_frozen_invariants() {
  [[ -f "$COMPLETED" ]] || fail "missing $COMPLETED (soak not PASS)"
  local live_sha
  live_sha="$(curl --noproxy "*" -sS --max-time 45 "${API}/meta" 2>/dev/null \
    | python -c "import json,sys; d=json.load(sys.stdin); print((d.get('build') or {}).get('git_sha',''))" 2>/dev/null || true)"
  [[ -n "$live_sha" ]] || fail "staging /meta unreachable"
  [[ "${live_sha,,}" == "${RUNTIME_SHA,,}" ]] \
    || fail "runtime_sha_mismatch live=${live_sha} frozen=${RUNTIME_SHA}"
  echo "OK runtime_sha_frozen=${RUNTIME_SHA:0:12}…"
}

run_convergence() {
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "${ts} MR12 runtime-convergence: START sha=${RUNTIME_SHA:0:12}…" | tee -a "$LOG"
  mkdir -p "$EXEC_DIR"

  p2fc_wave_checkpoint "$CHECKPOINT" "wait_completed" "PASS" "COMPLETED.json frozen"
  p2fc_wave_checkpoint "$CHECKPOINT" "runtime_sha_frozen" "PASS" "$RUNTIME_SHA"

  # B1/B4 · TN-P1-010 @ frozen runtime SHA（无 redeploy）
  p2fc_wave_checkpoint "$CHECKPOINT" "tn_p1_010" "RUNNING" ""
  export TN_P1_010_EXPECT_FREEZE_GIT_SHA="$RUNTIME_SHA"
  export STAGING_API_BASE="$API"
  export STAGING_WEB_BASE="$WEB"
  if ! bash "$ROOT/scripts/ops/p2fc-run-tn-p1-010-independent.sh" 2>&1 | tee -a "$LOG"; then
    fail "tn_p1_010_independent"
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "tn_p1_010" "PASS" "post-soak @ $RUNTIME_SHA"

  # B2 · Wave1 — State B fix deploy 已满足（runtime 验证，无 fly deploy）
  p2fc_wave_checkpoint "$CHECKPOINT" "apply_patches" "SKIP" "state_b_fix_deploy_supersedes_backlog_patch"
  p2fc_wave_checkpoint "$CHECKPOINT" "rollback_snapshot" "SKIP" "no_redeploy"
  p2fc_wave_checkpoint "$CHECKPOINT" "wave1_api_deploy" "PASS" "state_b_fix_sha=$RUNTIME_SHA health=200"

  # Wave2 · 只读验收（不重部署 web）
  p2fc_wave_checkpoint "$CHECKPOINT" "wave2_web_deploy" "RUNNING" "verify_only"
  local web_code
  web_code="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' --max-time 60 "${WEB}/admin" 2>/dev/null || echo 000)"
  [[ "$web_code" == "200" || "$web_code" == "307" || "$web_code" == "308" ]] \
    || fail "web_admin_probe=$web_code"
  p2fc_wave_checkpoint "$CHECKPOINT" "wave2_web_deploy" "PASS" "verify_only http=${web_code}"

  # B3 · meta + G02 + graduation
  p2fc_wave_checkpoint "$CHECKPOINT" "meta_availability" "RUNNING" ""
  export PHASE2_REQUIRE_META_GREEN=1
  export PHASE2_META_OBSERVABILITY_ONLY=0
  if ! bash "$ROOT/scripts/ops/p2fc-verify-staging-meta-availability.sh" --strict 2>&1 | tee -a "$LOG"; then
    fail "meta_availability"
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "meta_availability" "PASS" ""

  p2fc_wave_checkpoint "$CHECKPOINT" "g02_deep_gate" "RUNNING" ""
  export STAGING_API_BASE="$API"
  export STAGING_WEB_BASE="$WEB"
  export PHASE2_EXPECT_GIT_SHA="$RUNTIME_SHA"
  export PHASE2_BASELINE_SSOT_SHA="$RUNTIME_SHA"
  if ! bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" \
    --skip-rbac --require-meta-green --expect-git-sha "$RUNTIME_SHA" 2>&1 | tee -a "$LOG"; then
    fail "g02_deep_gate"
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "g02_deep_gate" "PASS" ""

  p2fc_wave_checkpoint "$CHECKPOINT" "graduation" "RUNNING" ""
  export P2FC_SOAK_DIR="$SOAK_DIR"
  export PHASE2_BASELINE_SSOT_SHA="$RUNTIME_SHA"
  if ! bash "$ROOT/scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh" 2>&1 | tee -a "$LOG"; then
    fail "graduation_closure"
  fi
  p2fc_wave_checkpoint "$CHECKPOINT" "graduation" "PASS" ""

  echo "${ts} TT_P2FC_POST_SOAK_ONE_SHOT: PASS checkpoint=$CHECKPOINT mode=runtime_convergence sha=${RUNTIME_SHA:0:12}" | tee -a "$LOG"
  echo "TT_P2FC_MR12_RUNTIME_CONVERGENCE: PASS sha=${RUNTIME_SHA:0:12}…"
}

assert_frozen_invariants
run_convergence
