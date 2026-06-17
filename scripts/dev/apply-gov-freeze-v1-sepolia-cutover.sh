#!/usr/bin/env bash
# GovFreeze V1 · Sepolia 切主（env + registry + frontend · 唯一链上治理基线）
#
#   bash scripts/dev/apply-gov-freeze-v1-sepolia-cutover.sh
#
# SSOT 地址: evidence/GO_phase2_gov_freeze_v1_sepolia/latest/phase2-env-append-*.env
# 诚实边界: ② Sepolia · FundStack 地址保留 · 治理读面切 GovFreeze V1 Proxy
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID_APPEND="$(ls -t "$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/latest"/phase2-env-append-*.env 2>/dev/null | head -1 || true)"
JURIS="$ROOT/config/jurisdiction_country_pool_net_profit.sepolia.json"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/cutover/${STAMP}"
REGISTRY="$ROOT/registry/protocol-convergence-deployments.v1.yaml"

fail() { echo "apply-gov-freeze-v1-sepolia-cutover: FAIL $*" >&2; exit 2; }
ok() { echo "apply-gov-freeze-v1-sepolia-cutover: OK $*"; }

[[ -f "$EVID_APPEND" ]] || fail "missing evidence append $EVID_APPEND (run phase2-sepolia-broadcast-gov-freeze-v1 first)"
[[ -f "$JURIS" ]] || fail "missing $JURIS"

mkdir -p "$EVID"

PY="python"
if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
  PY="python3"
fi

export ROOT EVID_APPEND JURIS EVID REGISTRY STAMP
$PY <<'PY'
import json, os, pathlib, re, shutil
from datetime import datetime, timezone

root = pathlib.Path(os.environ["ROOT"])
evid_append = pathlib.Path(os.environ["EVID_APPEND"])
juris_path = pathlib.Path(os.environ["JURIS"])
evid = pathlib.Path(os.environ["EVID"])
registry_path = pathlib.Path(os.environ["REGISTRY"])
stamp = os.environ["STAMP"]

def parse_env(path: pathlib.Path) -> dict[str, str]:
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

append = parse_env(evid_append)
required = [
    "GOV_FREEZE_V1_TIMELOCK_ADDRESS",
    "GOV_FREEZE_V1_GOVERNOR_ADDRESS",
    "TREASURY_P4_CAP_ADDRESS",
    "PRIMARY_MARKET_ADDRESS",
    "SEAT_REGISTRY_ADDRESS",
    "REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS",
]
for k in required:
    if not append.get(k):
        raise SystemExit(f"missing {k} in {evid_append}")

juris = json.loads(juris_path.read_text(encoding="utf-8"))
de = next((e for e in juris.get("entries", []) if e.get("jurisdiction") == "DE"), {})
net_ledger = de.get("COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS", "")

phase2 = root / "scripts/dev/.env.phase2-chain-deploy.local"
root_env = root / ".env"
frontend_env = root / "frontend/.env.local"

# GovFreeze V1 canonical mapping (治理唯一基线)
gov_token = append.get("GOVERNANCE_TOKEN_ADDRESS") or parse_env(phase2).get("GOVERNANCE_TOKEN_ADDRESS") or "0xaC2E29AC7089e4863C21dAF232cF8bbb025d91ca"
rpc = parse_env(phase2).get("CHAIN_RPC_URL") or "https://ethereum-sepolia-rpc.publicnode.com"

cutover = {
    "GOV_FREEZE_V1_BASELINE_STAMP": stamp,
    "GOV_FREEZE_V1_BASELINE_ACTIVE": "1",
    "GOV_FREEZE_V1_TIMELOCK_ADDRESS": append["GOV_FREEZE_V1_TIMELOCK_ADDRESS"],
    "GOV_FREEZE_V1_GOVERNOR_ADDRESS": append["GOV_FREEZE_V1_GOVERNOR_ADDRESS"],
    "TREASURY_P4_CAP_ADDRESS": append["TREASURY_P4_CAP_ADDRESS"],
    "PRIMARY_MARKET_ADDRESS": append["PRIMARY_MARKET_ADDRESS"],
    "SEAT_REGISTRY_ADDRESS": append["SEAT_REGISTRY_ADDRESS"],
    "REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS": append["REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS"],
    # API / indexer 主键 → GovFreeze Proxy
    "GOVERNOR_ADDRESS": append["GOV_FREEZE_V1_GOVERNOR_ADDRESS"],
    "TIMELOCK_ADDRESS": append["GOV_FREEZE_V1_TIMELOCK_ADDRESS"],
    "GOVERNANCE_TIMELOCK_ADDRESS": append["GOV_FREEZE_V1_TIMELOCK_ADDRESS"],
    "REGION_STEWARD_STAKE_POOL_ADDRESS": append["REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS"],
    "GOVERNANCE_TOKEN_ADDRESS": gov_token,
    "GOVERNANCE_VOTES_TOKEN_ADDRESS": gov_token,
    "CHAIN_RPC_URL": rpc,
    "CHAIN_ID": "11155111",
}
if net_ledger:
    cutover["COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS"] = net_ledger
    cutover["COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS"] = de.get("COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS", "")
    cutover["COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS"] = de.get("COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS", "")
    cutover["COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS"] = de.get("COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS", "")

frontend_public = {
    "NEXT_PUBLIC_CHAIN_ID": "11155111",
    "NEXT_PUBLIC_RPC_URL": rpc,
    "NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS": gov_token,
    "NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS": append["REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS"],
}

LEGACY_KEYS = [
    "GOVERNOR_ADDRESS", "TIMELOCK_ADDRESS", "REGION_STEWARD_STAKE_POOL_ADDRESS",
    "GOVERNANCE_TOKEN_ADDRESS", "CHAIN_RPC_URL", "CHAIN_ID",
]

def upsert_env(path: pathlib.Path, updates: dict[str, str], legacy_prefix: str = "LEGACY_PRE_GOV_FREEZE_V1_") -> None:
    if not path.is_file():
        path.parent.mkdir(parents=True, exist_ok=True)
        lines: list[str] = []
        existing: dict[str, str] = {}
    else:
        shutil.copy2(path, evid / f"{path.name}.bak-{stamp}")
        raw = path.read_text(encoding="utf-8", errors="replace")
        lines = raw.splitlines()
        existing = parse_env(path)

    for k in LEGACY_KEYS:
        if k in existing and k not in updates and existing[k]:
            lk = f"{legacy_prefix}{k}"
            if lk not in existing:
                updates[lk] = existing[k]

    # remove old keys from lines, append block
    keys_set = set(updates.keys())
    filtered = []
    skip_block = False
    for line in lines:
        if line.strip().startswith("# --- GovFreeze V1 Sepolia baseline"):
            skip_block = True
            continue
        if skip_block:
            if line.strip().startswith("# --- end GovFreeze V1"):
                skip_block = False
            continue
        key = line.split("#", 1)[0].strip()
        if key and "=" in key and key.split("=", 1)[0].strip() in keys_set:
            continue
        filtered.append(line)

    block = [
        "",
        f"# --- GovFreeze V1 Sepolia baseline ({stamp}) ---",
        "# SSOT: evidence/GO_phase2_gov_freeze_v1_sepolia/latest/",
    ]
    for k, v in sorted(updates.items()):
        block.append(f"{k}={v}")
    block.append("# --- end GovFreeze V1 ---")
    path.write_text("\n".join(filtered + block) + "\n", encoding="utf-8")

upsert_env(phase2, cutover)
upsert_env(root_env, cutover)
upsert_env(frontend_env, frontend_public, legacy_prefix="LEGACY_PRE_GOV_FREEZE_V1_NEXT_PUBLIC_")

# registry patch: add gov_freeze_v1 + update sepolia primary governance keys
reg_text = registry_path.read_text(encoding="utf-8")
shutil.copy2(registry_path, evid / "protocol-convergence-deployments.v1.yaml.bak")

gov_block = f"""
  gov_freeze_v1_baseline:
    stamp: "{stamp}"
    evidence: evidence/GO_phase2_gov_freeze_v1_sepolia/latest/
    addresses:
      timelock_address: "{append['GOV_FREEZE_V1_TIMELOCK_ADDRESS']}"
      governor_address: "{append['GOV_FREEZE_V1_GOVERNOR_ADDRESS']}"
      treasury_p4_cap_address: "{append['TREASURY_P4_CAP_ADDRESS']}"
      primary_market_address: "{append['PRIMARY_MARKET_ADDRESS']}"
      seat_registry_address: "{append['SEAT_REGISTRY_ADDRESS']}"
      region_steward_stake_pool_proxy_address: "{append['REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS']}"
      country_pool_net_profit_ledger_address: "{net_ledger or 'null'}"
    notes: |
      治理唯一链上基线 · GOV-01～04 Proxy · admin=Timelock · ② Sepolia only
"""

if "gov_freeze_v1_baseline:" not in reg_text:
    reg_text = reg_text.replace(
        "  testnet_template:",
        gov_block + "  testnet_template:",
    )

replacements = {
    'governor_address: "0xa79c8df5C225825f6d04a497043dB0F1995B55ae"': f'governor_address: "{append["GOV_FREEZE_V1_GOVERNOR_ADDRESS"]}"',
    'timelock_address: "0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f"': f'timelock_address: "{append["GOV_FREEZE_V1_TIMELOCK_ADDRESS"]}"',
    'region_steward_stake_pool_address: "0x16F914f3D50f7Aa02665589e715F94CA3b7Ab47c"': f'region_steward_stake_pool_address: "{append["REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS"]}"',
}
for old, new in replacements.items():
    reg_text = reg_text.replace(old, new)

reg_text = re.sub(r'^updated: ".*"$', f'updated: "{datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}"', reg_text, count=1, flags=re.M)
registry_path.write_text(reg_text, encoding="utf-8")

report = {
    "stamp_utc": stamp,
    "verdict": "APPLIED",
    "evidence_append": str(evid_append.relative_to(root)).replace("\\", "/"),
    "cutover_keys": list(cutover.keys()),
    "governor_proxy": append["GOV_FREEZE_V1_GOVERNOR_ADDRESS"],
    "timelock": append["GOV_FREEZE_V1_TIMELOCK_ADDRESS"],
}
(evid / f"cutover-report-{stamp}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
PY

ok "cutover applied → $EVID/cutover-report-${STAMP}.json"
echo "TT_GOV_FREEZE_V1_SEPOLIA_CUTOVER: OK stamp=${STAMP}"
echo "Next: bash scripts/dev/run-gov-freeze-v1-sepolia-hat-full-chain.sh"
