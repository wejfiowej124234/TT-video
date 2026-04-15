#!/usr/bin/env bash
# Batch-3: B-369 TT-B322 evidence dir + B-370 drift gate + B-375 replay digest (self-test + JSON assert).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
export PYTHONPATH="${ROOT}/scripts/ops"
python3 scripts/ops/verify_tt_b322_evidence_bundle_ci.py self-test
python3 scripts/ops/verify_b265_indexer_forwarded_drift_ci.py self-test
python3 scripts/ops/region_vault_indexer_replay_dryrun.py self-test
python3 scripts/ops/broadcast_batch_json_assert.py 3
echo "broadcast-batch-3-blockers: OK"
