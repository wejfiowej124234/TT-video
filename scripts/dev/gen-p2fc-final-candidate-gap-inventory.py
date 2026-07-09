#!/usr/bin/env python3
"""P2FC · 最终候选版本缺口清单（STRAT-F · fix-before-freeze-soak）

  python scripts/dev/gen-p2fc-final-candidate-gap-inventory.py

末行：TT_P2FC_FINAL_CANDIDATE_GAP_INVENTORY: N_open fix_before_soak=M
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SOAK_DIR = ROOT / "evidence/P2FC_SOAK_72H_STAGING"
OUT_DIR = SOAK_DIR / "final-candidate-pre-soak"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default=str(OUT_DIR))
    args = ap.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    web3 = load_json(SOAK_DIR / "web3-system-security-audit/latest.json")
    blocker = load_json(SOAK_DIR / "post-soak-preblock-l5-audit/blocker-watch.latest.json")

    items: list[dict[str, Any]] = [
        {
            "id": "S1_MR12",
            "phase": "fix_before_soak",
            "category": "deploy_backlog",
            "action": "Apply MR-01/MR-02 + backlog patch · TN-P1-010 · wave1/wave2 deploy to staging",
            "gate": "TT_P2FC_FINAL_CANDIDATE_DEPLOY: PASS",
            "status": "open",
        },
        {
            "id": "S2_ADM_U01",
            "phase": "fix_before_soak",
            "category": "live_validation",
            "action": "record-adm-u01-staging-evidence.sh persistent_host release_gate=GO",
            "gate": "TT_ADM_U01_EVIDENCE: PASS",
            "status": "open",
        },
        {
            "id": "S3_P0_RUNTIME",
            "phase": "fix_before_soak",
            "category": "live_validation",
            "action": "p2fc-verify-p0-rbac-bypass-runtime.sh CONFIRMED on staging",
            "gate": "TT_P2FC_P0_RBAC_BYPASS_RUNTIME: CONFIRMED",
            "status": "open",
        },
        {
            "id": "S4_BLOCKERS",
            "phase": "fix_before_soak",
            "category": "blocker",
            "action": "Clear B1–B4 via TN-P1-010 + wave1 deploy + G02/meta graduation checkpoint",
            "gate": "open_blocker_count=0",
            "status": "open",
        },
        {
            "id": "S5_ADM_U02",
            "phase": "fix_before_soak",
            "category": "live_validation",
            "action": "record-adm-u02-staging-evidence.sh release_gate=GO",
            "gate": "TT_ADM_U02_STAGING_EVIDENCE: PASS",
            "status": "open",
        },
        {
            "id": "S6_D3",
            "phase": "fix_before_soak",
            "category": "security",
            "action": "Live merge D3-F04 (ADM-U01 GO) + D3-F02 (P0 runtime)",
            "gate": "D3 verdict=PASS",
            "status": "open",
        },
        {
            "id": "S7_D124",
            "phase": "fix_before_soak",
            "category": "security",
            "action": "Converge D1/D2/D4 WARN/OPEN with live evidence",
            "gate": "D124 open_warn_count=0",
            "status": "open",
        },
    ]

    if blocker:
        for b in blocker.get("blockers", []):
            items.append(
                {
                    "id": b.get("id", ""),
                    "phase": "fix_before_soak",
                    "category": "blocker_watch",
                    "action": b.get("note", ""),
                    "gate": "cleared",
                    "status": b.get("status", "open"),
                    "ref": b.get("ref"),
                }
            )

    if web3:
        for key, dom in web3.get("domains", {}).items():
            for f in dom.get("findings", []):
                if f.get("severity") in ("high", "critical", "medium"):
                    items.append(
                        {
                            "id": f.get("id", ""),
                            "phase": "fix_before_soak",
                            "category": key,
                            "severity": f.get("severity"),
                            "action": f.get("note", ""),
                            "gate": "CLEARED or ACCEPTED with live evidence",
                            "status": "open",
                        }
                    )

    open_count = sum(1 for i in items if i.get("status") == "open")
    fix_before = sum(1 for i in items if i.get("phase") == "fix_before_soak" and i.get("status") == "open")

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_final_candidate_gap_inventory.v1",
        "generated_at_utc": utc_now(),
        "strategy": "STRAT-F_FINAL_CANDIDATE_PRE_SOAK",
        "supersedes": "STRAT-A_PLUS_MR12 (soak-then-deploy on 520abf39)",
        "policy": "fix_all_open → local → staging live → human acceptance → freeze → fresh 72h soak",
        "ledger_ssot": "registry/complexity-convergence-fix-ledger.v1.yaml",
        "ledger_doc_ssot": "docs/handbook/engineering/181-Complexity-Audit-Final-Candidate-Before-Soak.md",
        "items": items,
        "open_count": open_count,
        "fix_before_soak_open": fix_before,
        "freeze_candidate_sha": None,
        "soak_relaunch_after": "engage-testnet-staging-baseline-freeze.sh + p2fc-launch-staging-soak-72h.sh P2FC_SOAK_SUPERSEDE=1",
    }

    out = out_dir / "gap-inventory.latest.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        f"TT_P2FC_FINAL_CANDIDATE_GAP_INVENTORY: open={open_count} "
        f"fix_before_soak={fix_before} out={out.as_posix()}"
    )
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
