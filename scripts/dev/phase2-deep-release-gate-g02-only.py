#!/usr/bin/env python3
"""G02-only wrapper for local /meta contract validation during soak parallel window."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

import importlib.util

_gate_mod_path = ROOT / "scripts" / "dev" / "phase2-deep-release-gate.py"
_spec = importlib.util.spec_from_file_location("phase2_deep_release_gate", _gate_mod_path)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"cannot load {_gate_mod_path}")
_gate = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_gate)

allow_local = _gate.allow_local
is_localhost = _gate.is_localhost
norm_base = _gate.norm_base
run_gate_g02 = _gate.run_gate_g02
stamp = _gate.stamp
utc_now = _gate.utc_now


def main() -> int:
    ap = argparse.ArgumentParser(description="G02 /meta contract gate (local or staging)")
    ap.add_argument("--api-base", default=os.environ.get("STAGING_API_BASE", "http://127.0.0.1:8080"))
    ap.add_argument("--web-base", default=os.environ.get("STAGING_WEB_BASE", "http://localhost:3012"))
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()

    api = norm_base(args.api_base)
    web = norm_base(args.web_base)
    if (is_localhost(api) or is_localhost(web)) and not allow_local():
        print("TT_G02_META_CONTRACT_GATE: FAIL (set PHASE2_DEEP_GATE_ALLOW_LOCAL=1)", file=sys.stderr)
        return 2

    out_dir = args.out or Path(
        os.environ.get(
            "PHASE2_DEEP_GATE_OUT",
            str(ROOT / "evidence" / "GO_phase2_deploy_backlog" / "g02-meta-gate-local" / stamp()),
        )
    )
    out_dir.mkdir(parents=True, exist_ok=True)

    gate = run_gate_g02(api)
    report = {
        "schema": "traveltrust.g02_meta_contract_gate.v1",
        "generated_at": utc_now(),
        "api_base": api,
        "web_base": web,
        "gate": gate,
        "verdict": gate.get("verdict"),
    }
    (out_dir / "g02-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    if gate.get("verdict") == "PASS":
        print("TT_G02_META_CONTRACT_GATE: PASS")
        return 0
    print("TT_G02_META_CONTRACT_GATE: FAIL", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
