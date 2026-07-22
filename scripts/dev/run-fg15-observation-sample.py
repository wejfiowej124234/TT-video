#!/usr/bin/env python3
"""
FG-15 · Six-plane continuous sample (Chain/Indexer/API/DB/Error/Security).

Appends to observation ledger. Does not claim ELAPSED PASS.
Respects WINDOW FREEZE (Release_SHA / addresses immutable).
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
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
ARCH = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail"
LEDGER = (
    ROOT
    / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail/fg15_observation_48h/samples"
)
DEPLOY_YAML = ROOT / "registry/protocol-convergence-deployments.v1.yaml"
EXPECTED_SHA = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def load(name: str) -> dict:
    p = PENDING / name
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def http_get(url: str, timeout: float = 5.0) -> tuple[int, str]:
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except Exception as ex:  # noqa: BLE001
        return 0, str(ex)


def active_baseline() -> str:
    text = DEPLOY_YAML.read_text(encoding="utf-8")
    m = re.search(r"active_deploy_baseline:\s*([^\s#]+)", text)
    return m.group(1).strip() if m else "UNKNOWN"


def sample_planes(api_base: str, freeze: dict) -> tuple[dict, list]:
    anomalies: list[dict] = []
    frozen_addrs = (freeze.get("frozen") or {}).get("contract_addresses") or {}
    hardened = load("FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json")
    addrs = hardened.get("addresses") or {}

    # Chain — addresses must match freeze
    chain_ok = True
    for k in ("escrowFactory", "settlementRouter", "feeRouter"):
        if frozen_addrs.get(k) and addrs.get(k) and frozen_addrs[k].lower() != str(addrs[k]).lower():
            chain_ok = False
            anomalies.append({"plane": "Chain", "id": f"ADDR_DRIFT_{k}", "detail": k})
    if active_baseline() != "v311_sepolia_clean_baseline":
        chain_ok = False
        anomalies.append({"plane": "Chain", "id": "ACTIVE_BASELINE_DRIFT", "detail": active_baseline()})

    planes = {
        "Chain": {
            "ok": chain_ok,
            "escrowFactory": addrs.get("escrowFactory"),
            "settlementRouter": addrs.get("settlementRouter"),
            "active_deploy_baseline": active_baseline(),
        }
    }

    # Indexer
    idx_ok = (ROOT / "scripts/ops/internal-indexer-ops.sh").is_file()
    planes["Indexer"] = {
        "ok": idx_ok,
        "ops_script": idx_ok,
        "state_present": (ROOT / "data/indexer_state.json").is_file()
        or (ROOT / "data/indexer_state.json.runtime").is_file(),
    }
    if not idx_ok:
        anomalies.append({"plane": "Indexer", "id": "INDEXER_OPS_MISSING"})

    # API
    code, _ = http_get(f"{api_base.rstrip('/')}/health")
    meta_code, _ = http_get(f"{api_base.rstrip('/')}/api/v1/meta")
    api_ok = code == 200
    planes["API"] = {
        "ok": api_ok,
        "health_http": code,
        "meta_http": meta_code,
        "meta_reachable": meta_code in (200, 401, 403),
    }
    if not api_ok:
        anomalies.append({"plane": "API", "id": "HEALTH_NOT_200", "http": code})

    # DB
    db_url = os.environ.get("DATABASE_URL")
    if not db_url and (ROOT / ".env").is_file():
        for line in (ROOT / ".env").read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("DATABASE_URL="):
                db_url = line.split("=", 1)[1].strip().strip('"')
                break
    db_ok = bool(db_url)
    planes["DB"] = {"ok": db_ok, "database_url_configured": db_ok}
    if not db_ok:
        anomalies.append({"plane": "DB", "id": "DATABASE_URL_MISSING"})

    # Error surface
    err_ok = (ROOT / "docs/runbook/TT-OPS-INCIDENT-CONTACT-AND-WINDOW-LATEST.md").is_file()
    planes["Error"] = {"ok": err_ok, "incident_contact_present": err_ok}
    if not err_ok:
        anomalies.append({"plane": "Error", "id": "INCIDENT_CONTACT_MISSING"})

    # Security
    admin = ROOT / "crates/api/src/routes/admin/mod.rs"
    admin_t = admin.read_text(encoding="utf-8", errors="replace") if admin.is_file() else ""
    sec_ok = "write_admin_audit_log_best_effort" in admin_t
    planes["Security_Events"] = {"ok": sec_ok, "audit_path_present": sec_ok}
    if not sec_ok:
        anomalies.append({"plane": "Security_Events", "id": "AUDIT_PATH_MISSING"})

    return planes, anomalies


def main() -> int:
    stamp_dt = utc_now()
    stamp = iso(stamp_dt)
    api_base = os.environ.get("API_BASE") or "http://127.0.0.1:8080"

    freeze = load("OBSERVATION-48H-WINDOW-FREEZE-LATEST.json")
    start = load("OBSERVATION-48H-START-LATEST.json")
    if not freeze:
        raise SystemExit("missing OBSERVATION-48H-WINDOW-FREEZE-LATEST.json — run freeze first")
    if freeze.get("Release_SHA") != EXPECTED_SHA:
        raise SystemExit("freeze Release_SHA mismatch — refuse sample")
    if start.get("status") not in ("RUNNING", "STARTED_IN_PROGRESS"):
        raise SystemExit(f"window not RUNNING ({start.get('status')})")

    # Refuse sampling after soft-close only if elapsed already claimed
    elapsed = load("OBSERVATION-48H-ELAPSED-PASS-LATEST.json")
    if elapsed.get("elapsed_pass"):
        raise SystemExit("window already ELAPSED PASS — sampling closed")

    planes, anomalies = sample_planes(api_base, freeze)
    sample_ok = all(p.get("ok") for p in planes.values()) and len(anomalies) == 0

    sample = {
        "schema": "traveltrust.fg15_observation_sample.v1",
        "recorded_utc": stamp,
        "Release_SHA": EXPECTED_SHA,
        "window_started_utc": start.get("window_started_utc"),
        "window_ends_utc": start.get("window_ends_utc"),
        "planes": planes,
        "anomalies": anomalies,
        "sample_ok": sample_ok,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
    }

    LEDGER.mkdir(parents=True, exist_ok=True)
    # Unique per call even within the same UTC second
    sample_name = f"sample-{stamp.replace(':', '')}-{stamp_dt.strftime('%f')}.json"
    (LEDGER / sample_name).write_text(
        json.dumps(sample, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # Rolling latest + append-only jsonl
    latest = {
        "schema": "traveltrust.fg15_observation_sample_latest.v1",
        "recorded_utc": stamp,
        "sample_rel": f"audit_trail/fg15_observation_48h/samples/{sample_name}",
        "sample_ok": sample_ok,
        "anomaly_count": len(anomalies),
        "planes_ok": {k: v.get("ok") for k, v in planes.items()},
        "window_status": "RUNNING",
        "window_ends_utc": start.get("window_ends_utc"),
        "Release_SHA": EXPECTED_SHA,
        "ACTIVE_FLIP": "FORBIDDEN",
        "verdict": "FG15_SAMPLE_OK" if sample_ok else "FG15_SAMPLE_ANOMALY",
    }
    lt = json.dumps(latest, indent=2, ensure_ascii=False) + "\n"
    (PENDING / "OBSERVATION-48H-SAMPLE-LATEST.json").write_text(lt, encoding="utf-8")
    (FG / "OBSERVATION-48H-SAMPLE-LATEST.json").write_text(lt, encoding="utf-8")

    jsonl = (
        ARCH
        / "fg15_observation_48h"
        / "OBSERVATION-48H-SAMPLES.jsonl"
    )
    with jsonl.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"recorded_utc": stamp, "sample_ok": sample_ok, "anomalies": anomalies}) + "\n")

    if anomalies:
        anom_path = ARCH / "fg15_observation_48h" / "OBSERVATION-48H-ANOMALY-LEDGER.jsonl"
        with anom_path.open("a", encoding="utf-8") as f:
            for a in anomalies:
                f.write(json.dumps({"recorded_utc": stamp, **a}) + "\n")

    # Status heartbeat
    status = {
        "schema": "traveltrust.fg15_observation_running_status.v1",
        "recorded_utc": stamp,
        "window_status": "RUNNING",
        "Release_SHA": EXPECTED_SHA,
        "window_started_utc": start.get("window_started_utc"),
        "window_ends_utc": start.get("window_ends_utc"),
        "last_sample_ok": sample_ok,
        "last_anomaly_count": len(anomalies),
        "elapsed_pass": False,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "verdict": "FG15_OBSERVATION_WINDOW_RUNNING",
    }
    st = json.dumps(status, indent=2, ensure_ascii=False) + "\n"
    (PENDING / "OBSERVATION-48H-RUNNING-STATUS-LATEST.json").write_text(st, encoding="utf-8")
    (FG / "OBSERVATION-48H-RUNNING-STATUS-LATEST.json").write_text(st, encoding="utf-8")

    print(json.dumps({"sample_ok": sample_ok, "anomalies": len(anomalies), "stamp": stamp}, indent=2))
    return 0 if sample_ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
