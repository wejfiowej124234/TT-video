#!/usr/bin/env bash
# Record GovFreeze V2 + TTG Tokenomics baseline FREEZE (② · maintenance-only boundary)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_gov_freeze_v2_clean_baseline/freeze/${STAMP}"
mkdir -p "$EVID"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '\r')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

bash "$ROOT/scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh" >>"$EVID/freeze-gate.log" 2>&1

HAT_EVID="$(hat_r1_resolve_evid_dir "$ROOT")"
EXEC_ETA="$(cat "$HAT_EVID/EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null || echo "")"

export GOV_FREEZE_V2_FREEZE_EVID="$EVID"
export GOV_FREEZE_V2_FREEZE_STAMP="$STAMP"
export GOV_FREEZE_V2_HAT_EVID="$HAT_EVID"
export GOV_FREEZE_V2_EXEC_ETA="$EXEC_ETA"
python <<'PY'
import json, os, pathlib
evid = pathlib.Path(os.environ["GOV_FREEZE_V2_FREEZE_EVID"])
evid.mkdir(parents=True, exist_ok=True)
doc = {
    "freeze_id": "GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE",
    "frozen_at_utc": os.environ["GOV_FREEZE_V2_FREEZE_STAMP"],
    "phase": "② Sepolia",
    "ssot": ["TTG-TOKENOMICS-FREEZE-V1", "GOV-FREEZE-V2-CLEAN-BASELINE"],
    "active_addresses": {
        "ttg": os.environ.get("GOVERNANCE_TOKEN_ADDRESS", ""),
        "governor": os.environ.get("GOVERNOR_ADDRESS", ""),
        "timelock": os.environ.get("TIMELOCK_ADDRESS", ""),
        "primary_market": os.environ.get("PRIMARY_MARKET_ADDRESS", ""),
        "stake_pool": os.environ.get("REGION_STEWARD_STAKE_POOL_ADDRESS") or os.environ.get("GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS", ""),
        "seat_registry": os.environ.get("SEAT_REGISTRY_ADDRESS", ""),
        "treasury_p4": os.environ.get("TREASURY_P4_CAP_ADDRESS") or os.environ.get("GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS", ""),
    },
    "legacy_read_only": {
        "ttg": os.environ.get("LEGACY_GOVERNANCE_TOKEN_ADDRESS", ""),
        "note": "LEGACY_PRE_GOVFREEZE_V2_* — no rollback, no patches",
    },
    "change_boundary": {
        "allowed": ["bugfix", "evidence", "i18n", "a11y", "HAT-R1 Phase B after Timelock", "concentration audit"],
        "forbidden": ["new governance features", "GOV-01～04 parameter changes", "redeploy baseline", "legacy stack reactivation"],
    },
    "hat_r1": {
        "phase_a_evidence": os.environ.get("GOV_FREEZE_V2_HAT_EVID", ""),
        "phase_a_verdict": "PASS",
        "phase_b_execute_earliest_unix": os.environ.get("GOV_FREEZE_V2_EXEC_ETA", ""),
        "phase_b_status": "WAIT_TIMelock_48h",
    },
    "honest_boundary": "② freeze ≠ ③ Production GO",
}
(evid / "BASELINE-FREEZE.json").write_text(json.dumps(doc, indent=2), encoding="utf-8")
print("GOV_FREEZE_V2_BASELINE_FREEZE: OK", evid)
PY

echo "$STAMP" >"$ROOT/evidence/GO_phase2_gov_freeze_v2_clean_baseline/freeze/latest-stamp.txt"
echo "TT_GOV_FREEZE_V2_BASELINE_FREEZE: RECORDED stamp=$STAMP"
