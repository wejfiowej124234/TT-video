#!/usr/bin/env python3
"""Generate Cert #7 Execute walkthrough pack."""
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

CERT7_IDS = ["CHK-CORE-07", "CHK-FE-08", "CHK-SC-01", "CHK-SC-02", "CHK-DR-01"]
HAT_DIR = hat_r1_rel_path(ROOT, resolve_hat_r1_evid_dir(ROOT))

ROLES = [
    {
        "role": "timelock_executor",
        "label": "Timelock Executor (public)",
        "mtm_ids": ["CHK-CORE-07", "CHK-SC-02"],
        "verifications": [
            "queue_to_execute_chain",
            "execute_tx_receipt_events",
            "post_execute_state_5",
            "no_force_execute",
        ],
        "recording_hint": "execute(uint256) after EXECUTE_EARLIEST_UNIX · receipt + events",
        "screenshot": "screenshots/role-execute-tx-receipt.png",
    },
    {
        "role": "governor_lifecycle",
        "label": "Governor Queue→Execute",
        "mtm_ids": ["CHK-SC-01", "CHK-CORE-07"],
        "verifications": [
            "phase_a_proposal_vote_queue",
            "timelock_delay_48h",
            "state_migration_executed",
            "four_ledger_v2_tl_mapping",
        ],
        "recording_hint": "step-06 queue → step-07 execute · Governor state=Executed",
        "screenshot": "screenshots/role-governor-lifecycle.png",
    },
    {
        "role": "on_call_recovery",
        "label": "On-call · GORP §3.1",
        "mtm_ids": ["CHK-DR-01", "CHK-FE-08"],
        "verifications": [
            "too_early_wait_eta",
            "call_failed_eth_call",
            "timelock_anomaly_3_5",
            "execute_ui_readonly_until_elapsed",
        ],
        "recording_hint": "§3.1 failure triage · no Admin API · no FORCE_EXECUTE",
        "screenshot": "screenshots/role-execute-recovery.png",
    },
]


def load_mtm_rows() -> list[dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-governance-master-traceability-matrix.py"
    spec = importlib.util.spec_from_file_location("mtm", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    by_id = {r["id"]: r for r in mod.ROWS}
    return [by_id[cid] for cid in CERT7_IDS if cid in by_id]


def run_machine_checks(stamp: str) -> dict:
    cmd = [bash_exe(), str(ROOT / "scripts/dev/smoke-cert7-execute-machine-gates.sh")]
    p = subprocess.run(
        cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", env=os.environ.copy()
    )
    matrix_path = ROOT / "evidence/GO_ttg_cert/.cert7-matrix-checks.json"
    matrix = json.loads(matrix_path.read_text(encoding="utf-8")) if matrix_path.is_file() else {}
    return {
        "verdict": "PASS" if p.returncode == 0 else "FAIL",
        "exit_code": p.returncode,
        "stdout_tail": "\n".join(p.stdout.splitlines()[-10:]),
        "stderr_tail": "\n".join(p.stderr.splitlines()[-10:]),
        "execute_matrix": matrix,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--allow-prep-fail", action="store_true", help="write pack even if machine FAIL (prep only)")
    args = ap.parse_args()

    evid = ROOT / "evidence/GO_ttg_cert" / args.stamp
    ex_dir = evid / "phase-b/execute"
    if not evid.is_dir():
        raise SystemExit(f"gen-cert7: missing session {evid}")
    for sub in ("recordings", "screenshots", "machine-checks"):
        (ex_dir / sub).mkdir(parents=True, exist_ok=True)

    machine = run_machine_checks(args.stamp)
    (ex_dir / "machine-checks/CERT7-MACHINE-CHECKS.json").write_text(
        json.dumps(machine, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    flow_src = ROOT / "evidence/GO_ttg_cert/.cert7-execute-flow-map.json"
    if flow_src.is_file():
        (ex_dir / "EXECUTE-FLOW-MAP.v1.json").write_text(flow_src.read_text(encoding="utf-8"), encoding="utf-8")

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    pack = {
        "schema": "traveltrust.ttg-cert7-execute.v1",
        "program": "TT_GOVERNANCE_CERT_07_EXECUTE",
        "phase": "②",
        "stamp_utc": args.stamp,
        "cert_session": f"evidence/GO_ttg_cert/{args.stamp}",
        "baseline_ssot": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
        "hat_r1_execute_evidence": f"{HAT_DIR}/step-07-execute/",
        "hat_r1_queue_evidence": f"{HAT_DIR}/step-06-queue/",
        "four_ledger_evidence": "evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z",
        "gorp_ssot": "docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md",
        "mtm_ssot": "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md",
        "mtm_ids": CERT7_IDS,
        "target_tier": "OPS_DONE",
        "mtm_rows": [
            {"id": r["id"], "name": r.get("name", ""), "tier": r.get("tier", ""), "page": r.get("page", "")}
            for r in load_mtm_rows()
        ],
        "roles": ROLES,
        "machine_checks": machine,
        "prepared_at_utc": now,
        "forbidden": ["new features", "govfreeze re-audit", "ETA bypass", "HAT_R1_FORCE_EXECUTE"],
        "honest_boundary": "Cert #7 requires on-chain execute evidence ≠ Cert #8 Spend ≠ ③ GO",
    }
    (ex_dir / "CERT7-WALKTHROUGH-PACK.v1.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    manifest_path = evid / "SESSION-MANIFEST.json"
    manifest = (
        json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest_path.exists()
        else {"session_id": "GO_ttg_cert", "stamp_utc": args.stamp}
    )
    manifest["cert7_execute_pack"] = "phase-b/execute/CERT7-WALKTHROUGH-PACK.v1.json"
    manifest["cert7_machine_checks"] = machine["verdict"]
    manifest["next_step"] = "Cert #7 — phase-b/execute → PHASE-B-EXECUTE-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"TT_GOVERNANCE_CERT_07: PACK_OK machine={machine['verdict']}")
    if machine["verdict"] != "PASS" and not args.allow_prep_fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
