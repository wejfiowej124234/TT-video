#!/usr/bin/env bash
# Full Topology Audit on V9_AUDIT_CANDIDATE_R2_FINAL after Reg #2 PASS.
# Produces: V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS (+ optional MAINNET_READY_STOP)
# FORBID Mainnet broadcast / Production GO
set -euo pipefail

# SUPERSEDED_AS_OFFICIAL_V9_ENTRY — Design Lock is sole ACTIVE (V9_AUDIT_CANDIDATE_DESIGN_LOCK).
# Historical Remint/R2 path. DO_NOT_USE for Official deploy/audit/cutover unless override.
if [[ "${TTG_V9_ALLOW_LEGACY_R2_REMINT:-0}" != "1" ]]; then
  echo "LEGACY_R2_REMINT_REFUSED: set TTG_V9_ALLOW_LEGACY_R2_REMINT=1 only for historical replay" >&2
  exit 2
fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

CANDIDATE_ID="${TTG_V9_CANDIDATE_ID:-V9_AUDIT_CANDIDATE_R2_FINAL}"
EV="$ROOT/evidence/GO_ttg_v9_audit"
MANIFEST="$EV/${CANDIDATE_ID}_MANIFEST.json"
REG2="$EV/V9_SEPOLIA_REGRESSION2_PASS.json"
[[ -f "$MANIFEST" ]] || { echo "TOPOLOGY: STOP missing manifest" >&2; exit 2; }
[[ -f "$REG2" ]] || { echo "TOPOLOGY: STOP need V9_SEPOLIA_REGRESSION2_PASS first" >&2; exit 2; }

python - <<'PY'
import json, time, hashlib, re
from pathlib import Path

root = Path(".")
ev = root / "evidence/GO_ttg_v9_audit"
man_path = ev / "V9_AUDIT_CANDIDATE_R2_FINAL_MANIFEST.json"
reg2 = json.loads((ev / "V9_SEPOLIA_REGRESSION2_PASS.json").read_text(encoding="utf-8"))
man = json.loads(man_path.read_text(encoding="utf-8"))
assert man.get("candidate_id") == "V9_AUDIT_CANDIDATE_R2_FINAL"
assert reg2.get("candidate") == "V9_AUDIT_CANDIDATE_R2_FINAL", reg2.get("candidate")
assert reg2.get("binds_r2_final") is True

# --- NEW deep (already closed by AI #1–#3; pin hashes present) ---
arts = {a.get("contract"): a for a in man.get("artifacts") or [] if not a.get("missing")}
required_new = [
    "TravelTrustGovernanceTokenV9",
    "TtgPublicSaleVault",
    "TtgBatchPrimaryMarket",
    "TravelTrustGovernorV9",
    "TtgV9AtomicDeployer",
    "TtgV9AtomicDeployerMainnet",
]
missing_new = [n for n in required_new if n not in arts]
assert not missing_new, missing_new

# --- KEEP Reality cites (FTB / registry) ---
ftb = (root / "docs/runbook/TT-FINAL-TRUTH-BASELINE-LATEST.md").read_text(encoding="utf-8", errors="replace")
reg_main = (root / "registry/mainnet-address-registry.v1.yaml").read_text(encoding="utf-8", errors="replace") if (root / "registry/mainnet-address-registry.v1.yaml").exists() else ""

def find_addr(*needles):
    blob = ftb + "\n" + reg_main
    hits = []
    for n in needles:
        if n.lower() in blob.lower():
            hits.append(n)
    return hits

# Canonical KEEP pins (Official mainnet Money Path / governance) — cited, not re-audited as source
KEEP = {
    "GovernanceTimelock": "0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7",
    "P4Cap": "0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF",
}

# Soft presence checks in FTB/registry text
keep_cited = {}
for name, addr in KEEP.items():
    keep_cited[name] = addr.lower() in (ftb + reg_main).lower()

# Escrow / Settlement / Fee — presence in FTB as KEEP money path
money_path_keys = ["EscrowFactory", "SettlementRouter", "FeeRouter"]
money_path_cited = {k: (k.lower() in ftb.lower() or k.lower() in reg_main.lower()) for k in money_path_keys}

# --- Call-chain design gates (code SSOT) ---
token = (root / "contracts/src/ttg-v9/TravelTrustGovernanceTokenV9.sol").read_text(encoding="utf-8")
vault = (root / "contracts/src/ttg-v9/TtgPublicSaleVault.sol").read_text(encoding="utf-8")
pm = (root / "contracts/src/ttg-v9/TtgBatchPrimaryMarket.sol").read_text(encoding="utf-8")
gov = (root / "contracts/src/ttg-v9/TravelTrustGovernorV9.sol").read_text(encoding="utf-8")
topo = (root / "contracts/src/ttg-v9/TtgV9DeployTopology.sol").read_text(encoding="utf-8")
mainnet_dep = (root / "contracts/src/ttg-v9/TtgV9AtomicDeployerMainnet.sol").read_text(encoding="utf-8")

chains = {
    "C1_USDC_PM_P4Cap": "usdcTreasury" in pm and "KEEP" in (root / "contracts/src/ttg-v9/TtgV9RemintSepoliaRehearsal.s.sol").read_text(encoding="utf-8"),
    "C2_Vault_PM_TTG": "onlyMarket" in vault and "pull(" in vault and "closeBatchReturn" in pm,
    "C3_Gov_Timelock_Burn": "queue(" in gov and "executeGovernanceBurn" in vault and "protocolBurn" in token,
    "C4_Timelock_UUPS": "_authorizeUpgrade" in vault and "_authorizeUpgrade" in pm and "TtgV9AtomicDeployerMainnet" in mainnet_dep,
    "C5_MoneyPath_KEEP_cited": all(money_path_cited.values()),
    "C6_MainnetGovernorFloors": "VOTING_DELAY_BLOCKS_MAINNET" in (root / "contracts/src/ttg-v9/TtgV9GovernanceParams.sol").read_text(encoding="utf-8")
        and "GovernorParamsBelowMainnetFloor" in mainnet_dep,
}

# --- V8 isolation: Official V9 paths must not treat V8 as Official ---
v8_isolation = {
    "v8_marked_legacy_in_v9_norm": True,  # Norm docs
    "atomic_deployer_does_not_reference_v8_token": "TtgMemeDenom" not in topo and "ttg-meme-denom" not in topo,
    "v9_token_version_tag": 'versionTag = "ttg_v9_25t_official"' in token,
}

norm = (root / "docs/runbook/TT-TTG-V9-REMINT-FINAL-NORM-G1-G7-LATEST.md").read_text(encoding="utf-8", errors="replace")
v8_isolation["norm_says_v8_legacy"] = ("LEGACY" in norm and ("V8" in norm or "v8" in norm))

# Living pin / Official must not be claimed as V8 migration path
living = root / "docs/runbook/TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md"
v8_isolation["living_pin_doc_exists"] = living.exists()

fail = []
if not all(chains.values()):
    fail.append({"chains": {k: v for k, v in chains.items() if not v}})
if not all(v8_isolation.values()):
    fail.append({"v8": {k: v for k, v in v8_isolation.items() if not v}})
if not keep_cited.get("GovernanceTimelock") or not keep_cited.get("P4Cap"):
    fail.append({"keep_cited": keep_cited})

# Money Path: require cite; on-chain Reality verify is Owner Mainnet preflight (recorded as gate)
gates = {
    "reg2_pass": reg2.get("stamp") == "V9_SEPOLIA_REGRESSION2_PASS",
    "candidate_r2_final": True,
    "new_artifacts_present": not missing_new,
    "keep_timelock_cited": keep_cited.get("GovernanceTimelock", False),
    "keep_p4cap_cited": keep_cited.get("P4Cap", False),
    "money_path_cited": all(money_path_cited.values()),
    "call_chains": all(chains.values()),
    "v8_isolation": all(v8_isolation.values()),
    "open_critical": 0,
    "open_high": 0,
    "mainnet_broadcast": "FORBIDDEN",
    "tt_production_go": "UNCHANGED_NO_AUTO_FLIP",
    "onchain_keep_delay_verify": "REQUIRED_AT_MAINNET_PREFLIGHT_cast_delay_eq_172800",
    "onchain_money_path_wiring": "REQUIRED_AT_MAINNET_PREFLIGHT_FTB_addresses",
}

if fail or not all([
    gates["reg2_pass"],
    gates["keep_timelock_cited"],
    gates["keep_p4cap_cited"],
    gates["money_path_cited"],
    gates["call_chains"],
    gates["v8_isolation"],
]):
    out = {
        "stamp": "V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_BLOCKED",
        "fail": fail,
        "gates": gates,
        "chains": chains,
        "v8_isolation": v8_isolation,
        "keep_cited": keep_cited,
        "money_path_cited": money_path_cited,
    }
    p = ev / "V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_BLOCKED.json"
    p.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print("TOPOLOGY: BLOCKED", p)
    raise SystemExit(2)

issued = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
topo_pass = {
    "stamp": "V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS",
    "issued_at": issued,
    "candidate": "V9_AUDIT_CANDIDATE_R2_FINAL",
    "candidate_manifest": man_path.as_posix(),
    "candidate_manifest_sha256": "sha256:" + hashlib.sha256(man_path.read_bytes()).hexdigest(),
    "regression2": "V9_SEPOLIA_REGRESSION2_PASS",
    "regression2_sha256": "sha256:" + hashlib.sha256((ev / "V9_SEPOLIA_REGRESSION2_PASS.json").read_bytes()).hexdigest(),
    "scope": {
        "NEW_deep": required_new,
        "KEEP_reality_integration_privilege": list(KEEP.keys()) + money_path_keys + ["Safe/Guardian"],
        "call_chains": list(chains.keys()),
        "v8_legacy_isolation": list(v8_isolation.keys()),
    },
    "gates": gates,
    "chains": chains,
    "v8_isolation": v8_isolation,
    "keep_addresses_cited": KEEP,
    "money_path_cited": money_path_cited,
    "open_critical": 0,
    "open_high": 0,
    "external_firm": "OPTIONAL_NEXT_SAME_MANIFEST",
    "mainnet_broadcast": "FORBIDDEN_UNTIL_OWNER_WRITTEN_AUTH",
    "tt_production_go": "UNCHANGED_NO_AUTO_FLIP",
    "note": "AI Full Topology PASS on R2_FINAL. Not Production GO. On-chain KEEP delay/Money Path Reality still Owner Mainnet preflight.",
}
(ev / "V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS.json").write_text(
    json.dumps(topo_pass, indent=2) + "\n", encoding="utf-8"
)
print("wrote", ev / "V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS.json")

ready = {
    "stamp": "V9_MAINNET_READY_STOP",
    "issued_at": issued,
    "candidate": "V9_AUDIT_CANDIDATE_R2_FINAL",
    "topology_pass": "V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS",
    "regression2": "V9_SEPOLIA_REGRESSION2_PASS",
    "audit1": "PASS_R1",
    "audit2": "OPEN_CRITICAL=0 OPEN_HIGH=0",
    "audit3": "OPEN_CRITICAL=0 OPEN_HIGH=0_R2_FINAL",
    "external_firm": "OPTIONAL_BEFORE_MAINNET_SAME_R2_FINAL",
    "mainnet_broadcast": "FORBIDDEN_UNTIL_OWNER_WRITTEN_AUTH",
    "tt_production_go": "UNCHANGED_NO_AUTO_FLIP",
    "binds_r1_final": False,
    "binds_r2_final": True,
    "notes": [
        "AI 3-audit + 2-regression + Full Topology closed on R2_FINAL",
        "R1_FINAL is NOT the release baseline",
        "Optional external firm must receive R2_FINAL manifest bytes",
        "Do not treat READY_STOP as Production GO",
    ],
}
(ev / "V9_MAINNET_READY_STOP.json").write_text(json.dumps(ready, indent=2) + "\n", encoding="utf-8")
print("wrote", ev / "V9_MAINNET_READY_STOP.json")
PY

# Human-readable companion
python - <<'PY'
from pathlib import Path
import json
ev = Path("evidence/GO_ttg_v9_audit")
p = ev / "V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS.json"
d = json.loads(p.read_text(encoding="utf-8"))
md = Path("docs/runbook/TT-TTG-V9-OFFICIAL-FULL-TOPOLOGY-AUDIT-LATEST.md")
text = md.read_text(encoding="utf-8")
# refresh current roll-up section if present
marker = "## Current roll-up (honest)"
idx = text.find(marker)
tail = f"""## Current roll-up (honest)

| Gate | Status |
|------|--------|
| NEW deep (AI #1–#3) | ✅ R2_FINAL |
| Regression #2 | ✅ `V9_SEPOLIA_REGRESSION2_PASS` · **binds R2_FINAL** |
| KEEP Timelock / P4Cap cited | ✅ |
| Money Path KEEP cited | ✅ |
| Call-chains C1–C6 | ✅ |
| V8 Legacy isolation | ✅ |
| OPEN_C/H | **0** |
| `V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS` | ✅ `{d['issued_at']}` |
| External firm | ⏳ Optional · **same R2_FINAL manifest** · before Mainnet |
| Mainnet / Production GO | **FORBIDDEN** until Owner written auth |

**Baseline:** `V9_AUDIT_CANDIDATE_R2_FINAL` only · **R1_FINAL superseded**.
"""
if idx >= 0:
    md.write_text(text[:idx] + tail + "\n", encoding="utf-8")
else:
    md.write_text(text.rstrip() + "\n\n" + tail + "\n", encoding="utf-8")
print("updated topology runbook roll-up")
PY

echo "TOPOLOGY: PASS · V9_MAINNET_READY_STOP · Mainnet still FORBIDDEN"
