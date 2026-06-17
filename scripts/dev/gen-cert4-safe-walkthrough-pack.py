#!/usr/bin/env python3
"""Generate Cert #4 Safe walkthrough pack (MTM 146 · GovFreeze V2 baseline evidence)."""
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

CERT4_IDS = ["CHK-CORE-17", "CHK-OPS-03", "CHK-ID-10", "CHK-SC-12"]

ROLES = [
    {
        "role": "safe_signer",
        "label": "Safe Signer",
        "pol": "POL-03",
        "mtm_ids": ["CHK-CORE-17", "CHK-ID-10"],
        "gorp_steps": ["S-04"],
        "routes": ["Safe UI · Sepolia chainId=11155111"],
        "verifications": ["multisig_n_of_m", "no_solo_schedule", "reject_unallowlisted_target"],
        "recording_hint": "S-04 · 收集 N-of-M 签名 · 保存 Safe tx hash",
        "screenshot": "screenshots/role-safe-signer-multisig.png",
    },
    {
        "role": "treasury_operator",
        "label": "Treasury Operator",
        "pol": "POL-01",
        "mtm_ids": ["CHK-OPS-03", "CHK-SC-12"],
        "gorp_steps": ["S-01", "S-02", "S-05", "S-06"],
        "routes": ["Safe → Legacy TL schedule", "DUAL-TIMELOCK-OPS-MATRIX"],
        "verifications": ["dual_tl_matrix", "schedule_execute_chain", "recovery_too_early", "reject_mixed_batch"],
        "recording_hint": "S-01～S-06 · RB-G-09 Legacy vs V2 · operationId + executeAfter",
        "screenshot": "screenshots/role-treasury-timelock-chain.png",
    },
    {
        "role": "finance_operator",
        "label": "Finance Operator",
        "pol": "POL-02",
        "mtm_ids": ["CHK-SC-12"],
        "gorp_steps": ["S-02", "S-03", "T-01", "T-02"],
        "routes": ["fundingSource EOA", "calldata hex review"],
        "verifications": ["no_timelock_key", "no_admin_post_spend", "reject_mixed_tl_batch", "recovery_call_failed"],
        "recording_hint": "Finance 复核 calldata · 禁 Admin POST · fundingSource 仅 approve",
        "screenshot": "screenshots/role-finance-boundaries.png",
    },
]


def load_mtm_rows() -> list[dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-governance-master-traceability-matrix.py"
    spec = importlib.util.spec_from_file_location("mtm", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    by_id = {r["id"]: r for r in mod.ROWS}
    return [by_id[cid] for cid in CERT4_IDS if cid in by_id]


def run_machine_checks() -> dict:
    cmd = [bash_exe(), str(ROOT / "scripts/dev/smoke-cert4-safe-walkthrough-machine-gates.sh")]
    p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", env=os.environ.copy())
    matrix_path = ROOT / "evidence/GO_ttg_cert/.cert4-matrix-checks.json"
    matrix = json.loads(matrix_path.read_text(encoding="utf-8")) if matrix_path.is_file() else {}
    dual = ROOT / "evidence/GO_ttg_cert/.cert4-dual-timelock-matrix.json"
    if dual.is_file():
        (ROOT / "evidence/GO_ttg_cert").mkdir(parents=True, exist_ok=True)
    return {
        "verdict": "PASS" if p.returncode == 0 else "FAIL",
        "exit_code": p.returncode,
        "stdout_tail": "\n".join(p.stdout.splitlines()[-8:]),
        "stderr_tail": "\n".join(p.stderr.splitlines()[-8:]),
        "three_role_matrix": matrix,
    }


def write_owner_checklist(evid_dir: Path, pack: dict) -> None:
    lines = [
        "# Cert #4 Safe Walkthrough · Owner Recording Checklist",
        "",
        f"**Program:** `TT_GOVERNANCE_CERT_04_SAFE_WALKTHROUGH`",
        f"**Baseline:** GovFreeze V2 · GORP-06 · RB-G-09",
        f"**Session:** `{pack['cert_session']}`",
        "",
        "## 三角色（Safe / Treasury / Finance · ② only）",
        "",
        "| # | 角色 | POL | GORP | 验证 |",
        "|---|------|-----|------|------|",
    ]
    for i, r in enumerate(ROLES, 1):
        steps = ", ".join(r["gorp_steps"][:3])
        ver = ", ".join(r["verifications"][:2])
        lines.append(f"| {i} | **{r['label']}** | {r['pol']} | {steps} | {ver} |")
    lines.extend(
        [
            "",
            "## Signoff",
            "",
            "```bash",
            f"bash scripts/dev/record-cert4-safe-walkthrough-signoff.sh \\",
            f"  --stamp {pack['stamp_utc']} --signer \"Sebastian Ward\"",
            "",
            f"bash scripts/dev/complete-ttg-cert-step.sh --cert 4 --stamp {pack['stamp_utc']} --signer \"Sebastian Ward\"",
            "```",
        ]
    )
    (evid_dir / "walkthrough/safe/CERT4-OWNER-RECORDING-CHECKLIST.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    args = ap.parse_args()

    evid = ROOT / "evidence/GO_ttg_cert" / args.stamp
    safe_dir = evid / "walkthrough/safe"
    if not evid.is_dir():
        raise SystemExit(f"gen-cert4: missing session {evid}")
    for sub in ("recordings", "screenshots", "machine-checks"):
        (safe_dir / sub).mkdir(parents=True, exist_ok=True)

    machine = run_machine_checks()
    (safe_dir / "machine-checks/CERT4-MACHINE-CHECKS.json").write_text(
        json.dumps(machine, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    dual_src = ROOT / "evidence/GO_ttg_cert/.cert4-dual-timelock-matrix.json"
    if dual_src.is_file():
        dual_dst = safe_dir / "DUAL-TIMELOCK-OPS-MATRIX.v1.json"
        dual_dst.write_text(dual_src.read_text(encoding="utf-8"), encoding="utf-8")

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    pack = {
        "schema": "traveltrust.ttg-cert4-safe-walkthrough.v1",
        "program": "TT_GOVERNANCE_CERT_04_SAFE_WALKTHROUGH",
        "phase": "②",
        "stamp_utc": args.stamp,
        "cert_session": f"evidence/GO_ttg_cert/{args.stamp}",
        "baseline_ssot": "docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md",
        "gorp_ssot": "docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md",
        "mtm_ssot": "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md",
        "mtm_ids": CERT4_IDS,
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
    (safe_dir / "CERT4-WALKTHROUGH-PACK.v1.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    write_owner_checklist(evid, pack)

    manifest_path = evid / "SESSION-MANIFEST.json"
    manifest = (
        json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest_path.exists()
        else {"session_id": "GO_ttg_cert", "stamp_utc": args.stamp}
    )
    manifest["cert4_walkthrough_pack"] = "walkthrough/safe/CERT4-WALKTHROUGH-PACK.v1.json"
    manifest["cert4_machine_checks"] = machine["verdict"]
    manifest["next_step"] = "Cert #4 — walkthrough/safe recordings → SAFE-WALKTHROUGH-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"TT_GOVERNANCE_CERT_04: PACK_OK machine={machine['verdict']}")
    if machine["verdict"] != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
