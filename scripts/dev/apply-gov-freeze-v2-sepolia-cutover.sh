#!/usr/bin/env bash
# GovFreeze V2 Clean Baseline · Sepolia 切主（env + registry + frontend + API 读口）
#
#   bash scripts/dev/apply-gov-freeze-v2-sepolia-cutover.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID_APPEND=""
if [[ -f "$ROOT/evidence/GO_phase2_gov_freeze_v2_clean_baseline/latest-stamp.txt" ]]; then
  LSTAMP="$(tr -d '\r\n' < "$ROOT/evidence/GO_phase2_gov_freeze_v2_clean_baseline/latest-stamp.txt")"
  EVID_APPEND="$ROOT/evidence/GO_phase2_gov_freeze_v2_clean_baseline/${LSTAMP}/phase2-env-append-${LSTAMP}.env"
fi
if [[ -z "$EVID_APPEND" || ! -f "$EVID_APPEND" ]]; then
  EVID_APPEND="$(ls -t "$ROOT/evidence/GO_phase2_gov_freeze_v2_clean_baseline"/*/phase2-env-append-*.env 2>/dev/null | head -1 || true)"
fi
JURIS="$ROOT/config/jurisdiction_country_pool_net_profit.sepolia.json"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_gov_freeze_v2_clean_baseline/cutover/${STAMP}"
REGISTRY="$ROOT/registry/protocol-convergence-deployments.v1.yaml"

fail() { echo "apply-gov-freeze-v2-sepolia-cutover: FAIL $*" >&2; exit 2; }
ok() { echo "apply-gov-freeze-v2-sepolia-cutover: OK $*"; }

[[ -f "$EVID_APPEND" ]] || fail "missing $EVID_APPEND (run phase2-sepolia-broadcast-gov-freeze-v2-clean-baseline.sh first)"
[[ -f "$JURIS" ]] || fail "missing $JURIS"

mkdir -p "$EVID"

PY="python"
command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1 && PY="python3"

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
    "GOV_FREEZE_V2_TIMELOCK_ADDRESS",
    "GOV_FREEZE_V2_GOVERNOR_ADDRESS",
    "GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS",
    "GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS",
    "GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS",
    "GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS",
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

existing = parse_env(phase2)
gov_token = append.get("GOVERNANCE_TOKEN_ADDRESS") or existing.get("GOVERNANCE_TOKEN_ADDRESS") or "0xaC2E29AC7089e4863C21dAF232cF8bbb025d91ca"
legacy_ttg = append.get("LEGACY_GOVERNANCE_TOKEN_ADDRESS") or existing.get("LEGACY_GOVERNANCE_TOKEN_ADDRESS", "")
rpc = existing.get("CHAIN_RPC_URL") or "https://ethereum-sepolia-rpc.publicnode.com"

v2 = append["GOV_FREEZE_V2_TIMELOCK_ADDRESS"]
v2g = append["GOV_FREEZE_V2_GOVERNOR_ADDRESS"]
v2t = append["GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS"]
v2p = append["GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS"]
v2s = append["GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS"]
v2pool = append["GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS"]

cutover = {
    "GOV_FREEZE_V2_BASELINE_STAMP": stamp,
    "GOV_FREEZE_V2_BASELINE_ACTIVE": "1",
    "GOV_FREEZE_V1_BASELINE_ACTIVE": "0",
    "GOV_FREEZE_V2_TIMELOCK_ADDRESS": v2,
    "GOV_FREEZE_V2_GOVERNOR_ADDRESS": v2g,
    "GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS": v2t,
    "GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS": v2p,
    "GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS": v2s,
    "GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS": v2pool,
    "GOVERNOR_ADDRESS": v2g,
    "TIMELOCK_ADDRESS": v2,
    "GOVERNANCE_TIMELOCK_ADDRESS": v2,
    "TREASURY_P4_CAP_ADDRESS": v2t,
    "PRIMARY_MARKET_ADDRESS": v2p,
    "SEAT_REGISTRY_ADDRESS": v2s,
    "REGION_STEWARD_STAKE_POOL_ADDRESS": v2pool,
    "REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS": v2pool,
    "GOVERNANCE_TOKEN_ADDRESS": gov_token,
    "GOVERNANCE_VOTES_TOKEN_ADDRESS": gov_token,
    "STEWARD_TTG_ADDRESS": gov_token,
    "CHAIN_RPC_URL": rpc,
    "CHAIN_ID": "11155111",
}
if legacy_ttg and legacy_ttg.lower() != gov_token.lower():
    cutover["LEGACY_GOVERNANCE_TOKEN_ADDRESS"] = legacy_ttg
if net_ledger:
    cutover["COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS"] = net_ledger
    cutover["COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS"] = de.get("COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS", "")
    cutover["COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS"] = de.get("COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS", "")
    cutover["COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS"] = de.get("COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS", "")

frontend_public = {
    "NEXT_PUBLIC_CHAIN_ID": "11155111",
    "NEXT_PUBLIC_RPC_URL": rpc,
    "NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS": gov_token,
    "NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS": v2pool,
}

ARCHIVE_KEYS = [
    "GOVERNOR_ADDRESS", "TIMELOCK_ADDRESS", "REGION_STEWARD_STAKE_POOL_ADDRESS",
    "REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS", "TREASURY_P4_CAP_ADDRESS",
    "PRIMARY_MARKET_ADDRESS", "SEAT_REGISTRY_ADDRESS",
    "GOV_FREEZE_V1_TIMELOCK_ADDRESS", "GOV_FREEZE_V1_GOVERNOR_ADDRESS",
]

def upsert_env(path: pathlib.Path, updates: dict[str, str], legacy_prefix: str = "LEGACY_PRE_GOV_FREEZE_V2_") -> None:
    if not path.is_file():
        path.parent.mkdir(parents=True, exist_ok=True)
        lines: list[str] = []
        existing_local: dict[str, str] = {}
    else:
        shutil.copy2(path, evid / f"{path.name}.bak-{stamp}")
        raw = path.read_text(encoding="utf-8", errors="replace")
        lines = raw.splitlines()
        existing_local = parse_env(path)

    for k in ARCHIVE_KEYS:
        if k in existing_local and existing_local[k]:
            lk = f"{legacy_prefix}{k}"
            if lk not in updates and existing_local[k] not in updates.values():
                updates[lk] = existing_local[k]

    keys_set = set(updates.keys())
    filtered = []
    skip = False
    for line in lines:
        if line.strip().startswith("# --- GovFreeze V2 Clean Baseline"):
            skip = True
            continue
        if skip:
            if line.strip().startswith("# --- end GovFreeze V2"):
                skip = False
            continue
        if line.strip().startswith("# --- GovFreeze V1 Sepolia baseline"):
            skip = True
            continue
        key = line.split("#", 1)[0].strip()
        if key and "=" in key and key.split("=", 1)[0].strip() in keys_set:
            continue
        if not skip:
            filtered.append(line)

    block = [
        "",
        f"# --- GovFreeze V2 Clean Baseline ({stamp}) ---",
        "# SSOT: evidence/GO_phase2_gov_freeze_v2_clean_baseline/latest/",
    ]
    for k, v in sorted(updates.items()):
        block.append(f"{k}={v}")
    block.append("# --- end GovFreeze V2 ---")
    path.write_text("\n".join(filtered + block) + "\n", encoding="utf-8")

upsert_env(phase2, cutover)
upsert_env(root_env, cutover)
upsert_env(frontend_env, frontend_public, legacy_prefix="LEGACY_PRE_GOV_FREEZE_V2_NEXT_PUBLIC_")

reg_text = registry_path.read_text(encoding="utf-8")
shutil.copy2(registry_path, evid / "protocol-convergence-deployments.v1.yaml.bak")

v2_block = f"""
  gov_freeze_v2_clean_baseline:
    stamp: "{stamp}"
    evidence: evidence/GO_phase2_gov_freeze_v2_clean_baseline/latest/
    supersedes: gov_freeze_v1_baseline
    addresses:
      timelock_address: "{v2}"
      governor_address: "{v2g}"
      treasury_p4_cap_address: "{v2t}"
      primary_market_address: "{v2p}"
      seat_registry_address: "{v2s}"
      region_steward_stake_pool_proxy_address: "{v2pool}"
      governance_token_address: "{gov_token}"
      country_pool_net_profit_ledger_address: "{net_ledger or 'null'}"
    notes: |
      G24-CLEAN-BASELINE-01 · 全新 Timelock+Proxy · 10国 Stake init · allow×5 · ② Sepolia only
      TTG with approve/transferFrom when GOV_FREEZE_V2_DEPLOY_NEW_TTG=1
"""

if "gov_freeze_v2_clean_baseline:" not in reg_text:
    reg_text = reg_text.replace("  testnet_template:", v2_block + "  testnet_template:")

replacements = {
    'governor_address: "0xD972Bee4717218bD2314Eb542a671d8747336136"': f'governor_address: "{v2g}"',
    'timelock_address: "0x777E532636c53BDc034B9FE73c44E1B2c3113060"': f'timelock_address: "{v2}"',
    'region_steward_stake_pool_address: "0xeb0e4a8517EC478d6B386a13D28115357AA6d112"': f'region_steward_stake_pool_address: "{v2pool}"',
    'region_steward_stake_pool_proxy_address: "0xeb0e4a8517EC478d6B386a13D28115357AA6d112"': f'region_steward_stake_pool_proxy_address: "{v2pool}"',
}
for old, new in replacements.items():
    if old in reg_text:
        reg_text = reg_text.replace(old, new)

reg_text = re.sub(
    r'governance_token_address: "0x[a-fA-F0-9]{40}"',
    f'governance_token_address: "{gov_token}"',
    reg_text,
    count=1,
)

reg_text = re.sub(
    r'^updated: ".*"$',
    f'updated: "{datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}"',
    reg_text,
    count=1,
    flags=re.M,
)
registry_path.write_text(reg_text, encoding="utf-8")

report = {
    "stamp_utc": stamp,
    "verdict": "APPLIED",
    "baseline_id": "GOV-FREEZE-V2-CLEAN-BASELINE",
    "evidence_append": str(evid_append.relative_to(root)).replace("\\", "/"),
    "governor": v2g,
    "timelock": v2,
    "stake_pool": v2pool,
}
(evid / f"cutover-report-{stamp}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
PY

ok "cutover applied → $EVID/cutover-report-${STAMP}.json"
echo "TT_GOV_FREEZE_V2_SEPOLIA_CUTOVER: OK stamp=${STAMP}"
echo "Next: bash scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh"
