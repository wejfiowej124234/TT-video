#!/usr/bin/env python3
"""Parse Site10 acceptance log for Playwright failures (pre-FE-crash vs infra)."""
from __future__ import annotations

import re
import sys
from collections import defaultdict
from pathlib import Path

ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")

# Round-1 priority buckets (restart8d / rerun5 同源)
BUCKET_RULES: list[tuple[str, re.Pattern[str]]] = [
    ("smoke-admin", re.compile(r"smoke-admin|smoke\.spec", re.I)),
    ("community", re.compile(r"community|section10-5-login-community", re.I)),
    ("admin-growth-ops", re.compile(r"g-s[0-9]|c-s[0-9]|o-s[0-9]|admin-growth", re.I)),
    ("p0-spine", re.compile(r"p0-spine|core-path", re.I)),
    ("auth-nav", re.compile(r"auth|account-nav|me-settings|me-identities", re.I)),
    ("market-escrow", re.compile(r"market|escrow|trust-gate|orders-list|pay", re.I)),
    ("governance", re.compile(r"governance|gov-", re.I)),
    ("93-matrix", re.compile(r"93-matrix", re.I)),
    ("traveltrust-pi1", re.compile(r"traveltrust|pi1-", re.I)),
    ("release-flow", re.compile(r"release-flow|epic-f", re.I)),
]


def strip_ansi(s: str) -> str:
    return ANSI.sub("", s)


def bucket_for_spec(spec: str) -> str:
    base = spec.replace("\\", "/")
    for name, pat in BUCKET_RULES:
        if pat.search(base):
            return name
    return "other"


def main() -> int:
    log = Path(
        sys.argv[1]
        if len(sys.argv) > 1
        else "frontend/evidence/GO_local_phase1/site10.acceptance.latest.log"
    )
    text = strip_ansi(log.read_text(encoding="utf-8", errors="replace"))

    first_refused = text.find("ERR_CONNECTION_REFUSED")
    pre = text[:first_refused] if first_refused > 0 else text

    blocks = re.split(r"\n\s*\d+\) \[chromium\] › ", pre)
    by_spec: dict[str, list[tuple[str, str, str]]] = defaultdict(list)

    for block in blocks[1:]:
        m = re.match(r"(e2e[^\n]+)", block)
        if not m:
            continue
        title = m.group(1).strip()
        spec = title.split(" › ")[0]
        body = block[m.end() :]
        err_lines = [
            ln.strip()
            for ln in body.splitlines()
            if ln.strip().startswith("Error:")
            or ln.strip().startswith("TimeoutError:")
            or "strict mode violation" in ln
            or ln.strip().startswith("Expected:")
        ]
        err = err_lines[0][:300] if err_lines else "(no Error line)"
        by_spec[spec].append((title, err, body[:1200]))

    total = sum(len(v) for v in by_spec.values())
    by_bucket: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for spec, items in by_spec.items():
        b = bucket_for_spec(spec)
        for title, err, _ in items:
            by_bucket[b].append((spec, title, err))

    print(f"log={log}")
    print(f"first ERR_CONNECTION_REFUSED at char {first_refused}")
    print(f"REAL failures before FE crash: {total}\n")

    print("=== BUCKETS (priority order) ===")
    bucket_order = [b for b, _ in BUCKET_RULES] + ["other"]
    for bucket in bucket_order:
        items = by_bucket.get(bucket, [])
        if not items:
            continue
        specs = {s for s, _, _ in items}
        print(f"  {bucket}: {len(items)} fail(s) across {len(specs)} spec(s)")
    print()

    first_real: tuple[str, str, str] | None = None
    for spec, items in sorted(by_spec.items(), key=lambda x: x[1][0][0]):
        for title, err, _ in items:
            first_real = (spec, title, err)
            break
        if first_real:
            break

    if first_real:
        spec, title, err = first_real
        print("=== FIRST REAL FAIL (fix this bucket first) ===")
        print(f"  bucket: {bucket_for_spec(spec)}")
        print(f"  spec:   {spec}")
        print(f"  case:   {title[:120]}")
        print(f"  err:    {err}")
        print()

    for spec, items in sorted(by_spec.items(), key=lambda x: -len(x[1])):
        print(f"=== {spec} ({len(items)}) · {bucket_for_spec(spec)} ===")
        seen: set[str] = set()
        for title, err, _body in items:
            if err in seen:
                continue
            seen.add(err)
            print(f"  - {title[:110]}")
            print(f"    {err}")
        print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
