#!/usr/bin/env bash
# Phase② Post-Graduation Reconciliation Planning (audit-only · no deploy)
#
#   bash scripts/dev/run-post-graduation-reconciliation-planning.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "TT_POST_GRADUATION_RECON_PLANNING: START $(date -u +%Y%m%dT%H%M%SZ)"
echo "mode=planning-only · Reliability Freeze until COMPLETED.json + CLOSED"

node "$ROOT/scripts/dev/emit-freeze-lift-execution-plan.mjs"

echo "TT_POST_GRADUATION_RECON_PLANNING: DONE"
