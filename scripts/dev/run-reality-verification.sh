#!/usr/bin/env bash
# Release Train · Reality Verification — unified entry (G1 / G2 / G3).
#
#   bash scripts/dev/run-reality-verification.sh --gate G2
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

GATE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --gate|-g) GATE="${2:-}"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$GATE" ]] || { echo "Usage: bash scripts/dev/run-reality-verification.sh --gate G1|G2|G3" >&2; exit 2; }

case "$GATE" in
  G1) exec bash scripts/dev/run-g1-reality-verification.sh ;;
  G2) exec bash scripts/dev/run-g2-reality-verification.sh ;;
  G3) exec bash scripts/dev/run-g3-reality-verification.sh ;;
  *) echo "Invalid gate: $GATE (expected G1, G2, or G3)" >&2; exit 2 ;;
esac
