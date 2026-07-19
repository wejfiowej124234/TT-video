#!/usr/bin/env bash
# Protocol v2 Clean Deploy evidence pipeline PREP (no broadcast / no ACTIVE flip).
# Usage: bash scripts/dev/run-fcg-v2-evidence-pipeline-prep.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "FCG-V2 evidence pipeline prep · pending pack only"
python scripts/dev/prepare-fcg-v2-clean-deploy-pending-pack.py

EV="evidence/GO_phase2_fcg_full_capability_v2_sepolia"
test -f "$EV/pending/CLEAN-DEPLOY-PENDING-PACK-LATEST.json"
test -f "$EV/pending/GIT-SHA-BASELINE-LATEST.json"
test -f "$EV/README.md"

echo "OK · pending pack + git SHA baseline under $EV/pending/"
echo "FORBIDDEN · Money-Path / Settlement / FeeRouter / Distributable broadcast until G-RC CLOSED"
echo "FORBIDDEN · ACTIVE flip in this prep window"
echo "NEXT · after G-RC CLOSED: bind broadcast_json + on_chain_verify + address_matrix under $EV/"
