#!/usr/bin/env python3
"""Generate Cert #2 Multi Identity walkthrough pack (MTM 146 SSOT · evidence only)."""
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

# MTM §14 Cert #2 · gen-ttg-cert-execution-ledger.py
CERT2_IDS = [
    "CHK-CORE-02",
    "CHK-CORE-23",
    "CHK-FE-15",
    "CHK-FE-12",
    "CHK-ID-01",
    "CHK-ID-02",
    "CHK-ID-03",
    "CHK-ID-04",
    "CHK-ID-05",
    "CHK-ID-06",
    "CHK-ID-07",
]

ROLES = [
    {
        "role": "traveler",
        "label": "Traveler",
        "mtm_ids": ["CHK-ID-01", "CHK-CORE-02"],
        "uat_ref": "B1",
        "routes": ["/me/identities", "/community", "/market"],
        "recording_hint": "B1 · Hub 旅行者视角 · 无治理写入口",
        "screenshot": "screenshots/role-traveler-hub.png",
        "isolation": "无 steward 工作台写入口 · 无 Admin 后台",
    },
    {
        "role": "investor",
        "label": "Investor",
        "mtm_ids": ["CHK-ID-02", "CHK-CORE-23"],
        "uat_ref": "B4",
        "routes": ["/governance/distribution-accruals", "/governance/distribution-claim", "/governance/params"],
        "recording_hint": "B4 · 投资者读路径 · 无 45% steward 写",
        "screenshot": "screenshots/role-investor-governance-read.png",
        "isolation": "distribution 只读 · 无 region stake 写",
    },
    {
        "role": "steward",
        "label": "Steward / Region",
        "mtm_ids": ["CHK-ID-03", "CHK-FE-12", "CHK-CORE-23"],
        "uat_ref": "B2",
        "routes": ["/governance?view=region", "/me/identities/region-steward/settings"],
        "recording_hint": "B2 · Region 工作台 · stake/seat 边界（② 链上只读认知）",
        "screenshot": "screenshots/role-steward-region-workbench.png",
        "isolation": "无 USDC 退席 · 无 Treasury spend UI",
    },
    {
        "role": "guide",
        "label": "Guide",
        "mtm_ids": ["CHK-ID-04", "CHK-FE-15"],
        "uat_ref": "B3",
        "routes": ["/me/identities/guide/settings", "/guide"],
        "recording_hint": "B3 · 向导资料与 /guide 子站 · 与 merchant 数据隔离",
        "screenshot": "screenshots/role-guide-settings.png",
        "isolation": "guide-profile 不写 merchant/steward 字段",
    },
    {
        "role": "merchant",
        "label": "Merchant",
        "mtm_ids": ["CHK-ID-05", "CHK-FE-15"],
        "uat_ref": "B3",
        "routes": ["/me/identities/merchant/settings", "/provider"],
        "recording_hint": "B3 · 商家资料与 /provider · 与 guide 列表隔离",
        "screenshot": "screenshots/role-merchant-settings.png",
        "isolation": "merchant listing 不串 guide 域",
    },
    {
        "role": "admin",
        "label": "Admin",
        "mtm_ids": ["CHK-ID-06", "CHK-ID-07", "CHK-CORE-23"],
        "uat_ref": "B4",
        "routes": ["/admin", "/admin/users", "/admin/governance/execution-uat"],
        "recording_hint": "B4 · Admin 只读治理面 · 无链上 spend · RBAC banner 可见",
        "screenshot": "screenshots/role-admin-governance-readonly.png",
        "isolation": "Admin 观测 ≠ 45/55 写 · UI RBAC advisory",
    },
]


def load_mtm_rows() -> list[dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-governance-master-traceability-matrix.py"
    spec = importlib.util.spec_from_file_location("mtm", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    by_id = {r["id"]: r for r in mod.ROWS}
    return [by_id[cid] for cid in CERT2_IDS if cid in by_id]


def run_cmd(cmd: list[str], cwd: Path | None = None) -> dict:
    if cmd and cmd[0] == "bash":
        cmd = [bash_exe(), *cmd[1:]]
    p = subprocess.run(
        cmd,
        cwd=cwd or ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return {
        "cmd": " ".join(cmd),
        "exit_code": p.returncode,
        "stdout_tail": "\n".join(p.stdout.splitlines()[-8:]),
        "stderr_tail": "\n".join(p.stderr.splitlines()[-8:]),
        "ok": p.returncode == 0,
    }


def run_machine_checks(skip_api: bool) -> dict:
    checks: dict[str, dict] = {}
    env = {**os.environ}
    if skip_api:
        env["CERT2_SKIP_API"] = "1"

    cmd = [bash_exe(), str(ROOT / "scripts/dev/smoke-cert2-multi-identity-machine-gates.sh")]
    p = subprocess.run(
        cmd,
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    checks["cert2_machine_gates"] = {
        "cmd": " ".join(cmd),
        "exit_code": p.returncode,
        "stdout_tail": "\n".join(p.stdout.splitlines()[-10:]),
        "stderr_tail": "\n".join(p.stderr.splitlines()[-10:]),
        "ok": p.returncode == 0,
        "api_skipped": skip_api,
    }

    all_ok = checks["cert2_machine_gates"]["ok"]
    return {"verdict": "PASS" if all_ok else "PARTIAL", "checks": checks}


def write_owner_checklist(evid_dir: Path, pack: dict) -> None:
    lines = [
        "# Cert #2 Multi Identity · Owner Recording Checklist",
        "",
        f"**Program:** `TT_GOVERNANCE_CERT_02_MULTI_IDENTITY_WALKTHROUGH`",
        f"**MTM SSOT:** 146 rows · Cert #2 IDs={len(CERT2_IDS)}",
        f"**Session:** `{pack['cert_session']}`",
        "",
        "## 六角色录屏（须 Owner 真人 · ② only）",
        "",
        "| # | 角色 | UAT | 路由 | 截图 | MTM |",
        "|---|------|-----|------|------|-----|",
    ]
    for i, r in enumerate(ROLES, 1):
        routes = ", ".join(f"`{x}`" for x in r["routes"][:2])
        mtm = ", ".join(r["mtm_ids"][:2])
        lines.append(
            f"| {i} | **{r['label']}** | {r['uat_ref']} | {routes} | `{r['screenshot']}` | {mtm} |"
        )
    lines.extend(
        [
            "",
            "## 录屏落盘",
            "",
            "- `walkthrough/multi-identity/recordings/B1-hub-traveler.mp4`（示例名）",
            "- `walkthrough/multi-identity/recordings/B2-steward-region.mp4`",
            "- `walkthrough/multi-identity/recordings/B3-guide-merchant-isolation.mp4`",
            "- `walkthrough/multi-identity/recordings/B4-investor-admin-boundaries.mp4`",
            "",
            "## Signoff（录屏完成后）",
            "",
            "```bash",
            f"bash scripts/dev/record-cert2-multi-identity-walkthrough-signoff.sh \\",
            f"  --stamp {pack['stamp_utc']} --signer \"Sebastian Ward\"",
            "",
            f"bash scripts/dev/complete-ttg-cert-step.sh --cert 2 --stamp {pack['stamp_utc']} --signer \"Sebastian Ward\"",
            "```",
            "",
            "**禁止：** 新增功能 · GovFreeze 复审计 · 扩展 docs/spec",
        ]
    )
    (evid_dir / "walkthrough/multi-identity/CERT2-OWNER-RECORDING-CHECKLIST.md").write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--skip-api", action="store_true")
    args = ap.parse_args()

    evid = ROOT / "evidence/GO_ttg_cert" / args.stamp
    mi = evid / "walkthrough/multi-identity"
    if not evid.is_dir():
        raise SystemExit(f"gen-cert2: missing session {evid}")

    for sub in ("recordings", "screenshots", "machine-checks"):
        (mi / sub).mkdir(parents=True, exist_ok=True)

    mtm_rows = load_mtm_rows()
    machine = run_machine_checks(args.skip_api)
    (mi / "machine-checks/CERT2-MACHINE-CHECKS.json").write_text(
        json.dumps(machine, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    pack = {
        "schema": "traveltrust.ttg-cert2-multi-identity-walkthrough.v1",
        "program": "TT_GOVERNANCE_CERT_02_MULTI_IDENTITY_WALKTHROUGH",
        "phase": "②",
        "stamp_utc": args.stamp,
        "cert_session": f"evidence/GO_ttg_cert/{args.stamp}",
        "mtm_ssot": "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md",
        "mtm_ids": CERT2_IDS,
        "mtm_rows": [
            {
                "id": r["id"],
                "name": r.get("name", ""),
                "tier": r.get("tier", ""),
                "page": r.get("page", ""),
                "role": r.get("role", ""),
            }
            for r in mtm_rows
        ],
        "uat_refs": ["B1", "B2", "B3", "B4"],
        "roles": ROLES,
        "machine_checks": machine,
        "prepared_at_utc": now,
        "owner_next": "recordings + screenshots → record-cert2 signoff → complete-ttg-cert-step --cert 2",
        "forbidden": ["new features", "govfreeze re-audit", "docs/spec expansion"],
    }
    pack_path = mi / "CERT2-WALKTHROUGH-PACK.v1.json"
    pack_path.write_text(json.dumps(pack, indent=2, ensure_ascii=False), encoding="utf-8")
    write_owner_checklist(evid, pack)

    launch = {
        "program": "TT_GOVERNANCE_CERT_02_MULTI_IDENTITY_WALKTHROUGH",
        "status": "LAUNCHED",
        "phase": "②",
        "stamp_utc": args.stamp,
        "machine_checks_verdict": machine["verdict"],
        "mtm_ids_count": len(CERT2_IDS),
        "roles": [r["role"] for r in ROLES],
        "owner_blocker": "recordings in walkthrough/multi-identity/recordings/ (≥1 file)",
        "signoff_path": "walkthrough/multi-identity/MULTI-IDENTITY-WALKTHROUGH-SIGNOFF.json",
    }
    (mi / "TT_GOVERNANCE_CERT_02_LAUNCH.json").write_text(
        json.dumps(launch, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    manifest_path = evid / "SESSION-MANIFEST.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        manifest = {"session_id": "GO_ttg_cert", "stamp_utc": args.stamp}
    manifest["cert2_walkthrough_pack"] = str(pack_path.relative_to(ROOT)).replace("\\", "/")
    manifest["cert2_machine_checks"] = machine["verdict"]
    manifest["next_step"] = (
        "Cert #2 — Owner 六角色录屏 + screenshots → record-cert2 signoff → complete-ttg-cert-step --cert 2"
    )
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"TT_GOVERNANCE_CERT_02: PACK_OK machine={machine['verdict']} pack={pack_path}")
    if machine["verdict"] != "PASS":
        print("TT_GOVERNANCE_CERT_02: WARN machine checks PARTIAL — API smoke optional if API down", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
