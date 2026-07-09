#!/usr/bin/env python3
"""Phase② human acceptance probe — 四角色 · local or staging (P2HA).

Business personas use Immutable IDs C1–E2 (registry/test-accounts-business-immutable.v1.yaml).
Admin block uses C2 + promote_admin — SuperAdmin dev shortcut only, NOT RBAC matrix GO.
"""
from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.human_acceptance_http import api_base, auth_headers, fetch_meta_sha, http, seed_and_login, web_base

PHASE = os.environ.get("P2HA_PHASE", "staging")
OUT_DIR = os.environ.get("P2HA_OUT", ".")


@dataclass
class RoleResult:
    role: str
    verdict: str
    notes: str = ""


roles_out: list[RoleResult] = []
issues: list[dict[str, Any]] = []


def add_issue(role: str, priority: str, title: str, note: str) -> None:
    issues.append({"role": role, "priority": priority, "title": title, "note": note})


def probe_role(role: str, email: str, paths: list[str], *, promote_admin: bool = False) -> None:
    login = seed_and_login(email, promote_admin=promote_admin)
    if not login or not login.get("token"):
        add_issue(role, "P0", f"{email} 登录失败", "无 token")
        roles_out.append(RoleResult(role, "FAIL", "login"))
        return
    token, uid = login["token"], login.get("user_id")
    failed = 0
    for path in paths:
        code, raw, _ = http("GET", f"{api_base()}{path}", headers=auth_headers(token, uid))
        if code >= 400:
            failed += 1
            add_issue(role, "P0" if code >= 500 else "P1", f"{path} HTTP {code}", raw[:80])
    roles_out.append(RoleResult(role, "PASS" if failed == 0 else "FAIL", f"{failed} api fails"))


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)
    probe_role(
        "旅行者",
        "tourist@test.com",
        ["/api/v1/me", "/api/v1/orders?role=traveler&limit=3", "/api/v1/discover/orders?limit=3"],
    )
    probe_role("向导", "guide@test.com", ["/api/v1/me", "/api/v1/orders?role=guide&limit=3"])
    probe_role(
        "管理员",
        "tourist@test.com",
        ["/api/v1/admin/capabilities", "/api/v1/admin/orders?limit=3"],
        promote_admin=True,
    )
    probe_role(
        "收购/运营",
        "multi-demo@test.com",
        ["/api/v1/me", "/api/v1/market/acquisition/listings?limit=3"],
    )

    p0 = sum(1 for i in issues if i["priority"] == "P0")
    verdict = "PASS" if all(r.verdict == "PASS" for r in roles_out) and p0 == 0 else "FAIL"
    payload = {
        "schema": "traveltrust.p2ha_probe.v1",
        "phase": PHASE,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "targets": {"web": web_base(), "api": api_base()},
        "meta_git_sha": fetch_meta_sha(),
        "verdict": verdict,
        "roles": [r.__dict__ for r in roles_out],
        "issues": issues,
        "summary": {"p0": p0, "p1": sum(1 for i in issues if i["priority"] == "P1")},
    }
    out_json = os.path.join(OUT_DIR, "p2ha-findings.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"P2HA_VERDICT_{PHASE.upper()}: {verdict}")
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
