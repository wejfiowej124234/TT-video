#!/usr/bin/env python3
"""B-475: evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json shape (ops baseline)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ANCHOR = "B475-PG-BACKUP-PITR-BASELINE-V1"
SCHEMA = "traveltrust_pg_backup_pitr_baseline.v1"
ALLOWED_STATUS = frozenset({"PLANNED", "PASS", "WAIVED"})


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    p = root / "evidence" / "b475_pg_backup_pitr_baseline" / "baseline_record.v1.json"
    if not p.is_file():
        print(f"check-b475: missing {p.relative_to(root)}", file=sys.stderr)
        return 1
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"check-b475: invalid JSON: {e}", file=sys.stderr)
        return 1
    if data.get("schema") != SCHEMA:
        print("check-b475: schema must be traveltrust_pg_backup_pitr_baseline.v1", file=sys.stderr)
        return 1
    st = data.get("status")
    if st not in ALLOWED_STATUS:
        print(f"check-b475: status must be one of {sorted(ALLOWED_STATUS)}", file=sys.stderr)
        return 1
    if st == "PASS":
        for k in (
            "wal_archive_destination_desc",
            "logical_backup_schedule_desc",
            "last_restore_drill_utc",
        ):
            if not data.get(k):
                print(f"check-b475: status=PASS requires non-empty {k!r}", file=sys.stderr)
                return 1
    print(f"check-b475: OK ({ANCHOR}) status={st}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
