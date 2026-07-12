#!/usr/bin/env bash
# Governance Consistency Audit — ① local · no Sepolia upgrade
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
PY="python"
if ! command -v python >/dev/null 2>&1; then
  command -v python3 >/dev/null 2>&1 && PY="python3"
fi
export GOV_CONSISTENCY_EVID="${GOV_CONSISTENCY_EVID:-$ROOT/evidence/GO_governance_consistency_audit}"
"$PY" scripts/dev/run-governance-consistency-audit.py
