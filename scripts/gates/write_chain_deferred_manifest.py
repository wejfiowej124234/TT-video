#!/usr/bin/env python3
"""Write MANIFEST.chain-deferred.json for the deferred E2E gate."""
from __future__ import annotations

import json
import os
from pathlib import Path


def main() -> None:
    path = Path(os.environ["CHAIN_DEFERRED_MANIFEST_PATH"])
    path.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "schema_version": "1",
        "kind": "traveltrust.production_gate_chain_deferred.v1",
        "generated_at_utc": os.environ["TS"],
        "run_id": os.environ["RUN_ID"],
        "result": os.environ["RES"],
        "grep": "@e2e-sepolia-deferred",
        "notes": "Run separately from local smoke; requires CHAIN_RPC_URL and local Postgres.",
    }
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print("Wrote", path)


if __name__ == "__main__":
    main()
