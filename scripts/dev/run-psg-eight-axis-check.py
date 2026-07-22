#!/usr/bin/env python3
"""PSG Eight-Axis Consistency Check · enhanced report (observation / prep).

Axes:
  1 PSG Version  2 Git  3 Artifact  4 Image Digest
  5 Runtime /meta  6 Contract  7 DB Baseline  8 CMS Baseline (+ Evidence)

  python scripts/dev/run-psg-eight-axis-check.py
  python scripts/dev/run-psg-eight-axis-check.py --env staging

Does NOT deploy. FG-15: expect FAIL/DRIFT until post-ELAPSED rebuild.

SSOT: docs/runbook/TT-PSG-CLOSURE-PREP-LATEST.md
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
    if not a or not b or a in ("unknown", "none") or b in ("unknown", "none"):
        return False
    return a == b or a[:12] == b[:12] or a.startswith(b[:12]) or b.startswith(a[:12])


def extract_ri(payload: dict) -> dict:
    if not isinstance(payload, dict):
        return {}
    if "psg_release_version" in payload:
        return payload
    build = payload.get("build") if isinstance(payload.get("build"), dict) else {}
    return {
        "psg_release_version": build.get("psg_release_version"),
        "git_sha": build.get("git_sha"),
        "artifact_sha": build.get("artifact_sha"),
        "image_digest": build.get("image_digest"),
        "attestation_status": build.get("attestation_status"),
        "contract_profile": build.get("contract_profile"),
        "database_baseline": build.get("database_baseline"),
        "cms_baseline": build.get("cms_baseline"),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--env", default="staging", choices=["staging", "local"])
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    active = parse_active(VERSION_FILE.read_text(encoding="utf-8")) if VERSION_FILE.exists() else {}
    psg_ver = active.get("psg_release_version", FROZEN_VER)
    psg_sha = active.get("git_sha", FROZEN_SHA)
    db_pin = active.get("database_baseline", "")
    cms_pin = active.get("cms_baseline", "")
    artifact_env = os.environ.get("TT_ARTIFACT_SHA") or active.get("artifact_sha", "")

    axes: dict[str, dict] = {}
    fails: list[str] = []

    # 1 PSG
    pin_ok = psg_ver == FROZEN_VER and psg_sha == FROZEN_SHA
    axes["1_psg_version"] = {"value": psg_ver, "git_sha": psg_sha, "ok": pin_ok}
    if not pin_ok:
        fails.append("psg_pin")

    # 2 Git
    tip = dirty = None
    try:
        tip = git("rev-parse", "HEAD")
        dirty = bool(git("status", "--porcelain"))
        git_ok = sha_match(tip, psg_sha) and not dirty
        axes["2_git"] = {"value": tip, "dirty": dirty, "ok": git_ok, "note": "dirty living tip OK during FG-15 prep"}
        if not git_ok:
            fails.append("git")
    except Exception as ex:  # noqa: BLE001
        axes["2_git"] = {"ok": False, "error": str(ex)}
        fails.append("git")

    # 3 Artifact
    art = artifact_env if artifact_env and "PINNED" not in artifact_env.upper() else (tip or "")
    art_ok = bool(art) and sha_match(art, psg_sha)
    axes["3_artifact"] = {
        "value": art or "(undeclared)",
        "ok": art_ok,
        "note": "real artifact hash required at canonical deploy",
    }
    if not art_ok:
        fails.append("artifact")

    # 6 Contract (before runtime so local mode still fills)
    dep = DEP_FILE.read_text(encoding="utf-8") if DEP_FILE.exists() else ""
    m = re.search(r"^web3_mainline_baseline:\s*(\S+)", dep, re.M) or re.search(r"^active_deploy_baseline:\s*(\S+)", dep, re.M)
    cname = m.group(1).strip().strip("\"'") if m else ""
    contract_ok = cname in ("v311_fund_safety_candidate_v2", "v311_sepolia_clean_baseline")
    axes["6_contract"] = {"value": cname, "ok": contract_ok}
    if not contract_ok:
        fails.append("contract")

    # 7 DB · 8 CMS
    axes["7_db_baseline"] = {"value": db_pin or "(undeclared)", "ok": bool(db_pin)}
    axes["8_cms_baseline"] = {"value": cms_pin or "(undeclared)", "ok": bool(cms_pin)}
    if not db_pin:
        fails.append("db_baseline")
    if not cms_pin:
        fails.append("cms_baseline")

    # 4 Image · 5 Runtime
    if args.env == "staging":
        api = os.environ.get("STAGING_API_BASE") or DEFAULT_API
        web = os.environ.get("STAGING_WEB_BASE") or DEFAULT_WEB
        code, data = http_json(api.rstrip("/") + "/meta/release-identity")
        if code != 200:
            code, data = http_json(api.rstrip("/") + "/meta")
        api_ri = extract_ri(data if isinstance(data, dict) else {})
        digest = str(api_ri.get("image_digest") or "")
        img_ok = digest not in ("", "unknown", "None") and api_ri.get("attestation_status") == "ok"
        axes["4_image_digest"] = {"value": digest or "(undeclared)", "source": "api", "ok": img_ok}
        if not img_ok:
            fails.append("image")

        runtime_ok = (
            code == 200
            and api_ri.get("psg_release_version") == psg_ver
            and sha_match(str(api_ri.get("git_sha") or ""), psg_sha)
            and api_ri.get("attestation_status") == "ok"
        )
        wcode, wdata = http_json(web.rstrip("/") + "/api/release-identity")
        web_ri = extract_ri(wdata if isinstance(wdata, dict) else {})
        web_ok = wcode == 200 and web_ri.get("attestation_status") == "ok"
        axes["5_runtime_meta"] = {
            "api_http": code,
            "api": api_ri,
            "web_http": wcode,
            "web": web_ri,
            "ok": runtime_ok and web_ok,
        }
        if not (runtime_ok and web_ok):
            fails.append("runtime_meta")
    else:
        axes["4_image_digest"] = {"ok": False, "note": "skipped (--env local)"}
        axes["5_runtime_meta"] = {"ok": False, "note": "skipped (--env local)"}
        fails.extend(["image", "runtime_meta"])

    # Evidence presence
    axes["evidence_pin"] = {"ok": VERSION_FILE.exists(), "path": str(VERSION_FILE)}
    if not VERSION_FILE.exists():
        fails.append("evidence")

    verdict = "EIGHT_AXIS_PASS" if not fails else "EIGHT_AXIS_FAIL"
    report = {
        "schema": "traveltrust.psg_eight_axis_check.v1",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "env": args.env,
        "active_psg": {"psg_release_version": psg_ver, "git_sha": psg_sha},
        "axes": axes,
        "failed_axes": fails,
        "verdict": verdict,
        "machine_key": "TT_PSG_EIGHT_AXIS_CHECK",
        "fg15_note": "Observation freeze: do not fix Staging Drift; expect FAIL until post-ELAPSED rebuild",
        "deploy_executed": False,
    }

    out = args.out
    if not out:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out_dir = ROOT / "evidence/GO_psg_closure_prep" / stamp
        out_dir.mkdir(parents=True, exist_ok=True)
        out = str(out_dir / "EIGHT-AXIS-CHECK-LATEST.json")
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"verdict": verdict, "failed_axes": fails, "out": out}, indent=2))
    print(f"TT_PSG_EIGHT_AXIS_CHECK: {verdict}")
    # Prep mode: exit 0 even on FAIL unless TT_EIGHT_AXIS_FAIL=1
    if fails and os.environ.get("TT_EIGHT_AXIS_FAIL") == "1":
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
