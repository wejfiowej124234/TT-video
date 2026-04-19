#!/usr/bin/env python3
# B-360: machine digest of `.github/workflows/feature-flag-gate.yml` (240 / admin feature-flag fail-closed CI gate).
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ANCHOR = "CI-FEATURE-FLAG-GATE-WORKFLOW-DIGEST-V1"
IMPLEMENTATION_TT = "TT-B360-FEATURE-FLAG-LIFECYCLE-CLEANUP-LIST-001"
MOTHER_TABLE = "B-360"

_RE_ROUTE_TOTAL = re.compile(r"^\s*route_checks_total=(\d+)\s*$", re.M)
_RE_POLICY_TOTAL = re.compile(r"^\s*policy_checks_total=(\d+)\s*$", re.M)
_RE_IF_CHECK_ANCHOR = re.compile(
    r'^\s*if check_anchor "([^"]+)" "([^"]+)"; then\s*$', re.M
)
_RE_EVIDENCE_DIR = re.compile(
    r'echo "EVIDENCE_DIR=evidence/GO_\$\(date \+%Y%m%d\)"',
)

_ROUTE_EXPECTED = 4
_POLICY_EXPECTED = 2
_ANCHOR_EXPECTED = 6

_EXPECTED_ARTIFACT_PATHS = [
    "feature_flag_routes.log",
    "feature_flag_gate_summary.json",
    "feature_flag_gate_metrics.json",
    "flag_release_sampling_report.json",
    "feature_flag_evidence_field_report.json",
]


def repo_root_from_here() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _artifact_paths(yml: str) -> list[str]:
    marker = "name: feature-flag-evidence"
    idx = yml.find(marker)
    if idx < 0:
        return []
    sub = yml[idx:]
    p = sub.find("path: |")
    if p < 0:
        return []
    rest = sub[p + len("path: |") :]
    out: list[str] = []
    for line in rest.splitlines():
        s = line.strip()
        if not s:
            continue
        if s.startswith("evidence/GO_*/"):
            out.append(s.replace("evidence/GO_*/", ""))
        else:
            break
    return out


def build_digest(yml_text: str) -> dict[str, Any]:
    rt = _RE_ROUTE_TOTAL.findall(yml_text)
    pt = _RE_POLICY_TOTAL.findall(yml_text)
    anchors = [
        {"pattern": a, "target": b} for a, b in _RE_IF_CHECK_ANCHOR.findall(yml_text)
    ]
    return {
        "anchor": ANCHOR,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "workflow_file": ".github/workflows/feature-flag-gate.yml",
        "workflow_name": "Feature Flag Gate",
        "job_id": "feature-flag",
        "route_checks_total": int(rt[0]) if rt else None,
        "policy_checks_total": int(pt[0]) if pt else None,
        "if_check_anchor_count": len(anchors),
        "if_check_anchors": anchors,
        "evidence_dir_ci_pattern": "evidence/GO_$(date +%Y%m%d)",
        "evidence_dir_echo_present": bool(_RE_EVIDENCE_DIR.search(yml_text)),
        "upload_artifact": {
            "uses": "actions/upload-artifact@v4",
            "name": "feature-flag-evidence",
            "paths_under_go_wave": _artifact_paths(yml_text),
        },
    }


def verify(repo: Path) -> tuple[bool, str]:
    wf = repo / ".github" / "workflows" / "feature-flag-gate.yml"
    if not wf.is_file():
        return False, f"missing {wf}"
    text = wf.read_text(encoding="utf-8")
    if "Feature Flag Gate" not in text:
        return False, "unexpected workflow header"
    if not _RE_EVIDENCE_DIR.search(text):
        return False, "missing EVIDENCE_DIR echo"
    d = build_digest(text)
    if d["route_checks_total"] != _ROUTE_EXPECTED:
        return False, f"route_checks_total expected {_ROUTE_EXPECTED} got {d['route_checks_total']}"
    if d["policy_checks_total"] != _POLICY_EXPECTED:
        return False, f"policy_checks_total expected {_POLICY_EXPECTED} got {d['policy_checks_total']}"
    if d["if_check_anchor_count"] != _ANCHOR_EXPECTED:
        return (
            False,
            f"if check_anchor count expected {_ANCHOR_EXPECTED} got {d['if_check_anchor_count']}",
        )
    paths = d["upload_artifact"]["paths_under_go_wave"]
    if paths != _EXPECTED_ARTIFACT_PATHS:
        return False, f"artifact paths drift: {paths!r}"
    return True, f"OK ({ANCHOR}; routes={_ROUTE_EXPECTED} policies={_POLICY_EXPECTED} anchors={_ANCHOR_EXPECTED}; {IMPLEMENTATION_TT})"


def cmd_dump(args: argparse.Namespace) -> int:
    wf = repo_root_from_here() / ".github" / "workflows" / "feature-flag-gate.yml"
    body = build_digest(wf.read_text(encoding="utf-8"))
    if args.pretty:
        print(json.dumps(body, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(body, ensure_ascii=False, separators=(",", ":")))
    return 0


def cmd_verify(_: argparse.Namespace) -> int:
    ok, msg = verify(repo_root_from_here())
    if not ok:
        print(f"feature_flag_gate_workflow_digest: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"feature_flag_gate_workflow_digest: {msg}", file=sys.stderr)
    return 0


def cmd_self_test(_: argparse.Namespace) -> int:
    assert verify(repo_root_from_here())[0]
    print("feature_flag_gate_workflow_digest self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-360: digest feature-flag-gate workflow (read-only).",
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("dump", help="print JSON digest to stdout")
    d.add_argument("--pretty", action="store_true")
    d.set_defaults(func=cmd_dump)
    v = sub.add_parser("verify", help="pin counters, anchor count, artifact paths")
    v.set_defaults(func=cmd_verify)
    st = sub.add_parser("self-test", help="run verify")
    st.set_defaults(func=cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
