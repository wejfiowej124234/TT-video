#!/usr/bin/env python3
# B-344: read-only inventory of `continue-on-error` in .github/workflows (flaky / non-blocking CI policy surface).
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ANCHOR = "CI-CONTINUE-ON-ERROR-INVENTORY-V1"
IMPLEMENTATION_TT = "TT-B344-FLAKY-TEST-QUARANTINE-CI-POLICY-001"
MOTHER_TABLE = "B-344"

# Pinned to current build.yml; bump intentionally when CI quarantine layout changes.
_BUILD_YML_TRUE_EXPECTED = 12
_BUILD_YML_FALSE_EXPECTED = 1

_RE_COE_TRUE = re.compile(r"^\s*continue-on-error:\s*true(\s+#.*)?$", re.M)
_RE_COE_FALSE = re.compile(r"^\s*continue-on-error:\s*false(\s+#.*)?$", re.M)


def repo_root_from_here() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _counts(text: str) -> tuple[int, int]:
    return len(_RE_COE_TRUE.findall(text)), len(_RE_COE_FALSE.findall(text))


def build_inventory(repo: Path) -> dict[str, Any]:
    wf_dir = repo / ".github" / "workflows"
    rows: list[dict[str, Any]] = []
    tot_t = tot_f = 0
    paths = sorted({*wf_dir.glob("*.yml"), *wf_dir.glob("*.yaml")})
    for path in paths:
        if not path.is_file():
            continue
        txt = path.read_text(encoding="utf-8", errors="replace")
        t, f = _counts(txt)
        tot_t += t
        tot_f += f
        rows.append(
            {
                "file": path.name,
                "continue_on_error_true": t,
                "continue_on_error_false": f,
            }
        )
    return {
        "anchor": ANCHOR,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "workflows_dir": ".github/workflows",
        "files": rows,
        "totals": {
            "continue_on_error_true": tot_t,
            "continue_on_error_false": tot_f,
        },
    }


def verify(repo: Path) -> tuple[bool, str]:
    inv = build_inventory(repo)
    build = next((r for r in inv["files"] if r["file"] == "build.yml"), None)
    if not build:
        return False, "missing build.yml in .github/workflows"
    if build["continue_on_error_true"] != _BUILD_YML_TRUE_EXPECTED:
        return (
            False,
            f"build.yml continue-on-error:true count {build['continue_on_error_true']} "
            f"!= expected {_BUILD_YML_TRUE_EXPECTED}",
        )
    if build["continue_on_error_false"] != _BUILD_YML_FALSE_EXPECTED:
        return (
            False,
            f"build.yml continue-on-error:false count {build['continue_on_error_false']} "
            f"!= expected {_BUILD_YML_FALSE_EXPECTED}",
        )
    bb = repo / ".github" / "workflows" / "broadcast-batch-blockers.yml"
    if not bb.is_file():
        return False, "missing broadcast-batch-blockers.yml"
    bb_txt = bb.read_text(encoding="utf-8", errors="replace")
    if "continue-on-error" not in bb_txt:
        return False, "broadcast-batch-blockers.yml missing continue-on-error policy comment"
    return True, f"OK ({ANCHOR}; build.yml {_BUILD_YML_TRUE_EXPECTED}T/{_BUILD_YML_FALSE_EXPECTED}F; {IMPLEMENTATION_TT})"


def cmd_dump(args: argparse.Namespace) -> int:
    body = build_inventory(repo_root_from_here())
    if args.pretty:
        print(json.dumps(body, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(body, ensure_ascii=False, separators=(",", ":")))
    return 0


def cmd_verify(_: argparse.Namespace) -> int:
    ok, msg = verify(repo_root_from_here())
    if not ok:
        print(f"ci_continue_on_error_inventory: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"ci_continue_on_error_inventory: {msg}", file=sys.stderr)
    return 0


def cmd_self_test(_: argparse.Namespace) -> int:
    assert verify(repo_root_from_here())[0]
    inv = build_inventory(repo_root_from_here())
    assert inv["totals"]["continue_on_error_true"] >= _BUILD_YML_TRUE_EXPECTED
    sample = "    continue-on-error: true # x\n    continue-on-error: false\n"
    assert _counts(sample) == (1, 1)
    print("ci_continue_on_error_inventory self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-344: inventory continue-on-error flags across GitHub workflows (read-only).",
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("dump", help="print JSON inventory to stdout")
    d.add_argument("--pretty", action="store_true")
    d.set_defaults(func=cmd_dump)
    v = sub.add_parser("verify", help="pin build.yml true/false counts + broadcast policy file")
    v.set_defaults(func=cmd_verify)
    st = sub.add_parser("self-test", help="verify + small regex checks")
    st.set_defaults(func=cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
