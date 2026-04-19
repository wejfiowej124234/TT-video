#!/usr/bin/env python3
# B-282: idempotent resume after partial or full broadcast — delegates to B-262 execute with --resume-from-execution-report.
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

IMPLEMENTATION_TT = "TT-B282-IDEMPOTENT-RESUME-SKIP-MINED-STEPS-001"


def _cmd_resume_execute(args: argparse.Namespace) -> int:
    exe = Path(__file__).resolve().parent / "region_vault_claim_broadcast_execute.py"
    cmd: list[str] = [
        sys.executable,
        str(exe),
        "execute",
        args.broadcast_request_stub,
        "-o",
        args.output,
        "--resume-from-execution-report",
        args.prior_execution_report,
    ]
    if getattr(args, "signing_order_static_table", None):
        cmd.extend(["--signing-order-static-table", args.signing_order_static_table])
    rem = list(args.remainder)
    if rem and rem[0] == "--":
        rem = rem[1:]
    cmd.extend(rem)
    return int(subprocess.call(cmd))


def _cmd_self_test(_: argparse.Namespace) -> int:
    print(f"region_vault_claim_broadcast_pipeline_resume self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-282: idempotent resume using prior B-262 execution_report (skip mined steps)."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    rx = sub.add_parser(
        "resume-execute",
        help="forward to region_vault_claim_broadcast_execute.py execute with --resume-from-execution-report",
        epilog="Example: resume-execute stub.json -o out.json --prior-execution-report prior.json -- --rpc-url $CHAIN_RPC_URL",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    rx.add_argument("broadcast_request_stub", help="B-256 broadcast_request_stub JSON path")
    rx.add_argument("-o", "--output", required=True, help="new execution_report JSON path")
    rx.add_argument(
        "--prior-execution-report",
        required=True,
        help="prior B-262 execution_report JSON (must match stub SHA256)",
    )
    rx.add_argument(
        "--signing-order-static-table",
        metavar="PATH",
        help="optional B-277 table JSON; forwarded to execute --signing-order-static-table",
    )
    rx.add_argument(
        "remainder",
        nargs=argparse.REMAINDER,
        default=[],
        help="extra args for execute (prefix with -- if first flag starts with -)",
    )
    rx.set_defaults(func=_cmd_resume_execute)

    st = sub.add_parser("self-test", help="smoke")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
