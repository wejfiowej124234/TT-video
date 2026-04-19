#!/usr/bin/env python3
# B-310: machine leg — indexer-reconcile-gate.yml `checks_total` vs `check_anchor` invocations vs
# scripts/ops/indexer-reconcile-probe.sh INDEXER_RECONCILE_GATE_CHECKS_TOTAL (no doc/07/110 edits).
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ANCHOR = "110-INDEXER-RECONCILE-GATE-CHECKS-TOTAL-PREFLIGHT-V1"
IMPLEMENTATION_TT = "TT-B310-110-CHECKS-TOTAL-TRIPLE-DOC-SYNC-CHECKLIST-001"
MOTHER_TABLE = "B-310"

_RE_CHECKS_TOTAL_ASSIGN = re.compile(r"^\s*checks_total=(\d+)\s*$", re.M)
_RE_CHECK_ANCHOR_CALL = re.compile(r"^\s*check_anchor\s+\"", re.M)
_RE_PROBE_TOTAL = re.compile(
    r"^\s*INDEXER_RECONCILE_GATE_CHECKS_TOTAL=(\d+)\s*$", re.M
)


def repo_root_from_here() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def parse_gate_workflow(yml_text: str) -> tuple[int | None, int, str]:
    """Return (declared_total, call_count, error_message)."""
    assigns = _RE_CHECKS_TOTAL_ASSIGN.findall(yml_text)
    if len(assigns) != 1:
        return None, 0, f"expected exactly one checks_total=NN in workflow, got {len(assigns)}"
    declared = int(assigns[0])
    calls = len(_RE_CHECK_ANCHOR_CALL.findall(yml_text))
    return declared, calls, ""


def parse_probe_script(sh_text: str) -> tuple[int | None, str]:
    found = _RE_PROBE_TOTAL.findall(sh_text)
    if len(found) != 1:
        return None, f"expected exactly one INDEXER_RECONCILE_GATE_CHECKS_TOTAL=NN in probe, got {len(found)}"
    return int(found[0]), ""


def verify(repo: Path) -> tuple[bool, str]:
    wf = repo / ".github" / "workflows" / "indexer-reconcile-gate.yml"
    probe = repo / "scripts" / "ops" / "indexer-reconcile-probe.sh"
    if not wf.is_file():
        return False, f"missing {wf}"
    if not probe.is_file():
        return False, f"missing {probe}"
    wtxt = wf.read_text(encoding="utf-8")
    ptxt = probe.read_text(encoding="utf-8")
    declared, calls, err = parse_gate_workflow(wtxt)
    if err:
        return False, err
    assert declared is not None
    if declared != calls:
        return (
            False,
            f"workflow drift: checks_total={declared} but check_anchor invocations={calls}",
        )
    probe_total, perr = parse_probe_script(ptxt)
    if perr:
        return False, perr
    assert probe_total is not None
    if probe_total != declared:
        return (
            False,
            f"probe drift: INDEXER_RECONCILE_GATE_CHECKS_TOTAL={probe_total} "
            f"!= workflow checks_total={declared}",
        )
    return True, f"OK checks_total={declared} (anchors={calls}; {ANCHOR}; {IMPLEMENTATION_TT})"


def cmd_verify(_: argparse.Namespace) -> int:
    ok, msg = verify(repo_root_from_here())
    if not ok:
        print(f"indexer_reconcile_gate_checks_total_preflight: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"indexer_reconcile_gate_checks_total_preflight: {msg}", file=sys.stderr)
    return 0


def cmd_self_test(_: argparse.Namespace) -> int:
    repo = repo_root_from_here()
    ok, msg = verify(repo)
    assert ok, msg
    # synthetic drift detection
    bad_yaml = "checks_total=1\n" + "\n".join(f'          check_anchor "m{i}" "p{i}" "t{i}"' for i in range(3))
    d, c, _ = parse_gate_workflow(bad_yaml)
    assert d == 1 and c == 3
    print("indexer_reconcile_gate_checks_total_preflight self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-310: verify indexer-reconcile-gate checks_total matches check_anchor count and probe.",
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("verify", help="compare workflow vs scripts/ops/indexer-reconcile-probe.sh")
    v.set_defaults(func=cmd_verify)
    st = sub.add_parser("self-test", help="verify repo + unit-style parser checks")
    st.set_defaults(func=cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
