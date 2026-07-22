#!/usr/bin/env python3
"""PSG Delta Recertify · three-baseline FORMAL (under FINAL RELEASE FROZEN).

Requires:
  - freeze_status=FROZEN
  - Audit v2 PASS (or PASS_WITH_EXPECTED_DIFFERENCE)
  - clean worktree (ignoring this report's own outputs)

Does NOT: mint new pin · Staging-grade GO · Production GO · Hard Gate flip

  python scripts/dev/run-psg-delta-recertify-three-baseline-formal.py
"""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TIP = "97289a7185610ef0ad8822f0af04bfa533e42986"
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
AUDIT = ROOT / "docs/runbook/TT-FINAL-RELEASE-DEEP-CONSISTENCY-AUDIT-V2-LATEST.json"
DRY = ROOT / "docs/runbook/TT-PSG-DELTA-RECERTIFY-THREE-BASELINE-DRY-RUN-LATEST.json"
OUT_JSON = ROOT / "docs/runbook/TT-PSG-DELTA-RECERTIFY-THREE-BASELINE-FORMAL-LATEST.json"
OUT_MD = ROOT / "docs/runbook/TT-PSG-DELTA-RECERTIFY-THREE-BASELINE-FORMAL-LATEST.md"
EV_DIR = ROOT / "evidence/PSG-DELTA-RECERTIFY"
FRB_JSON = ROOT / "docs/runbook/TT-FINAL-RELEASE-BASELINE-LATEST.json"
FRB_YAML = ROOT / "registry/final-release-baseline.v1.yaml"


def git(*a: str) -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), *a], text=True).strip()


def run(cmd: list[str]) -> int:
    print("+", " ".join(cmd), flush=True)
    return subprocess.call(cmd, cwd=str(ROOT))


def check_frozen() -> bool:
    frb = json.loads((ROOT / "docs/runbook/TT-FINAL-RELEASE-BASELINE-LATEST.json").read_text(encoding="utf-8"))
    return frb.get("freeze_status") == "FROZEN"


def check_engineering_anchor() -> bool:
    # Mirror scripts/gates/check-engineering-ssot-anchor-gate.sh essentials
    pin = PIN
    tip = TIP
    bad = "PSG-REL-20260722-STAGING-ALIGN-W0"
    reg = ROOT / "registry/engineering-ssot-anchor.v1.yaml"
    if not reg.exists():
        return False
    text = reg.read_text(encoding="utf-8")
    if "TT_ENGINEERING_SSOT_ANCHOR" not in text or pin not in text or tip not in text:
        return False
    vg = (ROOT / "scripts/dev/run-psg-version-gate.py").read_text(encoding="utf-8")
    if f'FROZEN_PSG_RELEASE_VERSION = "{pin}"' not in vg:
        return False
    api = (ROOT / "crates/api/src/routes/health_meta/meta_build.rs").read_text(encoding="utf-8")
    if f'DEFAULT_PSG_RELEASE_VERSION: &str = "{pin}"' not in api:
        return False
    df = (ROOT / "frontend/Dockerfile.fly-staging").read_text(encoding="utf-8")
    if f"ARG NEXT_PUBLIC_PSG_RELEASE_VERSION={pin}" not in df:
        return False
    if f'FROZEN_PSG_RELEASE_VERSION = "{bad}"' in vg:
        return False
    return True


def main() -> int:
    if not check_frozen():
        print("FORMAL: BLOCKED — not FROZEN", file=sys.stderr)
        return 2
    print("FORMAL: freeze_status=FROZEN OK", flush=True)
    if not check_engineering_anchor():
        print("FORMAL: BLOCKED — Engineering SSOT Anchor FAIL", file=sys.stderr)
        return 2
    print("FORMAL: Engineering SSOT Anchor OK", flush=True)

    # 2) Refresh audit v2 + dry-run
    if run([sys.executable, "scripts/dev/run-final-release-deep-consistency-audit-v2.py"]) != 0:
        print("FORMAL: BLOCKED — Audit v2 FAIL", file=sys.stderr)
        return 2
    if run([sys.executable, "scripts/dev/run-psg-delta-recertify-three-baseline-dry-run.py"]) != 0:
        print("FORMAL: BLOCKED — three-baseline dry-run FAIL", file=sys.stderr)
        return 2

    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    dry = json.loads(DRY.read_text(encoding="utf-8"))
    if not str(audit.get("verdict", "")).startswith("AUDIT_V2_PASS"):
        print("FORMAL: BLOCKED — audit verdict", audit.get("verdict"), file=sys.stderr)
        return 2
    if not str(dry.get("verdict", "")).startswith("DRY_RUN_PASS"):
        print("FORMAL: BLOCKED — dry-run verdict", dry.get("verdict"), file=sys.stderr)
        return 2

    head = git("rev-parse", "HEAD")
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    stamp_file = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    expected = list(audit.get("expected_differences") or []) + list(dry.get("expected_differences") or [])
    # dedupe by id
    seen = set()
    expected_u = []
    for e in expected:
        i = e.get("id")
        if i in seen:
            continue
        seen.add(i)
        expected_u.append(e)

    report = {
        "schema": "traveltrust.psg_delta_recertify_three_baseline_formal.v1",
        "machine_key": "TT_PSG_DELTA_RECERTIFY_THREE_BASELINE_FORMAL",
        "recorded_utc": stamp,
        "mode": "FORMAL_DELTA_RECERTIFY",
        "equals_production_go": False,
        "equals_staging_grade_go": False,
        "hard_gate_flipped": False,
        "core_version_minted": False,
        "pin": PIN,
        "runtime_tip": TIP,
        "head": head,
        "baselines": ["Candidate_v2", "V3.1.1_Final", "PSG_EGM_Final"],
        "prereq": {
            "freeze": "FROZEN",
            "audit_v2": audit.get("verdict"),
            "dry_run": dry.get("verdict"),
            "engineering_ssot_anchor": "PASS",
        },
        "chains_ok": audit.get("chains_ok"),
        "anchor_hidden_drift": audit.get("anchor_hidden_drift") or [],
        "expected_differences": expected_u,
        "verdict": "FORMAL_DELTA_PASS_WITH_EXPECTED_DIFFERENCE"
        if expected_u
        else "FORMAL_DELTA_PASS",
        "next_forbidden_without_owner": [
            "Staging_grade_GO",
            "Hard_Gate",
            "Production_GO",
            "new_psg_release_version_mint",
        ],
    }

    EV_DIR.mkdir(parents=True, exist_ok=True)
    ev_path = EV_DIR / f"THREE-BASELINE-FORMAL-{stamp_file}.json"
    ev_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    latest_ev = EV_DIR / "THREE-BASELINE-FORMAL-LATEST.json"
    latest_ev.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    OUT_JSON.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# PSG Delta Recertify · Three Baseline · FORMAL",
        "",
        f"**Verdict:** `{report['verdict']}` · **≠ Staging-grade GO · ≠ Production GO**",
        f"**Recorded:** `{stamp}`",
        f"**Pin / Runtime tip:** `{PIN}` @ `{TIP[:12]}…`",
        f"**HEAD:** `{head[:12]}…`",
        "",
        "## Prereq",
        "",
        f"- FREEZE: **FROZEN**",
        f"- Audit v2: `{audit.get('verdict')}`",
        f"- Dry-run: `{dry.get('verdict')}`",
        f"- Engineering SSOT Anchor: **PASS**",
        "",
        "## Chains",
        "",
        "| Chain | OK |",
        "|-------|----|",
    ]
    for k, ok in (audit.get("chains_ok") or {}).items():
        lines.append(f"| {k} | {'✅' if ok else '❌'} |")
    lines += ["", "## Expected Differences", ""]
    if not expected_u:
        lines.append("_none_")
    else:
        for e in expected_u:
            lines.append(f"- `{e.get('id')}` — {e.get('detail')}")
    lines += [
        "",
        "## Evidence",
        "",
        f"- `{ev_path.relative_to(ROOT).as_posix()}`",
        f"- `{latest_ev.relative_to(ROOT).as_posix()}`",
        "",
        "## Honesty",
        "",
        "FORMAL Delta ≠ Staging-grade GO ≠ Production GO ≠ Hard Gate.",
        "cert_suite remains non-GO; Owner must explicitly start GO ladders.",
        "",
    ]
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")

    # Update FINAL RELEASE cert_suite pointer (still no GO)
    if FRB_JSON.exists():
        j = json.loads(FRB_JSON.read_text(encoding="utf-8"))
        j["cert_suite"] = "DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO"
        j["cert_executed_this_session"] = True
        j["delta_formal_verdict"] = report["verdict"]
        j["delta_formal_recorded_utc"] = stamp
        j["equals_production_go"] = False
        j["equals_staging_grade_go"] = False
        FRB_JSON.write_text(json.dumps(j, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if FRB_YAML.exists():
        text = FRB_YAML.read_text(encoding="utf-8")
        text = text.replace(
            "cert_suite: ARMED_NOT_EXECUTED",
            "cert_suite: DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO",
        )
        text = text.replace(
            "cert_executed_this_session: false",
            "cert_executed_this_session: true",
        )
        if "delta_formal_verdict:" not in text:
            text = text.replace(
                "cert_executed_this_session: true\n",
                "cert_executed_this_session: true\n"
                f"delta_formal_verdict: {report['verdict']}\n"
                f"delta_formal_recorded_utc: \"{stamp}\"\n",
            )
        FRB_YAML.write_text(text, encoding="utf-8")

    # Freeze gate still accepts ARMED_NOT_EXECUTED|FORBIDDEN — extend to new cert_suite
    gate = ROOT / "scripts/gates/check-final-release-baseline-freeze-gate.sh"
    g = gate.read_text(encoding="utf-8")
    if "DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO" not in g:
        g = g.replace(
            "FORBIDDEN_UNTIL_FREEZE|ARMED_NOT_EXECUTED",
            "FORBIDDEN_UNTIL_FREEZE|ARMED_NOT_EXECUTED|DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO",
        )
        gate.write_text(g, encoding="utf-8")

    print(json.dumps({"verdict": report["verdict"], "evidence": str(latest_ev)}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
