#!/usr/bin/env python3
"""F-02 Proposal #1 monitor heartbeat (read-only).

Governance RC remains FROZEN_WAITING_EXECUTE until ETA then Execute.
Does NOT broadcast, mutate ACTIVE/protocol/Runtime/Registry/Package,
or implement Money-Path / claim TT_WEB3_FULL_CONSTITUTION_CONSISTENCY=PASS.
"""
from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_v311_constitution_production_alignment_audit"
FRE = ROOT / "evidence/GO_phase2_v311_final_release"
RPC = os.environ.get("CHAIN_RPC_URL", "https://ethereum-sepolia-rpc.publicnode.com")
ETA_UTC = "2026-07-20T11:37:37Z"
CHAIN_ID = 11155111

# Locked post-Execute ladder (Owner instruction · no skip)
POST_EXECUTE_LADDER = [
    "F02_Execute_success",
    "Function_Cert_54_0_0",
    "Product_Cert_PASS",
    "UI_Full_Cert_PASS",
    "Governance_RC_CLOSED",
    "Money_Path_OPT_A_TRE02",
    "Money_Path_OPT_A_REG01",
    "Money_Path_OPT_A_REG04",
    "V_UNIT",
    "V_SEPOLIA",
    "V_REAUDIT_M_RC_04",
    "Constitution_Audit_PASS",
    "Full_Consistency_Matrix_rerun",
]

PASS_MACHINE = "TT_WEB3_FULL_CONSTITUTION_CONSISTENCY"
PASS_FORBIDDEN_UNTIL = (
    "all ladder steps PASS and OPEN_P0=0 OPEN_P1=0 DRIFT=0 CONFLICT=0"
)


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _cast(*args: str) -> tuple[bool, str]:
    r = subprocess.run(
        ["cast", *args, "--rpc-url", RPC],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=45,
    )
    out = (r.stdout or "").strip().splitlines()
    line = out[0] if out else ((r.stderr or "").strip().splitlines() or [""])[0]
    return r.returncode == 0, line


def _load(rel: str):
    p = ROOT / rel
    if not p.is_file():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> int:
    now = datetime.now(timezone.utc)
    now_s = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    eta = datetime.fromisoformat(ETA_UTC.replace("Z", "+00:00"))
    secs = int((eta - now).total_seconds())
    before_eta = now < eta

    freeze = _load("registry/v311-sepolia-address-matrix-freeze.v1.json") or {}
    addrs = freeze.get("addresses") or {}
    gov = addrs.get("governor")
    tl = addrs.get("timelock")

    ok_st, st_raw = _cast("call", gov, "state(uint256)(uint8)", "1") if gov else (False, "")
    try:
        state = int(st_raw.split()[0]) if ok_st else None
    except Exception:
        state = None
    # OZ Governor: 0 Pending … 5 Queued … 7 Executed
    state_name = {
        0: "Pending",
        1: "Active",
        2: "Canceled",
        3: "Defeated",
        4: "Succeeded",
        5: "Queued",
        6: "Expired",
        7: "Executed",
    }.get(state, "UNKNOWN")

    ok_d, delay_raw = _cast("call", tl, "delay()(uint256)") if tl else (False, "")
    delay_ok = ok_d and "172800" in delay_raw.replace(" ", "")

    execute_allowed_now = (not before_eta) and state == 5
    execute_done = state == 7

    if execute_done:
        phase = "POST_EXECUTE_ADVANCE_LADDER"
        action = "Begin Function_Cert_54_0_0 — do not skip"
    elif execute_allowed_now:
        phase = "ETA_REACHED_EXECUTE_READY"
        action = "Owner may Execute Proposal #1 (BROADCAST_OK) then follow ladder"
    else:
        phase = "FROZEN_WAITING_EXECUTE"
        action = "Monitor only — no Execute, no Money-Path, no PASS claim"

    heartbeat = {
        "schema": "traveltrust.v311_f02_execute_monitor_heartbeat.v1",
        "machine_key": "TT_V311_F02_EXECUTE_MONITOR",
        "recorded_utc": now_s,
        "chain_id": CHAIN_ID,
        "active_baseline": "v311_sepolia_clean_baseline",
        "governance_mode": "FROZEN_WAITING_EXECUTE"
        if not execute_done
        else "POST_EXECUTE",
        "phase": phase,
        "proposal_1": {
            "id": 1,
            "state": state,
            "state_name": state_name,
            "governor": gov,
            "timelock": tl,
            "execute_after_utc": ETA_UTC,
            "seconds_until_eta": secs,
            "before_eta": before_eta,
            "execute_allowed_now": execute_allowed_now,
            "execute_done": execute_done,
            "semantic": "TTG.transfer(1) smoke — Safe→Timelock→Execute (orthogonal to money-path)",
        },
        "timelock_delay_ok": delay_ok,
        "timelock_delay_raw": delay_raw,
        "forbid_now": [
            "mutate_protocol",
            "mutate_ACTIVE",
            "mutate_Runtime",
            "mutate_Registry",
            "Package_LOCK",
            "implement_TRE02_REG01_REG04",
            "claim_TT_WEB3_FULL_CONSTITUTION_CONSISTENCY_PASS",
            "skip_ladder_steps",
        ],
        "post_execute_ladder_locked": POST_EXECUTE_LADDER,
        "skip_forbidden": True,
        "pass_machine_key": PASS_MACHINE,
        "pass_forbidden_until": PASS_FORBIDDEN_UNTIL,
        "next_action": action,
        "tt_v311_f02_execute_monitor": "MONITORING"
        if before_eta or state == 5
        else ("EXECUTED" if execute_done else "ATTENTION"),
    }

    EV.mkdir(parents=True, exist_ok=True)
    FRE.mkdir(parents=True, exist_ok=True)
    stamp = now.strftime("%Y%m%dT%H%M%SZ")
    for base in (EV, FRE):
        (base / f"F02-EXECUTE-MONITOR-HEARTBEAT-{stamp}.json").write_text(
            json.dumps(heartbeat, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        (base / "F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.json").write_text(
            json.dumps(heartbeat, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    md = f"""# F-02 Proposal #1 · Execute Monitor Heartbeat

**Machine:** `TT_V311_F02_EXECUTE_MONITOR`  
**Recorded:** `{now_s}`  
**Mode:** `{heartbeat["governance_mode"]}` · phase `{phase}`

## Live

| Field | Value |
|-------|-------|
| Proposal #1 state | `{state}` `{state_name}` |
| Execute ETA | `{ETA_UTC}` |
| Seconds until ETA | `{secs}` |
| Before ETA | `{before_eta}` |
| Execute allowed now | `{execute_allowed_now}` |
| Timelock delay OK | `{delay_ok}` |

## Discipline (locked)

- **Now:** {action}
- **Forbid:** protocol / ACTIVE / Runtime / Registry / Package mutation · Money-Path implement · skip · `{PASS_MACHINE}=PASS`
- **After Execute success — strict order (no skip):**

```text
{" → ".join(POST_EXECUTE_LADDER)}
```

Any step not PASS → stop. Do **not** claim `{PASS_MACHINE}=PASS`.
"""
    for base in (EV, FRE):
        (base / "F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.md").write_text(md, encoding="utf-8")

    # Patch dual board monitor fields only (preserve money-path stamps)
    dual_path = EV / "DUAL-RC-TRACK-BOARD-LATEST.json"
    if dual_path.is_file():
        dual = json.loads(dual_path.read_text(encoding="utf-8"))
        dual["f02_monitor_heartbeat"] = {
            "recorded_utc": now_s,
            "phase": phase,
            "proposal_1_state": state,
            "proposal_1_state_name": state_name,
            "seconds_until_eta": secs,
            "before_eta": before_eta,
            "cite": "F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.json",
        }
        dual["post_execute_ladder_locked"] = POST_EXECUTE_LADDER
        dual["skip_forbidden"] = True
        dual["tt_web3_full_constitution_consistency_pass_forbidden_until"] = (
            PASS_FORBIDDEN_UNTIL
        )
        # keep mode frozen until executed
        if not execute_done:
            dual["mode"] = "FROZEN_WAITING_EXECUTE"
        dual_path.write_text(
            json.dumps(dual, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        fre_dual = FRE / "DUAL-RC-TRACK-BOARD-LATEST.json"
        fre_dual.write_text(dual_path.read_text(encoding="utf-8"), encoding="utf-8")

    # Human runbook pointer (F-02 wait)
    rb = ROOT / "docs/runbook/TT-V311-F02-TIMELOCK-WAIT-PARALLEL-LATEST.md"
    if rb.is_file():
        text = rb.read_text(encoding="utf-8")
        marker = "\n## Monitor heartbeat (auto)\n"
        block = (
            marker
            + f"\n**Latest:** `{now_s}` · state=`{state}` `{state_name}` · "
            f"ETA `{ETA_UTC}` · seconds_until=`{secs}` · phase=`{phase}`\n\n"
            f"Evidence: `evidence/GO_v311_constitution_production_alignment_audit/"
            f"F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.md`\n\n"
            f"**Post-Execute ladder (no skip):**\n\n```text\n"
            + " → ".join(POST_EXECUTE_LADDER)
            + f"\n```\n\n`{PASS_MACHINE}=PASS` forbidden until full ladder + zeros.\n"
        )
        if marker in text:
            pre = text.split(marker)[0]
            text = pre.rstrip() + block
        else:
            text = text.rstrip() + "\n" + block
        rb.write_text(text, encoding="utf-8")

    print(
        json.dumps(
            {
                "TT_V311_F02_EXECUTE_MONITOR": heartbeat["tt_v311_f02_execute_monitor"],
                "phase": phase,
                "state": state,
                "state_name": state_name,
                "seconds_until_eta": secs,
                "before_eta": before_eta,
                "execute_allowed_now": execute_allowed_now,
                "PASS_CLAIM": "FORBIDDEN",
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
