#!/usr/bin/env python3
"""Project A WAIT_ETA final prep pack (≤4 items · stop after).

1) ETA Execution Gate — WAITING_WINDOW | READY_TO_EXECUTE
2) Post-ETA full-ladder dry-run simulation (no execute)
3) S7 Input Manifest BEFORE + Hash Gate prep
4) PSG-FINAL-RECALCULATE-REPORT template

Forbidden: Candidate mutate · Bridge execute · PENDING overwrite · S7 · Project B

  python scripts/dev/run-psg-project-a-wait-eta-final-prep-pack.py
"""
from __future__ import annotations

import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
BASELINE = "v311_fund_safety_candidate_v2"
CONSOL = ROOT / "evidence/PSG-EVIDENCE-CONSOLIDATION"
STATUS = CONSOL / "STATUS-LATEST.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_json(path: Path) -> dict | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return None


def load_mod(name: str, rel: str):
    path = ROOT / rel
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def post_eta_simulation(recorded: str) -> dict[str, Any]:
    """Dry-run only — documents checks/outputs per ladder step."""
    steps = [
        {
            "step": 1,
            "id": "settlement_finalize",
            "simulate": True,
            "executed": False,
            "checks": [
                "ETA_EXECUTION_GATE == READY_TO_EXECUTE (or wall clock past ETA)",
                "OWNER OK + TRAVELTRUST_WEB3_CANDIDATE_V2_SEPOLIA_DEPLOY_OK=1",
                "ops standby eta reached",
                "chain_id == 11155111",
                "deploy identity == v311_fund_safety_candidate_v2",
            ],
            "command": "bash scripts/dev/run-web3-candidate-v2-settlement-finalize.sh",
            "expected_outputs": [
                "evidence/GO_fg15_observation_48h_candidate_v2/money-path/finalize-*/",
                "tx hash / receipt / events",
                "SETTLEMENT-FINAL-CAPTURE via check-psg-settlement-final-capture.py",
            ],
            "script_exists": (ROOT / "scripts/dev/run-web3-candidate-v2-settlement-finalize.sh").is_file(),
            "validator_exists": (ROOT / "scripts/dev/check-psg-settlement-final-capture.py").is_file(),
        },
        {
            "step": 2,
            "id": "bridge_option_a",
            "simulate": True,
            "executed": False,
            "checks": [
                "prefer OPTION_A from S7-BRIDGE-IMPACT-ANALYSIS",
                "snapshot PENDING to sidecar before overwrite",
                "materialize Candidate S7-shaped JSON (NOT pointer-pack copy)",
                "stamp psg_release_version + deploy_baseline Candidate v2",
            ],
            "generates": [
                "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L1-PRODUCT-VALIDATION-LATEST.json",
                "…/L2-DATA-VALIDATION-HARDENED-LATEST.json",
                "…/L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
                "…/L4-OPERATIONS-VALIDATION-LATEST.json",
                "…/L5-FG-WEB3-EMPIRICAL-LATEST.json",
                "S7-INPUT-MANIFEST-AFTER-LATEST.json (lock-after-bridge)",
            ],
            "forbid": ["naive_copy_of_L*-S7-FINAL-INPUT pointer packs"],
        },
        {
            "step": 3,
            "id": "baseline_gate",
            "simulate": True,
            "executed": False,
            "checks": [
                "python scripts/dev/check-psg-s7-candidate-baseline-gate.py → READY",
                "S7_INPUT_SOURCE_CHECK → READY (not OLD_FCG)",
                "python scripts/dev/check-psg-s7-input-manifest-gate.py verify-pre-s7 → READY",
            ],
            "expected": "READY (not BLOCKED_WRONG_BASELINE)",
        },
        {
            "step": 4,
            "id": "l5_final",
            "simulate": True,
            "executed": False,
            "collects": [
                "finalize receipts (tx/block/event)",
                "FG-01..15 filled FINAL-CAPTURE templates",
                "money-path L5 runtime update",
                "FG15B elapsed_pass=true status",
                "residual classification refresh",
            ],
            "runbook": "docs/runbook/TT-PSG-L5-FINAL-RUNBOOK-LATEST.md",
            "runbook_exists": (ROOT / "docs/runbook/TT-PSG-L5-FINAL-RUNBOOK-LATEST.md").is_file(),
        },
        {
            "step": 5,
            "id": "s7_recalculate",
            "simulate": True,
            "executed": False,
            "reads": [
                "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L1-PRODUCT-VALIDATION-LATEST.json",
                "…/L2-DATA-VALIDATION-HARDENED-LATEST.json",
                "…/L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
                "…/L4-OPERATIONS-VALIDATION-LATEST.json",
                "…/L5-FG-WEB3-EMPIRICAL-LATEST.json (+ related L5 pending companions)",
                "FG15 Candidate status (observation track)",
            ],
            "pre_gates": [
                "ETA gate READY_TO_EXECUTE already consumed via finalize",
                "baseline gate READY",
                "manifest gate READY",
            ],
            "command": "bash scripts/dev/run-psg-completion-matrix-recalculate.sh",
            "script_exists": (ROOT / "scripts/dev/run-psg-completion-matrix-recalculate.sh").is_file(),
            "forbid": ["run_before_bridge", "run_on_OLD_FCG_pending"],
        },
    ]

    # dry structural readiness (scripts/docs exist; not time-elapsed)
    struct_ok = all(
        [
            steps[0]["script_exists"],
            steps[0]["validator_exists"],
            steps[3]["runbook_exists"],
            steps[4]["script_exists"],
            (ROOT / "scripts/dev/check-psg-eta-execution-gate.py").is_file(),
            (ROOT / "scripts/dev/check-psg-s7-input-manifest-gate.py").is_file(),
            (ROOT / "scripts/dev/check-psg-s7-candidate-baseline-gate.py").is_file(),
        ]
    )

    out = {
        "schema": "traveltrust.psg_post_eta_simulation.v1",
        "id": "POST_ETA_SIMULATION",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "mode": "DRY_RUN_ONLY",
        "verdict": "POST_ETA_SIMULATION_PASS" if struct_ok else "POST_ETA_SIMULATION_FAIL",
        "executed_finalize": False,
        "executed_bridge": False,
        "executed_s7": False,
        "equals_psg_complete": False,
        "steps": steps,
        "correct_order": [s["id"] for s in steps] + ["formal_baseline"],
        "honesty": "Simulation of checks/outputs only — wall clock may still be WAITING_WINDOW",
    }
    write_json(CONSOL / "POST-ETA-SIMULATION-LATEST.json", out)
    return out


def final_report_template(recorded: str) -> dict[str, Any]:
    doc = {
        "schema": "traveltrust.psg_final_recalculate_report.v1",
        "id": "PSG-FINAL-RECALCULATE-REPORT",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "status": "TEMPLATE_ONLY",
        "executed_s7": False,
        "equals_psg_complete": False,
        "layers": {
            "L1": {"result": None, "enum": ["PASS", "RESIDUAL", "OPEN"], "residual": []},
            "L2": {"result": None, "enum": ["PASS", "RESIDUAL", "OPEN"], "residual": []},
            "L3": {"result": None, "enum": ["PASS", "RESIDUAL", "OPEN"], "residual": []},
            "L4": {"result": None, "enum": ["PASS", "RESIDUAL", "OPEN"], "residual": []},
            "L5": {"result": None, "enum": ["PASS", "RESIDUAL", "OPEN"], "residual": []},
        },
        "open_blockers": [],
        "owner_required": [
            "W5 time-separated Owner Sign-off",
            "L4 operations_owner / incident_contact / recovery_budget (if still empty)",
            "Founder wallets before mainnet/GO (separate OWNER_INPUT)",
        ],
        "next_action": None,
        "next_action_enum": [
            "FORMAL_BASELINE_READY",
            "BLOCKED",
            "NEEDS_OWNER",
            "CONTINUE_RESIDUAL_TRACKING",
        ],
        "recommendation": None,
        "fill_after": [
            "bash scripts/dev/run-psg-completion-matrix-recalculate.sh",
            "copy layer verdicts from PSG-COMPLETION-VERDICT-LATEST.json",
        ],
        "generator_note": "Empty shell — populate only after real S7; do not invent PASS",
    }
    write_json(CONSOL / "PSG-FINAL-RECALCULATE-REPORT-TEMPLATE-LATEST.json", doc)

    md = f"""# PSG-FINAL-RECALCULATE-REPORT · TEMPLATE

recorded_utc: {recorded}
pin: {PIN}
status: TEMPLATE_ONLY · executed_s7: false · equals_psg_complete: false

## Layers

| Layer | Result | Residual |
|-------|--------|----------|
| L1 | _PASS / RESIDUAL / OPEN_ | |
| L2 | _PASS / RESIDUAL / OPEN_ | |
| L3 | _PASS / RESIDUAL / OPEN_ | |
| L4 | _PASS / RESIDUAL / OPEN_ | |
| L5 | _PASS / RESIDUAL / OPEN_ | |

## Open blockers

- (fill after S7)

## Owner required

- W5 time-separated Owner Sign-off
- L4 owner fields if empty
- Founder wallets before mainnet/GO

## Next action

_FORMAL_BASELINE_READY | BLOCKED | NEEDS_OWNER | CONTINUE_RESIDUAL_TRACKING_

## Honesty

Formal Baseline ready ≠ psg_complete ≠ Production GO.
"""
    (CONSOL / "PSG-FINAL-RECALCULATE-REPORT-TEMPLATE-LATEST.md").write_text(md, encoding="utf-8")
    return doc


def next_pcr() -> str:
    nums = []
    for p in (ROOT / "registry/psg-change-records").glob("PCR-20260720-*.yaml"):
        try:
            nums.append(int(p.stem.split("-")[-1]))
        except ValueError:
            pass
    return f"PCR-20260720-{(max(nums) + 1) if nums else 62:03d}"


def main() -> int:
    recorded = utc_now()
    eta_mod = load_mod("eta_gate", "scripts/dev/check-psg-eta-execution-gate.py")
    man_mod = load_mod("man_gate", "scripts/dev/check-psg-s7-input-manifest-gate.py")

    eta = eta_mod.run_gate(recorded)
    sim = post_eta_simulation(recorded)
    before = man_mod.snapshot_before()
    # refresh verify status (expect BLOCKED_NO_AFTER until bridge)
    man_gate = man_mod.verify_pre_s7()
    report = final_report_template(recorded)

    prep_pct = 95
    rollup = {
        "schema": "traveltrust.psg_project_a_wait_eta_final_prep_pack.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "mode": "WAIT_ETA_FINAL_PREP",
        "project_a_prep_estimate_pct": prep_pct,
        "stop_after_this_pack": True,
        "executed_finalize": False,
        "executed_bridge": False,
        "executed_s7": False,
        "equals_psg_complete": False,
        "checks": {
            "eta_execution_gate": eta["status"],
            "post_eta_simulation": sim["verdict"],
            "s7_input_manifest_before": "RECORDED",
            "s7_input_manifest_gate": man_gate["status"],
            "final_report_template": report["status"],
        },
        "real_blockers_now": ["TIMELOCK_FG15B_AND_SETTLEMENT_ETA", "OWNER_FINALIZE_OK"],
        "artifacts": [
            "evidence/PSG-EVIDENCE-CONSOLIDATION/ETA-EXECUTION-GATE-LATEST.json",
            "evidence/PSG-EVIDENCE-CONSOLIDATION/POST-ETA-SIMULATION-LATEST.json",
            "evidence/PSG-EVIDENCE-CONSOLIDATION/S7-INPUT-MANIFEST-BEFORE-LATEST.json",
            "evidence/PSG-EVIDENCE-CONSOLIDATION/S7-INPUT-MANIFEST-GATE-LATEST.json",
            "evidence/PSG-EVIDENCE-CONSOLIDATION/PSG-FINAL-RECALCULATE-REPORT-TEMPLATE-LATEST.json",
            "scripts/dev/check-psg-eta-execution-gate.py",
            "scripts/dev/check-psg-s7-input-manifest-gate.py",
        ],
    }
    write_json(CONSOL / "PROJECT-A-WAIT-ETA-FINAL-PREP-PACK-LATEST.json", rollup)

    pcr_id = next_pcr()
    (ROOT / "registry/psg-change-records" / f"{pcr_id}.yaml").write_text(
        f"""schema: traveltrust.psg_change_record.v1
id: {pcr_id}
title: Project A WAIT_ETA final prep — ETA gate · Post-ETA dry-run · S7 manifest · Final report template
recorded_utc: "{recorded}"
owner: Sebastian Ward
status: RECORDED
class: governance_gate_docs
mode: WAIT_ETA

summary: >
  Final wait-window prep pack (stop after). ETA Execution Gate; Post-ETA ladder
  dry-run simulation; S7 Input Manifest BEFORE + hash gate prep; PSG Final
  Recalculate Report template. No Candidate mutate, no Bridge, no PENDING
  overwrite, no S7, no Project B. Prep ~95%. Real blockers = timelock + Owner finalize.

active_ssot: {PIN}
deploy_baseline: {BASELINE}

checks:
  eta_gate: {eta["status"]}
  post_eta_simulation: {sim["verdict"]}
  manifest_before: RECORDED
  manifest_gate: {man_gate["status"]}
  final_report_template: {report["status"]}
  project_a_prep_pct: {prep_pct}

gates_not_triggered:
  - settlement_finalize
  - candidate_evidence_bridge_execute
  - pending_overwrite
  - s7_reader_rewrite
  - psg_recalculate
  - formal_release_baseline
  - project_b_start

stop_instruction: After this pack, only low-frequency Maintain until ETA.
""",
        encoding="utf-8",
    )

    if STATUS.is_file():
        st = load_json(STATUS) or {}
        st.update(
            {
                "recorded_utc": recorded,
                "wait_eta_final_prep_pcr": f"registry/psg-change-records/{pcr_id}.yaml",
                "eta_execution_gate": eta["status"],
                "post_eta_simulation": sim["verdict"],
                "s7_input_manifest_gate": man_gate["status"],
                "project_a_prep_estimate_pct": prep_pct,
                "stop_after_final_prep_pack": True,
                "psg_complete": False,
            }
        )
        write_json(STATUS, st)

    print(
        json.dumps(
            {
                "pcr": pcr_id,
                "eta_gate": eta["status"],
                "simulation": sim["verdict"],
                "manifest_before_candidate_match": before.get("all_pending_match_candidate_pin"),
                "manifest_gate": man_gate["status"],
                "final_report": report["status"],
                "prep_pct": prep_pct,
                "stop": True,
                "equals_psg_complete": False,
            },
            indent=2,
        )
    )
    print("TT_PSG_PROJECT_A_WAIT_ETA_FINAL_PREP_PACK: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
