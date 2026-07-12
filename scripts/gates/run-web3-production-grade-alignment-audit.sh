#!/usr/bin/env bash
# Web3 Production-Grade Alignment Audit — ① local · no chain broadcast
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
PY="python"
command -v python >/dev/null 2>&1 || PY="python3"
export WEB3_ALIGN_EVID="${WEB3_ALIGN_EVID:-$ROOT/evidence/GO_web3_production_grade_alignment_audit}"
"$PY" scripts/dev/run-web3-production-grade-alignment-audit.py
