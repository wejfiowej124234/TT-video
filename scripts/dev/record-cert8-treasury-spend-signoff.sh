#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP=""
SIGNER="${TTG_CERT_SIGNER:-}"
SKIP_RECORDING_CHECK=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stamp) STAMP="$2"; shift 2 ;;
    --signer) SIGNER="$2"; shift 2 ;;
    --skip-recording-check) SKIP_RECORDING_CHECK=1; shift ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done
[[ -n "$STAMP" ]] || STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$SIGNER" ]] || { echo "record-cert8: --signer required" >&2; exit 2; }
ARGS=(python "$ROOT/scripts/dev/record-cert8-treasury-spend-signoff.py" --stamp "$STAMP" --signer "$SIGNER")
[[ "$SKIP_RECORDING_CHECK" -eq 1 ]] && ARGS+=(--skip-recording-check)
"${ARGS[@]}"
