#!/usr/bin/env python3
"""P3 · Archive duplicate evidence stamps to evidence/archive-evidence/ (move, never delete)."""
from __future__ import annotations

import argparse
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
import sys
sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path, hat_r1_stamp
ARCHIVE_ROOT = ROOT / "evidence" / "archive-evidence"
STAMP_RE = re.compile(r"^\d{8}T\d{6}Z$")

# Explicit baseline anchors (HAT-R1 resolved at runtime) — never move (GovFreeze V2 · Phase A · Four-Ledger · cutover · L9).
def _protected_rel_paths() -> set[str]:
    paths = {
        "GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z",
        "GO_tt_country_pool_revenue_enterprise_hat/cutover-drill/20260616T082259Z",
        "GO_tt_governance_enterprise_hat/l9-recheck/20260616T084529Z",
        "GO_ai_pre_human_uat/20260616T105001Z",
        "GO_ttg_cert/20260616T100918Z",
    }
    try:
        paths.add(hat_r1_rel_path(ROOT, resolve_hat_r1_evid_dir(ROOT)))
    except FileNotFoundError:
        pass
    return paths


PROTECTED_REL_PATHS = _protected_rel_paths()

RESERVED_SUBDIR_NAMES = frozenset(
    {"freeze", "cutover", "cutover-drill", "latest", "browser-signoff"}
)

ARCHIVE_BUNDLES = [
    "GO_hat_r1_sepolia",
    "GO_ai_pre_human_uat",
    "GO_tt_country_pool_revenue_enterprise_hat",
    "GO_ttg_cert",
    "GO_govfreeze_v2_human_screen_acceptance",
    "GO_phase2_gov_freeze_v2_clean_baseline",
    "GO_repository_alignment_cleanup",
]


def rel(p: Path) -> str:
    return str(p.relative_to(ROOT)).replace("\\", "/")


def load_latest_stamps() -> dict[str, str]:
    out: dict[str, str] = {}
    for bundle in ARCHIVE_BUNDLES:
        marker = ROOT / "evidence" / bundle / "latest-stamp.txt"
        if marker.exists():
            out[bundle] = marker.read_text(encoding="utf-8").strip()
        freeze_marker = ROOT / "evidence" / bundle / "freeze" / "latest-stamp.txt"
        if freeze_marker.exists():
            out[f"{bundle}/freeze"] = freeze_marker.read_text(encoding="utf-8").strip()
    return out


def is_protected(bundle: str, name: str, latest: dict[str, str]) -> bool:
    rel_path = f"{bundle}/{name}"
    if rel_path in PROTECTED_REL_PATHS:
        return True
    if latest.get(bundle) == name:
        return True
    if latest.get(f"{bundle}/freeze") == name:
        return True
    return False


def collect_moves(latest: dict[str, str]) -> list[tuple[Path, Path, str]]:
    moves: list[tuple[Path, Path, str]] = []
    for bundle in ARCHIVE_BUNDLES:
        base = ROOT / "evidence" / bundle
        if not base.is_dir():
            continue
        for child in sorted(base.iterdir()):
            if not child.is_dir():
                continue
            if child.name in RESERVED_SUBDIR_NAMES:
                continue
            if not STAMP_RE.match(child.name):
                continue
            if is_protected(bundle, child.name, latest):
                continue
            dest = ARCHIVE_ROOT / bundle / child.name
            moves.append((child, dest, rel(child)))
    return moves


def write_index(entries: list[dict], latest: dict[str, str], stamp: str) -> None:
    ARCHIVE_ROOT.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema": "traveltrust.archive-evidence-index.v1",
        "program_id": "TT_REPOSITORY_ALIGNMENT_CLEANUP_PROGRAM",
        "p3_archive_stamp_utc": stamp,
        "honest_boundary": "archived ≠ deleted · baseline anchors remain in active evidence paths",
        "protected_anchors": sorted(PROTECTED_REL_PATHS)
        + [f"{b}/{s}" for b, s in latest.items() if "/" not in b],
        "active_latest": latest,
        "entries": entries,
    }
    (ARCHIVE_ROOT / "ARCHIVE-EVIDENCE-INDEX.v1.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    readme = ARCHIVE_ROOT / "README.md"
    if not readme.exists():
        readme.write_text(
            "# Archive evidence (P3 · READ-ONLY)\n\n"
            "Duplicate run stamps **moved** here by "
            "`scripts/dev/archive-tt-repo-alignment-stale-evidence.py`.\n\n"
            "**禁止删除** — baseline anchors stay under `evidence/GO_*`.\n\n"
            "Index: `ARCHIVE-EVIDENCE-INDEX.v1.json`\n",
            encoding="utf-8",
        )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Move stamps (default: dry-run)")
    args = ap.parse_args()

    latest = load_latest_stamps()
    moves = collect_moves(latest)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    existing_entries: list[dict] = []
    index_path = ARCHIVE_ROOT / "ARCHIVE-EVIDENCE-INDEX.v1.json"
    if index_path.exists():
        try:
            existing_entries = json.loads(index_path.read_text(encoding="utf-8")).get("entries", [])
        except json.JSONDecodeError:
            existing_entries = []

    seen = {e.get("original_path") for e in existing_entries}
    new_entries = list(existing_entries)

    for src, dest, original in moves:
        if original in seen:
            continue
        if args.apply:
            if dest.exists():
                raise SystemExit(f"refusing to overwrite existing archive: {rel(dest)}")
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(dest))
        new_entries.append(
            {
                "bundle": original.split("/")[1],
                "stamp": src.name,
                "original_path": original,
                "archived_path": rel(dest),
                "archived_utc": stamp,
                "mode": "move",
            }
        )
        seen.add(original)
        print(f"{'MOVE' if args.apply else 'DRY'} {original} -> {rel(dest)}")

    write_index(new_entries, latest, stamp)
    print(
        f"TT_REPO_ALIGN_P3_ARCHIVE: {'APPLIED' if args.apply else 'DRY-RUN'} "
        f"moves={len(moves)} index_entries={len(new_entries)} stamp={stamp}"
    )


if __name__ == "__main__":
    main()
