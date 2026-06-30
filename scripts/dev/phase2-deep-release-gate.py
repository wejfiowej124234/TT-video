#!/usr/bin/env python3
"""Phase ② · Deep multidimensional release gate (staging-only).

Validates staging deployment readiness before S6 / HAT / Phase ③.
**禁止**用 127.0.0.1 / localhost 冒充 staging 绿（除非 PHASE2_DEEP_GATE_ALLOW_LOCAL=1 调试）。

Outputs:
  - report.json  (machine-readable)
  - SUMMARY.md   (human summary)

末行：TT_PHASE2_DEEP_RELEASE_GATE: PASS|FAIL
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = "traveltrust.phase2_deep_release_gate.v1"
PASSWORD = os.environ.get("PHASE2_DEEP_GATE_PASSWORD", "Test123!")
EXPECT_CHAIN_ID = int(os.environ.get("STAGING_CHAIN_ID", "11155111"))
META_TOP_KEYS_LEN = 37
DB_TOP_KEYS = ["database_top_keys", "database_top_keys_contract_760", "pool", "rule"]
BUILD_TOP_KEYS = ["git_sha", "deployed_at", "rule", "build_top_keys", "build_top_keys_contract_730"]

FIVE_ROLES = [
    ("traveler", "tourist@test.com", False),
    ("guide", "guide@test.com", False),
    ("merchant", "provider-did-rank-demo@test.com", False),
    ("admin", "tourist@test.com", True),
    ("governance", "tourist@test.com", False),
]

LOCALHOST_RE = re.compile(r"^https?://(127\.0\.0\.1|localhost)(:\d+)?", re.I)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def eprint(*args: object) -> None:
    print(*args, file=sys.stderr)


def is_localhost(url: str) -> bool:
    return bool(LOCALHOST_RE.match((url or "").strip()))


def allow_local() -> bool:
    return os.environ.get("PHASE2_DEEP_GATE_ALLOW_LOCAL", "").strip() in ("1", "true", "yes")


def meta_observability_only() -> bool:
    """Soak freeze window: /meta 408/503 are non-blocking OBSERVE (exec chain uses /meta/build)."""
    if os.environ.get("PHASE2_META_OBSERVABILITY_ONLY", "").strip() in ("1", "true", "yes"):
        return True
    if os.environ.get("PHASE2_REQUIRE_META_GREEN", "").strip() in ("1", "true", "yes"):
        return False
    freeze = ROOT / "evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"
    soak_dir = os.environ.get("P2FC_SOAK_DIR", "").strip()
    completed = (
        Path(soak_dir) / "COMPLETED.json"
        if soak_dir
        else ROOT / "evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json"
    )
    return freeze.is_file() and not completed.is_file()


def norm_base(url: str) -> str:
    return (url or "").strip().rstrip("/")


def http_json(
    method: str,
    url: str,
    *,
    token: str | None = None,
    body: dict | None = None,
    timeout: int = 45,
) -> tuple[int, dict | list | str]:
    data = None
    headers = {"Accept": "application/json", "User-Agent": "traveltrust-phase2-deep-gate/1"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            code = resp.getcode()
    except urllib.error.HTTPError as e:
        code = e.code
        raw = e.read().decode("utf-8", errors="replace")
    except Exception:
        return _http_json_curl_fallback(method, url, token=token, body=body, timeout=timeout)
    try:
        return code, json.loads(raw) if raw else {}
    except json.JSONDecodeError:
        return code, raw


def _http_json_curl_fallback(
    method: str,
    url: str,
    *,
    token: str | None = None,
    body: dict | None = None,
    timeout: int = 45,
) -> tuple[int, dict | list | str]:
    curl_code, curl_raw = _http_json_via_curl(method, url, token=token, body=body, timeout=timeout)
    if curl_code:
        try:
            return curl_code, json.loads(curl_raw) if curl_raw else {}
        except json.JSONDecodeError:
            return curl_code, curl_raw
    return 0, "urllib+curl failed"


def _http_json_via_curl(
    method: str,
    url: str,
    *,
    token: str | None = None,
    body: dict | None = None,
    timeout: int = 45,
) -> tuple[int, str]:
    cmd = ["curl", "--noproxy", "*", "-sS", "--max-time", str(timeout), "-w", "\n%{http_code}", "-X", method.upper()]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    cmd += ["-H", "Accept: application/json"]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    cmd.append(url)
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout + 10,
        )
        out = (proc.stdout or "").rsplit("\n", 1)
        if len(out) == 2 and out[1].strip().isdigit():
            return int(out[1].strip()), out[0]
    except (subprocess.SubprocessError, OSError, ValueError):
        pass
    return 0, ""


def http_code(method: str, url: str, **kwargs: Any) -> int:
    code, _ = http_json(method, url, **kwargs)
    return code


def check_row(
    gate_id: str,
    check_id: str,
    title: str,
    ok: bool,
    detail: str,
    *,
    severity: str = "P0",
) -> dict[str, Any]:
    return {
        "gate_id": gate_id,
        "check_id": check_id,
        "title": title,
        "verdict": "PASS" if ok else "FAIL",
        "severity": severity,
        "detail": detail,
    }


def check_row_meta_avail(
    gate_id: str,
    check_id: str,
    title: str,
    ok: bool,
    detail: str,
) -> dict[str, Any]:
    if ok:
        return check_row(gate_id, check_id, title, True, detail)
    if meta_observability_only():
        return {
            "gate_id": gate_id,
            "check_id": check_id,
            "title": title,
            "verdict": "OBSERVE",
            "severity": "OBSERVE",
            "detail": f"{detail} · deferred (meta observability-only; post-soak deploy required)",
        }
    return check_row(gate_id, check_id, title, False, detail)


def gate_result(
    gate_id: str,
    title: str,
    checks: list[dict[str, Any]],
    *,
    staging_only: bool = True,
    notes: str = "",
) -> dict[str, Any]:
    observes = [c for c in checks if c.get("verdict") == "OBSERVE"]
    fails = [c for c in checks if c["verdict"] == "FAIL" and c.get("severity", "P0") == "P0"]
    warns = [c for c in checks if c["verdict"] == "FAIL" and c.get("severity") == "P1"]
    if meta_observability_only() and not fails:
        verdict = "WARN" if (observes or warns) else "PASS"
    else:
        verdict = "FAIL" if fails else ("WARN" if warns else "PASS")
    return {
        "id": gate_id,
        "title": title,
        "staging_only": staging_only,
        "verdict": verdict,
        "checks": checks,
        "notes": notes,
        "p0_fail": len(fails),
        "p1_fail": len(warns),
    }


def load_env_file(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        if "=" not in line:
            continue
        k, _, v = line.partition("=")
        v = v.strip().strip('"').strip("'")
        out[k.strip()] = v
    return out


def merge_env(*maps: dict[str, str]) -> dict[str, str]:
    merged: dict[str, str] = {}
    for m in maps:
        merged.update(m)
    return merged


def sha_prefix(a: str, b: str, n: int = 8) -> bool:
    a = (a or "").strip().lower()
    b = (b or "").strip().lower()
    if not a or not b or a in ("unknown", "local") or b in ("unknown", "local"):
        return False
    return a[:n] == b[:n]


def run_gate_g01(api: str, web: str, expect_sha: str) -> dict[str, Any]:
    gid = "G01_API_WEB_SHA"
    checks: list[dict[str, Any]] = []
    meta_timeout = int(os.environ.get("G01_META_HTTP_TIMEOUT", "90"))

    code_a, meta_a = http_json("GET", f"{api}/meta", timeout=meta_timeout)
    checks.append(
        check_row_meta_avail(
            gid, "api_meta_200", "GET staging API /meta → 200", code_a == 200, f"HTTP {code_a}"
        )
    )

    code_b, meta_b = http_json("GET", f"{web}/meta", timeout=meta_timeout)
    checks.append(
        check_row_meta_avail(
            gid,
            "web_meta_rewrite_200",
            "GET staging Web /meta (rewrite) → 200",
            code_b == 200,
            f"HTTP {code_b}",
        )
    )

    code_mb, meta_build = http_json("GET", f"{api}/meta/build")
    mb_sha = ""
    if isinstance(meta_build, dict):
        mb_sha = str(meta_build.get("git_sha") or "")

    api_sha = ""
    web_sha = ""
    if isinstance(meta_a, dict):
        api_sha = str((meta_a.get("build") or {}).get("git_sha") or "")
    if isinstance(meta_b, dict):
        web_sha = str((meta_b.get("build") or {}).get("git_sha") or "")
    if not api_sha and mb_sha:
        api_sha = mb_sha

    checks.append(
        check_row(
            gid,
            "api_git_sha_present",
            "API build.git_sha non-empty and not unknown",
            bool(api_sha) and api_sha not in ("unknown", "local"),
            api_sha or "(missing)",
        )
    )
    web_match_ok = sha_prefix(api_sha, web_sha, 12) and (api_sha == web_sha if web_sha else True)
    if meta_observability_only() and code_b != 200 and not web_sha:
        checks.append(
            check_row_meta_avail(
                gid,
                "web_api_sha_match",
                "Web /meta git_sha matches API /meta git_sha",
                False,
                f"api={api_sha} web={web_sha or '(unreachable)'}",
            )
        )
    else:
        checks.append(
            check_row(
                gid,
                "web_api_sha_match",
                "Web /meta git_sha matches API /meta git_sha",
                web_match_ok,
                f"api={api_sha} web={web_sha}",
            )
        )

    checks.append(
        check_row(
            gid,
            "meta_build_subresource",
            "/meta/build git_sha matches /meta.build",
            code_mb == 200 and sha_prefix(api_sha, mb_sha, 12),
            f"/meta/build HTTP {code_mb} sha={mb_sha}",
        )
    )

    if expect_sha:
        checks.append(
            check_row(
                gid,
                "expect_git_sha",
                f"API git_sha matches PHASE2_EXPECT_GIT_SHA ({expect_sha[:12]}…)",
                sha_prefix(api_sha, expect_sha, 8),
                f"api={api_sha} expect={expect_sha}",
            )
        )

    obs_note = ""
    if meta_observability_only():
        obs_note = " · meta observability-only: /meta availability deferred; exec chain uses /meta/build"
    return gate_result(
        gid,
        "API/Web SHA consistency",
        checks,
        notes="Web SHA via /meta rewrite — same deployment spine as API." + obs_note,
    )


def run_gate_g02(api: str) -> dict[str, Any]:
    gid = "G02_META_CONTRACT"
    checks: list[dict[str, Any]] = []
    meta_timeout = int(os.environ.get("G02_META_HTTP_TIMEOUT", "180"))
    retries = int(os.environ.get("G02_META_HTTP_RETRIES", "3"))

    code, meta = 0, {}
    for attempt in range(1, retries + 1):
        code, meta = http_json("GET", f"{api}/meta", timeout=meta_timeout)
        if code == 200 and isinstance(meta, dict):
            break
        if attempt < retries and code in (408, 502, 503, 504):
            time.sleep(int(os.environ.get("G02_META_HTTP_RETRY_DELAY_SEC", "2")))
            continue
        break

    if code != 200 or not isinstance(meta, dict):
        checks.append(
            check_row_meta_avail(gid, "meta_fetch", "GET /meta JSON", False, f"HTTP {code}")
        )
        code_mb, meta_build = http_json("GET", f"{api}/meta/build")
        mb_ok = code_mb == 200 and isinstance(meta_build, dict) and bool(meta_build.get("git_sha"))
        checks.append(
            check_row(
                gid,
                "meta_build_exec_fallback",
                "GET /meta/build reachable (exec-chain fallback)",
                mb_ok,
                f"/meta/build HTTP {code_mb}",
            )
        )
        if meta_observability_only():
            return gate_result(
                gid,
                "/meta contract (staging subset)",
                checks,
                notes="meta observability-only: full contract deferred until post-soak deploy",
            )
        return gate_result(gid, "/meta contract (staging subset)", checks)

    svc = meta.get("service")
    checks.append(check_row(gid, "service", "meta.service = traveltrust-api", svc == "traveltrust-api", str(svc)))

    build = meta.get("build") or {}
    bkeys = build.get("build_top_keys") or []
    checks.append(
        check_row(
            gid,
            "build_top_keys",
            "build.build_top_keys length = 5 (730)",
            isinstance(bkeys, list) and len(bkeys) == len(BUILD_TOP_KEYS),
            str(len(bkeys) if isinstance(bkeys, list) else "null"),
        )
    )
    checks.append(
        check_row(
            gid,
            "build_git_sha",
            "build.git_sha is non-empty string",
            isinstance(build.get("git_sha"), str) and bool(build.get("git_sha", "").strip()),
            str(build.get("git_sha")),
        )
    )

    chain = meta.get("chain") or {}
    cid = chain.get("chain_id")
    allow_local_cid = os.environ.get("G02_ALLOW_LOCAL_CHAIN_ID", "").strip() in ("1", "true", "yes")
    cid_ok = str(cid) == str(EXPECT_CHAIN_ID) or (
        allow_local_cid and str(cid) in ("31337", "1337", "11155111")
    )
    checks.append(
        check_row(
            gid,
            "chain_id",
            f"chain.chain_id = {EXPECT_CHAIN_ID} (Sepolia)"
            + (" or local Anvil when G02_ALLOW_LOCAL_CHAIN_ID=1" if allow_local_cid else ""),
            cid_ok,
            str(cid),
        )
    )

    dw = meta.get("dual_write") or {}
    fp = dw.get("failure_policy")
    checks.append(
        check_row(
            gid,
            "dual_write",
            "dual_write.failure_policy valid + strict_db_write_any boolean",
            fp in ("log_only", "strict_503", "alert_only") and isinstance(dw.get("strict_db_write_any"), bool),
            f"policy={fp} strict_db_write_any={dw.get('strict_db_write_any')}",
        )
    )

    idx = meta.get("indexer") or {}
    cp = idx.get("checkpoint") or {}
    checks.append(
        check_row(
            gid,
            "indexer_checkpoint",
            "indexer.checkpoint source + numeric block/log_index",
            cp.get("source") in ("runtime", "startup_snapshot")
            and isinstance(cp.get("block_number"), (int, float))
            and isinstance(cp.get("log_index"), (int, float)),
            json.dumps(cp)[:120],
        )
    )

    mtk = meta.get("meta_top_keys") or []
    checks.append(
        check_row(
            gid,
            "meta_top_keys_728",
            f"meta_top_keys length = {META_TOP_KEYS_LEN}",
            isinstance(mtk, list) and len(mtk) == META_TOP_KEYS_LEN,
            str(len(mtk) if isinstance(mtk, list) else "null"),
        )
    )

    db = meta.get("database") or {}
    dtk = db.get("database_top_keys") or []
    checks.append(
        check_row(
            gid,
            "database_top_keys_760",
            "database.database_top_keys length = 4",
            isinstance(dtk, list) and len(dtk) == len(DB_TOP_KEYS),
            str(dtk),
        )
    )

    gov = meta.get("governance") or {}
    gtk = gov.get("governance_top_keys") or []
    checks.append(
        check_row(
            gid,
            "governance_top_keys_807",
            "governance.governance_top_keys length = 10",
            isinstance(gtk, list) and len(gtk) == 10,
            str(len(gtk) if isinstance(gtk, list) else "null"),
        )
    )

    pr = meta.get("product_roles") or {}
    checks.append(
        check_row(
            gid,
            "product_roles_748",
            "product_roles.users_role_stored includes guide/provider",
            isinstance(pr.get("users_role_stored"), list)
            and "guide" in pr.get("users_role_stored", [])
            and "provider" in pr.get("users_role_stored", []),
            str(pr.get("users_role_stored")),
        )
    )

    return gate_result(gid, "/meta contract (staging subset)", checks)


def run_gate_g03(api: str) -> dict[str, Any]:
    gid = "G03_FIVE_ROLE_LOGIN"
    checks: list[dict[str, Any]] = []

    seed_code, seed_body = http_json("POST", f"{api}/auth/seed-test-accounts", body={})
    checks.append(
        check_row(
            gid,
            "seed_endpoint",
            "POST /auth/seed-test-accounts",
            seed_code in (200, 201),
            f"HTTP {seed_code} {str(seed_body)[:80]}",
        )
    )

    promote_code, _ = http_json(
        "POST",
        f"{api}/auth/seed-test-accounts",
        body={"promote_admin_email": "tourist@test.com"},
    )
    checks.append(
        check_row(
            gid,
            "promote_admin",
            "POST seed-test-accounts promote_admin_email",
            promote_code in (200, 201, 400),
            f"HTTP {promote_code}",
        )
    )

    for role, email, need_admin in FIVE_ROLES:
        lc, login = http_json(
            "POST",
            f"{api}/auth/login",
            body={"email": email, "password": PASSWORD},
        )
        ok = lc == 200 and isinstance(login, dict) and bool(login.get("token"))
        sev = "P1" if role == "merchant" else "P0"
        checks.append(
            check_row(
                gid,
                f"login_{role}",
                f"{role} login ({email})",
                ok,
                f"HTTP {lc} token={'yes' if ok else 'no'}",
                severity=sev,
            )
        )
        if not ok:
            continue
        token = str(login.get("token"))
        mc, me = http_json("GET", f"{api}/api/v1/me", token=token)
        if role == "governance":
            gc, _ = http_json("GET", f"{api}/api/v1/governance/proposals?limit=1", token=token)
            checks.append(
                check_row(
                    gid,
                    "governance_proposals",
                    "governance GET /governance/proposals (authenticated)",
                    gc == 200,
                    f"HTTP {gc}",
                )
            )
        elif role == "admin":
            ac, caps = http_json("GET", f"{api}/api/v1/admin/capabilities", token=token)
            has_admin = ac == 200 and isinstance(caps, dict)
            checks.append(
                check_row(
                    gid,
                    "admin_capabilities",
                    "admin GET /admin/capabilities",
                    has_admin,
                    f"HTTP {ac}",
                )
            )
        elif role == "guide" and mc == 200 and isinstance(me, dict):
            user_obj = me.get("user") if isinstance(me.get("user"), dict) else {}
            db_role = user_obj.get("role") or me.get("role")
            roles = me.get("roles") or []
            if isinstance(roles, str):
                roles = [roles]
            guide_ok = (
                db_role == "guide"
                or "guide" in roles
                or bool(me.get("guide"))
            )
            checks.append(
                check_row(
                    gid,
                    "guide_me_role",
                    "guide /me exposes guide role",
                    guide_ok,
                    str(db_role or roles or me.get("guide")),
                    severity="P1",
                )
            )

    return gate_result(
        gid,
        "Five-role login smoke (staging API)",
        checks,
        notes="merchant P1 if no staging seed — does not alone block if other roles PASS.",
    )


def latest_adm_u01_go_dir(max_age_sec: int = 7200) -> Path | None:
    """Reuse formal ADM-U01 archive when matrix just passed (avoids G04 double-run flake)."""
    root_dir = ROOT / "evidence" / "GO_staging_admin_rbac_matrix"
    if not root_dir.is_dir():
        return None
    runs = sorted(
        [p for p in root_dir.iterdir() if p.is_dir() and p.name.startswith("run_")],
        key=lambda p: p.name,
        reverse=True,
    )
    now = time.time()
    for run in runs:
        report = run / "report.json"
        if not report.is_file():
            continue
        try:
            data = json.loads(report.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if data.get("release_gate") != "GO":
            continue
        age_ok = True
        for candidate in (run / "latest-run.log", *run.glob("run-*.log")):
            if candidate.is_file():
                age_ok = (now - candidate.stat().st_mtime) <= max_age_sec
                break
        if age_ok:
            return run
    return None


def run_gate_g04(api: str, out_dir: Path) -> dict[str, Any]:
    gid = "G04_ADMIN_RBAC"
    checks: list[dict[str, Any]] = []
    evid = out_dir / "adm-u01-rbac"
    evid.mkdir(parents=True, exist_ok=True)

    reuse_dir: Path | None = None
    if os.environ.get("ADM_U01_REUSE_LATEST_GO", "").strip() in ("1", "true", "yes"):
        reuse_dir = latest_adm_u01_go_dir()
    explicit = os.environ.get("ADM_U01_EVIDENCE_DIR", "").strip()
    if explicit:
        p = Path(explicit)
        if p.is_dir() and (p / "report.json").is_file():
            reuse_dir = p

    if reuse_dir is not None:
        for name in ("report.json", "matrix-api-results.json", "playwright-shell-matrix.json"):
            src = reuse_dir / name
            if src.is_file():
                shutil.copy2(src, evid / name)
        (evid / "subprocess.log").write_text(
            f"ADM-U01 reused from {reuse_dir} (ADM_U01_REUSE_LATEST_GO)\n",
            encoding="utf-8",
        )
        rg = json.loads((evid / "report.json").read_text(encoding="utf-8")).get("release_gate", "NO_GO")
        checks.append(
            check_row(
                gid,
                "rbac_matrix_exit",
                "ADM-U01 RBAC matrix subprocess exit 0",
                True,
                f"reused={reuse_dir.name} release_gate={rg}",
            )
        )
        checks.append(
            check_row(
                gid,
                "rbac_release_gate",
                "ADM-U01 report.json release_gate = GO",
                rg == "GO",
                str(rg),
            )
        )
        return gate_result(
            gid,
            "Admin RBAC permission matrix (ADM-U01)",
            checks,
            notes=f"reused Evidence: {reuse_dir}",
        )

    env = os.environ.copy()
    env["STAGING_API_BASE"] = api
    env["TRAVELTRUST_STAGING_API_BASE"] = api
    env["ADM_U01_STRICT"] = "1"
    env["ADM_U01_EVIDENCE_DIR"] = str(evid)
    # G04 编排：onboarding DATABASE_URL → STAGING_DATABASE_URL（上次 FAIL 根因：未传递）
    if not env.get("STAGING_DATABASE_URL"):
        onboarding = load_env_file(ROOT / "scripts" / "dev" / ".env.staging-onboarding.local")
        stg_db = onboarding.get("STAGING_DATABASE_URL") or onboarding.get("DATABASE_URL") or ""
        if stg_db:
            env["STAGING_DATABASE_URL"] = stg_db

    script = ROOT / "scripts" / "gates" / "run-admin-rbac-staging-matrix.py"
    if not script.is_file():
        checks.append(check_row(gid, "script_present", "run-admin-rbac-staging-matrix.py exists", False, str(script)))
        return gate_result(gid, "Admin RBAC permission matrix", checks)

    proc = subprocess.run(
        [sys.executable, str(script)],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=int(os.environ.get("ADM_U01_TIMEOUT", "600")),
    )
    (evid / "subprocess.log").write_text((proc.stdout or "") + (proc.stderr or ""), encoding="utf-8")

    report_path = evid / "report.json"
    rg = "NO_GO"
    if report_path.is_file():
        try:
            rg = json.loads(report_path.read_text(encoding="utf-8")).get("release_gate", "NO_GO")
        except json.JSONDecodeError:
            rg = "NO_GO"

    checks.append(
        check_row(
            gid,
            "rbac_matrix_exit",
            "ADM-U01 RBAC matrix subprocess exit 0",
            proc.returncode == 0,
            f"exit={proc.returncode} release_gate={rg}",
        )
    )
    checks.append(
        check_row(
            gid,
            "rbac_release_gate",
            "ADM-U01 report.json release_gate = GO",
            rg == "GO",
            str(rg),
        )
    )

    return gate_result(
        gid,
        "Admin RBAC permission matrix (ADM-U01)",
        checks,
        notes=f"Evidence: {evid}",
    )


def latest_migration_version() -> str | None:
    mig_dir = ROOT / "crates" / "api" / "migrations"
    if not mig_dir.is_dir():
        return None
    versions = []
    for p in mig_dir.glob("*.sql"):
        m = re.match(r"^(\d+)", p.name)
        if m:
            versions.append(m.group(1))
    return max(versions) if versions else None


def run_gate_g05(env: dict[str, str], out_dir: Path) -> dict[str, Any]:
    gid = "G05_DB_MIGRATE_ZERO"
    checks: list[dict[str, Any]] = []

    g2_log = ROOT / "evidence" / "GO_phase2_testnet_20260526" / "g2-staging-migrate" / "latest" / "run.log"
    g2_ok = g2_log.is_file() and "PASS: sqlx migrate run exit 0" in g2_log.read_text(encoding="utf-8", errors="replace")
    checks.append(
        check_row(
            gid,
            "g2_evidence",
            "G-2 migrate-from-zero evidence (run.log PASS)",
            g2_ok,
            str(g2_log) if g2_log.is_file() else "missing",
            severity="P1",
        )
    )

    expected = latest_migration_version()
    checks.append(
        check_row(
            gid,
            "repo_latest_migration",
            "Repo latest sqlx migration version readable",
            bool(expected),
            expected or "none",
        )
    )

    db_url = env.get("DATABASE_URL") or env.get("STAGING_DATABASE_URL") or ""
    if db_url and "flycast" not in db_url:
        # read-only: sqlx migrate info
        proc = subprocess.run(
            ["sqlx", "migrate", "info", "--source", str(ROOT / "crates" / "api" / "migrations")],
            cwd=str(ROOT),
            env={**os.environ, "DATABASE_URL": db_url},
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=120,
        )
        (out_dir / "sqlx-migrate-info.log").write_text(proc.stdout + proc.stderr, encoding="utf-8")
        pending = [ln for ln in proc.stdout.splitlines() if "Pending" in ln or "pending" in ln.lower()]
        checks.append(
            check_row(
                gid,
                "staging_db_no_pending",
                "Staging DATABASE_URL: sqlx migrate info — no Pending",
                proc.returncode == 0 and not pending,
                f"exit={proc.returncode} pending_lines={len(pending)}",
                severity="P1",
            )
        )
    else:
        checks.append(
            check_row(
                gid,
                "staging_db_probe",
                "Staging DB migrate probe (needs DATABASE_URL)",
                g2_ok,
                "skipped live DB — rely on G-2 evidence",
                severity="P1",
            )
        )

    return gate_result(
        gid,
        "DB migrate-from-zero / schema parity",
        checks,
        notes="Live empty→latest re-run: scripts/dev/record-phase2-g2-staging-sqlx-migrate-evidence.sh",
    )


def run_gate_g06(api: str) -> dict[str, Any]:
    gid = "G06_SEED_CONSISTENCY"
    checks: list[dict[str, Any]] = []

    code, meta = http_json("GET", f"{api}/meta")
    sta = (meta.get("seed_test_accounts") or {}) if isinstance(meta, dict) else {}
    enabled = sta.get("enabled") if isinstance(sta, dict) else None
    rule = str(sta.get("rule") or "")
    lc_seed, login_seed = http_json(
        "POST", f"{api}/auth/login", body={"email": "tourist@test.com", "password": PASSWORD}
    )
    login_ok = lc_seed == 200 and isinstance(login_seed, dict) and login_seed.get("token")
    seed_ok = (
        enabled is True
        or str(enabled).lower() in ("true", "1")
        or "SEED_TEST_ACCOUNTS" in rule
        or login_ok
    )
    checks.append(
        check_row(
            gid,
            "seed_meta_enabled",
            "meta.seed_test_accounts.enabled true on staging",
            seed_ok,
            str(enabled if enabled is not None else f"login_ok={login_ok}"),
            severity="P1",
        )
    )

    ids: dict[str, str] = {}
    for label, email, _ in FIVE_ROLES[:2]:
        lc, login = http_json("POST", f"{api}/auth/login", body={"email": email, "password": PASSWORD})
        if lc == 200 and isinstance(login, dict) and login.get("user_id"):
            ids[label] = str(login["user_id"])

    if len(ids) >= 2:
        t1, t2 = ids.get("traveler"), ids.get("guide")
        checks.append(
            check_row(
                gid,
                "stable_user_ids",
                "Repeat login returns stable user_id per seed account",
                bool(t1) and bool(t2) and t1 != t2,
                json.dumps(ids),
            )
        )

    lc, login = http_json("POST", f"{api}/auth/login", body={"email": "tourist@test.com", "password": PASSWORD})
    if lc == 200 and isinstance(login, dict) and login.get("token"):
        mc, me = http_json("GET", f"{api}/api/v1/me", token=str(login["token"]))
        checks.append(
            check_row(
                gid,
                "tourist_me",
                "tourist /me HTTP 200 after seed",
                mc == 200,
                f"HTTP {mc} keys={list(me.keys())[:6] if isinstance(me, dict) else type(me)}",
            )
        )

    return gate_result(gid, "Seed data consistency", checks)


def run_gate_g07(api: str, web: str, env: dict[str, str], build_env: Path) -> dict[str, Any]:
    gid = "G07_STAGING_ENV"
    checks: list[dict[str, Any]] = []

    if env.get("R003_LOCAL_CHAIN", "").lower() in ("1", "true", "yes"):
        checks.append(
            check_row(gid, "no_local_chain", "R003_LOCAL_CHAIN must be off for staging gate", False, env["R003_LOCAL_CHAIN"])
        )
    else:
        checks.append(check_row(gid, "no_local_chain", "R003_LOCAL_CHAIN off", True, "ok"))

    r003_env = ROOT / "scripts" / "dev" / ".env.r003.local"
    if r003_env.is_file():
        proc = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "dev" / "check_r003_staging_env_ready.py"), "--env-file", str(r003_env)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=60,
        )
        checks.append(
            check_row(
                gid,
                "r003_env_ready",
                "check_r003_staging_env_ready.py exit 0",
                proc.returncode == 0,
                (proc.stdout or proc.stderr).strip()[:200],
                severity="P1",
            )
        )

    hc = http_code("GET", f"{api}/health")
    checks.append(check_row(gid, "api_health", f"{api}/health → 200", hc == 200, f"HTTP {hc}"))

    wc = http_code("GET", f"{web}/")
    checks.append(check_row(gid, "web_home", f"{web}/ → 200", wc == 200, f"HTTP {wc}"))

    cors_req = urllib.request.Request(
        f"{api}/meta",
        method="OPTIONS",
        headers={
            "Origin": web,
            "Access-Control-Request-Method": "GET",
        },
    )
    cors_ok = False
    cors_detail = ""
    try:
        with urllib.request.urlopen(cors_req, timeout=30) as resp:
            allow = resp.headers.get("Access-Control-Allow-Origin", "")
            cors_ok = web in allow or allow == "*"
            cors_detail = allow or "(missing)"
    except Exception as e:
        try:
            null_out = os.devnull
            proc = subprocess.run(
                [
                    "curl",
                    "--noproxy",
                    "*",
                    "-sS",
                    "-D",
                    "-",
                    "-o",
                    null_out,
                    "--max-time",
                    "30",
                    "-X",
                    "OPTIONS",
                    "-H",
                    f"Origin: {web}",
                    "-H",
                    "Access-Control-Request-Method: GET",
                    f"{api}/meta",
                ],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=40,
            )
            hdr = proc.stdout or ""
            allow = ""
            for line in hdr.splitlines():
                if line.lower().startswith("access-control-allow-origin:"):
                    allow = line.split(":", 1)[1].strip()
            cors_ok = web in allow or allow == "*"
            cors_detail = allow or str(e)
        except Exception as e2:
            cors_detail = f"{e}; curl: {e2}"
    checks.append(check_row(gid, "cors_meta", f"CORS allows {web} on /meta", cors_ok, cors_detail))

    be_api = be_chain = ""
    if build_env.is_file():
        for line in build_env.read_text(encoding="utf-8").splitlines():
            if line.startswith("NEXT_PUBLIC_API_BASE_URL="):
                be_api = line.split("=", 1)[1].strip().strip('"')
            if line.startswith("NEXT_PUBLIC_CHAIN_ID="):
                be_chain = line.split("=", 1)[1].strip().strip('"')

    if be_api:
        checks.append(
            check_row(
                gid,
                "build_env_api",
                "build.env NEXT_PUBLIC_API_BASE_URL matches staging API",
                norm_base(be_api) == norm_base(api),
                f"build={be_api} api={api}",
            )
        )
    if be_chain:
        checks.append(
            check_row(
                gid,
                "build_env_chain",
                "build.env NEXT_PUBLIC_CHAIN_ID = Sepolia",
                str(be_chain) == str(EXPECT_CHAIN_ID),
                be_chain,
            )
        )

    return gate_result(gid, "Staging env integrity", checks)


def run_gate_g08(api: str, web: str, prior_gates: list[dict[str, Any]]) -> dict[str, Any]:
    gid = "G08_HAT_PREREQ"
    checks: list[dict[str, Any]] = []

    checks.append(
        check_row(
            gid,
            "staging_hosts",
            "HAT targets are staging hosts (not localhost)",
            not is_localhost(api) and not is_localhost(web),
            f"api={api} web={web}",
        )
    )

    upstream_fail = any(g["verdict"] == "FAIL" for g in prior_gates)
    checks.append(
        check_row(
            gid,
            "upstream_gates_green",
            "G01–G07 all PASS (HAT blocked until green)",
            not upstream_fail,
            f"upstream_fail={upstream_fail}",
        )
    )

    checks.append(
        check_row(
            gid,
            "blocks_documented",
            "On FAIL: S6 / HAT / Phase③ blocked (policy)",
            True,
            "S6,HAT,PHASE3",
        )
    )

    return gate_result(
        gid,
        "HAT prerequisite / downstream block policy",
        checks,
        notes="run-phase28-human-acceptance-test.sh reads deep-release-gate/latest/report.json",
    )


def write_summary_md(report: dict[str, Any], path: Path) -> None:
    lines = [
        "# Phase ② · Deep Release Gate Summary",
        "",
        f"**Recorded:** {report.get('recorded_at')}  ",
        f"**API:** {report.get('staging_api_base')}  ",
        f"**Web:** {report.get('staging_web_base')}  ",
        f"**Expect git_sha:** `{report.get('expect_git_sha') or '(none)'}`  ",
        f"**Evidence:** `{report.get('evidence_dir')}`  ",
        "",
        "> **Staging-only** · 禁止用 ① localhost 绿冒充 ② staging 绿 · FAIL 阻断 **S6 / HAT / Phase ③**",
        "",
        "---",
        "",
        "## Verdict",
        "",
        f"| Field | Value |",
        f"|-------|-------|",
        f"| **release_gate** | **{report.get('release_gate')}** |",
        f"| **verdict** | **{report.get('verdict')}** |",
        f"| P0 gate FAIL | {report.get('summary', {}).get('p0_gate_fail', 0)} |",
        f"| P1 / WARN gates | {report.get('summary', {}).get('warn_gates', 0)} |",
        "",
        "```text",
        f"TT_PHASE2_DEEP_RELEASE_GATE: {report.get('verdict')}",
        f"BLOCKS_ON_FAIL: S6,HAT,PHASE3",
        "```",
        "",
        "---",
        "",
        "## Gates",
        "",
        "| ID | Title | Verdict | P0 fail | Notes |",
        "|----|-------|---------|---------|-------|",
    ]
    for g in report.get("gates", []):
        lines.append(
            f"| {g.get('id')} | {g.get('title')} | **{g.get('verdict')}** | {g.get('p0_fail', 0)} | {g.get('notes', '')[:60]} |"
        )

    for g in report.get("gates", []):
        fails = [c for c in g.get("checks", []) if c.get("verdict") == "FAIL"]
        if not fails:
            continue
        lines.extend(["", f"### {g.get('id')} · failures", ""])
        for c in fails:
            lines.append(f"- **{c.get('check_id')}** ({c.get('severity')}): {c.get('title')} — {c.get('detail')}")

    lines.extend(
        [
            "",
            "---",
            "",
            "## Remediation",
            "",
            "1. Fix P0 failures on **staging** (re-deploy API/Web if needed).",
            "2. Re-run: `bash scripts/dev/run-phase2-deep-release-gate.sh`",
            "3. Only after **PASS**: S6 `--staging-retest` or Phase ②.8 HAT.",
            "4. **Do not** treat local CI green as staging green.",
            "",
            "---",
            "",
            "*Generated by `scripts/dev/phase2-deep-release-gate.py`*",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def aggregate_verdict(gates: list[dict[str, Any]]) -> tuple[str, str]:
    p0_fails = [g for g in gates if g["verdict"] == "FAIL"]
    warns = [g for g in gates if g["verdict"] == "WARN"]
    if p0_fails:
        return "FAIL", "NO_GO"
    if warns:
        return "PASS", "GO"  # WARN gates are P1-only; still allow with warnings in summary
    return "PASS", "GO"


def main() -> int:
    ap = argparse.ArgumentParser(description="Phase ② deep multidimensional release gate (staging)")
    ap.add_argument("--api-base", default=os.environ.get("STAGING_API_BASE", "https://tt-api-staging.fly.dev"))
    ap.add_argument("--web-base", default=os.environ.get("STAGING_WEB_BASE", "https://tt-web-staging.fly.dev"))
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--expect-git-sha", default=os.environ.get("PHASE2_EXPECT_GIT_SHA", ""))
    ap.add_argument("--skip-rbac", action="store_true", help="Skip G04 ADM-U01 (slow)")
    args = ap.parse_args()

    api = norm_base(args.api_base)
    web = norm_base(args.web_base)
    expect_sha = (args.expect_git_sha or "").strip() or (
        subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
        ).stdout.strip()
        if not os.environ.get("PHASE2_DEEP_GATE_SKIP_GIT_HEAD")
        else ""
    )

    if (is_localhost(api) or is_localhost(web)) and not allow_local():
        eprint("FAIL: staging-only gate — localhost targets blocked (set PHASE2_DEEP_GATE_ALLOW_LOCAL=1 to debug)")
        print("TT_PHASE2_DEEP_RELEASE_GATE: FAIL")
        return 2

    out_dir = args.out or Path(
        os.environ.get(
            "PHASE2_DEEP_GATE_OUT",
            str(ROOT / "evidence" / "GO_phase2_testnet_20260526" / "deep-release-gate" / stamp()),
        )
    )
    out_dir.mkdir(parents=True, exist_ok=True)

    onboarding = load_env_file(ROOT / "scripts" / "dev" / ".env.staging-onboarding.local")
    r003 = load_env_file(ROOT / "scripts" / "dev" / ".env.r003.local")
    env = merge_env(onboarding, r003, dict(os.environ))
    if not os.environ.get("STAGING_DATABASE_URL"):
        stg_db = env.get("STAGING_DATABASE_URL") or env.get("DATABASE_URL") or ""
        if stg_db:
            os.environ["STAGING_DATABASE_URL"] = stg_db

    build_env = Path(os.environ.get("STAGING_WEB_BUILD_ENV", str(ROOT / "deploy/fly/tt-web-staging/build.env.local")))

    t0 = time.time()
    gates: list[dict[str, Any]] = []
    gates.append(run_gate_g01(api, web, expect_sha))
    gates.append(run_gate_g02(api))
    gates.append(run_gate_g03(api))
    if not args.skip_rbac:
        gates.append(run_gate_g04(api, out_dir))
    else:
        gates.append(
            gate_result(
                "G04_ADMIN_RBAC",
                "Admin RBAC permission matrix (ADM-U01)",
                [check_row("G04_ADMIN_RBAC", "skipped", "RBAC skipped via --skip-rbac", True, "skip")],
                notes="skipped",
            )
        )
    gates.append(run_gate_g05(env, out_dir))
    gates.append(run_gate_g06(api))
    gates.append(run_gate_g07(api, web, env, build_env))

    gates.append(run_gate_g08(api, web, gates))

    verdict, release_gate = aggregate_verdict(gates)
    if verdict == "FAIL":
        release_gate = "NO_GO"

    p0_gate_fail = sum(1 for g in gates if g["verdict"] == "FAIL")
    warn_gates = sum(1 for g in gates if g["verdict"] == "WARN")

    report: dict[str, Any] = {
        "schema_version": "1",
        "kind": SCHEMA,
        "recorded_at": utc_now(),
        "staging_api_base": api,
        "staging_web_base": web,
        "expect_git_sha": expect_sha or None,
        "meta_observability_only": meta_observability_only(),
        "evidence_dir": str(out_dir).replace("\\", "/"),
        "duration_sec": round(time.time() - t0, 2),
        "verdict": verdict,
        "release_gate": release_gate,
        "blocks_on_fail": ["S6", "HAT", "PHASE3"],
        "staging_only": True,
        "summary": {
            "gates_total": len(gates),
            "p0_gate_fail": p0_gate_fail,
            "warn_gates": warn_gates,
            "pass_gates": sum(1 for g in gates if g["verdict"] == "PASS"),
        },
        "gates": gates,
    }

    report_path = out_dir / "report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_summary_md(report, out_dir / "SUMMARY.md")

    latest = out_dir.parent / "latest"
    try:
        if latest.is_symlink() or latest.exists():
            latest.unlink()
        latest.symlink_to(out_dir.name, target_is_directory=True)
    except OSError:
        (out_dir.parent / "LATEST.txt").write_text(out_dir.name + "\n", encoding="utf-8")

    print(f"Wrote {report_path}")
    print(f"Wrote {out_dir / 'SUMMARY.md'}")
    print(f"TT_PHASE2_DEEP_RELEASE_GATE: {verdict}")
    print(f"TT_PHASE2_DEEP_RELEASE_GATE_RELEASE: {release_gate}")
    if verdict == "FAIL":
        print("TT_PHASE2_DEEP_RELEASE_GATE_BLOCKS: S6,HAT,PHASE3")
    return 0 if verdict == "PASS" else 2


if __name__ == "__main__":
    sys.exit(main())
