#!/usr/bin/env bash
# Batch-2: B-367/B-373 revalidate RPC + production_go revalidation + B-374 Merkle manifest Ed25519 (OpenSSL).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/gates/_resolve_python_bin.sh
source "$ROOT/scripts/gates/_resolve_python_bin.sh"
export PYTHONPATH="${ROOT}/scripts/ops"
"$PYTHON_BIN" scripts/ops/region_vault_claim_broadcast_receipt_revalidate_rpc.py self-test
"$PYTHON_BIN" scripts/ops/region_vault_claim_production_go_gate.py self-test
"$PYTHON_BIN" scripts/ops/region_vault_claim_evidence_bundle_manifest_openssl_smoke.py self-test
"$PYTHON_BIN" scripts/ops/broadcast_batch_json_assert.py 2
echo "broadcast-batch-2-blockers: OK"
