#!/usr/bin/env bash
# ① Site10 · 已修 P1 切片顺序复跑（Windows 须串行 · 避免 8080/3012 EADDRINUSE）
#
# 用法（仓库根）：
#   source scripts/dev/export-database-url-from-root-env.sh
#   export PLAYWRIGHT_FULL_STACK=1 PLAYWRIGHT_E2E_STABILITY=1 PLAYWRIGHT_REUSE_API_SERVER=1
#   export PLAYWRIGHT_SKIP_NEXT_PURGE=1 P3_CHAIN_OFF=1
#   bash scripts/dev/run-site10-p1-slices-recheck-sequential.sh
#
# 日志：frontend/evidence/GO_local_phase1/site10-p1-slices-recheck.latest.log
#
# Spec 级稳定化（API :8080 长驻 · Next :3012 按需/强制重启）：
#   · SITE10_FORCE_RESTART_NEXT_AFTER — 跑完后固定重启 Next + API trigger 链复检
#   · SITE10_HEAVY_SPECS — 跑完后探针；失败或 spec 红则重启 Next + trigger 链复检
#   · 其余 spec — 仅 Next 探针，不健康时重启
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/export-database-url-from-root-env.sh
source "$ROOT/scripts/dev/export-database-url-from-root-env.sh"

export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
export PLAYWRIGHT_E2E_STABILITY="${PLAYWRIGHT_E2E_STABILITY:-1}"
export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
export PLAYWRIGHT_SKIP_NEXT_PURGE="${PLAYWRIGHT_SKIP_NEXT_PURGE:-1}"
export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
export PLAYWRIGHT_SITE10_SEQUENTIAL="${PLAYWRIGHT_SITE10_SEQUENTIAL:-1}"
export PLAYWRIGHT_SITE10_EXTERNAL_STACK="${PLAYWRIGHT_SITE10_EXTERNAL_STACK:-1}"
export SKIP_API_BUILD="${SKIP_API_BUILD:-1}"
export SKIP_API_TASKKILL="${SKIP_API_TASKKILL:-1}"
export PLAYWRIGHT_REUSE_FE_SERVER="${PLAYWRIGHT_REUSE_FE_SERVER:-1}"
export REQUEST_TIMEOUT_SECS="${REQUEST_TIMEOUT_SECS:-120}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
# Windows：父 shell 若遗留 PORT=3012（Next dev）会导致 API 绑错端口 → EADDRINUSE / webServer 早退
export PLAYWRIGHT_API_PORT="${PLAYWRIGHT_API_PORT:-8080}"
export PORT="${PLAYWRIGHT_API_PORT}"

OUT_LATEST="$ROOT/frontend/evidence/GO_local_phase1/site10-p1-slices-recheck.latest.log"
OUT_STAMP_FILE="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$ROOT/frontend/evidence/GO_local_phase1/site10-p1-slices-recheck-${OUT_STAMP_FILE}.log"
LOCK="$ROOT/frontend/evidence/GO_local_phase1/site10-p1-slices-recheck.lock"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
mkdir -p "$(dirname "$OUT")"

if [[ -f "$LOCK" ]]; then
  lock_pid="$(tr -d '[:space:]' <"$LOCK" 2>/dev/null || true)"
  if [[ -n "$lock_pid" ]] && kill -0 "$lock_pid" 2>/dev/null; then
    if [[ "${SITE10_FORCE_REPLACE_LOCK:-}" == "1" ]]; then
      echo "site10: replacing in-flight orchestrator pid=$lock_pid (SITE10_FORCE_REPLACE_LOCK=1)" >&2
      if command -v taskkill >/dev/null 2>&1; then
        taskkill //F //PID "$lock_pid" //T >/dev/null 2>&1 || true
      else
        kill -9 "$lock_pid" 2>/dev/null || true
      fi
      sleep 3
    else
      echo "site10-p1-slices-recheck: FAIL another run in progress (pid=$lock_pid, lock=$LOCK)" >&2
      echo "hint: SITE10_FORCE_REPLACE_LOCK=1 to terminate the other orchestrator" >&2
      exit 1
    fi
  fi
  rm -f "$LOCK"
fi
echo "$$" >"$LOCK"

API_PID=""
FE_PID=""
# shellcheck source=scripts/dev/lib/site10-stack-lifecycle.sh
source "$ROOT/scripts/dev/lib/site10-stack-lifecycle.sh"
export SITE10_LIFECYCLE_LOG="$OUT"

release_site10_lock() {
  rm -f "$LOCK"
}
trap 'release_site10_lock; site10_cleanup_stack' EXIT

{
  echo "# site10 P1 slices sequential recheck · $STAMP (UTC)"
  echo "# preflight: site10-stack-lifecycle · FE/BE dual health · no silent exit"
  echo ""
} >"$OUT"

site10_bootstrap_stack || exit 1

echo "== site10: chain health preflight ==" | tee -a "$OUT"
bash "$ROOT/scripts/dev/run-site10-chain-health-check.sh" --skip-e2e-setup >>"$ROOT/frontend/evidence/GO_local_phase1/site10-chain-health.latest.log" 2>&1 || {
  tail -30 "$ROOT/frontend/evidence/GO_local_phase1/site10-chain-health.latest.log" >&2 || true
  echo "TT_SITE10_CHAIN_HEALTH: FAIL (preflight script)" >&2
  exit 1
}
grep -q "TT_SITE10_CHAIN_HEALTH: OK" "$ROOT/frontend/evidence/GO_local_phase1/site10-chain-health.latest.log" || {
  echo "TT_SITE10_CHAIN_HEALTH: FAIL (no OK token)" >&2
  exit 1
}
echo "TT_SITE10_CHAIN_HEALTH: OK (preflight curl probes)" | tee -a "$OUT"

ensure_site10_fe_health() {
  site10_ensure_fe_health
}

site10_probe_next_health() {
  site10_fe_shell_health_ok
}

restart_site10_next_mandatory() {
  site10_restart_fe_mandatory
}

# smoke-admin 后固定重启（webpack 热更新 / 内存膨胀 · 历史 ERR_CONNECTION_REFUSED 高发）
SITE10_FORCE_RESTART_NEXT_AFTER=(
  e2e/smoke-admin.spec.ts
  e2e/pi1-traveltrust-v6-browser-acceptance.spec.ts
  e2e/me-settings-l5-hub.spec.ts
  e2e/community-subroutes-l5-markers.spec.ts
  e2e/release-flow.spec.ts
  e2e/g-s3-early-bird-multiplier.spec.ts
  e2e/g-s5-admin-growth-fraud-reward-ops.spec.ts
  e2e/f012-f013-f014-request.spec.ts
  e2e/itinerary-52.spec.ts
)
# 大 spec：跑后强制重启 Next（API 不重启）
SITE10_HEAVY_SPECS=(
  e2e/smoke-admin.spec.ts
  e2e/p0-spine-real-api-session.spec.ts
  e2e/p0-spine-real-api-public.spec.ts
  e2e/smoke-community.spec.ts
  e2e/trust-gate-escrow.spec.ts
  e2e/pi1-traveltrust-v6-browser-acceptance.spec.ts
  e2e/me-settings-l5-hub.spec.ts
  e2e/itinerary-52.spec.ts
  e2e/f021-f022-f023-request.spec.ts
  e2e/f012-f013-f014-request.spec.ts
  e2e/f024-f025-f026-request.spec.ts
  e2e/f029-f030-f031-request.spec.ts
  e2e/f027-f028-f033-request.spec.ts
)

site10_spec_in_list() {
  local needle="$1"
  shift
  local x
  for x in "$@"; do
    [[ "$x" == "$needle" ]] && return 0
  done
  return 1
}

site10_post_spec_stabilize() {
  local spec="$1"
  local spec_failed="${2:-0}"
  ensure_site10_api_health || return 1

  if site10_spec_in_list "$spec" "${SITE10_FORCE_RESTART_NEXT_AFTER[@]}"; then
    echo "== site10: post-spec stabilize → mandatory Next restart (fixed after $spec) ==" | tee -a "$OUT"
    restart_site10_next_mandatory || return 1
    site10_verify_api_trigger_chain || return 1
    return 0
  fi

  if site10_spec_in_list "$spec" "${SITE10_HEAVY_SPECS[@]}"; then
    echo "== site10: heavy spec stabilize → mandatory Next restart (spec=$spec failed=$spec_failed) ==" | tee -a "$OUT"
    restart_site10_next_mandatory || return 1
    site10_verify_api_trigger_chain || return 1
    return 0
  fi

  if ! site10_probe_next_health; then
    echo "== site10: light spec probe FAIL → restart Next (spec=$spec) ==" | tee -a "$OUT"
    restart_site10_next_mandatory || return 1
    site10_verify_api_trigger_chain || return 1
  fi
  return 0
}

ensure_site10_api_health() {
  site10_ensure_api_health
}

SPECS=(
  e2e/smoke-admin.spec.ts
  e2e/p0-spine-real-api-session.spec.ts
  e2e/p0-spine-real-api-public.spec.ts
  e2e/smoke-community.spec.ts
  e2e/trust-gate-escrow.spec.ts
  e2e/account-nav-header-ia.spec.ts
  e2e/pi1-traveltrust-v6-browser-acceptance.spec.ts
  e2e/f021-f022-f023-request.spec.ts
  e2e/me-settings-l5-hub.spec.ts
  e2e/community-subroutes-l5-markers.spec.ts
  e2e/release-flow.spec.ts
  e2e/g-s1-referral-minimum-loop.spec.ts
  e2e/g-s2-growth-ledger-observer.spec.ts
  e2e/g-s3-early-bird-multiplier.spec.ts
  e2e/g-s4-user-referral-center.spec.ts
  e2e/g-s5-admin-growth-fraud-reward-ops.spec.ts
  e2e/g-s6-airdrop-snapshot-reward-calc.spec.ts
  e2e/g-s7-growth-analytics-kol-readonly.spec.ts
  e2e/f012-f013-f014-request.spec.ts
  e2e/itinerary-52.spec.ts
  e2e/f024-f025-f026-request.spec.ts
  e2e/f029-f030-f031-request.spec.ts
  e2e/f027-f028-f033-request.spec.ts
  e2e/f015-f016-f017-request.spec.ts
  e2e/f018-f019-f020-request.spec.ts
)

{
  echo "# specs=${#SPECS[@]} · recheck loop start · $STAMP (UTC)"
  echo ""
} | tee -a "$OUT"

fail=0
pass=0

for spec in "${SPECS[@]}"; do
  ensure_site10_api_health || exit 1
  if [[ "$spec" == "e2e/pi1-traveltrust-v6-browser-acceptance.spec.ts" ]] \
    || [[ "$spec" == "e2e/p0-spine-real-api-session.spec.ts" ]] \
    || [[ "$spec" == "e2e/me-settings-l5-hub.spec.ts" ]] \
    || [[ "$spec" == "e2e/community-subroutes-l5-markers.spec.ts" ]] \
    || [[ "$spec" == "e2e/release-flow.spec.ts" ]] \
    || [[ "$spec" == "e2e/g-s1-referral-minimum-loop.spec.ts" ]] \
    || [[ "$spec" == "e2e/itinerary-52.spec.ts" ]]; then
    echo "== site10: pre-spec warm restart before $spec ==" | tee -a "$OUT"
    restart_site10_next_mandatory || exit 1
    site10_verify_api_trigger_chain || exit 1
  fi
  ensure_site10_fe_health || exit 1
  site10_dual_health_gate || exit 1
  if site10_spec_in_list "$spec" "${SITE10_HEAVY_SPECS[@]}"; then
    site10_verify_api_trigger_chain || exit 1
  fi
  echo "== recheck: $spec ==" | tee -a "$OUT"
  set +e
  extra_env=()
  if [[ "$spec" == "e2e/f027-f028-f033-request.spec.ts" ]]; then
    extra_env=(env REQUIRE_IDEMPOTENCY_KEY=1)
  else
    # 父 shell 若误 export REQUIRE_IDEMPOTENCY_KEY=1，会破坏 /auth/login 与 /auth/register（仅 F-028 切片需要）
    extra_env=(env -u REQUIRE_IDEMPOTENCY_KEY)
  fi
  (
    cd "$ROOT/frontend"
    export PLAYWRIGHT_SITE10_SEQUENTIAL=1
    export PLAYWRIGHT_SITE10_EXTERNAL_STACK=1
    export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL}"
    export DATABASE_URL="${DATABASE_URL:-}"
    "${extra_env[@]}" node ./scripts/run-e2e-default.mjs "$spec" --project=chromium
  ) 2>&1 | tee -a "$OUT"
  rc=${PIPESTATUS[0]}
  set -e
  if [[ "$rc" -eq 0 ]]; then
    pass=$((pass + 1))
    echo "RECHECK_PASS: $spec (exit 0)" | tee -a "$OUT"
    site10_post_spec_stabilize "$spec" 0 || exit 1
  else
    fail=$((fail + 1))
    echo "RECHECK_FAIL: $spec (exit $rc)" | tee -a "$OUT"
    site10_post_spec_stabilize "$spec" 1 || exit 1
  fi
  echo "" | tee -a "$OUT"
done

{
  echo "# summary pass=$pass fail=$fail total=${#SPECS[@]} · $STAMP"
} | tee -a "$OUT"

if [[ "$fail" -ne 0 ]]; then
  cp -f "$OUT" "$OUT_LATEST" 2>/dev/null || true
  echo "site10-p1-slices-recheck: FAIL ($fail/${#SPECS[@]}) → $OUT" >&2
  exit 1
fi

cp -f "$OUT" "$OUT_LATEST" 2>/dev/null || true
echo "site10-p1-slices-recheck: OK ($pass/${#SPECS[@]}) → $OUT"
echo "TT_SITE10_P1_SLICES_RECHECK: OK"
