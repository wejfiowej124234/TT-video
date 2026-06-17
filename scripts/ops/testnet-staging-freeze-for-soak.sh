#!/usr/bin/env bash
# Ensure TESTNET_STAGING_FREEZE ACTIVE before P2FC soak (② · no redeploy)
#
# Prefer existing ACTIVE.json; otherwise fail with engage instructions.
#   bash scripts/ops/testnet-staging-freeze-for-soak.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ACTIVE="$ROOT/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"

if [[ -f "$ACTIVE" ]]; then
  echo "TT_TESTNET_STAGING_FREEZE: ACTIVE (soak policy OK)"
  cat "$ACTIVE"
  exit 0
fi

echo "testnet-staging-freeze-for-soak: FAIL — no ACTIVE.json" >&2
echo "  Run after baseline consistency audit PASS:" >&2
echo "    bash scripts/dev/engage-testnet-staging-baseline-freeze.sh --audit-evidence evidence/GO_phase2_baseline_consistency_audit/<stamp>" >&2
exit 2
