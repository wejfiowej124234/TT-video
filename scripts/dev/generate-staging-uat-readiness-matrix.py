#!/usr/bin/env python3
"""Generate Production Readiness Matrix from staging UAT findings JSON."""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

DOMAIN_ROWS = [
    ("首页", "D1", "Marketing / Home / Trust hub", "PARTIAL"),
    ("身份", "D2", "Auth / me / identities", "PARTIAL"),
    ("市场", "D3", "Market / acquisition / guides", "PARTIAL"),
    ("社区", "D4", "Community feed / explore / messages", "PARTIAL"),
    ("治理", "D5", "Governance / staking / Sepolia", "PARTIAL"),
    ("管理员", "D6", "Admin workspace / ops", "PARTIAL"),
    ("跨域", "DX", "CORS / meta / env alignment", "PARTIAL"),
]

BUGFIX_ONLY = (
    "本矩阵仅登记 **Staging UAT 真实浏览器缺陷**；"
    "Remediation 只允许 **bugfix**（含 staging 部署/Env/CORS/构建），"
    "**禁止新增产品需求**。"
    " **≠ Production GO** · **≠ Phase ③ 公网 GO**。"
)

P0_PATTERNS = (
    re.compile(r"Failed to fetch", re.I),
    re.compile(r"MetaProvider getMeta", re.I),
    re.compile(r"getDiscoverOrders", re.I),
    re.compile(r"getGuides", re.I),
    re.compile(r"error boundary", re.I),
    re.compile(r"CORS", re.I),
    re.compile(r"api≥400: (?!401|403)", re.I),
)

P1_PATTERNS = (
    re.compile(r"main shell not matched", re.I),
    re.compile(r"data-tt page shell not visible", re.I),
    re.compile(r"useDidRankData", re.I),
    re.compile(r"401", re.I),
    re.compile(r"login_required", re.I),
)


def load_findings(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def domain_status(findings: list[dict], domain: str) -> str:
    items = [f for f in findings if f.get("domain") == domain]
    if not items:
        return "NOT_RUN"
    if any(f.get("status") == "FAIL" for f in items):
        return "FAIL"
    if any(f.get("status") == "WARN" for f in items):
        return "WARN"
    return "PASS"


def classify_prio(note: str, auth_mode: str) -> str:
    if re.search(r"401|login_required|status of 401", note, re.I):
        return "P1"
    if re.search(r"main shell not matched|data-tt page shell not visible", note, re.I):
        return "P1"
    if auth_mode != "public" and re.search(r"Failed to fetch", note, re.I):
        return "P1"
    if any(p.search(note) for p in P0_PATTERNS):
        return "P0"
    if any(p.search(note) for p in P1_PATTERNS):
        return "P1"
    return "P1"


def defect_lines(findings: list[dict]) -> list[str]:
    lines: list[str] = []
    n = 1
    for f in findings:
        if f.get("status") == "PASS":
            continue
        auth_mode = f.get("auth_mode") or "public"
        for note in f.get("notes") or []:
            if note == "shell reachable":
                continue
            if note.startswith("api auth-only"):
                continue
            prio = classify_prio(note, auth_mode)
            lines.append(
                f"| **DEF-{n:03d}** | {f.get('domain','?')} | `{f.get('route','?')}` | "
                f"{prio} | {f.get('status','?')} | {note} | bugfix | OPEN |"
            )
            n += 1
    return lines


def p0_count(findings: list[dict]) -> int:
    n = 0
    for f in findings:
        if f.get("status") == "PASS":
            continue
        auth_mode = f.get("auth_mode") or "public"
        for note in f.get("notes") or []:
            if note in ("shell reachable",) or note.startswith("api auth-only"):
                continue
            if classify_prio(note, auth_mode) == "P0":
                n += 1
    return n


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--findings", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    data = load_findings(Path(args.findings))
    findings = data.get("findings") or []
    summary = data.get("summary") or {}
    auth = data.get("auth") or {}
    base = data.get("base_url", "https://tt-web-staging.fly.dev")
    api = data.get("api_base", "https://tt-api-staging.fly.dev")
    recorded = data.get("recorded_at") or datetime.now(timezone.utc).isoformat()

    overall = "FAIL" if summary.get("fail", 0) > 0 else ("WARN" if summary.get("warn", 0) > 0 else "PASS")
    prod_go = "NO-GO"
    phase3 = "NO-GO"
    p0_n = p0_count(findings)
    browsable = "YES" if overall != "FAIL" else "PARTIAL"

    matrix_rows = []
    for name, code, scope, _ in DOMAIN_ROWS:
        st = domain_status(findings, name)
        matrix_rows.append(f"| {code} | {name} | {scope} | {st} | Staging UAT browser |")

    defects = defect_lines(findings)
    if not defects:
        defects = ["| — | — | — | — | 无 FAIL/WARN 级缺陷记录 | — | — |"]

    auth_email = auth.get("email") or "tourist@test.com"
    auth_user_id = auth.get("user_id") or "—"
    auth_note = auth.get("note") or "Bearer session for auth-gated routes"

    md = f"""# Phase ② · Staging UAT · Production Readiness Matrix

**Target:** [{base}]({base})  
**API:** [{api}]({api})  
**Recorded:** {recorded}  
**UAT artifact:** `{args.findings}`  

> {BUGFIX_ONLY}

---

## 1 · Executive verdict

| Gate | Verdict |
|------|---------|
| **Staging browsable** | **{browsable}** |
| **Staging UAT (六大域)** | **{overall}** ({summary.get("pass", 0)} PASS / {summary.get("warn", 0)} WARN / {summary.get("fail", 0)} FAIL) |
| **P0 cluster (CORS/meta/fetch)** | **{"CLEAR" if p0_n == 0 else f"{p0_n} OPEN"}** |
| **Production GO** | **{prod_go}** |
| **Phase ③ Public GO** | **{phase3}** |

### Auth posture（P1 收口）

| Item | Value |
|------|-------|
| **UAT account** | `{auth_email}` |
| **UAT user_id** | `{auth_user_id}` |
| **Auth-gated routes** | Bearer via `seed-test-accounts` + `promote_admin_email` + `ensureCommunityBrowserSessionAccepted` |
| **Public routes** | Unauthenticated；401/403 **不计 P0** |
| **Note** | {auth_note} |

---

## 2 · Six-domain readiness

| ID | 域 | Scope | Staging UAT | Evidence |
|----|-----|-------|-------------|----------|
{chr(10).join(matrix_rows)}

---

## 3 · Defect register（bugfix only）

| ID | 域 | Route | Prio | Sev | Observation | Fix class | Status |
|----|-----|-------|------|-----|-------------|-----------|--------|
{chr(10).join(defects)}

---

## 4 · Production readiness checklist（③ 闸 · 未满足项）

| # | Item | Staging | Production requirement | Status |
|---|------|---------|------------------------|--------|
| P1 | Public HTTPS frontend | ✅ tt-web-staging | Dedicated prod domain + CDN | OPEN |
| P2 | CORS / API alignment | UAT DX row | Locked prod origins | {"PASS" if domain_status(findings, "跨域") == "PASS" else "WARN"} |
| P3 | Sepolia chain_id=11155111 | UAT meta probe | Same on prod chain policy | {"PASS" if domain_status(findings, "跨域") == "PASS" else "OPEN"} |
| P4 | Stripe test vs live isolation | API secrets | **sk_live forbidden** on staging | PREP |
| P5 | Production CDN / HLS (G7) | staging MP4 only | CDN + HLS GO | **PREP_PASS** |
| P6 | Build quality (TS/ESLint in CI) | standalone build skips lint/tsc | Full green `npm run build` + lint | **OPEN** |
| P7 | Zero error-boundary on core routes | UAT §3 | All six domains PASS | **{overall}** |
| P8 | Admin auth (real RBAC) | Bearer + promote_admin (②) | SSO/RBAC + audit | OPEN |

---

## 5 · Remediation policy

1. **Allowed:** bugfix, env/CORS/staging deploy, missing import/typo, API 5xx when contract wrong.  
2. **Forbidden:** new features, UI structure changes (五主路由 freeze), scope creep.  
3. **P0 vs P1:** 未登录 401 / shell 不匹配 **≠ P0**；public 路由 Failed to fetch / CORS / 5xx = **P0**；Bearer 路由同类问题先记 **P1** 待 bugfix。  
4. **Re-run:** `bash scripts/dev/run-staging-uat-six-domains.sh`

---

## 6 · Route-level findings (raw)

```json
{json.dumps(findings, indent=2, ensure_ascii=False)}
```
"""

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(md, encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
