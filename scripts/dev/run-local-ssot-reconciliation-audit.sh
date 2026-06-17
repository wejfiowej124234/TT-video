#!/usr/bin/env bash
# SUPERSEDED · Local SSOT (Working Tree) vs Staging Deployment Reconciliation Audit
#
# **毕业序 SSOT：** `scripts/dev/run-phase2-graduation-closure-program.sh`
# TESTNET_STAGING_FREEZE ACTIVE 时默认 exit 2 · Owner 取证：`LEGACY_ORCHESTRATOR_OK=1`
#
#   bash scripts/dev/run-local-ssot-reconciliation-audit.sh
#
# SSOT baseline: working tree · compare HEAD · staging /meta · env · registry · evidence
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-legacy-orchestrator-guard.sh
source "$ROOT/scripts/dev/lib/phase2-legacy-orchestrator-guard.sh"
phase2_legacy_orchestrator_guard "$ROOT" "$(basename "$0")" || exit $?

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
echo "TT_LOCAL_SSOT_RECONCILIATION_AUDIT: START ${STAMP}"

curl --noproxy "*" -sS --max-time 45 "${STAGING_API_BASE:-https://tt-api-staging.fly.dev}/meta" \
  >"$ROOT/evidence/.tmp-recon-meta.json" || echo '{"error":"meta"}' >"$ROOT/evidence/.tmp-recon-meta.json"

node "$ROOT/scripts/dev/emit-local-ssot-reconciliation-report.mjs" --stamp "$STAMP"

echo "TT_LOCAL_SSOT_RECONCILIATION_AUDIT: DONE ${STAMP}"
