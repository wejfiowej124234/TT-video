#!/usr/bin/env bash
# V9_WAITING_ETA_REPOSITORY_AND_DOCUMENTATION_DEEP_CLEAN — entry wrapper.
# ETA preempt: exits 2 when Timelock EXECUTABLE (run SEPOLIA_REALITY instead).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
exec python scripts/dev/run-v9-waiting-eta-repository-documentation-deep-clean.py "$@"
