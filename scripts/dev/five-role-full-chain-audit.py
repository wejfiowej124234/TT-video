#!/usr/bin/env python3
"""Five-role register→login→core→logout API audit (FRCA · Phase② staging)."""
from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.human_acceptance_http import api_base, auth_headers, fetch_meta_sha, http, seed_and_login, web_base

OUT = os.environ.get("FRCA_OUT", ".")


@dataclass
class Gap:
    id: str
    role: str
    category: str
    priority: str
    title: str
    human_impact: str
    repro: str = ""


@dataclass
class RoleChain:
    role: str
    register: str = "SKIP"
    login: str = "FAIL"
    core: str = "FAIL"
    logout: str = "FAIL"
    notes: str = ""


gaps: list[Gap] = []
chains: list[RoleChain] = []
_seq = 0


def gap_id(prefix: str = "FRCA") -> str:
    global _seq
    _seq += 1
    return f"{prefix}-{_seq:03d}"


def add_gap(role: str, category: str, priority: str, title: str, human_impact: str, repro: str = "") -> None:
    gaps.append(Gap(gap_id(), role, category, priority, title, human_impact, repro))


def probe_api(role: str, token: str, uid: str | None, method: str, path: str, *, p0: bool = False) -> bool:
    code, raw, _ = http(method, f"{api_base()}{path}", headers=auth_headers(token, uid) if token else None)
    if code >= 400:
        add_gap(
            role,
            "全链路缺口" if code >= 500 else "错误提示缺失",
            "P0" if p0 or code >= 500 else "P1",
            f"{path} HTTP {code}",
            raw[:120],
            f"{method} {path}",
        )
        return False
    return True


def logout_chain(role: str, token: str, uid: str | None) -> str:
    code, _, _ = http(
        "POST",
        f"{api_base()}/auth/logout",
        headers=auth_headers(token, uid),
        body={},
    )
    if code not in (200, 204):
        add_gap(role, "状态机断裂", "P1", "POST /auth/logout 失败", f"HTTP {code}", "logout")
        return "FAIL"
    code2, _, _ = http("GET", f"{api_base()}/api/v1/me", headers=auth_headers(token, uid))
    if code2 == 200:
        add_gap(role, "权限泄漏", "P1", "logout 后会话仍有效", "GET /me 仍 200", "logout then /me")
        return "FAIL"
    if code2 in (401, 403):
        return "PASS"
    return "PASS" if code2 == 0 else "PARTIAL"


def run_role(role: str, email: str, *, promote_admin: bool = False, core_paths: list[tuple[str, str]]) -> None:
    chain = RoleChain(role=role, register="SKIP(seed)")
    login = seed_and_login(email, promote_admin=promote_admin)
    if not login or not login.get("token"):
        add_gap(role, "全链路缺口", "P0", f"{email} 登录失败", "无 token", f"login {email}")
        chain.login = "FAIL"
        chains.append(chain)
        return
    chain.login = "PASS"
    token, uid = login["token"], login.get("user_id")
    ok = all(probe_api(role, token, uid, m, p) for m, p in core_paths)
    chain.core = "PASS" if ok else "PARTIAL"
    chain.logout = logout_chain(role, token, uid)
    chains.append(chain)


def manual_gaps() -> None:
    for gid, role, title in [
        ("FRCA-GAP-M01", "商家", "商家注册→Admin审核→listing 未在本轮 UI 手操"),
        ("FRCA-GAP-M02", "旅行者", "支付/下单/Escrow 全链未手操"),
        ("FRCA-GAP-M03", "向导", "接单→完成→评分未手操"),
        ("FRCA-GAP-M04", "治理", "链上投票/Claim 未接钱包手操"),
    ]:
        gaps.append(Gap(gid, role, "全链路缺口", "P2", title, "须浏览器/钱包手操复验"))


def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    run_role(
        "旅行者",
        "tourist@test.com",
        core_paths=[
            ("GET", "/api/v1/me"),
            ("GET", "/api/v1/orders?role=traveler&limit=5"),
            ("GET", "/api/v1/discover/orders?limit=5"),
        ],
    )
    run_role(
        "向导",
        "guide@test.com",
        core_paths=[
            ("GET", "/api/v1/me"),
            ("GET", "/api/v1/orders?role=guide&limit=5"),
        ],
    )
    merchant_email = "merchant@test.com"
    run_role(
        "商家",
        merchant_email,
        core_paths=[
            ("GET", "/api/v1/me"),
            ("GET", "/api/v1/market/provider/listings?limit=5"),
        ],
    )
    run_role(
        "管理员",
        "tourist@test.com",
        promote_admin=True,
        core_paths=[
            ("GET", "/api/v1/admin/capabilities"),
            ("GET", "/api/v1/admin/orders?limit=5"),
            ("GET", "/api/v1/admin/users?limit=5"),
        ],
    )
    run_role(
        "治理",
        "tourist@test.com",
        core_paths=[
            ("GET", "/api/v1/governance/proposals?limit=5"),
            ("GET", "/api/v1/governance/delegate"),
            ("GET", "/api/v1/governance/voting-power"),
        ],
    )
    manual_gaps()

    p0 = sum(1 for g in gaps if g.priority == "P0")
    p1 = sum(1 for g in gaps if g.priority == "P1")
    verdict = "NO-GO" if p0 else ("CONDITIONAL" if p1 else "PASS")

    payload: dict[str, Any] = {
        "schema": "traveltrust.frca_five_role_full_chain.v1",
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "targets": {"web": web_base(), "api": api_base()},
        "meta_git_sha": fetch_meta_sha(),
        "verdict": verdict,
        "summary": {"p0": p0, "p1": p1, "p2": sum(1 for g in gaps if g.priority == "P2")},
        "role_chains": [c.__dict__ for c in chains],
        "gaps": [g.__dict__ for g in gaps],
    }
    out_path = os.path.join(OUT, "frca-findings.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"FRCA_FIVE_ROLE_FULL_CHAIN: {verdict}")
    print(json.dumps(payload["summary"], indent=2))
    return 1 if verdict == "NO-GO" else 0


if __name__ == "__main__":
    raise SystemExit(main())
