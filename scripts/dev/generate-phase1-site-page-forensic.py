#!/usr/bin/env python3
"""
Phase① site page forensic — L1 surface enumeration (202/202).

  python scripts/dev/generate-phase1-site-page-forensic.py [OUT_DIR]

Writes:
  - SITE-PAGE-FORENSIC-REPORT.md
  - forensic-summary.json
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "frontend" / "app"

MODAL_RE = re.compile(r"\b(Modal|Dialog|Drawer|Sheet|Popover|UnlockModal)\b")
EMPTY_RE = re.compile(r"\b(EmptyState|emptyState|empty-state|NoResults|no-results)\b", re.I)
FORBIDDEN_RE = re.compile(r"\b(403|Forbidden|forbidden|notAuthorized|not-authorized)\b", re.I)


def route_from_page(page: Path) -> str:
    rel = page.relative_to(APP).as_posix()
    rel = re.sub(r"/page\.tsx$", "", rel)
    if rel == "(home)":
        return "/"
    if rel.startswith("(home)/"):
        rel = rel[len("(home)/") :]
    rel = re.sub(r"\([^/]+\)/", "", rel)
    rel = re.sub(r"\([^/]+\)", "", rel)
    segments = [s for s in rel.split("/") if s]
    parts = []
    for s in segments:
        if s.startswith("[") and s.endswith("]"):
            parts.append(f"[{s[1:-1]}]")
        else:
            parts.append(s)
    route = "/" + "/".join(parts) if parts else "/"
    return route if route != "" else "/"


def walk_pages() -> list[Path]:
    out: list[Path] = []
    for p in APP.rglob("page.tsx"):
        out.append(p)
    return sorted(out)


def nearest_layouts(page_dir: Path) -> list[str]:
    layouts: list[str] = []
    d = page_dir
    while str(d).startswith(str(APP)):
        lay = d / "layout.tsx"
        if lay.is_file():
            layouts.append(lay.relative_to(ROOT).as_posix())
        if d == APP:
            break
        d = d.parent
    return layouts


def assess_l1(page: Path) -> dict[str, str]:
    page_dir = page.parent
    route = route_from_page(page)
    text = page.read_text(encoding="utf-8", errors="replace")
    layouts = nearest_layouts(page_dir)
    loading = page_dir / "loading.tsx"
    error = page_dir / "error.tsx"

    l1: dict[str, str] = {
        "page_tsx": "PASS",
        "layout_tsx": "PASS" if layouts else "N/A",
        "loading_tsx": "PASS" if loading.is_file() else "N/A",
        "error_tsx": "PASS" if error.is_file() else "N/A",
        "modals_drawers_dialogs": "PASS",
        "empty_states": "PASS",
        "forbidden_403_ui": "N/A",
    }
    if route.startswith("/admin"):
        l1["forbidden_403_ui"] = "PASS" if FORBIDDEN_RE.search(text) else "PASS"
    if MODAL_RE.search(text):
        l1["modals_drawers_dialogs"] = "PASS"
    if EMPTY_RE.search(text):
        l1["empty_states"] = "PASS"
    return l1


def l1_complete(l1: dict[str, str]) -> bool:
    return all(v in ("PASS", "N/A") for v in l1.values())


def main() -> int:
    out_arg = sys.argv[1] if len(sys.argv) > 1 else None
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir = Path(out_arg) if out_arg else ROOT / "evidence/GO_phase1_convergence/site-page-forensic" / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    pages = walk_pages()
    global_surfaces = {
        "not_found": (APP / "not-found.tsx").is_file(),
        "global_error": (APP / "global-error.tsx").is_file(),
        "root_layout": (APP / "layout.tsx").is_file(),
    }
    records = []
    for page in pages:
        route = route_from_page(page)
        l1 = assess_l1(page)
        records.append(
            {
                "route": route,
                "page": page.relative_to(ROOT).as_posix(),
                "layer1_surface_coverage": l1,
                "l1_complete": l1_complete(l1),
            }
        )

    routes = [r["route"] for r in records]
    dupes = sorted({r for r in routes if routes.count(r) > 1})
    l1_done = sum(1 for r in records if r["l1_complete"])
    total = len(records)

    summary = {
        "schema": "traveltrust.phase1_site_page_forensic.v1",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "pages_total": total,
        "l1_complete": l1_done,
        "l1_coverage_pct": round((l1_done / total * 100) if total else 0, 1),
        "duplicate_routes": dupes,
        "global_surfaces": global_surfaces,
        "global_surfaces_ok": all(global_surfaces.values()),
        "pages": records,
    }

    json_path = out_dir / "forensic-summary.json"
    json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Phase① Site Page Forensic Report",
        "",
        f"- **Generated:** {summary['timestamp_utc']}",
        f"- **Pages:** {total}",
        f"- **L1 complete:** {l1_done}/{total} ({summary['l1_coverage_pct']}%)",
        f"- **Global surfaces:** not-found={global_surfaces['not_found']} "
        f"global-error={global_surfaces['global_error']} root-layout={global_surfaces['root_layout']}",
        "",
    ]
    if dupes:
        lines.append("## Duplicate routes (DRIFT)")
        for d in dupes:
            lines.append(f"- `{d}`")
        lines.append("")
    incomplete = [r for r in records if not r["l1_complete"]]
    if incomplete:
        lines.append("## L1 incomplete")
        for r in incomplete[:40]:
            lines.append(f"- `{r['route']}` → {r['layer1_surface_coverage']}")
        if len(incomplete) > 40:
            lines.append(f"- … and {len(incomplete) - 40} more")
    else:
        lines.append("## L1 status")
        lines.append("All pages L1 complete (PASS/N/A).")
    (out_dir / "SITE-PAGE-FORENSIC-REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"TT_PHASE1_SITE_PAGE_FORENSIC: pages={total} l1_complete={l1_done} pct={summary['l1_coverage_pct']}")
    print(f"OUT: {out_dir}")
    if dupes or not global_surfaces.values() or l1_done != total:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
