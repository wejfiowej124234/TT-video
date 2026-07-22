#!/usr/bin/env python3
"""
FG-15 RUNNING integrity gate.

Verifies freeze (Release_SHA · Hardened addresses · ACTIVE config) and
integrity of Launch Final Pack / Certification Draft / Owner Sign-off Package.

Does NOT: ELAPSED PASS, Owner final sign-off, ACTIVE flip, Production GO.
"""

# --- FINAL RELEASE pollution guard ---
import os as _tt_os, sys as _tt_sys
if _tt_os.environ.get('TRAVELTRUST_ALLOW_HISTORICAL_BASELINE') != '1':
    _tt_sys.stderr.write(
        'DEPRECATED: FG-15 historical script refused.
'
        'Active = Candidate v2 / FINAL RELEASE. Forensic: TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1
'
    )
    raise SystemExit(2)
# --- end guard ---


from __future__ import annotations


# Baseline Migration v2 — FG-15-A / Hardened forensic tooling (default refuse)
import sys as _tt_sys
from pathlib import Path as _tt_Path
_tt_lib = _tt_Path(__file__).resolve().parent / "lib"
if str(_tt_lib) not in _tt_sys.path:
    _tt_sys.path.insert(0, str(_tt_lib))
from tt_refuse_historical_baseline import refuse_unless_historical_allowed as _tt_refuse_hist
_tt_refuse_hist(__file__)
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
ARCH = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail"
DEPLOY_YAML = ROOT / "registry/protocol-convergence-deployments.v1.yaml"

EXPECTED_SHA = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"
EXPECTED_ACTIVE = "v311_sepolia_clean_baseline"
EXPECTED_ADDRS = {
    "escrowFactory": "0x49b6e57f1ade52cca287da653a8e0e7c23ae286d",
    "settlementRouter": "0x8cf12bcf7ca2005413f645614029f51d3efaa1c9",
    "feeRouter": "0xfed657db52120ee91165ca9d907c9df1475e2c86",
    "projectRevenuePool": "0xe8da62b9ac2acdf7f18545fa9af788656df09f27",
    "founderBootstrap": "0x3e79dde670008a204861df63121a7796c025814b",
    "ownerOrTimelock": "0x462402082B395F218FFB3634ec0611e39BdD504C",
}

REQUIRED_PACK_FILES = [
    "PRODUCTION-LAUNCH-FINAL-PACK-LATEST.json",
    "PRODUCTION-RELEASE-RUNBOOK-LATEST.json",
    "PRODUCTION-ROLLBACK-PLAN-PACK-LATEST.json",
    "LAUNCH-DAY-CHECKLIST-LATEST.json",
    "PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json",
    "OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json",
    "PSG-COMPLETION-OWNER-SIGNOFF-PACKAGE-LATEST.json",
    "PRODUCTION-READINESS-DOSSIER-LATEST.json",
    "FINAL-RISK-REGISTER-LATEST.json",
    "OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.json",
    "OPS-INCIDENT-RUNBOOK-LAUNCH-LATEST.json",
    "CMS-MARKET-LAUNCH-PREP-LATEST.json",
    "MAINNET-ENV-PREFLIGHT-READONLY-LATEST.json",
    "LAUNCH-OPS-MATERIALS-LATEST.json",
    "MANUAL-UAT-EXECUTION-PLAN-LATEST.json",
    "FG15-SIX-PARALLEL-PREP-INDEX-LATEST.json",
    "FG15-PRIORITY-PREP-DEEPEN-LATEST.json",
    "LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.json",
    "FG15-CLOSE-PREP-INDEX-LATEST.json",
    "FG15-ANOMALY-EVIDENCE-MAINTENANCE-LATEST.json",
    "FINAL-MANUAL-WALKTHROUGH-LATEST.json",
    "GO-NO-GO-DECISION-TEMPLATE-LATEST.json",
    "POST-FG15-GATE-SEQUENCE-LATEST.json",
    "PRODUCTION-CERT-PREFLIGHT-CHECK-LATEST.json",
    "PRODUCTION-CERTIFICATION-FINAL-PREP-LATEST.json",
    "OPS-DRILL-CASE1-READONLY-LATEST.json",
    "FROZEN-P0-REGRESSION-GREEN-LATEST.json",
    "PSG-COMPLETION-MATRIX-FINAL-SNAPSHOT-DRAFT-LATEST.json",
    "L1-L5-EVIDENCE-INDEX-LATEST.json",
    "OBSERVATION-48H-WINDOW-FREEZE-LATEST.json",
    "OBSERVATION-48H-START-LATEST.json",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load(name: str) -> dict:
    p = PENDING / name
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def active_baseline() -> str:
    text = DEPLOY_YAML.read_text(encoding="utf-8")
    m = re.search(r"active_deploy_baseline:\s*([^\s#]+)", text)
    return m.group(1).strip() if m else "UNKNOWN"


def main() -> int:
    stamp = utc_now()
    findings: list[dict] = []

    pin = load("FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json") or load(
        "CDR-19-RELEASE-SHA-PIN-LATEST.json"
    )
    freeze = load("OBSERVATION-48H-WINDOW-FREEZE-LATEST.json")
    start = load("OBSERVATION-48H-START-LATEST.json")
    hardened = load("FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json")
    launch = load("PRODUCTION-LAUNCH-FINAL-PACK-LATEST.json")
    cert = load("PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json")
    owner_draft = load("OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json")
    owner_pkg = load("PSG-COMPLETION-OWNER-SIGNOFF-PACKAGE-LATEST.json")
    owner_stub = load("PSG-COMPLETION-OWNER-SIGNOFF-LATEST.json")
    elapsed = load("OBSERVATION-48H-ELAPSED-PASS-LATEST.json")
    six = load("FG15-SIX-PARALLEL-PREP-INDEX-LATEST.json")
    eq = (cert.get("equality_quad") or six.get("equality_quad_pass"))
    if isinstance(eq, dict) and eq.get("pass") is False:
        findings.append({"id": "EQUALITY_QUAD_FAIL", "detail": eq.get("checks")})
    elif six and six.get("equality_quad_pass") is False:
        findings.append({"id": "EQUALITY_QUAD_FAIL"})

    release_sha = pin.get("Release_SHA") or freeze.get("Release_SHA")
    if release_sha != EXPECTED_SHA:
        findings.append({"id": "SHA_DRIFT", "got": release_sha})

    if active_baseline() != EXPECTED_ACTIVE:
        findings.append({"id": "ACTIVE_BASELINE_DRIFT", "got": active_baseline()})

    addrs = hardened.get("addresses") or {}
    for k, exp in EXPECTED_ADDRS.items():
        got = (addrs.get(k) or "").lower()
        if got != exp.lower():
            findings.append({"id": f"ADDR_DRIFT_{k}", "expected": exp, "got": addrs.get(k)})

    # Timelock owner field alternate key
    ot = (hardened.get("owner_or_timelock") or addrs.get("ownerOrTimelock") or "").lower()
    if ot and ot != EXPECTED_ADDRS["ownerOrTimelock"].lower():
        findings.append({"id": "TIMELOCK_DRIFT", "got": ot})

    win_ok = start.get("status") in ("RUNNING", "STARTED_IN_PROGRESS")
    if not win_ok:
        findings.append({"id": "WINDOW_NOT_RUNNING", "status": start.get("status")})

    if elapsed.get("elapsed_pass"):
        # Integrity still OK, but note early — should not auto proceed here
        pass

    missing = [n for n in REQUIRED_PACK_FILES if not (PENDING / n).is_file()]
    for n in missing:
        findings.append({"id": "MISSING_ARTIFACT", "file": n})

    # Pack integrity: SHA references
    for name, obj in [
        ("launch_pack", launch),
        ("cert_draft", cert),
        ("owner_draft", owner_draft),
    ]:
        sha = obj.get("Release_SHA")
        if obj and sha and sha != EXPECTED_SHA:
            findings.append({"id": f"PACK_SHA_MISMATCH_{name}", "got": sha})

    # Owner must remain unsigned before ELAPSED
    if owner_stub.get("signed") is True or owner_pkg.get("signed") is True:
        if not elapsed.get("elapsed_pass"):
            findings.append({"id": "PREMATURE_OWNER_SIGNED_BEFORE_FG15_ELAPSED"})

    signed_forbidden = not bool(elapsed.get("elapsed_pass"))
    integrity_ok = len(findings) == 0

    post_sequence = [
        "FG-15 ELAPSED PASS",
        "Owner Sign-off (human)",
        "PSG Completion Recalculate",
        "Production Certification FINAL",
        "GO / NO-GO (separate gate)",
    ]

    report = {
        "schema": "traveltrust.fg15_running_integrity_check.v1",
        "recorded_utc": stamp,
        "status": "PASS" if integrity_ok else "FAIL",
        "window_status": start.get("status"),
        "window_ends_utc": start.get("window_ends_utc"),
        "elapsed_pass": bool(elapsed.get("elapsed_pass")),
        "freeze": {
            "Release_SHA": EXPECTED_SHA,
            "active_deploy_baseline": EXPECTED_ACTIVE,
            "hardened_contract_set": EXPECTED_ADDRS,
            "match": integrity_ok
            or not any(f["id"].startswith(("SHA_", "ADDR_", "ACTIVE_", "TIMELOCK_")) for f in findings),
        },
        "packs": {
            "launch_final_pack": {
                "present": bool(launch),
                "verdict": launch.get("verdict"),
                "status": launch.get("status"),
            },
            "certification_draft": {
                "present": bool(cert),
                "status": cert.get("status"),
            },
            "owner_signoff_package": {
                "draft_present": bool(owner_draft),
                "package_present": bool(owner_pkg),
                "signed": bool(owner_stub.get("signed") or owner_pkg.get("signed")),
                "eligible_final": False if signed_forbidden else bool(owner_pkg.get("eligible_for_signature")),
                "status": owner_pkg.get("status") or owner_draft.get("status"),
            },
        },
        "findings": findings,
        "integrity_ok": integrity_ok,
        "gates": {
            "FG15_ELAPSED_PASS": bool(elapsed.get("elapsed_pass")),
            "Owner_Signoff_allowed_now": bool(elapsed.get("elapsed_pass")),
            "ACTIVE_FLIP": "FORBIDDEN",
            "production_go": False,
        },
        "post_fg15_sequence": post_sequence,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "verdict": (
            "FG15_RUNNING_INTEGRITY_PASS_AWAIT_ELAPSED"
            if integrity_ok
            else "FG15_RUNNING_INTEGRITY_FAIL"
        ),
    }

    text = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    out = "FG15-RUNNING-INTEGRITY-CHECK-LATEST.json"
    (PENDING / out).write_text(text, encoding="utf-8")
    (FG / out).write_text(text, encoding="utf-8")
    rem = ARCH / "fg15_observation_48h"
    rem.mkdir(parents=True, exist_ok=True)
    (rem / out).write_text(text, encoding="utf-8")

    # Refresh running status pointer
    running = {
        "schema": "traveltrust.fg15_observation_running_status.v1",
        "recorded_utc": stamp,
        "window_status": start.get("status") or "RUNNING",
        "Release_SHA": EXPECTED_SHA,
        "window_started_utc": start.get("window_started_utc"),
        "window_ends_utc": start.get("window_ends_utc"),
        "integrity_ok": integrity_ok,
        "integrity_verdict": report["verdict"],
        "elapsed_pass": False,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "next_after_elapsed": post_sequence,
        "verdict": "FG15_OBSERVATION_WINDOW_RUNNING",
    }
    rt = json.dumps(running, indent=2, ensure_ascii=False) + "\n"
    (PENDING / "OBSERVATION-48H-RUNNING-STATUS-LATEST.json").write_text(rt, encoding="utf-8")
    (FG / "OBSERVATION-48H-RUNNING-STATUS-LATEST.json").write_text(rt, encoding="utf-8")

    print(
        json.dumps(
            {
                "integrity_ok": integrity_ok,
                "findings": len(findings),
                "window": start.get("status"),
                "ends": start.get("window_ends_utc"),
                "signed": report["packs"]["owner_signoff_package"]["signed"],
                "ACTIVE_FLIP": "FORBIDDEN",
                "verdict": report["verdict"],
            },
            indent=2,
        )
    )
    return 0 if integrity_ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
