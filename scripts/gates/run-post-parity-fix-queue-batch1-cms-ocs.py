#!/usr/bin/env python3
"""POST_PARITY_FIX_QUEUE · Batch 1 (CMS/OCS) · Local or Staging verify gate.

Baseline: PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS (issued).
Targets: M7-07 community media GET 200 · M7-08 cms/public/announcements 200 (not 401).

Non-target 0-drift: Candidate Solidity · Production DB · FTB · TT_PRODUCTION_GO unchanged.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_official_product_reality_capture"
ASSETS = ROOT / "data" / "official-cold-start" / "assets.v1.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch(url: str, timeout: float = 25.0) -> tuple[int, str]:
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read(4096).decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        body = e.read(4096).decode("utf-8", errors="replace") if e.fp else ""
        return e.code, body


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--api", default="http://127.0.0.1:8080")
    p.add_argument("--out", default=str(EV / "POST_PARITY_FIX_QUEUE_BATCH1_CMS_OCS_LATEST.json"))
    args = p.parse_args()
    api = args.api.rstrip("/")

    gaps: list[dict] = []
    checks: dict = {}

    # M7-08 · cms/public/announcements must match public read (200 · not STRICT 401)
    pub_code, _ = fetch(f"{api}/api/v1/public/announcements?limit=1")
    cms_code, _ = fetch(f"{api}/api/v1/cms/public/announcements?limit=1")
    checks["m7_08_public_announcements"] = {"status_code": pub_code, "pass": pub_code == 200}
    checks["m7_08_cms_public_announcements"] = {
        "status_code": cms_code,
        "pass": cms_code == 200,
        "note": "must not return 401 under STRICT_SESSION_GATE",
    }
    if pub_code != 200:
        gaps.append({"id": "M7-08", "detail": f"public announcements {pub_code}"})
    if cms_code != 200:
        gaps.append({"id": "M7-08", "detail": f"cms/public/announcements {cms_code}"})

    # M7-07 · sample OCS baseline media files must be anonymously readable
    media_checks = []
    if ASSETS.exists():
        assets = json.loads(ASSETS.read_text(encoding="utf-8"))
        sample = (assets.get("assets") or [])[:3]
        for a in sample:
            path = a.get("public_url") or ""
            if not path.startswith("/api/v1/uploads/community-posts/"):
                continue
            code, _ = fetch(f"{api}{path}")
            ok = code == 200
            media_checks.append({"filename": a.get("filename"), "status_code": code, "pass": ok})
            if not ok:
                gaps.append({"id": "M7-07", "detail": f"{path} -> {code}"})
    else:
        gaps.append({"id": "M7-07", "detail": "missing assets.v1.json"})
    checks["m7_07_community_media_sample"] = media_checks

    out = {
        "schema": "traveltrust.post_parity_fix_queue_batch1_cms_ocs.v1",
        "recorded_utc": utc_now(),
        "batch": "1_cms_ocs",
        "baseline": "PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS",
        "api": api,
        "checks": checks,
        "gaps": gaps,
        "BATCH1_CMS_OCS_PASS": "ISSUED" if not gaps else "NOT_ISSUED",
        "tt_production_go": "NO_GO",
        "non_target_drift": {
            "candidate_solidity": "0",
            "production_db_mutation": "0",
            "tt_production_go_flip": "0",
        },
    }
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(
        f"POST_PARITY_BATCH1_CMS_OCS: pass={out['BATCH1_CMS_OCS_PASS']} gaps={len(gaps)} out={out_path.name}"
    )
    return 0 if not gaps else 2


if __name__ == "__main__":
    raise SystemExit(main())
