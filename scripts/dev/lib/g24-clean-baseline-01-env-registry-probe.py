#!/usr/bin/env python3
"""G24-CLEAN-BASELINE-01 · env / registry / frontend cutover pollution probe."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(os.environ.get("G24_CB_ROOT", ".")).resolve()
EVID = Path(os.environ["G24_CB_EVID"])


def parse_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.split("#", 1)[0].strip()
        if not line or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def load_yaml_addresses() -> dict:
    reg = ROOT / "registry/protocol-convergence-deployments.v1.yaml"
    if not reg.is_file():
        return {}
    text = reg.read_text(encoding="utf-8")
    out: dict[str, str] = {}

    def grab(block: str, key: str) -> str:
        m = re.search(rf"^\s+{re.escape(key)}:\s*\"(0x[a-fA-F0-9]{{40}})\"", block, re.M)
        return m.group(1) if m else ""

    sepolia = re.search(r"^\s+sepolia:\n(.*?)(?=^\s+\w|\Z)", text, re.M | re.S)
    gf = re.search(r"^\s+gov_freeze_v1_baseline:\n(.*?)(?=^\s+testnet_template|\Z)", text, re.M | re.S)
    if sepolia:
        b = sepolia.group(1)
        out["registry_sepolia_governor"] = grab(b, "governor_address")
        out["registry_sepolia_timelock"] = grab(b, "timelock_address")
        out["registry_sepolia_stake_pool"] = grab(b, "region_steward_stake_pool_address")
    if gf:
        b = gf.group(1)
        out["registry_govfreeze_governor"] = grab(b, "governor_address")
        out["registry_govfreeze_timelock"] = grab(b, "timelock_address")
        out["registry_govfreeze_stake_pool"] = grab(b, "region_steward_stake_pool_proxy_address")
    return out


phase2 = parse_env(ROOT / "scripts/dev/.env.phase2-chain-deploy.local")
frontend = parse_env(ROOT / "frontend/.env.local")
reg = load_yaml_addresses()

findings: list[dict] = []

pairs = [
    ("GOVERNOR_ADDRESS", "GOV_FREEZE_V2_GOVERNOR_ADDRESS"),
    ("TIMELOCK_ADDRESS", "GOV_FREEZE_V2_TIMELOCK_ADDRESS"),
    ("REGION_STEWARD_STAKE_POOL_ADDRESS", "GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS"),
    ("PRIMARY_MARKET_ADDRESS", "GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS"),
    ("SEAT_REGISTRY_ADDRESS", "GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS"),
    ("TREASURY_P4_CAP_ADDRESS", "GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS"),
]
for a, b in pairs:
    va, vb = phase2.get(a, ""), phase2.get(b, "")
    if va and vb and va.lower() != vb.lower():
        findings.append({"id": "CB-10", "severity": "P0", "title": f"env dual keys mismatch {a} vs {b}", "detail": {a: va, b: vb}})

if phase2.get("GOV_FREEZE_V2_BASELINE_ACTIVE") != "1":
    findings.append({"id": "CB-11", "severity": "P0", "title": "GOV_FREEZE_V2_BASELINE_ACTIVE unset", "detail": phase2.get("GOV_FREEZE_V2_BASELINE_ACTIVE")})
elif phase2.get("GOV_FREEZE_V1_BASELINE_ACTIVE") == "1":
    findings.append({"id": "CB-11b", "severity": "P0", "title": "GOV_FREEZE_V1_BASELINE still active", "detail": "must deactivate V1 after V2 cutover"})

legacy_hits = [k for k in phase2 if k.startswith("LEGACY_PRE_GOV_FREEZE_V1_")]
if not legacy_hits:
    findings.append({
        "id": "CB-12",
        "severity": "P2",
        "title": "无 LEGACY_PRE_GOV_FREEZE_V1_* 归档键",
        "detail": "切主未保留旧栈地址旁证 · 回滚/对拍困难",
    })

gov = phase2.get("GOVERNOR_ADDRESS", "")
if reg.get("registry_sepolia_governor") and gov and reg["registry_sepolia_governor"].lower() != gov.lower():
    findings.append({"id": "CB-13", "severity": "P1", "title": "registry.sepolia.governor != env", "detail": reg})

pool_env = phase2.get("GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS", phase2.get("REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS", phase2.get("REGION_STEWARD_STAKE_POOL_ADDRESS", "")))
fe_pool = frontend.get("NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS", "")
if pool_env and fe_pool and pool_env.lower() != fe_pool.lower():
    findings.append({"id": "CB-14", "severity": "P0", "title": "frontend stake pool != backend env", "detail": {"env": pool_env, "frontend": fe_pool}})

# Old pre-gov-freeze addresses known from cutover replacements (still in FundStack block)
OLD_GOVERNOR = "0xa79c8df5C225825f6d04a497043dB0F1995B55ae"
OLD_TIMELOCK = "0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f"
OLD_POOL = "0x16F914f3D50f7Aa02665589e715F94CA3b7Ab47c"
for label, old, cur in [
    ("governor", OLD_GOVERNOR, gov),
    ("timelock", OLD_TIMELOCK, phase2.get("TIMELOCK_ADDRESS", "")),
    ("stake_pool", OLD_POOL, pool_env),
]:
    if cur and cur.lower() == old.lower():
        findings.append({"id": "CB-15", "severity": "P0", "title": f"仍指向 pre-GovFreeze 旧 {label}", "detail": old})
    if old in json.dumps(phase2):
        findings.append({"id": "CB-16", "severity": "P2", "title": f"env 仍含旧 {label} 字面量", "detail": old})

deploy_order_pollution = False
reg_text = (ROOT / "registry/protocol-convergence-deployments.v1.yaml").read_text(encoding="utf-8", errors="replace")
if "DeployGovernanceStack.s.sol" in reg_text and "DeployGovFreezeV1Stack" not in reg_text:
    deploy_order_pollution = True
    findings.append({
        "id": "CB-17",
        "severity": "P1",
        "title": "registry deploy_order 仍为 pre-GovFreeze 脚本序列",
        "detail": "DeployGovernanceStack · 未登记 DeployGovFreezeV1Stack / V2 Clean",
    })

report = {
    "probe_id": "G24-CLEAN-BASELINE-01-ENV-REGISTRY",
    "phase2_keys_sample": {k: phase2[k] for k in sorted(phase2) if "GOV" in k or "STAKE" in k or "TIMELOCK" in k or "PRIMARY" in k or "SEAT" in k or "TREASURY_P4" in k},
    "frontend_public": {k: frontend[k] for k in frontend if k.startswith("NEXT_PUBLIC_") and ("GOV" in k or "STAKE" in k or "CHAIN" in k)},
    "registry_addresses": reg,
    "legacy_key_count": len(legacy_hits),
    "legacy_keys": legacy_hits[:20],
    "findings": findings,
    "finding_count": len(findings),
}
EVID.mkdir(parents=True, exist_ok=True)
out = EVID / "env-registry-probe.json"
out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"wrote": str(out), "findings": len(findings)}, indent=2))
