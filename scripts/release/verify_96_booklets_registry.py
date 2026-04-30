#!/usr/bin/env python3
"""
Per-96-booklet gates (read-only): registry existence + placeholder volume gate (min bytes).

Emits JSON with per-booklet PASS/FAIL. Exit 1 if any booklet fails registry or placeholder gate.

Usage:
  python scripts/release/verify_96_booklets_registry.py --out evidence/GO_x/96_booklets_registry.json
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

# Placeholder “逐册”机读：分册正文过短则 FAIL（不打开 spec 写回，只读 size）。
MIN_VOLUME_PLACEHOLDER_BYTES = 400

_BOOKLETS_JSON = Path("registry") / "derived" / "96-booklets.v1.json"


def _load_expected_booklets(root: Path) -> list[tuple[str, str]]:
    """Paths from registry/derived/96-booklets.v1.json (path_segments → posix rel)."""
    jp = root / _BOOKLETS_JSON
    data = json.loads(jp.read_text(encoding="utf-8"))
    out: list[tuple[str, str]] = []
    for row in data["booklets"]:
        rel = Path(*row["path_segments"]).as_posix()
        out.append((str(row["id"]), rel))
    return out


@dataclass
class BookletRow:
    id: str
    rel_path: str
    registry: str
    bytes: int | None
    registry_detail: str
    volume_placeholder_gate: str
    volume_placeholder_detail: str


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-root", type=Path, default=None)
    ap.add_argument("--out", type=Path, default=None, help="Write JSON summary")
    args = ap.parse_args()
    root = (args.repo_root or Path(__file__).resolve().parents[2]).resolve()
    rows: list[BookletRow] = []
    any_fail = False
    for bid, rel in _load_expected_booklets(root):
        p = root / rel
        if not p.is_file():
            rows.append(
                BookletRow(
                    bid,
                    rel,
                    "FAIL",
                    None,
                    "missing",
                    "SKIP",
                    "registry_not_ok",
                )
            )
            any_fail = True
            continue
        sz = p.stat().st_size
        reg = "PASS"
        reg_d = "ok"
        if sz < MIN_VOLUME_PLACEHOLDER_BYTES:
            vg, vd = "FAIL", f"bytes={sz}<{MIN_VOLUME_PLACEHOLDER_BYTES}"
            any_fail = True
        else:
            vg, vd = "PASS", f"bytes={sz}>={MIN_VOLUME_PLACEHOLDER_BYTES}"
        rows.append(BookletRow(bid, rel, reg, sz, reg_d, vg, vd))
    doc = {
        "schema_version": "1",
        "kind": "traveltrust.96_booklets_registry_gate.v1",
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "repo_root": str(root),
        "min_volume_placeholder_bytes": MIN_VOLUME_PLACEHOLDER_BYTES,
        "all_pass": not any_fail,
        "all_registry_pass": all(r.registry == "PASS" for r in rows),
        "all_volume_placeholder_pass": (
            bool([r for r in rows if r.registry == "PASS"])
            and all(
                r.volume_placeholder_gate == "PASS"
                for r in rows
                if r.registry == "PASS"
            )
        ),
        "booklets": [asdict(r) for r in rows],
    }
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text, encoding="utf-8")
        print(f"Wrote {args.out}")
    else:
        print(text, end="")
    return 1 if any_fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
