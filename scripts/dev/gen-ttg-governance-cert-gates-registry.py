#!/usr/bin/env python3
"""Generate registry/ttg-governance-cert-gates.v1.yaml from CERT_STEPS ledger SSOT."""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

RUNNER_BY_CERT = {
    2: "scripts/dev/run-tt-governance-cert-02-multi-identity-walkthrough.sh",
    3: "scripts/dev/run-tt-governance-cert-03-admin-walkthrough.sh",
    4: "scripts/dev/run-tt-governance-cert-04-safe-walkthrough.sh",
    5: "scripts/dev/run-tt-governance-cert-05-finance-walkthrough.sh",
    6: "scripts/dev/run-tt-governance-cert-06-phase-b-unpause.sh",
    7: "scripts/dev/run-tt-governance-cert-07-execute.sh",
    8: "scripts/dev/run-tt-governance-cert-08-treasury-spend.sh",
}


def load_cert_steps() -> dict[int, dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-cert-execution-ledger.py"
    spec = importlib.util.spec_from_file_location("ledger", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.CERT_STEPS  # type: ignore[attr-defined]


def main() -> int:
    try:
        import yaml  # type: ignore
    except ImportError:
        print("gen-ttg-governance-cert-gates: WARN PyYAML missing", file=sys.stderr)
        return 1

    steps = load_cert_steps()
    certs: dict[str, dict] = {}
    for n, meta in sorted(steps.items()):
        row: dict = {
            "name": meta["name"],
            "target_tier": meta["target_tier"],
            "evidence_subdir": meta["evidence_subdir"],
            "signoff_file": meta["signoff_file"],
            "mtm_ids": meta["ids"],
        }
        runner = RUNNER_BY_CERT.get(n)
        if runner and (ROOT / runner).is_file():
            row["runner"] = runner
        certs[str(n)] = row

    payload = {
        "schema": "traveltrust.ttg_governance_cert_gates_registry.v1",
        "phase": "② testnet",
        "ssot": "scripts/dev/gen-ttg-cert-execution-ledger.py CERT_STEPS",
        "path_triggers": [
            "contracts/src",
            "contracts/script",
            "docs/spec/governance-token",
            "registry/ttg-governance-cert-gates.v1.yaml",
            "scripts/dev/run-tt-governance-cert",
            "scripts/dev/gen-ttg-cert",
            "scripts/dev/gen-ttg-governance",
            "evidence/GO_ttg_cert",
        ],
        "certs": certs,
    }

    out = ROOT / "registry/ttg-governance-cert-gates.v1.yaml"
    out.write_text(
        yaml.safe_dump(payload, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )
    print(f"TTG_CERT_GATES_REGISTRY_GEN: OK path={out} certs={len(certs)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
