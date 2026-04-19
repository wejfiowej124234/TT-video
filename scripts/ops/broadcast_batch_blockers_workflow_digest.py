#!/usr/bin/env python3
# B-345: machine leg — `broadcast-batch-blockers.yml` is the merge-blocking aggregate gate (three batch scripts).
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ANCHOR = "CI-BROADCAST-BATCH-BLOCKERS-DIGEST-V1"
IMPLEMENTATION_TT = "TT-B345-BRANCH-PROTECTION-REQUIRED-CHECKS-DOC-001"
MOTHER_TABLE = "B-345"

_RE_RUN_SCRIPT = re.compile(
    r"^\s*run:\s+bash\s+(scripts/gates/broadcast-batch-[123]-blockers\.sh)\s*$",
    re.M,
)


def repo_root_from_here() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def build_digest(yml_text: str) -> dict[str, Any]:
    scripts = _RE_RUN_SCRIPT.findall(yml_text)
    return {
        "anchor": ANCHOR,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "workflow_file": ".github/workflows/broadcast-batch-blockers.yml",
        "workflow_name": "Broadcast batch blockers",
        "batch_gate_scripts": scripts,
        "batch_gate_script_count": len(scripts),
    }


def verify(repo: Path) -> tuple[bool, str]:
    wf = repo / ".github" / "workflows" / "broadcast-batch-blockers.yml"
    if not wf.is_file():
        return False, f"missing {wf}"
    text = wf.read_text(encoding="utf-8")
    if "Broadcast batch blockers" not in text:
        return False, "unexpected workflow name"
    scripts = _RE_RUN_SCRIPT.findall(text)
    expected = [
        "scripts/gates/broadcast-batch-1-blockers.sh",
        "scripts/gates/broadcast-batch-2-blockers.sh",
        "scripts/gates/broadcast-batch-3-blockers.sh",
    ]
    if scripts != expected:
        return False, f"batch script run lines drift: {scripts!r}"
    for rel in expected:
        p = repo / rel
        if not p.is_file():
            return False, f"missing gate script {rel}"
    return True, f"OK ({ANCHOR}; 3 batch gates; {IMPLEMENTATION_TT})"


def cmd_dump(args: argparse.Namespace) -> int:
    wf = repo_root_from_here() / ".github" / "workflows" / "broadcast-batch-blockers.yml"
    body = build_digest(wf.read_text(encoding="utf-8"))
    if args.pretty:
        print(json.dumps(body, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(body, ensure_ascii=False, separators=(",", ":")))
    return 0


def cmd_verify(_: argparse.Namespace) -> int:
    ok, msg = verify(repo_root_from_here())
    if not ok:
        print(f"broadcast_batch_blockers_workflow_digest: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"broadcast_batch_blockers_workflow_digest: {msg}", file=sys.stderr)
    return 0


def cmd_self_test(_: argparse.Namespace) -> int:
    assert verify(repo_root_from_here())[0]
    sample = "      - name: x\n        run: bash scripts/gates/broadcast-batch-1-blockers.sh\n"
    assert _RE_RUN_SCRIPT.findall(sample) == ["scripts/gates/broadcast-batch-1-blockers.sh"]
    print("broadcast_batch_blockers_workflow_digest self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-345: digest broadcast-batch-blockers workflow (read-only).",
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("dump", help="print JSON digest to stdout")
    d.add_argument("--pretty", action="store_true")
    d.set_defaults(func=cmd_dump)
    v = sub.add_parser("verify", help="pin three batch gate run lines + script files exist")
    v.set_defaults(func=cmd_verify)
    st = sub.add_parser("self-test", help="verify + regex sanity")
    st.set_defaults(func=cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
