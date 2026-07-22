#!/usr/bin/env python3
"""Record mint receipt for PSG-REL-20260722-STAGING-ALIGN-W0 at current HEAD.

Keeps registry active.git_sha = TRACK_HEAD (self-pin at deploy).
Writes evidence receipt with concrete HEAD for W0 Runtime Certification.

  python scripts/dev/run-psg-mint-staging-align-w0.py
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PIN = "PSG-REL-20260722-STAGING-ALIGN-W0"
VERSION_FILE = ROOT / "registry/psg-release-version-LATEST.yaml"
REALITY = ROOT / "evidence/PSG-REALITY-CLOSURE"


def git(*args: str) -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), *args], text=True).strip()


def main() -> int:
    if os.environ.get("ALLOW_HISTORICAL_STAGING_ALIGN_MINT") != "1":
        print(
            "mint-staging-align-w0: REFUSED — pin PSG-REL-20260722-STAGING-ALIGN-W0 is SUPERSEDED.\n"
            "Active pin = PSG-REL-20260720-WEB3-CAND-V2 @ tip 97289a71…\n"
            "Forensic only: ALLOW_HISTORICAL_STAGING_ALIGN_MINT=1",
            file=sys.stderr,
        )
        return 2
    sha = git("rev-parse", "HEAD")
    short = sha[:12]
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    recorded = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    text = VERSION_FILE.read_text(encoding="utf-8")
    if PIN not in text:
        print(f"mint: FAIL active pin missing {PIN}", file=sys.stderr)
        return 2
    text = re.sub(
        r'(^\s+recorded_utc:\s*)".*?"',
        rf'\1"{recorded}"',
        text,
        count=1,
        flags=re.M,
    )
    text = re.sub(
        r'(^\s+freeze:\s*).*$',
        r"\1CERTIFICATION_PIN_ACTIVE_TRACK_HEAD",
        text,
        count=1,
        flags=re.M,
    )
    VERSION_FILE.write_text(text, encoding="utf-8")

    REALITY.mkdir(parents=True, exist_ok=True)
    receipt = {
        "schema": "traveltrust.psg_release_mint.v1",
        "machine_key": "TT_PSG_RELEASE_MINT_STAGING_ALIGN_W0",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "registry_git_sha_mode": "TRACK_HEAD",
        "mint_head_git_sha": sha,
        "mint_head_git_sha_short": short,
        "supersedes": "PSG-REL-20260720-WEB3-CAND-V2",
        "purpose": "Reality-W0 Runtime Attestation + Canonical Deploy",
        "locked_until_reality_closure_pass": [
            "production_entry",
            "hard_gate_flip",
            "mainnet_wave",
            "production_go",
        ],
        "stamp": stamp,
    }
    out = REALITY / f"PSG-MINT-STAGING-ALIGN-W0-{stamp}.json"
    latest = REALITY / "PSG-MINT-STAGING-ALIGN-W0-LATEST.json"
    payload = json.dumps(receipt, indent=2, ensure_ascii=False) + "\n"
    out.write_text(payload, encoding="utf-8")
    latest.write_text(payload, encoding="utf-8")

    print(json.dumps({"minted": PIN, "mint_head": sha, "receipt": str(latest)}, indent=2))
    print("TT_PSG_RELEASE_MINT: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
