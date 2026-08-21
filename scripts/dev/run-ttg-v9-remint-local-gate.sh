#!/usr/bin/env bash
# ① TTG V9 Remint local gate: forge + English-only + no public burn/mint selectors.
# NOT Sepolia. NOT Mainnet. NOT Production GO.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}/contracts"

echo "== V9 remint forge =="
FOUNDRY_PROFILE=ttg_v9 forge test

echo "== English-only / no CJK in src/ttg-v9 =="
if rg -n --pcre2 '[\x{4e00}-\x{9fff}]' src/ttg-v9; then
  echo "FAIL: CJK found in contracts/src/ttg-v9" >&2
  exit 1
fi
echo "OK: no CJK"

echo "== ABI: no mint / no public burn on TravelTrustGovernanceTokenV9 =="
FOUNDRY_PROFILE=ttg_v9 forge build >/dev/null
ABI="out-ttg-v9/TravelTrustGovernanceTokenV9.sol/TravelTrustGovernanceTokenV9.json"
python - <<'PY'
import json, sys
from pathlib import Path
abi = json.loads(Path("out-ttg-v9/TravelTrustGovernanceTokenV9.sol/TravelTrustGovernanceTokenV9.json").read_text(encoding="utf-8"))["abi"]
names = {x.get("name") for x in abi if x.get("type") == "function"}
bad = []
if "mint" in names:
    bad.append("mint")
if "burn" in names:
    bad.append("burn")
if "protocolBurn" not in names:
    bad.append("missing protocolBurn")
if "MAX_SUPPLY" not in names:
    # constant may appear as function in ABI
    pass
if bad:
    print("FAIL ABI:", bad, file=sys.stderr)
    sys.exit(1)
print("OK ABI: protocolBurn present; mint/burn absent; functions=", sorted(n for n in names if n))
PY

echo "== solc floor (profile pin >= 0.8.36) =="
grep -q 'solc_version = "0.8.36"' foundry.toml || grep -Eq 'solc_version = "0\.8\.(3[6-9]|[4-9][0-9])"' foundry.toml
echo "OK: foundry ttg_v9 solc floor"

echo "TT_V9_REMINT_LOCAL_GATE: PASS"
