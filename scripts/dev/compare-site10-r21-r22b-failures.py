#!/usr/bin/env python3
"""Compare Site10 REAL FAIL spec keys: rerun21 (29) vs r22b (55)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "dev"))
import importlib.util

spec = importlib.util.spec_from_file_location("parse_site10", ROOT / "scripts" / "dev" / "parse-site10-failures.py")
parse_mod = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(parse_mod)


def extract_keys(log_path: Path) -> dict[str, str]:
    text = parse_mod.strip_ansi(log_path.read_text(encoding="utf-8", errors="replace"))
    refused = text.find("ERR_CONNECTION_REFUSED")
    pre = text[:refused] if refused > 0 else text
    blocks = re.split(r"\n\s*\d+\) \[chromium\] › ", pre)
    out: dict[str, str] = {}
    for block in blocks[1:]:
        m = re.match(r"(e2e[^\n]+)", block)
        if not m:
            continue
        title = m.group(1).strip()
        key = title.split(" › ", 1)[0].replace("\\", "/")
        bucket = parse_mod.bucket_for_spec(key)
        out[key] = bucket
    return out


def extract_keys_from_parse_summary(parse_path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in parse_path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("=== e2e"):
            continue
        head = line.split(" (")[0].replace("=== ", "").strip().replace("\\", "/")
        bucket = line.split(" · ")[-1].strip().rstrip("=") if " · " in line else parse_mod.bucket_for_spec(head)
        out[head] = bucket
    return out


def main() -> int:
    r21_log = ROOT / "frontend/evidence/GO_local_phase1/site10-rerun21-orchestrator.log"
    r21_parse = ROOT / "frontend/evidence/GO_local_phase1/site10-rerun21-parse.txt"
    r22b_log = ROOT / "frontend/evidence/GO_local_phase1/site10.acceptance.latest.log"
    out_path = ROOT / "frontend/evidence/GO_local_phase1/site10-r22b-vs-r21-diff.txt"

    r21_map = extract_keys(r21_log) if r21_log.is_file() else {}
    if len(r21_map) < 20 and r21_parse.is_file():
        r21_map = extract_keys_from_parse_summary(r21_parse)
    r22b_map = extract_keys(r22b_log)
    r21_keys = set(r21_map.keys())
    r22b_keys = set(r22b_map.keys())

    new_keys = sorted(r22b_keys - r21_keys)
    orig_keys = sorted(r22b_keys & r21_keys)
    cleared_keys = sorted(r21_keys - r22b_keys)

    def summarize(keys: list[str], bucket_map: dict[str, str]) -> dict[str, list[str]]:
        by_bucket: dict[str, list[str]] = {}
        for k in keys:
            b = bucket_map.get(k) or parse_mod.bucket_for_spec(k)
            by_bucket.setdefault(b, []).append(k)
        return by_bucket

    lines: list[str] = []
    lines.append("Site10 REAL FAIL diff · r22b (55) vs rerun21 (29)")
    lines.append(f"r21 keys: {len(r21_keys)} · r22b keys: {len(r22b_keys)}")
    lines.append("")
    lines.append(f"=== NEW (r22b only): {len(new_keys)} ===")
    for b, items in sorted(summarize(new_keys, r22b_map).items(), key=lambda x: -len(x[1])):
        lines.append(f"  [{b}] {len(items)}")
        for k in items:
            lines.append(f"    - {k}")
    lines.append("")
    lines.append(f"=== ORIGINAL (both): {len(orig_keys)} ===")
    for b, items in sorted(summarize(orig_keys, r22b_map).items(), key=lambda x: -len(x[1])):
        lines.append(f"  [{b}] {len(items)}")
        for k in items:
            lines.append(f"    - {k}")
    lines.append("")
    lines.append(f"=== CLEARED (r21 only): {len(cleared_keys)} ===")
    for k in cleared_keys:
        b = r21_map.get(k, "?")
        lines.append(f"    - [{b}] {k}")

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(out_path.read_text(encoding="utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
