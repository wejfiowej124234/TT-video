#!/usr/bin/env bash
# Quarantine mock/fixture escrow addresses from Sepolia cert scope (I-01).
# Clears escrow_address on known placeholder patterns so live_reconcile is pure Sepolia.
# Does NOT delete orders. Does NOT touch real on-chain escrow addresses.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

: "${DATABASE_URL:?DATABASE_URL required}"

PY=python
command -v python >/dev/null 2>&1 || PY=python3

"$PY" - <<'PY'
import os, urllib.parse, subprocess, json
from datetime import datetime, timezone

u = urllib.parse.urlparse(os.environ["DATABASE_URL"])
user, db = u.username, u.path.lstrip("/")

def psql(sql: str) -> str:
    r = subprocess.run(
        ["docker", "exec", "-i", "traveltrust-postgres", "psql", "-U", user, "-d", db, "-v", "ON_ERROR_STOP=1", "-c", sql],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        raise SystemExit(r.stderr or r.stdout)
    return r.stdout

# Preview
prev = psql("""
SELECT id::text, chain_id, left(escrow_address,18) AS esc
FROM orders
WHERE chain_id = 11155111
  AND escrow_address IS NOT NULL AND BTRIM(escrow_address) <> ''
  AND (
    lower(escrow_address) LIKE '0x222222%'
    OR lower(escrow_address) LIKE '0x333333%'
    OR id::text LIKE 'f0e0%'
  );
""")
print(prev)

out = psql("""
UPDATE orders
SET escrow_address = NULL,
    updated_at = now()
WHERE chain_id = 11155111
  AND escrow_address IS NOT NULL AND BTRIM(escrow_address) <> ''
  AND (
    lower(escrow_address) LIKE '0x222222%'
    OR lower(escrow_address) LIKE '0x333333%'
    OR id::text LIKE 'f0e0%'
  );
""")
print(out)

r2 = subprocess.run(
    ["docker", "exec", "-i", "traveltrust-postgres", "psql", "-U", user, "-d", db, "-tAc",
     "SELECT COUNT(*) FROM orders WHERE chain_id = 11155111 AND escrow_address IS NOT NULL AND BTRIM(escrow_address) <> '';"],
    capture_output=True, text=True,
)
remain = (r2.stdout or "0").strip().splitlines()[-1] if r2.returncode == 0 else "0"
print("remaining_sepolia_escrow_orders=", remain)

evid = {
    "machine_key": "TT_V311_CERT_SEED_ESCROW_QUARANTINE",
    "chain_id": 11155111,
    "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "action": "cleared_mock_fixture_escrow_address",
    "remaining_sepolia_escrow_orders": int(remain or "0"),
}
from pathlib import Path
p = Path("evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state")
p.mkdir(parents=True, exist_ok=True)
(p / "I-01-seed-quarantine.json").write_text(json.dumps(evid, indent=2) + "\n", encoding="utf-8")
print("TT_V311_CERT_SEED_ESCROW_QUARANTINE: OK")
PY
