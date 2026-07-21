#!/usr/bin/env bash
# Canonical Sepolia governance broadcast — forbids bare forge --broadcast.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=_lib.sh
source "$ROOT/scripts/deploy/_lib.sh"
tt_forbid_during_fg15 || exit 2
export TT_CANONICAL_DEPLOY=1
if [[ "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}" != "1" ]]; then
  echo "INVALID RELEASE ACTION — set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 (Owner)" >&2
  exit 2
fi
exec bash "$ROOT/scripts/dev/phase2-sepolia-broadcast-governance-stack.sh" "$@"
