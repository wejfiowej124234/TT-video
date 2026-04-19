#!/usr/bin/env python3
# B-287: shared audit helper — any manual --allow-non-go-* path requires OVERRIDE_REASON env and emits a JSON block.
from __future__ import annotations

import argparse
import os
import sys
from typing import Any

OVERRIDE_REASON_ENV = "OVERRIDE_REASON"
B287_IMPLEMENTATION_TT = "TT-B287-MANUAL-OVERRIDE-WITH-JUSTIFICATION-001"
B287_MOTHER_TABLE = "B-287"
OVERRIDE_REASON_MAX_LEN = 8000


def b287_block_for_allow_non_go(flags: dict[str, bool], *, tool_label: str) -> dict[str, Any] | None:
    """If any flag is True, require non-empty OVERRIDE_REASON; return audit block or None."""
    active = {k: bool(v) for k, v in flags.items() if v}
    if not active:
        return None
    reason = os.environ.get(OVERRIDE_REASON_ENV, "").strip()
    if not reason:
        raise ValueError(
            f"B-287 ({tool_label}): when using manual non-GO override flags {sorted(active.keys())}, "
            f"set environment variable {OVERRIDE_REASON_ENV} to a non-empty operator justification "
            "(written into output JSON for audit)"
        )
    if len(reason) > OVERRIDE_REASON_MAX_LEN:
        raise ValueError(
            f"B-287 ({tool_label}): {OVERRIDE_REASON_ENV} exceeds {OVERRIDE_REASON_MAX_LEN} characters"
        )
    return {
        "mother_table": B287_MOTHER_TABLE,
        "implementation_tt": B287_IMPLEMENTATION_TT,
        "override_reason_operator": reason,
        "allow_non_go_flags": active,
        "tool_label": tool_label,
    }


def _cmd_self_test(_: argparse.Namespace) -> int:
    saved = os.environ.get(OVERRIDE_REASON_ENV)
    try:
        os.environ.pop(OVERRIDE_REASON_ENV, None)
        try:
            b287_block_for_allow_non_go({"allow_non_go_execute": True}, tool_label="unit")
        except ValueError:
            pass
        else:
            raise AssertionError("expected ValueError without OVERRIDE_REASON")

        os.environ[OVERRIDE_REASON_ENV] = "  B-287 self-test justification.  "
        b = b287_block_for_allow_non_go(
            {"allow_non_go_execution_report": True, "allow_non_go_archive": False},
            tool_label="unit",
        )
        assert b is not None
        assert b["override_reason_operator"] == "B-287 self-test justification."
        assert b["allow_non_go_flags"] == {"allow_non_go_execution_report": True}

        assert b287_block_for_allow_non_go({}, tool_label="unit") is None
    finally:
        if saved is None:
            os.environ.pop(OVERRIDE_REASON_ENV, None)
        else:
            os.environ[OVERRIDE_REASON_ENV] = saved

    print(f"region_vault_claim_broadcast_manual_override_b287 self-test OK ({B287_IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=f"{B287_MOTHER_TABLE}: manual override reason helper ({B287_IMPLEMENTATION_TT})")
    sub = ap.add_subparsers(dest="cmd", required=True)
    st = sub.add_parser("self-test", help="offline assertions")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"manual-override-b287: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
