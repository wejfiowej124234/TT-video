#!/usr/bin/env bash
# ① Runtime stack for CFG zero-drift: MinIO + Anvil + API git_sha + frontend sync.
# Usage: bash scripts/dev/ensure-local-runtime-cfg-stack.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> CFG runtime: MinIO (CFG-006)"
bash "$ROOT/scripts/dev/setup-community-media-minio-local.sh"

echo "==> CFG runtime: Anvil (CFG-007)"
# shellcheck source=scripts/dev/lib/fundstack-anvil-common.sh
source "$ROOT/scripts/dev/lib/fundstack-anvil-common.sh"
fundstack_anvil_ensure_tools
fundstack_anvil_ensure_anvil

echo "==> CFG runtime: sync frontend env"
if command -v powershell.exe >/dev/null 2>&1; then
  powershell.exe -NoProfile -File "$ROOT/scripts/dev/sync-frontend-env-local-from-root.ps1"
else
  bash "$ROOT/scripts/dev/sync-frontend-env-local-from-root.sh"
fi

export TRAVELTRUST_GIT_SHA="${TRAVELTRUST_GIT_SHA:-$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)}"
echo "==> CFG runtime: TRAVELTRUST_GIT_SHA=$TRAVELTRUST_GIT_SHA (CFG-009)"

API_PORT="${PORT:-8080}"
if curl -sf "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1; then
  sha_now="$(curl -sf "http://127.0.0.1:${API_PORT}/meta/build" | python -c "import json,sys; print(json.load(sys.stdin).get('git_sha','unknown'))" 2>/dev/null || echo unknown)"
  if [[ "$sha_now" == "unknown" || "$sha_now" == "" ]]; then
    echo "WARN API running but git_sha=$sha_now — restart API with TRAVELTRUST_GIT_SHA=$TRAVELTRUST_GIT_SHA"
    echo "      Example: TRAVELTRUST_GIT_SHA=$TRAVELTRUST_GIT_SHA cargo run -p traveltrust-api"
  else
    echo "OK API meta/build.git_sha=$sha_now"
  fi
else
  echo "WARN API not on :${API_PORT} — start with TRAVELTRUST_GIT_SHA=$TRAVELTRUST_GIT_SHA cargo run -p traveltrust-api"
fi

echo "ensure-local-runtime-cfg-stack: done"
