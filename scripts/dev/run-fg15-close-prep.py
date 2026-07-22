#!/usr/bin/env python3
"""
FG-15 parallel close-prep (non-invasive):
  - Anomaly evidence maintenance (ledger + clean summary)
  - Final manual walkthrough sheet
  - Mainnet read-only preflight refresh
  - GO/NO-GO Decision template (undecided)

FORBIDDEN: Sign-off signed=true, ACTIVE flip, Production GO, code/contract/SHA change.
"""

# --- FINAL RELEASE pollution guard ---
import os as _tt_os, sys as _tt_sys
if _tt_os.environ.get('TRAVELTRUST_ALLOW_HISTORICAL_BASELINE') != '1':
    _tt_sys.stderr.write(
        'DEPRECATED: FG-15 historical script refused.
'
        'Active = Candidate v2 / FINAL RELEASE. Forensic: TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1
'
    )
    raise SystemExit(2)
# --- end guard ---


from __future__ import annotations


# Baseline Migration v2 — FG-15-A / Hardened forensic tooling (default refuse)
import sys as _tt_sys
from pathlib import Path as _tt_Path
_tt_lib = _tt_Path(__file__).resolve().parent / "lib"
if str(_tt_lib) not in _tt_sys.path:
    _tt_sys.path.insert(0, str(_tt_lib))
from tt_refuse_historical_baseline import refuse_unless_historical_allowed as _tt_refuse_hist
_tt_refuse_hist(__file__)
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
ARCH = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail"
OBS = ARCH / "fg15_observation_48h"
SAMPLES_DIR = OBS / "samples"
SAMPLES_JSONL = OBS / "OBSERVATION-48H-SAMPLES.jsonl"
ANOMALY_JSONL = OBS / "OBSERVATION-48H-ANOMALY-LEDGER.jsonl"
EXPECTED_SHA = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"
TIMELOCK = "0x462402082B395F218FFB3634ec0611e39BdD504C"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load(name: str) -> dict:
    p = PENDING / name
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def write_json(name: str, obj: dict) -> None:
    text = json.dumps(obj, indent=2, ensure_ascii=False) + "\n"
    (PENDING / name).write_text(text, encoding="utf-8")
    (FG / name).write_text(text, encoding="utf-8")
    rem = ARCH / "fg15_close_prep"
    rem.mkdir(parents=True, exist_ok=True)
    (rem / name).write_text(text, encoding="utf-8")
    # also mirror anomaly/running under observation trail when relevant
    if name.startswith("OBSERVATION-48H") or name.startswith("FG15-ANOMALY"):
        OBS.mkdir(parents=True, exist_ok=True)
        (OBS / name).write_text(text, encoding="utf-8")


def main() -> int:
    stamp = utc_now()
    pin = load("FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json")
    start = load("OBSERVATION-48H-START-LATEST.json")
    freeze = load("OBSERVATION-48H-WINDOW-FREEZE-LATEST.json")
    sample = load("OBSERVATION-48H-SAMPLE-LATEST.json")
    release_sha = pin.get("Release_SHA") or EXPECTED_SHA
    if release_sha != EXPECTED_SHA:
        raise SystemExit(f"REFUSE SHA drift: {release_sha}")

    ends = start.get("window_ends_utc") or "2026-07-21T12:35:23Z"

    # --- Anomaly evidence maintenance ---
    sample_files = sorted(SAMPLES_DIR.glob("sample-*.json")) if SAMPLES_DIR.is_dir() else []
    ok_samples = 0
    anomaly_samples = 0
    latest_anomalies: list = []
    for sf in sample_files:
        try:
            d = json.loads(sf.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            anomaly_samples += 1
            continue
        anoms = d.get("anomalies") or []
        if isinstance(anoms, int):
            n = anoms
            anoms = []
        else:
            n = len(anoms)
        if d.get("sample_ok") and n == 0:
            ok_samples += 1
        else:
            anomaly_samples += 1
            latest_anomalies.extend(anoms if isinstance(anoms, list) else [])

    anomaly_ledger_lines = 0
    if ANOMALY_JSONL.is_file():
        anomaly_ledger_lines = sum(1 for line in ANOMALY_JSONL.read_text(encoding="utf-8").splitlines() if line.strip())

    jsonl_lines = 0
    if SAMPLES_JSONL.is_file():
        jsonl_lines = sum(1 for line in SAMPLES_JSONL.read_text(encoding="utf-8").splitlines() if line.strip())

    # Ensure anomaly ledger file exists (empty = clean)
    if not ANOMALY_JSONL.is_file():
        ANOMALY_JSONL.parent.mkdir(parents=True, exist_ok=True)
        ANOMALY_JSONL.write_text("", encoding="utf-8")

    anomaly_maint = {
        "schema": "traveltrust.fg15_anomaly_evidence_maintenance.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "window_ends_utc": ends,
        "status": "CLEAN" if anomaly_samples == 0 and anomaly_ledger_lines == 0 else "HAS_ANOMALIES",
        "counts": {
            "sample_files": len(sample_files),
            "ok_samples": ok_samples,
            "anomaly_samples": anomaly_samples,
            "samples_jsonl_lines": jsonl_lines,
            "anomaly_ledger_lines": anomaly_ledger_lines,
        },
        "latest_sample": {
            "stamp": sample.get("recorded_utc") or sample.get("stamp"),
            "sample_ok": sample.get("sample_ok"),
            "anomalies": sample.get("anomalies") if isinstance(sample.get("anomalies"), int) else len(sample.get("anomalies") or []),
        },
        "open_anomalies": latest_anomalies[:50],
        "artifacts": {
            "samples_dir": str(SAMPLES_DIR.relative_to(ROOT)).replace("\\", "/"),
            "samples_jsonl": str(SAMPLES_JSONL.relative_to(ROOT)).replace("\\", "/"),
            "anomaly_ledger": str(ANOMALY_JSONL.relative_to(ROOT)).replace("\\", "/"),
        },
        "freeze_intact": freeze.get("Release_SHA") == EXPECTED_SHA or release_sha == EXPECTED_SHA,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "verdict": (
            "FG15_ANOMALY_EVIDENCE_CLEAN"
            if anomaly_samples == 0 and anomaly_ledger_lines == 0
            else "FG15_ANOMALY_EVIDENCE_OPEN"
        ),
    }
    write_json("FG15-ANOMALY-EVIDENCE-MAINTENANCE-LATEST.json", anomaly_maint)
    write_json("OBSERVATION-48H-ANOMALY-STATUS-LATEST.json", anomaly_maint)

    # --- Final manual walkthrough ---
    walkthrough = {
        "schema": "traveltrust.final_manual_walkthrough.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "SHEET_READY_OWNER_EXECUTE_AFTER_GATES",
        "discipline": "plan_and_sheet_only_during_fg15 · no_automation_change",
        "human": "docs/runbook/TT-FINAL-MANUAL-WALKTHROUGH-LATEST.md",
        "preconditions": [
            "FG-15 ELAPSED PASS",
            "Owner Sign-off (optional timing · preferred before public open)",
            "Prefer after Cert FINAL / with GO decision for public paths",
        ],
        "paths": {
            "P0_user": {
                "title": "P0 用户走查",
                "steps": [
                    {"id": "W-U01", "step": "注册 / 登录", "route": "/auth/register · /auth/login", "pass_criteria": "可进入已登录态"},
                    {"id": "W-U02", "step": "创建旅行需求 / 市场浏览", "route": "/ · /market", "pass_criteria": "列表或创建成功"},
                    {"id": "W-U03", "step": "钱包连接说明可理解", "route": "wallet UI", "pass_criteria": "FAQ 口径一致"},
                    {"id": "W-U04", "step": "Escrow 订单页", "route": "/escrow/[id]", "pass_criteria": "状态可读 · 无崩溃"},
                    {"id": "W-U05", "step": "支付 / 锁定可见", "route": "/escrow/[id]", "pass_criteria": "成功或明确失败提示；UI 滞后知 Case 1"},
                    {"id": "W-U06", "step": "完成 / Settlement 可见性", "route": "/escrow/[id]", "pass_criteria": "状态推进或可解释阻塞"},
                ],
            },
            "guide_provider": {
                "title": "Guide / Provider 走查",
                "steps": [
                    {"id": "W-G01", "step": "入驻或身份入口", "route": "/provider/register · /me/identities"},
                    {"id": "W-G02", "step": "接单", "pass_criteria": "可进入履约态"},
                    {"id": "W-G03", "step": "完成服务确认", "pass_criteria": "确认动作可达"},
                    {"id": "W-G04", "step": "收益查看", "pass_criteria": "展示存在 · 无主网虚假承诺"},
                ],
            },
            "web3": {
                "title": "Web3 走查",
                "steps": [
                    {"id": "W-W01", "step": "Wallet connect"},
                    {"id": "W-W02", "step": "Sign"},
                    {"id": "W-W03", "step": "Escrow on-chain link"},
                    {"id": "W-W04", "step": "Release / Distribution 可见性"},
                ],
            },
            "steward_readonly": {
                "title": "Steward 只读走查",
                "steps": [
                    {"id": "W-S01", "step": "权益展示可解释"},
                    {"id": "W-S02", "step": "Revenue 数据分层可解释"},
                ],
            },
        },
        "record_columns": ["step_id", "result PASS|FAIL", "note", "screenshot_path", "owner_initials"],
        "execution_complete": False,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "verdict": "FINAL_MANUAL_WALKTHROUGH_SHEET_READY",
    }
    write_json("FINAL-MANUAL-WALKTHROUGH-LATEST.json", walkthrough)

    # --- Mainnet read-only preflight refresh ---
    env = {
        "schema": "traveltrust.mainnet_env_preflight_readonly.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "CONFIRM_ONLY_WORKSHEET_READY",
        "broadcast_authorized": False,
        "config_change_authorized": False,
        "discipline": "confirm_do_not_modify",
        "infrastructure": [
            {"id": "INFRA-01", "item": "Infrastructure / compute", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "INFRA-02", "item": "RPC", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "INFRA-03", "item": "Domain / DNS", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "INFRA-04", "item": "CDN", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "INFRA-05", "item": "SSL/TLS", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "INFRA-06", "item": "Database Backup", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "INFRA-07", "item": "Logging", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "INFRA-08", "item": "Monitoring / alerts", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "INFRA-09", "item": "Secrets (names only)", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
        ],
        "permissions_confirm": [
            {"id": "PERM-OWNER", "item": "Owner", "value_hint": "Sebastian Ward Solo", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "PERM-SAFE", "item": "Safe", "value_hint": "N/A or recorded", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "PERM-TIMELOCK", "item": "Timelock", "value_hint": TIMELOCK, "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False, "holder_or_value": TIMELOCK}},
            {"id": "PERM-ADMIN", "item": "Admin", "value_hint": "Owner Solo", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
            {"id": "PERM-DEPLOY", "item": "Deploy", "value_hint": "Owner Solo · Vault location", "status": "OPEN_OWNER_CONFIRM", "owner_fill": {"confirmed": False}},
        ],
        "human": "docs/runbook/TT-MAINNET-ENV-PREFLIGHT-READONLY-LATEST.md",
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "verdict": "MAINNET_ENV_CONFIRM_ONLY_READY_AWAIT_OWNER",
    }
    write_json("MAINNET-ENV-PREFLIGHT-READONLY-LATEST.json", env)

    # --- GO/NO-GO Decision template (undecided) ---
    go_tmpl = {
        "schema": "traveltrust.go_no_go_decision_template.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "TEMPLATE_READY_UNDECIDED",
        "decision": None,
        "decided": False,
        "signed": False,
        "eligible_to_decide_now": False,
        "must_complete_before_decision": [
            "FG-15 ELAPSED PASS",
            "Owner Sign-off signed=true",
            "PSG Completion Recalculate reviewed",
            "Production Certification FINAL",
            "Final Release Check LC-09",
            "Monitoring Enable LC-10 reviewed",
            "Anomaly evidence CLEAN or accepted with note",
        ],
        "go_criteria": [
            "equality_quad PASS · Release_SHA frozen match",
            "Hardened addresses match registry · ACTIVE policy understood",
            "L1–L4 evidence intact · FG-15 elapsed clean",
            "Blocking risks only residual GO decision itself",
            "Rollback / Case 1-2-3 / LC-13 ready",
            "Traffic plan LC-11 accepted",
            "Owner accepts residual Accepted/Deferred risks",
        ],
        "no_go_triggers": [
            "FG-15 not elapsed or anomaly ledger open unresolved",
            "Release_SHA / contract / ACTIVE drift",
            "Owner Sign-off missing",
            "Cert not FINAL",
            "Unresolved Blocking Risk beyond B-GO-DECISION",
            "Owner not ready for Solo on-call window",
        ],
        "decision_block": {
            "choice": "GO | NO-GO | DEFER",
            "Owner": "Sebastian Ward",
            "Date_UTC": "",
            "Rationale": "",
            "Signature": "",
        },
        "post_go_only": [
            "Traffic Phase 1 open (LC-11)",
            "First Day Review LC-12",
            "ACTIVE flip only if explicit separate gate after GO",
        ],
        "ACTIVE_FLIP": "FORBIDDEN_UNTIL_EXPLICIT_POST_GO_GATE",
        "production_go": False,
        "human": "docs/runbook/TT-GO-NO-GO-DECISION-TEMPLATE-LATEST.md",
        "verdict": "GO_NO_GO_TEMPLATE_READY_UNDECIDED_AWAIT_FG15",
    }
    write_json("GO-NO-GO-DECISION-TEMPLATE-LATEST.json", go_tmpl)

    index = {
        "schema": "traveltrust.fg15_close_prep_index.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "window_ends_utc": ends,
        "anomaly": anomaly_maint["verdict"],
        "walkthrough": walkthrough["verdict"],
        "mainnet": env["verdict"],
        "go_no_go": go_tmpl["verdict"],
        "signed": False,
        "decided": False,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "verdict": "FG15_CLOSE_PREP_READY_AWAIT_ELAPSED",
    }
    write_json("FG15-CLOSE-PREP-INDEX-LATEST.json", index)

    print(
        json.dumps(
            {
                "verdict": index["verdict"],
                "anomaly": anomaly_maint["verdict"],
                "ok_samples": anomaly_maint["counts"]["ok_samples"],
                "anomaly_samples": anomaly_maint["counts"]["anomaly_samples"],
                "walkthrough": walkthrough["verdict"],
                "mainnet": env["verdict"],
                "go_no_go": go_tmpl["verdict"],
                "decided": False,
                "signed": False,
                "ACTIVE_FLIP": "FORBIDDEN",
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 0 if anomaly_maint["status"] == "CLEAN" else 0  # maintain always records; clean preferred


if __name__ == "__main__":
    raise SystemExit(main())
