#!/usr/bin/env bash
# Phase ② · 测试网全量同步部署与 SHA 对拍（SSOT = Phase ① 冻结本地基线 + git HEAD）
#
#   export HTTPS_PROXY=http://127.0.0.1:15715
#   export NO_PROXY=localhost,127.0.0.1,tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev
#
#   bash scripts/dev/run-phase2-testnet-full-sync-deploy.sh --preflight
#   bash scripts/dev/run-phase2-testnet-full-sync-deploy.sh --secrets-only   # 治理/env 对拍 · 不重建镜像
#   bash scripts/dev/run-phase2-testnet-full-sync-deploy.sh --full           # API+Web 部署 · 须干净工作区
#
# 末行：TT_PHASE2_TESTNET_FULL_SYNC: PASS|BLOCKED|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export DEPLOYMENT_THREE_STATE_ROOT="$ROOT"
# shellcheck source=../ops/lib/deployment-three-state-lib.sh
source "$ROOT/scripts/ops/lib/deployment-three-state-lib.sh"
case "${DEPLOYMENT_STATE:-}" in
  sync|fix) deployment_three_state_assert_fly_allowed ;;
  *)
    deployment_three_state_blocked "run-phase2-testnet-full-sync-deploy requires DEPLOYMENT_STATE=sync|fix — use run-deployment-three-state.sh"
    ;;
esac

cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_full_sync/${STAMP}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"

export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:15715}"
export HTTP_PROXY="${HTTP_PROXY:-$HTTPS_PROXY}"
export NO_PROXY="${NO_PROXY:-localhost,127.0.0.1,tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev}"

MODE="preflight"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --preflight) MODE="preflight"; shift ;;
    --secrets-only) MODE="secrets-only"; shift ;;
    --full) MODE="full"; shift ;;
    --allow-dirty) export TESTNET_SYNC_ALLOW_DIRTY=1; shift ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

fail() {
  echo "TT_PHASE2_TESTNET_FULL_SYNC: FAIL $*" >&2
  exit 2
}
blocked() {
  echo "TT_PHASE2_TESTNET_FULL_SYNC: BLOCKED $*" >&2
  echo "  fix then: bash scripts/dev/run-phase2-testnet-full-sync-deploy.sh --full"
  exit 3
}

LOCAL_SHA="$(git -C "$ROOT" rev-parse HEAD)"
echo "TT_PHASE2_TESTNET_FULL_SYNC: START mode=${MODE} local_sha=${LOCAL_SHA}"
echo "  evidence=$EVID"
FREEZE="$ROOT/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"
if [[ -f "$FREEZE" && "${TESTNET_FREEZE_OVERRIDE:-}" != "1" ]]; then
  echo "  staging_freeze=ACTIVE ($FREEZE)"
  echo "  override: TESTNET_FREEZE_OVERRIDE=1 (Owner only)"
else
  echo "  staging_freeze=off"
fi

# Phase ① SSOT
if [[ -f "$ROOT/frontend/evidence/GO_local_phase1/acceptance.latest.log" ]]; then
  grep -q "TT_GO_LOCAL_PHASE1: OK" "$ROOT/frontend/evidence/GO_local_phase1/acceptance.latest.log" \
    || fail "Phase ① acceptance.latest.log missing TT_GO_LOCAL_PHASE1: OK"
  echo "  phase1_baseline=TT_GO_LOCAL_PHASE1: OK"
else
  fail "missing frontend/evidence/GO_local_phase1/acceptance.latest.log"
fi

# Deploy-path cleanliness (full deploy only)
DEPLOY_PATHS=(crates/ frontend/ deploy/ registry/)
if [[ "$MODE" == "full" && "${TESTNET_SYNC_ALLOW_DIRTY:-0}" != "1" ]]; then
  if ! git diff --quiet HEAD -- "${DEPLOY_PATHS[@]}" 2>/dev/null; then
    git diff --stat HEAD -- "${DEPLOY_PATHS[@]}" >"$EVID/dirty-deploy-paths.stat" 2>/dev/null || true
    blocked "uncommitted changes in deploy paths — commit first (see $EVID/dirty-deploy-paths.stat)"
  fi
fi

echo "== S2 · Sepolia env merge + registry =="
bash "$ROOT/scripts/dev/phase2-staging-merge-sepolia-env.sh"
python "$ROOT/scripts/dev/validate-ttg-governance-cert-gates-registry.py" | tee "$EVID/registry-validate.log"
python "$ROOT/scripts/dev/assert-ttg-stats-triple-sync.py" | tee "$EVID/stats-triple-sync.log"

echo "== S1 · staging alignment (CORS / meta / build.env) =="
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" \
  --web-base "$WEB" --api-base "$API" | tee "$EVID/alignment.log" || true

fetch_sha() {
  curl -sS --max-time 45 "${API}/meta" 2>/dev/null \
    | python -c "import json,sys; d=json.load(sys.stdin); print((d.get('build') or {}).get('git_sha',''))" 2>/dev/null || echo ""
}

API_SHA="$(fetch_sha)"
echo "local_sha=${LOCAL_SHA}" >"$EVID/sha-parity.txt"
echo "api_staging_sha=${API_SHA}" >>"$EVID/sha-parity.txt"

WEB_SHA=""
if curl -sS --max-time 30 "${WEB}/api/meta/build" >/dev/null 2>&1; then
  WEB_SHA="$(curl -sS --max-time 30 "${WEB}/api/meta/build" 2>/dev/null \
    | python -c "import json,sys; d=json.load(sys.stdin); print(d.get('git_sha',''))" 2>/dev/null || echo "")"
elif curl -sS --max-time 30 "${WEB}/meta/build" >/dev/null 2>&1; then
  WEB_SHA="$(curl -sS --max-time 30 "${WEB}/meta/build" 2>/dev/null \
    | python -c "import json,sys; d=json.load(sys.stdin); print(d.get('git_sha',''))" 2>/dev/null || echo "")"
fi
echo "web_staging_sha=${WEB_SHA:-unknown}" >>"$EVID/sha-parity.txt"

SHA_MATCH=no
[[ "$LOCAL_SHA" == "$API_SHA" ]] && SHA_MATCH=yes
echo "GIT_SHA_LOCAL_STAGING_MATCH: ${SHA_MATCH} (api)" | tee -a "$EVID/sha-parity.txt"

if [[ "$MODE" == "secrets-only" || "$MODE" == "full" ]]; then
  [[ -f "$FREEZE" && "${TESTNET_FREEZE_OVERRIDE:-}" != "1" ]] && \
    blocked "testnet staging freeze active — set TESTNET_FREEZE_OVERRIDE=1 for deploy"
  echo "== S5a · Fly secrets sync (治理参数 · env · 无 PRIVATE_KEY) =="
  fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" --secrets-only
fi

if [[ "$MODE" == "full" ]]; then
  echo "== S5b · API deploy =="
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh"
  echo "== S5c · Web deploy (no cache) =="
  FLY_WEB_NO_CACHE=1 bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh"
  API_SHA="$(fetch_sha)"
  SHA_MATCH=no
  [[ "$LOCAL_SHA" == "$API_SHA" ]] && SHA_MATCH=yes
  echo "GIT_SHA_LOCAL_STAGING_MATCH: ${SHA_MATCH} (post-deploy api)" | tee "$EVID/sha-parity-post.txt"
  [[ "$SHA_MATCH" == "yes" ]] || fail "SHA mismatch after deploy local=${LOCAL_SHA} api=${API_SHA}"

  echo "== S6 · deep release gate =="
  export PHASE2_DEEP_GATE_OUT="$EVID/deep-release-gate"
  export PHASE2_EXPECT_GIT_SHA="$LOCAL_SHA"
  bash "$ROOT/scripts/dev/run-phase2-deep-release-gate.sh" \
    --api-base "$API" --web-base "$WEB" --expect-git-sha "$LOCAL_SHA" --skip-rbac

  bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" --web-base "$WEB" --api-base "$API"
fi

cat >"$EVID/SYNC-MANIFEST.json" <<JSON
{
  "schema": "traveltrust.phase2-testnet-full-sync.v1",
  "stamp_utc": "${STAMP}",
  "mode": "${MODE}",
  "phase1_ssot": "frontend/evidence/GO_local_phase1/acceptance.latest.log",
  "local_git_sha": "${LOCAL_SHA}",
  "api_staging_git_sha": "${API_SHA}",
  "web_staging_git_sha": "${WEB_SHA:-unknown}",
  "sha_match_api": "${SHA_MATCH}",
  "next_after_pass": [
    "bash scripts/dev/run-phase-b-daily-maintenance.sh",
    "TL#1: bash scripts/dev/run-phase-b-post-timelock-wave1.sh",
    "TN-P1-009 soak · TN-P1-010 indexer · CERT human"
  ]
}
JSON

echo "$STAMP" >"$ROOT/evidence/GO_phase2_testnet_full_sync/latest-stamp.txt"

if [[ "$SHA_MATCH" == "yes" && "$MODE" == "full" ]]; then
  echo "GIT_STAGING_BASELINE_SYNC: PASS"
  echo "TT_PHASE2_TESTNET_FULL_SYNC: PASS mode=full sha=${LOCAL_SHA}"
  exit 0
fi

if [[ "$MODE" == "preflight" || "$MODE" == "secrets-only" ]]; then
  echo "TT_PHASE2_TESTNET_FULL_SYNC: PREFLIGHT_OK sha_match=${SHA_MATCH} mode=${MODE}"
  echo "  deploy when clean: bash scripts/dev/run-phase2-testnet-full-sync-deploy.sh --full"
  exit 0
fi

fail "unexpected end state"
