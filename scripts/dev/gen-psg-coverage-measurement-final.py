#!/usr/bin/env python3
"""Fill PSG Coverage Measurement cells from existing Non-Web3 evidence only."""
from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

EV = "evidence/GO_pre_eta_production_prep/coverage-gap-non-web3-20260719"
PHASE2_CELL_LOG = f"{EV}/phase2/CELL_PASS.ndjson"
PHASE3_CELL_LOG = f"{EV}/phase3/CELL_PASS.ndjson"
ROOT = Path(__file__).resolve().parents[2]

# Phase2 NDJSON keys that must not count as PASS (invalid / soft evidence)
PHASE2_REJECT_KEYS = {
    "Community|Create",  # media_required — not a successful create
    "Admin|CAP_OWN|F_DENY_UI",  # soft / non-specific UI deny
}

# Phase3: targeted residual NOT_RUN fill — empty reject (phase3 evidence supersedes phase2 soft reject)
PHASE3_REJECT_KEYS: set[str] = set()


def pct(pass_n: int, denom: int) -> float:
    return round(100.0 * pass_n / denom, 2)


def load_cell_passes(rel_log: str, reject: set[str], note_prefix: str) -> dict[str, dict[str, dict]]:
    """Return {dim: {key: {evidence, note}}} from a CELL_PASS.ndjson."""
    path = ROOT / rel_log
    out: dict[str, dict[str, dict]] = {
        "RBAC": {},
        "Journey": {},
        "Data": {},
        "UI": {},
    }
    if not path.is_file():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            o = json.loads(line)
        except json.JSONDecodeError:
            continue
        if o.get("status") != "PASS":
            continue
        dim = o.get("dim")
        key = o.get("key")
        if dim not in out or not key or key in reject:
            continue
        note = o.get("note") or ""
        if "soft PASS" in note or ("soft" in note and "N/A" in note):
            continue
        out[dim][key] = {
            "evidence": o.get("evidence"),
            "note": note or f"{note_prefix} cell fill",
        }
    return out


def load_phase2_passes() -> dict[str, dict[str, dict]]:
    return load_cell_passes(PHASE2_CELL_LOG, PHASE2_REJECT_KEYS, "phase2")


def load_phase3_passes() -> dict[str, dict[str, dict]]:
    return load_cell_passes(PHASE3_CELL_LOG, PHASE3_REJECT_KEYS, "phase3")


def apply_cell_passes(
    rbac_cells, journey, data_cells, ui_cells, bag: dict, label: str
) -> None:
    for cell in rbac_cells:
        key = f"{cell['role']}|{cell['cap']}|{cell['face']}"
        if key in bag["RBAC"] and cell["status"] != "N/A":
            hit = bag["RBAC"][key]
            cell["status"] = "PASS"
            cell["evidence"] = hit["evidence"]
            cell["note"] = f"{label}: {hit['note']}"
    for cell in journey:
        if cell["id"] in bag["Journey"]:
            hit = bag["Journey"][cell["id"]]
            cell["status"] = "PASS"
            cell["evidence"] = hit["evidence"]
            cell["note"] = f"{label}: {hit['note']}"
    for cell in data_cells:
        key = f"{cell['surface']}|{cell['ring']}"
        if key in bag["Data"]:
            hit = bag["Data"][key]
            cell["status"] = "PASS"
            cell["evidence"] = hit["evidence"]
            cell["note"] = f"{label}: {hit['note']}"
    for cell in ui_cells:
        key = f"{cell['page']}|{cell['state']}"
        if key in bag["UI"]:
            hit = bag["UI"][key]
            cell["status"] = "PASS"
            cell["evidence"] = hit["evidence"]
            cell["note"] = f"{label}: {hit['note']}"


def apply_phase2(rbac_cells, journey, data_cells, ui_cells, p2: dict) -> None:
    apply_cell_passes(rbac_cells, journey, data_cells, ui_cells, p2, "phase2")


def apply_phase3(rbac_cells, journey, data_cells, ui_cells, p3: dict) -> None:
    apply_cell_passes(rbac_cells, journey, data_cells, ui_cells, p3, "phase3")


def ydump(obj, indent: int = 0) -> str:
    sp = "  " * indent
    if isinstance(obj, dict):
        lines = []
        for k, v in obj.items():
            if isinstance(v, (dict, list)):
                lines.append(f"{sp}{k}:")
                lines.append(ydump(v, indent + 1))
            elif v is None:
                lines.append(f"{sp}{k}: null")
            elif isinstance(v, bool):
                lines.append(f"{sp}{k}: {'true' if v else 'false'}")
            elif isinstance(v, (int, float)):
                lines.append(f"{sp}{k}: {v}")
            else:
                s = str(v).replace("\\", "\\\\").replace('"', '\\"')
                lines.append(f'{sp}{k}: "{s}"')
        return "\n".join(lines)
    if isinstance(obj, list):
        lines = []
        for item in obj:
            if isinstance(item, dict):
                lines.append(f"{sp}-")
                for k, v in item.items():
                    if isinstance(v, (dict, list)):
                        lines.append(f"{sp}  {k}:")
                        lines.append(ydump(v, indent + 2))
                    elif v is None:
                        lines.append(f"{sp}  {k}: null")
                    elif isinstance(v, bool):
                        lines.append(f"{sp}  {k}: {'true' if v else 'false'}")
                    elif isinstance(v, (int, float)):
                        lines.append(f"{sp}  {k}: {v}")
                    else:
                        s = str(v).replace("\\", "\\\\").replace('"', '\\"')
                        lines.append(f'{sp}  {k}: "{s}"')
            else:
                lines.append(f"{sp}- {item}")
        return "\n".join(lines)
    return f"{sp}{obj}"


def main() -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    roles = ["Tourist", "Guide", "Provider", "Steward", "Admin", "DAO_Gov"]
    caps = ["CAP_OWN", "CAP_CROSS_DENY", "CAP_ADMIN_DENY", "CAP_UI_BOUND"]
    faces = ["F_ALLOW_API", "F_DENY_API", "F_ALLOW_UI", "F_DENY_UI"]

    rbac_pass = {
        ("Admin", "CAP_OWN", "F_ALLOW_API"): (
            "PASS",
            f"{EV}/smoke-rbac-matrix.log",
            "Admin console capabilities / route-matrix / Finance finance-summary 200",
            "SuperAdmin+Finance allow paths",
        ),
        ("Admin", "CAP_OWN", "F_DENY_API"): (
            "PASS",
            f"{EV}/smoke-rbac-matrix.log",
            "Unauthorized admin action returns 403",
            "CS flag publish 403",
        ),
        ("Admin", "CAP_CROSS_DENY", "F_DENY_API"): (
            "PASS",
            f"{EV}/smoke-rbac-matrix.log",
            "Cross console-role finance denied for CS",
            "CS finance/summary 403",
        ),
        ("Provider", "CAP_OWN", "F_ALLOW_API"): (
            "PASS",
            f"{EV}/smoke-provider-onboarding.log",
            "Provider onboarding+listing API succeeds",
            "register→approve→POST listings→publish",
        ),
        ("Guide", "CAP_OWN", "F_ALLOW_API"): (
            "PASS",
            f"{EV}/smoke-guide-workbench.log",
            "Guide profile/workbench/order-corridor API succeeds",
            "guide-profile + order corridor probes",
        ),
        ("Steward", "CAP_OWN", "F_ALLOW_API"): (
            "PASS",
            f"{EV}/smoke-steward-onboarding.log",
            "Steward application API chain succeeds (non-chain execute)",
            "applications→approve→role=region_steward",
        ),
        ("Tourist", "CAP_OWN", "F_ALLOW_API"): (
            "PASS",
            f"{EV}/smoke-orders-list.log",
            "Tourist-facing orders list API 200",
            "GET /orders + filters; FE /orders SKIPPED not counted here",
        ),
    }
    na_caps_allow = {
        ("CAP_CROSS_DENY", "F_ALLOW_API"),
        ("CAP_CROSS_DENY", "F_ALLOW_UI"),
        ("CAP_ADMIN_DENY", "F_ALLOW_API"),
        ("CAP_ADMIN_DENY", "F_ALLOW_UI"),
    }
    na_ui_bound_api = {
        ("CAP_UI_BOUND", "F_ALLOW_API"),
        ("CAP_UI_BOUND", "F_DENY_API"),
    }

    rbac_cells = []
    for r in roles:
        for c in caps:
            for f in faces:
                key = (r, c, f)
                if key in rbac_pass:
                    st, ev, exp, note = rbac_pass[key]
                elif (c, f) in na_caps_allow:
                    st, ev, exp, note = (
                        "N/A",
                        None,
                        "Allow face not applicable to deny capability",
                        "does_not_count_as_pass",
                    )
                elif (c, f) in na_ui_bound_api:
                    st, ev, exp, note = (
                        "N/A",
                        None,
                        "UI_BOUND scored on UI faces only",
                        "does_not_count_as_pass",
                    )
                else:
                    st, ev, exp, note = (
                        "NOT_RUN",
                        None,
                        f"{r} {c} {f} must be proven live",
                        "no citeable cell evidence in Non-Web3 pack",
                    )
                rbac_cells.append(
                    {
                        "role": r,
                        "cap": c,
                        "face": f,
                        "status": st,
                        "evidence": ev,
                        "expected": exp,
                        "note": note,
                    }
                )

    journey = [
        {
            "id": "J1",
            "name": "tourist_create_demand",
            "expected": "Tourist creates travel demand via API/UI with durable id",
            "status": "NOT_RUN",
            "evidence": None,
            "note": "Authenticity: no dedicated create-demand log in pack",
        },
        {
            "id": "J2",
            "name": "guide_accept_order",
            "expected": "Guide accepts/binds an order (state transition)",
            "status": "NOT_RUN",
            "evidence": f"{EV}/smoke-guide-workbench.log",
            "note": "Workbench+corridor probes OK; reception=0 — accept action not proven",
        },
        {
            "id": "J3",
            "name": "provider_publish",
            "expected": "Provider creates listing and publish path succeeds",
            "status": "PASS",
            "evidence": f"{EV}/smoke-provider-onboarding.log",
            "note": "POST market/provider/listings + publish OK",
        },
        {
            "id": "J4",
            "name": "order_lifecycle",
            "expected": "Order list→detail→state slice including FE /orders",
            "status": "NOT_RUN",
            "evidence": f"{EV}/smoke-orders-list.log",
            "note": "API list/filters OK; FE /orders SKIPPED — cell incomplete",
        },
        {
            "id": "J5",
            "name": "escrow_page_states",
            "expected": "Escrow page reachable with draft/pre-chain shell states",
            "status": "NOT_RUN",
            "evidence": f"{EV}/ui-p0-enterability.log",
            "note": "Authenticity NOT_FOUND: /escrow not in enterability probe",
        },
    ]

    surfaces = ["Market_Catalog", "Provider", "Guide", "Announcement", "Community"]
    rings = ["Create", "DB", "API", "UI"]
    data_pass = {
        ("Market_Catalog", "API"): (
            f"{EV}/smoke-catalog-consumer-fe.log",
            "catalog RO endpoints HTTP 200",
        ),
        ("Market_Catalog", "UI"): (
            f"{EV}/smoke-catalog-consumer-fe.log",
            "fe / and /market HTTP 200",
        ),
        ("Provider", "Create"): (
            f"{EV}/smoke-provider-onboarding.log",
            "application+listing create",
        ),
        ("Provider", "API"): (
            f"{EV}/smoke-provider-onboarding.log",
            "provider/listing/admin APIs OK",
        ),
        ("Guide", "API"): (
            f"{EV}/smoke-guide-workbench.log",
            "guide-profile/availability/corridor API OK",
        ),
    }
    data_cells = []
    for s in surfaces:
        for ring in rings:
            key = (s, ring)
            if key in data_pass:
                ev, exp = data_pass[key]
                st, note = "PASS", "cite Non-Web3 pack"
            else:
                ev, exp, st, note = (
                    None,
                    f"{s} {ring} proven Create→DB→API→UI",
                    "NOT_RUN",
                    "no cell evidence",
                )
            data_cells.append(
                {
                    "surface": s,
                    "ring": ring,
                    "status": st,
                    "evidence": ev,
                    "expected": exp,
                    "note": note,
                }
            )

    pages = [
        ("home", "/"),
        ("market", "/market"),
        ("orders", "/orders"),
        ("escrow", "/escrow/[id]"),
        ("profile", "/auth/login|/me"),
        ("governance", "/governance/proposals"),
    ]
    states = ["loading", "error", "empty", "success"]
    ui_success_pages = {"home", "market", "orders", "profile", "governance"}
    ui_cells = []
    for pid, path in pages:
        for stt in states:
            if stt == "success" and pid in ui_success_pages:
                ui_cells.append(
                    {
                        "page": pid,
                        "path": path,
                        "state": stt,
                        "status": "PASS",
                        "evidence": f"{EV}/ui-p0-enterability.log",
                        "expected": f"{path} HTTP 200 success enterability",
                        "note": "enterability only; not deep interaction",
                    }
                )
            else:
                ui_cells.append(
                    {
                        "page": pid,
                        "path": path,
                        "state": stt,
                        "status": "NOT_RUN",
                        "evidence": f"{EV}/ui-p0-enterability.log" if pid == "escrow" else None,
                        "expected": f"{pid} renders {stt} state under probe",
                        "note": "state probe NOT_FOUND or escrow not entered",
                    }
                )

    p2 = load_phase2_passes()
    apply_phase2(rbac_cells, journey, data_cells, ui_cells, p2)
    p3 = load_phase3_passes()
    apply_phase3(rbac_cells, journey, data_cells, ui_cells, p3)

    rbac_c = Counter(c["status"] for c in rbac_cells)
    j_c = Counter(c["status"] for c in journey)
    d_c = Counter(c["status"] for c in data_cells)
    u_c = Counter(c["status"] for c in ui_cells)

    def decide(name: str, pass_n: int, denom: int) -> str:
        if name == "RBAC":
            return "PASS" if pass_n == denom else "NEED_FIX"
        if name == "User_Journey":
            return "PASS" if pass_n >= denom else "NEED_FIX"
        return "PASS" if pass_n / denom >= 0.9 else "NEED_FIX"

    metrics = {
        "RBAC": {
            "denom": 96,
            "pass": rbac_c["PASS"],
            "fail": rbac_c.get("FAIL", 0),
            "not_run": rbac_c["NOT_RUN"],
            "na": rbac_c["N/A"],
            "pct": pct(rbac_c["PASS"], 96),
            "threshold_rule": "pass/96 == 100",
            "threshold_decision": decide("RBAC", rbac_c["PASS"], 96),
        },
        "User_Journey": {
            "denom": 5,
            "pass": j_c["PASS"],
            "fail": j_c.get("FAIL", 0),
            "not_run": j_c["NOT_RUN"],
            "na": 0,
            "pct": pct(j_c["PASS"], 5),
            "threshold_rule": "pass/5 == 100 (integer >=90)",
            "threshold_decision": decide("User_Journey", j_c["PASS"], 5),
        },
        "Data_Lifecycle": {
            "denom": 20,
            "pass": d_c["PASS"],
            "fail": d_c.get("FAIL", 0),
            "not_run": d_c["NOT_RUN"],
            "na": 0,
            "pct": pct(d_c["PASS"], 20),
            "threshold_rule": "pass/20 >= 90",
            "threshold_decision": decide("Data_Lifecycle", d_c["PASS"], 20),
        },
        "UI_UX_P0": {
            "denom": 24,
            "pass": u_c["PASS"],
            "fail": u_c.get("FAIL", 0),
            "not_run": u_c["NOT_RUN"],
            "na": 0,
            "pct": pct(u_c["PASS"], 24),
            "threshold_rule": "pass/24 >= 90",
            "threshold_decision": decide("UI_UX_P0", u_c["PASS"], 24),
        },
    }

    out = {
        "schema": "traveltrust.psg_coverage_measurement_final.v1",
        "machine_key": "TT_PSG_COVERAGE_MEASUREMENT_FINAL",
        "status": "METRIC_FINAL",
        "phase": "phase3_residual_cell_fill",
        "recorded_utc": stamp,
        "mode": "phase1_baseline_plus_phase2_plus_phase3_cell_fill",
        "phase2_cell_log": PHASE2_CELL_LOG,
        "phase3_cell_log": PHASE3_CELL_LOG,
        "release_gate_stamp": {
            "psg": "CONDITIONAL_GO",
            "fix_required": 8,
            "coverage_evidence": "VERIFIED",
            "coverage_metrics": "FINAL",
            "consistency_control": "NOT_ALIGNED",
            "pass_tier": "LOCAL_PASS",
        },
        "consistency_control": {
            "machine_key": "TT_PSG_COVERAGE_CONSISTENCY_CONTROL",
            "human_ssot": "docs/runbook/TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md",
            "registry": "registry/psg-coverage-consistency-control.v1.yaml",
            "gate": "scripts/gates/check-psg-coverage-consistency-control.sh",
            "verdict": "NOT_ALIGNED",
            "rule": "only_ALIGNED_PASS_counts_for_threshold_acceptance",
            "local_pass_does_not_count": True,
        },
        "discipline": {
            "no_scope_expansion": True,
            "no_product_code_change": False,
            "register_linked_minfix_only": True,
            "register_linked_minfix": "PFA-UI-ADMIN-01 / RBAC|Tourist|CAP_ADMIN_DENY|F_DENY_API seed role repair",
            "fix_required_delta": 0,
            "no_web3_minfix": True,
            "no_gate_mutation": True,
            "formula": "pass_cells / denom_cells",
            "na_does_not_count_as_pass": True,
            "local_pass_does_not_count_as_aligned": True,
            "phase2_rejected_keys": sorted(PHASE2_REJECT_KEYS),
            "phase3_rejected_keys": sorted(PHASE3_REJECT_KEYS),
        },
        "metrics": metrics,
        "rollup_threshold_decision": (
            "PASS"
            if all(m["threshold_decision"] == "PASS" for m in metrics.values())
            else "NEED_FIX"
        ),
        "cells": {
            "RBAC": rbac_cells,
            "User_Journey": journey,
            "Data_Lifecycle": data_cells,
            "UI_UX_P0": ui_cells,
        },
    }

    compact = {k: v for k, v in out.items() if k != "cells"}
    compact["cells_artifact"] = f"{EV}/MEASUREMENT-FINAL-CELLS.json"
    compact["human_ssot"] = "docs/runbook/TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md"
    compact["framework_ssot"] = "docs/runbook/TT-PSG-COVERAGE-MEASUREMENT-RECALCULATE-LATEST.md"
    compact["pass_cell_index"] = {
        "RBAC": [f"{c['role']}|{c['cap']}|{c['face']}" for c in rbac_cells if c["status"] == "PASS"],
        "User_Journey": [c["id"] for c in journey if c["status"] == "PASS"],
        "Data_Lifecycle": [
            f"{c['surface']}|{c['ring']}" for c in data_cells if c["status"] == "PASS"
        ],
        "UI_UX_P0": [f"{c['page']}|{c['state']}" for c in ui_cells if c["status"] == "PASS"],
    }

    reg_path = ROOT / "registry" / "psg-coverage-measurement-final.v1.yaml"
    header = (
        "# schema: traveltrust.psg_coverage_measurement_final.v1\n"
        "# Metric FINAL from existing Non-Web3 evidence cells only. Gate untouched.\n"
    )
    reg_path.write_text(header + ydump(compact) + "\n", encoding="utf-8")

    cells_path = ROOT / EV / "MEASUREMENT-FINAL-CELLS.json"
    cells_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps({"metrics": metrics, "pass_cell_index": compact["pass_cell_index"]}, indent=2))
    print(f"wrote {reg_path}")
    print(f"wrote {cells_path}")


if __name__ == "__main__":
    main()
