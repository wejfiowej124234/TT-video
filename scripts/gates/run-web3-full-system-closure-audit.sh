#!/usr/bin/env bash
# Web3 Full-System Closure Audit — ① local · no broadcast
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
PY="python"
if ! command -v python >/dev/null 2>&1; then
  command -v python3 >/dev/null 2>&1 && PY="python3"
fi
export WEB3_CLOSURE_EVID="${WEB3_CLOSURE_EVID:-$ROOT/evidence/GO_web3_full_system_closure_audit}"
"$PY" scripts/dev/run-web3-full-system-closure-audit.py
