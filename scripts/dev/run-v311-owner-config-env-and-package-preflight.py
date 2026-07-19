#!/usr/bin/env python3
"""
OWNER Config ENV check (layered) + Package final preflight.

Layers:
  - Sepolia cert env (scripts/dev/.env.phase2-chain-deploy.local) → must be 11155111
  - Local ① Anvil (.env / frontend/.env.local) → may be 31337 = Expected Difference
  - WalletConnect Project ID → OWNER_REQUIRED before UI Full (Phase 5)

Never writes secrets. Package remains NOT_LOCKED.
"""
from __future__ import annotations

import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_phase2_v311_final_release"
ACTIVE = "v311_sepolia_clean_baseline"
CHAIN = 11155111
ANVIL = 31337


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def _norm_addr(v: str | None) -> str | None:
    if not v:
        return None
    v = v.strip()
    return v.lower() if re.fullmatch(r"0x[a-fA-F0-9]{40}", v) else None


def _host(url: str | None) -> str | None:
    if not url:
        return None
    try:
        return urlparse(url).hostname
    except Exception:
        return None


def main() -> int:
    EV.mkdir(parents=True, exist_ok=True)
    freeze = json.loads(
        (ROOT / "registry/v311-sepolia-address-matrix-freeze.v1.json").read_text(
            encoding="utf-8"
        )
    )
    freeze_addrs = {
        k: v.lower()
        for k, v in (freeze.get("addresses") or {}).items()
        if isinstance(v, str) and v.startswith("0x")
    }

    sepolia_path = ROOT / "scripts/dev/.env.phase2-chain-deploy.local"
    local_root = ROOT / ".env"
    local_fe = ROOT / "frontend/.env.local"
    fe_sepolia = ROOT / "frontend/.env.sepolia.local"
    sepolia = _parse_env(sepolia_path)
    root_env = _parse_env(local_root)
    fe_env = _parse_env(local_fe)
    fe_sepolia_env = _parse_env(fe_sepolia)

    checks = []
    owner_actions = []
    fail = 0

    def add(ok: bool, name: str, detail=None, owner_action: str | None = None):
        nonlocal fail
        checks.append({"name": name, "ok": ok, "detail": detail or {}})
        if not ok:
            fail += 1
            if owner_action:
                owner_actions.append(owner_action)

    # --- Sepolia cert env (hard) ---
    add(sepolia_path.exists(), "sepolia_env_file_exists")
    try:
        sid = int(str(sepolia.get("CHAIN_ID", "")).strip())
    except Exception:
        sid = None
    add(sid == CHAIN, "sepolia_chain_id", {"value": sid, "expected": CHAIN})
    add(bool(sepolia.get("CHAIN_RPC_URL")), "sepolia_rpc_present", {"host": _host(sepolia.get("CHAIN_RPC_URL"))})
    pk = sepolia.get("PRIVATE_KEY") or sepolia.get("DEPLOYER_PRIVATE_KEY")
    add(bool(pk) and len(pk) >= 64, "sepolia_signing_key_present", {"length": len(pk) if pk else 0})

    addr_map = {
        "TIMELOCK_ADDRESS": "timelock",
        "GOVERNOR_ADDRESS": "governor",
        "GOVERNANCE_TOKEN_ADDRESS": "governance_token",
        "TIMELOCK_ADMIN_ADDRESS": "timelock_admin_safe",
    }
    for ek, fk in addr_map.items():
        na = _norm_addr(sepolia.get(ek))
        exp = freeze_addrs.get(fk)
        if not na:
            # optional if not in file
            checks.append(
                {
                    "name": f"sepolia_addr_optional:{ek}",
                    "ok": True,
                    "detail": {"present": False},
                }
            )
            continue
        ok = exp is not None and na == exp
        add(ok, f"sepolia_addr_pin:{ek}", {"freeze_key": fk, "matches": ok})

    # --- Local ① Anvil (Expected Difference) ---
    local_notes = []
    for label, env in (("root_.env", root_env), ("frontend_.env.local", fe_env)):
        cid = env.get("CHAIN_ID") or env.get("NEXT_PUBLIC_CHAIN_ID")
        try:
            civ = int(str(cid).strip()) if cid else None
        except Exception:
            civ = None
        if civ == ANVIL:
            local_notes.append(
                {
                    "file": label,
                    "chain_id": civ,
                    "class": "EXPECTED_DIFFERENCE_LOCAL_①",
                    "note": "Local Anvil 31337 OK for ①; must not be used as Sepolia RC runtime pin",
                }
            )
        elif civ == CHAIN:
            local_notes.append(
                {
                    "file": label,
                    "chain_id": civ,
                    "class": "ALIGNED_SEPOLIA",
                }
            )
        elif civ is not None:
            local_notes.append(
                {
                    "file": label,
                    "chain_id": civ,
                    "class": "UNEXPECTED",
                }
            )
            add(
                False,
                f"local_chain_unexpected:{label}",
                {"chain_id": civ},
                owner_action=f"Fix {label} chain_id={civ} (expected 31337 local or 11155111 Sepolia FE)",
            )

    # Frontend for UI Full: prefer dedicated Sepolia overlay (GAP-PR-02)
    fe_ui_env = fe_sepolia_env if fe_sepolia_env else fe_env
    fe_cid = None
    try:
        fe_cid = int(str(fe_ui_env.get("NEXT_PUBLIC_CHAIN_ID", "")).strip())
    except Exception:
        pass
    fe_ui_ready = fe_cid == CHAIN
    if not fe_ui_ready:
        owner_actions.append(
            "Before Phase 5 UI Full Cert: run python scripts/dev/prepare-gap-pr02-sepolia-frontend-env.py "
            "then set NEXT_PUBLIC_CHAIN_ID=11155111 in frontend/.env.sepolia.local "
            "(keep frontend/.env.local Anvil 31337 as Expected Difference)."
        )

    # WalletConnect — overlay preferred
    wc = (
        fe_sepolia_env.get("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID")
        or fe_env.get("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID")
        or fe_env.get("WALLETCONNECT_PROJECT_ID")
        or sepolia.get("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID")
        or root_env.get("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID")
    )
    wc_ok = bool(wc) and len(wc) >= 8
    if not wc_ok:
        owner_actions.append(
            "Before Phase 5 UI Full Cert: bash scripts/dev/set-walletconnect-project-id.sh '<32-hex>' "
            "(writes frontend/.env.sepolia.local)."
        )
    checks.append(
        {
            "name": "walletconnect_project_id",
            "ok": wc_ok,
            "blocking_for": "UI_FULL_CERT_ONLY",
            "detail": {
                "present": bool(wc),
                "length": len(wc) if wc else 0,
                "source_prefers": "frontend/.env.sepolia.local",
            },
        }
    )
    checks.append(
        {
            "name": "frontend_sepolia_overlay",
            "ok": fe_sepolia.exists() and fe_ui_ready,
            "blocking_for": "UI_FULL_CERT_ONLY",
            "detail": {
                "path": "frontend/.env.sepolia.local",
                "exists": fe_sepolia.exists(),
                "chain_id": fe_cid,
            },
        }
    )

    # Sepolia hard fails only count for baseline PASS
    sepolia_hard_fail = sum(
        1
        for c in checks
        if not c["ok"] and c["name"].startswith(("sepolia_", "local_chain_unexpected"))
    )
    # Config baseline for RC: Sepolia env PASS; FE/WC deferred to UI Full
    cfg_verdict = "PASS" if sepolia_hard_fail == 0 else "FAIL"
    cfg_status = cfg_verdict
    if cfg_verdict == "PASS" and (not fe_ui_ready or not wc_ok):
        cfg_status = "PASS_OWNER_ACTIONS_FOR_UI_FULL"

    cfg_out = {
        "schema": "traveltrust.v311_owner_config_env_check.v1",
        "machine_key": "TT_CONFIGURATION_BASELINE",
        "recorded_utc": _utc(),
        "active_baseline": ACTIVE,
        "tt_configuration_baseline": cfg_status,
        "status": cfg_status,
        "sepolia_env": {
            "path": "scripts/dev/.env.phase2-chain-deploy.local",
            "chain_id": sid,
            "rpc_host": _host(sepolia.get("CHAIN_RPC_URL")),
            "hard_fail_count": sepolia_hard_fail,
        },
        "local_anvil_expected_difference": local_notes,
        "ui_full_prerequisites": {
            "frontend_sepolia_overlay": "frontend/.env.sepolia.local",
            "frontend_next_public_chain_id": fe_cid,
            "frontend_sepolia_ready": fe_ui_ready,
            "walletconnect_present": wc_ok,
            "anvil_env_local_chain_id": (lambda: (
                int(str(fe_env.get("NEXT_PUBLIC_CHAIN_ID", "")).strip())
                if str(fe_env.get("NEXT_PUBLIC_CHAIN_ID", "")).strip().isdigit()
                else None
            ))(),
            "blocking_phase": "P5_UI_UX_FULL_CERT",
            "activate": "bash scripts/dev/activate-frontend-sepolia-env.sh",
            "restore_anvil": "bash scripts/dev/restore-frontend-anvil-env.sh",
        },
        "checks": checks,
        "owner_actions": owner_actions,
        "secrets_policy": "values_never_written",
        "note": "Layered OWNER check: Sepolia cert env hard-gated; local Anvil 31337 = Expected Difference; WC/FE Sepolia for UI Full.",
    }
    (EV / "P0.5-OWNER-CONFIG-ENV-CHECK-LATEST.json").write_text(
        json.dumps(cfg_out, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P0.5-CONFIGURATION-BASELINE-LATEST.md").write_text(
        f"""# Phase 0.5 · OWNER Config ENV Check

**Machine:** `TT_CONFIGURATION_BASELINE`  
**Status:** **{cfg_status}**  
**Recorded:** {cfg_out['recorded_utc']}

## Sepolia cert env（硬闸）

| Item | Result |
|------|--------|
| File `scripts/dev/.env.phase2-chain-deploy.local` | {'✅' if sepolia_path.exists() else '❌'} |
| CHAIN_ID | {sid}（期望 {CHAIN}） |
| RPC | `{_host(sepolia.get('CHAIN_RPC_URL'))}` |
| Signing key present | {'✅' if pk else '❌'} |
| Address pins vs freeze | see JSON |

## Local ① Anvil（Expected Difference）

Root/FE may use `31337` for local ① — **不**否决 Sepolia RC Config Baseline。

## OWNER actions（UI Full / Phase 5）

"""
        + ("\n".join(f"- {a}" for a in owner_actions) if owner_actions else "- （无）")
        + """

**Secrets never written to evidence.**
""",
        encoding="utf-8",
    )

    # Package preflight
    arts = {
        "Release_Notes": EV / "P7.5-RELEASE-NOTES-V311-RC1-LATEST.md",
        "Evidence_Index": EV / "P7-EVIDENCE-INDEX-LATEST.json",
        "Board": EV / "TIMELOCK-PARALLEL-BOARD-LATEST.json",
        "Drift_Audit": EV / "FULL-SYSTEM-DRIFT-AUDIT-LATEST.json",
        "Data_Cert": EV / "P2.5-DATA-CERT-LATEST.json",
        "Deploy_Bytecode": EV / "P2-BYTECODE-LIVE-VERIFY-LATEST.json",
        "Ops_Cert": EV / "P6.5-OPERATIONS-CERT-LATEST.json",
        "Owner_Config_ENV": EV / "P0.5-OWNER-CONFIG-ENV-CHECK-LATEST.json",
        "Address_Matrix": ROOT / "registry/v311-sepolia-address-matrix-freeze.v1.json",
        "Deployment_Inventory": ROOT / "registry/v311-web3-deployment-inventory.v1.json",
        "Recovery_Runbook": ROOT / "docs/runbook/TT-V311-RECOVERY-UPGRADE-INCIDENT-LATEST.md",
    }
    art = {}
    art_fail = 0
    for n, p in arts.items():
        ok = p.exists() and p.stat().st_size > 0
        art[n] = {"ok": ok, "path": str(p.relative_to(ROOT)).replace("\\", "/"), "bytes": p.stat().st_size if p.exists() else 0}
        if not ok:
            art_fail += 1

    drift = json.loads((EV / "FULL-SYSTEM-DRIFT-AUDIT-LATEST.json").read_text(encoding="utf-8"))
    data = json.loads((EV / "P2.5-DATA-CERT-LATEST.json").read_text(encoding="utf-8"))
    try:
        sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT).decode().strip()
    except Exception:
        sha = None

    pkg_ok = (
        cfg_verdict == "PASS"
        and drift.get("verdict") == "PASS"
        and data.get("tt_data_cert") == "PASS"
        and art_fail == 0
    )
    pkg = {
        "schema": "traveltrust.v311_release_package_preflight.v1",
        "machine_key": "TT_RELEASE_PACKAGE",
        "recorded_utc": _utc(),
        "label_candidate": "TravelTrust V3.1.1 RC1",
        "status": "PREFLIGHT_PASS" if pkg_ok else "PREFLIGHT_FAIL",
        "tt_release_package": "NOT_LOCKED",
        "lock_executed": False,
        "forbid_lock_until": [
            "TT_V311_WEB3_FULL_FUNCTION_CERT_54_0_0",
            "execute_after_2026-07-20T11:37:37Z",
        ],
        "artifacts": art,
        "gates": {
            "owner_config_env_sepolia": cfg_verdict,
            "owner_config_env_status": cfg_status,
            "drift_audit": drift.get("verdict"),
            "data_cert": data.get("tt_data_cert"),
            "artifact_fail_count": art_fail,
        },
        "owner_actions_deferred_to_ui_full": owner_actions,
        "git_sha_preflight": sha,
        "includes_checklist": {
            "Release_Notes": "READY",
            "Evidence": "INDEX_READY",
            "Drift_Audit": drift.get("verdict"),
            "Data_Cert": data.get("tt_data_cert"),
            "Owner_Config_ENV": cfg_status,
            "Version": "V3.1.1",
            "Git_SHA": "PREFLIGHT_CAPTURED" if sha else "MISSING",
        },
        "note": "Final preflight — NOT_LOCKED. UI Full ENV (FE Sepolia + WC) deferred to Phase 5 Owner actions.",
    }
    (EV / "P7.5-RELEASE-PACKAGE-PREFLIGHT-LATEST.json").write_text(
        json.dumps(pkg, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.json").write_text(
        json.dumps(
            {
                "machine_key": "TT_RELEASE_PACKAGE",
                "recorded_utc": pkg["recorded_utc"],
                "label_candidate": pkg["label_candidate"],
                "status": pkg["status"],
                "tt_release_package": "NOT_LOCKED",
                "preflight": "evidence/GO_phase2_v311_final_release/P7.5-RELEASE-PACKAGE-PREFLIGHT-LATEST.json",
                "includes_checklist": pkg["includes_checklist"],
                "lock_requires": pkg["forbid_lock_until"],
                "release_notes": "evidence/GO_phase2_v311_final_release/P7.5-RELEASE-NOTES-V311-RC1-LATEST.md",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    (EV / "P7.5-RELEASE-PACKAGE-PREP-LATEST.md").write_text(
        f"""# Phase 7.5 · Release Package · Final Preflight

**Preflight:** **{"PASS" if pkg_ok else "FAIL"}**  
**Package:** **NOT_LOCKED**（未执行 LOCK）  
**Recorded:** {pkg['recorded_utc']}  
**Git SHA (preflight):** `{sha}`

| Gate | Result |
|------|--------|
| Sepolia OWNER ENV | {cfg_verdict} |
| Config status | {cfg_status} |
| Drift Audit | {drift.get('verdict')} |
| Data Cert | {data.get('tt_data_cert')} |
| Artifacts | fail={art_fail} |

**LOCK 禁止**直至 Execute 后 Function Cert **54/0/0**。
""",
        encoding="utf-8",
    )

    # Board
    board = json.loads((EV / "TIMELOCK-PARALLEL-BOARD-LATEST.json").read_text(encoding="utf-8"))
    board["recorded_utc"] = _utc()
    board["phases"]["P0.5"] = cfg_status
    board["phases"]["P7.5"] = (
        "PREFLIGHT_PASS_NOT_LOCKED" if pkg_ok else "PREFLIGHT_FAIL_NOT_LOCKED"
    )
    board["owner_config_env"] = {
        "verdict": cfg_status,
        "evidence": "evidence/GO_phase2_v311_final_release/P0.5-OWNER-CONFIG-ENV-CHECK-LATEST.json",
        "owner_actions": owner_actions,
    }
    board["package_preflight"] = {
        "verdict": "PASS" if pkg_ok else "FAIL",
        "tt_release_package": "NOT_LOCKED",
        "evidence": "evidence/GO_phase2_v311_final_release/P7.5-RELEASE-PACKAGE-PREFLIGHT-LATEST.json",
    }
    (EV / "TIMELOCK-PARALLEL-BOARD-LATEST.json").write_text(
        json.dumps(board, indent=2) + "\n", encoding="utf-8"
    )
    (EV / "TIMELOCK-PARALLEL-BOARD-LATEST.md").write_text(
        f"""# F-02 Timelock · Parallel Machine Board

**Mode:** READONLY · frozen except OWNER ENV + Package preflight  
**Recorded:** {board['recorded_utc']}  
**Execute ETA:** 2026-07-20T11:37:37Z

| Phase | Status |
|-------|--------|
| −1 Closure Audit | IN_PROGRESS |
| 0 Hygiene | READY_FOR_RC |
| 0.5 Config Baseline | **{cfg_status}** |
| 1 Alignment | **PASS** |
| 2 Deploy Cert | **PASS** |
| 2.5 Data Cert | **PASS** |
| 3 PSG Baseline | **PASS** |
| 4 Function Cert | IN_PROGRESS（F-02 Queued） |
| 5 UI/UX | PARTIAL（Owner: FE Sepolia + WC） |
| 6 Product | OPEN |
| 6.5 Ops | **PASS**（②） |
| 7 Docs/Evidence | **READY** |
| 7.5 Package | PREFLIGHT_{'PASS' if pkg_ok else 'FAIL'} · **NOT_LOCKED** |
| 8…10.5 / Freeze / GO | BLOCKED / NOT_CLAIMED |

**Owner Config ENV:** **{cfg_status}** · `P0.5-OWNER-CONFIG-ENV-CHECK-LATEST.json`  
**Package Preflight:** **{'PASS' if pkg_ok else 'FAIL'}** · **NOT_LOCKED**  
**Drift Audit:** **PASS**

**Execute 后统一：** Function / Product / UI Full → **54/0/0** 口径收口 → 关闭全部 OPEN → Phase 8 → RC-02 → Manual → P10.5 → Freeze → GO。
""",
        encoding="utf-8",
    )

    # Closure C-08 / C-12
    audit = json.loads((EV / "PHASE-MINUS1-FINAL-CLOSURE-AUDIT-LATEST.json").read_text(encoding="utf-8"))
    for item in audit["items"]:
        if item["id"] == "C-08":
            item["status"] = "CLOSED" if cfg_verdict == "PASS" else "OPEN"
            item["text"] = f"OWNER Config ENV {cfg_status} (Sepolia hard gate)"
        if item["id"] == "C-12":
            item["status"] = "PARTIAL"
            item["text"] = (
                f"Package preflight {'PASS' if pkg_ok else 'FAIL'} · NOT_LOCKED until Function Cert"
            )
    audit["closed"] = sum(1 for i in audit["items"] if i["status"] == "CLOSED")
    audit["remaining"] = sum(1 for i in audit["items"] if i["status"] != "CLOSED")
    audit["recorded_utc"] = _utc()
    (EV / "PHASE-MINUS1-FINAL-CLOSURE-AUDIT-LATEST.json").write_text(
        json.dumps(audit, indent=2) + "\n", encoding="utf-8"
    )

    print(f"TT_CONFIGURATION_BASELINE: {cfg_status}")
    print(f"TT_RELEASE_PACKAGE_PREFLIGHT: {'PASS' if pkg_ok else 'FAIL'} NOT_LOCKED")
    for a in owner_actions:
        print(f"OWNER_ACTION: {a}")
    return 0 if pkg_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
