#!/usr/bin/env bash
# TT-WEB-STAGING-PUSH-RECOVERY — 复用本地已构建镜像 · 修复 registry push · settings 200 · P2HA staging sprint
#
#   export HTTPS_PROXY=http://127.0.0.1:15715
#   bash scripts/dev/tt-web-staging-push-recovery-deploy.sh
#
# 流程：
#   1 停并行 deploy
#   2 代理稳定性探针（api.fly.io · registry.fly.io）
#   3 优先 docker push 本地 registry.fly.io/tt-web-staging:* → fly deploy --image
#   4 无本地镜像时 fallback tt-web-staging-single-build-deploy.sh（仅 local-only）
#
# 可选：
#   FLY_WEB_PUSH_RETRIES=5
#   SKIP_DOCKER_MEM_CHECK=1
#   CONTINUE_IDENTITY_P2_SPRINT=1（默认 1）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/staging-fly-proxy-lib.sh
source "$ROOT/scripts/dev/lib/staging-fly-proxy-lib.sh"
# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"

WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
SETTINGS_PATH="/me/identities/guide/settings"
APP="${FLY_STAGING_WEB_APP:-tt-web-staging}"
FLY_CONFIG="${FLY_STAGING_WEB_CONFIG:-$ROOT/frontend/fly.staging.toml}"
LOG="$ROOT/evidence/tmp-tt-web-staging-push-recovery.log"
CONTINUE_SPRINT="${CONTINUE_IDENTITY_P2_SPRINT:-1}"

fail() { echo "tt-web-staging-push-recovery: FAIL $*" >&2; exit 1; }
ok() { echo "tt-web-staging-push-recovery: OK $*"; }

wait_settings_200() {
  local i code
  for i in $(seq 1 36); do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 12 --max-time 30 "${WEB_BASE}${SETTINGS_PATH}" 2>/dev/null || echo 000)"
    if [[ "$code" == "200" ]]; then
      ok "${WEB_BASE}${SETTINGS_PATH} → HTTP 200"
      return 0
    fi
    echo "tt-web-staging-push-recovery: settings HTTP ${code} — wait ${i}/36 …"
    sleep 10
  done
  fail "${SETTINGS_PATH} still not HTTP 200"
}

deploy_from_local_image() {
  local image="$1"
  staging_fly_push_image_with_retry "$image"
  ok "registry push + deploy complete: $image"
  local hc
  hc="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 20 --max-time 45 "${WEB_BASE}/" 2>/dev/null || echo 000)"
  [[ "$hc" == "200" ]] || fail "${WEB_BASE}/ HTTP ${hc} after deploy"
}

{
  echo "TT_WEB_STAGING_PUSH_RECOVERY: START $(date -u +%Y%m%dT%H%M%SZ)"
  phase2_require_staging_deploy_allowed "$ROOT" || exit 3
  export TESTNET_FREEZE_OVERRIDE=1

  staging_fly_stop_parallel_deploys
  staging_fly_apply_proxy
  staging_fly_verify_proxy_stable

  LOCAL_IMAGE="$(staging_fly_latest_local_image || true)"
  if [[ -n "$LOCAL_IMAGE" && "$LOCAL_IMAGE" != "registry.fly.io/${APP}:<none>" ]]; then
    echo "tt-web-staging-push-recovery: reuse local image $LOCAL_IMAGE"
    deploy_from_local_image "$LOCAL_IMAGE"
  else
    echo "tt-web-staging-push-recovery: no local registry.fly.io/${APP} image — fallback single-build …"
    export CONTINUE_IDENTITY_P2_SPRINT=0
    export SKIP_DOCKER_MEM_CHECK="${SKIP_DOCKER_MEM_CHECK:-1}"
    export FLY_WEB_NO_CACHE=0
    export BUILD_NODE_MAX_OLD_SPACE_SIZE="${BUILD_NODE_MAX_OLD_SPACE_SIZE:-4096}"
    bash "$ROOT/scripts/dev/tt-web-staging-single-build-deploy.sh"
    grep -q "TT_WEB_STAGING_SINGLE_BUILD: OK" "$ROOT/evidence/tmp-tt-web-staging-single-build.log"
    echo "TT_WEB_STAGING_PUSH_RECOVERY: OK (via single-build fallback)"
    exit 0
  fi

  wait_settings_200
  echo "TT_WEB_STAGING_PUSH_RECOVERY: OK"

  if [[ "$CONTINUE_SPRINT" == "1" ]]; then
    echo ""
    echo "== Phase2 Human Acceptance Staging Sprint (IDENTITY_P2_SKIP_DEPLOY=1) =="
    export IDENTITY_P2_SKIP_DEPLOY=1
    bash "$ROOT/scripts/dev/record-phase2-human-acceptance-staging-sprint-evidence.sh"
  fi
} 2>&1 | tee "$LOG"

grep -q "TT_WEB_STAGING_PUSH_RECOVERY: OK" "$LOG" || exit 1
exit 0
