#!/usr/bin/env bash
# 91 — Optional gate: verify SHA256 manifest + meta.chain_id vs CHAIN_ID for an evidence run dir.
#
# Usage (repo root):
#   EVIDENCE_RUN_DIR=evidence/.../run_<UTC> bash scripts/gates/check-evidence-run-insurance-gate.sh
#
# Exit: 0 = pass; 1 = fail; 2 = skip (no manifest and CHECK_EVIDENCE_RUN_STRICT!=1)
#
# Env:
#   EVIDENCE_RUN_DIR — required unless first arg is the path
#   CHAIN_ID — optional; if set and meta.json exists, must equal .chain.chain_id (string)
#   CHECK_EVIDENCE_RUN_STRICT=1 — fail if manifest missing
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if command -v python3 >/dev/null 2>&1 && python3 -c "import sys; sys.exit(0)" 2>/dev/null; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "check-evidence-run-insurance-gate: need python3 or python on PATH" >&2
  exit 1
fi
RUN="${EVIDENCE_RUN_DIR:-${1:-}}"
RUN="${RUN//$'\r'/}"
if [[ -z "$RUN" ]]; then
  echo "check-evidence-run-insurance-gate: set EVIDENCE_RUN_DIR or pass path" >&2
  exit 2
fi
if [[ ! "$RUN" = /* ]]; then
  RUN="$ROOT/$RUN"
fi
if [[ ! -d "$RUN" ]]; then
  echo "check-evidence-run-insurance-gate: not a directory: $RUN" >&2
  exit 1
fi

MAN="$RUN/evidence_sha256_manifest.json"
META="$RUN/meta.json"
STRICT="${CHECK_EVIDENCE_RUN_STRICT:-0}"

if [[ ! -f "$MAN" ]]; then
  if [[ "$STRICT" == "1" ]]; then
    echo "check-evidence-run-insurance-gate: missing evidence_sha256_manifest.json under $RUN" >&2
    exit 1
  fi
  echo "check-evidence-run-insurance-gate: SKIP (no manifest; set CHECK_EVIDENCE_RUN_STRICT=1 to require)" >&2
  exit 2
fi

"$PY" "$ROOT/scripts/ops/evidence_run_sha256_manifest.py" verify "$RUN"

if [[ -f "$META" ]] && command -v jq >/dev/null 2>&1; then
  mid="$(jq -r '.chain.chain_id // empty' "$META" 2>/dev/null || true)"
  mid="${mid//$'\r'/}"
  cid="${CHAIN_ID:-}"
  cid="${cid//$'\r'/}"
  if [[ -n "$cid" && -n "$mid" && "$cid" != "$mid" ]]; then
    echo "check-evidence-run-insurance-gate: chain_id mismatch meta.json=$mid CHAIN_ID=$cid" >&2
    exit 1
  fi
  if [[ -n "$cid" && -z "$mid" ]]; then
    echo "check-evidence-run-insurance-gate: CHAIN_ID set but meta.json missing .chain.chain_id" >&2
    exit 1
  fi
fi

echo "check-evidence-run-insurance-gate: OK ($RUN)"
exit 0
