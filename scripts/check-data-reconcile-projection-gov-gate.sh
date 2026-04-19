#!/usr/bin/env bash
# B-422：**indexer-reconcile-probe** **→** **（** **可选** **）** **B-402** **→** **governance-governor-proposal-count-ssot-ops-check** **。**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JSON=false
for a in "$@"; do
  if [[ "$a" == "--json" ]]; then JSON=true
  else echo "check-data-reconcile-projection-gov-gate: unknown option: $a" >&2; exit 1
  fi
done

bash scripts/indexer-reconcile-probe.sh

if [[ "${B422_SKIP_REVENUE_E2E_SMOKE:-}" != "1" ]] && [[ -f scripts/ops/b402-min-revenue-e2e-reconcile-smoke.sh ]]; then
  bash scripts/ops/b402-min-revenue-e2e-reconcile-smoke.sh || true
fi

bash scripts/governance-governor-proposal-count-ssot-ops-check.sh

if $JSON; then
  command -v jq >/dev/null 2>&1 || { echo "jq required for --json" >&2; exit 1; }
  jq -n --arg schema "traveltrust.data_reconcile_projection_gov_gate.v1" --arg verdict GO \
    '{schema_version:$schema, verdict:$verdict}'
else
  echo "check-data-reconcile-projection-gov-gate: ok" >&2
fi
