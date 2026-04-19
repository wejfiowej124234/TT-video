#!/usr/bin/env python3
# B-303: when B-287 manual override is active, require break-glass ack + approver + ticket and emit 24h supplement deadline metadata.
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Any

B303_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-BREAK-GLASS-ROLES-V1"
B303_RULE_VERSION = "region_vault_claim_broadcast_break_glass_roles_v1"
IMPLEMENTATION_TT = "TT-B303-BREAK-GLASS-AND-ROLLBACK-ROLES-001"
MOTHER_TABLE = "B-303"

B303_ACK_ENV = "TRAVELTRUST_B303_BREAK_GLASS_ACK"
B303_APPROVER_ENV = "TRAVELTRUST_B303_APPROVER_PRINCIPAL"
B303_TICKET_ENV = "TRAVELTRUST_B303_BREAK_GLASS_TICKET_ID"
B303_ROLLBACK_OWNER_ENV = "TRAVELTRUST_B303_ROLLBACK_OWNER_PRINCIPAL"

SUPPLEMENT_EVIDENCE_HOURS = 24


def require_b303_metadata_if_b287_active(
    b287_manual_override: dict[str, Any] | None,
    *,
    tool_label: str,
) -> dict[str, Any] | None:
    """
    If B-287 audit block is present, require explicit break-glass ack and approver/ticket principals.
    Returns evidence JSON for downstream reports; None when no B-287 path.
    """
    if b287_manual_override is None:
        return None
    if os.environ.get(B303_ACK_ENV, "").strip() != "1":
        raise ValueError(
            f"B-303 ({tool_label}): with B-287 manual override active, set {B303_ACK_ENV}=1 after "
            "dual-control break-glass approval."
        )
    approver = os.environ.get(B303_APPROVER_ENV, "").strip()
    if not approver:
        raise ValueError(
            f"B-303 ({tool_label}): set non-empty {B303_APPROVER_ENV} (override approver principal / role id)."
        )
    ticket = os.environ.get(B303_TICKET_ENV, "").strip()
    if not ticket:
        raise ValueError(
            f"B-303 ({tool_label}): set non-empty {B303_TICKET_ENV} (change ticket / incident id for this override)."
        )
    rollback_owner = os.environ.get(B303_ROLLBACK_OWNER_ENV, "").strip() or None
    now = datetime.now(timezone.utc)
    deadline = now + timedelta(hours=SUPPLEMENT_EVIDENCE_HOURS)
    return {
        "anchor": B303_ANCHOR,
        "rule_version": B303_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "recorded_at_utc": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "supplement_evidence_deadline_utc": deadline.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "supplement_evidence_policy_hours": SUPPLEMENT_EVIDENCE_HOURS,
        "break_glass_ack_env": B303_ACK_ENV,
        "approver_principal": approver,
        "break_glass_ticket_id": ticket,
        "rollback_owner_principal": rollback_owner,
        "b287_implementation_tt_linked": b287_manual_override.get("implementation_tt"),
        "tool_label": tool_label,
        "notes": (
            "B-303: operator must attach supplemental evidence (post-mortem / approvals export) within "
            f"{SUPPLEMENT_EVIDENCE_HOURS}h of recorded_at_utc unless waived by org policy."
        ),
    }


def _cmd_self_test(_: argparse.Namespace) -> int:
    from region_vault_claim_broadcast_manual_override_b287 import OVERRIDE_REASON_ENV, b287_block_for_allow_non_go

    assert require_b303_metadata_if_b287_active(None, tool_label="t") is None

    saved_or = os.environ.get(OVERRIDE_REASON_ENV)
    saved: dict[str, str] = {}
    for k in (B303_ACK_ENV, B303_APPROVER_ENV, B303_TICKET_ENV, B303_ROLLBACK_OWNER_ENV):
        if k in os.environ:
            saved[k] = os.environ.pop(k)
    try:
        os.environ[OVERRIDE_REASON_ENV] = "B-303 unit: B-287 justification for break-glass metadata."
        blk = b287_block_for_allow_non_go({"allow_non_go_execution_report": True}, tool_label="unit")
        assert blk is not None
        try:
            require_b303_metadata_if_b287_active(blk, tool_label="unit")
        except ValueError:
            pass
        else:
            raise AssertionError("expected B-303 failure without ack")

        os.environ[B303_ACK_ENV] = "1"
        try:
            require_b303_metadata_if_b287_active(blk, tool_label="unit")
        except ValueError:
            pass
        else:
            raise AssertionError("expected failure without approver")

        os.environ[B303_APPROVER_ENV] = "approver-b303"
        try:
            require_b303_metadata_if_b287_active(blk, tool_label="unit")
        except ValueError:
            pass
        else:
            raise AssertionError("expected failure without ticket")

        os.environ[B303_TICKET_ENV] = "CHG-303-1"
        os.environ[B303_ROLLBACK_OWNER_ENV] = "rollback-owner"
        meta = require_b303_metadata_if_b287_active(blk, tool_label="unit")
        assert meta.get("implementation_tt") == IMPLEMENTATION_TT
        assert meta.get("approver_principal") == "approver-b303"
        assert meta.get("rollback_owner_principal") == "rollback-owner"
    finally:
        for k in (B303_ACK_ENV, B303_APPROVER_ENV, B303_TICKET_ENV, B303_ROLLBACK_OWNER_ENV):
            os.environ.pop(k, None)
        for k, v in saved.items():
            os.environ[k] = v
        if saved_or is None:
            os.environ.pop(OVERRIDE_REASON_ENV, None)
        else:
            os.environ[OVERRIDE_REASON_ENV] = saved_or

    print(f"region_vault_claim_broadcast_break_glass_roles_b303 self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=f"{MOTHER_TABLE}: break-glass metadata ({IMPLEMENTATION_TT}).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    st = sub.add_parser("self-test", help="offline gate matrix")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"break_glass_roles_b303: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
