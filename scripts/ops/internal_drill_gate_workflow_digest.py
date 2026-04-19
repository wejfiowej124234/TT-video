#!/usr/bin/env python3
# B-326: machine-readable digest of .github/workflows/internal-drill-gate.yml (params + artifacts + grep anchors).
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ANCHOR = "CI-INTERNAL-DRILL-GATE-WORKFLOW-DIGEST-V1"
IMPLEMENTATION_TT = "TT-B326-INTERNAL-DRILL-GATE-WORKFLOW-PARAMS-TABLE-001"
MOTHER_TABLE = "B-326"

# Pinned to current workflow; bump when anchors are intentionally added/removed.
_EXPECTED_GREP_ANCHOR_COUNT = 83

_RE_WORKFLOW_NAME = re.compile(r"^name:\s*(.+?)\s*$", re.M)
_RE_GREP_ANCHOR = re.compile(r'^\s*grep -n "([^"]+)"\s+(\S+)\s*$', re.M)
_RE_ARTIFACT_NAME = re.compile(
    r"uses:\s*actions/upload-artifact@v4\s*\n\s*with:\s*\n\s*name:\s*(\S+)",
    re.M,
)
_RE_EVIDENCE_DIR = re.compile(
    r'echo "EVIDENCE_DIR=evidence/GO_\$\(date \+%Y%m%d\)"',
)


def repo_root_from_here() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _artifact_paths_block(yml: str) -> list[str]:
    """Paths under upload-artifact `path: |` block (relative lines, trimmed)."""
    m = re.search(
        r"uses:\s*actions/upload-artifact@v4.*?path:\s*\|\s*\n"
        r"((?:\s+\$\{\{\s*env\.EVIDENCE_DIR\s*\}\}/[^\n]+\n?)+)",
        yml,
        re.S,
    )
    if not m:
        return []
    out: list[str] = []
    for line in m.group(1).splitlines():
        s = line.strip()
        if s.startswith("${{ env.EVIDENCE_DIR }}/"):
            out.append(s.replace("${{ env.EVIDENCE_DIR }}/", ""))
    return out


def build_digest(yml_text: str) -> dict[str, Any]:
    wm = _RE_WORKFLOW_NAME.search(yml_text)
    anchors = [
        {"pattern": p, "path": path} for p, path in _RE_GREP_ANCHOR.findall(yml_text)
    ]
    am = _RE_ARTIFACT_NAME.search(yml_text)
    paths = _artifact_paths_block(yml_text)
    return {
        "anchor": ANCHOR,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "workflow_name": (wm.group(1).strip() if wm else None),
        "workflow_file": ".github/workflows/internal-drill-gate.yml",
        "job_id": "internal-drill",
        "triggers": {
            "push_branches": ["main"],
            "pull_request_branches": ["main"],
        },
        "evidence_dir_ci_pattern": "evidence/GO_$(date +%Y%m%d)",
        "evidence_dir_echo_present": bool(_RE_EVIDENCE_DIR.search(yml_text)),
        "upload_artifact": {
            "uses": "actions/upload-artifact@v4",
            "name": am.group(1) if am else None,
            "paths_relative_to_evidence_dir": paths,
        },
        "grep_anchor_count": len(anchors),
        "grep_anchors": anchors,
    }


def cmd_dump(args: argparse.Namespace) -> int:
    repo = repo_root_from_here()
    wf = repo / ".github" / "workflows" / "internal-drill-gate.yml"
    if not wf.is_file():
        print(f"internal_drill_gate_workflow_digest: missing {wf}", file=sys.stderr)
        return 1
    body = build_digest(wf.read_text(encoding="utf-8"))
    if args.pretty:
        print(json.dumps(body, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(body, ensure_ascii=False, separators=(",", ":")))
    return 0


def cmd_verify(args: argparse.Namespace) -> int:
    repo = repo_root_from_here()
    wf = repo / ".github" / "workflows" / "internal-drill-gate.yml"
    if not wf.is_file():
        print(f"internal_drill_gate_workflow_digest: FAIL missing {wf}", file=sys.stderr)
        return 1
    text = wf.read_text(encoding="utf-8")
    if "internal-drill:" not in text or "Internal Drill Gate" not in text:
        print("internal_drill_gate_workflow_digest: FAIL unexpected workflow layout", file=sys.stderr)
        return 1
    if not _RE_EVIDENCE_DIR.search(text):
        print("internal_drill_gate_workflow_digest: FAIL missing EVIDENCE_DIR echo", file=sys.stderr)
        return 1
    n = len(_RE_GREP_ANCHOR.findall(text))
    if n != _EXPECTED_GREP_ANCHOR_COUNT:
        print(
            f"internal_drill_gate_workflow_digest: FAIL grep anchor count {n} "
            f"!= expected {_EXPECTED_GREP_ANCHOR_COUNT} (workflow drift?)",
            file=sys.stderr,
        )
        return 1
    up = _artifact_paths_block(text)
    if up != ["internal_boundary_check.md", "internal_audit_sample.json"]:
        print(f"internal_drill_gate_workflow_digest: FAIL artifact paths {up!r}", file=sys.stderr)
        return 1
    print(
        f"internal_drill_gate_workflow_digest: OK ({ANCHOR}; anchors={n}; {IMPLEMENTATION_TT})",
        file=sys.stderr,
    )
    return 0


def cmd_self_test(_: argparse.Namespace) -> int:
    assert cmd_verify(argparse.Namespace()) == 0
    repo = repo_root_from_here()
    d = build_digest((repo / ".github" / "workflows" / "internal-drill-gate.yml").read_text(encoding="utf-8"))
    assert d["grep_anchor_count"] == _EXPECTED_GREP_ANCHOR_COUNT
    assert d["upload_artifact"]["name"] == "internal-drill-evidence"
    print("internal_drill_gate_workflow_digest self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-326: emit JSON digest for internal-drill-gate workflow (read-only).",
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("dump", help="print workflow digest JSON to stdout")
    d.add_argument("--pretty", action="store_true", help="indent JSON")
    d.set_defaults(func=cmd_dump)
    v = sub.add_parser("verify", help="structural checks + pinned grep anchor count")
    v.set_defaults(func=cmd_verify)
    st = sub.add_parser("self-test", help="verify + digest assertions")
    st.set_defaults(func=cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
