#!/usr/bin/env bash
# Storage-layout / upgrade-safety gate for V9_PRIMARY_MARKET_TREASURY_GOVERNED_CUTOVER
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/contracts"

fail() { echo "PM_TREASURY_LAYOUT: STOP $*" >&2; exit 2; }
ok() { echo "PM_TREASURY_LAYOUT: OK $*"; }

FOUNDRY_PROFILE=ttg_v9 forge build >/dev/null || fail "forge build"

TMP=$(mktemp -d)
FOUNDRY_PROFILE=ttg_v9 forge inspect TtgBatchPrimaryMarketPreTreasury storage-layout --json >"$TMP/pre.json"
FOUNDRY_PROFILE=ttg_v9 forge inspect TtgBatchPrimaryMarket storage-layout --json >"$TMP/new.json"

python - "$TMP/pre.json" "$TMP/new.json" <<'PY'
import json, sys, pathlib, re
pre = json.load(open(sys.argv[1], encoding="utf-8"))
new = json.load(open(sys.argv[2], encoding="utf-8"))

def rows(layout):
    if isinstance(layout, dict):
        return layout.get("storage", [])
    return layout

def key(r):
    return (str(r.get("slot")), int(r.get("offset", 0)), r.get("type", ""))

ps, ns = rows(pre), rows(new)
if len(ps) != len(ns):
    print(f"STOP entry count pre={len(ps)} new={len(ns)}", file=sys.stderr)
    sys.exit(2)
for i, (a, b) in enumerate(zip(ps, ns)):
    ka, kb = key(a), key(b)
    # Normalize self-contract type names
    def norm_type(t: str) -> str:
        import re
        t = t.replace("TtgBatchPrimaryMarketPreTreasury", "TtgBatchPrimaryMarket")
        # forge type ids embed unstable ast numbers: t_contract(Foo)514 → t_contract(Foo)
        t = re.sub(r"\)(\d+)$", ")", t)
        t = re.sub(r"(t_mapping\([^)]+\))(\d+)", r"\1", t)
        return t
    if ka[0] != kb[0] or ka[1] != kb[1] or norm_type(ka[2]) != norm_type(kb[2]):
        print(f"STOP drift at {i}: {a.get('label')} {ka} vs {b.get('label')} {kb}", file=sys.stderr)
        print(f"  norm {norm_type(ka[2])} vs {norm_type(kb[2])}", file=sys.stderr)
        sys.exit(2)

src = pathlib.Path("src/ttg-v9/TtgBatchPrimaryMarket.sol").read_text(encoding="utf-8")
forbidden = re.findall(
    r"^\s*(address|uint256|bool|mapping|ITtgV9Erc20|TtgPublicSaleVault)\s+(public|private|internal)\s+(\w+)",
    src,
    re.M,
)
allowed = {
    "usdc", "ttg", "usdcTreasury", "vault", "timelock", "guardian", "paused",
    "batches", "walletPurchasedTtg", "seededBatchCount", "__gap",
}
extra = [name for _, _, name in forbidden if name not in allowed]
if extra:
    print(f"STOP unexpected state vars: {extra}", file=sys.stderr)
    sys.exit(2)
if "function setUsdcTreasury" not in src:
    print("STOP missing setUsdcTreasury", file=sys.stderr)
    sys.exit(2)
print("storage_layout_match=true")
print("no_new_state_vars=true")
print(f"storage_entries={len(ps)}")
PY

ok "layout match + function-only setUsdcTreasury"
rm -rf "$TMP"
