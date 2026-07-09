#!/usr/bin/env python3
"""P2FC · Admin GO 唯一闭环纪律审计（只读 · 非 GO 宣称）

唯一合法 Admin GO 闭环：
  COMPLETED.json → MR12 one-shot PASS → ADM-U01 live release_gate=GO
  → P0 Runtime CONFIRMED → TT_ADMIN_STAGING_GO_CLAIM=ALLOWED

Prep Ready / Static Confirmed / Tunnel / Local / Smoke / Watcher / Health
一律不得视为 Admin GO · Phase② Closure · Production GO。

  python scripts/dev/gen-p2fc-admin-go-closure-discipline-audit.py
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

UNIQUE_CLOSURE = [
    "COMPLETED.json",
    "MR12 one-shot TT_P2FC_POST_SOAK_ONE_SHOT: PASS",
    "ADM-U01 live report.json release_gate=GO (persistent_host · not tunnel/local)",
    "P0 Runtime TT_P2FC_P0_RBAC_BYPASS_RUNTIME: CONFIRMED",
    "TT_ADMIN_STAGING_GO_CLAIM: ALLOWED",
]

FORBIDDEN_AS_GO = [
    "prep_ready",
    "prep_only",
    "soak_inflight",
    "static_p0_confirmed",
    "tunnel_ephemeral",
    "local_smoke",
    "watcher_alive",
    "health_200",
    "health_200_only",
    "meta_unreachable",
    "blocker_watch_inflight",
    "mr12_prep_only",
    "web3_audit_warn",
]

SSOT_REGISTRY = ROOT / "registry/admin-staging-go-claim-ssot.v1.yaml"
SSOT_LINE = "TT_ADMIN_STAGING_GO_CLAIM"

FORBIDDEN_CLAIM_TARGETS = [
    "admin_go",
    "phase2_closure",
    "production_go",
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


def closure_loop_status(soak_dir: Path, closure_dir: Path) -> dict[str, Any]:
    steps: list[dict[str, Any]] = []

    completed = (soak_dir / "COMPLETED.json").is_file()
    steps.append({"id": "S0_COMPLETED", "pass": completed, "evidence": str(soak_dir / "COMPLETED.json")})

    one_shot_log = soak_dir / "post-soak-one-shot/one-shot.log"
    mr12_pass = one_shot_log.is_file() and "TT_P2FC_POST_SOAK_ONE_SHOT: PASS" in one_shot_log.read_text(
        encoding="utf-8", errors="replace"
    )
    steps.append({"id": "S1_MR12_ONE_SHOT", "pass": mr12_pass, "evidence": str(one_shot_log)})

    u01 = load_json(closure_dir / "adm-u01-live/report.json")
    u01_go = u01 and u01.get("release_gate") == "GO"
    u01_persistent = (
        u01
        and (u01.get("environment") or {}).get("deployment_kind") == "persistent_host"
        and (u01.get("environment") or {}).get("not_localhost_assertion") is True
    )
    steps.append(
        {
            "id": "S2_ADM_U01_LIVE_GO",
            "pass": bool(u01_go and u01_persistent),
            "evidence": str(closure_dir / "adm-u01-live/report.json"),
            "release_gate": (u01 or {}).get("release_gate"),
            "deployment_kind": (u01 or {}).get("environment", {}).get("deployment_kind"),
        }
    )

    p0 = load_json(closure_dir / "p0-rbac-bypass-runtime/latest.json")
    p0_runtime = p0 and p0.get("status") == "CONFIRMED"
    steps.append({"id": "S3_P0_RUNTIME", "pass": bool(p0_runtime), "evidence": str(closure_dir / "p0-rbac-bypass-runtime/latest.json")})

    gate = load_json(closure_dir / "admin-go-claim-gate.latest.json")
    claim_allowed = gate and gate.get("allowed") is True
    steps.append({"id": "S4_ADMIN_GO_CLAIM", "pass": bool(claim_allowed), "evidence": str(closure_dir / "admin-go-claim-gate.latest.json")})

    loop_closed = all(s["pass"] for s in steps)
    return {"steps": steps, "loop_closed": loop_closed, "admin_go_claim_allowed": claim_allowed}


def audit_forbidden_substitutes(soak_dir: Path) -> list[dict[str, Any]]:
    violations: list[dict[str, Any]] = []

    prep = load_json(soak_dir / "web3-system-security-audit/adm-u01-staging-live-prep.latest.json")
    if prep and prep.get("status") == "READY":
        violations.append(
            {
                "id": "V-PREP-READY",
                "artifact": str(soak_dir / "web3-system-security-audit/adm-u01-staging-live-prep.latest.json"),
                "note": "prep READY must not substitute Admin GO",
            }
        )

    web3 = load_json(soak_dir / "web3-system-security-audit/latest.json")
    if web3 and web3.get("p0_rbac_bypass_isolated"):
        violations.append(
            {
                "id": "V-STATIC-P0",
                "artifact": str(soak_dir / "web3-system-security-audit/latest.json"),
                "note": "static P0 CONFIRMED must not substitute P0 Runtime or Admin GO",
            }
        )

    tunnel = ROOT / "evidence/GO_staging_admin_rbac_matrix/run_adm_u01_close_20260603/report.json"
    if tunnel.is_file():
        tr = load_json(tunnel)
        if tr and (tr.get("environment") or {}).get("deployment_kind") != "persistent_host":
            violations.append(
                {
                    "id": "V-TUNNEL-PRE-RUN",
                    "artifact": str(tunnel),
                    "note": "tunnel pre-run must not substitute live persistent ADM-U01 GO",
                }
            )

    # Local ① smoke paths — informational only if no live GO
    local_smoke = ROOT / "scripts/dev/smoke-admin-rbac-matrix-local.sh"
    if local_smoke.is_file():
        violations.append(
            {
                "id": "V-LOCAL-SMOKE-EXISTS",
                "artifact": str(local_smoke),
                "severity": "info",
                "note": "① local smoke exists — cannot claim ② Admin GO",
            }
        )

    watcher_pid = soak_dir / "post-soak-staging-live-closure/closure-chain-watcher.pid"
    if watcher_pid.is_file():
        violations.append(
            {
                "id": "V-WATCHER-ALIVE",
                "artifact": str(watcher_pid),
                "severity": "info",
                "note": "watcher pid present — not Admin GO",
            }
        )

    return violations


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--soak-dir", default=str(SOAK_DIR))
    args = ap.parse_args()

    soak_dir = Path(args.soak_dir)
    closure_dir = soak_dir / "post-soak-staging-live-closure"
    closure_dir.mkdir(parents=True, exist_ok=True)

    loop = closure_loop_status(soak_dir, closure_dir)
    violations = audit_forbidden_substitutes(soak_dir)

    admin_go_allowed = loop["admin_go_claim_allowed"]
    phase2_closure_allowed = admin_go_allowed  # Phase② admin closure requires claim slot first
    production_go_allowed = False  # never from this track

    payload: dict[str, Any] = {
        "schema": "traveltrust.admin_go_closure_discipline.v1",
        "generated_at_utc": utc_now(),
        "phase": "②",
        "admin_go_ssot": SSOT_LINE,
        "admin_go_ssot_registry": str(SSOT_REGISTRY.relative_to(ROOT)).replace("\\", "/"),
        "admin_go_ssot_artifact": "post-soak-staging-live-closure/admin-go-claim-gate.latest.json",
        "unique_closure_loop": UNIQUE_CLOSURE,
        "forbidden_as_go": FORBIDDEN_AS_GO,
        "forbidden_claim_targets_unless_loop_closed": FORBIDDEN_CLAIM_TARGETS,
        "closure_loop": loop,
        "premature_substitute_audit": violations,
        "claim_matrix": {
            "admin_go": admin_go_allowed,
            "phase2_admin_closure": phase2_closure_allowed,
            "production_go": production_go_allowed,
        },
        "ssot_query": "bash scripts/ops/p2fc-query-admin-staging-go-claim.sh",
        "discipline_verdict": "CLOSED" if loop["loop_closed"] else "OPEN",
        "honest_boundary": (
            f"{SSOT_LINE}=ALLOWED is the ONLY lawful Admin GO claim · "
            "prep/static/tunnel/local/smoke/watcher/health/prep-only/soak-inflight "
            "must NEVER substitute Admin GO · Phase② Closure · Production GO"
        ),
    }

    out = closure_dir / "admin-go-closure-discipline.latest.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Live Closure Chain unified verdict SSOT
    import subprocess

    subprocess.run(
        [sys.executable, str(ROOT / "scripts/dev/gen-p2fc-live-closure-chain-verdict.py"), "--soak-dir", str(soak_dir)],
        cwd=str(ROOT),
        check=False,
    )

    print(
        f"TT_P2FC_ADMIN_GO_CLOSURE_DISCIPLINE: {payload['discipline_verdict']} "
        f"ssot={SSOT_LINE} loop_closed={loop['loop_closed']} claim_allowed={admin_go_allowed} "
        f"violations_info={len(violations)}"
    )
    return 0 if loop["loop_closed"] or not soak_dir.joinpath("COMPLETED.json").is_file() else 2


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
