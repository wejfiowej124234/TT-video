#!/usr/bin/env python3
"""Validate registry/ttg-governance-cert-gates.v1.yaml against gen-ttg-cert-execution-ledger CERT_STEPS."""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None


def load_cert_steps() -> dict[int, dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-cert-execution-ledger.py"
    spec = importlib.util.spec_from_file_location("ledger", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.CERT_STEPS  # type: ignore[attr-defined]


def main() -> None:
    reg_path = ROOT / "registry/ttg-governance-cert-gates.v1.yaml"
    if yaml is None:
        print("validate-ttg-cert-gates: WARN PyYAML missing — skip deep validate", file=sys.stderr)
        sys.exit(0)
    data = yaml.safe_load(reg_path.read_text(encoding="utf-8"))
    steps = load_cert_steps()
    certs = data.get("certs", {})
    fail = 0
    for n, meta in steps.items():
        key = str(n)
        if key not in certs:
            print(f"validate-ttg-cert-gates: FAIL missing cert {n} in registry", file=sys.stderr)
            fail += 1
            continue
        row = certs[key]
        for field in ("name", "target_tier", "evidence_subdir", "signoff_file"):
            if row.get(field) != meta.get(field):
                print(
                    f"validate-ttg-cert-gates: FAIL cert {n} {field} "
                    f"registry={row.get(field)!r} ledger={meta.get(field)!r}",
                    file=sys.stderr,
                )
                fail += 1
        reg_ids = row.get("mtm_ids") or []
        if sorted(reg_ids) != sorted(meta.get("ids") or []):
            print(f"validate-ttg-cert-gates: FAIL cert {n} mtm_ids mismatch", file=sys.stderr)
            fail += 1
        smoke = row.get("smoke")
        if smoke and not (ROOT / smoke).is_file():
            print(f"validate-ttg-cert-gates: FAIL cert {n} missing smoke script {smoke}", file=sys.stderr)
            fail += 1
        runner = row.get("runner")
        if runner and not (ROOT / runner).is_file():
            print(f"validate-ttg-cert-gates: FAIL cert {n} missing runner {runner}", file=sys.stderr)
            fail += 1
    if fail:
        sys.exit(1)
    print(f"TTG_CERT_GATES_REGISTRY: OK certs={len(steps)}")


if __name__ == "__main__":
    main()
