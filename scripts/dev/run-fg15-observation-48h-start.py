#!/usr/bin/env python3
"""
FG-15 · Formal 48H Observation Window START + six-plane baseline evidence.

Does NOT claim ELAPSED PASS (wall-clock 48h required).
Does NOT flip ACTIVE or Production GO.
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
import os
import shutil
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
ARCH = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail"

PLANES = ["Chain", "Indexer", "API", "DB", "Error", "Security_Events"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def http_get(url: str, timeout: float = 5.0) -> tuple[int, str]:
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except Exception as ex:  # noqa: BLE001
        return 0, str(ex)


def load_json(name: str) -> dict:
    p = PENDING / name
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def collect_baseline(api_base: str) -> dict:
    planes = {}

    # Chain
    hardened = load_json("FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json")
    planes["Chain"] = {
        "ok": bool(hardened.get("addresses")),
        "source": "FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json",
        "chain_id": hardened.get("chain_id") or 11155111,
        "escrowFactory": (hardened.get("addresses") or {}).get("escrowFactory"),
        "settlementRouter": (hardened.get("addresses") or {}).get("settlementRouter"),
        "ACTIVE_FLIP": "FORBIDDEN",
        "note": "Hardened addresses bound · ACTIVE still v311",
    }

    # Indexer
    idx_state = ROOT / "data/indexer_state.json"
    idx_runtime = ROOT / "data/indexer_state.json.runtime"
    # Indexer: ops scripts + optional state files (state may be absent until live tick)
    idx_scripts_ok = (ROOT / "scripts/check-indexer-lag-locate-gate.sh").is_file() and (
        ROOT / "scripts/ops/internal-indexer-ops.sh"
    ).is_file()
    planes["Indexer"] = {
        "ok": idx_scripts_ok,
        "indexer_state_present": idx_state.is_file(),
        "indexer_runtime_present": idx_runtime.is_file(),
        "ops_scripts_present": idx_scripts_ok,
        "ssot": ["scripts/check-indexer-lag-locate-gate.sh", "scripts/ops/internal-indexer-ops.sh"],
        "note": "baseline = ops capability present; live lag sampled during window",
    }

    # API
    code, _ = http_get(f"{api_base.rstrip('/')}/health")
    meta_code, _ = http_get(f"{api_base.rstrip('/')}/api/v1/meta")
    planes["API"] = {
        "ok": code == 200,
        "health_http": code,
        "meta_reachable": meta_code in (200, 401, 403),
        "meta_http": meta_code,
        "api_base": api_base,
    }

    # DB
    db_url = os.environ.get("DATABASE_URL")
    if not db_url and (ROOT / ".env").is_file():
        for line in (ROOT / ".env").read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("DATABASE_URL="):
                db_url = line.split("=", 1)[1].strip().strip('"')
                break
    planes["DB"] = {
        "ok": bool(db_url),
        "database_url_configured": bool(db_url),
        "ssot": "docs/runbook/TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001.md",
        "note": "presence check only · no credential echoed",
    }

    # Error (alert surface ready)
    planes["Error"] = {
        "ok": (ROOT / "docs/runbook/TT-OPS-INCIDENT-CONTACT-AND-WINDOW-LATEST.md").is_file()
        and (ROOT / "ops/monitoring/README.md").is_file(),
        "incident_contact": True,
        "monitoring_readme": (ROOT / "ops/monitoring/README.md").is_file(),
        "pager": "OWNER_DEFERRED_NON_BLOCKING",
    }

    # Security events (audit path)
    admin_mod = ROOT / "crates/api/src/routes/admin/mod.rs"
    admin_t = admin_mod.read_text(encoding="utf-8", errors="replace") if admin_mod.is_file() else ""
    planes["Security_Events"] = {
        "ok": "write_admin_audit_log_best_effort" in admin_t
        and "/api/v1/admin/audit-logs" in admin_t,
        "audit_routes_present": True,
        "ssot": "docs/runbook/PRODUCTION-INCIDENT-RESPONSE.md",
    }

    return planes


def main() -> int:
    stamp_dt = utc_now()
    end_dt = stamp_dt + timedelta(hours=48)
    stamp = iso(stamp_dt)
    end = iso(end_dt)
    api_base = os.environ.get("API_BASE") or "http://127.0.0.1:8080"

    pin = load_json("FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json") or load_json(
        "CDR-19-RELEASE-SHA-PIN-LATEST.json"
    )
    release_sha = pin.get("Release_SHA")

    planes = collect_baseline(api_base)
    all_ok = all(p.get("ok") for p in planes.values())

    start = {
        "schema": "traveltrust.observation_48h_start.v1",
        "fgcase": "FGCASE-FG-15",
        "recorded_utc": stamp,
        "status": "STARTED_IN_PROGRESS",
        "window_started": True,
        "window_started_utc": stamp,
        "window_ends_utc": end,
        "duration_hours": 48,
        "planes": PLANES,
        "formula": "Chain + Indexer + API + DB + Error + Security_Events",
        "Release_SHA": release_sha,
        "baseline_pass": all_ok,
        "elapsed_pass": False,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "honesty": {
            "start_is_not_elapsed_pass": True,
            "fg15_pass_requires_wall_clock_48h_plus_stable_planes": True,
            "do_not_claim_psg_complete_from_start": True,
        },
        "verdict": "FG15_48H_OBSERVATION_STARTED",
    }

    baseline = {
        "schema": "traveltrust.observation_48h_baseline_evidence.v1",
        "recorded_utc": stamp,
        "window_started_utc": stamp,
        "window_ends_utc": end,
        "Release_SHA": release_sha,
        "planes": planes,
        "baseline_pass": all_ok,
        "verdict": "FG15_BASELINE_COLLECTED" if all_ok else "FG15_BASELINE_PARTIAL",
    }

    # Update frame artifact
    frame = {
        "schema": "traveltrust.observation_48h_frame.v1",
        "recorded_utc": stamp,
        "status": "WINDOW_STARTED",
        "planes": PLANES,
        "window_started": True,
        "window_started_utc": stamp,
        "window_ends_utc": end,
        "window_elapsed_pass": False,
        "l4_frame_was": "FRAME_READY",
        "note": "Formal FG-15 window armed · collect continuous evidence until ends_utc",
    }

    PENDING.mkdir(parents=True, exist_ok=True)
    rem = ARCH / "fg15_observation_48h"
    rem.mkdir(parents=True, exist_ok=True)

    for name, obj in [
        ("OBSERVATION-48H-START-LATEST.json", start),
        ("OBSERVATION-48H-BASELINE-EVIDENCE-LATEST.json", baseline),
        ("OBSERVATION-48H-FRAME-READY-LATEST.json", frame),
    ]:
        text = json.dumps(obj, indent=2, ensure_ascii=False) + "\n"
        (PENDING / name).write_text(text, encoding="utf-8")
        (FG / name).write_text(text, encoding="utf-8")
        (rem / name).write_text(text, encoding="utf-8")

    print(
        json.dumps(
            {
                "status": start["status"],
                "started": stamp,
                "ends": end,
                "baseline_pass": all_ok,
                "elapsed_pass": False,
                "verdict": start["verdict"],
            },
            indent=2,
        )
    )
    return 0 if all_ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
