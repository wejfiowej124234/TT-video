#!/usr/bin/env python3
"""P2FC · 优先级闭环追踪器（② · 只读状态 · 无 GO 宣称）

顺序（写死）：
  S0 Soak COMPLETED → S1 MR12 → S2 ADM-U01 → S3 P0 runtime
  → S4 B1–B4 → S5 ADM-U02 → S6 D3 → S7 D1/D2/D4

  python scripts/dev/gen-p2fc-priority-closure-tracker.py
  python scripts/dev/gen-p2fc-priority-closure-tracker.py --soak-dir evidence/P2FC_SOAK_72H_STAGING

末行：TT_P2FC_PRIORITY_CLOSURE_TRACKER: PASS|INFLIGHT|BLOCKED|PARTIAL
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


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def step(
    sid: str,
    title: str,
    *,
    done: bool,
    machine_line: str,
    evidence: str,
    blocked_by: str | None = None,
) -> dict[str, Any]:
    if done:
        status = "PASS"
    elif blocked_by:
        status = "BLOCKED"
    else:
        status = "OPEN"
    return {
        "id": sid,
        "title": title,
        "status": status,
        "machine_line": machine_line,
        "live_evidence": evidence,
        "blocked_by": blocked_by,
        "complete": done,
    }


def finding_open(f: dict[str, Any]) -> bool:
    sev = f.get("severity", "")
    live = f.get("live_status", "")
    if live == "CLEARED":
        return False
    if sev in ("critical", "high"):
        return True
    if sev in ("medium", "warn", "info") and f.get("convergence_required"):
        return live != "ACCEPTED"
    return sev in ("medium",) and live not in ("CLEARED", "ACCEPTED")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--soak-dir", default=str(SOAK_DIR))
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    soak_dir = Path(args.soak_dir)
    closure_dir = soak_dir / "post-soak-staging-live-closure"
    closure_dir.mkdir(parents=True, exist_ok=True)

    completed = (soak_dir / "COMPLETED.json").is_file()
    one_shot_log = soak_dir / "post-soak-one-shot/one-shot.log"
    one_shot_pass = one_shot_log.is_file() and "TT_P2FC_POST_SOAK_ONE_SHOT: PASS" in one_shot_log.read_text(
        encoding="utf-8", errors="replace"
    )

    adm_u01 = load_json(closure_dir / "adm-u01-live/report.json")
    adm_u02 = load_json(closure_dir / "adm-u02-live/report.json")
    p0 = load_json(closure_dir / "p0-rbac-bypass-runtime/latest.json")
    closure = load_json(closure_dir / "staging-live-closure.latest.json")
    web3 = load_json(soak_dir / "web3-system-security-audit/latest.json")
    web3_live = load_json(closure_dir / "web3-live-risk-convergence.latest.json")

    adm_u01_go = (adm_u01 or {}).get("release_gate") == "GO"
    adm_u02_go = (adm_u02 or {}).get("release_gate") == "GO"
    p0_ok = (p0 or {}).get("status") == "CONFIRMED"
    open_blockers = (closure or {}).get("open_blocker_count")
    if open_blockers is None:
        open_blockers = 4
    blockers_cleared = open_blockers == 0

    d3_verdict = (web3_live or {}).get("domain_verdicts", {}).get("D3") or (
        (web3 or {}).get("domains", {}).get("D3_admin_rbac_chain", {}).get("verdict")
    )
    d3_pass = d3_verdict == "PASS"

    d124_open = 0
    if web3_live:
        d124_open = web3_live.get("open_warn_count", 0)
    elif web3:
        for key in ("D1_contract_upgradeability", "D2_governance_attack_surface", "D4_ui_api_chain_consistency"):
            dom = web3.get("domains", {}).get(key, {})
            for f in dom.get("findings", []):
                if f.get("severity") in ("medium", "high", "critical"):
                    d124_open += 1

    steps: list[dict[str, Any]] = []
    blocked: str | None = None

    s0_done = completed
    steps.append(
        step(
            "S0_SOAK",
            "Soak 72h → COMPLETED.json",
            done=s0_done,
            machine_line="TT_P2FC_SOAK: COMPLETED" if s0_done else "TT_P2FC_SOAK: INFLIGHT",
            evidence=str(soak_dir / "COMPLETED.json") if s0_done else str(soak_dir / "job-20260624T011124Z/soak.log"),
            blocked_by=None if s0_done else None,
        )
    )
    if not s0_done:
        blocked = "S0_SOAK"

    s1_done = one_shot_pass
    steps.append(
        step(
            "S1_MR12",
            "MR12 one-shot execute",
            done=s1_done,
            machine_line="TT_P2FC_POST_SOAK_ONE_SHOT: PASS" if s1_done else "TT_P2FC_POST_SOAK_ONE_SHOT: PENDING",
            evidence=str(soak_dir / "post-soak-one-shot/one-shot.log"),
            blocked_by=blocked if not s1_done else None,
        )
    )
    if s0_done and not s1_done and not blocked:
        blocked = "S1_MR12"

    s2_done = adm_u01_go
    steps.append(
        step(
            "S2_ADM_U01",
            "ADM-U01 Live six-role RBAC matrix",
            done=s2_done,
            machine_line=f"ADM-U01 release_gate=GO" if s2_done else "ADM-U01 live not GO",
            evidence=str(closure_dir / "adm-u01-live/report.json"),
            blocked_by=blocked if not s2_done else None,
        )
    )
    if s1_done and not s2_done and not blocked:
        blocked = "S2_ADM_U01"

    s3_done = p0_ok
    steps.append(
        step(
            "S3_P0_RUNTIME",
            "P0 RBAC bypass runtime verification",
            done=s3_done,
            machine_line=f"TT_P2FC_P0_RBAC_BYPASS_RUNTIME: CONFIRMED" if s3_done else "TT_P2FC_P0_RBAC_BYPASS_RUNTIME: PENDING",
            evidence=str(closure_dir / "p0-rbac-bypass-runtime/latest.json"),
            blocked_by=blocked if not s3_done else None,
        )
    )
    if s2_done and not s3_done and not blocked:
        blocked = "S3_P0_RUNTIME"

    s4_done = blockers_cleared and s1_done
    steps.append(
        step(
            "S4_BLOCKERS",
            "B1–B4 blockers cleared (live checkpoint)",
            done=s4_done,
            machine_line=f"open_blocker_count=0" if s4_done else f"open_blocker_count={open_blockers}",
            evidence=str(closure_dir / "staging-live-closure.latest.json"),
            blocked_by=blocked if not s4_done else None,
        )
    )
    if s3_done and not s4_done and not blocked:
        blocked = "S4_BLOCKERS"

    s5_done = adm_u02_go
    steps.append(
        step(
            "S5_ADM_U02",
            "ADM-U02 staging 2FA/approval live",
            done=s5_done,
            machine_line="TT_ADM_U02_STAGING_EVIDENCE: PASS" if s5_done else "ADM-U02 live pending",
            evidence=str(closure_dir / "adm-u02-live/report.json"),
            blocked_by=blocked if not s5_done else None,
        )
    )
    if s4_done and not s5_done and not blocked:
        blocked = "S5_ADM_U02"

    s6_done = d3_pass
    steps.append(
        step(
            "S6_D3",
            "D3 FAIL items cleared (live evidence merge)",
            done=s6_done,
            machine_line=f"D3 verdict=PASS" if s6_done else f"D3 verdict={d3_verdict or 'FAIL/WARN'}",
            evidence=str(closure_dir / "web3-live-risk-convergence.latest.json"),
            blocked_by=blocked if not s6_done else None,
        )
    )
    if s5_done and not s6_done and not blocked:
        blocked = "S6_D3"

    s7_done = d124_open == 0 and s6_done
    steps.append(
        step(
            "S7_D124",
            "D1/D2/D4 WARN/OPEN risk convergence",
            done=s7_done,
            machine_line=f"D124 open_warn_count=0" if s7_done else f"D124 open_warn_count={d124_open}",
            evidence=str(closure_dir / "web3-live-risk-convergence.latest.json"),
            blocked_by=blocked if not s7_done else None,
        )
    )

    gate = load_json(closure_dir / "admin-go-claim-gate.latest.json")
    claim_allowed = (gate or {}).get("allowed") is True
    all_core = s0_done and s1_done and s2_done and s3_done and s4_done and s5_done and s6_done and s7_done

    if not completed:
        overall = "INFLIGHT"
    elif all_core and claim_allowed:
        overall = "PASS"
    elif any(s["complete"] for s in steps[1:]):
        overall = "PARTIAL"
    else:
        overall = "BLOCKED"

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_priority_closure_tracker.v1",
        "generated_at_utc": utc_now(),
        "phase": "②",
        "no_go_claim_without_runtime": True,
        "next_blocked_step": blocked,
        "steps": steps,
        "runtime_adjudication": {
            "admin_go_ssot": "TT_ADMIN_STAGING_GO_CLAIM",
            "claim_allowed": claim_allowed,
            "parent_ssot": "TT_LIVE_CLOSURE_CHAIN_VERDICT",
        },
        "overall": overall,
        "honest_boundary": "prep/static ≠ live GO · production_go always separate ③ gate",
    }

    out = Path(args.out) if args.out else closure_dir / "priority-closure-tracker.latest.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    done_n = sum(1 for s in steps if s["complete"])
    print(
        f"TT_P2FC_PRIORITY_CLOSURE_TRACKER: {overall} "
        f"steps_pass={done_n}/{len(steps)} next_blocked={blocked or 'none'} "
        f"admin_go_claim={claim_allowed} out={out.as_posix()}"
    )
    return 0 if overall == "PASS" else 2


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
