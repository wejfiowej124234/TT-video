#!/usr/bin/env bash
# Optional auth session hash completeness gate.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ "${AUTH_SESSION_HASH_GATE_ENABLED:-0}" != "1" ]]; then
  echo "auth_session_hash_gate: skipped (AUTH_SESSION_HASH_GATE_ENABLED!=1)"
  exit 0
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "auth_session_hash_gate: skipped (DATABASE_URL unset)"
  exit 0
fi

echo "auth_session_hash_gate: running"
AUTH_SESSION_HASH_AUDIT_FAIL_ON_MISSING=1 \
  bash "$ROOT/scripts/ops/auth-session-hash-audit.sh"
echo "auth_session_hash_gate: pass"
