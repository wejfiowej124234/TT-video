#!/usr/bin/env bash
# PER Wave C · CI-10 — Hangzhou guide catalog parity (API list = UI projection)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${API_BASE:-http://127.0.0.1:8080}"
EVID="${EVIDENCE_JSON:-$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-WAVE-C-MARKET-GUIDE-PARITY-LATEST.json}"

mkdir -p "$(dirname "$EVID")"
API_BASE="$API" EVIDENCE_JSON="$EVID" node "$ROOT/scripts/dev/run-market-guide-catalog-parity.cjs"
echo "TT_MARKET_GUIDE_CATALOG_PARITY_EVIDENCE: $EVID"
