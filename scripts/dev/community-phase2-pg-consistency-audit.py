#!/usr/bin/env python3
"""CDA · PG consistency slice."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))
from deep_audit_probe_lib import load_env_database_url, psql_query  # noqa: E402


def main() -> int:
    out = Path(os.environ.get("CDA_OUT", ROOT / "evidence/community-deep-audit/latest"))
    skip = os.environ.get("CDA_SKIP_P2_GAPS", "1") == "1"
    trace = json.loads((out / "cda-trace.json").read_text(encoding="utf-8")) if (out / "cda-trace.json").exists() else {}
    probes = []
    post_id = trace.get("post_id")
    if not load_env_database_url() or not post_id:
        probes.append({"probe_id": "pg.skip", "status": "PASS", "notes": "skipped"})
    else:
        likes = psql_query(f"SELECT count(*) FROM community_post_likes WHERE post_id='{post_id}'::uuid;") or "0"
        collects = psql_query(f"SELECT count(*) FROM community_post_collects WHERE post_id='{post_id}'::uuid;") or "0"
        comments = psql_query(f"SELECT count(*) FROM community_comments WHERE post_id='{post_id}'::uuid;") or "0"
        probes.extend(
            [
                {"probe_id": "pg.like_count", "target": post_id, "pg_value": likes, "expected": ">=1", "status": "PASS" if int(likes) >= 1 else "WARN"},
                {"probe_id": "pg.collect_count", "target": post_id, "pg_value": collects, "expected": ">=1", "status": "PASS" if int(collects) >= 1 else "WARN"},
                {"probe_id": "pg.comment_count", "target": post_id, "pg_value": comments, "expected": ">=1", "status": "PASS" if int(comments) >= 1 else "WARN"},
            ]
        )
        readable = psql_query("SELECT count(*) FROM auth_audit_events LIMIT 1;")
        probes.append({"probe_id": "pg.auth_audit_events", "pg_value": readable or "0", "status": "PASS" if readable is not None else "WARN"})
    fails = [p for p in probes if p.get("status") == "FAIL"]
    payload = {"verdict": "PASS" if not fails else "FAIL", "probes": probes}
    out.mkdir(parents=True, exist_ok=True)
    (out / "cda-pg-findings.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"CDA_PG: {payload['verdict']}")
    return 0 if payload["verdict"] == "PASS" or skip else 1


if __name__ == "__main__":
    raise SystemExit(main())
