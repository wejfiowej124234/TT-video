#!/usr/bin/env bash
# Record GovFreeze V2 human screen acceptance signoff
#
#   bash scripts/dev/record-govfreeze-v2-human-screen-acceptance.sh \
#     --evidence-dir evidence/GO_govfreeze_v2_human_screen_acceptance/<stamp> \
#     --signer "Sebastian Ward"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID=""
SIGNER="${GOVFREEZE_V2_HUMAN_ACCEPT_SIGNER:-}"
for arg in "$@"; do
  case "$arg" in
    --evidence-dir) EVID="$2"; shift 2 ;;
    --signer) SIGNER="$2"; shift 2 ;;
    *) echo "unknown arg $arg" >&2; exit 2 ;;
  esac
done

[[ -n "$EVID" && -d "$ROOT/$EVID" ]] || { echo "record: --evidence-dir required" >&2; exit 2; }
[[ -n "$SIGNER" ]] || { echo "record: --signer required" >&2; exit 2; }

CP_STAMP="$(cat "$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/latest-stamp.txt" 2>/dev/null | tr -d '\r\n')"
STAMP="$(basename "$EVID")"

python <<PY
import json, pathlib, datetime
evid = pathlib.Path("$ROOT") / "$EVID"
cp_fl = json.loads(pathlib.Path("evidence/GO_tt_country_pool_revenue_enterprise_hat/$CP_STAMP/four-ledger-reconcile.json").read_text(encoding="utf-8"))
out = {
    "acceptance_id": "GOVFREEZE_V2_HUMAN_SCREEN_ACCEPTANCE",
    "stamp_utc": "$STAMP",
    "signer": "$SIGNER",
    "signed_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "economic_baseline": {
        "govfreeze_v2": True,
        "four_ledger_verdict": cp_fl.get("verdict"),
        "cp_revenue_evidence": "evidence/GO_tt_country_pool_revenue_enterprise_hat/$CP_STAMP",
    },
    "verdict": "PASS",
    "phase_b_unblock_requires": [
        "this signoff PASS",
        "export HAT_R1_PHASE_B_PAUSED=0",
        "Timelock elapsed",
        "run-hat-r1-phase-b-when-ready.sh",
    ],
    "honest_boundary": "② human screen acceptance ≠ ③ Production GO",
}
(evid / "HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
print("TT_GOVFREEZE_V2_HUMAN_SCREEN_ACCEPTANCE: PASS")
PY

echo "export GOVFREEZE_V2_HUMAN_SCREEN_ACCEPTANCE_OK=1"
