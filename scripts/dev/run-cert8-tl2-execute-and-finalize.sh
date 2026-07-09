#!/usr/bin/env bash
# Cert #8 · TL#2 Treasury spend execute + finalize (after Timelock ETA only · no bypass)
#
#   export HAT_R1_LIVE_WALLET_OK=1 HAT_R1_PHASE_B_PAUSED=0 HAT_R1_ALLOW_SPEND_EXECUTE=1
#   export HAT_R1_CHAIN_RPC_URL=https://sepolia.gateway.tenderly.co
#   bash scripts/dev/run-cert8-tl2-execute-and-finalize.sh --signer "Sebastian Ward"
#
# Optional: --then-cert9 queues Cert #9 unstake evidence after Cert #8 finalize.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP=""
SIGNER="${TTG_CERT_SIGNER:-Sebastian Ward}"
THEN_CERT9=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stamp) STAMP="$2"; shift 2 ;;
    --signer) SIGNER="$2"; shift 2 ;;
    --then-cert9) THEN_CERT9=1; shift ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

[[ -n "$STAMP" ]] || STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || { echo "cert8-tl2: missing cert session stamp" >&2; exit 2; }

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_EVID="$(hat_r1_resolve_evid_dir "$ROOT")"
ETA="$(cat "$HAT_EVID/TREASURY_EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo 0)"
NOW="$(date +%s)"

if [[ "$NOW" -lt "$ETA" ]]; then
  REM=$((ETA - NOW))
  echo "CERT8_TL2_EXECUTE: BLOCKED Timelock not elapsed" >&2
  echo "  treasury_execute_earliest_unix=${ETA}" >&2
  echo "  utc=$(date -u -d "@${ETA}" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -r "${ETA}" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo n/a)" >&2
  echo "  remaining_seconds=${REM}" >&2
  echo "  proposal #4 on-chain state should be 5 (Queued) until then" >&2
  exit 2
fi

export HAT_R1_LIVE_WALLET_OK="${HAT_R1_LIVE_WALLET_OK:-1}"
export HAT_R1_PHASE_B_PAUSED="${HAT_R1_PHASE_B_PAUSED:-0}"
export HAT_R1_ALLOW_SPEND_EXECUTE="${HAT_R1_ALLOW_SPEND_EXECUTE:-1}"
export HAT_R1_CHAIN_RPC_URL="${HAT_R1_CHAIN_RPC_URL:-${CHAIN_RPC_URL_BACKUP:-https://sepolia.gateway.tenderly.co}}"

echo "CERT8_TL2_EXECUTE: START stamp=${STAMP} eta_elapsed=yes rpc=${HAT_R1_CHAIN_RPC_URL}"

bash "$ROOT/scripts/dev/run-tt-governance-cert-08-treasury-spend.sh" \
  --try-chain --finalize --signer "$SIGNER" --stamp "$STAMP"

node "$ROOT/scripts/dev/gen-ttg-cert-production-evidence-index.cjs"

echo "CERT8_TL2_EXECUTE: FINALIZED cert=8/12"

if [[ "$THEN_CERT9" -eq 1 ]]; then
  bash "$ROOT/scripts/dev/run-tt-governance-cert-09-unstake.sh" --try-chain --stamp "$STAMP" || {
    echo "CERT8_TL2_EXECUTE: Cert #9 prep started — finalize after unstake evidence" >&2
  }
fi

echo "TT_CERT8_TL2_EXECUTE_AND_FINALIZE: PASS"
