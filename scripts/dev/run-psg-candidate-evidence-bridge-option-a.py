#!/usr/bin/env python3
"""Candidate Evidence Bridge OPTION_A (Owner-authorized post-ETA execute).

Designed step: candidate_evidence_bridge_execute (OPTION_A).
Controls (from S7-BRIDGE-IMPACT-ANALYSIS):
  snapshot_pending → materialize S7-shaped JSON (NOT pointer copy) → stamp pin/baseline
  → S7_INPUT_SOURCE_CHECK READY → S7_CANDIDATE_BASELINE_GATE READY → PCR

Does NOT: rewrite S7 Reader · Hard Gate · Wave · Production GO · invent new process.

  python scripts/dev/run-psg-candidate-evidence-bridge-option-a.py
"""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
BASELINE = "v311_fund_safety_candidate_v2"
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
CONSOL = ROOT / "evidence/PSG-EVIDENCE-CONSOLIDATION"
FG15 = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2"
IMPACT = CONSOL / "S7-BRIDGE-IMPACT-ANALYSIS-LATEST.json"
DEFERRED = CONSOL / "S7-READER-BRIDGE-DEFERRED-LATEST.json"

S7_PENDING = [
    "L1-PRODUCT-VALIDATION-LATEST.json",
    "L2-DATA-VALIDATION-HARDENED-LATEST.json",
    "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
    "L4-OPERATIONS-VALIDATION-LATEST.json",
    "L5-FG-WEB3-EMPIRICAL-LATEST.json",
]

POINTERS = {
    "L1": ROOT / "evidence/PSG-L1-product/L1-S7-FINAL-INPUT-LATEST.json",
    "L2": ROOT / "evidence/PSG-L2-data/L2-S7-FINAL-INPUT-LATEST.json",
    "L3": ROOT / "evidence/PSG-L3-security/L3-S7-FINAL-INPUT-LATEST.json",
    "L4": ROOT / "evidence/PSG-L4-operations/L4-S7-FINAL-INPUT-LATEST.json",
    "L5": FG15 / "L5-S7-FINAL-INPUT-LATEST.json",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_json(path: Path) -> dict:
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str | None:
    if not path.is_file():
        return None
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def stamp(doc: dict, recorded: str) -> dict:
    doc = dict(doc)
    doc["psg_release_version"] = PIN
    doc["active_deploy_baseline"] = BASELINE
    doc["deploy_baseline"] = BASELINE
    doc["recorded_utc"] = recorded
    doc["bridge"] = {
        "option": "OPTION_A",
        "mode": "MATERIALIZE_NOT_POINTER_COPY",
        "pin": PIN,
        "baseline": BASELINE,
    }
    doc["ACTIVE_FLIP"] = "FORBIDDEN"
    doc["hard_gate"] = "CUTOVER_REFUSED"
    doc["real_eth_wave"] = "FORBIDDEN"
    doc["psg_complete"] = False
    doc["equals_psg_complete"] = False
    return doc


def materialize_l1(recorded: str) -> dict:
    st = load_json(ROOT / "evidence/PSG-L1-product/STATUS-LATEST.json")
    ptr = load_json(POINTERS["L1"])
    ok = bool(st.get("equals_l1_pass"))
    return stamp(
        {
            "schema": "traveltrust.l1_product_validation.v1",
            "status": "PASS" if ok else "READY_FOR_RECALCULATE",
            "layer": "L1",
            "l1_pass": ok,
            "verdict": "L1_PRODUCT_PASS" if ok else "L1_CANDIDATE_BRIDGED_NOT_LAYER_PASS",
            "sources": ptr.get("sources") or [
                "evidence/PSG-L1-product/STATUS-LATEST.json",
            ],
            "candidate_status": st.get("status"),
            "honesty": "Bridge materializes Candidate evidence; equals_l1_pass gates l1_pass",
        },
        recorded,
    )


def materialize_l2(recorded: str) -> dict:
    st = load_json(ROOT / "evidence/PSG-L2-data/STATUS-LATEST.json")
    ptr = load_json(POINTERS["L2"])
    ok = bool(st.get("equals_l2_pass"))
    return stamp(
        {
            "schema": "traveltrust.l2_data_validation_hardened.v1",
            "status": "PASS" if ok else "READY_FOR_RECALCULATE",
            "layer": "L2",
            "l2_pass": ok,
            "l2_sepolia_live_lifecycle_pass": False,
            "verdict": "L2_DATA_PASS" if ok else "L2_CANDIDATE_BRIDGED_NOT_LAYER_PASS",
            "sources": ptr.get("sources") or [
                "evidence/PSG-L2-data/STATUS-LATEST.json",
            ],
            "open_residual_ids": st.get("open_residual_ids") or [],
            "candidate_status": st.get("status"),
            "honesty": "READY_FOR_RECALCULATE ≠ L2 PASS; Sepolia live deferred unless equals_l2_pass",
        },
        recorded,
    )


def materialize_l3(recorded: str) -> dict:
    st = load_json(ROOT / "evidence/PSG-L3-security/STATUS-LATEST.json")
    ptr = load_json(POINTERS["L3"])
    ok = bool(st.get("equals_l3_pass"))
    return stamp(
        {
            "schema": "traveltrust.l3_security_validation_hardened.v1",
            "status": "PASS" if ok else "READY_FOR_RECALCULATE",
            "layer": "L3",
            "l3_pass": ok,
            "verdict": "L3_SECURITY_PASS" if ok else "L3_CANDIDATE_BRIDGED_NOT_LAYER_PASS",
            "sources": ptr.get("sources") or [
                "evidence/PSG-L3-security/STATUS-LATEST.json",
            ],
            "open_residual_ids": st.get("open_residual_ids") or [],
            "candidate_status": st.get("status"),
            "honesty": "ACCEPTED residuals remain; equals_l3_pass gates l3_pass",
        },
        recorded,
    )


def materialize_l4(recorded: str) -> dict:
    st = load_json(ROOT / "evidence/PSG-L4-operations/STATUS-LATEST.json")
    ptr = load_json(POINTERS["L4"])
    ok = bool(st.get("equals_l4_pass"))
    return stamp(
        {
            "schema": "traveltrust.l4_operations_validation.v1",
            "status": "PASS" if ok else "READY_FOR_RECALCULATE",
            "layer": "L4",
            "l4_pass": ok,
            "verdict": "L4_OPERATIONS_PASS" if ok else "L4_CANDIDATE_BRIDGED_NOT_LAYER_PASS",
            "sources": ptr.get("sources") or [
                "evidence/PSG-L4-operations/STATUS-LATEST.json",
            ],
            "open_residual_ids": st.get("open_residual_ids") or [],
            "candidate_status": st.get("status"),
            "honesty": "Operational control evidence bridged; equals_l4_pass gates l4_pass",
        },
        recorded,
    )


def materialize_l5(recorded: str) -> dict:
    fg = load_json(FG15 / "FG15-CANDIDATE-V2-STATUS-LATEST.json")
    l5_final = load_json(
        FG15 / "money-path/CANDIDATE-V2-LIVE-MONEY-PATH-L5-RUNTIME-FINAL-LATEST.json"
    )
    finalize_dirs = sorted((FG15 / "money-path").glob("finalize-*"))
    elapsed = bool(fg.get("elapsed_pass"))
    settle_ok = (l5_final.get("settlement_finalize") or {}).get("status") == "PASS"
    # Empirical L5 full PASS requires FG captures + L5 Final assembly — Bridge does not fake it
    emp_pass = False
    return stamp(
        {
            "schema": "traveltrust.l5_fg_web3_empirical.v1",
            "status": "BRIDGED_PARTIAL" if settle_ok else "BRIDGED_WAIT",
            "layer": "L5",
            "l5_pass": emp_pass,
            "l5_status": "PARTIAL" if settle_ok else "OPEN",
            "verdict": "L5_EMPIRICAL_BRIDGED_AWAIT_FG_CAPTURE_AND_L5_FINAL",
            "fg15_track": "FG-15-B",
            "elapsed_pass": elapsed,
            "settlement_finalize_status": (l5_final.get("settlement_finalize") or {}).get(
                "status"
            ),
            "l5_runtime_final_verdict": l5_final.get("verdict"),
            "finalize_dir": finalize_dirs[-1].relative_to(ROOT).as_posix()
            if finalize_dirs
            else None,
            "sources": [
                "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json",
                "evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-LIVE-MONEY-PATH-L5-RUNTIME-FINAL-LATEST.json",
            ],
            "honesty": "Bridge ≠ L5 PASS; FG Capture 01–15 + L5 Final required before empirical PASS claim",
            "forbid": ["claim_l5_pass_from_bridge_alone", "hard_gate_flip", "production_go"],
        },
        recorded,
    )


def snapshot_pending(recorded: str) -> Path:
    stamp = recorded.replace(":", "").replace("-", "")
    side = (
        ROOT
        / "evidence/GO_phase2_fcg_full_capability_v2_sepolia"
        / f"pending-pre-bridge-option-a-{stamp}"
    )
    side.mkdir(parents=True, exist_ok=True)
    copied = []
    for name in S7_PENDING:
        src = PENDING / name
        if src.is_file():
            dst = side / name
            shutil.copy2(src, dst)
            copied.append(
                {
                    "file": name,
                    "sha256": sha256_file(dst),
                    "from": src.relative_to(ROOT).as_posix(),
                }
            )
    meta = {
        "schema": "traveltrust.psg_pending_pre_bridge_snapshot.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "option": "OPTION_A",
        "sidecar": side.relative_to(ROOT).as_posix(),
        "files": copied,
        "note": "OLD_FCG pending preserved before Candidate materialization overwrite",
    }
    write_json(side / "SNAPSHOT-META-LATEST.json", meta)
    write_json(CONSOL / "PENDING-PRE-BRIDGE-OPTION-A-SNAPSHOT-LATEST.json", meta)
    return side


def write_observation_elapsed(recorded: str) -> None:
    """Companion pending file referenced by L5 pointer pack."""
    fg = load_json(FG15 / "FG15-CANDIDATE-V2-STATUS-LATEST.json")
    doc = stamp(
        {
            "schema": "traveltrust.observation_48h_elapsed_pass.v1",
            "track": "FG-15-B",
            "elapsed_pass": bool(fg.get("elapsed_pass")),
            "status": "ELAPSED_PASS" if fg.get("elapsed_pass") else "NOT_ELAPSED",
            "earliest_elapsed_utc": fg.get("earliest_elapsed_utc"),
            "source": "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json",
            "verdict": "FG15_B_OBSERVATION_ELAPSED_PASS"
            if fg.get("elapsed_pass")
            else "FG15_B_NOT_ELAPSED",
        },
        recorded,
    )
    write_json(PENDING / "OBSERVATION-48H-ELAPSED-PASS-LATEST.json", doc)


def update_impact_and_deferred(recorded: str, sidecar: Path) -> None:
    impact = load_json(IMPACT)
    impact["executed_bridge"] = True
    impact["executed_bridge_utc"] = recorded
    impact["executed_option"] = "OPTION_A"
    impact["pending_sidecar"] = sidecar.relative_to(ROOT).as_posix()
    impact["mode"] = "EXECUTED_OPTION_A"
    impact["honesty"] = (
        "OPTION_A executed — S7 Reader untouched; PENDING living tree materialized from Candidate"
    )
    write_json(IMPACT, impact)

    deferred = load_json(DEFERRED)
    deferred["status"] = "BRIDGE_OPTION_A_EXECUTED"
    deferred["fix_now"] = False
    deferred["executed_bridge"] = True
    deferred["executed_bridge_utc"] = recorded
    deferred["prefer_option"] = "OPTION_A"
    write_json(DEFERRED, deferred)


def write_pcr(recorded: str, sidecar: Path) -> Path:
    pcr_id = f"PCR-{recorded[:10].replace('-', '')}-001"
    # avoid collide: scan existing
    day = recorded[:10].replace("-", "")
    existing = sorted((ROOT / "registry/psg-change-records").glob(f"PCR-{day}-*.yaml"))
    n = len(existing) + 1
    pcr_id = f"PCR-{day}-{n:03d}"
    path = ROOT / "registry/psg-change-records" / f"{pcr_id}.yaml"
    body = f"""schema: traveltrust.psg_change_record.v1
id: {pcr_id}
title: Candidate Evidence Bridge OPTION_A — materialize PENDING (post-ETA)
recorded_utc: "{recorded}"
owner: Sebastian Ward
status: RECORDED
class: governance_gate_docs
mode: PROJECT_A_BRIDGE_OPTION_A

summary: >
  Owner-authorized OPTION_A Bridge. Snapshot OLD_FCG PENDING to sidecar;
  materialize Candidate S7-shaped pillar JSON (not pointer-pack copy);
  stamp pin/baseline. S7 Reader untouched. Hard Gate / Wave / Production GO
  not triggered.

active_ssot: {PIN}
deploy_baseline: {BASELINE}

bridge:
  option: OPTION_A
  sidecar: {sidecar.relative_to(ROOT).as_posix()}
  pending: evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/

gates_not_triggered:
  - s7_reader_rewrite
  - hard_gate_flip
  - mainnet_wave
  - production_go
  - economic_model_unfreeze

executed:
  - candidate_evidence_bridge_execute
  - pending_overwrite_materialize
"""
    path.write_text(body, encoding="utf-8")
    return path


def run_gate(cmd: list[str]) -> dict[str, Any]:
    r = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
    return {
        "cmd": cmd,
        "returncode": r.returncode,
        "stdout": (r.stdout or "")[-2000:],
        "stderr": (r.stderr or "")[-1000:],
    }


def main() -> int:
    recorded = utc_now()
    impact = load_json(IMPACT)
    prefer = (impact.get("recommendation") or {}).get("prefer")
    if prefer != "OPTION_A":
        print("REFUSE: impact analysis prefer != OPTION_A", file=sys.stderr)
        return 2
    if impact.get("executed_bridge") is True:
        print("NOTE: executed_bridge already true — re-materializing under Owner auth")

    # refuse pointer-pack naive path: ensure we will write pillar fields
    for layer, path in POINTERS.items():
        ptr = load_json(path)
        if ptr.get("status", "").startswith("POINTER") and "l1_pass" in json.dumps(ptr):
            pass  # still materialize from sources

    sidecar = snapshot_pending(recorded)

    writers = {
        "L1-PRODUCT-VALIDATION-LATEST.json": materialize_l1,
        "L2-DATA-VALIDATION-HARDENED-LATEST.json": materialize_l2,
        "L3-SECURITY-VALIDATION-HARDENED-LATEST.json": materialize_l3,
        "L4-OPERATIONS-VALIDATION-LATEST.json": materialize_l4,
        "L5-FG-WEB3-EMPIRICAL-LATEST.json": materialize_l5,
    }
    written = []
    for name, fn in writers.items():
        doc = fn(recorded)
        # hard refuse if still looks like pointer pack
        if doc.get("status") == "POINTER_PACK_READY" or doc.get("bridge_required_before_s7"):
            print(f"REFUSE: produced pointer-shaped doc for {name}", file=sys.stderr)
            return 2
        if name.startswith("L") and name[1].isdigit():
            pass_key = f"l{name[1]}_pass"
            if pass_key not in doc and name.startswith("L5"):
                if "l5_pass" not in doc:
                    print(f"REFUSE: missing l5_pass in {name}", file=sys.stderr)
                    return 2
            elif pass_key not in doc and not name.startswith("L5"):
                print(f"REFUSE: missing {pass_key} in {name}", file=sys.stderr)
                return 2
        write_json(PENDING / name, doc)
        written.append({"file": name, "sha256": sha256_file(PENDING / name), "l_pass": {
            "l1": doc.get("l1_pass"),
            "l2": doc.get("l2_pass"),
            "l3": doc.get("l3_pass"),
            "l4": doc.get("l4_pass"),
            "l5": doc.get("l5_pass"),
        }})

    write_observation_elapsed(recorded)
    update_impact_and_deferred(recorded, sidecar)
    pcr = write_pcr(recorded, sidecar)

    # refresh source check via pack2 function
    sys.path.insert(0, str(ROOT / "scripts/dev"))
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "pack2", ROOT / "scripts/dev/run-psg-project-a-closure-preflight-pack2.py"
    )
    assert spec and spec.loader
    pack2 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pack2)
    src = pack2.s7_input_source_check(recorded)
    src["executed_bridge"] = True
    src["mode"] = "POST_BRIDGE_OPTION_A"
    write_json(CONSOL / "S7-INPUT-SOURCE-CHECK-LATEST.json", src)

    baseline = run_gate([sys.executable, "scripts/dev/check-psg-s7-candidate-baseline-gate.py"])
    lock = run_gate(
        [sys.executable, "scripts/dev/check-psg-s7-input-manifest-gate.py", "lock-after-bridge"]
    )
    verify = run_gate(
        [sys.executable, "scripts/dev/check-psg-s7-input-manifest-gate.py", "verify-pre-s7"]
    )

    out = {
        "schema": "traveltrust.psg_candidate_evidence_bridge_option_a.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "option": "OPTION_A",
        "executed_bridge": True,
        "sidecar": sidecar.relative_to(ROOT).as_posix(),
        "pcr": pcr.relative_to(ROOT).as_posix(),
        "written": written,
        "s7_input_source_check": src.get("status"),
        "baseline_gate_rc": baseline["returncode"],
        "manifest_lock_rc": lock["returncode"],
        "manifest_verify_rc": verify["returncode"],
        "baseline_stdout": baseline["stdout"],
        "lock_stdout": lock["stdout"],
        "verify_stdout": verify["stdout"],
        "s7_reader_modified": False,
        "hard_gate": "CUTOVER_REFUSED",
        "equals_psg_complete": False,
        "honesty": "Bridge A complete — not L5 PASS, not PSG Complete, not Production GO",
    }
    write_json(CONSOL / "CANDIDATE-EVIDENCE-BRIDGE-OPTION-A-LATEST.json", out)

    print(json.dumps({
        "executed_bridge": True,
        "source_check": src.get("status"),
        "baseline_rc": baseline["returncode"],
        "lock_rc": lock["returncode"],
        "verify_rc": verify["returncode"],
        "pcr": pcr.name,
    }, indent=2))
    print("TT_PSG_BRIDGE_OPTION_A: EXECUTED")

    if src.get("status") != "READY" or baseline["returncode"] != 0 or lock["returncode"] != 0 or verify["returncode"] != 0:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
