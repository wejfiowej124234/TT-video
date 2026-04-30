#!/usr/bin/env python3
import json
import os
import subprocess
from pathlib import Path


def main() -> None:
    out = Path(os.environ["OUT_DIR"])
    out.mkdir(parents=True, exist_ok=True)
    sha = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
    data = {
        "schema_version": "1",
        "kind": "traveltrust.production_gate_local_manifest.v1",
        "generated_at_utc": os.environ["TS"],
        "run_id": os.environ["RUN_ID"],
        "commit_sha": sha,
        "base_ref": os.environ["BASE_REF"],
        "skip_e2e": os.environ["SKIP_E2E"] == "1",
        "skip_api_tests": os.environ["SKIP_API_TESTS"] == "1",
        "local_smoke_gate": os.environ.get("GATE_LOCAL_SMOKE_STATUS", ""),
        "report_validate": os.environ.get("REPORT_VALIDATE_STATUS", ""),
        "production_gate_local": os.environ.get("PRODUCTION_GATE_LOCAL", ""),
        "chain_deferred_gate": os.environ.get("GATE_CHAIN_DEFERRED_STATUS", "NOT_RUN"),
        "gate_ssot": "gates/production_gate.yaml",
        "notes": "Local smoke: core production gate + chromium E2E excluding @e2e-sepolia-deferred. "
        "Chain deferred: run scripts/gates/run-production-gate-chain-deferred.sh separately.",
    }
    path = out / "MANIFEST.local.json"
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
    print("Wrote", path)


if __name__ == "__main__":
    main()
