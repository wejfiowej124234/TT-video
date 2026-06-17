#!/usr/bin/env bash
# TT-WEB-STAGING-OOM-FIX — 远程 builder 提内存 + 降 Node heap + 部署 + settings 200 校验
#
#   export HTTPS_PROXY=http://127.0.0.1:15715   # 小地球仪
#   bash scripts/dev/tt-web-staging-oom-fix-deploy.sh
#
# 成功后可选继续 Identity P2 staging sprint：
#   CONTINUE_IDENTITY_P2_SPRINT=1 bash scripts/dev/tt-web-staging-oom-fix-deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"

WEB_BASE="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
SETTINGS_PATH="/me/identities/guide/settings"

fail() { echo "tt-web-staging-oom-fix: FAIL $*" >&2; exit 1; }
ok() { echo "tt-web-staging-oom-fix: OK $*"; }

if [[ -z "${HTTPS_PROXY:-}" && -z "${https_proxy:-}" ]]; then
  if curl -sS -o /dev/null --connect-timeout 2 --max-time 4 -x "http://127.0.0.1:15715" https://api.fly.io 2>/dev/null; then
    export HTTPS_PROXY="http://127.0.0.1:15715"
    export HTTP_PROXY="$HTTPS_PROXY"
    export ALL_PROXY="${ALL_PROXY:-socks5://127.0.0.1:15715}"
    echo "tt-web-staging-oom-fix: using HTTPS_PROXY=$HTTPS_PROXY"
  fi
fi

phase2_require_staging_deploy_allowed "$ROOT" || exit 3
export TESTNET_FREEZE_OVERRIDE=1
export FLY_WEB_OOM_FIX=1
export FLY_WEB_DEPOT="${FLY_WEB_DEPOT:-1}"
export FLY_WEB_BUILDER_MEMORY_MB="${FLY_WEB_BUILDER_MEMORY_MB:-8192}"
export BUILD_NODE_MAX_OLD_SPACE_SIZE="${BUILD_NODE_MAX_OLD_SPACE_SIZE:-4096}"

deploy_web() {
  bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee "$ROOT/evidence/tmp-tt-web-staging-oom-fix-deploy.log"
}

echo "TT_WEB_STAGING_OOM_FIX: START (Depot + Node heap ${BUILD_NODE_MAX_OLD_SPACE_SIZE}MB)"
if ! deploy_web; then
  echo "tt-web-staging-oom-fix: remote/Depot failed — retry local Docker (--local-only + proxy) …"
  export FLY_WEB_REMOTE_BUILD=0
  unset FLY_WEB_OOM_FIX
  deploy_web || fail "local + remote deploy both failed — see evidence/tmp-tt-web-staging-oom-fix-deploy.log"
fi

code="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 15 --max-time 45 "${WEB_BASE}${SETTINGS_PATH}" 2>/dev/null || echo 000)"
[[ "$code" == "200" ]] || fail "${SETTINGS_PATH} HTTP ${code} (expected 200 after deploy)"
ok "${WEB_BASE}${SETTINGS_PATH} → HTTP 200"

echo "TT_WEB_STAGING_OOM_FIX: OK"

if [[ "${CONTINUE_IDENTITY_P2_SPRINT:-}" == "1" ]]; then
  echo ""
  echo "== CONTINUE: Phase2 Human Acceptance Staging Sprint =="
  export IDENTITY_P2_SKIP_DEPLOY=1
  bash "$ROOT/scripts/dev/record-phase2-human-acceptance-staging-sprint-evidence.sh"
fi
