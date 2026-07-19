#!/usr/bin/env python
"""Apply V311 Sepolia clean cutover to registry + env (no secrets printed)."""
from __future__ import annotations

import os
import pathlib
import re
import shutil
import sys
from datetime import datetime, timezone

root = pathlib.Path(os.environ["ROOT"])
reg = pathlib.Path(os.environ["REGISTRY"])
matrix = pathlib.Path(os.environ["MATRIX"])
evid = pathlib.Path(os.environ["EVID"])
stamp = os.environ["STAMP"]
evid_append = pathlib.Path(os.environ["EVID_APPEND"])

addrs = {
    "timelock_address": os.environ["V311_TIMELOCK_ADDRESS"].lower(),
    "governor_address": os.environ["V311_GOVERNOR_ADDRESS"].lower(),
    "treasury_p4_cap_address": os.environ["V311_TREASURY_P4_CAP_ADDRESS"].lower(),
    "primary_market_address": os.environ["V311_PRIMARY_MARKET_ADDRESS"].lower(),
    "seat_registry_address": (os.environ.get("V311_SEAT_REGISTRY_ADDRESS") or "").lower(),
    "stake_pool_proxy_address": os.environ["V311_STAKE_POOL_PROXY_ADDRESS"].lower(),
    "governance_token_address": os.environ["GOVERNANCE_TOKEN_ADDRESS"].lower(),
}
sink = addrs["treasury_p4_cap_address"]
if (os.environ.get("TREASURY_USDC_SINK_ADDRESS") or "").lower() != sink:
    print("FAIL: TREASURY_USDC_SINK_ADDRESS must equal P4Cap", file=sys.stderr)
    sys.exit(2)

block = f"""  v311_sepolia_clean_baseline:
    status: ACTIVE
    chain_id: 11155111
    network: sepolia
    path: CLEAN_SEPOLIA_REDEPLOY
    economic_ssot: docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md
    stamp: "{os.environ.get('V311_SEPOLIA_CLEAN_BASELINE_STAMP', stamp)}"
    cutover_stamp: "{stamp}"
    addresses:
      timelock_address: "{addrs['timelock_address']}"
      governor_address: "{addrs['governor_address']}"
      treasury_p4_cap_address: "{addrs['treasury_p4_cap_address']}"
      primary_market_address: "{addrs['primary_market_address']}"
      seat_registry_address: "{addrs['seat_registry_address']}"
      stake_pool_proxy_address: "{addrs['stake_pool_proxy_address']}"
      governance_token_address: "{addrs['governance_token_address']}"
      usdc_sink_address: "{sink}"
    notes: "sink==P4Cap enforced · Full Alignment required before gap CLOSED"
"""

text = reg.read_text(encoding="utf-8")
text = re.sub(
    r"^active_deploy_baseline:\s*\S+",
    "active_deploy_baseline: v311_sepolia_clean_baseline",
    text,
    count=1,
    flags=re.M,
)

# Mark v2 superseded without duplicating status lines
if "gov_freeze_v2_clean_baseline:" in text:
    # ensure status LEGACY_SUPERSEDED near the key
    def _mark_v2(m: re.Match[str]) -> str:
        chunk = m.group(0)
        if "superseded_by: v311_sepolia_clean_baseline" in chunk:
            return chunk
        # insert after the key line
        lines = chunk.splitlines(True)
        insert = (
            "    status: LEGACY_SUPERSEDED\n"
            "    superseded_by: v311_sepolia_clean_baseline\n"
            "    # historical Evidence retained — do not delete\n"
        )
        # drop prior status: ACTIVE if present in first 8 lines
        out = [lines[0]]
        for ln in lines[1:]:
            if re.match(r"^\s+status:\s*", ln):
                continue
            if re.match(r"^\s+superseded_by:\s*", ln):
                continue
            out.append(ln)
        return out[0] + insert + "".join(out[1:])

    text = re.sub(
        r"  gov_freeze_v2_clean_baseline:.*?(?=\n  [a-z0-9_]+:|\n[a-z_]+:|\Z)",
        _mark_v2,
        text,
        count=1,
        flags=re.S,
    )

if "v311_sepolia_clean_baseline:" in text:
    text = re.sub(
        r"  v311_sepolia_clean_baseline:.*?(?=\n  [a-z0-9_]+:|\n[a-z_]+:|\Z)",
        block.rstrip() + "\n",
        text,
        count=1,
        flags=re.S,
    )
else:
    if "environments:" not in text:
        print("FAIL: no environments:", file=sys.stderr)
        sys.exit(2)
    text = text.replace("environments:", "environments:\n" + block, 1)

# header comment
text = text.replace(
    "ACTIVE 地址权威（写死 · D-REG-SEPOLIA-ENV-DUAL）：environments.gov_freeze_v2_clean_baseline",
    "ACTIVE 地址权威（写死）：environments.v311_sepolia_clean_baseline（CLEAN_SEPOLIA_REDEPLOY）",
)

reg.write_text(text, encoding="utf-8")

mt = matrix.read_text(encoding="utf-8")
mt = mt.replace("baseline: gov_freeze_v2_clean_baseline", "baseline: v311_sepolia_clean_baseline")
mt = mt.replace(
    "active_addresses: registry/protocol-convergence-deployments.v1.yaml#gov_freeze_v2_clean_baseline",
    "active_addresses: registry/protocol-convergence-deployments.v1.yaml#v311_sepolia_clean_baseline",
)
mt = mt.replace(
    "# Address authority remains protocol-convergence-deployments → gov_freeze_v2_clean_baseline.",
    "# Address authority: protocol-convergence-deployments → v311_sepolia_clean_baseline.",
)
matrix.write_text(mt, encoding="utf-8")

for rel in ("scripts/dev/.env.phase2-chain-deploy.local", ".env", "frontend/.env.local"):
    path = root / rel
    if not path.exists():
        continue
    bak = evid / (path.name.replace(".", "_") + f".pre-v311-{stamp}.bak")
    shutil.copy2(path, bak)
    body = path.read_text(encoding="utf-8", errors="replace")
    marker = "# === V311_SEPOLIA_CLEAN_BASELINE CUTOVER"
    chunk = "\n" + marker + f" {stamp} ===\n" + evid_append.read_text(encoding="utf-8") + "\n"
    if "V311_SEPOLIA_CLEAN_BASELINE_ACTIVE=1" in body:
        body2, n = re.subn(
            r"\n# === V311_SEPOLIA_CLEAN_BASELINE CUTOVER[\s\S]*?(?=\n# ===|\Z)",
            chunk,
            body,
            count=1,
        )
        body = body2 if n else body.rstrip() + chunk
    else:
        body = body.rstrip() + chunk
    # demote v2 active flag if present
    body = body.replace("GOV_FREEZE_V2_BASELINE_ACTIVE=1", "GOV_FREEZE_V2_BASELINE_ACTIVE=0")
    path.write_text(body, encoding="utf-8")

(evid / "CUTOVER-NOTE.md").write_text(
    f"""# V311 Clean Sepolia Cutover

**Stamp:** {stamp}
**ACTIVE:** v311_sepolia_clean_baseline
**gov_freeze_v2_clean_baseline:** LEGACY_SUPERSEDED (Evidence retained)
**Gaps:** remain OPEN until Full Alignment PASS
**Recorded:** {datetime.now(timezone.utc).isoformat()}
""",
    encoding="utf-8",
)
print("apply-v311-sepolia-clean-cutover: registry+matrix+env OK")
