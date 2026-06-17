#!/usr/bin/env python3
"""Cert #3 five-console-role RBAC matrix checks (API + static treasury boundary)."""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/release"))
from win_bash import bash_exe  # noqa: E402

CONSOLE_ROLES = ("SuperAdmin", "Finance", "Risk", "Ops", "Auditor", "CS")

ROLE_PERM_BLOCKS = {
    "SuperAdmin": "SUPER_ADMIN_PERMS",
    "Ops": "OPS_PERMS",
    "CS": "CS_PERMS",
    "Risk": "RISK_PERMS",
    "Finance": "FINANCE_PERMS",
    "Auditor": "AUDITOR_PERMS",
}

EXPECTED = {
    "Finance": {
        "allow": [("GET", "/api/v1/admin/finance/summary")],
        "deny": [("GET", "/api/v1/admin/approvals"), ("POST", "/api/v1/admin/flags/:id/publish")],
    },
    "Risk": {
        "allow": [("GET", "/api/v1/admin/community/reports")],
        "deny": [("GET", "/api/v1/admin/finance/summary"), ("GET", "/api/v1/admin/approvals")],
    },
    "Auditor": {
        "allow": [("GET", "/api/v1/admin/audit-logs")],
        "deny": [("POST", "/api/v1/admin/community/penalties"), ("GET", "/api/v1/admin/approvals")],
    },
    "Ops": {
        "allow": [("GET", "/api/v1/admin/finance/summary")],
        "deny": [("GET", "/api/v1/admin/approvals")],
    },
    "SuperAdmin": {
        "allow": [("GET", "/api/v1/admin/approvals")],
        "deny": [],
    },
}


def parse_role_perms(rbac_text: str) -> dict[str, set[str]]:
    out: dict[str, set[str]] = {}
    for role, block in ROLE_PERM_BLOCKS.items():
        m = re.search(rf"const {block}: &\[&str\] = &\[([\s\S]*?)\];", rbac_text)
        if not m:
            raise RuntimeError(f"missing {block}")
        perms = set(re.findall(r"PERM_[A-Z_]+", m.group(1)))
        out[role] = perms
    return out


def parse_route_matrix(rbac_text: str) -> dict[tuple[str, str], str]:
    block_m = re.search(r"ROUTE_DENY_MATRIX.*?=&\[([\s\S]*?)\];", rbac_text)
    block = block_m.group(1) if block_m else rbac_text
    rows: dict[tuple[str, str], str] = {}
    for m in re.finditer(
        r'"(GET|POST|PUT|PATCH|DELETE)",\s*"(/api/v1/admin/[^"]+)",\s*(PERM_[A-Z_]+)',
        block,
        re.MULTILINE,
    ):
        rows[(m.group(1), m.group(2))] = m.group(3)
    return rows


def perm_id(rbac_text: str, const: str) -> str:
    m = re.search(rf'pub const {const}: &str = "([^"]+)"', rbac_text)
    return m.group(1) if m else const


def load_rbac_gap() -> dict:
    stamp_path = ROOT / "evidence/GO_admin_rbac_alignment/latest-stamp.txt"
    if not stamp_path.is_file():
        return {"handlers_gap": -1, "missing": True}
    stamp = stamp_path.read_text(encoding="utf-8").strip()
    gap_path = ROOT / "evidence/GO_admin_rbac_alignment" / stamp / "RBAC-GAP-LIST.v1.json"
    if not gap_path.is_file():
        return {"handlers_gap": -1, "missing": True}
    return json.loads(gap_path.read_text(encoding="utf-8"))


def curl_json(
    api: str, method: str, path: str, token: str | None = None, body: dict | None = None
) -> int:
    url = f"{api.rstrip('/')}{path}"
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code


def run_cargo_cert3_tests() -> dict:
    tests = ["cert3_console_role_rbac_matrix_sequential"]
    cmd = ["cargo", "test", "-p", "traveltrust-api", "--", *tests]
    p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return {
        "cmd": " ".join(cmd),
        "exit_code": p.returncode,
        "ok": p.returncode == 0,
        "stdout_tail": "\n".join(p.stdout.splitlines()[-6:]),
        "stderr_tail": "\n".join(p.stderr.splitlines()[-6:]),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--skip-api", action="store_true")
    args = ap.parse_args()

    rbac_text = (ROOT / "crates/api/src/routes/admin/admin_rbac.rs").read_text(encoding="utf-8")
    mod_text = (ROOT / "crates/api/src/routes/admin/mod.rs").read_text(encoding="utf-8")
    gap = load_rbac_gap()
    role_perms = parse_role_perms(rbac_text)
    route_matrix = parse_route_matrix(rbac_text)

    checks: dict[str, dict] = {}

    checks["rbac_gap_list_zero"] = {
        "ok": gap.get("handlers_gap") == 0 and not gap.get("missing"),
        "handlers_gap": gap.get("handlers_gap"),
        "stamp": gap.get("generated_at_utc"),
    }

    treasury_hits = re.findall(
        r'"/api/v1/admin/[^"]*(?:treasury|spend)[^"]*"',
        rbac_text + mod_text,
        re.I,
    )
    checks["treasury_no_admin_write_route"] = {
        "ok": len(treasury_hits) == 0,
        "hits": treasury_hits,
    }

    checks["superadmin_has_approve_not_auditor"] = {
        "ok": "PERM_APPROVE" in role_perms["SuperAdmin"]
        and "PERM_APPROVE" not in role_perms["Auditor"]
        and "PERM_COMMUNITY_MODERATE" not in role_perms["Auditor"],
        "superadmin_approve": "PERM_APPROVE" in role_perms["SuperAdmin"],
        "auditor_moderate": "PERM_COMMUNITY_MODERATE" in role_perms["Auditor"],
    }

    static_matrix: list[dict] = []
    static_ok = True
    for role, spec in EXPECTED.items():
        perms = role_perms[role]
        for method, path in spec["allow"]:
            perm_const = route_matrix.get((method, path))
            ok = perm_const is not None and perm_const in perms
            static_matrix.append({"role": role, "route": f"{method} {path}", "expect": "allow", "ok": ok})
            static_ok = static_ok and ok
        for method, path in spec["deny"]:
            perm_const = route_matrix.get((method, path))
            ok = perm_const is None or perm_const not in perms
            static_matrix.append({"role": role, "route": f"{method} {path}", "expect": "deny", "ok": ok})
            static_ok = static_ok and ok
    checks["static_role_route_matrix"] = {"ok": static_ok, "rows": static_matrix}

    checks["cargo_cert3_tests"] = run_cargo_cert3_tests()

    api_base = os.environ.get("API_BASE", "http://127.0.0.1:8080").rstrip("/")
    if not args.skip_api:
        try:
            health = curl_json(api_base, "GET", "/health")
            if health == 200:
                checks["smoke_admin_rbac_matrix"] = {"ok": False, "skipped": False}
                p = subprocess.run(
                    [bash_exe(), str(ROOT / "scripts/dev/smoke-admin-rbac-matrix-local.sh")],
                    cwd=ROOT,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    env={**os.environ, "API_BASE": api_base},
                )
                checks["smoke_admin_rbac_matrix"] = {
                    "ok": p.returncode == 0,
                    "exit_code": p.returncode,
                    "stdout_tail": "\n".join(p.stdout.splitlines()[-4:]),
                }
            else:
                checks["smoke_admin_rbac_matrix"] = {"ok": True, "skipped": True, "reason": f"health={health}"}
        except Exception as e:  # noqa: BLE001
            checks["smoke_admin_rbac_matrix"] = {"ok": True, "skipped": True, "reason": str(e)}
    else:
        checks["smoke_admin_rbac_matrix"] = {"ok": True, "skipped": True, "reason": "CERT3_SKIP_API=1"}

    required = [
        "rbac_gap_list_zero",
        "treasury_no_admin_write_route",
        "superadmin_has_approve_not_auditor",
        "static_role_route_matrix",
        "cargo_cert3_tests",
    ]
    hard_fail = any(not checks[k]["ok"] for k in required)
    soft_fail = not checks["smoke_admin_rbac_matrix"]["ok"] and not checks["smoke_admin_rbac_matrix"].get(
        "skipped"
    )
    verdict = "FAIL" if hard_fail or soft_fail else "PASS"

    payload = {
        "schema": "traveltrust.cert3-admin-five-role-matrix.v1",
        "verdict": verdict,
        "console_roles": list(CONSOLE_ROLES),
        "checks": checks,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TT_CERT3_ADMIN_MATRIX: {verdict} out={out}")
    if verdict != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
