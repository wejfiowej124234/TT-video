#!/usr/bin/env python
"""Force ACTIVE env keys to V311 matrix (first-wins dotenv safe). Fail if sink==Safe."""
from __future__ import annotations

import os
import pathlib
import re
import sys
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
APPEND = ROOT / "evidence/GO_phase2_v311_sepolia_clean_baseline/20260718T092622Z/phase2-env-append-20260718T092622Z.env"
SAFE = "0x7c018293396325077bb4d039930dcee11b7fb1cf"

if not APPEND.exists():
    print("FAIL missing V311 append", file=sys.stderr)
    sys.exit(2)

kv = {}
for line in APPEND.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    kv[k.strip()] = v.strip()

required = [
    "V311_TIMELOCK_ADDRESS",
    "V311_GOVERNOR_ADDRESS",
    "V311_TREASURY_P4_CAP_ADDRESS",
    "V311_PRIMARY_MARKET_ADDRESS",
    "V311_SEAT_REGISTRY_ADDRESS",
    "V311_STAKE_POOL_PROXY_ADDRESS",
    "GOVERNANCE_TOKEN_ADDRESS",
]
for k in required:
    if not kv.get(k):
        print(f"FAIL missing {k} in append", file=sys.stderr)
        sys.exit(2)

ttg = kv["GOVERNANCE_TOKEN_ADDRESS"]
tl = kv["V311_TIMELOCK_ADDRESS"]
gov = kv["V311_GOVERNOR_ADDRESS"]
p4 = kv["V311_TREASURY_P4_CAP_ADDRESS"]
pm = kv["V311_PRIMARY_MARKET_ADDRESS"]
seat = kv["V311_SEAT_REGISTRY_ADDRESS"]
stake = kv["V311_STAKE_POOL_PROXY_ADDRESS"]

if p4.lower() == SAFE or tl.lower() == SAFE and False:
    pass
if p4.lower() == SAFE:
    print("FAIL P4Cap equals Safe", file=sys.stderr)
    sys.exit(2)

ACTIVE = {
    "V311_SEPOLIA_CLEAN_BASELINE_ACTIVE": "1",
    "V311_SEPOLIA_CLEAN_BASELINE_STAMP": kv.get("V311_SEPOLIA_CLEAN_BASELINE_STAMP", "20260718T092622Z"),
    "GOV_FREEZE_V2_BASELINE_ACTIVE": "0",
    "GOVERNANCE_TOKEN_ADDRESS": ttg,
    "GOVERNANCE_VOTES_TOKEN_ADDRESS": ttg,
    "STEWARD_TTG_ADDRESS": ttg,
    "TIMELOCK_ADDRESS": tl,
    "GOVERNANCE_TIMELOCK_ADDRESS": tl,
    "GOVERNOR_ADDRESS": gov,
    "PRIMARY_MARKET_ADDRESS": pm,
    "TREASURY_USDC_SINK_ADDRESS": p4,
    "GOVERNANCE_TREASURY_P4CAP_ADDRESS": p4,
    "TREASURY_P4_CAP_ADDRESS": p4,
    "SEAT_REGISTRY_ADDRESS": seat,
    "REGION_STEWARD_STAKE_POOL_ADDRESS": stake,
    "REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS": stake,
    "V311_TIMELOCK_ADDRESS": tl,
    "V311_GOVERNOR_ADDRESS": gov,
    "V311_TREASURY_P4_CAP_ADDRESS": p4,
    "V311_PRIMARY_MARKET_ADDRESS": pm,
    "V311_SEAT_REGISTRY_ADDRESS": seat,
    "V311_STAKE_POOL_PROXY_ADDRESS": stake,
    "NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS": ttg,
    "NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS": stake,
}

# Keep historical V2 pointers under GOV_FREEZE_V2_* only (do not delete)
V2_LEGACY_KEEP_PREFIXES = ("GOV_FREEZE_V2_", "LEGACY_", "LEGACY_PRE_GOV_FREEZE_V2_", "LEGACY_QF01_")

ACTIVE_KEYS = set(ACTIVE.keys())


def rewrite(path: pathlib.Path) -> None:
    if not path.exists():
        return
    raw = path.read_text(encoding="utf-8", errors="replace")
    lines = raw.splitlines(True)
    out = []
    seen = set()
    for line in lines:
        if not line.strip() or line.lstrip().startswith("#") or "=" not in line:
            out.append(line)
            continue
        k = line.split("=", 1)[0].strip()
        if k in ACTIVE_KEYS:
            if k in seen:
                continue  # drop duplicate earlier/later
            out.append(f"{k}={ACTIVE[k]}\n")
            seen.add(k)
            continue
        out.append(line)
    # append missing ACTIVE keys at end
    missing = [k for k in ACTIVE if k not in seen]
    if missing:
        out.append(
            f"\n# === V311 FULL RUNTIME CUTOVER {datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')} ===\n"
        )
        for k in missing:
            out.append(f"{k}={ACTIVE[k]}\n")
            seen.add(k)
    path.write_text("".join(out), encoding="utf-8")
    print(f"rewrote {path.relative_to(ROOT)} active_keys={len(seen)}")


def first_value(path: pathlib.Path, key: str) -> str | None:
    if not path.exists():
        return None
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip()
    return None


for rel in (
    "scripts/dev/.env.phase2-chain-deploy.local",
    ".env",
    "frontend/.env.local",
):
    rewrite(ROOT / rel)

# verify first-wins matches V311
checks = [
    ("scripts/dev/.env.phase2-chain-deploy.local", "GOVERNANCE_TOKEN_ADDRESS", ttg),
    ("scripts/dev/.env.phase2-chain-deploy.local", "TIMELOCK_ADDRESS", tl),
    ("scripts/dev/.env.phase2-chain-deploy.local", "GOVERNANCE_TREASURY_P4CAP_ADDRESS", p4),
    ("scripts/dev/.env.phase2-chain-deploy.local", "TREASURY_USDC_SINK_ADDRESS", p4),
    ("scripts/dev/.env.phase2-chain-deploy.local", "PRIMARY_MARKET_ADDRESS", pm),
    ("scripts/dev/.env.phase2-chain-deploy.local", "REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS", stake),
    ("frontend/.env.local", "NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS", ttg),
    ("frontend/.env.local", "NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS", stake),
    (".env", "GOVERNANCE_TOKEN_ADDRESS", ttg),
    (".env", "TREASURY_P4_CAP_ADDRESS", p4),
]
fail = 0
for rel, key, exp in checks:
    got = first_value(ROOT / rel, key)
    if not got or got.lower() != exp.lower():
        print(f"FAIL first-wins {rel} {key} got={got} exp={exp}", file=sys.stderr)
        fail = 1
    if got and got.lower() == SAFE:
        print(f"FAIL {rel} {key} equals Safe", file=sys.stderr)
        fail = 1

if fail:
    sys.exit(2)
print("TT_V311_FULL_RUNTIME_CUTOVER: PASS")
