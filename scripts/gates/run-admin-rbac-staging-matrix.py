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
import shutil
import subprocess
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
REGISTRY = Path(
    os.environ.get("ADM_U01_REGISTRY", "").strip()
    or str(ROOT / "registry" / "admin-rbac-staging-probes.v1.yaml")
)
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


def http_json_curl(
    method: str,
    url: str,
    token: str | None = None,
    body: dict | None = None,
    extra_headers: dict[str, str] | None = None,
) -> tuple[int, dict | list | str]:
    timeout_s = int(os.environ.get("ADM_U01_HTTP_TIMEOUT", "45"))
    cmd = [
        "curl",
        "--noproxy",
        "*",
        "-sS",
        "-w",
        "\n%{http_code}",
        "--max-time",
        str(timeout_s),
        "-X",
        method,
        "-H",
        "Accept: application/json",
    ]
    if ".loca.lt" in url:
        cmd += ["-H", "Bypass-Tunnel-Reminder: true"]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
        if method in ("POST", "PUT", "PATCH", "DELETE"):
            idem = f"adm-u01-{method.lower()}-{int(time.time() * 1000)}-{os.getpid()}"
            cmd += ["-H", f"Idempotency-Key: {idem}"]
    if extra_headers:
        for k, v in extra_headers.items():
            cmd += ["-H", f"{k}: {v}"]
    cmd.append(url)
    try:
        proc = subprocess.run(cmd, capture_output=True, check=False)
    except OSError as e:
        return 0, str(e)
    stdout = proc.stdout.decode("utf-8", errors="replace") if proc.stdout else ""
    stderr = proc.stderr.decode("utf-8", errors="replace") if proc.stderr else ""
    if proc.returncode != 0 and not stdout.strip():
        return 0, stderr.strip() or f"curl exit {proc.returncode}"
    out = stdout
    if "\n" not in out:
        return 0, out or stderr
    raw, code_str = out.rsplit("\n", 1)
    try:
        code = int(code_str.strip())
    except ValueError:
        return 0, out
    try:
        parsed: dict | list | str = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        parsed = raw
    return code, parsed


def http_json(
    method: str,
    url: str,
    token: str | None = None,
    body: dict | None = None,
) -> tuple[int, dict | list | str]:
    backend = os.environ.get("ADM_U01_HTTP_BACKEND", "curl").strip().lower()
    if backend == "curl" and shutil.which("curl"):
        retries = int(os.environ.get("ADM_U01_HTTP_RETRIES", "4"))
        delay = float(os.environ.get("ADM_U01_429_SLEEP", "1.5"))
        last_code = 0
        last_body: dict | list | str = {}
        for attempt in range(retries):
            last_code, last_body = http_json_curl(method, url, token, body)
            if last_code not in (0, 429):
                return last_code, last_body
            time.sleep(delay * (attempt + 1))
        return last_code, last_body

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
            if shutil.which("curl"):
                return http_json_curl(method, url, token, body)
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


def login_user_with_retry(base: str, email: str) -> tuple[str, str]:
    attempts = int(os.environ.get("ADM_U01_LOGIN_RETRIES", "8"))
    last_err = ""
    for attempt in range(attempts):
        try:
            return login_user(base, email)
        except RuntimeError as err:
            last_err = str(err)
            if "HTTP 0" not in last_err and "401" not in last_err:
                raise
            time.sleep(min(2.0 * (attempt + 1), 10.0))
    raise RuntimeError(last_err or f"login {email} failed after {attempts} attempts")


def psql_exec(dsn: str, sql: str) -> None:
    import shutil
    import subprocess
    from urllib.parse import unquote, urlparse

    def run_psql(argv: list[str], *, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
        return subprocess.run(argv, capture_output=True, text=True, env=env)

    if shutil.which("psql"):
        r = run_psql(["psql", dsn, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql])
        if r.returncode == 0:
            return
        raise RuntimeError(f"psql failed: {r.stderr or r.stdout}")

    if not shutil.which("docker"):
        raise RuntimeError("psql not in PATH and docker unavailable for staging PG")

    parsed = urlparse(dsn.strip())
    if parsed.scheme not in ("postgres", "postgresql") or not parsed.hostname:
        raise RuntimeError("psql not in PATH and DATABASE_URL not parseable for docker run")

    user = unquote(parsed.username or "")
    password = unquote(parsed.password or "")
    host = parsed.hostname or "127.0.0.1"
    port = str(parsed.port or 5432)
    db = (parsed.path or "/").lstrip("/").split("?")[0] or "postgres"
    if host in ("127.0.0.1", "localhost"):
        host = "host.docker.internal"

    conn = f"postgres://{user}@{host}:{port}/{db}"
    env = {**os.environ, "PGPASSWORD": password}
    r = run_psql(
        [
            "docker",
            "run",
            "--rm",
            "-e",
            f"PGPASSWORD={password}",
            "postgres:16-alpine",
            "psql",
            conn,
            "-v",
            "ON_ERROR_STOP=1",
            "-q",
            "-c",
            sql,
        ],
        env=env,
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


def psql_query_scalar(dsn: str, sql: str) -> str:
    import shutil
    import subprocess
    from urllib.parse import unquote, urlparse

    if shutil.which("psql"):
        r = subprocess.run(
            ["psql", dsn, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A", "-c", sql],
            capture_output=True,
            text=True,
        )
        if r.returncode != 0:
            raise RuntimeError(f"psql query failed: {r.stderr or r.stdout}")
        return (r.stdout or "").strip()

    if not shutil.which("docker"):
        raise RuntimeError("psql not in PATH and docker unavailable for staging PG")

    parsed = urlparse(dsn.strip())
    user = unquote(parsed.username or "")
    password = unquote(parsed.password or "")
    host = parsed.hostname or "127.0.0.1"
    port = str(parsed.port or 5432)
    db = (parsed.path or "/").lstrip("/").split("?")[0] or "postgres"
    if host in ("127.0.0.1", "localhost"):
        host = "host.docker.internal"
    conn = f"postgres://{user}@{host}:{port}/{db}"
    r = subprocess.run(
        [
            "docker",
            "run",
            "--rm",
            "-e",
            f"PGPASSWORD={password}",
            "postgres:16-alpine",
            "psql",
            conn,
            "-v",
            "ON_ERROR_STOP=1",
            "-q",
            "-t",
            "-A",
            "-c",
            sql,
        ],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        raise RuntimeError(f"docker psql query failed: {r.stderr or r.stdout}")
    return (r.stdout or "").strip()


def pg_user_exists(dsn: str, uid: str) -> bool:
    try:
        val = psql_query_scalar(dsn, f"SELECT count(*) FROM users WHERE id = '{uid}'::uuid;")
        return val == "1"
    except RuntimeError:
        return False


def register_user_persisted(base: str, email: str, nickname: str, dsn: str) -> tuple[str, str]:
    attempts = int(os.environ.get("ADM_U01_REGISTER_PG_RETRIES", "6"))
    for attempt in range(attempts):
        try:
            tok, uid = register_user(base, email, nickname)
        except RuntimeError as err:
            msg = str(err)
            if "409" in msg or "email_already" in msg:
                return login_user_with_retry(base, email)
            if attempt + 1 >= attempts:
                raise
            time.sleep(1.5 * (attempt + 1))
            continue
        if pg_user_exists(dsn, uid):
            return tok, uid
        time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"register {email} not persisted to staging PG after {attempts} attempts")


def promote_admin_via_pg(dsn: str, uid: str, console_role: str) -> None:
    user_role = "super_admin" if console_role == "SuperAdmin" else "admin"
    psql_exec(
        dsn,
        f"UPDATE users SET role = '{user_role}', updated_at = now() WHERE id = '{uid}'::uuid;",
    )
    psql_exec(
        dsn,
        f"INSERT INTO admin_console_roles (user_id, console_role) VALUES ('{uid}'::uuid, '{console_role}') "
        f"ON CONFLICT (user_id) DO UPDATE SET console_role = '{console_role}', updated_at = now();",
    )


def email_domain() -> str:
    raw = os.environ.get("ADM_U01_EMAIL_DOMAIN", "@traveltrust.staging").strip()
    return raw if raw.startswith("@") else f"@{raw}"


def provision_tokens(base: str, dsn: str) -> dict[str, str]:
    """Register via staging API + PG console_role（持久 Fly 多实例安全；不依赖 seed_promote 内存）。"""
    stamp = int(time.time())
    domain = email_domain()
    emails = {
        "SuperAdmin": f"adm-u01-super-{stamp}{domain}",
        "Ops": f"adm-u01-ops-{stamp}{domain}",
        "CS": f"adm-u01-cs-{stamp}{domain}",
        "Risk": f"adm-u01-risk-{stamp}{domain}",
        "Finance": f"adm-u01-fin-{stamp}{domain}",
        "Auditor": f"adm-u01-aud-{stamp}{domain}",
    }
    ids: dict[str, str] = {}
    tokens: dict[str, str] = {}
    for role, email in emails.items():
        eprint(f"ADM-U01: provision {role} via PG …")
        reg_tok, uid = register_user_persisted(base, email, f"ADM-U01 {role}", dsn)
        promote_admin_via_pg(dsn, uid, role)
        tokens[role] = reg_tok
        ids[role] = uid
        eprint(f"ADM-U01: provision {role} OK user_id={uid[:8]}…")
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


def probe_http_with_retry(
    method: str,
    url: str,
    token: str,
    body: dict | None = None,
) -> int:
    retries = int(os.environ.get("ADM_U01_PROBE_HTTP_RETRIES", "5"))
    for attempt in range(retries):
        if body is not None:
            code, _ = http_json(method, url, token, body)
        else:
            code, _ = http_json(method, url, token)
        if code != 0:
            return code
        time.sleep(min(1.5 * (attempt + 1), 6.0))
    return 0


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
    probe_total = len(reg.get("probes") or []) * len(ROLES)
    probe_i = 0
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
            code = probe_http_with_retry(method, url, tok, body_obj)
            probe_i += 1
            if probe_i % 12 == 0 or probe_i == probe_total:
                eprint(f"ADM-U01: probes {probe_i}/{probe_total} …")
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

    health_attempts = int(os.environ.get("ADM_U01_HEALTH_RETRIES", "10"))
    code = 0
    for attempt in range(health_attempts):
        code, _ = http_json("GET", f"{base}/health")
        if code == 200:
            break
        time.sleep(min(2.0 * (attempt + 1), 8.0))
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
