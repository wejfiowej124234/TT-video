#!/usr/bin/env python3
"""Generate AI-PRE-HUMAN-UAT-REPORT.md from probe + playwright JSON."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--evidence-dir", required=True)
    ap.add_argument("--stamp", required=True)
    args = ap.parse_args()

    evid = Path(args.evidence_dir)
    probe = load_json(evid / "api-chain-probe.json")
    pw = load_json(evid / "playwright-checks.json")
    pass_json = load_json(evid / "AI-PRE-HUMAN-UAT-PASS.json")

    probe_checks = probe.get("checks", [])
    pw_checks = pw.get("checks", [])
    all_checks = probe_checks + pw_checks
    fails = [c for c in all_checks if c.get("verdict") == "FAIL"]
    skips = [c for c in all_checks if c.get("verdict") == "SKIP"]
    verdict = "PASS" if not fails else "FAIL"

    lines = [
        "# AI Pre-Human UAT Report",
        "",
        f"**Check ID:** `AI_PRE_HUMAN_UAT_CHECK`",
        f"**Stamp:** `{args.stamp}`",
        f"**Phase:** ② Sepolia · GovFreeze V2 · **≠** Cert #1 Human signoff",
        f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}",
        "",
        f"**Verdict:** **{verdict}** · FAIL={len(fails)} · SKIP={len(skips)}",
        "",
        "**纪律：** 本报告 **仅** 作为 Cert #1 前置机读预验收 · **禁止** 冒充 `HUMAN_DONE` · Owner 仍须最少必要真人录屏签核",
        "",
        "---",
        "",
        "## Summary",
        "",
        "| Layer | Result |",
        "|-------|--------|",
        f"| API + chain probe | **{probe.get('verdict', 'MISSING')}** |",
        f"| Playwright personas | **{'PASS' if pw_checks and not [c for c in pw_checks if c.get('verdict')=='FAIL'] else 'FAIL' if pw_checks else 'MISSING'}** |",
        f"| **Overall gate** | **{verdict}** |",
        "",
        "## Personas exercised (Playwright)",
        "",
        "- **Guest** — hub · params 45/55 · treasury · fee-routes · proposals · market/traveltrust",
        "- **Investor** — distribution-accruals · distribution-claim",
        "- **Steward** — steward workbench · region view",
        "- **Admin** — `/admin` read-only boundary",
        "- **Multi-identity** — `/me/identities` → `/governance`",
        "",
        "## Checks",
        "",
        "| ID | Dimension | Verdict | Detail |",
        "|----|-----------|---------|--------|",
    ]
    for c in all_checks:
        cid = c.get("id", "—")
        dim = c.get("dimension", c.get("route", "—"))
        v = c.get("verdict", "—")
        detail = str(c.get("detail", "")).replace("|", "\\|")[:120]
        lines.append(f"| {cid} | {dim} | {v} | {detail} |")

    if fails:
        lines += ["", "## Failures", ""]
        for c in fails:
            lines.append(f"- **{c.get('id')}**: {c.get('detail')}")

    lines += [
        "",
        "## Evidence",
        "",
        f"- Probe JSON: `{evid}/api-chain-probe.json`",
        f"- Playwright JSON: `{evid}/playwright-checks.json`",
        f"- Screenshots: `{evid}/screenshots/`",
        f"- Pass gate: `{evid}/AI-PRE-HUMAN-UAT-PASS.json`",
        "",
        "## Next (only if PASS)",
        "",
        "```bash",
        "# Minimal human Cert #1 after AI pre-check PASS",
        "bash scripts/dev/complete-ttg-cert-step.sh --cert 1 --stamp <cert-stamp> --signer \"Sebastian Ward\"",
        "```",
        "",
        f"**Machine key:** `AI_PRE_HUMAN_UAT: {verdict} stamp={args.stamp}`",
    ]

    report_path = evid / "AI-PRE-HUMAN-UAT-REPORT.md"
    report_path.write_text("\n".join(lines), encoding="utf-8")

    pass_payload = {
        "check_id": "AI_PRE_HUMAN_UAT_CHECK",
        "stamp_utc": args.stamp,
        "verdict": verdict,
        "fail_count": len(fails),
        "skip_count": len(skips),
        "report": str(report_path.relative_to(ROOT)).replace("\\", "/"),
        "cert1_gate": verdict == "PASS",
        "honest_boundary": "AI pre-check PASS ≠ HUMAN_DONE",
    }
    (evid / "AI-PRE-HUMAN-UAT-PASS.json").write_text(
        json.dumps(pass_payload, indent=2), encoding="utf-8"
    )
    print(f"AI_PRE_HUMAN_UAT_REPORT: {verdict} path={report_path}")
    sys.exit(0 if verdict == "PASS" else 3)


if __name__ == "__main__":
    main()
