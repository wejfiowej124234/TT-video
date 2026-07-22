#!/usr/bin/env python3
"""PSG Active Runtime Drift Scanner · continuous eight-axis compare.

Compares Active PSG Version against:
  Git · Fly Web · Fly API · Contract pin · DB baseline · CMS baseline

Output: NO_DRIFT | DRIFT DETECTED

  python scripts/dev/run-psg-runtime-drift-scanner.py
  python scripts/dev/run-psg-runtime-drift-scanner.py --env staging

FG-15: expect DRIFT DETECTED until first canonical redeploy injects attestation.
Do not redeploy during FG-15 — scanner is evidence only.

SSOT: docs/runbook/TT-PSG-RUNTIME-ATTESTATION-LATEST.md
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERSION_FILE = ROOT / "registry/psg-release-version-LATEST.yaml"
DEP_FILE = ROOT / "registry/protocol-convergence-deployments.v1.yaml"
DEFAULT_API = "https://tt-api-staging.fly.dev"
DEFAULT_WEB = "https://tt-web-staging.fly.dev"
FROZEN_VER_ARCHIVED = "PSG-REL-20260719-FG15-09c72b93"  # FG-15-A HISTORICAL
FROZEN_VER = "PSG-REL-20260720-WEB3-CAND-V2"  # ACTIVE Web3 candidate
FROZEN_SHA_ARCHIVED = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"
FROZEN_SHA = "97289a7185610ef0ad8822f0af04bfa533e42986"  # FINAL RELEASE tip · Candidate v2


def git(*args: str) -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), *args], text=True).strip()


def parse_active(text: str) -> dict[str, str]:
    active: dict[str, str] = {}
    in_active = False
    for line in text.splitlines():
        if re.match(r"^active:\s*$", line):
            in_active = True
            continue
        if in_active and re.match(r"^[a-zA-Z_]", line) and not line.startswith(" "):
            break
        if not in_active:
            continue
        m = re.match(r"^\s{2}([a-z0-9_]+):\s*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip().strip("\"'")
        if not val.startswith(">"):
            active[key] = val
    return active


def http_json(url: str, timeout: int = 25):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:800]
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_raw": body}
    except Exception as ex:  # noqa: BLE001
        return 0, {"_error": str(ex)}


def sha_match(a: str, b: str) -> bool:
    a = (a or "").strip().lower()
    b = (b or "").strip().lower()
    if not a or not b or a == "unknown" or b == "unknown":
        return False
    return a == b or a[:12] == b[:12] or a.startswith(b[:12]) or b.startswith(a[:12])


def extract_ri(payload: dict) -> dict:
    if not isinstance(payload, dict):
        return {}
    if "psg_release_version" in payload and "git_sha" in payload:
        return payload
    build = payload.get("build") if isinstance(payload.get("build"), dict) else {}
    return {
        "psg_release_version": build.get("psg_release_version"),
        "git_sha": build.get("git_sha"),
        "image_digest": build.get("image_digest"),
        "attestation_status": build.get("attestation_status"),
        "contract_profile": build.get("contract_profile"),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--env", default="staging", choices=["staging", "local"])
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    active = parse_active(VERSION_FILE.read_text(encoding="utf-8")) if VERSION_FILE.exists() else {}
    psg_ver = active.get("psg_release_version", FROZEN_VER)
    psg_sha = active.get("git_sha", FROZEN_SHA)
    db_base = active.get("database_baseline", "")
    cms_base = active.get("cms_baseline", "")

    axes: dict[str, dict] = {}
    drifts: list[str] = []

    # 1 PSG pin
    pin_ok = psg_ver == FROZEN_VER and psg_sha == FROZEN_SHA
    axes["psg_version"] = {"value": psg_ver, "git_sha": psg_sha, "ok": pin_ok}
    if not pin_ok:
        drifts.append("psg_pin_mutated")

    # 2 Git (observation: living tip may differ during FG-15 capability land)
    try:
        tip = git("rev-parse", "HEAD")
        dirty = bool(git("status", "--porcelain"))
        git_match = sha_match(tip, psg_sha) and not dirty
        axes["git"] = {"value": tip, "dirty": dirty, "matches_psg": git_match, "ok": True}
        if not git_match:
            drifts.append("git_tip_ne_psg")  # expected during FG-15 living work
    except Exception as ex:  # noqa: BLE001
        axes["git"] = {"ok": False, "error": str(ex)}
        drifts.append("git_unreadable")

    # 3 Contract
    dep = DEP_FILE.read_text(encoding="utf-8") if DEP_FILE.exists() else ""
    active_base = re.search(r"^web3_mainline_baseline:\s*(\S+)", dep, re.M) or re.search(r"^active_deploy_baseline:\s*(\S+)", dep, re.M)
    name = active_base.group(1).strip().strip("\"'") if active_base else ""
    contract_ok = name in ("v311_fund_safety_candidate_v2", "v311_sepolia_clean_baseline")  # prefer candidate; historical ok for archive compare
    axes["contract"] = {"value": name, "ok": contract_ok}
    if not contract_ok:
        drifts.append("contract_baseline")

    # 4 DB / 5 CMS baselines (declared in pin)
    axes["db_baseline"] = {"value": db_base or "(undeclared)", "ok": bool(db_base)}
    axes["cms_baseline"] = {"value": cms_base or "(undeclared)", "ok": bool(cms_base)}
    if not db_base:
        drifts.append("db_baseline_undeclared")
    if not cms_base:
        drifts.append("cms_baseline_undeclared")

    # 6 Fly API · 7 Fly Web
    if args.env == "staging":
        api = os.environ.get("STAGING_API_BASE") or DEFAULT_API
        web = os.environ.get("STAGING_WEB_BASE") or DEFAULT_WEB
        code, data = http_json(api.rstrip("/") + "/meta/release-identity")
        if code != 200:
            code, data = http_json(api.rstrip("/") + "/meta")
        api_ri = extract_ri(data if isinstance(data, dict) else {})
        api_ok = (
            code == 200
            and api_ri.get("attestation_status") == "ok"
            and api_ri.get("psg_release_version") == psg_ver
            and sha_match(str(api_ri.get("git_sha") or ""), psg_sha)
            and str(api_ri.get("image_digest") or "") not in ("", "unknown", "None")
        )
        axes["fly_api"] = {"http": code, "release_identity": api_ri, "ok": api_ok}
        if not api_ok:
            drifts.append("fly_api")

        wcode, wdata = http_json(web.rstrip("/") + "/api/release-identity")
        web_ri = extract_ri(wdata if isinstance(wdata, dict) else {})
        web_ok = (
            wcode == 200
            and web_ri.get("attestation_status") == "ok"
            and web_ri.get("psg_release_version") == psg_ver
            and sha_match(str(web_ri.get("git_sha") or ""), psg_sha)
            and str(web_ri.get("image_digest") or "") not in ("", "unknown", "None")
        )
        axes["fly_web"] = {"http": wcode, "release_identity": web_ri, "ok": web_ok}
        if not web_ok:
            drifts.append("fly_web")

    # Evidence axis: pin file present
    axes["evidence_pin"] = {"path": str(VERSION_FILE), "ok": VERSION_FILE.exists()}
    if not VERSION_FILE.exists():
        drifts.append("evidence_pin")

    # During FG-15, classify drifts to avoid false defect claims
    classification = {}
    for d in drifts:
        if d in ("git_tip_ne_psg", "fly_api", "fly_web"):
            classification[d] = "EXPECTED_WAIT_WINDOW_DRIFT"
        elif d in ("db_baseline_undeclared", "cms_baseline_undeclared"):
            classification[d] = "PREP_GAP"
        else:
            classification[d] = "NEEDS_REVIEW"
    # Honest overall: any axis mismatch including living tip = DRIFT DETECTED
    verdict = "NO_DRIFT" if not drifts else "DRIFT DETECTED"
    not_a_defect = all(
        classification.get(d) == "EXPECTED_WAIT_WINDOW_DRIFT" for d in drifts
    ) and bool(drifts)

    report = {
        "schema": "traveltrust.psg_runtime_drift_scanner.v1",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "env": args.env,
        "active_psg": {"psg_release_version": psg_ver, "git_sha": psg_sha},
        "axes": axes,
        "drifts": drifts,
        "runtime_drifts": runtime_drifts,
        "classification": classification,
        "not_a_defect": not_a_defect,
        "verdict": verdict,
        "machine_key": "TT_PSG_RUNTIME_DRIFT",
        "rule": "PSG Version must equal Git · Fly Web · Fly API · Contract · DB · CMS · Evidence",
        "fg15_note": (
            "EXPECTED_WAIT_WINDOW_DRIFT is observation noise during FG-15 STANDBY — "
            "NOT_A_DEFECT; do not fix-deploy. Clear only after ELAPSED rebuild."
        ),
    }

    out = args.out
    if not out:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out_dir = ROOT / "evidence/GO_psg_runtime_attestation" / stamp
        out_dir.mkdir(parents=True, exist_ok=True)
        out = str(out_dir / "RUNTIME-DRIFT-SCANNER-LATEST.json")
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps({"verdict": verdict, "drifts": drifts, "out": out}, indent=2))
    print(f"TT_PSG_RUNTIME_DRIFT: {verdict}")
    # Scanner always exits 0 on DRIFT during FG-15 (observation); set TT_DRIFT_FAIL=1 to hard-fail
    if drifts and os.environ.get("TT_DRIFT_FAIL") == "1":
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
