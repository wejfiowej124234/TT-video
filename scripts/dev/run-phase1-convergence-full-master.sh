#!/usr/bin/env bash
# Phase① · FULL MASTER (convergence mode · no domain SKIP)
#
#   bash scripts/dev/run-phase1-convergence-full-master.sh
#
# Chains: §11–§12 + PF + DOA + LFC + PGX + AG + MA + FZ + QA2 + PEB + EX
# ① local: route probes may use SKIP_*_ROUTES=1 (not a domain skip)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

export PHASE1_CONVERGENCE_MODE=1
unset SKIP_DOMAIN_X SKIP_DOMAIN_Z SKIP_LIFECYCLE SKIP_PLATFORM_GOV SKIP_DOMAIN_AG
unset SKIP_DOMAIN_MA SKIP_DOMAIN_FZ SKIP_DOMAIN_QA2 SKIP_PHASE1_EXECUTIVE_BOARD

# ① pragmatic: heavy route matrix probes optional (documented in TT-PHASE1-CONVERGENCE)
export SKIP_PF_ROUTES="${SKIP_PF_ROUTES:-1}"
export SKIP_DOA_ROUTES="${SKIP_DOA_ROUTES:-1}"
export SKIP_LFC_ROUTES="${SKIP_LFC_ROUTES:-1}"

echo "== Phase① Convergence · FULL MASTER (v1.14.0) =="
echo "PHASE1_CONVERGENCE_MODE=1 · no SKIP_DOMAIN_*"

bash "$ROOT/scripts/dev/run-full-system-audit-master-gate.sh"
