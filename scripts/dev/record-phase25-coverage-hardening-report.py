#!/usr/bin/env python3
"""Generate Phase 2.5 coverage hardening report.json + STATUS.txt."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


SLICES = [
    ("CH-H01", "Escrow/Intent/Dispute", "smoke-phase25-h1-escrow-intent-dispute-staging.sh"),
    ("CH-H02", "Acquisition accept + fulfillment-bond", "smoke-phase25-h2-acquisition-fulfillment-staging.sh"),
    ("CH-H03", "Stripe webhook exceptions + charge.refunded", "smoke-phase25-h3-stripe-webhook-exceptions-staging.sh"),
    ("CH-H04", "Session / Wallet verify / 2FA", "smoke-phase25-h4-session-wallet-2fa-staging.sh"),
    ("CH-H05", "Stake/Release/Claim (readonly + WRITE=N/A)", "smoke-phase25-h5-chain-write-staging.sh"),
]

MATRIX_IDS = {
    "CH-H01": ["B-ESC-001", "B-ESC-002", "B-DSP-001", "B-ESC-005"],
    "CH-H02": ["B-MKT-008", "CH-H02-001", "CH-H02-002"],
    "CH-H03": ["CH-H03-001", "CH-H03-002", "CH-H03-003"],
    "CH-H04": ["CH-H04-001", "CH-H04-002", "A-LOG-004"],
    "CH-H05": ["CH-H05-001", "C-STK-001"],
}


def parse_slices(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        out[k.strip()] = v.strip()
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--api-base", required=True)
    ap.add_argument("--fail-count", type=int, default=0)
    args = ap.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    slice_status = parse_slices(out_dir / "slices.txt")

    cases = []
    pass_n = 0
    for sid, title, script in SLICES:
        st = slice_status.get(sid, "NOT_RUN")
        if st == "PASS":
            pass_n += 1
        log_path = out_dir / f"{sid}-run.log"
        cases.append(
            {
                "id": sid,
                "title": title,
                "status": st,
                "script": f"scripts/dev/{script}",
                "matrix_ids": MATRIX_IDS.get(sid, []),
                "log": str(log_path.relative_to(out_dir)) if log_path.is_file() else None,
            }
        )

    verdict = "PASS" if args.fail_count == 0 and pass_n >= 4 else "PARTIAL" if pass_n >= 1 else "FAIL"

    report = {
        "phase": "2.5-coverage-hardening",
        "recorded_at": stamp,
        "api_base": args.api_base,
        "boundary": "≠ Production GO · ≠ Phase ③ · TT_PHASE2_GO_VERDICT unchanged",
        "verdict": verdict,
        "slices_pass": pass_n,
        "slices_total": len(SLICES),
        "cases": cases,
        "ssot": "docs/runbook/PHASE2.5-COVERAGE-HARDENING.md",
    }
    (out_dir / "report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    status_lines = [
        "phase: 2.5-coverage-hardening",
        f"status: {verdict}",
        f"last_run: {stamp}",
        f"api_base: {args.api_base}",
        f"slices_pass: {pass_n}/{len(SLICES)}",
        "note: hardening only · does not reopen PHASE2_GO_READY",
        f"ssot: docs/runbook/PHASE2.5-COVERAGE-HARDENING.md",
    ]
    for sid, _, _ in SLICES:
        status_lines.append(f"{sid.lower().replace('-', '_')}: {slice_status.get(sid, 'NOT_RUN')}")
    (out_dir / "STATUS.txt").write_text("\n".join(status_lines) + "\n", encoding="utf-8")

    print(f"record-phase25: OK verdict={verdict} pass={pass_n}/{len(SLICES)}")


if __name__ == "__main__":
    main()
