#!/usr/bin/env python3
# B-304: RPC provider API key / endpoint credential rotation — operator runbook block (no in-repo business config edits).
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from typing import Any

B304_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-RPC-KEY-ROTATION-RUNBOOK-V1"
B304_RULE_VERSION = "region_vault_claim_broadcast_rpc_key_rotation_runbook_v1"
IMPLEMENTATION_TT = "TT-B304-RPC-KEY-ROTATION-RUNBOOK-001"
MOTHER_TABLE = "B-304"

# Keep names aligned with scripts that consume RPC (B-276 / B-262 / B-263 / B-290 / …).
PRIMARY_RPC_ENV = "CHAIN_RPC_URL"
EXTRA_RPC_ENV = "TRAVELTRUST_BROADCAST_EXTRA_RPC_URLS"


def build_rpc_key_rotation_runbook_block(*, tool_label: str = "broadcast_chain") -> dict[str, Any]:
    """
    Static, machine-readable checklist for rotating JSON-RPC credentials without mutating TravelTrust
    application business configuration (no repo routing / chain-id SSOT edits as part of this procedure).
    """
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "anchor": B304_ANCHOR,
        "rule_version": B304_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "recorded_at_utc": now,
        "tool_label": tool_label,
        "scope_statement": (
            "B-304: rotate RPC provider API keys / HTTP endpoint secrets only via operator secret store or shell "
            "environment bindings. This TT does not authorize editing in-repo business configuration files to "
            "switch RPC hosts or chain identity."
        ),
        "operator_binding_env_vars": [
            {
                "env": PRIMARY_RPC_ENV,
                "role": "primary_json_rpc_http",
                "notes": "Used by B-262 execute, B-276 preflight, B-263 receipt archive, B-290 lag watch, B-291 gas preflight when --rpc-url omitted.",
            },
            {
                "env": EXTRA_RPC_ENV,
                "role": "optional_comma_separated_extra_endpoints",
                "notes": "B-276 / B-263 multi-endpoint quorum; rotate every comma-separated URL whose provider key changed.",
            },
        ],
        "rotation_phases": [
            {
                "phase": 1,
                "title": "Provision new provider credentials (out of band)",
                "detail": (
                    "Create a new API key or auth token at the RPC vendor. Do not commit raw URLs with secrets into git; "
                    "store them in your vault / CI secret manager only."
                ),
            },
            {
                "phase": 2,
                "title": "Update secret bindings (no repo business-config edits)",
                "detail": (
                    f"Point {PRIMARY_RPC_ENV} (and each URL in {EXTRA_RPC_ENV} if used) to the new secret-bearing endpoints. "
                    "Prefer atomic swap in the secret store, then reload operator shells / CI job definitions."
                ),
            },
            {
                "phase": 3,
                "title": "Verify same chain before resuming broadcast work",
                "detail": (
                    "Run a minimal eth_chainId (via B-276 preflight without --skip-rpc-check, or operator jq/curl) and "
                    "compare against chain_id_hex / chain_id_hex_observed in frozen OUT_DIR evidence. Mismatch → stop; "
                    "do not reuse B-282 resume until chain alignment is confirmed."
                ),
            },
            {
                "phase": 4,
                "title": "Evidence + smoke",
                "detail": (
                    "Archive redacted RPC fingerprints (B-297) in fresh reports. Optionally run "
                    "region_vault_claim_broadcast_scheduled_smoke_cron.py self-test in CI after binding swap."
                ),
            },
        ],
        "forbidden_mutation_surfaces": [
            "In-repo application YAML/ENV templates that encode business routing (not part of B-304 unless your org explicitly treats them as secret bindings).",
            "broadcast_request_stub.json payloads: contract addresses, chainId in signed raw txs, or batch_plan_id semantics.",
            "Lowering B-300 mainnet dual-control / B-303 break-glass requirements to bypass rotation verification.",
        ],
        "cross_tt": [
            {"mother_table": "B-297", "implementation_tt": "TT-B297-RPC-URL-REDACTION-REGRESSION-TEST-001", "note": "Never paste full RPC URLs with path/query secrets into tickets; use redacted forms from reports."},
            {"mother_table": "B-299", "implementation_tt": "TT-B299-RUNBOOK-VERSION-PIN-001", "note": "Re-emit B-284 runbook JSON after tooling commit moves so command_templates_version_annotated stays accurate."},
            {"mother_table": "B-300", "implementation_tt": "TT-B300-MAINNET-SECOND-OPERATOR-ACK-001", "note": "Mainnet-facing binds still require dual-control metadata in downstream reports."},
            {"mother_table": "B-303", "implementation_tt": "TT-B303-BREAK-GLASS-AND-ROLLBACK-ROLES-001", "note": "Manual non-GO overrides remain separate from key rotation; do not conflate OVERRIDE_REASON with vendor key lifecycle."},
        ],
        "command_templates_post_bind_smoke": [
            'python scripts/ops/region_vault_claim_broadcast_nonce_preflight.py preflight "$STUB" -o "$OUT_DIR/nonce_preflight_report.json" --rpc-url "$CHAIN_RPC_URL"',
            'python scripts/ops/region_vault_claim_broadcast_execute.py execute "$STUB" -o "$OUT_DIR/execution_smoke.json" --dry-run --skip-operator-confirmation --rpc-url "$CHAIN_RPC_URL"',
        ],
        "notes": (
            "B-304 is procedural SSOT for credential rotation; it does not perform RPC calls. Embed this block in "
            "B-284 operator runbook JSON and operator evidence bundles when documenting a rotation window."
        ),
    }


def _cmd_print_json(_: argparse.Namespace) -> int:
    print(json.dumps(build_rpc_key_rotation_runbook_block(), indent=2, ensure_ascii=False), file=sys.stdout)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    b = build_rpc_key_rotation_runbook_block(tool_label="unit")
    assert b.get("anchor") == B304_ANCHOR
    assert b.get("implementation_tt") == IMPLEMENTATION_TT
    assert any(str(x.get("env")) == PRIMARY_RPC_ENV for x in (b.get("operator_binding_env_vars") or [])), b
    assert "forbidden_mutation_surfaces" in b and len(b["forbidden_mutation_surfaces"]) >= 1
    phases = b.get("rotation_phases")
    assert isinstance(phases, list) and len(phases) >= 3
    print(f"region_vault_claim_broadcast_rpc_key_rotation_runbook_b304 self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=f"{MOTHER_TABLE}: RPC key rotation runbook block ({IMPLEMENTATION_TT})."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    pj = sub.add_parser("print-json", help="emit standalone B-304 JSON to stdout")
    pj.set_defaults(func=_cmd_print_json)
    st = sub.add_parser("self-test", help="offline structure checks")
    st.set_defaults(func=_cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
