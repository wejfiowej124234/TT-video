#!/usr/bin/env python3
"""Parse denoised regression matrix log · compare against 22-key manifest."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVID = ROOT / "frontend/evidence/GO_local_phase1"
MANIFEST = EVID / "site10-r22-true-regression-manifest.txt"
DEFAULT_LOG = EVID / "site10-r22b-denoised-regression.latest.log"

ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")


def strip_ansi(s: str) -> str:
    return ANSI.sub("", s)


def load_manifest_keys(path: Path) -> list[str]:
    keys: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("["):
            continue
        if line.startswith("e2e/") and ":" in line:
            keys.append(line.replace("\\", "/"))
    return keys


def extract_fail_keys(log_text: str) -> set[str]:
    text = strip_ansi(log_text)
    keys: set[str] = set()
    blocks = re.split(r"\n\s*\d+\) \[chromium\] › ", text)
    for block in blocks[1:]:
        m = re.match(r"(e2e[^\n]+)", block)
        if not m:
            continue
        title = m.group(1).strip()
        key = title.split(" › ", 1)[0].replace("\\", "/")
        keys.add(key)
    return keys


def run_complete(log_text: str) -> bool:
    text = strip_ansi(log_text)
    if "webServer exited early" in text:
        return False
    if "DENOISED_REGRESSION_FAIL: batch" in text and " passed (" not in text:
        return False
    return bool(re.search(r"\d+ passed\s*\(", text))


def main() -> int:
    log_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_LOG
    manifest_keys = load_manifest_keys(MANIFEST)
    if not log_path.is_file():
        print(f"log missing: {log_path}")
        print(f"manifest keys: {len(manifest_keys)}")
        return 1

    fail_keys = extract_fail_keys(log_path.read_text(encoding="utf-8", errors="replace"))
    manifest_set = set(manifest_keys)
    still_red = sorted(manifest_set & fail_keys)
    cleared = sorted(manifest_set - fail_keys)
    extra = sorted(fail_keys - manifest_set)
    complete = run_complete(log_path.read_text(encoding="utf-8", errors="replace"))

    lines = [
        f"denoised log={log_path}",
        f"manifest true-regression keys: {len(manifest_set)}",
        f"run_complete: {complete}",
        f"still RED in manifest: {len(still_red)}",
        f"cleared vs manifest: {len(cleared)}",
        f"extra fails (not in manifest): {len(extra)}",
        "",
    ]
    if still_red:
        lines.append(f"=== STILL RED ({len(still_red)}) ===")
        for k in still_red:
            lines.append(f"  - {k}")
        lines.append("")
    if extra:
        lines.append(f"=== EXTRA FAIL ({len(extra)}) ===")
        for k in extra:
            lines.append(f"  - {k}")
        lines.append("")
    if cleared:
        lines.append(f"=== CLEARED ({len(cleared)}) ===")
        for k in cleared:
            lines.append(f"  - {k}")

    out = EVID / "site10-r22b-denoised-regression-parse.txt"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    if not complete:
        return 1
    if still_red:
        return 1
    if not manifest_set:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
