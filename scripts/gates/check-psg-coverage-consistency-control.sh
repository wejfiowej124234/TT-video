#!/usr/bin/env bash
# PSG Coverage Consistency Control — Alignment Loop gate.
# Default: audit + write report (exit 0; verdict may be NOT_ALIGNED).
# --require-aligned: exit 1 unless five-point ALIGNED_PASS.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

REQUIRE_ALIGNED=0
for arg in "$@"; do
  case "$arg" in
    --require-aligned) REQUIRE_ALIGNED=1 ;;
    -h|--help)
      echo "Usage: bash scripts/gates/check-psg-coverage-consistency-control.sh [--require-aligned]"
      exit 0
      ;;
  esac
done

export TT_CC_REQUIRE_ALIGNED="$REQUIRE_ALIGNED"
# Propagate Python exit (0=audit ok even if NOT_ALIGNED; 1=--require-aligned unmet)
exec python scripts/dev/run-psg-coverage-consistency-control-gate.py
