#!/usr/bin/env bash
# Official V9 · Local / Staging / Repo 1:1 product-identity map (Solo · no PR).
#
#   bash scripts/gates/check-official-v9-local-staging-repo-1to1.sh
#   bash scripts/gates/check-official-v9-local-staging-repo-1to1.sh --skip-live
#
# PASS when:
#   official_sha == staging_sha == PIN_GIT_SHA (3e356617…)
#   main_sha == tip_sha (product-ssot)
#   release_wt_sha == PIN_GIT_SHA
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PIN_GIT_SHA="${TT_OFFICIAL_V9_GIT_SHA:-3e356617a498b0faac42e4ae457343d36294a770}"
PIN_BUILD_TIME="${TT_OFFICIAL_V9_BUILD_TIME:-2026-08-20T00:51:57Z}"
OFFICIAL_WEB="${PROD_WEB_BASE:-https://www.web3-ttg.com}"
STAGING_WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
TIP_BRANCH="${TT_V9_TIP_BRANCH:-release/official-ops-v9-product-ssot}"
RELEASE_WT="${TT_V9_RELEASE_WT:-/d/TravelTrust-official-ops-v9-release}"
SKIP_LIVE=0
[[ "${1:-}" == "--skip-live" ]] && SKIP_LIVE=1

fail() { echo "check-official-v9-1to1: FAIL $*" >&2; exit 2; }
ok() { echo "check-official-v9-1to1: OK $*"; }
info() { echo "check-official-v9-1to1: $*"; }

fetch_sha() {
  local base="$1"
  local body
  body="$(curl -fsS --max-time 30 "${base%/}/api/release-identity?t=$(date +%s)" 2>/dev/null || echo '{}')"
  python -c "import json,sys; print(json.loads(sys.argv[1]).get('git_sha') or '')" "$body"
}

fetch_bt() {
  local base="$1"
  local body
  body="$(curl -fsS --max-time 30 "${base%/}/api/release-identity?t=$(date +%s)" 2>/dev/null || echo '{}')"
  python -c "import json,sys; print(json.loads(sys.argv[1]).get('build_time') or '')" "$body"
}

tip_sha="$(git rev-parse "$TIP_BRANCH" 2>/dev/null || true)"
main_sha="$(git rev-parse main 2>/dev/null || true)"
[[ -n "$tip_sha" ]] || fail "missing tip branch $TIP_BRANCH"
[[ -n "$main_sha" ]] || fail "missing main"
[[ "$main_sha" == "$tip_sha" ]] || fail "main($main_sha) != tip($tip_sha) — repo not 1:1"

wt_sha=""
if [[ -d "$RELEASE_WT/.git" || -f "$RELEASE_WT/.git" ]]; then
  wt_sha="$(git -C "$RELEASE_WT" rev-parse HEAD 2>/dev/null || true)"
fi
[[ -n "$wt_sha" ]] || fail "Release WT missing: $RELEASE_WT"
[[ "$wt_sha" == "$PIN_GIT_SHA" ]] || fail "Release WT($wt_sha) != pin($PIN_GIT_SHA)"

official_sha=""
staging_sha=""
official_bt=""
staging_bt=""
if [[ "$SKIP_LIVE" != "1" ]]; then
  official_sha="$(fetch_sha "$OFFICIAL_WEB")"
  staging_sha="$(fetch_sha "$STAGING_WEB")"
  official_bt="$(fetch_bt "$OFFICIAL_WEB")"
  staging_bt="$(fetch_bt "$STAGING_WEB")"
  [[ "$official_sha" == "$PIN_GIT_SHA" ]] || fail "Official live git_sha=$official_sha != pin $PIN_GIT_SHA"
  [[ "$official_bt" == "$PIN_BUILD_TIME" ]] || fail "Official build_time=$official_bt != pin $PIN_BUILD_TIME"
  [[ "$staging_sha" == "$PIN_GIT_SHA" ]] || fail "Staging live git_sha=$staging_sha != pin $PIN_GIT_SHA (Expected Difference: Staging build_time may differ)"
  info "Official build_time=$official_bt · Staging build_time=$staging_bt (may differ)"
else
  info "skip-live · repo/worktree only"
fi

ok "product identity 1:1 · pin=$PIN_GIT_SHA · main=tip · release_wt=pin · official=${official_sha:-skipped} · staging=${staging_sha:-skipped}"
echo "TT_OFFICIAL_V9_1TO1_MAP: PASS"
