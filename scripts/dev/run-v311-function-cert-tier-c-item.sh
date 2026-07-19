#!/usr/bin/env bash
# Targeted Tier C item runner · does not claim overall cert PASS alone
# Usage:
#   TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 \
#     bash scripts/dev/run-v311-function-cert-tier-c-item.sh F-03-treasury-flow-tx
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
ITEM="${1:-}"
[[ -n "$ITEM" ]] || { echo "usage: $0 <I-01-indexer-reconcile-live|F-01-escrow-lifecycle|F-02-gov-timelock|F-03-treasury-flow-tx>" >&2; exit 2; }

if [[ "${TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK:-0}" != "1" && "$ITEM" != I-01-indexer-reconcile-live ]]; then
  echo "REFUSE: set TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 for mutating items" >&2
  exit 3
fi

PY=python
command -v python >/dev/null 2>&1 || PY=python3
"$PY" - <<PY
import json, sys
sys.path.insert(0, r"${ROOT}/scripts/dev/lib")
from run_v311_function_cert_tier_c import run_tier_c_item
out = run_tier_c_item("${ITEM}")
print(json.dumps(out, indent=2))
sys.exit(0 if out.get("status") == "PASS" else 2)
PY
