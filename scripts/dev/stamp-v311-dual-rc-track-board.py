#!/usr/bin/env python3
"""Stamp Governance RC + Money-Path RC dual-track board (evidence only)."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_v311_constitution_production_alignment_audit"
FRE = ROOT / "evidence/GO_phase2_v311_final_release"


def main() -> int:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    EV.mkdir(parents=True, exist_ok=True)
    FRE.mkdir(parents=True, exist_ok=True)

    money = {
        "schema": "traveltrust.v311_money_path_rc_charter.v1",
        "machine_key": "TT_V311_MONEY_PATH_RC",
        "status": "REGISTERED_NOT_STARTED",
        "recorded_utc": now,
        "ssot": "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
        "parent_decision": "CONTINUE_CURRENT_RC",
        "source_decision": (
            "evidence/GO_v311_constitution_production_alignment_audit/"
            "RELEASE-BLOCKING-DECISION-TRE-REG-LATEST.json"
        ),
        "start_gate": "CURRENT_GOVERNANCE_RC_CLOSED",
        "forbid_start_while": [
            "FROZEN_WAITING_EXECUTE",
            "CURRENT_GOVERNANCE_RC_OPEN",
            "mix_into_current_rc_workstream",
        ],
        "sole_p0_work_items": [
            {
                "id": "TRE-02",
                "title": (
                    "FeeRouter / distribution to Constitution "
                    "45% steward / 55% Project Revenue Pool"
                ),
                "constitution": "Ch.12.4 / Ch.14",
                "priority": "P0",
                "only_in": "MONEY_PATH_RC",
            },
            {
                "id": "REG-01",
                "title": (
                    "Four treasury rails live — "
                    "Project Revenue Pool + Founder Bootstrap addresses"
                ),
                "constitution": "Ch.14",
                "priority": "P0",
                "only_in": "MONEY_PATH_RC",
            },
            {
                "id": "REG-04",
                "title": (
                    "Distributable Platform Service Fee state machine "
                    "Runtime end-to-end CLOSED"
                ),
                "constitution": "Ch.9",
                "priority": "P0",
                "only_in": "MONEY_PATH_RC",
                "bundle_with": "TRE-02",
            },
        ],
        "p0_count": 3,
        "forbid_additional_p0_without_owner": True,
        "exit_criteria": [
            "TRE-02 CLOSED vs Constitution Ch.12/14",
            "REG-01 CLOSED — PRP + Founder live + isolation proven",
            "REG-04 CLOSED — Distributable Runtime honesty CLOSED",
            "Constitution money-path Full Alignment re-audit PASS",
            "Then eligible for Production GO money-path clearance (PSG Freeze/GO still required)",
        ],
        "honest_boundary": {
            "equals_current_governance_rc": False,
            "equals_production_go_auto": False,
            "mix_into_current_rc": "FORBIDDEN",
        },
        "forbid_mutate_until_started": [
            "protocol",
            "ACTIVE",
            "Runtime",
            "Registry",
            "Package",
        ],
    }

    dual = {
        "schema": "traveltrust.v311_dual_rc_track_board.v1",
        "machine_key": "TT_V311_DUAL_RC_TRACK_BOARD",
        "recorded_utc": now,
        "release_blocking_decision": "CONTINUE_CURRENT_RC",
        "mode": "FROZEN_WAITING_EXECUTE",
        "forbid_mutate": ["protocol", "ACTIVE", "Runtime", "Registry", "Package"],
        "tracks": {
            "A_GOVERNANCE_RC": {
                "name": "Governance RC (current)",
                "status": "ACTIVE_FROZEN_WAITING_EXECUTE",
                "baseline": "v311_sepolia_clean_baseline",
                "chain_id": 11155111,
                "proposal_1": {
                    "state": "Queued",
                    "execute_after_utc": "2026-07-20T11:37:37Z",
                    "semantic": "TTG.transfer smoke — Safe to Timelock to Execute",
                },
                "plan": [
                    "Wait Proposal #1 Execute after ETA",
                    "Function Cert to 54/0/0",
                    "Product Full Cert",
                    "UI Full Cert",
                    "Close Governance RC OPEN (non money-path)",
                    "Phase 8 to RC-02 to Manual to P10.5 to Freeze candidacy per ladder",
                ],
                "forbid_include": ["TRE-02", "REG-01", "REG-04"],
                "deferred_to_money_path_rc": ["TRE-02", "REG-01", "REG-04"],
                "may_claim": [
                    "Governance path Execute",
                    "Function/Product/UI cert for Governance RC scope",
                ],
                "must_not_claim": [
                    "Constitution money-path Full Alignment",
                    "Production GO",
                    "TRE-02/REG-01/REG-04 CLOSED",
                ],
            },
            "B_MONEY_PATH_RC": {
                "name": "Money-Path RC (next independent)",
                "status": "REGISTERED_NOT_STARTED",
                "charter": (
                    "evidence/GO_v311_constitution_production_alignment_audit/"
                    "MONEY-PATH-RC-CHARTER-LATEST.json"
                ),
                "sole_p0": ["TRE-02", "REG-01", "REG-04"],
                "start_when": "A_GOVERNANCE_RC_CLOSED",
                "goal": (
                    "Economic Constitution V3.1.1 money-path full alignment "
                    "then Production GO money clearance"
                ),
            },
        },
        "sequencing": {
            "now": "A only freeze wait",
            "after_execute": (
                "A Function then Product then UI Full then 54/0/0 "
                "then Governance RC close"
            ),
            "after_A_closed": (
                "Start B Money-Path RC with sole P0 TRE-02 REG-01 REG-04"
            ),
            "after_B_closed": (
                "Constitution money-path aligned then Production GO gate PSG"
            ),
        },
        "tt_v311_dual_rc_track_board": "ARMED",
    }

    (EV / "MONEY-PATH-RC-CHARTER-LATEST.json").write_text(
        json.dumps(money, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    for dest in (EV, FRE):
        (dest / "DUAL-RC-TRACK-BOARD-LATEST.json").write_text(
            json.dumps(dual, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )

    md = f"""# Dual RC Track Board · Governance RC || Money-Path RC

**Machine:** `TT_V311_DUAL_RC_TRACK_BOARD`  
**Recorded:** `{now}`  
**Release Decision:** `CONTINUE_CURRENT_RC`  
**Mode:** `FROZEN_WAITING_EXECUTE`  
**Mutate:** **FORBIDDEN** — protocol · ACTIVE · Runtime · Registry · Package

---

## 0 · Dual tracks (hard)

| Track | Name | Status | Scope |
|-------|------|--------|-------|
| **A** | **Governance RC (current)** | `ACTIVE_FROZEN_WAITING_EXECUTE` | Proposal #1 Execute → Function → Product → UI Full → **54/0/0** → RC close |
| **B** | **Money-Path RC (next · independent)** | `REGISTERED_NOT_STARTED` | **Sole P0:** TRE-02 · REG-01 · REG-04 → Constitution money-path full alignment → then Production GO |

**FORBIDDEN:** mix TRE-02 / REG-01 / REG-04 into Track A.  
**FORBIDDEN:** Track A claims Constitution money-path Full Alignment or Production GO.

---

## 1 · Track A · Governance RC

1. Stay frozen; wait Proposal #1 Execute (ETA `2026-07-20T11:37:37Z`)
2. Function Cert → **54/0/0**
3. Product Full Cert
4. UI Full Cert
5. Close non-money OPEN → Phase 8 → RC-02 → Manual → P10.5 → Freeze candidacy

**Deferred register:** `DEFERRED_TO_MONEY_PATH_RC = [TRE-02, REG-01, REG-04]`

---

## 2 · Track B · Money-Path RC (formal register)

**Charter:** [`MONEY-PATH-RC-CHARTER-LATEST.json`](./MONEY-PATH-RC-CHARTER-LATEST.json)  
**Status:** `REGISTERED_NOT_STARTED`  
**Start gate:** Track A **CLOSED**

| P0 | Constitution | Work item |
|----|--------------|-----------|
| TRE-02 | Ch.12 / 14 | Distribution → 45% steward / 55% Project Revenue Pool |
| REG-01 | Ch.14 | PRP + Founder Bootstrap live four-rail isolation |
| REG-04 | Ch.9 | Distributable Runtime end-to-end CLOSED (bundle TRE-02) |

**Sole P0 for Money-Path RC = the three rows above.** No extra P0 without Owner.

**Exit:** three CLOSED + money-path Full Alignment Re-Audit PASS → clear Production GO money blockers (Freeze/GO still PSG).

---

## 3 · Sequencing

```text
NOW: FROZEN_WAITING_EXECUTE (A only)
  → Execute #1
  → Function / Product / UI Full / 54/0/0
  → Governance RC CLOSED
  → START Money-Path RC (B)
  → TRE-02 + REG-01 + REG-04 CLOSED
  → Constitution money-path aligned
  → Production GO (separate gate)
```

---

## 4 · Artifacts

- Dual board JSON: `DUAL-RC-TRACK-BOARD-LATEST.json`
- Money-Path charter: `MONEY-PATH-RC-CHARTER-LATEST.json`
- Prior decision: `RELEASE-BLOCKING-DECISION-TRE-REG-LATEST.json`
"""
    for dest in (EV, FRE):
        (dest / "DUAL-RC-TRACK-BOARD-LATEST.md").write_text(md, encoding="utf-8")

    mon_path = FRE / "F02-EXECUTE-MONITOR-LATEST.json"
    if mon_path.exists():
        mon = json.loads(mon_path.read_text(encoding="utf-8"))
    else:
        mon = {"machine_key": "TT_V311_F02_EXECUTE_MONITOR"}
    mon.update(
        {
            "mode": "FROZEN_WAITING_EXECUTE",
            "release_decision": "CONTINUE_CURRENT_RC",
            "dual_track": "ARMED",
            "governance_rc": "ACTIVE",
            "money_path_rc": "REGISTERED_NOT_STARTED",
            "deferred_p0_to_money_path_rc": ["TRE-02", "REG-01", "REG-04"],
            "forbid_mix_money_path_into_governance_rc": True,
            "recorded_utc": now,
            "execute_after_utc": mon.get("execute_after_utc")
            or "2026-07-20T11:37:37Z",
        }
    )
    mon_path.write_text(
        json.dumps(mon, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    board = FRE / "TIMELOCK-PARALLEL-BOARD-LATEST.md"
    stamp = f"""
---

## Dual-track register ({now})

| Key | Value |
|-----|-------|
| Release Decision | **CONTINUE_CURRENT_RC** |
| Mode | **FROZEN_WAITING_EXECUTE** |
| Track A | Governance RC — Execute → Function → Product → UI Full → **54/0/0** |
| Track B | Money-Path RC — **REGISTERED_NOT_STARTED** · sole P0 = TRE-02 · REG-01 · REG-04 |
| Mix B into A | **FORBIDDEN** |
| Mutate protocol/ACTIVE/Runtime/Registry/Package | **FORBIDDEN** until Owner starts Track B |
| SSOT board | [`DUAL-RC-TRACK-BOARD-LATEST.md`](./DUAL-RC-TRACK-BOARD-LATEST.md) |
"""
    if board.exists():
        t = board.read_text(encoding="utf-8")
        if "## Dual-track register" in t:
            t = re.sub(
                r"\n---\n\n## Dual-track register \(.*?\)\n.*",
                "",
                t,
                flags=re.S,
            )
        board.write_text(t.rstrip() + "\n" + stamp, encoding="utf-8")

    print(
        json.dumps(
            {
                "decision": "CONTINUE_CURRENT_RC",
                "mode": "FROZEN_WAITING_EXECUTE",
                "money_path_status": money["status"],
                "sole_p0": [x["id"] for x in money["sole_p0_work_items"]],
                "dual": "ARMED",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
