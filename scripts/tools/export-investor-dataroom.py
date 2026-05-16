#!/usr/bin/env python3
"""
Export docs/fundraising/external/ to a self-contained investor Data Room folder (no repo context).

- Runs fundraising governance gate by default (FUNDRAISING_IR_GATE_ENFORCE=1).
- Copies tree to dist/TravelTrust-Investor-Materials-v{release}/ (default).
- Renames export-ready/ -> signed-pdfs/ and rewrites markdown links in the copy only.
- Optional --zip to create TravelTrust-Investor-Materials-v{release}.zip next to the folder.
- Optional --omit-markdown: investor handoff without .md; writes 00-START-HERE.txt at zip root
  (paths prefixed signed-pdfs/) and enforces demo/ allowlist (drops _frames, _segments, stray files).
- Scans exported .md for common repository-leak patterns (fail-closed).

Usage (repo root):
  python scripts/tools/build-investor-pitch-deck.py
  python scripts/tools/build-investor-demo-video.py
  python scripts/tools/export-investor-dataroom.py --zip --omit-markdown
  python scripts/tools/export-investor-dataroom.py --out D:/handoff/investor-pack
  python scripts/tools/export-investor-dataroom.py --zip --skip-gate

After export (recommended before external send, phase ①):
  bash scripts/gates/check-fundraising-lp-pack-pre-send.sh
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs" / "fundraising" / "external"
ANCHORS = ROOT / "registry" / "fundraising-external-numeric-anchors.v1.json"
GATE = ROOT / "scripts" / "gates" / "check-fundraising-ir-governance.py"
_TOOLS = ROOT / "scripts" / "tools"
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))
import investor_handoff_layout as ihr  # noqa: E402

# Same spirit as gate: investor bundle must not contain these.
LEAK_PATTERNS = (
    r"docs/spec",
    r"docs/fundraising/internal",
    r"registry/",
    r"scripts/gates",
    r"scripts/tools",
    r"\| \*\*Owner\*\* \|",
    r"\*\*文档控制（IR）\*\*",
    r"SSOT\*\*",
    r"product-manager/",
    r"CONTRIBUTING\.md",
    r"\.cursor",
    r"TT-96",
    r"\.\./internal",
    r"/internal/",
    r"机读闸",
    r"check-fundraising-ir-governance",
    r"fundraising-external-cn-en-pairs",
    r"fundraising-external-numeric-anchors",
)


def _release() -> str:
    if not ANCHORS.is_file():
        raise SystemExit(f"missing {ANCHORS}")
    data = json.loads(ANCHORS.read_text(encoding="utf-8"))
    r = data.get("release")
    if not r:
        raise SystemExit("numeric anchors JSON missing release")
    return str(r)


def _run_gate() -> None:
    if not GATE.is_file():
        raise SystemExit(f"missing gate {GATE}")
    env = {**os.environ, "FUNDRAISING_IR_GATE_ENFORCE": "1"}
    py = sys.executable or "python"
    r = subprocess.run([py, str(GATE)], cwd=str(ROOT), env=env)
    if r.returncode != 0:
        raise SystemExit("fundraising IR gate failed; fix before export")


def _rewrite_export_ready_links(text: str) -> str:
    text = text.replace("](export-ready/", "](signed-pdfs/")
    text = text.replace("](export-ready/README.md)", "](signed-pdfs/README.md)")
    text = text.replace("(export-ready/", "(signed-pdfs/")
    text = text.replace("/export-ready/", "/signed-pdfs/")
    return text


def _scan_leaks(dest: Path) -> list[str]:
    bad: list[str] = []
    for md in sorted(dest.rglob("*.md")):
        body = md.read_text(encoding="utf-8")
        for pat in LEAK_PATTERNS:
            if re.search(pat, body, re.IGNORECASE if pat.isascii() else 0):
                bad.append(f"{md.relative_to(dest)}: matches {pat!r}")
    return bad


def main() -> int:
    ap = argparse.ArgumentParser(description="Export investor Data Room from docs/fundraising/external")
    ap.add_argument(
        "--out",
        type=Path,
        help="Destination directory (default: dist/TravelTrust-Investor-Materials-v{release})",
    )
    ap.add_argument("--zip", action="store_true", help="Also create a .zip next to the folder")
    ap.add_argument(
        "--omit-markdown",
        action="store_true",
        help="Remove all .md from the export; writes zip-root 00-START-HERE.txt; enforces demo/ allowlist in copy",
    )
    ap.add_argument("--skip-gate", action="store_true", help="Skip FUNDRAISING_IR_GATE_ENFORCE gate")
    args = ap.parse_args()

    release = _release()
    default_out = ROOT / "dist" / f"TravelTrust-Investor-Materials-v{release}"
    dest: Path = (args.out or default_out).resolve()

    if not SOURCE.is_dir():
        print(f"FAIL: source missing {SOURCE}", file=sys.stderr)
        return 2

    if not args.skip_gate:
        _run_gate()

    if dest.exists():
        shutil.rmtree(dest)

    shutil.copytree(SOURCE, dest, dirs_exist_ok=False)

    er = dest / "export-ready"
    spd = dest / "signed-pdfs"
    if er.is_dir():
        er.rename(spd)
    else:
        spd.mkdir(parents=True, exist_ok=True)
        (spd / "README.md").write_text(
            "**TravelTrust · Investor materials** · Release **"
            + release
            + "** · May 2026\n\nPlace finalized PDF exports here.\n",
            encoding="utf-8",
            newline="\n",
        )

    for md in dest.rglob("*.md"):
        text = md.read_text(encoding="utf-8")
        new = _rewrite_export_ready_links(text)
        if new != text:
            md.write_text(new, encoding="utf-8", newline="\n")

    spd_root = dest / "signed-pdfs"
    if spd_root.is_dir() and ihr.prune_handoff_editable_from_ship_tree(spd_root, release):
        print("OK: pruned non-LP files from signed-pdfs/ (PDF-only; 04 = PitchDeck CN|EN)")

    demo_handoff = spd_root / "demo"
    if demo_handoff.is_dir():
        removed = ihr.prune_handoff_demo_to_allowlist(demo_handoff, release)
        if removed:
            print("OK: pruned disallowed demo/ entries:", ", ".join(removed))

    leaks = _scan_leaks(dest)
    if leaks:
        print("FAIL: leak scan in export:", file=sys.stderr)
        for line in leaks[:40]:
            print(f"  {line}", file=sys.stderr)
        shutil.rmtree(dest)
        return 1

    if args.omit_markdown:
        for md in list(dest.rglob("*.md")):
            md.unlink()
        spd_readme = dest / "signed-pdfs" / "README.md"
        if spd_readme.is_file():
            spd_readme.unlink()
        (dest / "00-START-HERE.txt").write_text(
            ihr.zip_root_start_here_text(release),
            encoding="utf-8",
            newline="\n",
        )

    print(f"OK: investor Data Room -> {dest}")

    if args.zip:
        zip_base = dest.parent / dest.name
        shutil.make_archive(str(zip_base), "zip", root_dir=str(dest.parent), base_dir=dest.name)
        print(f"OK: zip -> {zip_base}.zip")

    print(
        "NEXT (phase 1, before external send): bash scripts/gates/check-fundraising-lp-pack-pre-send.sh\n"
        "      then PACK-RELEASE-CHECKLIST-001 sections 2.2-2.8 + internal/33 legal sign-off"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
