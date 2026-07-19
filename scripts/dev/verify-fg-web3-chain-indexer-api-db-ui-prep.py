#!/usr/bin/env python3
"""FG-13 Chain↔Indexer↔API↔DB↔UI consistency harness (WAIT_WINDOW prep).

Default: dry prep via gen-fg-web3-clean-deploy-prep-pack.py
Live probes refuse unless GOVERNANCE_RC_CLOSED=1 and TT_FG_VERIFY_LIVE=1.
Never broadcasts · never flips ACTIVE.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    live = os.environ.get("TT_FG_VERIFY_LIVE", "0") == "1"
    gov = os.environ.get("GOVERNANCE_RC_CLOSED", "0") == "1"
    if live and not gov:
        print("REFUSE_LIVE: GOVERNANCE_RC_CLOSED!=1 — WAIT_WINDOW dry only", file=sys.stderr)
        live = False

    # Always refresh prep pack + consistency JSON (idempotent, no broadcast)
    gen = ROOT / "scripts/dev/gen-fg-web3-clean-deploy-prep-pack.py"
    rc = subprocess.call([sys.executable, str(gen)], cwd=str(ROOT))
    out = (
        ROOT
        / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
        / "CHAIN-INDEXER-API-DB-UI-CONSISTENCY-PREP-LATEST.json"
    )
    if not out.exists():
        print("missing", out, file=sys.stderr)
        return 1
    data = json.loads(out.read_text(encoding="utf-8"))
    if live:
        data["mode"] = "POST_G_RC_LIVE_REQUESTED"
        data["note"] = (
            "Live equality still requires Clean Deploy address matrix + indexer rebind; "
            "this harness remains non-broadcasting."
        )
        out.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("wrote", out)
    print("verdict", data.get("verdict"))
    print("fg13", data.get("fg13_live_verdict"))
    print("broadcast_authorized", data.get("broadcast_authorized"))
    return 0 if rc == 0 and str(data.get("verdict", "")).startswith("PREP_READY") else max(rc, 1)


if __name__ == "__main__":
    raise SystemExit(main())
