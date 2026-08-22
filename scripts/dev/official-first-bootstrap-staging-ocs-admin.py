#!/usr/bin/env python3
"""Bootstrap staging OCS super admin in PG (sanitized · no Production data)."""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import uuid
from urllib.parse import unquote, urlparse


def run_psql(dsn: str, sql: str) -> None:
    if shutil.which("psql"):
        r = subprocess.run(["psql", dsn, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql], capture_output=True, text=True)
        if r.returncode == 0:
            return
        raise RuntimeError(r.stderr or r.stdout or "psql failed")

    root = os.environ.get("REPO_ROOT", os.getcwd())
    pg_root = os.path.join(root, "frontend")
    node = shutil.which("node")
    if node and os.path.isdir(os.path.join(pg_root, "node_modules", "pg")):
        script = r"""
const { Client } = require('pg');
const sql = process.argv[2];
(async () => {
  const c = new Client({ connectionString: process.argv[1], connectionTimeoutMillis: 15000 });
  await c.connect();
  await c.query(sql);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
"""
        r = subprocess.run([node, "-e", script, dsn, sql], cwd=pg_root, capture_output=True, text=True)
        if r.returncode == 0:
            return
        raise RuntimeError(r.stderr or r.stdout or "node pg failed")

    if not shutil.which("docker"):
        raise RuntimeError("need psql, node+pg, or docker for staging PG")

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
        ["docker", "run", "--rm", "-e", f"PGPASSWORD={password}", "postgres:16-alpine", "psql", conn, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        raise RuntimeError(r.stderr or r.stdout or "docker psql failed")


def main() -> int:
    dsn = os.environ.get("STAGING_DATABASE_URL") or os.environ.get("DATABASE_URL") or ""
    email = os.environ.get(
        "STAGING_OCS_ADMIN_EMAIL", "adm-10x4-20260719143519@traveltrust.test"
    ).strip()
    if not dsn:
        print("official-first-bootstrap-staging-ocs-admin: FAIL no STAGING_DATABASE_URL", file=sys.stderr)
        return 2
    template = os.environ.get("ADM_U01_PG_PASSWORD_TEMPLATE_EMAIL", "tourist@test.com")
    domain = os.environ.get("OCS_EMAIL_DOMAIN", "ocs.traveltrust.app").replace("'", "''")
    preclean = f"DELETE FROM users WHERE lower(email) LIKE '%@{domain}';".strip()
    try:
        run_psql(dsn, preclean)
    except RuntimeError as err:
        print(f"official-first-bootstrap-staging-ocs-admin: preclean WARN {err}", file=sys.stderr)

    uid = str(uuid.uuid4())
    safe_email = email.replace("'", "''")
    safe_template = template.replace("'", "''")
    sql = f"""
INSERT INTO users (id, email, password_hash, role, kyc_status, nickname, created_at, updated_at, email_verified_at, growth_points, growth_fraud_status)
SELECT '{uid}'::uuid, '{safe_email}',
       COALESCE((SELECT password_hash FROM users WHERE lower(email) = lower('{safe_template}') LIMIT 1),
                '$2b$12$FL0raem8dnHmMB0sGI.qQO061ZZBa6TTf/08kutFMLThVBNR6.VJi'),
       'super_admin', 'none', 'OCS Align Admin', now(), now(), now(), 0, 'normal'
ON CONFLICT (email) DO UPDATE SET role = 'super_admin', updated_at = now(), email_verified_at = COALESCE(users.email_verified_at, now());
INSERT INTO admin_console_roles (user_id, console_role)
SELECT id, 'SuperAdmin' FROM users WHERE lower(email) = lower('{safe_email}')
ON CONFLICT (user_id) DO UPDATE SET console_role = 'SuperAdmin', updated_at = now();
INSERT INTO admin_security_policies (policy_key, policy_value)
VALUES ('admin_2fa_policy', '{{"enforced": false}}'::jsonb)
ON CONFLICT (policy_key) DO UPDATE
SET policy_value = jsonb_set(admin_security_policies.policy_value, '{{enforced}}', 'false'::jsonb, true),
    updated_at = now();
""".strip()
    try:
        run_psql(dsn, sql)
    except RuntimeError as err:
        print(f"official-first-bootstrap-staging-ocs-admin: FAIL {err}", file=sys.stderr)
        return 2
    print(f"official-first-bootstrap-staging-ocs-admin: OK {email}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
