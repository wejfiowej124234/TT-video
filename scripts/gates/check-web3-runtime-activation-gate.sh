#!/usr/bin/env bash
# WEB3_RUNTIME_ACTIVATION_GATE — pre-W7 Sepolia broadcast aggregator.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }
warn() { echo "WARN: $*" >&2; }

echo "== WEB3 Runtime Activation Gate =="

echo ">> W6.5-B balance audit"
bash scripts/gates/check-vacancy-legacy-balance-audit-gate.sh

echo ">> W7 dry run"
bash scripts/gates/check-vacancy-runtime-migration-dryrun-gate.sh

echo ">> Vacancy deployment readiness (protocol/indexer)"
bash scripts/gates/check-vacancy-deployment-readiness-gate.sh

echo ">> Vacancy indexer reconcile"
bash scripts/gates/check-web3-vacancy-indexer-reconcile-gate.sh

echo "WEB3_RUNTIME_ACTIVATION_GATE: PASS"
echo "W7_SEPOLIA_BROADCAST: AUTHORIZED pending TRAVELTRUST_W7_SEPOLIA_BROADCAST_OK=1"
