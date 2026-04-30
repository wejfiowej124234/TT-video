#!/usr/bin/env python3
"""
Verify gates/production_gate.yaml (flat key: value) and referenced paths exist.

Usage (repo root):
  python3 scripts/gates/verify_production_gate_config.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def load_flat_yaml(path: Path) -> dict[str, str]:
    data: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        m = re.match(r"^([A-Za-z0-9_]+):\s*(.+?)\s*$", line)
        if not m:
            continue
        k, v = m.group(1), m.group(2).strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        data[k] = v
    return data


REQUIRED = (
    "schema_version",
    "gate_id",
    "gate_audit_machine_json",
    "gate_audit_block_count",
    "gate_audit_harden_count",
    "local_run_script",
    "chain_deferred_gate_script",
    "ci_e2e_strict_session",
    "ci_e2e_grep_invert",
    "b421_shell",
    "broadcast_shell",
    "api_cargo_package",
    "r002_validate_flags",
    "r002_report_generator",
    "tier_96_15_orchestration",
    "tier_96_15_booklets_check",
    "tier_a1_readme",
    "tier_a2_markdown",
    "tier_96_15_out_dir_prefix",
    "waivers_readme",
    "partial_go_expiry_required_on_change",
    "report_single_truth_required_on_change",
    "report_final_truth_field",
    "report_single_truth_checker",
    "report_final_truth_presence_checker",
    "release_require_go_workflow",
    "release_final_truth_pointer",
)


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    cfg_path = root / "gates" / "production_gate.yaml"
    if not cfg_path.is_file():
        print(f"ERROR: missing {cfg_path}", file=sys.stderr)
        return 2
    cfg = load_flat_yaml(cfg_path)
    missing = [k for k in REQUIRED if k not in cfg]
    if missing:
        print(f"ERROR: production_gate.yaml missing keys: {missing}", file=sys.stderr)
        return 1
    if cfg["schema_version"] != "1":
        print("ERROR: schema_version must be 1", file=sys.stderr)
        return 1
    if cfg["report_final_truth_field"] != "is_final_truth":
        print("ERROR: report_final_truth_field must be is_final_truth", file=sys.stderr)
        return 1
    path_keys = (
        "gate_audit_machine_json",
        "local_run_script",
        "chain_deferred_gate_script",
        "b421_shell",
        "broadcast_shell",
        "r002_report_generator",
        "tier_96_15_orchestration",
        "tier_96_15_booklets_check",
        "tier_a1_readme",
        "tier_a2_markdown",
        "waivers_readme",
        "report_single_truth_checker",
        "report_final_truth_presence_checker",
        "release_require_go_workflow",
        "release_final_truth_pointer",
    )
    for k in path_keys:
        p = root / cfg[k]
        if not p.is_file():
            print(f"ERROR: path for {k} does not exist: {p}", file=sys.stderr)
            return 1

    audit_path = root / cfg["gate_audit_machine_json"]
    try:
        audit = json.loads(audit_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        print(f"ERROR: invalid gate audit JSON {audit_path}: {e}", file=sys.stderr)
        return 1
    blocks = audit.get("block_list")
    hardens = audit.get("harden_list")
    if not isinstance(blocks, list) or not isinstance(hardens, list):
        print("ERROR: gate_audit.machine.json must have block_list and harden_list arrays", file=sys.stderr)
        return 1
    exp_b = int(cfg["gate_audit_block_count"])
    exp_h = int(cfg["gate_audit_harden_count"])
    if len(blocks) != exp_b or len(hardens) != exp_h:
        print(
            f"ERROR: gate audit counts want block={exp_b} harden={exp_h}, "
            f"got {len(blocks)}/{len(hardens)} (42+43=85 machine baseline)",
            file=sys.stderr,
        )
        return 1

    print("verify_production_gate_config: OK", cfg["gate_id"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
