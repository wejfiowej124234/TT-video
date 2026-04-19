#!/usr/bin/env python3
# B-293: TRAVELTRUST_FINALITY_MODE — single env vocabulary for default JSON-RPC anchor tags (latest / safe / finalized).
from __future__ import annotations

import argparse
import sys
from typing import Any

FINALITY_MODE_ENV = "TRAVELTRUST_FINALITY_MODE"
B293_IMPLEMENTATION_TT = "TT-B293-FINALITY-MODE-ENV-001"
B293_MOTHER_TABLE = "B-293"


def normalized_rpc_head_tag_from_finality_mode(raw: str | None) -> tuple[str | None, str | None]:
    """
    Map TRAVELTRUST_FINALITY_MODE to an eth_getBlockByNumber tag, or None = leave legacy default path.

    Returns (tag, err). err set means invalid env (caller should exit 1).
    tag None and err None: mode off / unset → caller uses tool-specific legacy default (archive: latest; revalidate: finalized).
    """
    if raw is None:
        return None, None
    s = str(raw).strip()
    if not s:
        return None, None
    sl = s.lower()
    if sl in ("off", "none", "disabled", "false", "0", "no"):
        return None, None
    if sl in ("latest", "rpc_anchor_latest", "head_latest"):
        return "latest", None
    if sl in ("safe", "rpc_anchor_safe"):
        return "safe", None
    if sl in ("finalized", "rpc_anchor_finalized"):
        return "finalized", None
    return None, (
        f"unknown {FINALITY_MODE_ENV}={raw!r}; "
        "allowed: off, latest, safe, finalized, rpc_anchor_latest, rpc_anchor_safe, rpc_anchor_finalized"
    )


def build_b293_resolution_dict(
    *,
    tool: str,
    env_raw: str | None,
    normalized_tag: str | None,
    mode_parsed_ok: bool,
    parse_error: str | None,
    cli_head_tag_supplied: bool,
    b289_env_override_active: bool,
    effective_head_tag: str,
    applied_traveltrust_finality_mode_default: bool,
) -> dict[str, Any]:
    return {
        "mother_table": B293_MOTHER_TABLE,
        "implementation_tt": B293_IMPLEMENTATION_TT,
        "tool": tool,
        "env_name": FINALITY_MODE_ENV,
        "env_raw": env_raw,
        "normalized_rpc_anchor_tag": normalized_tag,
        "mode_parse_ok": mode_parsed_ok,
        "mode_parse_error": parse_error,
        "cli_head_tag_supplied": cli_head_tag_supplied,
        "b289_env_override_active": b289_env_override_active,
        "effective_head_tag": effective_head_tag,
        "applied_traveltrust_finality_mode_default": applied_traveltrust_finality_mode_default,
        "notes": (
            "B-293: when CLI omits the head tag and finality is active (receipt archive: --min-confirmations>0; "
            "revalidate: --safe-head-tag omitted), TRAVELTRUST_FINALITY_MODE selects the default RPC anchor. "
            "B-289 --finality-head-tag-from-env takes precedence over B-293 for receipt archive."
        ),
    }


def _cmd_self_test(_: argparse.Namespace) -> int:
    assert normalized_rpc_head_tag_from_finality_mode(None) == (None, None)
    assert normalized_rpc_head_tag_from_finality_mode("") == (None, None)
    assert normalized_rpc_head_tag_from_finality_mode("  OFF  ") == (None, None)
    assert normalized_rpc_head_tag_from_finality_mode("safe")[0] == "safe"
    assert normalized_rpc_head_tag_from_finality_mode("RPC_ANCHOR_FINALIZED")[0] == "finalized"
    t, e = normalized_rpc_head_tag_from_finality_mode("not-a-mode")
    assert t is None and e and "unknown" in e
    print("region_vault_claim_broadcast_finality_mode self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="B-293: TRAVELTRUST_FINALITY_MODE helpers (self-test).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    st = sub.add_parser("self-test", help="parse TRAVELTRUST_FINALITY_MODE normalization cases")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
