#!/usr/bin/env bash
# Chain / Sepolia deferred E2E gate (explicit second step — not mixed into local smoke).
#
# Prereq: root `.env` with DATABASE_URL (local Postgres up) and CHAIN_RPC_URL + contract addresses
#         for the environments these tests target.
#
# Usage:
#   bash scripts/gates/run-production-gate-chain-deferred.sh [--skip-e2e]
#
# Output:
#   evidence/production-gate-chain-deferred-${RUN_ID}/CHAIN_DEFERRED_GATE.status  (PASS|BLOCKED)
#   evidence/production-gate-chain-deferred-${RUN_ID}/MANIFEST.chain-deferred.json
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SKIP_E2E=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-e2e)
      SKIP_E2E=1
      shift
      ;;
    *)
      echo "run-production-gate-chain-deferred: unknown option: $1" >&2
      exit 1
      ;;
  esac
done

PYTHON_BIN="${PYTHON_BIN:-python3}"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "run-production-gate-chain-deferred: python not found (set PYTHON_BIN or install python3/python)" >&2
    exit 1
  fi
fi
if ! "$PYTHON_BIN" -c 'import sys; print(sys.version)' >/dev/null 2>&1; then
  if [[ "$PYTHON_BIN" != "python" ]] && command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  fi
fi
if ! "$PYTHON_BIN" -c 'import sys; print(sys.version)' >/dev/null 2>&1; then
  echo "run-production-gate-chain-deferred: usable python interpreter not found" >&2
  exit 1
fi
export PYTHON_BIN

RUN_ID="chain-$(date +%Y%m%d-%H%M%S)"
export RUN_ID
OUT_DIR="evidence/production-gate-chain-deferred-${RUN_ID}"
mkdir -p "$OUT_DIR"

require_local_postgres() {
  local db_url="${DATABASE_URL:-}"
  if [[ -z "$db_url" ]] && [[ -f "$ROOT/.env" ]]; then
    db_url="$("$PYTHON_BIN" "$ROOT/scripts/gates/read_dotenv_value.py" "$ROOT/.env" DATABASE_URL)"
  fi
  if [[ -z "$db_url" ]]; then
    echo "run-production-gate-chain-deferred: DATABASE_URL missing (env or .env)" >&2
    exit 1
  fi
  export DATABASE_URL="$db_url"
  if ! "$PYTHON_BIN" "$ROOT/scripts/gates/pg_tcp_check.py"; then
    echo "run-production-gate-chain-deferred: Postgres not reachable at DATABASE_URL host (start DB or: docker compose up -d postgres)" >&2
    exit 1
  fi
}

write_status() {
  local st="$1"
  echo "$st" >"$OUT_DIR/CHAIN_DEFERRED_GATE.status"
  echo "run-production-gate-chain-deferred: ${st} (evidence: $OUT_DIR)"
}

if [[ "$SKIP_E2E" == "1" ]]; then
  write_status "SKIPPED"
  exit 0
fi

require_local_postgres

export P3_CHAIN_OFF="${P3_CHAIN_OFF:-0}"
export CARGO_INCREMENTAL="0"
export STRICT_SESSION_GATE="${STRICT_SESSION_GATE:-1}"
# Strict meta / real chain: do not relax guard for deferred suites.
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD="0"
unset PLAYWRIGHT_GREP_INVERT || true
# Do not blank CHAIN_RPC_URL — deferred tests expect chain-on / Sepolia-style SSOT from .env.

set +e
(
  cd frontend && npm run e2e -- --project=chromium --grep "@e2e-sepolia-deferred"
)
EC=$?
set -e

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
if [[ "$EC" -eq 0 ]]; then
  write_status "PASS"
  RES="PASS"
else
  write_status "BLOCKED"
  RES="BLOCKED"
fi

export CHAIN_DEFERRED_MANIFEST_PATH="$OUT_DIR/MANIFEST.chain-deferred.json"
export TS
export RUN_ID
export RES
"$PYTHON_BIN" scripts/gates/write_chain_deferred_manifest.py

echo "run-production-gate-chain-deferred: conclusion=${RES}"
exit "$EC"
