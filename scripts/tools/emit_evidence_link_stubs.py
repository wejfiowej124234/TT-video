#!/usr/bin/env python3
"""Create minimal evidence/*.md files so docs links resolve."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STUB = (ROOT / "evidence" / "_STUB_TEMPLATE.md").read_text(encoding="utf-8")

FILES = [
    "GO_20260413/artifacts/TT-B190-dual-write-prod-signoff.md",
    "GO_B195_MOTION_B3_READOFF.md",
    "GO_B196_VIDEO_ASSET_08_4_CLOSE.md",
    "GO_B197_ALLOCATION_84_SSOT_CLOSE.md",
    "GO_B198_ANALYTICS_CLOSE.md",
    "GO_B200_ALLOCATION_PHASE2_CLOSE.md",
    "GO_B203_HERO_MOTION_CLOSE.md",
    "GO_85_TRAVELTRUST.md",
    "GO_85_TRAVELTRUST_SEC23_20260413/artifacts/S23-06-motion-full.md",
    "POINTER_B199_85_SEC23_ACCEPTANCE.md",
    "b416_fee_router_write_path_testnet/README.md",
    "b417_governance_execution_runs/README.md",
    "testnet_real_run_validation/README.md",
    "testnet_real_run_validation/TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001.md",
]


def main() -> None:
    for rel in FILES:
        path = ROOT / "evidence" / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_text(STUB, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
