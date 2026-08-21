#!/usr/bin/env bash
# ① Local compile/test for TTG V9 Remint (Token + Governor + UUPS Vault/PM). Not broadcast. Not Production GO.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec bash "${ROOT}/scripts/dev/run-ttg-v9-remint-local-gate.sh" "$@"
