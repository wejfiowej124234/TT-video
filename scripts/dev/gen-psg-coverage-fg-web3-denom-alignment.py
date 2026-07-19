#!/usr/bin/env python3
"""Regenerate PSG Coverage Acceptance artifacts with Financial-Grade Web3 dimension.

Aligns Coverage Framework to Constitution V3.1.1 PSG Completion:
  PSG_COMPLETE = Product ∧ Data ∧ Security ∧ Operations ∧ FG-Web3
FG-01..15 enter hard Completion Coverage denominators (honest: 0/15 PASS today).
Does NOT invent FG PASS · does NOT flip CONDITIONAL_GO · does NOT broadcast.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
STAMP = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

FG_SURFACES = [
    ("FG-01", "Money-Path", "Money_Path"),
    ("FG-02", "Escrow State Machine", "Escrow_State_Machine"),
    ("FG-03", "SettlementRouter", "SettlementRouter"),
    ("FG-04", "FeeRouter", "FeeRouter"),
    ("FG-05", "Distributable", "Distributable"),
    ("FG-06", "Steward Revenue", "Steward_Revenue"),
    ("FG-07", "Treasury", "Treasury"),
    ("FG-08", "TTG Governance", "TTG_Governance"),
    ("FG-09", "Timelock Execute", "Timelock_Execute"),
    ("FG-10", "Wallet Security", "Wallet_Security"),
    ("FG-11", "RBAC", "RBAC"),
    ("FG-12", "Indexer", "Indexer"),
    ("FG-13", "Chain-DB-API-UI Consistency", "Chain_DB_API_UI_Consistency"),
    ("FG-14", "Audit Evidence", "Audit_Evidence"),
    ("FG-15", "48H Observation", "Observation_48H"),
]


def dump_yaml(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")


def dump_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    ev_dir = ROOT / "evidence/GO_pre_eta_production_prep/coverage-fg-web3-20260719"
    ev_dir.mkdir(parents=True, exist_ok=True)

    # ── FG cells (honest NOT_READY) ──────────────────────────────
    fg_cells = []
    for fid, label, key in FG_SURFACES:
        fg_cells.append(
            {
                "id": fid,
                "key": key,
                "label": label,
                "status": "NOT_READY",
                "pass": False,
                "denom_in": "IN",
                "evidence": "TARGET_via_Full_Capability_Gate_and_Gap_Closure",
                "note": "In PSG Completion Coverage denom; not PASS until FG gate evidence",
            }
        )

    # ── Measurement FINAL (extend, keep Web2 numbers) ────────────
    mf_path = ROOT / "registry/psg-coverage-measurement-final.v1.yaml"
    mf = yaml.safe_load(mf_path.read_text(encoding="utf-8"))
    mf["recorded_utc"] = STAMP
    mf["status"] = "METRIC_FINAL_PLUS_FG_WEB3_DENOM"
    mf["version"] = "1.1.0"
    mf["psg_production_completion"] = "registry/psg-production-completion-definition.v1.yaml"
    mf["constitution_binding"] = (
        "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md#psg-production-completion"
    )
    mf["discipline"] = mf.get("discipline") or {}
    mf["discipline"]["forbid_web2_alone_as_psg_complete"] = True
    mf["discipline"]["financial_grade_web3_in_completion_denom"] = True
    mf["discipline"]["no_invented_fg_pass"] = True
    # soften prior no_web3 expansion — Owner authorized FG denom alignment
    mf["discipline"]["no_web3_minfix"] = False
    mf["discipline"]["fg_web3_denom_alignment_authorized"] = True

    metrics = mf.setdefault("metrics", {})
    metrics["Financial_Grade_Web3"] = {
        "denom": 15,
        "pass": 0,
        "fail": 0,
        "not_run": 15,
        "na": 0,
        "pct": 0.0,
        "threshold_rule": "pass/15 == 100",
        "threshold_decision": "NEED_FIX",
        "hard_completion_denom": True,
        "optional": False,
        "surfaces": [c["id"] for c in fg_cells],
    }
    mf["rollup_threshold_decision"] = "NEED_FIX"
    mf["rollup_reasons"] = [
        "RBAC_60_of_96_NEED_FIX",
        "Financial_Grade_Web3_0_of_15_NEED_FIX",
    ]
    mf["psg_completion_coverage"] = {
        "equation": "Product ∧ Data ∧ Security ∧ Operations ∧ FG-Web3",
        "web2_metrics_sufficient_alone": False,
        "fg_web3_status": "NOT_READY",
        "psg_complete": False,
    }
    pci = mf.setdefault("pass_cell_index", {})
    pci["Financial_Grade_Web3"] = []  # none PASS
    mf["not_ready_cell_index"] = {
        "Financial_Grade_Web3": [c["id"] for c in fg_cells],
    }
    dump_yaml(mf_path, mf)

    # cells artifact extension
    cells_path = ROOT / (
        "evidence/GO_pre_eta_production_prep/coverage-gap-non-web3-20260719/"
        "MEASUREMENT-FINAL-CELLS.json"
    )
    cells = {}
    if cells_path.exists():
        try:
            cells = json.loads(cells_path.read_text(encoding="utf-8"))
        except Exception:
            cells = {}
    if not isinstance(cells, dict):
        cells = {"legacy": cells}
    cells["Financial_Grade_Web3"] = {
        "recorded_utc": STAMP,
        "denom": 15,
        "pass": 0,
        "cells": fg_cells,
    }
    cells["meta"] = {
        **(cells.get("meta") or {}),
        "fg_web3_denom_aligned_utc": STAMP,
        "psg_complete_requires_fg_web3": True,
    }
    dump_json(cells_path, cells)
    dump_json(ev_dir / "FG-WEB3-MEASUREMENT-CELLS-LATEST.json", {"cells": fg_cells, "recorded_utc": STAMP})

    # ── Threshold Matrix ─────────────────────────────────────────
    th_path = ROOT / "registry/psg-coverage-acceptance-threshold-matrix.v1.yaml"
    th = yaml.safe_load(th_path.read_text(encoding="utf-8"))
    th["recorded_utc"] = STAMP
    th["status"] = "COMPLETE_FG_WEB3_DENOM_ALIGNED"
    th["version"] = "1.1.0"
    th["psg_production_completion"] = "registry/psg-production-completion-definition.v1.yaml"
    th["discipline"] = th.get("discipline") or {}
    th["discipline"]["forbid_web2_alone_as_psg_complete"] = True
    th["discipline"]["financial_grade_web3_hard_gate"] = True
    tfp = th.setdefault("thresholds_first_production_slice", {})
    # Keep existing Web2 thresholds; refresh FG
    tfp["Financial_Grade_Web3"] = {
        "rule": "measurement_pass_over_15_eq_100",
        "current_weighted": 0,
        "evidence": "NOT_READY",
        "metric": "GAP",
        "denom": 15,
        "pass": 0,
        "meets": False,
        "hard_completion_denom": True,
        "optional": False,
        "depends": [
            "Full_Capability_Gate_A_L",
            "Gap_Closure_FCG_PAY_ESCROW_STEWARD",
            "G_RC_CLOSED_then_Clean_Deploy",
            "M_RC_TRE_REG",
            "Observation_48H",
        ],
        "surfaces": [{"id": a, "label": b, "key": c} for a, b, c in FG_SURFACES],
    }
    th["release_gate_stamp"] = th.get("release_gate_stamp") or {}
    th["release_gate_stamp"]["coverage_metrics"] = "FINAL_PLUS_FG_DENOM"
    th["release_gate_stamp"]["threshold_rollup"] = "NEED_FIX"
    th["release_gate_stamp"]["fg_web3"] = "NEED_FIX_0_15"
    th["release_gate_stamp"]["psg_complete"] = False
    # work table row
    rwt = th.setdefault("release_window_work_table", [])
    if not any(isinstance(x, dict) and x.get("coverage") == "Financial_Grade_Web3" for x in rwt):
        rwt.append(
            {
                "coverage": "Financial_Grade_Web3",
                "current": 0,
                "target": "15_15_PASS",
                "depends": "G_RC_CLOSED_Clean_Deploy_Gap_Closure_48H",
            }
        )
    # allow money_path in denom tracking (still forbid broadcast)
    forbid = th.get("forbidden_now") or []
    th["forbidden_now"] = [
        x for x in forbid if x != "money_path"
    ] + [
        "claim_psg_complete_from_web2_coverage_alone",
        "treat_fg_web3_as_optional_or_out_of_denom",
        "invent_fg_pass_without_evidence",
        "money_path_broadcast_before_G_RC_CLOSED",
    ]
    # dedupe
    seen = set()
    th["forbidden_now"] = [x for x in th["forbidden_now"] if not (x in seen or seen.add(x))]
    dump_yaml(th_path, th)

    # ── Coverage model → eight dimensions ────────────────────────
    model_path = ROOT / "registry/psg-coverage-model-seven-dimensions.v1.yaml"
    model = yaml.safe_load(model_path.read_text(encoding="utf-8"))
    model["recorded_utc"] = STAMP
    model["model_version"] = "v2_eight_dimensions_v311_fg_web3"
    model["dimensions_count"] = 8
    model["supersedes_seven_only_acceptance"] = True
    model["psg_production_completion"] = "registry/psg-production-completion-definition.v1.yaml"
    model["production_thresholds"] = model.get("production_thresholds") or {}
    model["production_thresholds"]["Financial_Grade_Web3"] = "PASS_15_of_15"
    model["discipline"] = model.get("discipline") or {}
    model["discipline"]["forbid_web2_alone_as_psg_complete"] = True
    model["discipline"]["fg_web3_mandatory_dimension"] = True
    dash = model.setdefault("acceptance_dashboard", {})
    dims = dash.setdefault("dimensions", [])
    if not any(isinstance(d, dict) and d.get("id") == "D8_FINANCIAL_GRADE_WEB3" for d in dims):
        dims.append(
            {
                "id": "D8_FINANCIAL_GRADE_WEB3",
                "acceptance": "FAIL_NOT_READY",
                "threshold": "PASS_15_of_15",
                "optional": False,
                "hard_completion_denom": True,
                "surfaces": [a for a, _, _ in FG_SURFACES],
                "evidence": [
                    "registry/psg-production-full-capability-gate.v1.yaml",
                    "registry/psg-production-completion-definition.v1.yaml",
                ],
                "note": "Mandatory pillar — Web2 Measurement PASS does not satisfy",
            }
        )
    dash["rollup"] = "CONDITIONAL_NEED_FIX_FG_WEB3"
    dash["psg_complete"] = False
    model["go_formula"] = [
        "release_blocker_eq_0",
        "release_fix_required_closed",
        "coverage_acceptance_required_dims_pass",
        "financial_grade_web3_15_15_pass",
        "psg_five_pillar_completion_pass",
        "code_line_deferred_ok",
        "owner_signoff",
        "rollback_exists",
        "not_web2_coverage_alone",
    ]
    dump_yaml(model_path, model)

    # ── Gap Map: add FG domain block ─────────────────────────────
    gap_path = ROOT / "registry/psg-release-surface-test-coverage-gap.v1.yaml"
    gap = yaml.safe_load(gap_path.read_text(encoding="utf-8"))
    gap["recorded_utc"] = STAMP
    gap["status"] = "COMPLETE_PLUS_FG_WEB3_DENOM"
    gap["version"] = "1.1.0"
    gap["psg_production_completion"] = "registry/psg-production-completion-definition.v1.yaml"
    gap["financial_grade_web3"] = {
        "in_completion_denom": True,
        "optional": False,
        "denom": 15,
        "pass": 0,
        "rollup": "NOT_READY",
        "surfaces": [
            {
                "id": a,
                "label": b,
                "key": c,
                "status": "NOT_READY",
                "denom_in": "IN",
                "gap": "Await_Full_Capability_Gate_evidence",
            }
            for a, b, c in FG_SURFACES
        ],
    }
    counts = gap.setdefault("counts", {})
    counts["FG_WEB3_NOT_READY"] = 15
    counts["FG_WEB3_COVERED"] = 0
    # add / refresh domain entries for FG surfaces (aggregate domain)
    domains = gap.setdefault("domains", [])
    domains = [d for d in domains if not (isinstance(d, dict) and str(d.get("id", "")).startswith("FG-"))]
    for a, b, c in FG_SURFACES:
        domains.append(
            {
                "id": a,
                "name": b,
                "status": "NOT_READY",
                "denom_in": "IN",
                "completion_coverage": True,
                "financial_grade_web3": True,
                "entries": [c],
                "gap_notes": [
                    "In PSG Completion Coverage denominator",
                    "PASS only via Full Capability / Gap Closure evidence",
                    "Web2 Coverage alone insufficient",
                ],
                "evidence": {
                    "plans": [
                        "registry/psg-production-full-capability-gate.v1.yaml",
                        "registry/psg-production-completion-definition.v1.yaml",
                    ]
                },
                "min_fix_overlap": [],
            }
        )
    gap["domains"] = domains
    # recount classic statuses (exclude FG-*)
    classic = [d for d in domains if not str(d.get("id", "")).startswith("FG-")]
    from collections import Counter

    cstat = Counter(d.get("status") for d in classic)
    gap["counts"]["COVERED"] = cstat.get("COVERED", 0)
    gap["counts"]["PARTIAL"] = cstat.get("PARTIAL", 0)
    gap["counts"]["NOT_RUN"] = cstat.get("NOT_RUN", 0)
    gap["counts"]["DEFERRED"] = cstat.get("DEFERRED", 0)
    gap["counts"]["classic_domain_total"] = len(classic)
    gap["counts"]["fg_surface_total"] = 15
    dump_yaml(gap_path, gap)

    # ── Capability Coverage Matrix: FG rows ──────────────────────
    mx_path = ROOT / "registry/psg-production-capability-coverage-matrix.v1.yaml"
    mx = yaml.safe_load(mx_path.read_text(encoding="utf-8"))
    mx["recorded_utc"] = STAMP
    mx["version"] = "v1.1_fg_web3_denom"
    mx["status"] = "MATRIX_V1_1_FG_WEB3_DENOM_ALIGNED"
    mx["psg_production_completion"] = "registry/psg-production-completion-definition.v1.yaml"
    mx["discipline"] = mx.get("discipline") or {}
    mx["discipline"]["forbid_web2_alone_as_psg_complete"] = True
    td = mx.setdefault("threshold_denoms", [])
    if "Financial_Grade_Web3" not in td:
        td.append("Financial_Grade_Web3")
    rows = mx.setdefault("rows", [])
    rows = [r for r in rows if not (isinstance(r, dict) and str(r.get("id", "")).startswith("PCM-FG-"))]
    for a, b, c in FG_SURFACES:
        rows.append(
            {
                "id": f"PCM-{a}",
                "name": b,
                "category": "financial_grade_web3",
                "seven_dims": ["D5", "D8"],
                "measurement_cases": [a],
                "baseline_threshold": {
                    "Financial_Grade_Web3": {
                        "surface": c,
                        "status": "NOT_READY",
                        "w_contrib": 1.0,
                    }
                },
                "evidence": [
                    "registry/psg-production-full-capability-gate.v1.yaml",
                    "docs/runbook/TT-PRODUCTION-FULL-CAPABILITY-GATE-GAP-CLOSURE-LATEST.md",
                ],
                "capability_status": "NOT_READY",
                "denom_in": "IN",
                "completion_coverage": True,
                "optional": False,
            }
        )
    mx["rows"] = rows
    # recount denom_in
    from collections import Counter as C2

    dc = C2(r.get("denom_in") for r in rows)
    mx["denom_counts"] = {k: int(v) for k, v in dc.items()}
    mx["fg_web3_denom"] = {"surfaces": 15, "pass": 0, "in_completion_coverage": True}
    dump_yaml(mx_path, mx)

    # ── Completion definition pointer ────────────────────────────
    comp_path = ROOT / "registry/psg-production-completion-definition.v1.yaml"
    comp = yaml.safe_load(comp_path.read_text(encoding="utf-8"))
    comp["recorded_utc"] = STAMP
    comp["coverage_acceptance_framework"] = {
        "model": "registry/psg-coverage-model-seven-dimensions.v1.yaml",
        "dimensions_count": 8,
        "d8": "D8_FINANCIAL_GRADE_WEB3",
        "threshold_matrix": "registry/psg-coverage-acceptance-threshold-matrix.v1.yaml",
        "measurement_final": "registry/psg-coverage-measurement-final.v1.yaml",
        "gap_map": "registry/psg-release-surface-test-coverage-gap.v1.yaml",
        "capability_matrix": "registry/psg-production-capability-coverage-matrix.v1.yaml",
        "fg_denom": 15,
        "fg_pass": 0,
        "web2_alone_insufficient": True,
    }
    dump_yaml(comp_path, comp)

    pack = {
        "schema": "traveltrust.psg_coverage_fg_web3_denom_alignment.v1",
        "recorded_utc": STAMP,
        "verdict": "FG_WEB3_DIMENSION_AND_DENOM_LANDED_0_15_NEED_FIX",
        "psg_complete": False,
        "equation": "Product ∧ Data ∧ Security ∧ Operations ∧ FG-Web3",
        "web2_alone_insufficient": True,
        "fg_surfaces": [{"id": a, "label": b} for a, b, _ in FG_SURFACES],
        "artifacts": {
            "model": "registry/psg-coverage-model-seven-dimensions.v1.yaml",
            "threshold": "registry/psg-coverage-acceptance-threshold-matrix.v1.yaml",
            "measurement_final": "registry/psg-coverage-measurement-final.v1.yaml",
            "gap_map": "registry/psg-release-surface-test-coverage-gap.v1.yaml",
            "capability_matrix": "registry/psg-production-capability-coverage-matrix.v1.yaml",
            "cells": str(cells_path.as_posix()),
        },
    }
    dump_json(ev_dir / "COVERAGE-FG-WEB3-DENOM-ALIGNMENT-LATEST.json", pack)
    print(pack["verdict"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
