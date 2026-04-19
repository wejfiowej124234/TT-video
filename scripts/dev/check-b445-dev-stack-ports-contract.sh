#!/usr/bin/env bash
# **B-445**：机读验收 — 当根 `.env` 仅有 **PORT=3012** 时 **`_dev_stack_ports.sh`** 将 **`BACKEND_PORT`** 解析为 **8080**（与 Windows **`start-api-with-seed.bat`** 覆盖语义对齐）。
set -euo pipefail
REAL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FAKE_ROOT="$(mktemp -d)"
trap 'rm -rf "$FAKE_ROOT"' EXIT
echo "PORT=3012" >"$FAKE_ROOT/.env"
export REPO_ROOT="$FAKE_ROOT"
export API_PORT=""
# shellcheck source=scripts/dev/_dev_stack_ports.sh
source "$REAL_ROOT/scripts/dev/_dev_stack_ports.sh"
if [[ "${BACKEND_PORT:-}" != "8080" ]]; then
  echo "B-445 FAIL: expected BACKEND_PORT=8080 when PORT=3012, got ${BACKEND_PORT:-}"
  exit 1
fi
echo "B-445 OK: BACKEND_PORT=${BACKEND_PORT} (Unix _dev_stack_ports)"
