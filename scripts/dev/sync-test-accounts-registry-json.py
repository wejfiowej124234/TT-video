#!/usr/bin/env python3
"""Sync evidence/manual-uat/summary/test-accounts-registry.v1.json from YAML SSOT."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
YAML = ROOT / "registry/test-accounts-business-immutable.v1.yaml"
JSON_OUT = ROOT / "evidence/manual-uat/summary/test-accounts-registry.v1.json"


def parse_yaml_accounts(text: str) -> dict:
    accounts: dict = {}
    governance: dict = {}
    probe_matrix: dict = {}
    in_gov = False
    in_probe = False
    current_id: str | None = None
    current_block: dict = {}

    for line in text.splitlines():
        if line.startswith("governance:"):
            in_gov = True
            in_probe = False
            current_id = None
            continue
        if line.startswith("accounts:"):
            in_gov = False
            in_probe = False
            current_id = None
            continue
        if line.startswith("probe_matrix:"):
            in_gov = False
            in_probe = True
            current_id = None
            continue
        if in_gov and line.startswith("  ") and ":" in line and not line.startswith("  " * 2 + "-"):
            k, _, v = line.strip().partition(":")
            v = v.strip()
            if v.startswith("["):
                probe_matrix[k] = re.findall(r"[A-Z0-9]+", v)
            elif v in ("true", "false"):
                governance[k] = v == "true"
            else:
                governance[k] = v.strip('"')
            continue
        m = re.match(r"^  (C1|C2|C3|C4|E1|E2):$", line)
        if m:
            if current_id and current_block:
                accounts[current_id] = current_block
            current_id = m.group(1)
            current_block = {}
            continue
        if current_id and line.startswith("    ") and ":" in line:
            k, _, v = line.strip().partition(":")
            v = v.strip()
            if v == "null":
                current_block[k] = None
            elif v.startswith("["):
                current_block[k] = re.findall(r"\w+", v)
            elif v in ("true", "false"):
                current_block[k] = v == "true"
            else:
                current_block[k] = v.strip('"')
    if current_id and current_block:
        accounts[current_id] = current_block
    return accounts, governance, probe_matrix


def main() -> int:
    if not YAML.is_file():
        print(f"sync-test-accounts-registry-json: FAIL missing {YAML}", file=sys.stderr)
        return 1
    text = YAML.read_text(encoding="utf-8")
    accounts, governance, probe_matrix = parse_yaml_accounts(text)
    payload = {
        "schema": "traveltrust.test_accounts_registry.v1",
        "ssot_yaml": "registry/test-accounts-business-immutable.v1.yaml",
        "immutable_ids": ["C1", "C2", "C3", "C4", "E1", "E2"],
        "governance": governance,
        "probe_matrix": probe_matrix,
        "accounts": accounts,
        "quick_reference": "docs/runbook/TT-TEST-ACCOUNTS-QUICK-REFERENCE.md",
        "matrix": "docs/runbook/TT-LOCAL-TEST-ACCOUNTS-MATRIX.md",
        "change_gate": "docs/runbook/TT-TEST-ACCOUNT-CHANGE.md",
    }
    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"sync-test-accounts-registry-json: OK {JSON_OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
