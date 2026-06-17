#!/usr/bin/env python3
"""Parse drill epoch params from CpNetProfitSepoliaCutoverAndDrill broadcast JSON."""
from __future__ import annotations

import json
import sys
from pathlib import Path

OPEN_SEL = "d47859c9"


def main() -> int:
    root = Path(__file__).resolve().parents[3]
    broadcast = root / "contracts/broadcast/CpNetProfitSepoliaCutoverAndDrill.s.sol/11155111/run-latest.json"
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "evidence/GO_tt_country_pool_revenue_enterprise_hat/cutover-drill/latest/drill-epoch-params.json"
    data = json.loads(broadcast.read_text(encoding="utf-8"))
    for tx in data.get("transactions", []):
        for container in (tx, tx.get("transaction") or {}):
            if not isinstance(container, dict):
                continue
            inp = str(container.get("input") or container.get("data") or "").lower().replace("0x", "")
            pos = inp.find(OPEN_SEL)
            if pos < 0:
                continue
            # openEpoch(uint256,uint64,uint64) · args after selector
            args = inp[pos + 8 : pos + 8 + 64 * 3]
            epoch_id = int(args[0:64], 16)
            epoch_start = int(args[64:128], 16)
            epoch_end = int(args[128:192], 16)
            body = {"epoch_id": epoch_id, "epoch_start": epoch_start, "epoch_end": epoch_end}
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(json.dumps(body, indent=2), encoding="utf-8")
            print(json.dumps(body))
            return 0
    print("FAIL: openEpoch not found in broadcast", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
