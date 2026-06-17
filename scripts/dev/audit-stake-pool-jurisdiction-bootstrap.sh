#!/usr/bin/env bash
# RegionStewardStakePool · 10 国 jurisdiction bootstrap 审计（SSOT: protocol-ssot.v1.yaml）
#
#   bash scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh
#   bash scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh --strict
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STRICT=0
for arg in "$@"; do
  [[ "$arg" == "--strict" ]] && STRICT=1
done

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
[[ -f "$ENV_FILE" ]] || { echo "audit-stake-pool-jurisdiction-bootstrap: FAIL missing $ENV_FILE" >&2; exit 2; }

# Caller override (V2 post-deploy verify) wins over stale .env pool address
CALLER_POOL="${AUDIT_POOL:-${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS:-${REGION_STEWARD_STAKE_POOL_ADDRESS:-}}}"

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"; line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  export "${line%%=*}=${line#*=}"
done < "$ENV_FILE"

POOL="${CALLER_POOL:-${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS:-${REGION_STEWARD_STAKE_POOL_ADDRESS:-}}}"
RPC="${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
[[ -n "$POOL" ]] || { echo "audit-stake-pool-jurisdiction-bootstrap: FAIL pool unset" >&2; exit 2; }
command -v cast >/dev/null 2>&1 || { echo "audit-stake-pool-jurisdiction-bootstrap: FAIL cast required" >&2; exit 2; }

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${STAKE_POOL_BOOTSTRAP_EVID:-$ROOT/evidence/GO_stake_pool_jurisdiction_bootstrap/${STAMP}}"
mkdir -p "$EVID"

export AUDIT_POOL="$POOL" AUDIT_RPC="$RPC" AUDIT_EVID="$EVID" AUDIT_STAMP="$STAMP" STRICT="$STRICT"
python <<'PY'
import json, os, subprocess
from pathlib import Path

pool = os.environ["AUDIT_POOL"]
rpc = os.environ["AUDIT_RPC"]
evid = Path(os.environ["AUDIT_EVID"])
stamp = os.environ["AUDIT_STAMP"]

expect = {
    "CN": 400, "US": 400, "FR": 450, "ES": 450, "JP": 250,
    "TH": 250, "SG": 200, "KR": 200, "AU": 150, "AE": 150,
}
gov04_cap = 25_000 * 10**18

def cast_call(sig, *args):
    cmd = ["cast", "call", pool, sig, *args, "--rpc-url", rpc]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return None
    return r.stdout.strip().split()[0]

def j_hex(j):
    return "0x" + j.encode("ascii").hex()

supply = cast_call("ttgTotalSupplyUnits()(uint256)") or "0"
boot_raw = cast_call("jurisdictionsBootstrapped()(bool)")
if boot_raw is None:
    boot_raw = "unknown"
owner = cast_call("owner()(address)") or ""

rows = []
failures = 0
mins = []
for j, exp_bps in expect.items():
    bps = int(cast_call("stewardStakeBps(bytes2)(uint256)", j_hex(j)) or 0)
    min_stake = int(cast_call("minStakeAmount(bytes2)(uint256)", j_hex(j)) or 0)
    ok = bps == exp_bps and min_stake > 0
    if not ok:
        failures += 1
    mins.append(min_stake)
    rows.append({
        "jurisdiction": j,
        "expected_bps": exp_bps,
        "on_chain_bps": bps,
        "min_stake_wei": str(min_stake),
        "status": "PASS" if ok else "FAIL",
    })

min_min = min(mins) if mins else 0
max_min = max(mins) if mins else 0
if max_min == 0:
    admission = "BOOTSTRAP_PENDING"
elif max_min <= gov04_cap:
    admission = "NO_CONFLICT"
elif min_min > gov04_cap:
    admission = "PRIMARY_MARKET_ALONE_INSUFFICIENT"
else:
    admission = "STRUCTURAL_TENSION"

verdict = "PASS" if failures == 0 else "FAIL"
report = {
    "audit_id": "STAKE_POOL_JURISDICTION_BOOTSTRAP",
    "stamp_utc": stamp,
    "pool": pool,
    "owner": owner,
    "ttg_total_supply_units": supply,
    "jurisdictions_bootstrapped": boot_raw.lower() == "true" if boot_raw not in ("unknown", None) else None,
    "jurisdictions": rows,
    "gov04_vs_seat_stake": {
        "gov04_per_wallet_cap_ttg_wei": str(gov04_cap),
        "min_stake_wei_range": [str(min_min), str(max_min)],
        "admission_class": admission,
        "product_read": (
            "GOV-04 caps Primary Market public sale per wallet; "
            "Seat min stake exceeds cap — Seat TTG must come from non-PM sources unless SSOT amended"
        ),
    },
    "failures": failures,
    "verdict": verdict,
}
out = evid / "stake-pool-jurisdiction-bootstrap-audit.json"
out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(f"STAKE_POOL_JURISDICTION_BOOTSTRAP_AUDIT: {verdict} failures={failures} evidence={evid}")
print(f"TT_STAKE_POOL_JURISDICTION_BOOTSTRAP: {verdict}")
raise SystemExit(0 if verdict == "PASS" else (2 if os.environ.get("STRICT", "0") == "1" else 1))
PY
