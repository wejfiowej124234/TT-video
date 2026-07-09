#!/usr/bin/env python3
"""Generate Cert #8 Treasury Spend walkthrough pack."""
from __future__ import annotations

import argparse
import datetime
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

import sys
from pathlib import Path as _Path
sys.path.insert(0, str(_Path(__file__).resolve().parent / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path, hat_r1_stamp
sys.path.insert(0, str(ROOT / "scripts/release"))
from win_bash import bash_exe  # noqa: E402

CERT8_IDS = ["CHK-CORE-08", "CHK-CORE-14", "CHK-FN-02", "CHK-SC-04"]
HAT_DIR = hat_r1_rel_path(ROOT, resolve_hat_r1_evid_dir(ROOT))


def load_mtm_rows() -> list[dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-governance-master-traceability-matrix.py"
    spec = importlib.util.spec_from_file_location("mtm", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    by_id = {r["id"]: r for r in mod.ROWS}
    return [by_id[cid] for cid in CERT8_IDS if cid in by_id]


def run_machine_checks(stamp: str) -> dict:
    cmd = [bash_exe(), str(ROOT / "scripts/dev/smoke-cert8-treasury-spend-machine-gates.sh")]
    p = subprocess.run(
        cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", env=os.environ.copy()
    )
    matrix_path = ROOT / "evidence/GO_ttg_cert/.cert8-matrix-checks.json"
    matrix = json.loads(matrix_path.read_text(encoding="utf-8")) if matrix_path.is_file() else {}
    return {
        "verdict": "PASS" if p.returncode == 0 else "FAIL",
        "exit_code": p.returncode,
        "treasury_matrix": matrix,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--allow-prep-fail", action="store_true")
    args = ap.parse_args()

    evid = ROOT / "evidence/GO_ttg_cert" / args.stamp
    ts_dir = evid / "phase-b/treasury-spend"
    for sub in ("recordings", "screenshots", "machine-checks"):
        (ts_dir / sub).mkdir(parents=True, exist_ok=True)

    machine = run_machine_checks(args.stamp)
    (ts_dir / "machine-checks/CERT8-MACHINE-CHECKS.json").write_text(
        json.dumps(machine, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    flow_src = ROOT / "evidence/GO_ttg_cert/.cert8-treasury-flow-map.json"
    if flow_src.is_file():
        (ts_dir / "TREASURY-SPEND-FLOW-MAP.v1.json").write_text(flow_src.read_text(encoding="utf-8"), encoding="utf-8")

    pack = {
        "schema": "traveltrust.ttg-cert8-treasury-spend.v1",
        "program": "TT_GOVERNANCE_CERT_08_TREASURY_SPEND",
        "phase": "②",
        "stamp_utc": args.stamp,
        "baseline_ssot": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
        "hat_r1_treasury_evidence": f"{HAT_DIR}/step-08-treasury-proposal/",
        "hat_r1_treasury_queue": f"{HAT_DIR}/step-09-treasury-queue/",
        "hat_r1_treasury_execute": f"{HAT_DIR}/step-10-treasury-execute/",
        "mtm_ids": CERT8_IDS,
        "mtm_rows": [{"id": r["id"], "name": r.get("name", ""), "tier": r.get("tier", "")} for r in load_mtm_rows()],
        "machine_checks": machine,
        "honest_boundary": "Cert #8 requires treasury spend execute after 2nd 48h Timelock ≠ ③ GO",
    }
    (ts_dir / "CERT8-WALKTHROUGH-PACK.v1.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"TT_GOVERNANCE_CERT_08: PACK_OK machine={machine['verdict']}")
    if machine["verdict"] != "PASS" and not args.allow_prep_fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
