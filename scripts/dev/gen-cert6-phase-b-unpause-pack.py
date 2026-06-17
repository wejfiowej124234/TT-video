#!/usr/bin/env python3
"""Generate Cert #6 Phase B unpause walkthrough pack."""
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
sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path, hat_r1_stamp
sys.path.insert(0, str(ROOT / "scripts/release"))
from win_bash import bash_exe  # noqa: E402

CERT6_IDS = ["CHK-OPS-11", "CHK-BASE-05", "CHK-CORE-04", "CHK-CORE-05", "CHK-CORE-06"]

ROLES = [
    {
        "role": "owner",
        "label": "Owner",
        "mtm_ids": ["CHK-OPS-11", "CHK-BASE-05"],
        "gorp_walk": ["GORP-07", "HAT_R1_PHASE_B_PAUSED=0", "Enterprise HAT L9 gate"],
        "verifications": [
            "unpause_env_export",
            "phase_a_to_b_handoff",
            "prerequisite_chain_cert1_5",
            "four_ledger_enterprise_hat",
        ],
        "recording_hint": "Owner unpause · UAT+Timelock readiness · export HAT_R1_PHASE_B_PAUSED=0",
        "screenshot": "screenshots/role-owner-unpause-gate.png",
    },
    {
        "role": "treasury_operator",
        "label": "Treasury Operator",
        "mtm_ids": ["CHK-OPS-11"],
        "gorp_walk": ["S-01～S-06", "dual Timelock §2.2", "Phase B prerequisites"],
        "verifications": [
            "eta_execute_earliest_unix",
            "v2_timelock_execute_path",
            "legacy_tl_cp_path_separate",
            "execute_spend_unstake_order",
        ],
        "recording_hint": "ETA wait · V2 Execute path · Legacy CP path 不混用",
        "screenshot": "screenshots/role-treasury-timelock-eta.png",
    },
    {
        "role": "governor_path",
        "label": "Governor / Phase A chain",
        "mtm_ids": ["CHK-CORE-04", "CHK-CORE-05", "CHK-CORE-06", "CHK-BASE-05"],
        "gorp_walk": ["proposal", "vote", "queue", "HAT-R1 Phase A evidence"],
        "verifications": [
            "proposal_create_tx",
            "vote_tx",
            "queue_tx_execute_earliest",
            "timelock_state_migration",
        ],
        "recording_hint": "Phase A proposal→vote→queue · EXECUTE_EARLIEST_UNIX · handoff to Phase B",
        "screenshot": "screenshots/role-governor-phase-a-handoff.png",
    },
]


def load_mtm_rows() -> list[dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-governance-master-traceability-matrix.py"
    spec = importlib.util.spec_from_file_location("mtm", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    by_id = {r["id"]: r for r in mod.ROWS}
    return [by_id[cid] for cid in CERT6_IDS if cid in by_id]


def run_machine_checks() -> dict:
    cmd = [bash_exe(), str(ROOT / "scripts/dev/smoke-cert6-phase-b-unpause-machine-gates.sh")]
    p = subprocess.run(
        cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", env=os.environ.copy()
    )
    matrix_path = ROOT / "evidence/GO_ttg_cert/.cert6-matrix-checks.json"
    matrix = json.loads(matrix_path.read_text(encoding="utf-8")) if matrix_path.is_file() else {}
    return {
        "verdict": "PASS" if p.returncode == 0 else "FAIL",
        "exit_code": p.returncode,
        "stdout_tail": "\n".join(p.stdout.splitlines()[-8:]),
        "stderr_tail": "\n".join(p.stderr.splitlines()[-8:]),
        "phase_b_matrix": matrix,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    args = ap.parse_args()

    evid = ROOT / "evidence/GO_ttg_cert" / args.stamp
    pb_dir = evid / "phase-b/unpause"
    if not evid.is_dir():
        raise SystemExit(f"gen-cert6: missing session {evid}")
    for sub in ("recordings", "screenshots", "machine-checks"):
        (pb_dir / sub).mkdir(parents=True, exist_ok=True)

    machine = run_machine_checks()
    (pb_dir / "machine-checks/CERT6-MACHINE-CHECKS.json").write_text(
        json.dumps(machine, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    flow_src = ROOT / "evidence/GO_ttg_cert/.cert6-phase-b-flow-map.json"
    if flow_src.is_file():
        (pb_dir / "PHASE-B-UNPAUSE-FLOW-MAP.v1.json").write_text(
            flow_src.read_text(encoding="utf-8"), encoding="utf-8"
        )

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    pack = {
        "schema": "traveltrust.ttg-cert6-phase-b-unpause.v1",
        "program": "TT_GOVERNANCE_CERT_06_PHASE_B_UNPAUSE",
        "phase": "②",
        "stamp_utc": args.stamp,
        "cert_session": f"evidence/GO_ttg_cert/{args.stamp}",
        "baseline_ssot": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
        "hat_r1_evidence": hat_r1_rel_path(ROOT, resolve_hat_r1_evid_dir(ROOT)),
        "gorp_ssot": "docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md",
        "mtm_ssot": "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md",
        "mtm_ids": CERT6_IDS,
        "target_tier": "OPS_DONE",
        "mtm_rows": [
            {"id": r["id"], "name": r.get("name", ""), "tier": r.get("tier", ""), "page": r.get("page", "")}
            for r in load_mtm_rows()
        ],
        "roles": ROLES,
        "machine_checks": machine,
        "prepared_at_utc": now,
        "forbidden": ["new features", "govfreeze re-audit", "docs/spec expansion"],
        "honest_boundary": "Cert #6 unpause walkthrough ≠ Execute/Spend/Unstake on-chain (Cert #7–9) ≠ ③ GO",
    }
    (pb_dir / "CERT6-WALKTHROUGH-PACK.v1.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    manifest_path = evid / "SESSION-MANIFEST.json"
    manifest = (
        json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest_path.exists()
        else {"session_id": "GO_ttg_cert", "stamp_utc": args.stamp}
    )
    manifest["cert6_unpause_pack"] = "phase-b/unpause/CERT6-WALKTHROUGH-PACK.v1.json"
    manifest["cert6_machine_checks"] = machine["verdict"]
    manifest["next_step"] = "Cert #6 — phase-b/unpause → PHASE-B-UNPAUSE-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"TT_GOVERNANCE_CERT_06: PACK_OK machine={machine['verdict']}")
    if machine["verdict"] != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
