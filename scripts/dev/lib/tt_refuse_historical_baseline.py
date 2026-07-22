"""Refuse FG-15-A / Hardened forensic tooling unless ALLOW_HISTORICAL.

Baseline Migration v2: Candidate v2 is the sole Web3 SSOT for NEW flows.
Set TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1 only for read-only forensic audits.

PSG Completion Recalculate: allowed only after FG-15-B ELAPSED
(or ALLOW_HISTORICAL=1 forensic). Never implies Hard Gate / Wave unlock.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

CANDIDATE_ENTRY = "scripts/dev/run-web3-candidate-v2-money-path-entry.sh"
MAINLINE = "registry/web3-mainline.v1.yaml"
FG15B_STATUS = (
    Path(__file__).resolve().parents[3]
    / "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json"
)


def refuse_unless_historical_allowed(script_path: str | Path | None = None) -> None:
    if os.environ.get("TRAVELTRUST_ALLOW_HISTORICAL_BASELINE", "") == "1":
        print(
            "tt-historical: ALLOW_HISTORICAL=1 — forensic mode (NOT FOR PROMOTION)",
            file=sys.stderr,
        )
        return
    name = Path(script_path).name if script_path else "(unknown)"
    print(
        f"tt-historical: REFUSE {name} — FG-15-A / Hardened tooling is ARCHIVED_HISTORICAL",
        file=sys.stderr,
    )
    print(
        "  Use Candidate v2 entrypoints (registry/web3-mainline.v1.yaml).",
        file=sys.stderr,
    )
    print(f"  Money Path: bash {CANDIDATE_ENTRY}", file=sys.stderr)
    print(f"  Mainline:   {MAINLINE}", file=sys.stderr)
    print(
        "  Forensic only: TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1",
        file=sys.stderr,
    )
    raise SystemExit(2)


def refuse_expected_sha_fg15_a(expected_sha: str) -> None:
    """Call when a script hard-pins EXPECTED_SHA to FG-15-A tip."""
    if expected_sha.lower().startswith("09c72b93") and os.environ.get(
        "TRAVELTRUST_ALLOW_HISTORICAL_BASELINE", ""
    ) != "1":
        refuse_unless_historical_allowed("EXPECTED_SHA=09c72b93")


def fg15_b_elapsed(status_path: Path | None = None) -> tuple[bool, dict]:
    """Return (elapsed, status_dict) from FG-15-B Candidate status JSON."""
    path = status_path or FG15B_STATUS
    if not path.is_file():
        return False, {}
    try:
        st = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False, {}
    if st.get("elapsed_pass") is True:
        return True, st
    if st.get("status") in ("ELAPSED", "ELAPSED_PASS", "OBSERVATION_ELAPSED"):
        return True, st
    earliest = st.get("earliest_elapsed_utc")
    if earliest:
        try:
            end = datetime.fromisoformat(str(earliest).replace("Z", "+00:00"))
            if datetime.now(timezone.utc) >= end:
                return True, st
        except ValueError:
            pass
    return False, st


def refuse_unless_fg15_b_elapsed_or_historical(
    script_path: str | Path | None = None,
) -> None:
    """Gate for PSG Completion Recalculate (S7).

    Allow when:
      - TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1 (forensic), OR
      - FG-15-B Candidate observation ELAPSED

    Still FORBIDDEN (caller's duty): Hard Gate flip · Mainnet Wave.
    """
    if os.environ.get("TRAVELTRUST_ALLOW_HISTORICAL_BASELINE", "") == "1":
        print(
            "tt-fg15b: ALLOW_HISTORICAL=1 — Recalculate forensic mode "
            "(NOT Hard Gate / Wave unlock)",
            file=sys.stderr,
        )
        return
    elapsed, st = fg15_b_elapsed()
    if elapsed:
        print(
            "tt-fg15b: FG-15-B ELAPSED — Recalculate allowed "
            "(Hard Gate REFUSED · Wave FORBIDDEN still held)",
            file=sys.stderr,
        )
        return
    name = Path(script_path).name if script_path else "(unknown)"
    earliest = st.get("earliest_elapsed_utc") or "2026-07-21T18:06:48Z"
    print(
        f"tt-fg15b: REFUSE {name} — FG-15-B not ELAPSED "
        f"(status={st.get('status')!r} earliest={earliest})",
        file=sys.stderr,
    )
    print(
        "  Continue: bash scripts/dev/run-web3-candidate-v2-fg15b-maintain.sh",
        file=sys.stderr,
    )
    print(
        "  After Timelock ETA: bash scripts/dev/run-web3-candidate-v2-settlement-finalize.sh",
        file=sys.stderr,
    )
    print(
        "  After earliest_elapsed_utc: re-run Recalculate "
        "(Hard Gate / Wave still FORBIDDEN)",
        file=sys.stderr,
    )
    raise SystemExit(2)
