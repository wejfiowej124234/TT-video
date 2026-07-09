#!/usr/bin/env python3
"""Live Closure Chain · 运行时裁决父子两级真源

子真源 TT_ADMIN_STAGING_GO_CLAIM：仅裁决 Admin GO（ALLOWED/DENIED）
父真源 TT_LIVE_CLOSURE_CHAIN_VERDICT：汇总 admin_go · phase2_closure · production_go

  python scripts/dev/gen-p2fc-live-closure-chain-verdict.py
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
CLOSURE_DIR = SOAK_DIR / "post-soak-staging-live-closure"
SSOT_REGISTRY = ROOT / "registry/live-closure-chain-ssot.v1.yaml"

FORBIDDEN_GO_SUBSTITUTES = [
    "prep", "static", "tunnel", "local", "smoke", "watcher", "health",
    "audit", "audit_warn", "prep_only", "soak_inflight", "mr12_prep_only",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def read_child_claim(closure_dir: Path) -> dict[str, Any]:
    """子真源：TT_ADMIN_STAGING_GO_CLAIM — 仅 Admin GO，读 admin-go-claim-gate.latest.json。"""
    gate = load_json(closure_dir / "admin-go-claim-gate.latest.json")
    if gate and gate.get("allowed") is True:
        return {"line": "TT_ADMIN_STAGING_GO_CLAIM", "value": "ALLOWED", "allowed": True, "reason": None}
    reason = (gate or {}).get("reason") or "gate_artifact_missing_or_denied"
    return {"line": "TT_ADMIN_STAGING_GO_CLAIM", "value": "DENIED", "allowed": False, "reason": reason}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--soak-dir", default=str(SOAK_DIR))
    args = ap.parse_args()

    soak_dir = Path(args.soak_dir)
    closure_dir = soak_dir / "post-soak-staging-live-closure"
    closure_dir.mkdir(parents=True, exist_ok=True)

    child = read_child_claim(closure_dir)
    closure = load_json(closure_dir / "staging-live-closure.latest.json")

    # 父真源汇总 — admin_go 必须依赖子真源 ALLOWED
    admin_go = "YES" if child["allowed"] else "NO"
    phase2_closure = "YES" if closure and closure.get("verdict") == "PASS" else "NO"
    production_go = "NO"

    payload: dict[str, Any] = {
        "schema": "traveltrust.live_closure_chain_verdict.v3",
        "generated_at_utc": utc_now(),
        "ssot_hierarchy": {
            "child": {
                "line": "TT_ADMIN_STAGING_GO_CLAIM",
                "scope": "admin_go_only",
                "values": ["ALLOWED", "DENIED"],
                "artifact": "post-soak-staging-live-closure/admin-go-claim-gate.latest.json",
                "gate_script": "scripts/ops/p2fc-gate-admin-staging-go-claim.sh",
            },
            "parent": {
                "line": "TT_LIVE_CLOSURE_CHAIN_VERDICT",
                "scope": "admin_go_phase2_closure_production_go_summary",
                "artifact": "post-soak-staging-live-closure/live-closure-verdict.latest.json",
                "derives": {
                    "admin_go_yes_from": "TT_ADMIN_STAGING_GO_CLAIM=ALLOWED",
                    "phase2_closure_yes_from": "staging-live-closure.latest.json verdict=PASS",
                    "production_go": "never_from_this_chain",
                },
            },
        },
        "ssot_registry": str(SSOT_REGISTRY.relative_to(ROOT)).replace("\\", "/"),
        "child_claim": child,
        "verdicts": {
            "admin_go": admin_go,
            "phase2_closure": phase2_closure,
            "production_go": production_go,
        },
        "verdict_dependencies": {
            "admin_go": {"depends_on": "TT_ADMIN_STAGING_GO_CLAIM=ALLOWED", "satisfied": child["allowed"]},
            "phase2_closure": {
                "depends_on": "staging-live-closure.latest.json verdict=PASS",
                "satisfied": phase2_closure == "YES",
                "artifact_verdict": (closure or {}).get("verdict"),
            },
            "production_go": {"depends_on": None, "value": "NO", "never_from_chain": True},
        },
        "adjudication_basis_only": ["release_gate", "runtime_evidence", "closure_ssot"],
        "forbidden_go_substitutes": FORBIDDEN_GO_SUBSTITUTES,
        "post_completed_entrypoint": "scripts/ops/p2fc-post-soak-staging-live-closure-chain.sh --watch",
        "honest_boundary": (
            "Prep/Static/Tunnel/Local/Smoke/Watcher/Health/Audit/Prep-Only/Soak Inflight "
            "均不得作为 GO 依据"
        ),
    }

    out = closure_dir / "live-closure-verdict.latest.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # 子真源行优先，父真源汇总行其次
    if child["allowed"]:
        print("TT_ADMIN_STAGING_GO_CLAIM: ALLOWED")
    else:
        print(f"TT_ADMIN_STAGING_GO_CLAIM: DENIED reason={child['reason']}")
    print(
        f"TT_LIVE_CLOSURE_CHAIN_VERDICT: admin_go={admin_go} phase2_closure={phase2_closure} "
        f"production_go={production_go}"
    )

    return 0 if child["allowed"] and phase2_closure == "YES" else 2


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
