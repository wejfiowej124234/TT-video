#!/usr/bin/env python3
"""
TT_PSG_PRODUCTION_COMPLETION_MATRIX · Recalculate (S7)

Aggregates L1–L5 empirical evidence, checks Release SHA / Artifact / Bytecode /
Evidence consistency, Deferred items, 48H Observation, Owner Sign-off conditions.

Outputs final PSG Completion Verdict.
NEVER flips ACTIVE. NEVER declares Production GO.

Phase-6+: ACTIVE Web3 SSOT = Candidate v2. Living Recalculate allowed only after
FG-15-B ELAPSED (or TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1 forensic). Never flips
ACTIVE / Hard Gate / Mainnet Wave.
"""
from __future__ import annotations

# Baseline Migration — Recalculate allowed only after FG-15-B ELAPSED
# (or ALLOW_HISTORICAL=1 forensic). Never unlocks Hard Gate / Wave.
import sys as _tt_sys
from pathlib import Path as _tt_Path
_tt_lib = _tt_Path(__file__).resolve().parent / "lib"
if str(_tt_lib) not in _tt_sys.path:
    _tt_sys.path.insert(0, str(_tt_lib))
from tt_refuse_historical_baseline import (  # noqa: E402
    refuse_unless_fg15_b_elapsed_or_historical as _tt_refuse_recalc,
)
_tt_refuse_recalc(__file__)

import hashlib
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
ARCH = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail"
CAND_EVID = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2"
DEPLOY_YAML = ROOT / "registry/protocol-convergence-deployments.v1.yaml"
MATRIX_YAML = ROOT / "registry/psg-production-completion-matrix.v1.yaml"
EXPECTED_ACTIVE = "v311_fund_safety_candidate_v2"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(name: str) -> dict | None:
    p = PENDING / name
    if not p.is_file():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def git_head() -> str:
    try:
        return (
            subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=str(ROOT), text=True)
            .strip()
        )
    except Exception:  # noqa: BLE001
        return "UNKNOWN"


def active_baseline() -> str:
    text = DEPLOY_YAML.read_text(encoding="utf-8")
    m = re.search(r"active_deploy_baseline:\s*([^\s#]+)", text)
    return m.group(1).strip() if m else "UNKNOWN"


def sha256_file(rel: str) -> str | None:
    p = ROOT / rel
    if not p.is_file():
        return None
    h = hashlib.sha256()
    h.update(p.read_bytes())
    return h.hexdigest()


def pillar_l1() -> dict:
    d = load_json("L1-PRODUCT-VALIDATION-LATEST.json") or {}
    ok = bool(d.get("l1_pass"))
    return {
        "layer": "L1_Product",
        "artifact": "L1-PRODUCT-VALIDATION-LATEST.json",
        "pass": ok,
        "status": "PASS" if ok else "OPEN",
        "verdict": d.get("verdict"),
        "notes": [],
    }


def pillar_l2() -> dict:
    d = load_json("L2-DATA-VALIDATION-HARDENED-LATEST.json") or {}
    ok = bool(d.get("l2_pass"))
    sepolia_live = bool(d.get("l2_sepolia_live_lifecycle_pass"))
    notes = []
    deferred = []
    if ok and not sepolia_live:
        deferred.append(
            {
                "id": "L2-SEPOLIA-LIVE-LIFECYCLE",
                "summary": "Anvil/Hardened bytecode equality PASS; Sepolia Timelock live money-path lifecycle still OPEN",
                "blocking_for_psg_complete": False,
                "blocking_for_mainnet_go": True,
            }
        )
        notes.append("l2_pass covers hardened-bytecode data plane; Sepolia live deferred")
    return {
        "layer": "L2_Data",
        "artifact": "L2-DATA-VALIDATION-HARDENED-LATEST.json",
        "pass": ok,
        "status": "PASS" if ok else "OPEN",
        "verdict": d.get("verdict"),
        "l2_sepolia_live_lifecycle_pass": sepolia_live,
        "deferred": deferred,
        "notes": notes,
    }


def pillar_l3() -> dict:
    d = load_json("L3-SECURITY-VALIDATION-HARDENED-LATEST.json") or {}
    # Prefer hardened; note superseded finding artifact
    finding = load_json("L3-SECURITY-VALIDATION-LATEST.json") or {}
    ok = bool(d.get("l3_pass"))
    return {
        "layer": "L3_Security",
        "artifact": "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
        "pass": ok,
        "status": "PASS" if ok else "OPEN",
        "verdict": d.get("verdict"),
        "superseded_finding_artifact": {
            "path": "L3-SECURITY-VALIDATION-LATEST.json",
            "l3_pass": finding.get("l3_pass"),
            "note": "pre-remediation finding; Hardened revalidation is authoritative",
        },
        "notes": [],
    }


def pillar_l4() -> dict:
    d = load_json("L4-OPERATIONS-VALIDATION-LATEST.json") or {}
    ok = bool(d.get("l4_pass"))
    return {
        "layer": "L4_Operations",
        "artifact": "L4-OPERATIONS-VALIDATION-LATEST.json",
        "pass": ok,
        "status": "PASS" if ok else "OPEN",
        "verdict": d.get("verdict"),
        "notes": [],
    }


def pillar_l5() -> dict:
    emp = load_json("L5-FG-WEB3-EMPIRICAL-LATEST.json") or {}
    val = load_json("L5-FG-WEB3-VALIDATION-STATUS-LATEST.json") or {}
    l5b = load_json("L5B-FIVE-LAYER-EQUALITY-CLOSURE-LATEST.json") or {}
    l5c = load_json("L5C-PRODUCTION-RUNTIME-INTEGRATION-LATEST.json") or {}
    runtime = load_json("L5-FG-WEB3-PRODUCTION-RUNTIME-STATUS-LATEST.json") or {}
    freeze = load_json("L5-CONTRACT-ADDRESS-FREEZE-LATEST.json") or {}
    obs = load_json("OBSERVATION-48H-FRAME-READY-LATEST.json") or {}
    start = load_json("OBSERVATION-48H-START-LATEST.json")
    elapsed = load_json("OBSERVATION-48H-ELAPSED-PASS-LATEST.json")

    equality_slice = bool(val.get("l5_pass") or l5b.get("l5_pass"))
    production_runtime = bool(
        l5c.get("production_runtime_pass")
        or runtime.get("production_runtime_pass")
        or freeze.get("production_runtime_pass")
    )
    empirical_pass = bool(emp.get("l5_pass"))
    obs_frame = obs.get("status") == "FRAME_READY" or obs.get("frame_status") == "FRAME_READY"
    obs_started = bool(start) or bool(obs.get("window_started"))
    obs_elapsed = bool(elapsed) or bool(obs.get("window_elapsed_pass"))

    # Completion Matrix L5 requires FG-15 Observation_48H among mandatory surfaces
    fg15_pass = obs_elapsed
    # Overall L5 for PSG equation: empirical closed AND FG-15 elapsed (strict)
    # Equality/runtime slices alone are insufficient.
    l5_pass = empirical_pass and fg15_pass
    # If empirical stale-false but equality+runtime closed, still fail on FG-15
    if not empirical_pass and equality_slice and production_runtime and not fg15_pass:
        status = "PARTIAL_EQUALITY_CLOSED_FG15_OPEN"
    elif l5_pass:
        status = "PASS"
    elif equality_slice or production_runtime:
        status = "PARTIAL"
    else:
        status = "NOT_READY"

    deferred = []
    open_gaps = list(emp.get("open_gaps") or [])
    if not fg15_pass:
        deferred.append(
            {
                "id": "FG-15-OBSERVATION-48H",
                "summary": "48H Observation FRAME_READY only — window not started/elapsed",
                "blocking_for_psg_complete": True,
            }
        )
    if not empirical_pass:
        deferred.append(
            {
                "id": "L5-EMPIRICAL-PARTIAL",
                "summary": emp.get("verdict") or "L5 empirical artifact l5_pass=false",
                "open_gaps": open_gaps,
                "blocking_for_psg_complete": True,
                "note": "Later L5B/L5C equality slices may supersede some gaps; FG-15 still required",
            }
        )

    return {
        "layer": "L5_Financial_Grade_Web3",
        "pass": l5_pass,
        "status": status,
        "artifacts": {
            "empirical": "L5-FG-WEB3-EMPIRICAL-LATEST.json",
            "validation": "L5-FG-WEB3-VALIDATION-STATUS-LATEST.json",
            "l5b_equality": "L5B-FIVE-LAYER-EQUALITY-CLOSURE-LATEST.json",
            "l5c_runtime": "L5C-PRODUCTION-RUNTIME-INTEGRATION-LATEST.json",
            "address_freeze": "L5-CONTRACT-ADDRESS-FREEZE-LATEST.json",
            "observation_frame": "OBSERVATION-48H-FRAME-READY-LATEST.json",
        },
        "slices": {
            "empirical_pass": empirical_pass,
            "equality_slice_pass": equality_slice,
            "production_runtime_pass": production_runtime,
            "fg15_observation_48h_pass": fg15_pass,
            "observation_frame_ready": obs_frame,
            "observation_window_started": obs_started,
            "observation_window_elapsed": obs_elapsed,
        },
        "deferred": deferred,
        "open_gaps_from_empirical": open_gaps,
        "verdicts": {
            "empirical": emp.get("verdict"),
            "validation": val.get("verdict"),
            "l5b": l5b.get("verdict"),
            "l5c": l5c.get("verdict"),
        },
        "notes": [
            "L5 PASS for PSG Complete requires empirical closure AND FG-15 elapsed observation",
            "FRAME_READY ≠ 48H PASS",
        ],
    }


def check_release_identity() -> dict:
    # Prefer Final Completion re-pin when present
    pin = (
        load_json("FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json")
        or load_json("CDR-19-RELEASE-SHA-PIN-LATEST.json")
        or {}
    )
    bind = (
        load_json("FINAL-COMPLETION-EQUIVALENCE-BINDING-LATEST.json")
        or load_json("CDR-19-EQUIVALENCE-BINDING-LATEST.json")
        or {}
    )
    cdr19 = (
        load_json("FINAL-COMPLETION-RELEASE-IDENTITY-CLOSURE-LATEST.json")
        or load_json("CDR-19-RELEASE-IDENTITY-CLOSURE-LATEST.json")
        or {}
    )
    hardened = load_json("FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json") or {}
    wired = load_json("FCG-V2-ONCHAIN-BIND-LATEST.json") or {}
    head = git_head()
    release_sha = pin.get("Release_SHA") or bind.get("Release_SHA")
    source_sha = bind.get("Source_SHA")
    head_matches = bool(release_sha) and head.lower() == str(release_sha).lower()
    source_matches_release = (
        bool(release_sha)
        and bool(source_sha)
        and str(release_sha).lower() == str(source_sha).lower()
    )

    # Recompute deploy artifact hashes vs binding (integrity of pinned members)
    artifact_members = (bind.get("Deploy_Artifact") or {}).get("members") or []
    member_checks = []
    artifact_ok = True
    for m in artifact_members:
        path = m.get("path")
        expected = m.get("sha256")
        actual = sha256_file(path) if path else None
        match = actual is not None and expected is not None and actual == expected
        if not match:
            artifact_ok = False
        member_checks.append(
            {"path": path, "expected_sha256": expected, "actual_sha256": actual, "match": match}
        )

    bytecode = bind.get("Contract_Bytecode") or {}
    evidence_pkg = bind.get("Evidence_Package") or {}
    bytecode_ok = bool(bytecode.get("members")) and bytecode.get("status") in (
        "BOUND",
        "BINDING_COMPLETE",
        None,
    )
    if bytecode.get("status") == "PARTIAL":
        bytecode_ok = False

    findings = []
    if not release_sha:
        findings.append({"id": "SHA-MISSING-RELEASE", "summary": "Release_SHA missing"})
    if not head_matches:
        findings.append(
            {
                "id": "SHA-HEAD-DRIFT",
                "summary": f"workspace HEAD {head[:12]} ≠ Release_SHA {(release_sha or '')[:12]}",
                "severity": "blocks claiming frozen identity for GO",
            }
        )
    if not artifact_ok:
        findings.append(
            {
                "id": "ARTIFACT-HASH-DRIFT",
                "summary": "one or more Deploy_Artifact member sha256 no longer match workspace files",
            }
        )
    if not bytecode_ok:
        findings.append({"id": "BYTECODE-PARTIAL", "summary": "Contract_Bytecode not BOUND"})

    historical_pin_complete = bind.get("status") == "BINDING_COMPLETE" and source_matches_release
    current_ok = (
        historical_pin_complete
        and head_matches
        and artifact_ok
        and bytecode_ok
        and bool(evidence_pkg)
        and len(findings) == 0
    )

    return {
        "chain": "Source_SHA = Deploy_Artifact = Contract_Bytecode = Evidence_Package",
        "pin_id": pin.get("id") or bind.get("id"),
        "Release_SHA": release_sha,
        "Source_SHA": source_sha,
        "workspace_HEAD": head,
        "head_matches_release_sha": head_matches,
        "source_matches_release": source_matches_release,
        "cdr19_status": cdr19.get("status") or cdr19.get("verdict"),
        "equivalence_binding_status": bind.get("status"),
        "equivalence_binding_verdict": bind.get("verdict"),
        "historical_pin_complete_at_record_time": historical_pin_complete,
        "current_workspace_equivalence_ok": current_ok,
        "Deploy_Artifact_sample_checks": member_checks,
        "Contract_Bytecode_present": bool(bytecode),
        "Evidence_Package_present": bool(evidence_pkg),
        "hardened_bind_present": bool(hardened),
        "hardened_verdict": hardened.get("verdict"),
        "wired_bind_verdict": wired.get("verdict"),
        "ACTIVE_FLIP": "FORBIDDEN",
        "findings": findings,
        "pass": current_ok,
    }


def check_observation_48h() -> dict:
    """Prefer FG-15-B Candidate status; fall back to FCG pending artifacts (historical)."""
    from tt_refuse_historical_baseline import fg15_b_elapsed

    cand_elapsed, cand_st = fg15_b_elapsed(CAND_EVID / "FG15-CANDIDATE-V2-STATUS-LATEST.json")
    if cand_st:
        if cand_elapsed:
            status = "ELAPSED_PASS"
        elif cand_st.get("status") in ("OBSERVATION_RUNNING", "RUNNING"):
            status = "STARTED_IN_PROGRESS"
        else:
            status = str(cand_st.get("status") or "NOT_STARTED")
        return {
            "status": status,
            "track": "FG-15-B",
            "psg_release_version": cand_st.get("psg_release_version"),
            "frame_artifact": None,
            "start_artifact_present": bool(cand_st.get("started_utc")),
            "baseline_artifact_present": True,
            "elapsed_pass_artifact_present": cand_elapsed,
            "window_started_utc": cand_st.get("started_utc"),
            "window_ends_utc": cand_st.get("earliest_elapsed_utc"),
            "planes": ["Chain", "Indexer", "API", "DB", "Error", "Security_Events"],
            "pass_for_fg15": status == "ELAPSED_PASS",
            "honesty": "FG-15-B Candidate track; ELAPSED required for L5/PSG Complete",
            "hard_gate": cand_st.get("hard_gate", "CUTOVER_REFUSED"),
            "real_eth_wave": cand_st.get("real_eth_wave", "FORBIDDEN"),
        }

    frame = load_json("OBSERVATION-48H-FRAME-READY-LATEST.json") or {}
    start = load_json("OBSERVATION-48H-START-LATEST.json") or {}
    elapsed = load_json("OBSERVATION-48H-ELAPSED-PASS-LATEST.json") or {}
    baseline = load_json("OBSERVATION-48H-BASELINE-EVIDENCE-LATEST.json") or {}
    status = "NOT_STARTED"
    if elapsed.get("elapsed_pass") or elapsed.get("status") == "ELAPSED_PASS":
        status = "ELAPSED_PASS"
    elif start.get("window_started") or start.get("status") == "STARTED_IN_PROGRESS":
        status = "STARTED_IN_PROGRESS"
    elif frame.get("status") in ("FRAME_READY", "WINDOW_STARTED") or frame.get("frame_status") == "FRAME_READY":
        status = "FRAME_READY_NOT_STARTED" if not start else "STARTED_IN_PROGRESS"
        if frame.get("window_started") or frame.get("status") == "WINDOW_STARTED":
            status = "STARTED_IN_PROGRESS"
    return {
        "status": status,
        "track": "LEGACY_FCG_PENDING",
        "frame_artifact": "OBSERVATION-48H-FRAME-READY-LATEST.json" if frame else None,
        "start_artifact_present": bool(start),
        "baseline_artifact_present": bool(baseline),
        "elapsed_pass_artifact_present": bool(elapsed),
        "window_started_utc": start.get("window_started_utc") or frame.get("window_started_utc"),
        "window_ends_utc": start.get("window_ends_utc") or frame.get("window_ends_utc"),
        "planes": start.get("planes")
        or frame.get("planes")
        or ["Chain", "Indexer", "API", "DB", "Error", "Security_Events"],
        "pass_for_fg15": status == "ELAPSED_PASS",
        "honesty": "START/FRAME ≠ 48H Observation PASS (FG-15); ELAPSED required",
    }


def check_owner_signoff() -> dict:
    """PSG Completion Owner Sign-off — require signed=true (unsigned package ≠ signed)."""
    candidates = [
        PENDING / "PSG-COMPLETION-OWNER-SIGNOFF-LATEST.json",
        PENDING / "OWNER-SIGNOFF-PSG-COMPLETION-LATEST.json",
        PENDING / "TT-PSG-COMPLETION-OWNER-SIGNOFF-LATEST.json",
    ]
    present_path = next((p for p in candidates if p.is_file()), None)
    present = str(present_path.name) if present_path else None
    signed = False
    stub = {}
    if present_path:
        stub = json.loads(present_path.read_text(encoding="utf-8"))
        signed = bool(stub.get("signed") is True)
    pkg = load_json("PSG-COMPLETION-OWNER-SIGNOFF-PACKAGE-LATEST.json") or {}
    g_rc = load_json("G-RC-CLOSED-OWNER-DECLARATION-LATEST.json") or {}
    conditions = {
        "all_five_layers_pass": False,
        "fg15_observation_elapsed": False,
        "release_identity_current_ok": False,
        "active_flip_not_auto": True,
        "production_go_not_auto": True,
        "owner_signoff_artifact_present": bool(present),
        "owner_signoff_signed": signed,
        "g_rc_closed_declared": bool(g_rc.get("g_rc_closed")),
        "package_status": pkg.get("status"),
    }
    return {
        "signoff_artifact": present,
        "signoff_present": bool(present),
        "signoff_signed": signed,
        "package_status": pkg.get("status"),
        "g_rc_owner_declaration": {
            "present": bool(g_rc),
            "g_rc_closed": g_rc.get("g_rc_closed"),
            "note": g_rc.get("note"),
        },
        "conditions": conditions,
        "eligible_for_signoff": False,
        "signed": signed,
    }


def collect_deferred(l1, l2, l3, l4, l5, identity, obs) -> list:
    items = []
    for pillar in (l2, l5):
        items.extend(pillar.get("deferred") or [])
    if not identity.get("head_matches_release_sha"):
        items.append(
            {
                "id": "RELEASE-SHA-HEAD-DRIFT",
                "summary": "workspace HEAD drifted from CDR-19 Release_SHA after pin",
                "blocking_for_psg_complete": True,
            }
        )
    if not identity.get("pass"):
        for f in identity.get("findings") or []:
            items.append(
                {
                    "id": f.get("id"),
                    "summary": f.get("summary"),
                    "blocking_for_psg_complete": True,
                }
            )
    if not obs.get("pass_for_fg15"):
        items.append(
            {
                "id": "OBS-48H-NOT-ELAPSED",
                "summary": f"observation status={obs.get('status')}",
                "blocking_for_psg_complete": True,
            }
        )
    items.append(
        {
            "id": "ACTIVE-FLIP-DEFERRED",
            "summary": "ACTIVE = v311_fund_safety_candidate_v2 (Candidate v2); FG-15-A clean = historical; Hardened = DEPLOYED_BOUND_NOT_ACTIVE; flip FORBIDDEN until FG-15-B ELAPSED",
            "blocking_for_psg_complete": False,
            "blocking_for_production_go": True,
        }
    )
    items.append(
        {
            "id": "PRODUCTION-GO-NOT-AUTO",
            "summary": "Recalculate never executes Production GO",
            "blocking_for_psg_complete": False,
        }
    )
    # de-dupe by id
    seen = set()
    out = []
    for it in items:
        i = it.get("id")
        if i in seen:
            continue
        seen.add(i)
        out.append(it)
    return out


def main() -> int:
    stamp = utc_now()
    active = active_baseline()
    if active != EXPECTED_ACTIVE:
        # Still report, but refuse to claim GO; do not flip
        pass

    l1 = pillar_l1()
    l2 = pillar_l2()
    l3 = pillar_l3()
    l4 = pillar_l4()
    l5 = pillar_l5()
    identity = check_release_identity()
    obs = check_observation_48h()
    owner = check_owner_signoff()

    pillars_pass = {
        "L1_Product": l1["pass"],
        "L2_Data": l2["pass"],
        "L3_Security": l3["pass"],
        "L4_Operations": l4["pass"],
        "L5_Financial_Grade_Web3": l5["pass"],
    }
    all_layers_pass = all(pillars_pass.values())
    identity_ok = bool(identity.get("pass"))
    obs_ok = bool(obs.get("pass_for_fg15"))
    owner["conditions"]["all_five_layers_pass"] = all_layers_pass
    owner["conditions"]["fg15_observation_elapsed"] = obs_ok
    owner["conditions"]["release_identity_current_ok"] = identity_ok
    # signed must be explicit signed=true — unsigned package ≠ signed
    owner["signed"] = bool(owner.get("signoff_signed"))
    owner["eligible_for_signoff"] = (
        all_layers_pass and obs_ok and identity_ok and not owner["signed"]
    )

    deferred = collect_deferred(l1, l2, l3, l4, l5, identity, obs)

    # Final equation
    psg_complete = (
        all_layers_pass
        and identity_ok
        and obs_ok
        and owner["signed"]
    )
    # Hard forbid auto GO / ACTIVE
    production_go = False
    active_flip_executed = False

    blockers = []
    if not pillars_pass["L1_Product"]:
        blockers.append("L1_Product_OPEN")
    if not pillars_pass["L2_Data"]:
        blockers.append("L2_Data_OPEN")
    if not pillars_pass["L3_Security"]:
        blockers.append("L3_Security_OPEN")
    if not pillars_pass["L4_Operations"]:
        blockers.append("L4_Operations_OPEN")
    if not pillars_pass["L5_Financial_Grade_Web3"]:
        blockers.append("L5_FG_Web3_NOT_PASS_FG15_OR_EMPIRICAL")
    if not identity_ok:
        blockers.append("RELEASE_IDENTITY_CURRENT_NOT_OK")
    if not obs_ok:
        blockers.append("OBSERVATION_48H_NOT_ELAPSED")
    if not owner["signed"]:
        blockers.append("OWNER_SIGNOFF_MISSING")
    # Distinguish unsigned package present
    if owner.get("signoff_present") and not owner.get("signed"):
        if "OWNER_SIGNOFF_MISSING" in blockers:
            blockers[blockers.index("OWNER_SIGNOFF_MISSING")] = "OWNER_SIGNOFF_UNSIGNED"

    if psg_complete:
        verdict = "PSG_COMPLETE_PASS_AWAIT_OWNER_PRODUCTION_GO_GATE"
    elif all_layers_pass and not obs_ok:
        verdict = "PSG_COMPLETION_RECALC_NOT_COMPLETE_AWAIT_48H_AND_SIGNOFF"
    elif (
        pillars_pass["L1_Product"]
        and pillars_pass["L2_Data"]
        and pillars_pass["L3_Security"]
        and pillars_pass["L4_Operations"]
        and identity_ok
        and not pillars_pass["L5_Financial_Grade_Web3"]
    ):
        verdict = "PSG_COMPLETION_RECALC_NOT_COMPLETE_AWAIT_FG15_ELAPSED_AND_SIGNOFF"
    elif pillars_pass["L1_Product"] and pillars_pass["L2_Data"] and pillars_pass["L3_Security"] and pillars_pass["L4_Operations"]:
        verdict = "PSG_COMPLETION_RECALC_NOT_COMPLETE_L5_AND_IDENTITY_OPEN"
    else:
        verdict = "PSG_COMPLETION_RECALC_NOT_COMPLETE"

    pack = {
        "schema": "traveltrust.psg_completion_matrix_recalculate.v1",
        "machine_key": "TT_PSG_PRODUCTION_COMPLETION_MATRIX",
        "step": "S7_Recalculate",
        "recorded_utc": stamp,
        "equation": "PSG_COMPLETE = L1 ∧ L2 ∧ L3 ∧ L4 ∧ L5 (incl. FG-15) ∧ Release_Identity_current ∧ Owner_Signoff",
        "ACTIVE_FLIP": "FORBIDDEN",
        "active_deploy_baseline": active,
        "active_flip_executed": active_flip_executed,
        "production_go": production_go,
        "production_go_executed": False,
        "pillars": {
            "L1_Product": l1,
            "L2_Data": l2,
            "L3_Security": l3,
            "L4_Operations": l4,
            "L5_Financial_Grade_Web3": l5,
        },
        "pillars_pass": pillars_pass,
        "all_five_layers_pass": all_layers_pass,
        "release_identity": identity,
        "observation_48h": obs,
        "owner_signoff": owner,
        "deferred": deferred,
        "blockers": blockers,
        "psg_complete": psg_complete,
        "verdict": verdict,
        "honesty": {
            "single_layer_pass_does_not_imply_psg_complete": True,
            "l5_equality_slice_does_not_imply_l5_pass": True,
            "frame_ready_does_not_imply_48h_pass": True,
            "recalculate_does_not_flip_active": True,
            "recalculate_does_not_execute_production_go": True,
            "historical_cdr19_pin_is_not_current_workspace_equivalence": not identity_ok,
        },
        "next": [
            "Arm_OBSERVATION-48H-START (Owner)" if not obs_ok else None,
            "Close_L5_empirical_remaining_gaps" if not l5["pass"] else None,
            "Re-pin_or_reconcile_Release_SHA_after_remediation" if not identity_ok else None,
            "Owner_Signoff_PSG_Completion" if not owner["signed"] else None,
            "Production_Certification_gate_only_after_psg_complete",
        ],
    }
    pack["next"] = [x for x in pack["next"] if x]

    text = json.dumps(pack, indent=2, ensure_ascii=False) + "\n"
    out = PENDING / "PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.json"
    out.write_text(text, encoding="utf-8")
    (FG / "PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.json").write_text(text, encoding="utf-8")

    # Verdict-only slim artifact
    verdict_pack = {
        "schema": "traveltrust.psg_completion_verdict.v1",
        "recorded_utc": stamp,
        "psg_complete": psg_complete,
        "verdict": verdict,
        "pillars_pass": pillars_pass,
        "blockers": blockers,
        "observation_48h": obs.get("status"),
        "owner_signoff_present": owner["signoff_present"],
        "active_deploy_baseline": active,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
    }
    vt = json.dumps(verdict_pack, indent=2, ensure_ascii=False) + "\n"
    (PENDING / "PSG-COMPLETION-VERDICT-LATEST.json").write_text(vt, encoding="utf-8")
    (FG / "PSG-COMPLETION-VERDICT-LATEST.json").write_text(vt, encoding="utf-8")

    board = {
        "schema": "traveltrust.psg_completion_empirical_board.v1",
        "recorded_utc": stamp,
        "ACTIVE_FLIP": "FORBIDDEN",
        "layers": {
            "L5": {
                "status": l5["status"],
                "pass": l5["pass"],
                "note": "FG-15 required for completion equation",
            },
            "L3_Security": {"status": "PASS_FROZEN" if l3["pass"] else "OPEN", "pass": l3["pass"]},
            "L2_Data": {"status": "PASS_FROZEN" if l2["pass"] else "OPEN", "pass": l2["pass"]},
            "L1_Product": {"status": "PASS_FROZEN" if l1["pass"] else "OPEN", "pass": l1["pass"]},
            "L4_Operations": {"status": "PASS_FROZEN" if l4["pass"] else "OPEN", "pass": l4["pass"]},
        },
        "recalculate": {
            "psg_complete": psg_complete,
            "verdict": verdict,
            "blockers": blockers,
        },
        "observation_48h": obs.get("status"),
        "psg_complete": psg_complete,
        "production_go": False,
        "verdict": verdict,
        "next": pack["next"][0] if pack["next"] else "Owner_Production_Certification",
    }
    bt = json.dumps(board, indent=2, ensure_ascii=False) + "\n"
    (PENDING / "PSG-COMPLETION-EMPIRICAL-BOARD-LATEST.json").write_text(bt, encoding="utf-8")
    (FG / "PSG-COMPLETION-EMPIRICAL-BOARD-LATEST.json").write_text(bt, encoding="utf-8")

    rem = ARCH / "completion_recalculate"
    rem.mkdir(parents=True, exist_ok=True)
    stamp_file = stamp.replace(":", "")
    (rem / f"PSG-COMPLETION-MATRIX-RECALCULATE-{stamp_file}.json").write_text(text, encoding="utf-8")
    shutil.copy2(out, rem / "PSG-COMPLETION-MATRIX-RECALCULATE-LATEST.json")
    (rem / "PSG-COMPLETION-VERDICT-LATEST.json").write_text(vt, encoding="utf-8")

    print(
        json.dumps(
            {
                "psg_complete": psg_complete,
                "verdict": verdict,
                "pillars_pass": pillars_pass,
                "blockers": blockers,
                "observation_48h": obs.get("status"),
                "ACTIVE_FLIP": "FORBIDDEN",
                "production_go": False,
            },
            indent=2,
        )
    )
    # Exit 0 = recalculate ran successfully; psg_complete may still be false
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
