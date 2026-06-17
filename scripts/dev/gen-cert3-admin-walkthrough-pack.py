#!/usr/bin/env python3
"""Generate Cert #3 Admin walkthrough pack (MTM 146 SSOT · RBAC-GAP-LIST=0)."""
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

CERT3_IDS = [
    "CHK-CORE-03",
    "CHK-CORE-24",
    "CHK-FE-14",
    "CHK-ADM-01",
    "CHK-ADM-02",
    "CHK-ADM-03",
    "CHK-ADM-04",
    "CHK-ADM-05",
    "CHK-ADM-06",
    "CHK-ADM-07",
]

ROLES = [
    {
        "role": "super_admin",
        "console_role_70": "SuperAdmin",
        "label": "Admin (SuperAdmin)",
        "mtm_ids": ["CHK-CORE-03", "CHK-CORE-24", "CHK-ADM-01", "CHK-ADM-02"],
        "uat_ref": "C1",
        "routes": ["/admin", "/admin/approvals", "/admin/governance/execution-uat"],
        "recording_hint": "C1 · 全卡片可见 · 审批可读 · Treasury 禁写 · 无链上 spend",
        "screenshot": "screenshots/role-superadmin-c1.png",
        "verifications": ["page_visibility", "approvals_allow", "treasury_no_write"],
    },
    {
        "role": "finance",
        "console_role_70": "Finance",
        "label": "Finance",
        "mtm_ids": ["CHK-ADM-05"],
        "uat_ref": "C1",
        "routes": ["/admin/finance", "/admin/fee-router", "/admin/region-vault"],
        "recording_hint": "C1 · Finance 读路径 · 无 publish · 无 approvals",
        "screenshot": "screenshots/role-finance-read.png",
        "verifications": ["finance_read_allow", "approvals_deny", "publish_deny"],
    },
    {
        "role": "risk",
        "console_role_70": "Risk",
        "label": "Risk",
        "mtm_ids": ["CHK-ADM-07", "CHK-ADM-04"],
        "uat_ref": "C2",
        "routes": ["/admin/community/reports", "/admin/community/moderation/cases"],
        "recording_hint": "C2 · 社区治理 moderate · 无 finance · 无 approvals",
        "screenshot": "screenshots/role-risk-community.png",
        "verifications": ["community_governance_allow", "finance_deny", "approvals_deny"],
    },
    {
        "role": "ops",
        "console_role_70": "Ops",
        "label": "Ops",
        "mtm_ids": ["CHK-ADM-06", "CHK-FE-14"],
        "uat_ref": "C1",
        "routes": ["/admin/onboarding", "/admin/users"],
        "recording_hint": "C1 · Ops onboarding · RBAC SoD · 无 approvals",
        "screenshot": "screenshots/role-ops-onboarding.png",
        "verifications": ["onboarding_allow", "approvals_deny", "sod_banner"],
    },
    {
        "role": "auditor",
        "console_role_70": "Auditor",
        "label": "Auditor",
        "mtm_ids": ["CHK-ADM-01", "CHK-CORE-24"],
        "uat_ref": "C2",
        "routes": ["/admin/audit", "/admin/audit/operations", "/admin/auth-audit-events"],
        "recording_hint": "C2 · 审计只读 · 无 community moderate · 无 approvals",
        "screenshot": "screenshots/role-auditor-readonly.png",
        "verifications": ["audit_readonly", "community_moderate_deny", "approvals_deny"],
    },
]


def load_mtm_rows() -> list[dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-governance-master-traceability-matrix.py"
    spec = importlib.util.spec_from_file_location("mtm", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    by_id = {r["id"]: r for r in mod.ROWS}
    return [by_id[cid] for cid in CERT3_IDS if cid in by_id]


def load_rbac_gap_stamp() -> dict:
    stamp_path = ROOT / "evidence/GO_admin_rbac_alignment/latest-stamp.txt"
    if not stamp_path.is_file():
        return {"ok": False, "reason": "missing latest-stamp"}
    stamp = stamp_path.read_text(encoding="utf-8").strip()
    gap_path = ROOT / "evidence/GO_admin_rbac_alignment" / stamp / "RBAC-GAP-LIST.v1.json"
    if not gap_path.is_file():
        return {"ok": False, "reason": "missing gap list"}
    gap = json.loads(gap_path.read_text(encoding="utf-8"))
    return {
        "ok": gap.get("handlers_gap") == 0,
        "stamp": stamp,
        "handlers_gap": gap.get("handlers_gap"),
        "four_cluster_summary": gap.get("four_cluster_summary"),
    }


def run_machine_checks(skip_api: bool) -> dict:
    env = {**os.environ}
    if skip_api:
        env["CERT3_SKIP_API"] = "1"
    cmd = [bash_exe(), str(ROOT / "scripts/dev/smoke-cert3-admin-walkthrough-machine-gates.sh")]
    p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", env=env)
    matrix_path = ROOT / "evidence/GO_ttg_cert/.cert3-matrix-checks.json"
    matrix = json.loads(matrix_path.read_text(encoding="utf-8")) if matrix_path.is_file() else {}
    return {
        "verdict": "PASS" if p.returncode == 0 else "FAIL",
        "exit_code": p.returncode,
        "stdout_tail": "\n".join(p.stdout.splitlines()[-8:]),
        "stderr_tail": "\n".join(p.stderr.splitlines()[-8:]),
        "five_role_matrix": matrix,
    }


def write_owner_checklist(evid_dir: Path, pack: dict) -> None:
    lines = [
        "# Cert #3 Admin Walkthrough · Owner Recording Checklist",
        "",
        f"**Program:** `TT_GOVERNANCE_CERT_03_ADMIN_WALKTHROUGH`",
        f"**RBAC baseline:** RBAC-GAP-LIST=0 · `{pack['rbac_alignment']['stamp']}`",
        f"**Session:** `{pack['cert_session']}`",
        "",
        "## 五控制台角色（C1/C2 · ② only）",
        "",
        "| # | 角色 | UAT | 路由 | 验证 |",
        "|---|------|-----|------|------|",
    ]
    for i, r in enumerate(ROLES, 1):
        routes = ", ".join(f"`{x}`" for x in r["routes"][:2])
        ver = ", ".join(r["verifications"][:2])
        lines.append(f"| {i} | **{r['label']}** | {r['uat_ref']} | {routes} | {ver} |")
    lines.extend(
        [
            "",
            "## Signoff",
            "",
            "```bash",
            f"bash scripts/dev/record-cert3-admin-walkthrough-signoff.sh \\",
            f"  --stamp {pack['stamp_utc']} --signer \"Sebastian Ward\"",
            "",
            f"bash scripts/dev/complete-ttg-cert-step.sh --cert 3 --stamp {pack['stamp_utc']} --signer \"Sebastian Ward\"",
            "```",
        ]
    )
    (evid_dir / "walkthrough/admin/CERT3-OWNER-RECORDING-CHECKLIST.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--skip-api", action="store_true")
    args = ap.parse_args()

    rbac_gap = load_rbac_gap_stamp()
    if not rbac_gap.get("ok"):
        print(f"gen-cert3: FAIL RBAC-GAP-LIST not zero: {rbac_gap}", file=sys.stderr)
        sys.exit(2)

    evid = ROOT / "evidence/GO_ttg_cert" / args.stamp
    admin_dir = evid / "walkthrough/admin"
    if not evid.is_dir():
        raise SystemExit(f"gen-cert3: missing session {evid}")
    for sub in ("recordings", "screenshots", "machine-checks"):
        (admin_dir / sub).mkdir(parents=True, exist_ok=True)

    machine = run_machine_checks(args.skip_api)
    (admin_dir / "machine-checks/CERT3-MACHINE-CHECKS.json").write_text(
        json.dumps(machine, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    pack = {
        "schema": "traveltrust.ttg-cert3-admin-walkthrough.v1",
        "program": "TT_GOVERNANCE_CERT_03_ADMIN_WALKTHROUGH",
        "phase": "②",
        "stamp_utc": args.stamp,
        "cert_session": f"evidence/GO_ttg_cert/{args.stamp}",
        "rbac_alignment": rbac_gap,
        "mtm_ssot": "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md",
        "mtm_ids": CERT3_IDS,
        "mtm_rows": [
            {"id": r["id"], "name": r.get("name", ""), "tier": r.get("tier", ""), "page": r.get("page", "")}
            for r in load_mtm_rows()
        ],
        "uat_refs": ["C1", "C2"],
        "roles": ROLES,
        "machine_checks": machine,
        "prepared_at_utc": now,
        "forbidden": ["new features", "govfreeze v2 changes", "docs/spec expansion"],
    }
    (admin_dir / "CERT3-WALKTHROUGH-PACK.v1.json").write_text(
        json.dumps(pack, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    write_owner_checklist(evid, pack)

    manifest_path = evid / "SESSION-MANIFEST.json"
    manifest = (
        json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest_path.exists()
        else {"session_id": "GO_ttg_cert", "stamp_utc": args.stamp}
    )
    manifest["cert3_walkthrough_pack"] = f"walkthrough/admin/CERT3-WALKTHROUGH-PACK.v1.json"
    manifest["cert3_machine_checks"] = machine["verdict"]
    manifest["next_step"] = "Cert #3 — walkthrough/admin recordings → ADMIN-WALKTHROUGH-SIGNOFF.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"TT_GOVERNANCE_CERT_03: PACK_OK machine={machine['verdict']} rbac_gap=0")
    if machine["verdict"] != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
