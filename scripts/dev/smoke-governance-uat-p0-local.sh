#!/usr/bin/env bash
# Local smoke · BE-DAO-01 (gate + optional live Sepolia)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
bash "$ROOT/scripts/dev/run-sprint171-be-dao01-implementation-gate.sh"
if [[ -n "${CHAIN_RPC_URL:-}" && -n "${B417_PROPOSAL_ID:-}" && -n "${B417_PRIVATE_KEY:-}" ]]; then
  echo "-- live Sepolia onchain evidence --"
  bash "$ROOT/scripts/ops/b417-run-onchain-evidence.sh"
  bash "$ROOT/scripts/ops/b417-evidence-pack-verify.sh" "$B417_RECORD_DIR"
fi
echo "SMOKE_BE_DAO_01: OK"
