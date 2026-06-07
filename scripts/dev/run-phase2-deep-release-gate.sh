#!/usr/bin/env bash
# Phase ② · Deep multidimensional release gate (staging-only)
#
#   bash scripts/dev/run-phase2-deep-release-gate.sh
#   bash scripts/dev/run-phase2-deep-release-gate.sh --skip-rbac   # faster; G04 deferred
#
# 末行：TT_PHASE2_DEEP_RELEASE_GATE: PASS|FAIL
# FAIL 阻断：S6 · HAT · Phase ③
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE2_DEEP_GATE_OUT:-$ROOT/evidence/GO_phase2_testnet_20260526/deep-release-gate/$STAMP}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
EXPECT_SHA="${PHASE2_EXPECT_GIT_SHA:-$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo '')}"

SKIP_RBAC=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-rbac) SKIP_RBAC=1; shift ;;
    --api-base) API="$2"; shift 2 ;;
    --web-base) WEB="$2"; shift 2 ;;
    --expect-git-sha) EXPECT_SHA="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$OUT"
LOG="$OUT/run.log"

REPO_ROOT="$ROOT"
# shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
trap staging_adm_u01_cleanup_proxy EXIT
if ! staging_adm_u01_prepare_dsn; then
  echo "WARN: staging-adm-u01-env prepare failed — G04 may FAIL (fly proxy / STAGING_DATABASE_URL)" >&2
fi

{
  echo "== Phase ② deep release gate · $STAMP =="
  echo "OUT=$OUT"
  echo "API=$API WEB=$WEB"
  echo "EXPECT_SHA=${EXPECT_SHA:0:12}…"

  ARGS=(--api-base "$API" --web-base "$WEB" --out "$OUT")
  [[ -n "$EXPECT_SHA" ]] && ARGS+=(--expect-git-sha "$EXPECT_SHA")
  [[ "$SKIP_RBAC" -eq 1 ]] && ARGS+=(--skip-rbac)

  export STAGING_API_BASE="$API"
  export STAGING_WEB_BASE="$WEB"
  export PHASE2_EXPECT_GIT_SHA="$EXPECT_SHA"

  set +e
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/phase2-deep-release-gate.py" "${ARGS[@]}"
  RC=$?
  set -e

  cp -f "$OUT/report.json" "$ROOT/evidence/GO_phase2_testnet_20260526/deep-release-gate/latest-report.json" 2>/dev/null || true

  echo ""
  echo "Runbook: docs/runbook/TT-PHASE2-DEEP-RELEASE-GATE.md"
  echo "Summary: $OUT/SUMMARY.md"

  if [[ "$RC" -ne 0 ]]; then
    echo "TT_PHASE2_DEEP_RELEASE_GATE_BLOCKS: S6,HAT,PHASE3" >&2
  fi
} 2>&1 | tee -a "$LOG"

RC="$(grep -E '^TT_PHASE2_DEEP_RELEASE_GATE: ' "$LOG" | tail -1 | awk '{print $2}' || true)"
[[ "$RC" == "PASS" ]] && exit 0
exit 2
