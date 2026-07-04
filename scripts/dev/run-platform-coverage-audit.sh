#!/usr/bin/env bash
# Platform Coverage Audit — capability migration coverage across repo.
# SSOT: registry/platform-capability-registry.v1.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_platform_capability/coverage-audit/${STAMP}"

echo "=== Platform Coverage Audit · ${STAMP} ==="
node scripts/dev/audit-platform-coverage.cjs --evidence-dir "$EVID" "$@"
node scripts/dev/sync-platform-adoption-matrix.cjs --signoff "$EVID/platform-coverage-audit.json"
echo ""
echo "Registry: registry/platform-capability-registry.v1.json"
echo "Runbook: docs/runbook/TT-PLATFORM-CAPABILITY-REGISTRY.md"
