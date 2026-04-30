#!/usr/bin/env python3
"""
Orchestration + regression → verdict suggestion.

Policies:
  - tier_a_p0_minimal_binary_v1 (default): NO_GO | SOFT_GO (legacy schema_version "1")
  - tri_state_v2: NO_GO | SOFT_GO | PRODUCTION_GO (schema_version "2" orchestration)

PRODUCTION_GO (v2): no FAIL; no ACCEPTED_RISK unless summary.accepted_risks_production_acknowledged;
  tier_a_all_pass; tier_bc_all_pass; regression report present with release_gate == GO.

Usage:
  python scripts/release/go_state_machine.py --orchestration evidence/GO_x/release_orchestration.json
  python scripts/release/go_state_machine.py --orchestration orch.json --regression evidence/GO_x/report.json --out out.json
  python scripts/release/go_state_machine.py --orchestration orch_v2.json --regression rep.json --policy tri_state_v2 --out out.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

VALID_RG = frozenset({"GO", "PARTIAL_GO", "NO_GO"})
BINARY_VERDICT = frozenset({"NO_GO", "SOFT_GO"})
TRI_VERDICT = frozenset({"NO_GO", "SOFT_GO", "PRODUCTION_GO"})


def _load_json(p: Path) -> dict[str, Any]:
    return json.loads(p.read_text(encoding="utf-8"))


def _iter_steps(orch: dict[str, Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for t in orch.get("tiers", []):
        if not isinstance(t, dict):
            continue
        for s in t.get("steps", []):
            if isinstance(s, dict):
                out.append(s)
    return out


def _tier_a_steps(steps: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [s for s in steps if str(s.get("id", "")).startswith("TIER-A-")]


def compute_v1(orch: dict[str, Any], reg: dict[str, Any] | None) -> dict[str, Any]:
    steps = _iter_steps(orch)
    a_steps = _tier_a_steps(steps)
    tier_a_fail = any(s.get("status") == "FAIL" for s in a_steps)
    summ = orch.get("summary") if isinstance(orch.get("summary"), dict) else {}
    tier_a_all_pass = summ.get("tier_a_all_pass")
    if tier_a_all_pass is None:
        tier_a_all_pass = len(a_steps) == 3 and all(s.get("status") == "PASS" for s in a_steps)
    else:
        tier_a_all_pass = bool(tier_a_all_pass)

    attributions: list[dict[str, str]] = []

    def push(domain: str, reason: str) -> None:
        attributions.append({"domain": domain, "reason": reason})

    rg: str | None = None
    if reg is not None:
        rg = reg.get("release_gate")
        if rg not in VALID_RG:
            push("R002", f"report.json release_gate invalid: {rg!r}")
            rg = None

    if tier_a_fail:
        fs = next(s for s in a_steps if s.get("status") == "FAIL")
        dom = str(fs.get("primary_attribution_if_fail") or "96")
        push(dom, f"Tier A step {fs.get('id')!r} FAILED ({fs.get('semiauto_detail') or fs.get('stdout_tail') or 'see orchestration'})")

    if rg == "NO_GO":
        push("93", "report.json release_gate is NO_GO (93 §7.1)")

    if rg is None and reg is not None:
        verdict = "NO_GO"
    elif tier_a_fail or rg == "NO_GO":
        verdict = "NO_GO"
    else:
        verdict = "SOFT_GO"
        if not tier_a_all_pass:
            push("96", "Tier A P0 minimal loop not closed (A1/A2 semiauto off or evidence failed / A3)")
        elif rg == "PARTIAL_GO":
            push("93", "release_gate PARTIAL_GO — SOFT_GO under Tier-A-only policy")
        elif rg == "GO":
            push("95", "release_gate GO; Tier A all PASS — SOFT_GO (B/C still manual-only; not Production GO)")
        elif reg is None:
            push("93", "no regression report.json — orchestration-only SOFT_GO")

    assert verdict in BINARY_VERDICT

    return {
        "schema_version": "1",
        "kind": "traveltrust.go_state_suggestion.v1",
        "release_verdict_suggestion": verdict,
        "release_verdict_allowed_values": sorted(BINARY_VERDICT),
        "policy": "tier_a_p0_minimal_binary_v1",
        "attributions": attributions,
        "inputs": {
            "had_regression_report": reg is not None,
            "regression_release_gate": rg,
            "orchestration_run_id": orch.get("run_id"),
            "orchestration_schema": orch.get("schema_version"),
            "tier_a_all_pass": tier_a_all_pass,
            "tier_a_fail": tier_a_fail,
            "tier_bc_all_pass": summ.get("tier_bc_all_pass"),
            "tier_bc_scope_manual_only": summ.get("tier_bc_scope_manual_only"),
            "tier_bc_ignored_for_verdict": True,
        },
    }


def compute_v2(orch: dict[str, Any], reg: dict[str, Any] | None) -> dict[str, Any]:
    steps = _iter_steps(orch)
    summ = orch.get("summary") if isinstance(orch.get("summary"), dict) else {}
    any_fail = bool(summ.get("any_fail")) or any(s.get("status") == "FAIL" for s in steps)
    any_ar = bool(summ.get("any_accepted_risk")) or any(s.get("status") == "ACCEPTED_RISK" for s in steps)
    ack_ar = bool(summ.get("accepted_risks_production_acknowledged"))

    tier_a_all_pass = bool(summ.get("tier_a_all_pass"))
    tier_bc_all_pass = bool(summ.get("tier_bc_all_pass"))

    attributions: list[dict[str, str]] = []

    def push(domain: str, reason: str) -> None:
        attributions.append({"domain": domain, "reason": reason})

    rg: str | None = None
    if reg is not None:
        rg = reg.get("release_gate")
        if rg not in VALID_RG:
            push("R002", f"report.json release_gate invalid: {rg!r}")
            rg = None

    # ISS-007 / §9: optional cases FAIL → NO_GO when present
    iss_cases_fail = False
    if reg is not None:
        cases = reg.get("cases")
        if isinstance(cases, list):
            iss_cases_fail = any(isinstance(c, dict) and c.get("status") == "FAIL" for c in cases)

    verdict: str
    if any_fail:
        verdict = "NO_GO"
        fs = next((s for s in steps if s.get("status") == "FAIL"), None)
        if fs:
            push(str(fs.get("primary_attribution_if_fail") or "96"), f"step {fs.get('id')!r} FAIL")
        else:
            push("96", "summary.any_fail")
    elif iss_cases_fail:
        verdict = "NO_GO"
        push("95", "report cases contain FAIL (F / §8.2 / §9 ISS alignment)")
    elif rg == "NO_GO":
        verdict = "NO_GO"
        push("93", "release_gate NO_GO")
    elif rg is None:
        verdict = "NO_GO"
        push("R002", "PRODUCTION_GO requires regression report.json with valid release_gate")
    elif rg != "GO":
        verdict = "SOFT_GO"
        push("93", f"release_gate is {rg!r}; PRODUCTION_GO requires GO")
    elif not tier_a_all_pass:
        verdict = "SOFT_GO"
        push("96", "tier_a_all_pass false")
    elif not tier_bc_all_pass:
        verdict = "SOFT_GO"
        push("96", "tier_bc_all_pass false")
    elif any_ar and not ack_ar:
        verdict = "SOFT_GO"
        push("96", "ACCEPTED_RISK present without production ack (set summary or TT_96_ACK_ACCEPTED_RISKS_FOR_PRODUCTION)")
    else:
        verdict = "PRODUCTION_GO"
        push("95", "orchestration v2 all machine gates closed; release_gate GO; 93 matrix cases not FAIL")

    assert verdict in TRI_VERDICT

    return {
        "schema_version": "2",
        "kind": "traveltrust.go_state_suggestion.v2",
        "release_verdict_suggestion": verdict,
        "release_verdict_allowed_values": sorted(TRI_VERDICT),
        "policy": "tri_state_v2",
        "attributions": attributions,
        "industry_control_mapping_note": (
            "Orchestration steps carry control_framework_refs (ISO 27001 Annex A, SOC 2 CC, OWASP ASVS, CIS CSC, SRE SLO). "
            "Verdict does not certify ISO/SOC compliance; it only reflects local machine artifacts."
        ),
        "inputs": {
            "had_regression_report": reg is not None,
            "regression_release_gate": rg,
            "orchestration_run_id": orch.get("run_id"),
            "orchestration_schema": orch.get("schema_version"),
            "tier_a_all_pass": tier_a_all_pass,
            "tier_bc_all_pass": tier_bc_all_pass,
            "any_fail": any_fail,
            "any_accepted_risk": any_ar,
            "accepted_risks_production_acknowledged": ack_ar,
            "cases_any_fail": iss_cases_fail,
        },
    }


def compute(orch: dict[str, Any], reg: dict[str, Any] | None, *, policy: str) -> dict[str, Any]:
    sv = str(orch.get("schema_version", "1"))
    if policy == "tri_state_v2" or sv == "2":
        return compute_v2(orch, reg)
    return compute_v1(orch, reg)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--orchestration", type=Path, required=True)
    ap.add_argument("--regression", type=Path, default=None)
    ap.add_argument(
        "--policy",
        choices=("tier_a_p0_minimal_binary_v1", "tri_state_v2", "auto"),
        default="auto",
        help="auto: tri_state_v2 when orchestration.schema_version==2 else v1 binary",
    )
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()

    if not args.orchestration.is_file():
        print(f"ERROR: orchestration not found: {args.orchestration}", file=sys.stderr)
        return 2

    orch = _load_json(args.orchestration)
    reg = _load_json(args.regression) if args.regression and args.regression.is_file() else None

    pol = args.policy
    if pol == "auto":
        pol = "tri_state_v2" if str(orch.get("schema_version")) == "2" else "tier_a_p0_minimal_binary_v1"

    doc = compute(orch, reg, policy=pol)
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text, encoding="utf-8")
        print(f"Wrote {args.out}")
    else:
        print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
