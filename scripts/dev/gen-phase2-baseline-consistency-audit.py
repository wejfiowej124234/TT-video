#!/usr/bin/env python3
"""Phase ② · Baseline consistency audit (read-only · no fixes).

SSOT: Local First · expect-sha defaults to git HEAD (staging runtime may lag until S5 deploy).

  python scripts/dev/gen-phase2-baseline-consistency-audit.py \\
    --expect-sha "$(git rev-parse HEAD)" \\
    --out-dir evidence/GO_phase2_baseline_consistency_audit/<stamp>
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SSOT_DEFAULT = "9979b35efe562e8dd200e9f1a1e17fcc8182d170"
API_DEFAULT = "https://tt-api-staging.fly.dev"
WEB_DEFAULT = "https://tt-web-staging.fly.dev"
CHAIN_ENV = ROOT / "scripts/dev/.env.phase2-chain-deploy.local"
ONBOARDING = ROOT / "scripts/dev/.env.staging-onboarding.local"
BUILD_ENV = ROOT / "deploy/fly/tt-web-staging/build.env.local"
REGISTRY = ROOT / "registry/protocol-convergence-deployments.v1.yaml"
MIG_DIR = ROOT / "crates/api/migrations"

META_CONTRACT_KEYS = [
    ("escrow_factory_address", "ESCROW_FACTORY_ADDRESS"),
    ("fee_router_address", "FEE_ROUTER_ADDRESS"),
    ("governor_address", "GOVERNOR_ADDRESS"),
    ("governance_token_address", "GOVERNANCE_TOKEN_ADDRESS"),
    ("region_steward_stake_pool_address", "REGION_STEWARD_STAKE_POOL_ADDRESS"),
    ("staking_address", "STAKING_ADDRESS"),
    ("timelock_address", "TIMELOCK_ADDRESS"),
]


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.split("#", 1)[0].strip()
        if not line or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def http_json(url: str, timeout: int = 45) -> tuple[int, Any]:
    import time

    req_headers = {"Accept": "application/json", "User-Agent": "tt-baseline-audit/1"}
    last_err: Exception | None = None
    for attempt in range(4):
        req = urllib.request.Request(url, headers=req_headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8", errors="replace")
                return resp.getcode(), json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", errors="replace")
            try:
                return e.code, json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return e.code, raw
        except Exception as e:
            last_err = e
            if attempt < 3:
                time.sleep(1.5 * (attempt + 1))
                continue
            break
    # curl fallback (Windows → fly.dev SSL flakes)
    try:
        proc = subprocess.run(
            ["curl", "-sS", "--max-time", str(timeout), "-w", "\n__HTTP_CODE__:%{http_code}", url],
            capture_output=True,
            text=True,
            timeout=timeout + 15,
            check=False,
        )
        out = proc.stdout or ""
        marker = "\n__HTTP_CODE__:"
        if marker in out:
            raw, _, code_tail = out.rpartition(marker)
            status = int(code_tail.strip() or "0")
        else:
            raw, status = out, 200 if proc.returncode == 0 else 0
        if status and raw.strip():
            try:
                return status, json.loads(raw)
            except json.JSONDecodeError:
                return status, raw
    except Exception:
        pass
    return 0, {"error": str(last_err) if last_err else "http_json failed"}


def http_get_json(
    url: str,
    headers: dict[str, str] | None = None,
    timeout: int = 45,
) -> tuple[int, Any]:
    """GET with retry + curl fallback (Windows fly.dev SSL flakes)."""
    import time

    hdrs = {"Accept": "application/json", "User-Agent": "tt-baseline-audit/1"}
    if headers:
        hdrs.update(headers)
    last_err: Exception | None = None
    for attempt in range(4):
        req = urllib.request.Request(url, headers=hdrs)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8", errors="replace")
                return resp.getcode(), json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", errors="replace")
            try:
                return e.code, json.loads(raw) if raw else {"http_error": e.code}
            except json.JSONDecodeError:
                return e.code, {"http_error": e.code, "raw": raw[:200]}
        except Exception as e:
            last_err = e
            if attempt < 3:
                time.sleep(1.5 * (attempt + 1))
                continue
            break
    curl_args = ["curl", "-sS", "--max-time", str(timeout), "-w", "\n__HTTP_CODE__:%{http_code}", url]
    for k, v in hdrs.items():
        curl_args.extend(["-H", f"{k}: {v}"])
    try:
        proc = subprocess.run(
            curl_args,
            capture_output=True,
            text=True,
            timeout=timeout + 15,
            check=False,
        )
        out = proc.stdout or ""
        marker = "\n__HTTP_CODE__:"
        if marker in out:
            raw, _, code_tail = out.rpartition(marker)
            status = int(code_tail.strip() or "0")
        else:
            raw, status = out, 200 if proc.returncode == 0 else 0
        if status and raw.strip():
            try:
                return status, json.loads(raw)
            except json.JSONDecodeError:
                return status, raw
    except Exception:
        pass
    return 0, {"fetch_error": str(last_err) if last_err else "http_get_json failed"}


def probe_api_git_sha(api: str) -> tuple[str, str, dict[str, Any]]:
    """meta → meta/build fallback (same as p2fc-staging-probe-lib)."""
    api = api.rstrip("/")
    code, meta = http_json(f"{api}/meta", timeout=90)
    if isinstance(meta, dict):
        sha = str((meta.get("build") or {}).get("git_sha") or "")
        if sha:
            return sha, "meta", meta
    code_mb, meta_build = http_json(f"{api}/meta/build", timeout=45)
    if isinstance(meta_build, dict):
        sha = str(meta_build.get("git_sha") or "")
        if sha:
            return sha, "meta_build", meta if isinstance(meta, dict) else {}
    return "", "none", meta if isinstance(meta, dict) else {}


def registry_val(key: str) -> str:
    if not REGISTRY.is_file():
        return ""
    text = REGISTRY.read_text(encoding="utf-8", errors="replace")
    m = re.search(rf'{re.escape(key)}:\s*"([^"]+)"', text)
    if m:
        return m.group(1)
    if f"{key}: null" in text:
        return "null"
    return ""


def latest_migration_version() -> str | None:
    versions: list[str] = []
    if not MIG_DIR.is_dir():
        return None
    for p in MIG_DIR.glob("*.sql"):
        m = re.match(r"^(\d+)", p.name)
        if m:
            versions.append(m.group(1))
    return max(versions) if versions else None


def git_head() -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "HEAD"], text=True).strip()


def git_is_ancestor(ancestor: str, descendant: str) -> bool:
    if not ancestor or not descendant:
        return False
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "merge-base", "--is-ancestor", ancestor, descendant],
        capture_output=True,
    )
    return proc.returncode == 0


def git_dirty_deploy_paths() -> list[str]:
    paths = ["crates/", "frontend/", "deploy/", "registry/"]
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "status", "--porcelain", "--"] + paths,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return [ln for ln in proc.stdout.splitlines() if ln.strip()]


def addr_eq(a: str, b: str) -> bool:
    return (a or "").strip().lower() == (b or "").strip().lower()


def add_finding(
    diffs: list[dict[str, Any]],
    risks: list[dict[str, Any]],
    *,
    domain: str,
    item: str,
    local: str,
    staging: str,
    severity: str = "DIFF",
    note: str = "",
) -> None:
    row = {
        "domain": domain,
        "item": item,
        "local_ssot": local,
        "staging_or_remote": staging,
        "severity": severity,
        "note": note,
    }
    if severity in ("RISK", "WARN"):
        risks.append(row)
    else:
        diffs.append(row)


def compare_contracts(
    meta: dict[str, Any], chain_env: dict[str, str], onboarding: dict[str, str]
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    diffs: list[dict[str, Any]] = []
    risks: list[dict[str, Any]] = []
    contracts = ((meta.get("chain") or {}).get("contracts") or {}) if isinstance(meta, dict) else {}
    reg_map = {
        "escrow_factory_address": "escrow_factory_address",
        "fee_router_address": "fee_router_address",
        "governor_address": "governor_address",
        "governance_token_address": "governance_token_address",
        "region_steward_stake_pool_address": "region_steward_stake_pool_address",
        "staking_address": "region_steward_stake_pool_address",
        "timelock_address": "timelock_address",
    }
    for meta_key, env_key in META_CONTRACT_KEYS:
        meta_v = str(contracts.get(meta_key) or "")
        env_v = chain_env.get(env_key) or onboarding.get(env_key) or ""
        reg_v = registry_val(reg_map.get(meta_key, meta_key))
        if meta_v and env_v and not addr_eq(meta_v, env_v):
            add_finding(
                diffs,
                risks,
                domain="治理参数/链上地址",
                item=f"meta.{meta_key} vs env.{env_key}",
                local=env_v,
                staging=meta_v,
                severity="DIFF",
            )
        if meta_v and reg_v and reg_v != "null" and not addr_eq(meta_v, reg_v):
            add_finding(
                diffs,
                risks,
                domain="Registry",
                item=f"meta.{meta_key} vs registry",
                local=reg_v,
                staging=meta_v,
                severity="DIFF",
            )
    return diffs, risks


def probe_login(api: str, email: str, password: str = "Test123!") -> dict[str, Any]:
    import time

    body = json.dumps({"email": email, "password": password}).encode()
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    last_err: Exception | None = None
    for attempt in range(4):
        req = urllib.request.Request(
            f"{api.rstrip('/')}/auth/login",
            data=body,
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            last_err = e
            if attempt < 3:
                time.sleep(1.5 * (attempt + 1))
                continue
            break
    try:
        proc = subprocess.run(
            [
                "curl",
                "-sS",
                "--max-time",
                "45",
                "-X",
                "POST",
                f"{api.rstrip('/')}/auth/login",
                "-H",
                "Content-Type: application/json",
                "-d",
                json.dumps({"email": email, "password": password}),
            ],
            capture_output=True,
            text=True,
            timeout=50,
            check=False,
        )
        if proc.stdout.strip():
            return json.loads(proc.stdout)
    except Exception:
        pass
    return {"error": str(last_err) if last_err else "probe_login failed"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--expect-sha",
        default=os.environ.get("PHASE2_BASELINE_SSOT_SHA") or git_head(),
    )
    ap.add_argument("--api-base", default=os.environ.get("STAGING_API_BASE", API_DEFAULT))
    ap.add_argument("--web-base", default=os.environ.get("STAGING_WEB_BASE", WEB_DEFAULT))
    ap.add_argument("--out-dir", default="")
    ap.add_argument("--deep-gate-report", default="")
    args = ap.parse_args()

    stamp = utc_stamp()
    out_dir = Path(args.out_dir) if args.out_dir else ROOT / "evidence/GO_phase2_baseline_consistency_audit" / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    api = args.api_base.rstrip("/")
    web = args.web_base.rstrip("/")
    expect = args.expect_sha.strip().lower()
    head = git_head().lower()
    dirty = git_dirty_deploy_paths()

    diffs: list[dict[str, Any]] = []
    risks: list[dict[str, Any]] = []

    # --- SHA ---
    api_sha, api_probe, meta_api = probe_api_git_sha(api)
    _, meta_web = http_json(f"{web}/meta", timeout=60)
    web_sha = str(((meta_web.get("build") or {}) if isinstance(meta_web, dict) else {}).get("git_sha") or "")

    if head != expect:
        add_finding(diffs, risks, domain="SHA", item="git HEAD vs --expect-sha", local=head, staging=expect, severity="DIFF")
    api_sha_l = api_sha.lower()
    expect_l = expect.lower()
    staging_deployed = api_sha_l if api_sha_l else ""
    local_ahead = False
    if staging_deployed and head != staging_deployed:
        local_ahead = git_is_ancestor(staging_deployed, head)
    if api_sha_l and api_sha_l != expect_l:
        if local_ahead and git_is_ancestor(api_sha_l, expect_l):
            add_finding(
                diffs,
                risks,
                domain="SHA",
                item="Local First · staging runtime vs HEAD",
                local=head[:12],
                staging=f"{api_sha[:12]} (deployed)",
                severity="WARN",
                note="LOCAL_AHEAD_UNDEPLOYED — not runtime drift; S5 deploy only",
            )
        elif api_sha_l != expect_l:
            add_finding(
                diffs,
                risks,
                domain="SHA",
                item=f"API git_sha (probe={api_probe})",
                local=expect,
                staging=api_sha or "(missing)",
                severity="DIFF",
            )
    if web_sha and web_sha.lower() != api_sha.lower():
        add_finding(diffs, risks, domain="SHA", item="Web /meta vs API git_sha", local=api_sha, staging=web_sha, severity="DIFF")
    if dirty:
        add_finding(
            diffs,
            risks,
            domain="SHA/工作区",
            item="deploy-path 未提交改动",
            local=f"clean @ {expect[:12]}",
            staging=f"{len(dirty)} paths dirty",
            severity="RISK",
            note="staging 镜像已部署 committed tree；工作区漂移不影响已部署 SHA，但下次 deploy 会带入",
        )

    # --- Frontend build.env ---
    be = load_env(BUILD_ENV)
    if be.get("NEXT_PUBLIC_API_BASE_URL") and be["NEXT_PUBLIC_API_BASE_URL"].rstrip("/") != api:
        add_finding(
            diffs,
            risks,
            domain="前端",
            item="build.env NEXT_PUBLIC_API_BASE_URL",
            local=be["NEXT_PUBLIC_API_BASE_URL"],
            staging=api,
            severity="DIFF",
        )
    if be.get("NEXT_PUBLIC_CHAIN_ID") and be["NEXT_PUBLIC_CHAIN_ID"] != "11155111":
        add_finding(
            diffs,
            risks,
            domain="前端",
            item="build.env NEXT_PUBLIC_CHAIN_ID",
            local=be["NEXT_PUBLIC_CHAIN_ID"],
            staging="11155111",
            severity="DIFF",
        )
    if isinstance(meta_api, dict):
        meta_gov = str(((meta_api.get("chain") or {}).get("contracts") or {}).get("governor_address") or "")
        be_gov = be.get("NEXT_PUBLIC_GOVERNOR_ADDRESS", "")
        if meta_gov and be_gov and not addr_eq(meta_gov, be_gov):
            add_finding(
                diffs,
                risks,
                domain="前端",
                item="build.env NEXT_PUBLIC_GOVERNOR vs /meta",
                local=be_gov,
                staging=meta_gov,
                severity="DIFF",
                note="fix locally before next Web deploy",
            )

    # --- Governance / registry / env ---
    chain_env = load_env(CHAIN_ENV)
    onboarding = load_env(ONBOARDING)
    merged_env = {**chain_env, **onboarding}
    c_diffs, c_risks = compare_contracts(meta_api if isinstance(meta_api, dict) else {}, chain_env, onboarding)
    diffs.extend(c_diffs)
    risks.extend(c_risks)

    # GovFreeze V2 governor in env vs meta (common drift)
    if merged_env.get("GOV_FREEZE_V2_GOVERNOR_ADDRESS") and merged_env.get("GOVERNOR_ADDRESS"):
        if not addr_eq(merged_env["GOV_FREEZE_V2_GOVERNOR_ADDRESS"], merged_env["GOVERNOR_ADDRESS"]):
            add_finding(
                diffs,
                risks,
                domain="治理参数",
                item="env GOV_FREEZE_V2_GOVERNOR vs GOVERNOR",
                local=merged_env["GOVERNOR_ADDRESS"],
                staging=merged_env["GOV_FREEZE_V2_GOVERNOR_ADDRESS"],
                severity="WARN",
                note="本地 env 双键并存 — 以 staging fly secrets 实际注入为准",
            )

    # --- Indexer (from /meta) ---
    if isinstance(meta_api, dict):
        idx = meta_api.get("indexer") or {}
        cp = idx.get("checkpoint") or {}
        if not cp.get("source"):
            add_finding(
                diffs,
                risks,
                domain="Indexer",
                item="meta.indexer.checkpoint",
                local="runtime checkpoint expected",
                staging=json.dumps(cp)[:200],
                severity="RISK",
                note="TN-P1-010 deep reconcile 仍 OPEN",
            )

    # --- Migrations ---
    local_mig = latest_migration_version()
    mig_count = len(list(MIG_DIR.glob("*.sql"))) if MIG_DIR.is_dir() else 0
    (out_dir / "local-migrations.json").write_text(
        json.dumps({"latest_version": local_mig, "file_count": mig_count}, indent=2),
        encoding="utf-8",
    )
    login = probe_login(api, "tourist@test.com")
    admin_mig: Any = None
    if login.get("token"):
        _code, admin_mig = http_get_json(
            f"{api}/api/v1/admin/schema/migrations",
            headers={"Authorization": f"Bearer {login['token']}"},
        )
    if isinstance(admin_mig, dict) and admin_mig.get("http_error") == 403:
        add_finding(
            diffs,
            risks,
            domain="数据库迁移",
            item="GET /admin/schema/migrations",
            local=f"repo latest={local_mig}",
            staging="403 non-admin token",
            severity="RISK",
            note="须 admin token 或 STAGING_DATABASE_URL sqlx migrate info 对拍",
        )
    elif isinstance(admin_mig, dict) and admin_mig.get("fetch_error"):
        add_finding(
            diffs,
            risks,
            domain="数据库迁移",
            item="GET /admin/schema/migrations",
            local=f"repo latest={local_mig}",
            staging=str(admin_mig.get("fetch_error"))[:120],
            severity="RISK",
            note="staging HTTPS flake — 重跑或 curl fallback",
        )
    elif isinstance(admin_mig, dict) and "migrations" in admin_mig:
        applied = admin_mig.get("migrations") or []
        (out_dir / "staging-admin-migrations.json").write_text(json.dumps(admin_mig, indent=2)[:8000], encoding="utf-8")
        if local_mig and applied:
            last_applied = str(applied[-1].get("version") or applied[-1]) if applied else ""
            if local_mig != last_applied and str(local_mig) not in str(last_applied):
                add_finding(
                    diffs,
                    risks,
                    domain="数据库迁移",
                    item="repo latest vs staging admin tail",
                    local=local_mig,
                    staging=last_applied,
                    severity="DIFF",
                )

    # --- Business chains (probe) ---
    roles = [
        ("traveler", "tourist@test.com"),
        ("guide", "guide@test.com"),
        ("merchant", "provider-did-rank-demo@test.com"),
    ]
    for label, email in roles:
        lg = probe_login(api, email)
        ok = lg.get("token") and lg.get("user_id")
        if not ok:
            add_finding(
                diffs,
                risks,
                domain="六角色/业务链",
                item=f"login {label}",
                local="seed account expected",
                staging=str(lg.get("error") or lg)[:120],
                severity="DIFF",
            )

    # governance proposals list
    if login.get("token"):
        _code, gov = http_get_json(
            f"{api}/api/v1/governance/proposals",
            headers={"Authorization": f"Bearer {login['token']}"},
        )
        if not isinstance(gov, (dict, list)):
            add_finding(
                diffs,
                risks,
                domain="治理",
                item="GET /governance/proposals",
                local="JSON list/object",
                staging=type(gov).__name__,
                severity="WARN",
            )
        elif isinstance(gov, dict) and gov.get("fetch_error"):
            add_finding(
                diffs,
                risks,
                domain="治理",
                item="GET /governance/proposals",
                local="200",
                staging=str(gov.get("fetch_error"))[:120],
                severity="DIFF",
            )

    # community feed
    code, feed = http_json(f"{api}/api/v1/community/feed?limit=1")
    if code != 200:
        add_finding(
            diffs,
            risks,
            domain="社区",
            item="GET /community/feed",
            local="200",
            staging=f"HTTP {code}",
            severity="DIFF",
        )

    # --- Deep gate report merge ---
    dg_path = Path(args.deep_gate_report) if args.deep_gate_report else None
    if not dg_path or not dg_path.is_file():
        latest = ROOT / "evidence/GO_phase2_testnet_20260526/deep-release-gate/latest-report.json"
        dg_path = latest if latest.is_file() else None
    deep_summary: dict[str, Any] = {}
    if dg_path and dg_path.is_file():
        dg = json.loads(dg_path.read_text(encoding="utf-8"))
        deep_summary = {"path": str(dg_path), "release_gate": dg.get("release_gate"), "gates": []}
        for g in dg.get("gates") or []:
            deep_summary["gates"].append({"id": g.get("id"), "verdict": g.get("verdict")})
            if g.get("verdict") != "PASS":
                for chk in g.get("checks") or []:
                    if not chk.get("pass"):
                        add_finding(
                            diffs,
                            risks,
                            domain=f"DeepGate/{g.get('id')}",
                            item=chk.get("name") or chk.get("id") or "?",
                            local="PASS expected",
                            staging=str(chk.get("detail") or chk.get("message") or "")[:200],
                            severity="DIFF" if g.get("verdict") == "FAIL" else "WARN",
                        )

    # --- Known OPEN risks (no fix) ---
    freeze_active = (ROOT / "evidence/TESTNET_STAGING_FREEZE/ACTIVE.json").is_file()
    open_risks = [
        ("TN-P1-009", "P2FC 72h soak 未 COMPLETED"),
        ("TN-P1-010", "Indexer deep reconcile OPEN"),
        ("CERT-7..9", "Timelock/钱包闸 · Wave 1 未执行"),
    ]
    if not freeze_active:
        open_risks.append(
            ("TESTNET_STAGING_FREEZE", "已 LIFTED · SHA sync 后 staging 可再 deploy"),
        )
    else:
        open_risks.append(
            ("TESTNET_STAGING_FREEZE", "ACTIVE · baseline frozen · TL#1 Wave 1 wait"),
        )
    if dirty:
        open_risks.append(
            ("1057+ untracked docs", "未纳入 SSOT commit · 不影响 staging 运行 SHA"),
        )
    for item, note in open_risks:
        add_finding(diffs, risks, domain="Phase② 剩余闸", item=item, local="OPEN", staging="—", severity="RISK", note=note)

    payload = {
        "schema": "traveltrust.phase2_baseline_consistency_audit.v1",
        "stamp_utc": stamp,
        "ssot_sha": expect,
        "git_head": head,
        "api_sha": api_sha,
        "api_sha_probe": api_probe,
        "web_sha": web_sha,
        "sha_hard_match": bool(api_sha) and api_sha.lower() == expect and head == expect,
        "diff_count": len(diffs),
        "risk_count": len(risks),
        "diffs": diffs,
        "risks": risks,
        "deep_gate": deep_summary,
        "local_migrations": {"latest": local_mig, "count": mig_count},
    }
    (out_dir / "audit.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    lines = [
        "# Phase ② · 测试网全量一致性审计（只读）",
        "",
        f"**SSOT SHA:** `{expect}`",
        f"**审计时间:** {stamp} UTC",
        f"**staging API:** {api} · **Web:** {web}",
        "",
        "## 总览",
        "",
        f"| 项 | 值 |",
        f"|----|-----|",
        f"| git HEAD | `{head}` |",
        f"| API git_sha (probe={api_probe}) | `{api_sha}` |",
        f"| Web /meta SHA | `{web_sha or 'n/a'}` |",
        f"| **SHA Hard Match** | **{'YES' if payload['sha_hard_match'] else 'NO'}** |",
        f"| 差异项 | {len(diffs)} |",
        f"| 风险项 | {len(risks)} |",
        "",
        "**诚实边界：** 本审计 **≠** Wave 1 / Soak / 真人验收 **≠** ③ Production GO",
        "",
        "## 差异项（DIFF / WARN）",
        "",
    ]
    if not diffs:
        lines.append("_无机器探测差异（SHA 与抽样链路一致）_")
    else:
        lines.append("| 域 | 项 | 本地 SSOT | 测试网/远程 | 严重度 | 备注 |")
        lines.append("|----|-----|-----------|-------------|--------|------|")
        for d in diffs:
            lines.append(
                f"| {d['domain']} | {d['item']} | `{d['local_ssot'][:48]}` | `{d['staging_or_remote'][:48]}` | {d['severity']} | {d.get('note','')} |"
            )

    lines.extend(["", "## 风险项（RISK · 不阻断已部署 SHA）", ""])
    for r in risks:
        lines.append(f"- **{r['domain']} · {r['item']}** — {r.get('note') or r['staging_or_remote']}")

    if deep_summary:
        lines.extend(["", "## Deep Release Gate 摘要", ""])
        lines.append(f"- release_gate: `{deep_summary.get('release_gate')}`")
        for g in deep_summary.get("gates") or []:
            lines.append(f"- {g['id']}: **{g['verdict']}**")

    lines.extend(["", f"机读：`{out_dir}/audit.json`", ""])
    (out_dir / "AUDIT-REPORT.md").write_text("\n".join(lines), encoding="utf-8")

    print(f"TT_PHASE2_BASELINE_CONSISTENCY_AUDIT: OK stamp={stamp}")
    print(f"  sha_hard_match={'YES' if payload['sha_hard_match'] else 'NO'} diffs={len(diffs)} risks={len(risks)}")
    print(f"  report={out_dir}/AUDIT-REPORT.md")
    sys.exit(0)


if __name__ == "__main__":
    main()
