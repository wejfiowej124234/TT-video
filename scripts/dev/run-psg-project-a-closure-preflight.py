#!/usr/bin/env python3
"""Project A closure preflight — risk reduction only (no finalize / no S7 / no PASS claim).

Does:
  1) L5 Final chain dry-run (paths · commands · schemas · output dirs)
  2) FG-01..15 Capture template completeness (+ blocking_classification)
  3) S7 input health check (Candidate packs vs recalculate reader paths)
  4) Residual → S7 expected decision matrix (preflight, no rule change)
  5) L1–L4 S7 final-input pointer packs
  6) Runtime freshness tick (read-only)
  7) Optional Evidence Integrity invoke note

Forbidden: Settlement execute · Recalculate · baseline mint · Project B · scope expand

  python scripts/dev/run-psg-project-a-closure-preflight.py
"""
from __future__ import annotations

import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
BASELINE = "v311_fund_safety_candidate_v2"
ETA = "2026-07-21T18:10:48Z"
ELAPSED = "2026-07-21T18:06:48Z"
SEPOLIA = 11155111

CONSOL = ROOT / "evidence/PSG-EVIDENCE-CONSOLIDATION"
FG_ROOT = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2/fg-cases"
CAND = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2"
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
L1 = ROOT / "evidence/PSG-L1-product"
L2 = ROOT / "evidence/PSG-L2-data"
L3 = ROOT / "evidence/PSG-L3-security"
L4 = ROOT / "evidence/PSG-L4-operations"

# What S7 recalculate.py currently load_json() from PENDING
S7_PENDING_REQUIRED = [
    "L1-PRODUCT-VALIDATION-LATEST.json",
    "L2-DATA-VALIDATION-HARDENED-LATEST.json",
    "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
    "L4-OPERATIONS-VALIDATION-LATEST.json",
    "L5-FG-WEB3-EMPIRICAL-LATEST.json",
]

BLOCKING_BY_FG = {
    "FG-01": "BLOCK_UNTIL_SETTLEMENT_FINALIZE",
    "FG-02": "TRACKED_AFTER_L5_FINAL",
    "FG-03": "BLOCK_UNTIL_SETTLEMENT_FINALIZE",
    "FG-04": "BLOCK_UNTIL_SETTLEMENT_FINALIZE",
    "FG-05": "BLOCK_UNTIL_SETTLEMENT_FINALIZE",
    "FG-06": "TRACKED_RESIDUAL_S7_MAY_ACCEPT",
    "FG-07": "TRACKED_RESIDUAL_S7_MAY_ACCEPT",
    "FG-08": "TRACKED_RESIDUAL_S7_MAY_ACCEPT",
    "FG-09": "BLOCK_UNTIL_SETTLEMENT_FINALIZE",
    "FG-10": "OWNER_SIGNOFF_PREP",
    "FG-11": "ACCEPTED_RESIDUAL_RBAC_DEFER",
    "FG-12": "TRACKED_AFTER_L5_FINAL",
    "FG-13": "TRACKED_AFTER_L5_FINAL",
    "FG-14": "BLOCK_UNTIL_FG15_ELAPSED",
    "FG-15": "BLOCK_UNTIL_FG15_ELAPSED",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def exists(rel: str) -> bool:
    return (ROOT / rel).is_file() or (ROOT / rel).is_dir()


def load_rpc() -> str | None:
    for k in ("CHAIN_RPC_URL", "SEPOLIA_RPC_URL", "ETH_RPC_URL"):
        if os.environ.get(k):
            return os.environ[k]
    envf = ROOT / "scripts/dev/.env.phase2-chain-deploy.local"
    if not envf.exists():
        return None
    for line in envf.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.split("#", 1)[0].strip()
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        if k.strip() in ("CHAIN_RPC_URL", "SEPOLIA_RPC_URL", "ETH_RPC_URL"):
            return v.strip().strip('"').strip("'")
    return None


def cast(*args: str, rpc: str | None = None) -> str | None:
    cmd = ["cast", *args]
    if rpc:
        cmd += ["--rpc-url", rpc]
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT, timeout=60).strip()
    except Exception:
        return None


def dry_run_l5_chain(recorded: str) -> dict[str, Any]:
    steps = [
        {
            "id": "S1_settlement_finalize",
            "command": (
                "TRAVELTRUST_WEB3_CANDIDATE_V2_SEPOLIA_DEPLOY_OK=1 "
                "bash scripts/dev/run-web3-candidate-v2-settlement-finalize.sh"
            ),
            "script_exists": exists(
                "scripts/dev/run-web3-candidate-v2-settlement-finalize.sh"
            ),
            "input": [
                "evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json",
                "scripts/dev/.env.phase2-chain-deploy.local",
            ],
            "output_dir": "evidence/GO_fg15_observation_48h_candidate_v2/money-path/finalize-*/",
            "refuse_until": ETA,
            "execute_now": False,
        },
        {
            "id": "S2_fg_capture",
            "command": "Fill fg-cases/FG-NN/FINAL-CAPTURE-TEMPLATE-LATEST.json; python scripts/dev/gen-fg15b-case-index.py",
            "script_exists": exists("scripts/dev/gen-fg15b-case-index.py"),
            "input": [
                "evidence/PSG-EVIDENCE-CONSOLIDATION/FG-01-15-FINAL-VERIFICATION-MAP-LATEST.json",
                "evidence/GO_fg15_observation_48h_candidate_v2/fg-cases/",
            ],
            "output_dir": "evidence/GO_fg15_observation_48h_candidate_v2/fg-cases/",
            "execute_now": False,
        },
        {
            "id": "S3_l5_final_evidence",
            "command": "Assemble L5 Final from finalize receipts + filled captures (post-S1)",
            "expected_output": "evidence/GO_fg15_observation_48h_candidate_v2/L5-FINAL-EVIDENCE-LATEST.json",
            "output_parent_exists": exists("evidence/GO_fg15_observation_48h_candidate_v2"),
            "note": "File created only after finalize — dry-run checks parent only",
            "execute_now": False,
        },
        {
            "id": "S4_s7_recalculate",
            "command": "bash scripts/dev/run-psg-completion-matrix-recalculate.sh",
            "script_exists": exists("scripts/dev/run-psg-completion-matrix-recalculate.sh"),
            "refuse_until": f"{ELAPSED} + L5 Final present",
            "execute_now": False,
        },
    ]
    issues = []
    for s in steps:
        for inp in s.get("input") or []:
            if "*" in inp:
                parent = inp.split("*")[0].rstrip("/")
                if not exists(parent):
                    issues.append(f"{s['id']}: missing input parent {parent}")
            elif not exists(inp):
                issues.append(f"{s['id']}: missing input {inp}")
        if "script_exists" in s and not s["script_exists"]:
            issues.append(f"{s['id']}: script missing")
        if s.get("output_parent_exists") is False:
            issues.append(f"{s['id']}: output parent missing")

    # schema spot-check
    for rel in [
        "evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json",
        "evidence/PSG-EVIDENCE-CONSOLIDATION/FG-01-15-FINAL-VERIFICATION-MAP-LATEST.json",
        "evidence/GO_fg15_observation_48h_candidate_v2/l5-preflight/L5-PREFLIGHT-STATUS-LATEST.json",
    ]:
        p = ROOT / rel
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
            if "schema" not in j and rel.endswith(".json"):
                issues.append(f"schema key missing: {rel}")
        except Exception as e:
            issues.append(f"json parse fail {rel}: {e}")

    verdict = "DRY_PASS" if not issues else "DRY_FAIL"
    doc = {
        "schema": "traveltrust.psg_l5_final_chain_dry_run.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "mode": "READ_ONLY_DRY_RUN",
        "executed_finalize": False,
        "executed_s7": False,
        "equals_l5_pass": False,
        "equals_psg_complete": False,
        "verdict": verdict,
        "issues": issues,
        "steps": steps,
        "settlement_eta_utc": ETA,
        "fg15b_elapsed_utc": ELAPSED,
        "note": "Path/command/schema readiness only — does not execute Settlement",
    }
    write_json(CONSOL / "L5-FINAL-CHAIN-DRY-RUN-LATEST.json", doc)
    write_json(CAND / "l5-preflight/L5-FINAL-CHAIN-DRY-RUN-LATEST.json", doc)
    return doc


def audit_fg_templates(recorded: str) -> dict[str, Any]:
    required = [
        "dependency",
        "final_verification_command",
        "expected_output",
        "owner",
        "evidence_path",
        "capture",
    ]
    rows = []
    fail = 0
    for n in range(1, 16):
        fid = f"FG-{n:02d}"
        path = FG_ROOT / fid / "FINAL-CAPTURE-TEMPLATE-LATEST.json"
        if not path.exists():
            rows.append({"id": fid, "ok": False, "missing": ["FILE"], "blocking_classification": None})
            fail += 1
            continue
        j = json.loads(path.read_text(encoding="utf-8"))
        missing = [k for k in required if not j.get(k)]
        # enrich blocking_classification if absent
        bc = j.get("blocking_classification") or BLOCKING_BY_FG.get(fid)
        if j.get("blocking_classification") != bc:
            j["blocking_classification"] = bc
            j["recorded_utc"] = recorded
            write_json(path, j)
        # ensure capture keys non-empty structure
        cap = j.get("capture") or {}
        if not isinstance(cap, dict) or len(cap) == 0:
            missing.append("capture_fields")
        ok = not missing
        if not ok:
            fail += 1
        rows.append(
            {
                "id": fid,
                "ok": ok,
                "missing": missing,
                "current_status": j.get("current_status"),
                "dependency": j.get("dependency"),
                "blocking_classification": bc,
                "owner": j.get("owner"),
                "path": path.relative_to(ROOT).as_posix(),
            }
        )
    doc = {
        "schema": "traveltrust.psg_fg_capture_template_audit.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "verdict": "PASS" if fail == 0 else "FAIL",
        "fail_count": fail,
        "empirical_pass_still": "0/15",
        "equals_l5_pass": False,
        "cases": rows,
        "note": "Template completeness only — not FGCASE PASS",
    }
    write_json(CONSOL / "FG-CAPTURE-TEMPLATE-AUDIT-LATEST.json", doc)
    write_json(FG_ROOT / "CAPTURE-TEMPLATE-AUDIT-LATEST.json", doc)
    return doc


def s7_input_health(recorded: str) -> dict[str, Any]:
    candidate_sources = {
        "L1": [
            "evidence/PSG-L1-product/STATUS-LATEST.json",
            "evidence/PSG-L1-product/L1-CANDIDATE-V2-FINAL-MATRIX-LATEST.json",
            "evidence/PSG-L1-product/journey/INDEX-LATEST.json",
        ],
        "L2": [
            "evidence/PSG-L2-data/STATUS-LATEST.json",
            "evidence/PSG-L2-data/PSG-L2-DATA-CERTIFICATION-BUNDLE-LATEST.json",
            "evidence/PSG-L2-data/DB_ALIGNMENT_CERT-LATEST.json",
        ],
        "L3": [
            "evidence/PSG-L3-security/STATUS-LATEST.json",
            "evidence/PSG-L3-security/RBAC-COVERAGE-DECISION-RECORD-LATEST.json",
            "evidence/PSG-L3-security/RESIDUALS-LATEST.json",
        ],
        "L4": [
            "evidence/PSG-L4-operations/STATUS-LATEST.json",
            "evidence/PSG-L4-operations/MONITORING-EVIDENCE-LATEST.json",
            "evidence/PSG-L4-operations/OPERATIONS-OWNER-INPUT-TEMPLATE-LATEST.json",
        ],
        "L5": [
            "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json",
            "evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-LIVE-MONEY-PATH-L5-RUNTIME-LATEST.json",
            "evidence/PSG-EVIDENCE-CONSOLIDATION/FG-01-15-FINAL-VERIFICATION-MAP-LATEST.json",
        ],
    }
    cand_ok = {}
    missing_cand = []
    for layer, paths in candidate_sources.items():
        present = []
        for p in paths:
            ok = exists(p)
            present.append({"path": p, "exists": ok})
            if not ok:
                missing_cand.append(p)
        cand_ok[layer] = present

    pending_status = []
    missing_pending = []
    for name in S7_PENDING_REQUIRED:
        p = PENDING / name
        ok = p.is_file()
        pending_status.append({"name": name, "exists": ok, "path": p.relative_to(ROOT).as_posix()})
        if not ok:
            missing_pending.append(name)

    # Critical mapping gap
    mapping_gap = {
        "severity": "HIGH",
        "id": "S7-READER-PATH-GAP",
        "summary": (
            "run-psg-completion-matrix-recalculate.py pillar_* reads "
            "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/* "
            "while Candidate v2 living evidence is under evidence/PSG-L{1-4}-* "
            "and evidence/GO_fg15_observation_48h_candidate_v2/. "
            "PENDING filenames may already exist from LEGACY FCG — do NOT treat them "
            "as Candidate v2 S7 inputs. Before S7 after ETA: bridge/overwrite with "
            "Candidate final inputs OR Owner-authorized update of recalculate reader."
        ),
        "candidate_packs_ready": len(missing_cand) == 0,
        "pending_required_missing": missing_pending,
        "pending_files_exist_but_may_be_legacy_fcg": len(missing_pending) == 0,
        "blocks_blind_s7": True,
        "risk": "Blind S7 would score LEGACY pending artifacts, not Candidate v2 packs",
    }

    # Write L1-L4 final input pointer packs (not PASS claims)
    for layer, root, paths in [
        ("L1", L1, candidate_sources["L1"]),
        ("L2", L2, candidate_sources["L2"]),
        ("L3", L3, candidate_sources["L3"]),
        ("L4", L4, candidate_sources["L4"]),
    ]:
        pack = {
            "schema": f"traveltrust.psg_{layer.lower()}_s7_final_input.v1",
            "recorded_utc": recorded,
            "psg_release_version": PIN,
            "deploy_baseline": BASELINE,
            "layer": layer,
            "status": "POINTER_PACK_READY",
            "equals_layer_pass": False,
            "equals_psg_complete": False,
            "sources": paths,
            "s7_pending_target_names": {
                "L1": "L1-PRODUCT-VALIDATION-LATEST.json",
                "L2": "L2-DATA-VALIDATION-HARDENED-LATEST.json",
                "L3": "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
                "L4": "L4-OPERATIONS-VALIDATION-LATEST.json",
            }.get(layer),
            "bridge_required_before_s7": True,
            "note": "Pointer pack for S7 — not layer PASS; bridge into PENDING names before Recalculate",
        }
        write_json(root / f"{layer}-S7-FINAL-INPUT-LATEST.json", pack)

    # L5 pointer
    write_json(
        CAND / "L5-S7-FINAL-INPUT-LATEST.json",
        {
            "schema": "traveltrust.psg_l5_s7_final_input.v1",
            "recorded_utc": recorded,
            "status": "POINTER_PACK_READY_WAIT_FINALIZE",
            "equals_l5_pass": False,
            "sources": candidate_sources["L5"],
            "s7_pending_target_names": [
                "L5-FG-WEB3-EMPIRICAL-LATEST.json",
                "OBSERVATION-48H-ELAPSED-PASS-LATEST.json",
            ],
            "bridge_required_before_s7": True,
            "after_eta_also_need": [
                "money-path/finalize-*/",
                "filled FG capture templates",
                "L5-FINAL-EVIDENCE-LATEST.json (to create)",
            ],
        },
    )

    health_verdict = "READY_WITH_BRIDGE_GAP" if not missing_cand else "CANDIDATE_PACKS_INCOMPLETE"
    if missing_cand:
        health_verdict = "FAIL_MISSING_CANDIDATE"
    doc = {
        "schema": "traveltrust.psg_s7_input_health.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "executed_s7": False,
        "equals_psg_complete": False,
        "verdict": health_verdict,
        "candidate_sources": cand_ok,
        "missing_candidate": missing_cand,
        "s7_pending_reader_expects": pending_status,
        "mapping_gap": mapping_gap,
        "final_input_packs": [
            "evidence/PSG-L1-product/L1-S7-FINAL-INPUT-LATEST.json",
            "evidence/PSG-L2-data/L2-S7-FINAL-INPUT-LATEST.json",
            "evidence/PSG-L3-security/L3-S7-FINAL-INPUT-LATEST.json",
            "evidence/PSG-L4-operations/L4-S7-FINAL-INPUT-LATEST.json",
            "evidence/GO_fg15_observation_48h_candidate_v2/L5-S7-FINAL-INPUT-LATEST.json",
        ],
        "post_eta_action_required": [
            "Settlement finalize",
            "FG Capture fill",
            "L5 Final Evidence write",
            "Bridge Candidate→PENDING filenames OR Owner-authorized S7 reader update",
            "Then run-psg-completion-matrix-recalculate.sh",
        ],
        "note": "Health check only — does not run S7; does not invent PASS",
    }
    write_json(CONSOL / "S7-INPUT-HEALTH-LATEST.json", doc)
    return doc


def residual_decision_matrix(recorded: str) -> dict[str, Any]:
    res_path = CONSOL / "RESIDUAL-FINAL-CLASSIFICATION-LATEST.json"
    res = json.loads(res_path.read_text(encoding="utf-8")) if res_path.exists() else {}
    buckets = res.get("buckets") or {}
    rows = []

    def add(rid: str, bucket: str, s7: str, note: str) -> None:
        rows.append(
            {
                "residual_id": rid,
                "bucket": bucket,
                "s7_expected_decision": s7,
                "note": note,
            }
        )

    for rid in buckets.get("BLOCKED_UNTIL_ETA_FINALIZE") or []:
        add(rid, "BLOCKED_UNTIL_ETA_FINALIZE", "BLOCK_IF_STILL_OPEN_AT_S7", "Must clear via finalize/ELAPSED first")
    for rid in buckets.get("TRACKED_RESIDUAL_S7") or []:
        add(rid, "TRACKED_RESIDUAL_S7", "VISIBLE_MAY_KEEP_LAYER_PARTIAL", "Honest residual at S7; not auto PASS")
    for rid in buckets.get("OWNER_SIGNOFF_PREP") or []:
        add(rid, "OWNER_SIGNOFF_PREP", "NEEDS_OWNER", "Owner fill / attestation")
    for rid in buckets.get("NON_BLOCKING_FOR_RECALCULATE_ENTRY") or []:
        add(rid, "NON_BLOCKING_FOR_RECALCULATE_ENTRY", "ACCEPTED_NON_BLOCKING", "Does not block Recalculate entry")
    for rid in buckets.get("CLOSED_DO_NOT_REOPEN") or []:
        add(rid, "CLOSED_DO_NOT_REOPEN", "CLOSED", "Do not reopen / reprocess")

    doc = {
        "schema": "traveltrust.psg_s7_expected_decision_matrix.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "mode": "PREFLIGHT_PREVIEW",
        "equals_psg_complete": False,
        "executed_s7": False,
        "rows": rows,
        "counts_by_decision": {},
        "note": "Preview only — does not change Residual Final Classification rules",
    }
    for r in rows:
        d = r["s7_expected_decision"]
        doc["counts_by_decision"][d] = doc["counts_by_decision"].get(d, 0) + 1
    write_json(CONSOL / "S7-EXPECTED-DECISION-MATRIX-LATEST.json", doc)
    return doc


def runtime_freshness(recorded: str) -> dict[str, Any]:
    rpc = load_rpc()
    addrs = {
        "escrow_factory_v2": "0x6e9a4c4032d2d0c91e643faa5dea45ba7f86bdef",
        "settlement_router": "0x5a6df184e9c6b1285f8beb50a438d82d5f094d6a",
        "fee_router": "0xf406e6f1277b990544d4f0556421c3c14df0ab28",
        "timelock": "0x462402082b395f218ffb3634ec0611e39bdd504c",
    }
    out: dict[str, Any] = {
        "schema": "traveltrust.psg_runtime_freshness_tick.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "equals_l5_pass": False,
        "rpc_configured": bool(rpc),
        "chain_id": None,
        "block_number": None,
        "contracts_have_code": {},
        "verdict": "SKIPPED",
    }
    if not rpc:
        write_json(CAND / "l5-preflight/RUNTIME-FRESHNESS-TICK-LATEST.json", out)
        return out
    cid = cast("chain-id", rpc=rpc)
    block = cast("block-number", rpc=rpc)

    def _as_int(v: str | None) -> int | None:
        if v is None:
            return None
        s = str(v).strip()
        try:
            return int(s, 10)
        except ValueError:
            return None

    out["chain_id"] = _as_int(cid)
    out["block_number"] = _as_int(block)
    if out["chain_id"] is None and rpc:
        out["chain_id"] = _as_int(cast("chain-id", rpc=rpc))
    ok = out["chain_id"] == SEPOLIA
    if out["chain_id"] is None:
        ok = False
        out["chain_id_probe"] = "FAILED"
    for role, addr in addrs.items():
        code = cast("code", addr, rpc=rpc)
        has = bool(code and code != "0x")
        out["contracts_have_code"][role] = {"address": addr, "has_code": has}
        ok = ok and has
    out["verdict"] = "FRESH_PASS" if ok else "FRESH_FAIL"
    # optional /meta if local api up
    try:
        import urllib.request

        with urllib.request.urlopen("http://127.0.0.1:8080/meta", timeout=2) as resp:
            meta = json.loads(resp.read().decode("utf-8"))
            out["meta_probe"] = {
                "reachable": True,
                "keys_sample": list(meta.keys())[:12] if isinstance(meta, dict) else type(meta).__name__,
            }
    except Exception:
        out["meta_probe"] = {"reachable": False, "note": "local /meta optional"}
    write_json(CAND / "l5-preflight/RUNTIME-FRESHNESS-TICK-LATEST.json", out)
    write_json(CONSOL / "RUNTIME-FRESHNESS-TICK-LATEST.json", out)
    return out


def next_pcr() -> str:
    pcr_dir = ROOT / "registry/psg-change-records"
    nums = []
    for p in pcr_dir.glob("PCR-20260720-*.yaml"):
        try:
            nums.append(int(p.stem.split("-")[-1]))
        except ValueError:
            pass
    return f"PCR-20260720-{(max(nums) + 1) if nums else 50:03d}"


def write_pcr(recorded: str, pcr_id: str, summary: dict) -> Path:
    path = ROOT / "registry/psg-change-records" / f"{pcr_id}.yaml"
    path.write_text(
        f"""schema: traveltrust.psg_change_record.v1
id: {pcr_id}
title: Project A closure preflight — L5 dry-run · FG templates · S7 health · residual matrix
recorded_utc: "{recorded}"
owner: Sebastian Ward
status: RECORDED

summary: >
  Project A risk-reduction preflight only. L5 Final chain dry-run; FG Capture
  template audit (+ blocking_classification); S7 input health (flags PENDING
  reader path gap); S7 expected decision matrix preview; L1–L4 S7 final-input
  pointer packs; runtime freshness tick. No Settlement finalize, no S7 execute,
  no baseline mint, no Project B, no Complete score flip.

active_ssot: {PIN}
deploy_baseline: {BASELINE}
mode: STEADY_STATE_WAIT_ETA
class: governance_gate_docs

artifacts:
  - evidence/PSG-EVIDENCE-CONSOLIDATION/L5-FINAL-CHAIN-DRY-RUN-LATEST.json
  - evidence/PSG-EVIDENCE-CONSOLIDATION/FG-CAPTURE-TEMPLATE-AUDIT-LATEST.json
  - evidence/PSG-EVIDENCE-CONSOLIDATION/S7-INPUT-HEALTH-LATEST.json
  - evidence/PSG-EVIDENCE-CONSOLIDATION/S7-EXPECTED-DECISION-MATRIX-LATEST.json

dry_run: {summary.get("dry_run")}
fg_templates: {summary.get("fg_templates")}
s7_health: {summary.get("s7_health")}
runtime_freshness: {summary.get("runtime")}

gates_not_triggered:
  - settlement_finalize
  - l5_final_pass_claim
  - psg_recalculate
  - formal_release_baseline
  - hard_gate_flip
  - production_go
  - project_b_start

post_eta_ladder:
  - settlement_finalize
  - fg_capture_fill
  - l5_final_evidence
  - bridge_s7_inputs_or_reader_update
  - psg_recalculate
  - formal_release_baseline
""",
        encoding="utf-8",
    )
    return path


def main() -> int:
    recorded = utc_now()
    dry = dry_run_l5_chain(recorded)
    fg = audit_fg_templates(recorded)
    s7 = s7_input_health(recorded)
    matrix = residual_decision_matrix(recorded)
    runtime = runtime_freshness(recorded)

    # Runbook consistency light check
    runbook_issues = []
    for rel in [
        "docs/runbook/TT-PSG-L5-FINAL-RUNBOOK-LATEST.md",
        "docs/runbook/TT-PSG-POST-ETA-COMMAND-SHEET-LATEST.md",
        "scripts/dev/run-web3-candidate-v2-settlement-finalize.sh",
        "scripts/dev/run-psg-completion-matrix-recalculate.sh",
        "scripts/dev/run-psg-evidence-consolidation-maintain-pipeline.sh",
    ]:
        if not exists(rel):
            runbook_issues.append(rel)
    runbook_doc = {
        "schema": "traveltrust.psg_runbook_consistency_check.v1",
        "recorded_utc": recorded,
        "verdict": "PASS" if not runbook_issues else "FAIL",
        "missing": runbook_issues,
        "equals_psg_complete": False,
    }
    write_json(CONSOL / "RUNBOOK-CONSISTENCY-CHECK-LATEST.json", runbook_doc)

    rollup = {
        "schema": "traveltrust.psg_project_a_closure_preflight_status.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "mode": "STEADY_STATE_WAIT_ETA",
        "project_b": "FROZEN",
        "equals_l5_pass": False,
        "equals_psg_complete": False,
        "executed_finalize": False,
        "executed_s7": False,
        "checks": {
            "l5_final_chain_dry_run": dry["verdict"],
            "fg_capture_template_audit": fg["verdict"],
            "s7_input_health": s7["verdict"],
            "s7_expected_decision_matrix": "PREVIEW_RECORDED",
            "runtime_freshness": runtime["verdict"],
            "runbook_consistency": runbook_doc["verdict"],
        },
        "critical_findings": [s7["mapping_gap"]],
        "next_human": [
            "Wait ETA",
            "Owner OK finalize",
            "After L5 Final: bridge S7 PENDING inputs OR authorize reader update",
            "W5 Sign-off for Formal Baseline",
        ],
        "next_machine_after_eta": [
            "settlement_finalize",
            "fg_capture_fill",
            "l5_final_evidence",
            "s7_recalculate",
        ],
    }
    write_json(CONSOL / "PROJECT-A-CLOSURE-PREFLIGHT-STATUS-LATEST.json", rollup)

    pcr_id = next_pcr()
    write_pcr(
        recorded,
        pcr_id,
        {
            "dry_run": dry["verdict"],
            "fg_templates": fg["verdict"],
            "s7_health": s7["verdict"],
            "runtime": runtime["verdict"],
        },
    )

    # touch consolidation STATUS without flipping mode to expand
    st_path = CONSOL / "STATUS-LATEST.json"
    if st_path.exists():
        st = json.loads(st_path.read_text(encoding="utf-8"))
        st.update(
            {
                "recorded_utc": recorded,
                "closure_preflight_pcr": f"registry/psg-change-records/{pcr_id}.yaml",
                "closure_preflight_status": "evidence/PSG-EVIDENCE-CONSOLIDATION/PROJECT-A-CLOSURE-PREFLIGHT-STATUS-LATEST.json",
                "s7_reader_path_gap": True,
                "psg_complete": False,
                "equals_l5_pass": False,
            }
        )
        write_json(st_path, st)

    print(
        json.dumps(
            {
                "pcr": pcr_id,
                "dry_run": dry["verdict"],
                "fg_templates": fg["verdict"],
                "s7_health": s7["verdict"],
                "runtime": runtime["verdict"],
                "runbook": runbook_doc["verdict"],
                "critical": "S7-READER-PATH-GAP",
                "equals_psg_complete": False,
                "executed_finalize": False,
            },
            indent=2,
        )
    )
    print("TT_PSG_PROJECT_A_CLOSURE_PREFLIGHT: OK")
    # exit 0 even with mapping gap — gap is documented finding, not script failure
    return 0 if dry["verdict"] == "DRY_PASS" and fg["verdict"] == "PASS" else 2


if __name__ == "__main__":
    raise SystemExit(main())
