#!/usr/bin/env bash
# SUPERSEDED · Phase② Post-Graduation Single SSOT Reconciliation Audit
#
# **毕业序 SSOT：** `scripts/dev/run-phase2-graduation-closure-program.sh`
# TESTNET_STAGING_FREEZE ACTIVE 时默认 exit 2 · Owner 取证：`LEGACY_ORCHESTRATOR_OK=1`
#
#   bash scripts/dev/run-single-ssot-reconciliation-audit.sh
#
# Outputs FREEZE-LIFT-EXECUTION-REPORT + TT_SINGLE_SSOT_RECONCILIATION verdict
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-legacy-orchestrator-guard.sh
source "$ROOT/scripts/dev/lib/phase2-legacy-orchestrator-guard.sh"
phase2_legacy_orchestrator_guard "$ROOT" "$(basename "$0")" || exit $?

echo "TT_SINGLE_SSOT_RECONCILIATION_AUDIT: START $(date -u +%Y%m%dT%H%M%SZ)"

curl --noproxy "*" -sS --max-time 45 "${STAGING_API_BASE:-https://tt-api-staging.fly.dev}/meta" \
  >"$ROOT/evidence/.tmp-ssot-meta.json" || echo '{"error":"meta"}' >"$ROOT/evidence/.tmp-ssot-meta.json"

node "$ROOT/scripts/dev/emit-freeze-lift-execution-report.mjs"

echo "TT_SINGLE_SSOT_RECONCILIATION_AUDIT: DONE"
