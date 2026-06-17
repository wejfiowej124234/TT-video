#!/usr/bin/env bash
# ① Publish Hub L5 · start-api-with-seed Step 6s
# seed multi-demo 五轨演示 + publish-summary API + 可选 Wave1 vitest
#
# 环境：
#   API_BASE=http://127.0.0.1:8080
#   SKIP_SEED_PUBLISH_HUB=1
#   SKIP_VITEST=1          # post-start 默认 1（快）
#   TRAVELTRUST_POST_START_PUBLISH_HUB_VITEST=1  → 强制 vitest
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
SKIP_SEED="${SKIP_SEED_PUBLISH_HUB:-0}"
SKIP_VITEST="${SKIP_VITEST:-1}"
if [[ "${TRAVELTRUST_POST_START_PUBLISH_HUB_VITEST:-}" == "1" ]]; then
  SKIP_VITEST=0
fi

fail() { echo "PH-L5-post-start: FAIL $*" >&2; exit 1; }
ok() { echo "PH-L5-post-start: OK $*"; }

if [[ "$SKIP_SEED" != "1" ]]; then
  echo "== seed publish hub multi-demo demo data =="
  API_BASE="$API_BASE" bash scripts/dev/seed-publish-hub-multi-demo-local.sh || fail "seed-publish-hub-multi-demo-local"
  ok "seed multi-demo publish hub"
fi

echo "== API publish-summary probe (STRICT) =="
export API_BASE STRICT_API=1
bash scripts/dev/smoke-publish-hub-api-probe-local.sh || fail "publish-summary API probe"

if [[ "$SKIP_VITEST" != "1" ]]; then
  echo "== vitest Wave1 publish hub contract subset =="
  cd "$ROOT/frontend"
  npm run test -- accountOperatingModelUxWave1 activeWorkspaceContext publishHubOperatingSpineModel publishHubPublishSummaryRoute publishHubWorkspaceContextSync workspaceContextWorkbenchNav publishHubServerSummaryModel --run >/dev/null \
    || fail "vitest publish hub wave1 subset"
  cd "$ROOT"
  ok "vitest wave1 subset"
else
  ok "vitest skip (SKIP_VITEST=1)"
fi

echo "TT_PUBLISH_HUB_POST_START: OK phase=① wave1-local"
ok "publish hub L5 post-start"
