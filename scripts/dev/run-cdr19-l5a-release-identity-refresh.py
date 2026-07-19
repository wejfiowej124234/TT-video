#!/usr/bin/env python3
"""CDR-19 refresh after L5-A: CONTROLLED_MINIMUM scope for wire deltas only."""
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"

# L5-A Release Identity refresh — only wire-related paths (not full dirty tree)
CONTROLLED = [
    "AGENTS.md",
    "contracts/src/Escrow.sol",
    "contracts/src/EscrowFactory.sol",
    "contracts/src/SettlementRouter.sol",
    "contracts/src/ISettlementRouter.sol",
    "contracts/src/IEscrowServiceFeeSync.sol",
    "contracts/test/EscrowSettlementRouterWireV311.t.sol",
    "contracts/test/F04ServiceFeeStateMachineV311.t.sol",
    "contracts/abi/Escrow.json",
    "contracts/abi/EscrowFactory.json",
    "contracts/abi/SettlementRouter.json",
    "contracts/abi/ISettlementRouter.json",
    "contracts/script/DeployFcgFullCapabilityV2Sepolia.s.sol",
    "contracts/script/DeployFcgV2WiredEscrowFactorySepolia.s.sol",
    "scripts/dev/stamp-l5a-financial-flow-wiring-closure.py",
    "scripts/dev/run-l5-fg-web3-empirical-priority.py",
    "scripts/dev/run-cdr19-l5a-release-identity-refresh.py",
    "scripts/dev/pin-cdr19-l5a-release-identity.py",
    "scripts/dev/check-fcg-v2-clean-deploy-broadcast-preflight.py",
    "scripts/dev/run-fcg-v2-wired-factory-redeploy.sh",
    "scripts/dev/bind-fcg-v2-wired-redeploy-after-broadcast.py",
    "scripts/dev/stamp-l5-five-layer-rebind-consistency.py",
    "registry/fcg-v2-wired-address-matrix.v1.json",
    "docs/runbook/TT-FCG-PAY-01-G-RC-WAIT-WINDOW-S1-ARM-LATEST.md",
    "docs/runbook/TT-PROTOCOL-V2-CLEAN-DEPLOY-READY-CHECKLIST-LATEST.md",
    "registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml",
]


def git(*a: str) -> str:
    return subprocess.check_output(["git", *a], cwd=ROOT, text=True).strip()


def main() -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    PENDING.mkdir(parents=True, exist_ok=True)
    existing = []
    missing = []
    for p in CONTROLLED:
        if (ROOT / p).exists():
            existing.append(p)
        else:
            missing.append(p)
    scope = {
        "schema": "traveltrust.cdr19_release_scope_confirm.v1",
        "id": "CDR-19-L5A-REFRESH",
        "recorded_utc": stamp,
        "RELEASE_SCOPE_MODE": "CONTROLLED_MINIMUM_RELEASE",
        "reason": "L5-A changed Escrow/SettlementRouter/EscrowFactory — Release Identity must refresh before Sepolia wired redeploy",
        "prior_Release_SHA": "493596aebd579dd92c3c2a5f58349c5444b9df13",
        "base_head_before_commit": git("rev-parse", "HEAD"),
        "include": {"paths": existing},
        "deferred_missing_until_written": missing,
        "exclude": {
            "evidence": "bind_as_Evidence_Package_separate",
            "unrelated_dirty": "item_review_not_in_this_Release",
        },
        "l3_security": "PREP_ONLY_must_not_substitute_L5",
        "status": "SCOPE_CONFIRMED",
        "verdict": "CDR19_L5A_SCOPE_CONFIRMED_CONTROLLED_MINIMUM",
    }
    (PENDING / "CDR-19-L5A-SCOPE-CONFIRM-LATEST.json").write_text(
        json.dumps(scope, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (PENDING / "CDR-19-L5A-CONTROLLED-MINIMUM-RELEASE-PATHS.txt").write_text(
        "\n".join(existing) + "\n", encoding="utf-8"
    )
    print(json.dumps({"verdict": scope["verdict"], "count": len(existing), "missing": missing}, ensure_ascii=False))


if __name__ == "__main__":
    main()
