#!/usr/bin/env bash
# Batch-1: B-380 nonce quorum + B-366 receipt quorum + B-379 GO fingerprints + B-368 Merkle (self-test + JSON assert).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
export PYTHONPATH="${ROOT}/scripts/ops"
python3 scripts/ops/region_vault_claim_broadcast_nonce_preflight.py self-test
python3 scripts/ops/region_vault_claim_broadcast_receipt_archive.py self-test
python3 scripts/ops/region_vault_claim_production_go_gate.py self-test
python3 scripts/ops/region_vault_claim_evidence_bundle_merkle.py self-test
python3 scripts/ops/broadcast_batch_json_assert.py 1
echo "broadcast-batch-1-blockers: OK"
