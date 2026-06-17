#!/usr/bin/env python3
"""Generate Cert #5 Finance walkthrough pack."""
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
sys.path.insert(0, str(ROOT / "scripts/release"))
from win_bash import bash_exe  # noqa: E402

CERT5_IDS = ["CHK-CORE-15", "CHK-OPS-02", "CHK-ID-09", "CHK-FN-11"]

ROLES = [
    {
        "role": "finance_operator",
        "label": "Finance Operator",
        "pol": "POL-02",
        "mtm_ids": ["CHK-CORE-15", "CHK-OPS-02", "CHK-ID-09", "CHK-FN-11"],
        "gorp_walk": ["W-F1", "W-F2", "W-F3", "W-F4", "W-F5"],
        "verifications": [
            "fundingSource_custody",
            "country_pool_accrual",
            "four_ledger_reconcile",
            "distribution_ledger_read",
            "fee_router_orthogonal_4555",
        ],
        "recording_hint": "W-F · open→split · four-ledger PASS · fundingSource 仅 EOA",
        "screenshot": "screenshots/role-finance-four-ledger.png",
    },
    {
        "role": "treasury_operator",
        "label": "Treasury Operator",
        "pol": "POL-01 handoff",
        "mtm_ids": ["CHK-OPS-02"],
        "gorp_walk": ["T-02", "S-06", "splitNetProfit batch"],
        "verifications": [
            "legacy_tl_split_batch",
            "treasury_accounting_handoff",
            "receipt_archive",
            "no_funding_source_custody",
        ],
        "recording_hint": "split batch · globalTreasury=V2 TL · post-split four-ledger trigger",
        "screenshot": "screenshots/role-treasury-split-accounting.png",
    },
    {
        "role": "auditor",
        "label": "Auditor",
        "pol": "read-only trace",
        "mtm_ids": [],
        "gorp_walk": ["four-ledger read", "§3.6 triage read"],
        "verifications": [
            "audit_trail_readonly",
            "no_funding_write",
            "no_tl_schedule",
            "distribution_accrual_trace",
        ],
        "recording_hint": "只读 four-ledger · distribution accrual trace · 异常分诊认知",
        "screenshot": "screenshots/role-auditor-traceability.png",
    },
]


def load_mtm_rows() -> list[dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-governance-master-traceability-matrix.py"
    spec = importlib.util.spec_from_file_location("mtm", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    by_id = {r["id"]: r for r in mod.ROWS}
    return [by_id[cid] for cid in CERT5_IDS if cid in by_id]


def run_machine_checks() -> dict:
    cmd = [bash_exe(), str(ROOT / "scripts/dev/smoke-cert5-finance-walkthrough-machine-gates.sh")]
    p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", env=os.environ.copy())
    matrix_path = ROOT / "evidence/GO_ttg_cert/.cert5-matrix-checks.json"
    matrix = json.loads(matrix_path.read_text(encoding="utf-8")) if matrix_path.is_file() else {}
    return {
        "verdict": "PASS" if p.returncode == 0 else "FAIL",
        "exit_code": p.returncode,
        "stdout_tail": "\n".join(p.stdout.splitlines()[-8:]),
        "stderr_tail": "\n".join(p.stderr.splitlines()[-8:]),
        "three_role_matrix": matrix,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    args = ap.parse_args()

    evid = ROOT / "evidence/GO_ttg_cert" / args.stamp
    fin_dir = evid / "walkthrough/finance"
    if not evid.is_dir():
        raise SystemExit(f"gen-cert5: missing session {evid}")
    for sub in ("recordings", "screenshots", "machine-checks"):
        (fin_dir / sub).mkdir(parents=True, exist_ok=True)

    machine = run_machine_checks()
    (fin_dir / "machine-checks/CERT5-MACHINE-CHECKS.json").write_text(
        json.dumps(machine, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    flow_src = ROOT / "evidence/GO_ttg_cert/.cert5-finance-flow-map.json"
    if flow_src.is_file():
        (fin_dir / "FINANCE-OPS-FLOW-MAP.v1.json").write_text(
            flow_src.read_text(encoding="utf-8"), encoding="utf-8"
        )

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    pack = {
        "schema": "traveltrust.ttg-cert5-finance-walkthrough.v1",
        "program": "TT_GOVERNANCE_CERT_05_FINANCE_WALKTHROUGH",
        "phase": "②",
        "stamp_utc": args.stamp,
        "cert_session": f"evidence/GO_ttg_cert/{args.stamp}",
        "baseline_ssot": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
        "four_ledger_evidence": "evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z",
        "cutover_evidence": "evidence/GO_tt_country_pool_revenue_enterprise_hat/cutover-drill/20260616T082259Z",
        "gorp_ssot": "docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md",
        "mtm_ssot": "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md",
        "mtm_ids": CERT5_IDS,
        "target_tier": "OPS_DONE",
        "mtm_rows": [
            {"id": r["id"], "name": r.get("name", ""), "tier": r.get("tier", ""), "page": r.get("page", "")}
            for r in load_mtm_rows()
        ],
        "roles": ROLES,
        "machine_checks": machine,
        "prepared_at_utc": now,
        "forbidden": ["new features", "govfreeze re-audit", "docs/spec expansion"],
    }
    (fin_dir / "CERT5-WALKTHROUGH-PACK.v1.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    manifest_path = evid / "SESSION-MANIFEST.json"
    manifest = (
        json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest_path.exists()
        else {"session_id": "GO_ttg_cert", "stamp_utc": args.stamp}
    )
    manifest["cert5_walkthrough_pack"] = "walkthrough/finance/CERT5-WALKTHROUGH-PACK.v1.json"
    manifest["cert5_machine_checks"] = machine["verdict"]
    manifest["next_step"] = "Cert #5 — walkthrough/finance → FINANCE-WALKTHROUGH-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"TT_GOVERNANCE_CERT_05: PACK_OK machine={machine['verdict']}")
    if machine["verdict"] != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
