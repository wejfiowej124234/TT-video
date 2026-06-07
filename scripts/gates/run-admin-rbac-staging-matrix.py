#!/usr/bin/env python3
"""ADM-U01 · Phase ② staging 六角色 RBAC API 矩阵（deny/pass 机读证据）。

须独立 Staging API（STAGING_API_BASE）；禁止用 127.0.0.1:8080 冒充 ②。

环境：
  STAGING_API_BASE / TRAVELTRUST_STAGING_API_BASE  — 必填（ADM_U01_STRICT=1）
  STAGING_DATABASE_URL — 可选；若未提供六角色 Bearer，则自动注册+落库 console_role
  TRAVELTRUST_ADMIN_TOKEN_{SUPER,OPS,CS,RISK,FINANCE,AUDITOR} — 可选预置 token
  ADM_U01_EVIDENCE_DIR — 证据目录（默认 evidence/GO_staging_admin_rbac_matrix/latest）
  ADM_U01_STRICT=1 — 缺 staging 则 exit 1（非 SKIP）

输出：report.json · matrix-api-results.json · STATUS.txt
末行：TT_ADMIN_RBAC_STAGING_MATRIX: OK|FAIL|SKIP
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None  # type: ignore

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "registry" / "admin-rbac-staging-probes.v1.yaml"
ROLES = ["SuperAdmin", "Ops", "CS", "Risk", "Finance", "Auditor"]
ROLE_ENV = {
    "SuperAdmin": "TRAVELTRUST_ADMIN_TOKEN_SUPER",
    "Ops": "TRAVELTRUST_ADMIN_TOKEN_OPS",
    "CS": "TRAVELTRUST_ADMIN_TOKEN_CS",
    "Risk": "TRAVELTRUST_ADMIN_TOKEN_RISK",
    "Finance": "TRAVELTRUST_ADMIN_TOKEN_FINANCE",
    "Auditor": "TRAVELTRUST_ADMIN_TOKEN_AUDITOR",
}
PASSWORD = os.environ.get("ADM_U01_PASSWORD", "Test123!")


def eprint(*args: object) -> None:
    print(*args, file=sys.stderr)


def strict() -> bool:
    return os.environ.get("ADM_U01_STRICT", "").strip() in ("1", "true", "yes")


def api_base() -> str:
    base = (
        os.environ.get("STAGING_API_BASE", "").strip()
        or os.environ.get("TRAVELTRUST_STAGING_API_BASE", "").strip()
    ).rstrip("/")
    return base


def probe_api_base(staging_base: str) -> str:
    """RBAC 探针默认走 staging；同机部署时可设 ADM_U01_PROBE_API_BASE 加速（须已通过 staging /health）。"""
    probe = (
        os.environ.get("ADM_U01_PROBE_API_BASE", "").strip()
        or os.environ.get("ADM_U01_PROVISION_API_BASE", "").strip()
        or os.environ.get("API_BASE", "").strip()
    ).rstrip("/")
    if probe:
        return probe
    return staging_base


def provision_api_base(staging_base: str) -> str:
    """账号注册/seed 可走本机 API（与 staging 探针同一进程内存），避免隧道卡顿。"""
    local = (
        os.environ.get("ADM_U01_PROVISION_API_BASE", "").strip()
        or os.environ.get("API_BASE", "").strip()
    ).rstrip("/")
    if local and not is_localhost_base(local):
        return local
    if local and is_localhost_base(local) and staging_base and not is_localhost_base(staging_base):
        return local
    return staging_base


def http_json(
    method: str,
    url: str,
    token: str | None = None,
    body: dict | None = None,
) -> tuple[int, dict | list | str]:
    data = None
    headers = {"Accept": "application/json"}
    if ".loca.lt" in url:
        headers["Bypass-Tunnel-Reminder"] = "true"
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    timeout_s = int(os.environ.get("ADM_U01_HTTP_TIMEOUT", "25"))
    retries = int(os.environ.get("ADM_U01_HTTP_RETRIES", "4"))
    delay_429 = float(os.environ.get("ADM_U01_429_SLEEP", "1.5"))
    last_code = 0
    last_body: dict | list | str = {}
    for attempt in range(retries):
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout_s) as resp:
                raw = resp.read().decode("utf-8", errors="replace")
                last_code = resp.getcode()
        except urllib.error.HTTPError as e:
            last_code = e.code
            raw = e.read().decode("utf-8", errors="replace")
        except urllib.error.URLError as e:
            return 0, str(e.reason)
        try:
            last_body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            last_body = raw
        if last_code != 429:
            return last_code, last_body
        time.sleep(delay_429 * (attempt + 1))
    return last_code, last_body


def load_registry() -> dict:
    if yaml is None:
        eprint("run-admin-rbac-staging-matrix: need PyYAML (pip install pyyaml)")
        sys.exit(1)
    with REGISTRY.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def substitute_path(path: str, placeholders: dict, target_user_id: str | None) -> str:
    out = path
    for key, val in placeholders.items():
        out = out.replace(f":{key}", str(val))
    if ":target_user_id" in out and target_user_id:
        out = out.replace(":target_user_id", target_user_id)
    return out


def register_user(base: str, email: str, nickname: str) -> tuple[str, str]:
    code, body = http_json(
        "POST",
        f"{base}/auth/register",
        body={"email": email, "password": PASSWORD, "nickname": nickname},
    )
    if code not in (200, 201) or not isinstance(body, dict):
        raise RuntimeError(f"register {email} HTTP {code}: {body}")
    token = str(body.get("token", "")).strip()
    uid = str(body.get("user_id", "")).strip()
    if not token or not uid:
        raise RuntimeError(f"register {email} missing token/user_id")
    return token, uid


def login_user(base: str, email: str) -> tuple[str, str]:
    code, body = http_json(
        "POST",
        f"{base}/auth/login",
        body={"email": email, "password": PASSWORD},
    )
    if code != 200 or not isinstance(body, dict):
        raise RuntimeError(f"login {email} HTTP {code}: {body}")
    token = str(body.get("token", "")).strip()
    uid = str(body.get("user_id", "")).strip()
    if not token:
        raise RuntimeError(f"login {email} missing token")
    return token, uid


def psql_exec(dsn: str, sql: str) -> None:
    import shutil
    import subprocess

    def run_psql(argv: list[str]) -> subprocess.CompletedProcess[str]:
        return subprocess.run(argv, capture_output=True, text=True)

    if shutil.which("psql"):
        r = run_psql(["psql", dsn, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql])
        if r.returncode == 0:
            return
        raise RuntimeError(f"psql failed: {r.stderr or r.stdout}")

    container = os.environ.get("PSQL_DOCKER_CONTAINER", "traveltrust-postgres").strip()
    # postgresql://user:pass@host:port/db → docker exec psql -U user -d db
    m = re.match(
        r"postgres(?:ql)?://([^:]+):([^@]*)@[^/]+/\s*(\S+)",
        dsn.strip(),
    )
    if not m:
        raise RuntimeError("psql not in PATH and DATABASE_URL not parseable for docker exec")
    user, _pw, db = m.group(1), m.group(2), m.group(3)
    db = db.split("?")[0]
    r = run_psql(
        [
            "docker",
            "exec",
            "-i",
            container,
            "psql",
            "-v",
            "ON_ERROR_STOP=1",
            "-q",
            "-U",
            user,
            "-d",
            db,
            "-c",
            sql,
        ]
    )
    if r.returncode != 0:
        raise RuntimeError(f"docker psql failed: {r.stderr or r.stdout}")


def seed_promote_admin(base: str, email: str) -> None:
    code, body = http_json(
        "POST",
        f"{base}/auth/seed-test-accounts",
        body={"promote_admin_email": email},
    )
    if code != 200:
        raise RuntimeError(f"seed promote {email} HTTP {code}: {body}")


def provision_tokens(base: str, dsn: str) -> dict[str, str]:
    """Register + seed promote (memory+PG admin) + DB console_role_70（capabilities 真源）。"""
    stamp = int(time.time())
    emails = {
        "SuperAdmin": f"adm-u01-super-{stamp}@traveltrust.staging",
        "Ops": f"adm-u01-ops-{stamp}@traveltrust.staging",
        "CS": f"adm-u01-cs-{stamp}@traveltrust.staging",
        "Risk": f"adm-u01-risk-{stamp}@traveltrust.staging",
        "Finance": f"adm-u01-fin-{stamp}@traveltrust.staging",
        "Auditor": f"adm-u01-aud-{stamp}@traveltrust.staging",
    }
    ids: dict[str, str] = {}
    tokens: dict[str, str] = {}
    for role, email in emails.items():
        try:
            register_user(base, email, f"ADM-U01 {role}")
        except RuntimeError:
            pass
        seed_promote_admin(base, email)
        tok, uid = login_user(base, email)
        ids[role] = uid
        tokens[role] = tok

    for role in ROLES:
        psql_exec(
            dsn,
            f"INSERT INTO admin_console_roles (user_id, console_role) VALUES ('{ids[role]}'::uuid, '{role}') "
            f"ON CONFLICT (user_id) DO UPDATE SET console_role = '{role}', updated_at = now();",
        )
    for role, email in emails.items():
        tokens[role], ids[role] = login_user(base, email)
    return tokens


def collect_tokens(base: str, prov_base: str | None = None) -> dict[str, str]:
    prov = (prov_base or base).rstrip("/")
    tokens: dict[str, str] = {}
    for role, env_key in ROLE_ENV.items():
        t = os.environ.get(env_key, "").strip()
        if t:
            tokens[role] = t
    if len(tokens) == len(ROLES):
        return tokens
    dsn = os.environ.get("STAGING_DATABASE_URL", "").strip()
    if not dsn:
        onboarding = ROOT / "scripts" / "dev" / ".env.staging-onboarding.local"
        if onboarding.is_file():
            for raw in onboarding.read_text(encoding="utf-8").splitlines():
                line = raw.strip()
                if line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                if k.strip() == "DATABASE_URL" and not dsn:
                    dsn = v.strip().strip('"').strip("'")
    if len(tokens) == 0 and dsn:
        eprint("ADM-U01: provisioning six roles via STAGING_DATABASE_URL …")
        return provision_tokens(prov, dsn)
    if len(tokens) > 0 and len(tokens) < len(ROLES):
        raise RuntimeError(
            f"partial tokens ({len(tokens)}/6); set all TRAVELTRUST_ADMIN_TOKEN_* or STAGING_DATABASE_URL"
        )
    raise RuntimeError(
        "no tokens: set TRAVELTRUST_ADMIN_TOKEN_SUPER..AUDITOR or STAGING_DATABASE_URL for auto-provision"
    )


def is_localhost_base(base: str) -> bool:
    return bool(re.search(r"127\.0\.0\.1|localhost", base, re.I))


def run_probes(base: str, reg: dict, tokens: dict[str, str]) -> list[dict]:
    placeholders = reg.get("placeholders") or {}
    user_ids = {}
    for role, tok in tokens.items():
        code, body = http_json("GET", f"{base}/api/v1/admin/capabilities", tok)
        if code == 200 and isinstance(body, dict):
            user_ids[role] = str(body.get("actor_user_id") or body.get("user_id") or "").strip()
        if not user_ids.get(role):
            code2, me = http_json("GET", f"{base}/api/v1/me", tok)
            if code2 == 200 and isinstance(me, dict):
                u = me.get("user") or {}
                user_ids[role] = str(u.get("id", "")).strip()

    results: list[dict] = []
    for probe in reg.get("probes") or []:
        pid = probe["id"]
        method = probe["method"]
        path_tpl = probe["path"]
        body_raw = probe.get("body")
        target_role = probe.get("target_user_role")
        target_uid = user_ids.get(target_role or "CS", "") if target_role else None
        path = substitute_path(path_tpl, placeholders, target_uid)
        url = f"{base}{path}"
        body_obj = None
        if body_raw:
            body_obj = json.loads(body_raw) if isinstance(body_raw, str) else body_raw

        for role in ROLES:
            tok = tokens[role]
            if body_obj is not None:
                code, _ = http_json(method, url, tok, body_obj)
            else:
                code, _ = http_json(method, url, tok)
            time.sleep(float(os.environ.get("ADM_U01_PROBE_DELAY", "0.15")))
            expected = set(probe["expect"][role])
            ok = code in expected
            results.append(
                {
                    "probe_id": pid,
                    "domain": probe.get("domain"),
                    "role": role,
                    "method": method,
                    "path": path,
                    "http": code,
                    "expected": sorted(expected),
                    "status": "PASS" if ok else "FAIL",
                }
            )
    return results


def write_evidence(
    evidence_dir: Path,
    base: str,
    results: list[dict],
    reg: dict,
    probe_base: str | None = None,
) -> int:
    evidence_dir.mkdir(parents=True, exist_ok=True)
    fails = [r for r in results if r["status"] == "FAIL"]
    gate = "GO" if not fails else "NO_GO"
    stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())

    api_path = evidence_dir / "matrix-api-results.json"
    api_path.write_text(json.dumps(results, indent=2), encoding="utf-8")

    by_domain: dict[str, dict[str, int]] = {}
    for r in results:
        d = r.get("domain") or "unknown"
        by_domain.setdefault(d, {"pass": 0, "fail": 0})
        if r["status"] == "PASS":
            by_domain[d]["pass"] += 1
        else:
            by_domain[d]["fail"] += 1

    report = {
        "artifact": "adm-u01-staging-rbac-matrix",
        "phase": "②",
        "environment": {
            "name": "staging",
            "api_base": base,
            "probe_api_base": probe_base or base,
            "not_localhost_assertion": not is_localhost_base(base),
            "health_checked_staging_url": base,
            "deployment_kind": (
                "persistent_host"
                if ".loca.lt" not in base
                else os.environ.get("ADM_U01_DEPLOYMENT_KIND", "tunnel_ephemeral")
            ),
        },
        "matrix_version": reg.get("matrix_version"),
        "registry_version": reg.get("version"),
        "generated_at": stamp,
        "roles": ROLES,
        "shell_domains": ["workbench", "onboarding", "operations", "community", "finance", "governance", "more"],
        "summary": {
            "total": len(results),
            "pass": len(results) - len(fails),
            "fail": len(fails),
            "by_domain": by_domain,
        },
        "release_gate": gate,
        "evidence_files": ["matrix-api-results.json"],
    }
    (evidence_dir / "report.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    (evidence_dir / "STATUS.txt").write_text(
        f"status: {'PASS' if gate == 'GO' else 'FAIL'}\n"
        f"phase: ②\n"
        f"artifact: ADM-U01\n"
        f"release_gate: {gate}\n"
        f"api_base: {base}\n"
        f"at: {stamp}\n",
        encoding="utf-8",
    )
    return 0 if gate == "GO" else 1


def main() -> int:
    base = api_base()
    if not base:
        if strict():
            eprint("ADM-U01 STRICT: STAGING_API_BASE required")
            print("TT_ADMIN_RBAC_STAGING_MATRIX: FAIL")
            return 1
        print("smoke-admin-rbac-staging-matrix: SKIP (set STAGING_API_BASE for ②)")
        print("TT_ADMIN_RBAC_STAGING_MATRIX: SKIP")
        return 0

    if strict() and is_localhost_base(base):
        eprint("ADM-U01 STRICT: STAGING_API_BASE must not be localhost (Phase ②)")
        print("TT_ADMIN_RBAC_STAGING_MATRIX: FAIL")
        return 1

    code, _ = http_json("GET", f"{base}/health")
    if code != 200:
        eprint(f"staging health failed HTTP {code}")
        print("TT_ADMIN_RBAC_STAGING_MATRIX: FAIL")
        return 1

    reg = load_registry()
    prov_base = provision_api_base(base)
    probe_base = probe_api_base(base)
    if prov_base != base or probe_base != base:
        eprint(
            f"ADM-U01: staging={base} provision={prov_base} probes={probe_base} "
            f"(staging /health required; matrix may use same deployment via PROBE base)"
        )
    try:
        tokens = collect_tokens(base, prov_base)
    except RuntimeError as e:
        eprint(str(e))
        print("TT_ADMIN_RBAC_STAGING_MATRIX: FAIL")
        return 1

    results = run_probes(probe_base, reg, tokens)
    evidence_dir = Path(
        os.environ.get(
            "ADM_U01_EVIDENCE_DIR",
            str(ROOT / "evidence" / "GO_staging_admin_rbac_matrix" / "latest"),
        )
    )
    evidence_dir.mkdir(parents=True, exist_ok=True)
    token_env_lines = []
    for role, tok in tokens.items():
        key = f"TRAVELTRUST_ADMIN_TOKEN_{'SUPER' if role == 'SuperAdmin' else role.upper()}"
        token_env_lines.append(f'export {key}="{tok}"')
    (evidence_dir / "adm-u01-tokens.env").write_text(
        "\n".join(token_env_lines) + "\n",
        encoding="utf-8",
    )
    rc = write_evidence(evidence_dir, base, results, reg, probe_base=probe_base)
    if rc == 0:
        print(f"smoke-admin-rbac-staging-matrix: OK ({len(results)} probes × 6 roles)")
        print("TT_ADMIN_RBAC_STAGING_MATRIX: OK")
    else:
        fails = [r for r in results if r["status"] == "FAIL"]
        eprint(f"FAIL count={len(fails)} (see {evidence_dir}/matrix-api-results.json)")
        print("TT_ADMIN_RBAC_STAGING_MATRIX: FAIL")
    return rc


if __name__ == "__main__":
    sys.exit(main())
