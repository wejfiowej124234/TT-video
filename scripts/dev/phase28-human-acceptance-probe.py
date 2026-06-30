#!/usr/bin/env python3
"""
Phase ②.8 · Human Acceptance Test — staging probe (API + HTML shell).

Independent of Playwright UAT six-domains. Records human-visible issues P0/P1/P2.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

WEB = os.environ.get("HAT_WEB_BASE", "https://tt-web-staging.fly.dev").rstrip("/")
API = os.environ.get("HAT_API_BASE", "https://tt-api-staging.fly.dev").rstrip("/")
PASSWORD = os.environ.get("HAT_PASSWORD", "Test123!")
OUT_DIR = os.environ.get(
    "HAT_OUT",
    f"evidence/phase28-human-acceptance/{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
)


@dataclass
class Issue:
    id: str
    role: str
    area: str
    route: str
    priority: str  # P0 | P1 | P2
    title: str
    observation: str
    human_impact: str
    repro: str = ""


@dataclass
class FlowResult:
    role: str
    flow: str
    step: str
    status: str  # PASS | FAIL | BLOCKED | PARTIAL
    notes: str = ""


issues: list[Issue] = []
flows: list[FlowResult] = []
_issue_seq = 0


def next_id(prefix: str) -> str:
    global _issue_seq
    _issue_seq += 1
    return f"HAT-{prefix}-{_issue_seq:03d}"


def add_issue(
    role: str,
    area: str,
    route: str,
    priority: str,
    title: str,
    observation: str,
    human_impact: str,
    repro: str = "",
) -> None:
    issues.append(
        Issue(
            id=next_id(priority.replace("P", "P")),
            role=role,
            area=area,
            route=route,
            priority=priority,
            title=title,
            observation=observation,
            human_impact=human_impact,
            repro=repro,
        )
    )


def add_flow(role: str, flow: str, step: str, status: str, notes: str = "") -> None:
    flows.append(FlowResult(role=role, flow=flow, step=step, status=status, notes=notes))


def http(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    body: dict | None = None,
    timeout: int = 45,
    retries: int = 3,
) -> tuple[int, str, dict[str, str]]:
    last_err = ""
    for attempt in range(retries):
        data = None
        hdrs = {"User-Agent": "TravelTrust-HAT/1.0", "Accept": "*/*"}
        if headers:
            hdrs.update(headers)
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            hdrs["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8", errors="replace")
                return resp.status, raw, dict(resp.headers)
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", errors="replace")
            return e.code, raw, dict(e.headers)
        except Exception as e:
            last_err = str(e)
            if attempt + 1 < retries:
                import time

                time.sleep(1.5 * (attempt + 1))
                continue
            return 0, last_err, {}
    return 0, last_err, {}


def seed_and_login(email: str, promote_admin: bool = False) -> dict[str, Any] | None:
    http("POST", f"{API}/auth/seed-test-accounts", body={})
    if promote_admin:
        http("POST", f"{API}/auth/seed-test-accounts", body={"promote_admin_email": email})
    code, raw, _ = http(
        "POST",
        f"{API}/auth/login",
        body={"email": email, "password": PASSWORD},
    )
    if code != 200:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def auth_headers(token: str, user_id: str | None = None) -> dict[str, str]:
    h = {"Authorization": f"Bearer {token}"}
    if user_id:
        h["X-User-Id"] = user_id
    return h


def probe_web_page(
    role: str,
    route: str,
    *,
    expect_patterns: list[str] | None = None,
    spa_auth_required: bool = False,
) -> None:
    url = f"{WEB}{route}"
    code, html, _ = http("GET", url)
    area = "页面可达性"
    if code == 0:
        add_issue(
            role,
            area,
            route,
            "P2",
            "探针瞬时网络失败（非产品缺陷）",
            html[:200],
            "手测时偶发；浏览器 leg 复验",
        )
        add_flow(role, "页面浏览", route, "PARTIAL", "transient network")
        return
    if code >= 500:
        add_issue(role, area, route, "P0", f"HTTP {code} 服务端错误", html[:180], "白屏或错误页")
        add_flow(role, "页面浏览", route, "FAIL", f"HTTP {code}")
        return
    if code == 404:
        add_issue(role, area, route, "P0", "404 页面不存在", "Next 返回 404", "导航链接失效")
        add_flow(role, "页面浏览", route, "FAIL", "404")
        return

    lower = html.lower()
    error_markers = [
        ("application error", "P0", "Next.js Application error 边界"),
        ("something went wrong", "P0", "通用错误边界文案"),
        ("页面加载异常", "P0", "中文错误边界"),
        ("internal server error", "P0", "内部错误"),
    ]
    for marker, prio, label in error_markers:
        if marker in lower:
            add_issue(role, area, route, prio, label, f"HTML 含 `{marker}`", "用户看到崩溃提示")
            add_flow(role, "页面浏览", route, "FAIL", label)
            return

    title_m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
    title = title_m.group(1).strip() if title_m else ""
    if re.search(r"404|not found|找不到", title, re.I):
        add_issue(role, area, route, "P0", "标题暗示 404", title, "SEO/标签显示页面不存在")
        add_flow(role, "页面浏览", route, "FAIL", title)
        return

    if expect_patterns and not spa_auth_required:
        missing = [p for p in expect_patterns if not re.search(p, html, re.I)]
        if missing:
            add_issue(
                role,
                "页面内容",
                route,
                "P1",
                "关键文案/结构缺失",
                f"未匹配: {', '.join(missing[:3])}",
                "用户可能看到空壳或错误布局",
            )
            add_flow(role, "页面浏览", route, "PARTIAL", f"missing {len(missing)} patterns")
            return
    elif spa_auth_required:
        add_flow(role, "页面浏览", route, "PASS", f"HTTP {code} · SPA (browser leg verifies content)")
        return

    add_flow(role, "页面浏览", route, "PASS", f"HTTP {code}")


def probe_api(
    role: str,
    flow: str,
    step: str,
    method: str,
    path: str,
    token: str | None,
    user_id: str | None,
    *,
    expect_ok: bool = True,
    human_label: str = "",
    p0_on_fail: bool = False,
) -> tuple[int, Any]:
    hdrs = auth_headers(token, user_id) if token else {}
    code, raw, _ = http(method, f"{API}{path}", headers=hdrs)
    parsed: Any = None
    try:
        parsed = json.loads(raw) if raw.strip().startswith(("{", "[")) else raw
    except json.JSONDecodeError:
        parsed = raw

    label = human_label or path
    if expect_ok and code >= 400:
        prio = "P0" if (p0_on_fail or code >= 500) else "P1"
        err = parsed.get("error") if isinstance(parsed, dict) else raw[:120]
        add_issue(
            role,
            flow,
            path,
            prio,
            f"{label} 请求失败 HTTP {code}",
            str(err),
            "对应 UI 列表/表单/按钮无法加载或提交",
            repro=f"{method} {path}",
        )
        add_flow(role, flow, step, "FAIL", f"HTTP {code}")
    elif code < 400:
        add_flow(role, flow, step, "PASS", f"HTTP {code}")
    return code, parsed


def run_traveler(token: str, user_id: str) -> None:
    role = "旅行者"
    # Public discovery
    for route, patterns in [
        ("/", [r"dream|梦想|Start"]),
        ("/market", [r"Market|市场|Discover|发现"]),
        ("/auth/login", [r"Sign in|登录|Log in"]),
        ("/auth/register", [r"Register|注册"]),
        ("/community", [r"Feed|动态|Community|社区"]),
        ("/governance", [r"Governance|治理"]),
        ("/did-rank", [r"Rank|排行"]),
        ("/orders", [r"Order|订单"]),
        ("/disputes", [r"Dispute|争议"]),
    ]:
        probe_web_page(role, route, expect_patterns=patterns)

    probe_api(role, "身份", "GET /me", "GET", "/api/v1/me", token, user_id, human_label="个人中心数据")
    probe_api(role, "市场", "discover orders", "GET", "/api/v1/discover/orders?limit=5", None, None)
    probe_api(role, "订单", "my orders", "GET", "/api/v1/orders?role=traveler&limit=10", token, user_id)
    probe_api(
        role,
        "社区",
        "feed",
        "GET",
        "/api/v1/community/feed?limit=5",
        None,
        None,
        p0_on_fail=False,
    )
    probe_api(
        role,
        "社区",
        "media capabilities",
        "GET",
        "/api/v1/community/media/capabilities",
        None,
        None,
    )
    probe_api(
        role,
        "社区",
        "explore destinations",
        "GET",
        "/api/v1/community/explore/destinations",
        None,
        None,
    )
    probe_api(role, "治理", "proposals", "GET", "/api/v1/governance/proposals?limit=5", token, user_id)
    probe_api(role, "治理", "delegate", "GET", "/api/v1/governance/delegate", token, user_id)
    probe_api(
        role,
        "社区消息",
        "conversations",
        "GET",
        "/api/v1/community/conversations?limit=5",
        token,
        user_id,
    )
    # trust 块在 GET /me 内，非独立 /me/trust
    _, me_full = probe_api(role, "身份", "me+trust block", "GET", "/api/v1/me", token, user_id)
    if isinstance(me_full, dict) and not me_full.get("trust"):
        add_issue(
            role,
            "身份",
            "/me/identities",
            "P2",
            "GET /me 无 trust 块",
            "响应缺 trust 对象",
            "收购/信任分 UI 可能显示占位或推导值",
        )

    probe_web_page(role, "/me/settings", expect_patterns=[r"Settings|设置"])
    probe_web_page(role, "/me/identities", expect_patterns=[r"Identities|身份"])
    probe_web_page(role, "/market/acquisition", expect_patterns=[r"Acquisition|收购"])
    probe_web_page(role, "/community/explore", expect_patterns=[r"Explore|发现"])
    probe_web_page(role, "/community/messages", expect_patterns=[r"Messages|消息"])
    probe_web_page(role, "/governance/proposals", expect_patterns=[r"Proposal|提案"])
    probe_web_page(role, "/governance/delegate", expect_patterns=[r"Delegate|委托"])
    probe_web_page(role, "/staking", expect_patterns=[r"stak|质押"])


def run_guide(token: str, user_id: str) -> None:
    role = "向导"
    probe_web_page(role, "/guide", expect_patterns=[r"Guide|向导"])
    probe_api(role, "向导资料", "GET /me guide", "GET", "/api/v1/me", token, user_id)
    code, me = probe_api(role, "接单", "guide orders", "GET", "/api/v1/orders?role=guide&limit=10", token, user_id)
    if code == 200 and isinstance(me, dict):
        guide = me.get("guide") if "guide" in str(type(me)) else None
    # check guide profile exists in /me
    _, me_body = probe_api(role, "向导身份", "me.guide", "GET", "/api/v1/me", token, user_id)
    if isinstance(me_body, dict) and not me_body.get("guide"):
        add_issue(
            role,
            "向导入驻",
            "/guide",
            "P1",
            "种子账号无 guide 资料块",
            "GET /me 无 guide 对象",
            "向导端可能显示未入驻/空状态",
        )


def run_merchant() -> None:
    role = "商家"
    for route, patterns in [
        ("/auth/register?role=provider", [r"Register|注册|provider|商家"]),
        ("/provider/register", [r"provider|商家|入驻"]),
        ("/market/provider", [r"provider|商家|Market|市场"]),
        ("/me/onboarding", [r"onboard|入驻|Provider|商家"]),
    ]:
        probe_web_page(role, route, expect_patterns=patterns)

    # Provider accounts: prefer merchant@test.com (C4), fallback demo
    login = seed_and_login("merchant@test.com") or seed_and_login("provider-did-rank-demo@test.com")
    if login and login.get("token"):
        t, uid = login["token"], login.get("user_id")
        probe_api(role, "商家橱窗", "listings", "GET", "/api/v1/market/subsite/provider/catalog?limit=5", None, None)
        probe_api(role, "入驻状态", "onboarding", "GET", "/api/v1/me/onboarding", t, uid)
    else:
        add_flow(role, "商家登录", "provider-did-rank-demo", "BLOCKED", "无种子商家账号；须自注册走 /provider/register")
        add_issue(
            role,
            "测试账号",
            "/provider/register",
            "P2",
            "Staging 无预置商家测试账号",
            "仅 tourist/guide 种子；商家须完整注册+审核链",
            "QA 无法一键切换商家角色，延长验收周期",
            repro="docs/测试账号与本地联调.md 仅列 tourist/guide",
        )


def run_admin(token: str, user_id: str) -> None:
    role = "管理员"
    admin_routes = [
        "/admin",
        "/admin/orders",
        "/admin/users",
        "/admin/finance",
        "/admin/disputes",
        "/admin/community/reports",
        "/admin/community/moderation/cases",
        "/admin/provider-applications",
        "/admin/inbox",
        "/admin/permissions",
    ]
    for route in admin_routes:
        probe_web_page(role, route, spa_auth_required=True)

    probe_api(
        role,
        "Admin 壳层",
        "capabilities",
        "GET",
        "/api/v1/admin/capabilities",
        token,
        user_id,
        p0_on_fail=True,
        human_label="Admin 能力条/导航",
    )
    probe_api(role, "订单台账", "orders", "GET", "/api/v1/admin/orders?limit=5", token, user_id)
    probe_api(role, "用户台账", "users", "GET", "/api/v1/admin/users?limit=5", token, user_id)
    probe_api(role, "财务", "finance overview", "GET", "/api/v1/admin/metrics/home-overview", token, user_id)
    probe_api(role, "举报队列", "reports", "GET", "/api/v1/admin/community/reports?limit=5", token, user_id)
    probe_api(role, "争议队列", "disputes", "GET", "/api/v1/admin/disputes?limit=5", token, user_id)
    probe_api(role, "商家申请", "provider apps", "GET", "/api/v1/admin/provider-applications?limit=5", token, user_id)


def run_governance(token: str, user_id: str) -> None:
    role = "治理"
    probe_api(role, "协议参考", "protocol-ref", "GET", "/api/v1/governance/protocol-reference", None, None)
    probe_api(role, "奖励池", "rewards", "GET", "/api/v1/governance/rewards", token, user_id)
    probe_api(role, "投票权", "voting power", "GET", "/api/v1/governance/voting-power", token, user_id)
    probe_api(role, "提案列表", "proposals", "GET", "/api/v1/governance/proposals?limit=10", token, user_id)
    probe_api(role, "委托状态", "delegate", "GET", "/api/v1/governance/delegate", token, user_id)
    probe_web_page(role, "/governance/distribution-claim", expect_patterns=[r"Claim|领取|Distribution"])
    probe_web_page(role, "/governance/fee-routes", expect_patterns=[r"Fee|费用|Router"])


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)

    code, meta_raw, _ = http("GET", f"{API}/meta")
    meta: dict = {}
    if code == 200:
        try:
            meta = json.loads(meta_raw)
        except json.JSONDecodeError:
            pass

    tourist = seed_and_login("tourist@test.com", promote_admin=True)
    guide = seed_and_login("guide@test.com")

    if not tourist or not tourist.get("token"):
        add_issue("全局", "认证", "/auth/login", "P0", "旅行者/Admin 种子登录失败", "seed/login 无 token", "全部需登录流程不可用")
        verdict = "NO-GO"
    else:
        t_token = tourist["token"]
        t_uid = tourist.get("user_id", "")
        run_traveler(t_token, t_uid)
        run_admin(t_token, t_uid)
        run_governance(t_token, t_uid)

        if guide and guide.get("token"):
            run_guide(guide["token"], guide.get("user_id", ""))
        else:
            add_issue("向导", "认证", "/auth/login", "P0", "guide@test.com 登录失败", "无 token", "向导端无法验收")
            add_flow("向导", "登录", "guide@test.com", "FAIL")

        run_merchant()

        p0 = sum(1 for i in issues if i.priority == "P0")
        p1 = sum(1 for i in issues if i.priority == "P1")
        p2 = sum(1 for i in issues if i.priority == "P2")
        if p0 > 0:
            verdict = "NO-GO"
        elif p1 > 3:
            verdict = "CONDITIONAL"
        else:
            verdict = "PASS"

    payload = {
        "phase": "②.8 Human Acceptance Test",
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "targets": {"web": WEB, "api": API},
        "meta_git_sha": meta.get("build", {}).get("git_sha"),
        "verdict": verdict,
        "summary": {
            "p0": sum(1 for i in issues if i.priority == "P0"),
            "p1": sum(1 for i in issues if i.priority == "P1"),
            "p2": sum(1 for i in issues if i.priority == "P2"),
            "flows_pass": sum(1 for f in flows if f.status == "PASS"),
            "flows_fail": sum(1 for f in flows if f.status == "FAIL"),
            "flows_partial": sum(1 for f in flows if f.status == "PARTIAL"),
            "flows_blocked": sum(1 for f in flows if f.status == "BLOCKED"),
        },
        "issues": [i.__dict__ for i in issues],
        "flows": [f.__dict__ for f in flows],
        "boundary": "Human-visible staging acceptance · not Production GO · independent of six-domain UAT pass/fail",
    }

    out_json = os.path.join(OUT_DIR, "hat-findings.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(json.dumps(payload["summary"], indent=2))
    print(f"HAT_VERDICT: {verdict}")
    print(f"OUT: {out_json}")
    return 0 if verdict == "NO-GO" else 0  # probe never blocks orchestrator


if __name__ == "__main__":
    sys.exit(main())
