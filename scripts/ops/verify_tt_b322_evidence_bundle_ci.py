#!/usr/bin/env python3
# B-369: CI verify TT-B322 multi-tx evidence directory (committed fixtures).
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

IMPLEMENTATION_TT = "TT-B369-CI-BLOCKING-TT-B322-MULTI-TX-PARITY-001"
REQUIRED_FILES = (
    "execution_report.json",
    "receipt_archive.json",
    "onchain_reconcile.json",
    "production_go_report.json",
    "operator_run_evidence.json",
)


def verify_dir(root: Path) -> tuple[bool, str]:
    if not root.is_dir():
        return False, f"not a directory: {root}"
    for name in REQUIRED_FILES:
        p = root / name
        if not p.is_file():
            return False, f"missing {p.relative_to(root)}"
    pg = json.loads((root / "production_go_report.json").read_text(encoding="utf-8"))
    if str(pg.get("production_verdict") or "") != "GO":
        return False, "production_go_report.production_verdict must be GO"
    er = json.loads((root / "execution_report.json").read_text(encoding="utf-8"))
    steps = er.get("execution_steps")
    if not isinstance(steps, list) or len(steps) < 2:
        return False, "TT-B322 multi-tx: execution_steps must have >= 2 entries"
    return True, ""


def _cmd_verify(args: argparse.Namespace) -> int:
    root = Path(args.evidence_dir)
    ok, msg = verify_dir(root)
    if not ok:
        print(f"verify_tt_b322: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"verify_tt_b322: OK {root} ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    here = Path(__file__).resolve().parent
    root = here.parent.parent / "evidence" / "testnet_real_run_validation" / "run_tt_b322_anvil_multi_tx2_20260415"
    ok, msg = verify_dir(root)
    assert ok, msg
    print("verify_tt_b322_evidence_bundle_ci self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="B-369 TT-B322 evidence bundle CI verify")
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("verify", help="verify evidence directory")
    v.add_argument("evidence_dir", help="e.g. evidence/.../run_tt_b322_anvil_multi_tx2_20260415")
    v.set_defaults(func=_cmd_verify)
    st = sub.add_parser("self-test", help="verify committed multi_tx2 fixture")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
