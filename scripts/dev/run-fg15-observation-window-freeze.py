#!/usr/bin/env python3
"""
FG-15 Observation Window · FREEZE lock.

Freezes for the running window:
  Release_SHA · contract addresses · config pointers · evidence baseline

Does NOT: flip ACTIVE, Production GO, or claim FG-15 ELAPSED PASS.
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
import hashlib
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
ARCH = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail"
DEPLOY_YAML = ROOT / "registry/protocol-convergence-deployments.v1.yaml"

EXPECTED_SHA = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load(name: str) -> dict:
    p = PENDING / name
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def sha256_file(p: Path) -> str | None:
    if not p.is_file():
        return None
    h = hashlib.sha256()
    h.update(p.read_bytes())
    return h.hexdigest()


def active_baseline() -> str:
    text = DEPLOY_YAML.read_text(encoding="utf-8")
    m = re.search(r"active_deploy_baseline:\s*([^\s#]+)", text)
    return m.group(1).strip() if m else "UNKNOWN"


def main() -> int:
    stamp = utc_now()
    start = load("OBSERVATION-48H-START-LATEST.json")
    pin = load("FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json") or load(
        "CDR-19-RELEASE-SHA-PIN-LATEST.json"
    )
    bind = load("FINAL-COMPLETION-EQUIVALENCE-BINDING-LATEST.json") or load(
        "CDR-19-EQUIVALENCE-BINDING-LATEST.json"
    )
    hardened = load("FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json")
    baseline = load("OBSERVATION-48H-BASELINE-EVIDENCE-LATEST.json")

    release_sha = pin.get("Release_SHA") or start.get("Release_SHA")
    if release_sha != EXPECTED_SHA:
        raise SystemExit(
            f"REFUSE freeze: Release_SHA {release_sha} != expected {EXPECTED_SHA}"
        )
    if start.get("status") not in ("STARTED_IN_PROGRESS", "RUNNING"):
        raise SystemExit(f"REFUSE freeze: observation not started ({start.get('status')})")

    addrs = hardened.get("addresses") or {}
    freeze = {
        "schema": "traveltrust.fg15_observation_window_freeze.v1",
        "recorded_utc": stamp,
        "status": "FROZEN_IMMUTABLE_DURING_WINDOW",
        "window_status": "RUNNING",
        "window_started_utc": start.get("window_started_utc"),
        "window_ends_utc": start.get("window_ends_utc"),
        "Release_SHA": release_sha,
        "Release_SHA_short": release_sha[:12],
        "frozen": {
            "release_identity": {
                "Release_SHA": release_sha,
                "Source_SHA": bind.get("Source_SHA"),
                "Deploy_Artifact_bundle_sha256": (bind.get("Deploy_Artifact") or {}).get(
                    "bundle_sha256"
                ),
                "Evidence_Package_bundle_sha256": (bind.get("Evidence_Package") or {}).get(
                    "bundle_sha256"
                ),
                "binding_status": bind.get("status"),
            },
            "contract_addresses": {
                "chain_id": hardened.get("chain_id") or 11155111,
                "escrowFactory": addrs.get("escrowFactory"),
                "settlementRouter": addrs.get("settlementRouter"),
                "feeRouter": addrs.get("feeRouter"),
                "projectRevenuePool": addrs.get("projectRevenuePool"),
                "founderBootstrap": addrs.get("founderBootstrap"),
                "ownerOrTimelock": addrs.get("ownerOrTimelock")
                or hardened.get("owner_or_timelock"),
                "bind_artifact": "FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json",
                "note": "Hardened = DEPLOYED_BOUND_NOT_ACTIVE · ACTIVE stays v311",
            },
            "config": {
                "active_deploy_baseline": active_baseline(),
                "ACTIVE_FLIP": "FORBIDDEN",
                "production_go": False,
                "deployments_yaml_sha256": sha256_file(DEPLOY_YAML),
            },
            "evidence_baseline": {
                "artifact": "OBSERVATION-48H-BASELINE-EVIDENCE-LATEST.json",
                "baseline_pass": baseline.get("baseline_pass"),
                "baseline_sha256": sha256_file(PENDING / "OBSERVATION-48H-BASELINE-EVIDENCE-LATEST.json"),
                "planes": baseline.get("planes") and list(baseline["planes"].keys()),
            },
        },
        "mutation_policy": {
            "allowed_during_window": [
                "six_plane_sample_appends",
                "anomaly_ledger_appends",
                "heartbeat_status_refresh",
            ],
            "forbidden_during_window": [
                "Release_SHA_change",
                "contract_address_rebind",
                "ACTIVE_baseline_flip",
                "Production_GO",
                "FG15_ELAPSED_PASS_before_ends_utc",
                "baseline_rewrite",
            ],
        },
        "honesty": {
            "freeze_is_not_fg15_pass": True,
            "running_is_not_elapsed": True,
        },
        "verdict": "FG15_OBSERVATION_WINDOW_FROZEN_RUNNING",
    }

    text = json.dumps(freeze, indent=2, ensure_ascii=False) + "\n"
    out = PENDING / "OBSERVATION-48H-WINDOW-FREEZE-LATEST.json"
    out.write_text(text, encoding="utf-8")
    (FG / out.name).write_text(text, encoding="utf-8")

    # Mark start as RUNNING (same window bounds)
    start2 = dict(start)
    start2["status"] = "RUNNING"
    start2["window_frozen_utc"] = stamp
    start2["freeze_artifact"] = "OBSERVATION-48H-WINDOW-FREEZE-LATEST.json"
    start2["verdict"] = "FG15_48H_OBSERVATION_RUNNING"
    st = json.dumps(start2, indent=2, ensure_ascii=False) + "\n"
    (PENDING / "OBSERVATION-48H-START-LATEST.json").write_text(st, encoding="utf-8")
    (FG / "OBSERVATION-48H-START-LATEST.json").write_text(st, encoding="utf-8")

    rem = ARCH / "fg15_observation_48h"
    rem.mkdir(parents=True, exist_ok=True)
    (rem / out.name).write_text(text, encoding="utf-8")
    shutil.copy2(PENDING / "OBSERVATION-48H-START-LATEST.json", rem / "OBSERVATION-48H-START-LATEST.json")

    print(
        json.dumps(
            {
                "status": "RUNNING",
                "Release_SHA": release_sha[:12],
                "ends": start.get("window_ends_utc"),
                "verdict": freeze["verdict"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
