#!/usr/bin/env python3
"""Staging OCS market gate bootstrap (PG · sanitized · no Production data).

Fallback when POST …/bootstrap-market is not yet on deployed API image.
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import uuid
from urllib.parse import unquote, urlparse


def _docker_psql_cmd(dsn: str, extra_args: list[str]) -> list[str]:
    parsed = urlparse(dsn.strip())
    user = unquote(parsed.username or "")
    password = unquote(parsed.password or "")
    host = parsed.hostname or "127.0.0.1"
    port = str(parsed.port or 5432)
    db = (parsed.path or "/").lstrip("/").split("?")[0] or "postgres"
    if host in ("127.0.0.1", "localhost"):
        host = "host.docker.internal"
    conn = f"postgres://{user}@{host}:{port}/{db}"
    return [
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
        *extra_args,
    ]


def query_scalar(dsn: str, sql: str) -> str:
    if shutil.which("psql"):
        r = subprocess.run(
            ["psql", dsn, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A", "-c", sql],
            capture_output=True,
            text=True,
        )
        if r.returncode != 0:
            raise RuntimeError(r.stderr or r.stdout or "psql query failed")
        return (r.stdout or "").strip()

    if shutil.which("docker"):
        r = subprocess.run(_docker_psql_cmd(dsn, ["-q", "-t", "-A", "-c", sql]), capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(r.stderr or r.stdout or "docker psql query failed")
        return (r.stdout or "").strip()

    raise RuntimeError("need psql or docker for staging PG")


def run_psql(dsn: str, sql: str) -> None:
    if shutil.which("psql"):
        r = subprocess.run(["psql", dsn, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql], capture_output=True, text=True)
        if r.returncode == 0:
            return
        raise RuntimeError(r.stderr or r.stdout or "psql failed")

    if shutil.which("docker"):
        r = subprocess.run(_docker_psql_cmd(dsn, ["-q", "-c", sql]), capture_output=True, text=True)
        if r.returncode == 0:
            return
        raise RuntimeError(r.stderr or r.stdout or "docker psql failed")

    raise RuntimeError("need psql or docker for staging PG")


def bootstrap_provider(user_id: str) -> str:
    app_id = str(uuid.uuid4())
    ent_id = str(uuid.uuid4())
    idem = f"ocs-bootstrap-provider-{user_id}"
    return f"""
UPDATE users SET role = 'provider', updated_at = now() WHERE id = '{user_id}'::uuid;
INSERT INTO role_applications (
  id, user_id, kind, status, submitted_at, decided_at, metadata, created_at, updated_at
)
SELECT '{app_id}'::uuid, '{user_id}'::uuid, 'provider_onboarding', 'approved', now(), now(),
       '{{"source":"ocs_sanitized_staging"}}'::jsonb, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM role_applications
  WHERE user_id = '{user_id}'::uuid AND kind = 'provider_onboarding' AND status = 'approved'
);
INSERT INTO onboarding_entitlements (
  id, user_id, role_target, sku, fee_schedule_version, status, paid_at, idempotency_key, created_at, updated_at
)
VALUES (
  '{ent_id}'::uuid, '{user_id}'::uuid, 'provider', 'ocs_sanitized', 'ocs-v1', 'paid', now(),
  '{idem}', now(), now()
)
ON CONFLICT (idempotency_key) DO UPDATE SET status = 'paid', paid_at = COALESCE(onboarding_entitlements.paid_at, now()), updated_at = now();
""".strip()


def bootstrap_acquisition(user_id: str) -> str:
    bond_id = str(uuid.uuid4())
    wallet = "0x0000000000000000000000000000000000000c05"
    return f"""
UPDATE users
SET default_wallet_address = '{wallet}', updated_at = now()
WHERE id = '{user_id}'::uuid;
DELETE FROM staking_positions WHERE user_id = '{user_id}'::uuid AND kind = 'acquisition_publish_bond';
INSERT INTO staking_positions (
  id, application_id, user_id, kind, amount, currency, status, created_at, updated_at
) VALUES (
  '{bond_id}'::uuid, NULL, '{user_id}'::uuid, 'acquisition_publish_bond', '50', 'USDC', 'locked', now(), now()
);
""".strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--account-id", required=True)
    ap.add_argument("--variant", required=True, choices=["provider", "acquisition"])
    args = ap.parse_args()

    dsn = os.environ.get("STAGING_DATABASE_URL") or os.environ.get("DATABASE_URL") or ""
    if not dsn:
        print("official-first-bootstrap-staging-ocs-market-gate: FAIL no STAGING_DATABASE_URL", file=sys.stderr)
        return 2

    account_id = args.account_id.strip()
    user_id = query_scalar(
        dsn,
        f"SELECT user_id::text FROM ops_official_accounts WHERE id = '{account_id}'::uuid LIMIT 1;",
    )
    if not user_id:
        print("official-first-bootstrap-staging-ocs-market-gate: FAIL user_id not found", file=sys.stderr)
        return 2

    sql = bootstrap_provider(user_id) if args.variant == "provider" else bootstrap_acquisition(user_id)
    try:
        run_psql(dsn, sql)
    except RuntimeError as err:
        print(f"official-first-bootstrap-staging-ocs-market-gate: FAIL {err}", file=sys.stderr)
        return 2

    print(f"official-first-bootstrap-staging-ocs-market-gate: OK variant={args.variant} user_id={user_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
