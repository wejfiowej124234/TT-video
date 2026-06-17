#!/usr/bin/env bash
# Phase B · Wave 2 闭环（② only · TL#2 后）
#
# **维护窗（TL#1 前）：** 仅 probe
#   bash scripts/dev/probe-phase-b-timelock-countdown.sh
#
# **Wave 1（TL#1 后）：** Cert #7 execute+finalize → Cert #8 queue
#   bash scripts/dev/run-phase-b-post-timelock-wave1.sh --signer "Sebastian Ward"
#
# **Wave 2（TL#2 后 · 本脚本）：** Cert #8 spend execute + finalize
#   bash scripts/dev/run-ttg-phase-b-execute-spend-closure.sh --finalize --signer "Sebastian Ward"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_R1_ROOT="$(hat_r1_resolve_evid_dir "$ROOT")"

FINALIZE=0
SIGNER="${TTG_CERT_SIGNER:-}"
ARCHIVE_DRIFT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --try-chain)
      echo "phase-b-closure: --try-chain removed — use run-phase-b-post-timelock-wave1.sh (Wave 1)" >&2
      exit 2
      ;;
    --finalize) FINALIZE=1; shift ;;
    --signer) SIGNER="$2"; shift 2 ;;
    --archive-drift) ARCHIVE_DRIFT=1; shift ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

[[ "$ARCHIVE_DRIFT" -eq 1 ]] && bash "$ROOT/scripts/dev/record-governance-doc-drift-cleanup-d1-d10.sh"

echo "== Phase B closure · probe =="
bash "$ROOT/scripts/dev/probe-phase-b-timelock-countdown.sh"

HAT="$HAT_R1_ROOT"
ETA="$(cat "$HAT/EXECUTE_EARLIEST_UNIX.txt" | tr -d '\r\n')"
T2_ETA="$(cat "$HAT/TREASURY_EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo 0)"
NOW="$(date +%s)"

if [[ "$NOW" -lt "$ETA" ]]; then
  echo "TT_PHASE_B_EXECUTE_SPEND_CLOSURE: MAINTENANCE pre-TL1 — probe only" >&2
  exit 0
fi

if [[ "$FINALIZE" -eq 0 ]]; then
  echo "TT_PHASE_B_EXECUTE_SPEND_CLOSURE: no-op — use run-phase-b-post-timelock-wave1.sh or --finalize (Wave 2)" >&2
  exit 0
fi

[[ -n "$SIGNER" ]] || { echo "phase-b-closure: --finalize requires --signer" >&2; exit 2; }
[[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
  echo "phase-b-closure: --finalize requires HAT_R1_LIVE_WALLET_OK=1" >&2
  exit 2
}
[[ -f "$HAT/step-09-treasury-queue/timelock-eta.json" ]] || {
  echo "phase-b-closure: Wave 2 blocked — run Wave 1 (Cert #8 queue) first" >&2
  exit 3
}
[[ "$T2_ETA" != "0" && "$NOW" -ge "$T2_ETA" ]] || {
  echo "phase-b-closure: Wave 2 blocked — TL#2 not elapsed (treasury_execute_earliest_unix=${T2_ETA})" >&2
  exit 3
}

echo "== Wave 2 · Cert #8 spend execute + finalize =="
export HAT_R1_ALLOW_SPEND_EXECUTE=1
bash "$ROOT/scripts/dev/run-tt-governance-cert-08-treasury-spend.sh" \
  --try-chain --finalize --signer "$SIGNER"
unset HAT_R1_ALLOW_SPEND_EXECUTE 2>/dev/null || true

echo "TT_PHASE_B_EXECUTE_SPEND_CLOSURE: OK wave=2 finalize=1"
