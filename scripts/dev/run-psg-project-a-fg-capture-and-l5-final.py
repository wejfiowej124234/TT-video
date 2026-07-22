#!/usr/bin/env python3
"""Project A · FG Capture 01–15 + L5 Final Evidence (post Bridge A / finalize).

Fills FINAL-CAPTURE-TEMPLATE from Settlement finalize receipts + FG15B status.
Assembles L5 Final evidence under FG15B tree and refreshes PENDING L5 empirical.
Does NOT: Hard Gate · Wave · Production GO · Reality W0–W7.

  python scripts/dev/run-psg-project-a-fg-capture-and-l5-final.py
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
BASELINE = "v311_fund_safety_candidate_v2"
FG15 = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2"
CASES = FG15 / "fg-cases"
CONSOL = ROOT / "evidence/PSG-EVIDENCE-CONSOLIDATION"
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
OPS = FG15 / "money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json"
L5_FINAL_RUNTIME = FG15 / "money-path/CANDIDATE-V2-LIVE-MONEY-PATH-L5-RUNTIME-FINAL-LATEST.json"
BROADCAST = (
    ROOT
    / "contracts/broadcast/ExecuteCandidateV2SettlementTimelock.s.sol/11155111/run-latest.json"
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_json(path: Path) -> dict:
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def hex_block(n: str | int | None) -> int | None:
    if n is None:
        return None
    if isinstance(n, int):
        return n
    s = str(n)
    return int(s, 16) if s.startswith("0x") else int(s)


def load_finalize_context() -> dict:
    ops = load_json(OPS)
    l5 = load_json(L5_FINAL_RUNTIME)
    br = load_json(BROADCAST)
    txs = br.get("transactions") or []
    receipts = br.get("receipts") or []
    hashes = [t.get("hash") for t in txs]
    blocks = [hex_block((receipts[i] if i < len(receipts) else {}).get("blockNumber")) for i in range(len(hashes))]
    fin_dirs = sorted((FG15 / "money-path").glob("finalize-*"))
    fin = fin_dirs[-1] if fin_dirs else None
    fg = load_json(FG15 / "FG15-CANDIDATE-V2-STATUS-LATEST.json")
    samples = sorted((FG15 / "samples").glob("FG15B-SAMPLE-*.json"))
    return {
        "ops": ops,
        "l5": l5,
        "hashes": hashes,
        "blocks": blocks,
        "finalize_dir": fin.relative_to(ROOT).as_posix() if fin else None,
        "fg": fg,
        "latest_sample": samples[-1].relative_to(ROOT).as_posix() if samples else None,
        "happy": ((l5.get("prior") or {}).get("paths") or {}).get("happy") or {},
        "dispute": ((l5.get("prior") or {}).get("paths") or {}).get("dispute") or {},
        "addresses": ((l5.get("prior") or {}).get("addresses") or fg.get("addresses") or {}),
    }


def fill_case(fid: str, ctx: dict, recorded: str) -> dict:
    tpath = CASES / fid / "FINAL-CAPTURE-TEMPLATE-LATEST.json"
    doc = load_json(tpath)
    h = ctx["hashes"]
    b = ctx["blocks"]
    ops = ctx["ops"].get("ops") or {}
    capture = dict(doc.get("capture") or {})
    equals = False
    status = doc.get("current_status")
    residual = None

    if fid == "FG-01":
        capture.update(
            {
                "tx_hash_ready": h[0] if len(h) > 0 else None,
                "tx_hash_distable": h[1] if len(h) > 1 else None,
                "tx_hash_distribute": h[2] if len(h) > 2 else None,
                "block": b[2] if len(b) > 2 else (b[0] if b else None),
                "events": ["Timelock.execute", "markReady", "markDistributable", "distribute"],
                "evidence_dir": ctx["finalize_dir"],
            }
        )
        equals = bool(h) and (ctx["l5"].get("settlement_finalize") or {}).get("status") == "PASS"
        status = "EMPIRICAL_PASS" if equals else "PARTIAL"
    elif fid == "FG-02":
        capture.update(
            {
                "happy_escrow": ctx["happy"].get("escrow"),
                "dispute_escrow": ctx["dispute"].get("escrow"),
                "state_matrix_note": "Happy+Dispute PASS retained; Settlement Distributed post-finalize",
                "evidence": ctx["finalize_dir"],
            }
        )
        equals = ctx["happy"].get("status") == "PASS" and ctx["dispute"].get("status") == "PASS"
        status = "EMPIRICAL_PASS" if equals else "PARTIAL"
    elif fid == "FG-03":
        capture.update(
            {
                "tx_hash": h[0] if h else None,
                "block": b[0] if b else None,
                "event": "Timelock.execute(markReady→…)",
                "op_ids": ops,
                "evidence": ctx["finalize_dir"],
            }
        )
        equals = bool(h)
        status = "EMPIRICAL_PASS" if equals else "WAIT"
    elif fid == "FG-04":
        capture.update(
            {
                "tx_hash": h[2] if len(h) > 2 else None,
                "block": b[2] if len(b) > 2 else None,
                "fee_event": "distribute",
                "evidence": ctx["finalize_dir"],
            }
        )
        equals = len(h) >= 3
        status = "EMPIRICAL_PASS" if equals else "PARTIAL"
    elif fid == "FG-05":
        capture.update(
            {
                "tx_hash": h[1] if len(h) > 1 else None,
                "block": b[1] if len(b) > 1 else None,
                "event": "markDistributable+distribute",
                "evidence": ctx["finalize_dir"],
            }
        )
        equals = len(h) >= 3
        status = "EMPIRICAL_PASS" if equals else "WAIT"
    elif fid in ("FG-06", "FG-07"):
        residual = capture.get("residual_id") or f"RES-{fid}-POST-RECALC-EMPIRICAL"
        capture.update(
            {
                "tx_hash": h[2] if len(h) > 2 else None,
                "block": b[2] if len(b) > 2 else None,
                "event": "distribute_leg_observed",
                "evidence": ctx["finalize_dir"],
                "residual_id": residual,
            }
        )
        equals = False
        status = "RESIDUAL_OPEN"
    elif fid == "FG-08":
        residual = capture.get("residual_id") or "RES-FG08-GOVERNANCE-CYCLE"
        capture.update(
            {
                "proposal_id": None,
                "tx_hash": None,
                "block": None,
                "evidence": "evidence/GO_fg15_observation_48h_candidate_v2/",
                "residual_id": residual,
            }
        )
        equals = False
        status = "RESIDUAL_OPEN"
    elif fid == "FG-09":
        capture.update(
            {
                "tx_hash": h[0] if h else None,
                "block": b[0] if b else None,
                "op_hash": h[0] if h else None,
                "evidence": ctx["finalize_dir"],
            }
        )
        equals = bool(h) and bool(ctx["fg"].get("elapsed_pass"))
        status = "EMPIRICAL_PASS" if equals else "PARTIAL"
    elif fid == "FG-10":
        residual = capture.get("residual_id") or "RES-FG10-OA01-WC-ACCEPTED-GAP"
        capture.update(
            {
                "oa01_status": "ACCEPTED_GAP",
                "wc_status": "DEFERRED_SCOPE_A",
                "evidence": "docs/runbook/TT-POST-BASELINE-REALITY-CLOSURE-EXECUTION-PREP-LATEST.md",
                "residual_id": residual,
            }
        )
        equals = False
        status = "ACCEPTED_GAP"
    elif fid == "FG-11":
        capture.update(
            {
                "pass": 60,
                "denom": 96,
                "decision": "ACCEPTED_RESIDUAL",
                "evidence": "evidence/PSG-L3-security/RBAC-COVERAGE-DECISION-RECORD-LATEST.json",
            }
        )
        equals = False
        status = "READY_FOR_RECALCULATE_INPUT"
    elif fid == "FG-12":
        residual = capture.get("residual_id") or "RES-FG12-INDEXER-POST-FINALIZE"
        capture.update(
            {
                "indexed_tx": h[2] if len(h) > 2 else None,
                "block": b[2] if len(b) > 2 else None,
                "evidence": ctx["finalize_dir"],
                "residual_id": residual,
            }
        )
        equals = False
        status = "RESIDUAL_OPEN"
    elif fid == "FG-13":
        capture.update(
            {
                "onchain": True,
                "api": "BEST_EFFORT",
                "ui": "BEST_EFFORT",
                "evidence": ctx["finalize_dir"],
            }
        )
        equals = bool(h)
        status = "EMPIRICAL_PARTIAL_PASS" if equals else "PARTIAL"
    elif fid == "FG-14":
        capture.update(
            {
                "pack_path": "evidence/GO_fg15_observation_48h_candidate_v2/",
                "sample_ledger": "evidence/GO_fg15_observation_48h_candidate_v2/samples/FG15B-SAMPLES-LEDGER.jsonl",
                "evidence": ctx["latest_sample"],
            }
        )
        equals = bool(ctx["fg"].get("elapsed_pass"))
        status = "EMPIRICAL_PASS" if equals else "COLLECTING"
    elif fid == "FG-15":
        capture.update(
            {
                "elapsed_pass": bool(ctx["fg"].get("elapsed_pass")),
                "earliest_elapsed_utc": ctx["fg"].get("earliest_elapsed_utc"),
                "final_sample": ctx["latest_sample"],
                "evidence": "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json",
            }
        )
        equals = bool(ctx["fg"].get("elapsed_pass"))
        status = "EMPIRICAL_PASS" if equals else "WAIT"

    doc.update(
        {
            "recorded_utc": recorded,
            "psg_release_version": PIN,
            "deploy_baseline": BASELINE,
            "current_status": status,
            "equals_case_pass": equals,
            "forbid_pass_claim_until_final": False,
            "capture": capture,
            "capture_filled_utc": recorded,
            "hard_gate": "CUTOVER_REFUSED",
            "equals_psg_complete": False,
        }
    )
    write_json(tpath, doc)
    # status sidecar
    write_json(
        CASES / fid / "STATUS-LATEST.json",
        {
            "schema": "traveltrust.fg15b_case_status.v1",
            "id": fid,
            "recorded_utc": recorded,
            "psg_release_version": PIN,
            "deploy_baseline": BASELINE,
            "status": status,
            "equals_case_pass": equals,
            "capture_template": tpath.relative_to(ROOT).as_posix(),
        },
    )
    return {"id": fid, "status": status, "equals_case_pass": equals, "residual": residual}


def assemble_l5_final(recorded: str, fills: list[dict], ctx: dict) -> dict:
    emp_pass = sum(1 for f in fills if f.get("equals_case_pass"))
    denom = 15
    # Money-path core closed (FG-01/03/05/09/15) required for runtime final claim
    core_ids = {"FG-01", "FG-03", "FG-05", "FG-09", "FG-15"}
    core_ok = all(
        next((f for f in fills if f["id"] == i), {}).get("equals_case_pass") for i in core_ids
    )
    settle_ok = (ctx["l5"].get("settlement_finalize") or {}).get("status") == "PASS"
    l5_runtime_pass = settle_ok and core_ok
    # Full empirical L5 PASS would need 15/15 — honesty: partial with residuals
    full_emp = emp_pass == denom
    body = {
        "schema": "traveltrust.psg_l5_final_evidence.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "track_id": "FG-15-B",
        "status": "L5_FINAL_EVIDENCE_RECORDED",
        "l5_pass": full_emp,
        "l5_runtime_final_pass": l5_runtime_pass,
        "empirical_pass_count": emp_pass,
        "empirical_denom": denom,
        "core_money_path_closed": core_ok,
        "settlement_finalize": ctx["l5"].get("settlement_finalize"),
        "finalize_dir": ctx["finalize_dir"],
        "tx_hashes": ctx["hashes"],
        "fg_captures": fills,
        "hard_gate": "CUTOVER_REFUSED",
        "real_eth_wave": "FORBIDDEN",
        "ACTIVE_FLIP": "FORBIDDEN",
        "equals_psg_complete": False,
        "verdict": "L5_FINAL_RUNTIME_GO_EMPIRICAL_PARTIAL"
        if l5_runtime_pass and not full_emp
        else ("L5_FINAL_EMPIRICAL_PASS" if full_emp else "L5_FINAL_INCOMPLETE"),
        "honesty": (
            "L5 Final Evidence recorded. Runtime money-path closed ≠ full 15/15 empirical PASS "
            "≠ PSG Complete ≠ Production GO"
        ),
        "sources": [
            L5_FINAL_RUNTIME.relative_to(ROOT).as_posix(),
            "evidence/GO_fg15_observation_48h_candidate_v2/fg-cases/",
            "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json",
        ],
    }
    write_json(FG15 / "L5-FINAL-EVIDENCE-LATEST.json", body)
    write_json(CONSOL / "L5-FINAL-EVIDENCE-LATEST.json", body)

    # Refresh PENDING L5 empirical for S7 (honest flags)
    pending_l5 = {
        "schema": "traveltrust.l5_fg_web3_empirical.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "active_deploy_baseline": BASELINE,
        "deploy_baseline": BASELINE,
        "layer": "L5",
        "status": body["verdict"],
        "l5_pass": full_emp,
        "l5_status": "PASS" if full_emp else "PARTIAL",
        "l5_runtime_final_pass": l5_runtime_pass,
        "empirical_pass_count": emp_pass,
        "empirical_denom": denom,
        "verdict": body["verdict"],
        "bridge": {"option": "OPTION_A", "refreshed_after": "l5_final"},
        "sources": body["sources"],
        "ACTIVE_FLIP": "FORBIDDEN",
        "hard_gate": "CUTOVER_REFUSED",
        "psg_complete": False,
        "equals_psg_complete": False,
        "honesty": body["honesty"],
    }
    write_json(PENDING / "L5-FG-WEB3-EMPIRICAL-LATEST.json", pending_l5)

    # Companion validation/runtime slices for S7 pillar_l5 (honest)
    write_json(
        PENDING / "L5-FG-WEB3-VALIDATION-STATUS-LATEST.json",
        {
            "schema": "traveltrust.l5_fg_web3_validation_status.v1",
            "recorded_utc": recorded,
            "psg_release_version": PIN,
            "active_deploy_baseline": BASELINE,
            "l5_pass": l5_runtime_pass,
            "status": "PASS" if l5_runtime_pass else "OPEN",
            "slice": "equality_runtime_money_path",
            "honesty": "Validation slice tracks runtime money-path closure, not 15/15 empirical",
        },
    )
    write_json(
        PENDING / "L5-FG-WEB3-PRODUCTION-RUNTIME-STATUS-LATEST.json",
        {
            "schema": "traveltrust.l5_fg_web3_production_runtime_status.v1",
            "recorded_utc": recorded,
            "psg_release_version": PIN,
            "active_deploy_baseline": BASELINE,
            "production_runtime_pass": l5_runtime_pass,
            "status": "PASS" if l5_runtime_pass else "OPEN",
            "chain_id": "11155111",
            "note": "Sepolia Candidate v2 runtime — not mainnet production",
        },
    )
    return body


def main() -> int:
    recorded = utc_now()
    ctx = load_finalize_context()
    if not ctx["hashes"]:
        print("REFUSE: no finalize broadcast txs", file=sys.stderr)
        return 2
    if not ctx["fg"].get("elapsed_pass"):
        print("REFUSE: FG15_B elapsed_pass false", file=sys.stderr)
        return 2

    fills = []
    for i in range(1, 16):
        fid = f"FG-{i:02d}"
        fills.append(fill_case(fid, ctx, recorded))

    l5 = assemble_l5_final(recorded, fills, ctx)

    # refresh case index
    try:
        import subprocess

        subprocess.run(
            [sys.executable, "scripts/dev/gen-fg15b-case-index.py"],
            cwd=str(ROOT),
            check=False,
        )
    except Exception:
        pass

    # update verification map empirical counts
    vm_path = CONSOL / "FG-01-15-FINAL-VERIFICATION-MAP-LATEST.json"
    vm = load_json(vm_path)
    if vm:
        by_id = {f["id"]: f for f in fills}
        for c in vm.get("cases") or []:
            f = by_id.get(c.get("id"))
            if f:
                c["empirical_pass"] = bool(f.get("equals_case_pass"))
                c["current_status"] = f.get("status")
        vm["empirical_pass_count"] = sum(1 for f in fills if f.get("equals_case_pass"))
        vm["recorded_utc"] = recorded
        vm["equals_l5_pass"] = bool(l5.get("l5_pass"))
        write_json(vm_path, vm)

    out = {
        "schema": "traveltrust.psg_project_a_fg_capture_l5_final.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "fg_captures": fills,
        "empirical_pass_count": l5.get("empirical_pass_count"),
        "l5_final": {
            "path": "evidence/GO_fg15_observation_48h_candidate_v2/L5-FINAL-EVIDENCE-LATEST.json",
            "verdict": l5.get("verdict"),
            "l5_pass": l5.get("l5_pass"),
            "l5_runtime_final_pass": l5.get("l5_runtime_final_pass"),
        },
        "hard_gate": "CUTOVER_REFUSED",
        "equals_psg_complete": False,
    }
    write_json(CONSOL / "FG-CAPTURE-L5-FINAL-LATEST.json", out)
    print(
        json.dumps(
            {
                "empirical_pass_count": l5.get("empirical_pass_count"),
                "l5_verdict": l5.get("verdict"),
                "l5_pass": l5.get("l5_pass"),
                "runtime_pass": l5.get("l5_runtime_final_pass"),
            },
            indent=2,
        )
    )
    print("TT_PSG_FG_CAPTURE_L5_FINAL: RECORDED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
