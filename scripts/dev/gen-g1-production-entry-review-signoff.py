#!/usr/bin/env python3
"""G1-scoped Production Entry Review sign-off (Wave 1.1 · ≠ Phase③ full PER · ≠ Production GO)."""
from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_json(path: Path) -> dict:
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def git_short_sha() -> str:
    try:
        return (
            subprocess.check_output(
                ["git", "rev-parse", "--short", "HEAD"],
                cwd=ROOT,
                text=True,
            )
            .strip()
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unknown"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--evid-dir", required=True)
    ap.add_argument("--session-dir", required=True)
    ap.add_argument("--staging-summary", required=True)
    ap.add_argument("--runtime-truth-baseline", default="20260704")
    args = ap.parse_args()

    evid = Path(args.evid_dir)
    evid.mkdir(parents=True, exist_ok=True)

    sess = Path(args.session_dir)
    if not sess.is_absolute():
        sess = ROOT / sess
    summary = load_json(sess / "SUMMARY.json")
    mt = summary.get("manual_test") or {}
    if mt.get("pass") != 27 or mt.get("fail", 0) != 0:
        raise SystemExit(
            f"BLOCKED: local Manual UAT not 27/27 (pass={mt.get('pass')} fail={mt.get('fail')})"
        )

    staging = load_json(Path(args.staging_summary))
    if not staging.get("all_pass"):
        raise SystemExit("BLOCKED: staging persona matrix not PASS")

    defects = load_json(ROOT / "evidence/manual-uat/summary/defects-registry.json")
    open_p0 = sum(1 for d in defects.get("defects") or [] if d.get("severity") == "P0" and d.get("status") == "OPEN")
    open_p1 = sum(1 for d in defects.get("defects") or [] if d.get("severity") == "P1" and d.get("status") == "OPEN")
    if open_p0 or open_p1:
        raise SystemExit(f"BLOCKED: open defects P0={open_p0} P1={open_p1}")

    reg_text = (ROOT / "registry/production-readiness-master-matrix.v1.yaml").read_text(encoding="utf-8")
    if "TT_RUNTIME_TRUTH_P0: PASS" not in reg_text:
        raise SystemExit("BLOCKED: TT_RUNTIME_TRUTH_P0 != PASS in master matrix")

    signed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    commit = git_short_sha()

    signoff = {
        "schema": "traveltrust.g1_production_entry_review.v1",
        "stamp": args.stamp,
        "opened_at_utc": signed_at,
        "phase": "G1 · Wave 1.1",
        "go_gate": "G1",
        "status": "PASS",
        "commit": commit,
        "runtime_truth_p0_baseline": args.runtime_truth_baseline,
        "machine_keys": {
            "TT_PRODUCTION_READINESS_G1_PER": "PASS",
            "TT_PRODUCTION_GO": "NO_GO",
        },
        "inputs": {
            "manual_uat_session": str(sess.relative_to(ROOT)).replace("\\", "/"),
            "manual_uat_pass": "27/27",
            "staging_persona_matrix": args.staging_summary.replace("\\", "/"),
            "defects_registry": "evidence/manual-uat/summary/defects-registry.json",
        },
        "verdicts": {
            "runtime_truth_p0_baseline": "SATISFIED",
            "local_browser_uat": "PASS",
            "staging_persona_matrix": "PASS",
            "business_defects": "CLOSED",
            "g1_per": "PASS",
        },
        "honest_boundary": (
            "G1 PER = fresh RT-P0-baseline UAT + staging persona matrix + defect gate · "
            "does not replace Phase③ full PER (PRM-MVAL-B004) · not Production GO"
        ),
    }

    out = evid / "g1-per-signoff.json"
    out.write_text(json.dumps(signoff, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    latest = ROOT / "evidence/GO_production_readiness/g1-per/G1-PER.latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(signoff, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    (evid / "G1-PER-SIGNOFF.md").write_text(
        f"""# G1 Production Entry Review Sign-off

**Stamp:** `{args.stamp}` · **Commit:** `{commit}` · **UTC:** {signed_at}

| Gate | Result |
|------|--------|
| Runtime Truth P0 baseline | SATISFIED ({args.runtime_truth_baseline}) |
| Local Browser UAT | 27/27 PASS |
| Staging persona matrix (C1–C4, E2) | PASS |
| Business defects P0/P1 | 0 open |
| **G1 PER** | **PASS** |

**Boundary:** G1 PER ≠ Phase③ full PER · ≠ Production GO
""",
        encoding="utf-8",
    )

    print(f"g1-per-signoff: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
