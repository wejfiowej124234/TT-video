#!/usr/bin/env python3
"""
FG-15 priority deepen (non-invasive) — operational LC-09～13 cards.

LC-09 Final Release Check
LC-10 Production Monitoring Enable
LC-11 Traffic Opening Plan
LC-12 First Day Review
LC-13 Emergency Response

Gate sequence (separate · do not conflate with LC titles):
  FG-15 ELAPSED → Owner Sign-off → Recalculate → Cert FINAL → GO/NO-GO

FORBIDDEN before FG-15 ELAPSED: code/contract/config/SHA/econ change,
ACTIVE flip, signed=true, Cert FINAL, Production GO.
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
EXPECTED_SHA = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"
TIMELOCK = "0x462402082B395F218FFB3634ec0611e39BdD504C"
HARDENED = {
    "escrowFactory": "0x49b6e57f1ade52cca287da653a8e0e7c23ae286d",
    "settlementRouter": "0x8cf12bcf7ca2005413f645614029f51d3efaa1c9",
    "feeRouter": "0xfed657db52120ee91165ca9d907c9df1475e2c86",
    "ownerOrTimelock": TIMELOCK,
}


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
    rem = ARCH / "fg15_priority_prep"
    rem.mkdir(parents=True, exist_ok=True)
    (rem / name).write_text(text, encoding="utf-8")


def main() -> int:
    stamp = utc_now()
    pin = load("FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json")
    start = load("OBSERVATION-48H-START-LATEST.json")
    risk = load("FINAL-RISK-REGISTER-LATEST.json")
    deferred = load("DEFERRED-ITEMS-LIST-LATEST.json")
    release_sha = pin.get("Release_SHA") or EXPECTED_SHA
    if release_sha != EXPECTED_SHA:
        raise SystemExit(f"REFUSE SHA drift: {release_sha}")

    ends = start.get("window_ends_utc") or "2026-07-21T12:35:23Z"

    post_fg15_gate = [
        {
            "id": "G1",
            "title": "FG-15 ELAPSED PASS",
            "command": "python scripts/dev/run-fg15-observation-elapsed-eval.py",
        },
        {
            "id": "G2",
            "title": "Owner Sign-off signed=true",
            "command": "python scripts/dev/run-owner-completion-signoff-package.py + Owner human sign",
        },
        {
            "id": "G3",
            "title": "PSG Completion Recalculate",
            "command": "python scripts/dev/run-psg-completion-matrix-recalculate.py",
        },
        {
            "id": "G4",
            "title": "Production Certification FINAL",
            "action": "Promote Cert DRAFT → FINAL",
        },
        {
            "id": "G5",
            "title": "GO / NO-GO",
            "gate": "SEPARATE_OWNER_DECISION",
        },
    ]

    # --- LC-09～13 operational cards (content COMPLETE as PREP; execute after gates) ---
    lc_cards = {
        "schema": "traveltrust.launch_lc09_13_execution_cards.v2",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "CONTENT_COMPLETE_EXECUTION_BLOCKED_UNTIL_POST_FG15_GO",
        "window_ends_utc": ends,
        "content_complete": True,
        "execution_complete": False,
        "honesty": {
            "content_complete_is_not_launch_execution": True,
            "do_not_execute_traffic_or_go_before_gates": True,
            "ACTIVE_FLIP": "FORBIDDEN",
            "production_go": False,
        },
        "post_fg15_gate_sequence": post_fg15_gate,
        "cards": [
            {
                "id": "LC-09",
                "title": "Final Release Check",
                "status": "CONTENT_READY_EXECUTION_BLOCKED",
                "purpose": "Confirm SHA · contract addresses · Evidence · Monitoring consistency",
                "checks": {
                    "SHA": {
                        "expected": EXPECTED_SHA,
                        "sources": [
                            "FINAL-COMPLETION-RELEASE-SHA-PIN-LATEST.json",
                            "OBSERVATION-48H-WINDOW-FREEZE-LATEST.json",
                            "equality_quad in Cert Package",
                        ],
                    },
                    "contracts": {
                        "expected": HARDENED,
                        "sources": [
                            "FCG-V2-SECURITY-HARDENED-ONCHAIN-BIND-LATEST.json",
                            "Cert contract_address_registry",
                        ],
                        "note": "Hardened bound · ACTIVE remains v311 until separate GO gate",
                    },
                    "Evidence": {
                        "sources": [
                            "L1-L5-EVIDENCE-INDEX-LATEST.json",
                            "PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json",
                            "FINAL-COMPLETION-EQUIVALENCE-BINDING-LATEST.json",
                        ],
                        "accept": "Source_SHA = Artifact = Bytecode = Evidence (equality_quad.pass)",
                    },
                    "Monitoring": {
                        "planes": ["API", "Indexer", "RPC", "DB", "Error"],
                        "sources": [
                            "FG-15 six-plane samples",
                            "OPS-SOP / LC-10 card",
                        ],
                    },
                },
                "accept_when_executed": [
                    "Release_SHA match freeze",
                    "Hardened addresses match registry",
                    "equality_quad.pass=true",
                    "Monitoring planes named and owners assigned (LC-10)",
                ],
            },
            {
                "id": "LC-10",
                "title": "Production Monitoring Enable",
                "status": "CONTENT_READY_EXECUTION_BLOCKED",
                "purpose": "Confirm API · Indexer · RPC · DB · Error Alert · who watches launch day",
                "surfaces": [
                    {
                        "id": "MON-API",
                        "name": "API",
                        "probe": "/health · uptime",
                        "owner_role": "Owner Solo on-call",
                    },
                    {
                        "id": "MON-INDEXER",
                        "name": "Indexer",
                        "probe": "lag / cursor · Epic-D ladder",
                        "owner_role": "Owner Solo on-call",
                    },
                    {
                        "id": "MON-RPC",
                        "name": "RPC",
                        "probe": "RPC health · rate limits",
                        "owner_role": "Owner Solo on-call",
                    },
                    {
                        "id": "MON-DB",
                        "name": "DB",
                        "probe": "connectivity · backup window known",
                        "owner_role": "Owner Solo on-call",
                    },
                    {
                        "id": "MON-ERROR",
                        "name": "Error Alert",
                        "probe": "error rate / 5xx / anomaly ledger",
                        "owner_role": "Owner Solo on-call",
                    },
                ],
                "launch_day_watch": {
                    "primary": "Sebastian Ward (Owner = On-call)",
                    "backup": "HOLD / Solo deferred pager",
                    "cadence": "continuous first 24h · align LC-12 1h/6h/24h",
                },
                "enable_note": "Prep = assign + confirm probes. Do not mutate production config during FG-15.",
                "ssot": [
                    "OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.json",
                    "docs/runbook/TT-OPS-INCIDENT-CONTACT-AND-WINDOW-LATEST.md",
                ],
            },
            {
                "id": "LC-11",
                "title": "Traffic Opening Plan",
                "status": "CONTENT_READY_EXECUTION_BLOCKED",
                "purpose": "First-batch users · phased open · how to close entry on anomaly",
                "strategy": {
                    "phase_0": "Internal / Owner only smoke (no public blast)",
                    "phase_1": "Controlled Minimum cohort (invite / soft cap)",
                    "phase_2": "Wider open only after LC-12 6h/24h green",
                },
                "first_batch": {
                    "who": "Owner-selected early users + test accounts C1–C4 / E2 (registry SSOT)",
                    "cap": "narrow surface · Solo ops capacity",
                    "channels": "direct invite · no paid acquisition blast day-0",
                },
                "close_entry_on_anomaly": {
                    "modes": ["OBSERVE", "PAUSE", "STOP"],
                    "actions": [
                        "Maintenance / feature flag pause public entry",
                        "Do not rewrite contracts in incident window",
                        "Follow Rollback Decision Tree + Case 1/2/3",
                    ],
                    "ssot": [
                        "PRODUCTION-ROLLBACK-PLAN-PACK-LATEST.json",
                        "TT-PRODUCTION-ROLLBACK-DECISION-TREE-LATEST.md",
                    ],
                },
                "depends_on_gate": "G5 GO decision before public phase_1+",
            },
            {
                "id": "LC-12",
                "title": "First Day Review",
                "status": "CONTENT_READY_EXECUTION_BLOCKED",
                "purpose": "1h / 6h / 24h checks after open",
                "checkpoints": [
                    {
                        "id": "T+1h",
                        "when": "1 hour after traffic open",
                        "checks": ["订单创建/状态", "支付成功可见性", "API/Indexer 健康", "Error alert 静默或已处置"],
                    },
                    {
                        "id": "T+6h",
                        "when": "6 hours after traffic open",
                        "checks": ["订单漏斗", "支付→Escrow 投影", "Settlement 是否卡住", "用户反馈渠道"],
                    },
                    {
                        "id": "T+24h",
                        "when": "24 hours after traffic open",
                        "checks": ["全日订单/支付/Settlement 汇总", "异常 Case 计数", "用户反馈分级", "是否维持开放或 PAUSE"],
                    },
                ],
                "review_dimensions": ["订单", "支付", "Settlement", "用户反馈"],
                "record_to": "evidence note / Owner day-1 review (new artifact after GO · not now)",
            },
            {
                "id": "LC-13",
                "title": "Emergency Response",
                "status": "CONTENT_READY_EXECUTION_BLOCKED",
                "purpose": "Who executes pause → investigate → recover for payment/contract/data/security",
                "triggers": [
                    {"id": "E-PAY", "title": "支付异常", "playbook": "Case 1 · Tx→Event→Indexer→DB→API→UI"},
                    {"id": "E-CONTRACT", "title": "合约异常", "playbook": "Case 2 / explorer state · Timelock-aware · no hot rewrite"},
                    {"id": "E-DATA", "title": "数据异常", "playbook": "Indexer/DB reconcile · Epic-D · lag gate"},
                    {"id": "E-SEC", "title": "安全事件", "playbook": "Case 3 · 发现→暂停入口→保护资金→调查→恢复"},
                ],
                "executor": {
                    "pause": "Owner Solo",
                    "investigate": "Owner Solo",
                    "recover": "Owner Solo after evidence + decision",
                },
                "flow": ["暂停", "排查", "恢复"],
                "ssot": [
                    "OPS-INCIDENT-RUNBOOK-LAUNCH-LATEST.json",
                    "PRODUCTION-INCIDENT-RESPONSE.md",
                    "TT-PRODUCTION-ROLLBACK-DECISION-TREE-LATEST.md",
                ],
            },
        ],
        "human": "docs/runbook/TT-LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.md",
        "verdict": "LC09_13_CONTENT_COMPLETE_EXECUTION_BLOCKED",
    }
    write_json("LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.json", lc_cards)

    checklist_items = [
        {"id": "LC-01", "item": "FG-15 window RUNNING · freeze intact", "when": "now", "status": "IN_PROGRESS"},
        {"id": "LC-02", "item": "Six-plane samples accumulating · no open anomalies", "when": "now", "status": "IN_PROGRESS"},
        {"id": "LC-03", "item": "Cert Package DRAFT + equality quad", "when": "now", "status": "READY"},
        {"id": "LC-04", "item": "Owner Sign-off Draft attestation ready (unsigned)", "when": "now", "status": "READY"},
        {"id": "LC-05", "item": "Ops Incident Case 1/2/3 runbooks", "when": "now", "status": "READY"},
        {"id": "LC-06", "item": "Mainnet env preflight worksheet Owner fill", "when": "parallel", "status": "READY_FOR_OWNER"},
        {"id": "LC-07", "item": "CMS + User/Guide/Steward ops materials", "when": "parallel", "status": "READY_FOR_OWNER"},
        {"id": "LC-08", "item": "Manual UAT plan prepared", "when": "now", "status": "READY"},
        {
            "id": "LC-09",
            "item": "Final Release Check (SHA·合约·Evidence·Monitoring)",
            "when": "post_GO_or_pre_open",
            "status": "CONTENT_READY_EXECUTION_BLOCKED",
            "card": "LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.json",
        },
        {
            "id": "LC-10",
            "item": "Production Monitoring Enable (API·Indexer·RPC·DB·Alert·值班)",
            "when": "post_GO_or_pre_open",
            "status": "CONTENT_READY_EXECUTION_BLOCKED",
            "card": "LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.json",
        },
        {
            "id": "LC-11",
            "item": "Traffic Opening Plan (首批·分阶段·关入口)",
            "when": "post_GO",
            "status": "CONTENT_READY_EXECUTION_BLOCKED",
            "card": "LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.json",
        },
        {
            "id": "LC-12",
            "item": "First Day Review (1h/6h/24h)",
            "when": "after_open",
            "status": "CONTENT_READY_EXECUTION_BLOCKED",
            "card": "LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.json",
        },
        {
            "id": "LC-13",
            "item": "Emergency Response (暂停→排查→恢复)",
            "when": "on_incident",
            "status": "CONTENT_READY_EXECUTION_BLOCKED",
            "card": "LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.json",
        },
    ]
    write_json(
        "LAUNCH-DAY-CHECKLIST-LATEST.json",
        {
            "schema": "traveltrust.launch_day_checklist.v1",
            "recorded_utc": stamp,
            "status": "CHECKLIST_DRAFT_PRE_FG15_ELAPSED",
            "Release_SHA": release_sha,
            "human": "docs/runbook/TT-LAUNCH-DAY-CHECKLIST-LATEST.md",
            "items": checklist_items,
            "lc09_13_cards": "LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.json",
            "post_fg15_gate_sequence": post_fg15_gate,
            "pre_elapsed_forbidden": [
                "execute_LC09_13",
                "ACTIVE_flip",
                "Production_GO",
                "code_contract_config_change",
                "Owner_signed_true",
            ],
            "ACTIVE_FLIP": "FORBIDDEN",
            "production_go": False,
        },
    )

    # --- Mainnet preflight (confirm only) ---
    infra = [
        {"id": "INFRA-01", "item": "Infrastructure / compute", "owner_action": "confirm_only"},
        {"id": "INFRA-02", "item": "RPC endpoints (names/URLs plan)", "owner_action": "confirm_only"},
        {"id": "INFRA-03", "item": "Domain / DNS", "owner_action": "confirm_only"},
        {"id": "INFRA-04", "item": "CDN", "owner_action": "confirm_only"},
        {"id": "INFRA-05", "item": "SSL/TLS", "owner_action": "confirm_only"},
        {"id": "INFRA-06", "item": "Database backup window", "owner_action": "confirm_only"},
        {"id": "INFRA-07", "item": "Logging", "owner_action": "confirm_only"},
        {"id": "INFRA-08", "item": "Monitoring / alerts", "owner_action": "confirm_only"},
        {"id": "INFRA-09", "item": "Secrets / key management (names only)", "owner_action": "confirm_only"},
    ]
    perms = [
        {"id": "PERM-OWNER", "item": "Owner wallet / identity", "value_hint": "Sebastian Ward Solo"},
        {"id": "PERM-SAFE", "item": "Safe address (paper)", "value_hint": "record if used · else N/A"},
        {"id": "PERM-TIMELOCK", "item": "Timelock address (paper)", "value_hint": TIMELOCK},
        {"id": "PERM-ADMIN", "item": "Admin permission holders", "value_hint": "Owner Solo roles"},
        {"id": "PERM-DEPLOY", "item": "Deploy permission holders", "value_hint": "Owner Solo · Vault location only"},
    ]
    env = {
        "schema": "traveltrust.mainnet_env_preflight_readonly.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "CONFIRM_ONLY_WORKSHEET_READY",
        "broadcast_authorized": False,
        "config_change_authorized": False,
        "discipline": "confirm_do_not_modify",
        "infrastructure": [
            {
                **r,
                "status": "OPEN_OWNER_CONFIRM",
                "owner_fill": {"confirmed": False, "value": "", "notes": "", "hint": "只确认，不修改运行配置"},
            }
            for r in infra
        ],
        "permissions_confirm": [
            {
                **r,
                "status": "OPEN_OWNER_CONFIRM",
                "owner_fill": {
                    "confirmed": False,
                    "holder_or_value": r.get("value_hint") or "",
                    "notes": "",
                },
            }
            for r in perms
        ],
        "forbid_now": [
            "replace_ACTIVE_baseline",
            "broadcast_mainnet",
            "rotate_secrets_into_repo",
            "change_FeeRouter_Settlement_permissions",
            "redeploy_hardened_set",
            "change_Release_SHA",
        ],
        "human": "docs/runbook/TT-MAINNET-ENV-PREFLIGHT-READONLY-LATEST.md",
        "ssot_existing": [
            "docs/runbook/TT-MAINNET-ENV-PREP-NO-DEPLOY-LATEST.md",
            "docs/runbook/TT-MAINNET-READINESS-CHECKLIST-LATEST.md",
        ],
        "ACTIVE_FLIP": "FORBIDDEN",
        "verdict": "MAINNET_ENV_CONFIRM_ONLY_READY_AWAIT_OWNER",
    }
    write_json("MAINNET-ENV-PREFLIGHT-READONLY-LATEST.json", env)

    # --- CMS + ops materials (user FAQ depth) ---
    cms = {
        "schema": "traveltrust.cms_market_launch_prep.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "CONTENT_REVIEW_SHEET_READY_NO_SCHEMA_CHANGE",
        "forbid": ["core_data_structure_change", "catalog_schema_migration", "new_registry_dimensions"],
        "checklist": {
            "content_completeness": {"status": "OPEN_OWNER_REVIEW", "ask": "首发 Ambient+POI 是否覆盖约定国/城？"},
            "launch_cities": {"status": "OPEN_OWNER_REVIEW", "ask": "首发城市名单是否书面确认？"},
            "provider_display": {"status": "OPEN_OWNER_REVIEW", "ask": "Provider 展示是否与冻结入驻页一致？"},
            "guide_data": {"status": "OPEN_OWNER_REVIEW", "ask": "Guide 资料是否可支撑接单演示？"},
            "user_entry_points": {"status": "OPEN_OWNER_REVIEW", "ask": "用户入口说明是否与运营 FAQ 一致？"},
        },
        "ssot": ["data/catalog/cms-asset-matrix.v1.yaml", "scripts/dev/run-cms-daily-ops-board.cjs"],
        "ACTIVE_FLIP": "FORBIDDEN",
        "verdict": "CMS_MARKET_REVIEW_SHEET_READY",
    }
    write_json("CMS-MARKET-LAUNCH-PREP-LATEST.json", cms)

    ops_mat = {
        "schema": "traveltrust.launch_ops_materials.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "FAQ_READY_OWNER_REVIEW",
        "human": "docs/runbook/TT-LAUNCH-OPS-MATERIALS-LATEST.md",
        "audiences": {
            "user": {
                "faq": [
                    {
                        "id": "U-W1",
                        "q": "Wallet 是什么？",
                        "a": "链上身份与资金授权工具；连接后用于签名与 Escrow 相关链上动作，不是平台替你保管私钥。",
                    },
                    {
                        "id": "U-W2",
                        "q": "为什么需要签名？",
                        "a": "签名证明你授权该笔订单/支付/确认动作；平台不会替你发起未授权转账。",
                    },
                    {
                        "id": "U-W3",
                        "q": "资金如何保护？",
                        "a": "资金进入 Escrow 锁定，按合约规则释放/退款；异常时走 Dispute 与仲裁路径，而非私下改账。",
                    },
                    {
                        "id": "U-W4",
                        "q": "Dispute 怎么处理？",
                        "a": "订单内发起争议 → 提交证据 → Arbitrator 裁决 → 按结果结算/退款。页面未更新先查 Tx（Case 1）。",
                    },
                ],
                "routes": ["/auth/register", "/auth/login", "/market", "/escrow/[id]"],
            },
            "guide_provider": {
                "faq": [
                    {"id": "G-1", "q": "如何接单？", "a": "查看旅行需求 → 接单/确认服务 → 进入履约状态。"},
                    {"id": "G-2", "q": "如何完成服务？", "a": "履约完成后按流程确认完成；需遵守双边确认/Release Guard 边界。"},
                    {
                        "id": "G-3",
                        "q": "如何获得收益？",
                        "a": "完成并结算后查看收益面；勿把 Hardened NOT_ACTIVE 或测试网演示说成主网已发放。",
                    },
                ],
                "routes": ["/provider/register", "/me/identities"],
            },
            "steward": {
                "faq": [
                    {"id": "S-1", "q": "权益如何展示？", "a": "区域 steward 权益在治理/区域入口只读解释；以当时 ACTIVE 基线为准。"},
                    {
                        "id": "S-2",
                        "q": "Revenue 数据如何解释？",
                        "a": "区分链上事件、Indexer 投影与 API 展示；不一致时走 Case 1/2，不口头改数。",
                    },
                ],
                "routes": ["/governance/*"],
            },
        },
        "owner_review": "OPEN",
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "verdict": "LAUNCH_OPS_FAQ_READY_OWNER_REVIEW",
    }
    write_json("LAUNCH-OPS-MATERIALS-LATEST.json", ops_mat)

    # --- Owner Sign-off Draft (unsigned · integrity of confirm/risk/deferred/scope) ---
    accepted = risk.get("Accepted") or []
    deferred_items = deferred.get("items") or risk.get("Deferred") or []
    blocking = risk.get("Blocking") or []
    owner = {
        "schema": "traveltrust.owner_signoff_package_draft.v1",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "status": "DRAFT_INTEGRITY_READY_DO_NOT_SIGN",
        "signed": False,
        "eligible_for_final_signature": False,
        "confirmations_prepared": {
            "capabilities_completed_l1_l4": True,
            "known_risks_listed": True,
            "risk_acceptance_items_listed": True,
            "deferred_items_confirmed": True,
            "rollback_plan_confirmed": True,
            "release_authorization_scope_prepared": True,
            "responsibility_confirmed_solo_owner": True,
        },
        "risk_acceptance_prepared": [
            {"id": a.get("id"), "title": a.get("title"), "owner_accept": a.get("owner_accept")}
            for a in accepted
        ],
        "deferred_prepared": [
            {"id": d.get("id"), "title": d.get("title"), "blocking_psg_complete": d.get("blocking_psg_complete")}
            for d in deferred_items
        ],
        "blocking_still_open": [{"id": b.get("id"), "title": b.get("title")} for b in blocking],
        "release_authorization_scope": {
            "in_scope": [
                "Controlled Minimum release surface",
                "Hardened contract set bound (NOT_ACTIVE until GO gate)",
                "ACTIVE baseline remains v311_sepolia_clean_baseline until explicit post-GO action",
            ],
            "out_of_scope_until_separate_gate": [
                "ACTIVE flip",
                "Mainnet broadcast",
                "Economic rule / FeeRouter / Settlement permission changes",
                "Release_SHA change",
            ],
        },
        "attestation_prepared": {
            "signer_name_prepared": "Sebastian Ward",
            "signed": False,
            "text": (
                "I confirm capabilities, risks, accepted risks, deferred items, rollback plan, "
                f"and release authorization scope for Release_SHA {release_sha}. "
                "I will sign only after FG-15 ELAPSED PASS. ACTIVE flip and Production GO remain separate."
            ),
            "signature_block": {"Signer": "", "Date_UTC": "", "Signature": ""},
        },
        "must_wait": [
            "FG-15 ELAPSED PASS",
            "Owner human signature (signed=true)",
            "Then Recalculate → Cert FINAL → GO/NO-GO",
        ],
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "human": "docs/runbook/TT-OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.md",
        "verdict": "OWNER_SIGNOFF_DRAFT_INTEGRITY_READY_AWAIT_FG15",
    }
    write_json("OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json", owner)

    staged = load("PSG-COMPLETION-OWNER-SIGNOFF-PACKAGE-LATEST.json") or {}
    staged.update(
        {
            "recorded_utc": stamp,
            "Release_SHA": release_sha,
            "signed": False,
            "eligible_for_signature": False,
            "status": "PENDING_AWAIT_FG15_PASS",
            "draft_ref": "OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json",
            "confirmations_prepared": owner["confirmations_prepared"],
            "ACTIVE_FLIP": "FORBIDDEN",
            "production_go": False,
            "verdict": "OWNER_SIGNOFF_PACKAGE_STAGED_AWAIT_FG15",
        }
    )
    write_json("PSG-COMPLETION-OWNER-SIGNOFF-PACKAGE-LATEST.json", staged)

    index = {
        "schema": "traveltrust.fg15_priority_prep_deepen.v2",
        "recorded_utc": stamp,
        "Release_SHA": release_sha,
        "window_ends_utc": ends,
        "lc09_13_content_complete": True,
        "lc09_13_execution_complete": False,
        "signed": False,
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "artifacts": [
            "LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.json",
            "LAUNCH-DAY-CHECKLIST-LATEST.json",
            "MAINNET-ENV-PREFLIGHT-READONLY-LATEST.json",
            "CMS-MARKET-LAUNCH-PREP-LATEST.json",
            "LAUNCH-OPS-MATERIALS-LATEST.json",
            "OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json",
        ],
        "verdict": "PRIORITY_PREP_CONTENT_COMPLETE_AWAIT_FG15_ELAPSED",
    }
    write_json("FG15-PRIORITY-PREP-DEEPEN-LATEST.json", index)

    print(
        json.dumps(
            {
                "verdict": index["verdict"],
                "lc09_13": "CONTENT_COMPLETE_EXECUTION_BLOCKED",
                "titles": [c["title"] for c in lc_cards["cards"]],
                "mainnet": env["verdict"],
                "cms": cms["verdict"],
                "ops": ops_mat["verdict"],
                "owner": owner["verdict"],
                "signed": False,
                "ACTIVE_FLIP": "FORBIDDEN",
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
