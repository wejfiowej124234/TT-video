#!/usr/bin/env python3
"""Generate FG-15-B case index + per-case evidence maps (wait-window; no PASS claims)."""
import json
from collections import Counter
from pathlib import Path

UTC = "2026-07-20T02:55:00Z"
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
BASE = "v311_fund_safety_candidate_v2"
ROOT = Path("evidence/GO_fg15_observation_48h_candidate_v2")
CASES = ROOT / "fg-cases"
MP = "evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-LIVE-MONEY-PATH-L5-RUNTIME-LATEST.json"
ST = "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json"
IDENT = "evidence/GO_web3_candidate_v2/sepolia-deploy/CANDIDATE-V2-SEPOLIA-ADDRESS-IDENTITY-LATEST.json"
ETA = "2026-07-21T18:10:48Z"
ELAPSED = "2026-07-21T18:06:48Z"

FORBID = {
    "finalize_before_elapsed": True,
    "claim_l5_pass": True,
    "claim_fg15_pass": True,
    "hard_gate_flip": True,
    "mainnet_wave": True,
    "production_go": True,
}

cases = [
    {
        "id": "FG-01",
        "name": "Money-Path",
        "fgcase": "FGCASE-FG-01",
        "status": "READY_SLICE_PARTIAL",
        "slice": {"happy": "PASS", "dispute": "PASS", "settlement": "SCHEDULED_PENDING_EXECUTE"},
        "evidence": [MP, ST, IDENT],
        "residuals": ["RES-FG01-SETTLEMENT-EXECUTE-WAIT"],
        "ready_for_final_after": "settlement_finalize",
    },
    {
        "id": "FG-02",
        "name": "Escrow_State_Machine",
        "fgcase": "FGCASE-FG-02",
        "status": "READY_SLICE_PARTIAL",
        "slice": {
            "happy_escrow": "0x91C9688fA3d3164e551cFf22193286C35303A71c",
            "dispute_escrow": "0x7cd33340096B1abAae2c29AA91db6d9e880e908b",
        },
        "evidence": [MP],
        "residuals": ["RES-FG02-FULL-STATE-MATRIX-POST-FINALIZE"],
        "ready_for_final_after": "l5_final_evidence",
    },
    {
        "id": "FG-03",
        "name": "SettlementRouter",
        "fgcase": "FGCASE-FG-03",
        "status": "WAIT",
        "slice": {"schedule": "DONE", "execute": "WAIT", "eta": ETA},
        "evidence": [MP, ST],
        "residuals": ["RES-FG03-TIMELOCK-EXECUTE-WAIT"],
        "ready_for_final_after": "settlement_finalize",
    },
    {
        "id": "FG-04",
        "name": "FeeRouter",
        "fgcase": "FGCASE-FG-04",
        "status": "READY_SLICE_STRUCTURAL",
        "slice": {"owner": "TIMELOCK", "address": "0xf406e6f1277b990544d4f0556421c3c14df0ab28"},
        "evidence": [MP, IDENT, ST],
        "residuals": ["RES-FG04-LIVE-DISTRIBUTE-LEG-WAIT"],
        "ready_for_final_after": "settlement_finalize",
    },
    {
        "id": "FG-05",
        "name": "Distributable",
        "fgcase": "FGCASE-FG-05",
        "status": "WAIT",
        "slice": {"constitution_lock": "V3.1.1", "live_cycle": "WAIT_DISTRIBUTE_EXECUTE"},
        "evidence": ["docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md", MP],
        "residuals": ["RES-FG05-LIVE-DISTRIBUTABLE-CYCLE-WAIT"],
        "ready_for_final_after": "settlement_finalize",
    },
    {
        "id": "FG-06",
        "name": "Steward_Revenue",
        "fgcase": "FGCASE-FG-06",
        "status": "COLLECTING",
        "slice": {"live_steward_flow": "NOT_EVIDENCED_THIS_WINDOW"},
        "evidence": [
            "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
            "registry/v311-steward-lifecycle.v1.yaml",
        ],
        "residuals": ["RES-FG06-LIVE-STEWARD-FLOW-ABSENT"],
        "ready_for_final_after": "post_recalculate_empirical",
    },
    {
        "id": "FG-07",
        "name": "Treasury",
        "fgcase": "FGCASE-FG-07",
        "status": "COLLECTING",
        "slice": {"rails_named": True, "live_treasury_flow": "NOT_EVIDENCED_THIS_WINDOW"},
        "evidence": [
            "registry/v311-treasury-rails.v1.yaml",
            "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
        ],
        "residuals": ["RES-FG07-LIVE-TREASURY-FLOW-ABSENT"],
        "ready_for_final_after": "post_recalculate_empirical",
    },
    {
        "id": "FG-08",
        "name": "TTG_Governance",
        "fgcase": "FGCASE-FG-08",
        "status": "COLLECTING",
        "slice": {"local_smoke_pointer": "scripts/dev/smoke-governance-proposals-l5-local.sh"},
        "evidence": [
            "scripts/dev/smoke-governance-proposals-l5-local.sh",
            "docs/runbook/TT-WEB3-CANDIDATE-V2-LATEST.md",
        ],
        "residuals": ["RES-FG08-ONCHAIN-GOVERNANCE-CYCLE-WAIT"],
        "ready_for_final_after": "post_recalculate_empirical",
    },
    {
        "id": "FG-09",
        "name": "Timelock_Execute",
        "fgcase": "FGCASE-FG-09",
        "status": "READY_SLICE_PARTIAL",
        "slice": {"schedule": "DONE", "execute": "WAIT", "eta": ETA, "delay_s": 172800},
        "evidence": [MP, IDENT],
        "residuals": ["RES-FG09-EXECUTE-AFTER-ETA"],
        "ready_for_final_after": "settlement_finalize",
    },
    {
        "id": "FG-10",
        "name": "Wallet_Security",
        "fgcase": "FGCASE-FG-10",
        "status": "READY_SLICE_PARTIAL",
        "slice": {
            "arbitrator_safe": "0x7c018293396325077bb4D039930dcEe11B7Fb1Cf",
            "timelock": "0x462402082B395F218FFB3634ec0611e39BdD504C",
        },
        "evidence": [
            IDENT,
            "docs/runbook/TT-OA01-WALLETCONNECT-ACTIVATION-LATEST.md",
            "evidence/PSG-L3-security/faces/WALLET-ATTESTATION-LATEST.json",
        ],
        "residuals": ["RES-FG10-OA01-WC", "RES-FG10-MAINNET-WAVE-FORBIDDEN"],
        "ready_for_final_after": "never_mainnet_until_hard_gate",
    },
    {
        "id": "FG-11",
        "name": "RBAC",
        "fgcase": "FGCASE-FG-11",
        "status": "READY_FOR_RECALCULATE_INPUT",
        "slice": {"l3_pack": "READY_FOR_RECALCULATE", "rbac_metric": "60/96 DEFER_DENOM"},
        "evidence": [
            "evidence/PSG-L3-security/ATTEST-CANDIDATE-V2-LATEST.json",
            "evidence/PSG-L3-security/faces/RBAC-ATTESTATION-LATEST.json",
            "registry/psg-coverage-measurement-final.v1.yaml",
        ],
        "residuals": ["RES-FG11-RBAC-DEFER-DENOM"],
        "ready_for_final_after": "s7_recalculate",
    },
    {
        "id": "FG-12",
        "name": "Indexer",
        "fgcase": "FGCASE-FG-12",
        "status": "WAIT",
        "slice": {"candidate_consistency_prereq": "PASS", "full_indexer_rebind_proof": "WAIT"},
        "evidence": [ST, "evidence/GO_web3_candidate_v2/WEB3-CANDIDATE-V2-READINESS-ENTRY-LATEST.json"],
        "residuals": ["RES-FG12-FULL-INDEXER-PROOF-POST-FINALIZE"],
        "ready_for_final_after": "l5_final_evidence",
    },
    {
        "id": "FG-13",
        "name": "OnChain_DB_UI_Consistency",
        "fgcase": "FGCASE-FG-13",
        "status": "READY_SLICE_PARTIAL",
        "slice": {"onchain_consistency_prereq": "PASS", "full_equality_after_distribute": "WAIT"},
        "evidence": [ST, MP, "evidence/PSG-L2-data/ATTEST-CANDIDATE-V2-LATEST.json"],
        "residuals": ["RES-FG13-FULL-EQUALITY-POST-FINALIZE"],
        "ready_for_final_after": "l5_final_evidence",
    },
    {
        "id": "FG-14",
        "name": "Audit_Evidence",
        "fgcase": "FGCASE-FG-14",
        "status": "COLLECTING",
        "slice": {"fg15b_samples": True, "append_only": True},
        "evidence": [
            "evidence/GO_fg15_observation_48h_candidate_v2/samples/",
            ST,
            "evidence/GO_fg15_observation_48h_candidate_v2/samples/FG15B-SAMPLES-LEDGER.jsonl",
        ],
        "residuals": ["RES-FG14-FINAL-AUDIT-PACK-POST-ELAPSED"],
        "ready_for_final_after": "fg15b_elapsed",
    },
    {
        "id": "FG-15",
        "name": "Observation_48H",
        "fgcase": "FGCASE-FG-15",
        "status": "WAIT",
        "slice": {"observation": "RUNNING", "elapsed_pass": False, "earliest_elapsed_utc": ELAPSED},
        "evidence": [ST, "evidence/GO_fg15_observation_48h_candidate_v2/samples/"],
        "residuals": ["RES-FG15-NOT_ELAPSED"],
        "ready_for_final_after": "fg15b_elapsed",
    },
]


def main() -> None:
    for c in cases:
        doc = {
            "schema": "traveltrust.fg15b_case_slot.v1",
            "id": c["id"],
            "name": c["name"],
            "fgcase": c["fgcase"],
            "status": c["status"],
            "pass_claim": "FORBIDDEN_UNTIL_WINDOW_AND_FINAL",
            "equals_case_pass": False,
            "equals_l5_pass": False,
            "psg_release_version": PIN,
            "deploy_baseline": BASE,
            "recorded_utc": UTC,
            "slice": c["slice"],
            "evidence_map": c["evidence"],
            "residuals": c["residuals"],
            "ready_for_final_after": c["ready_for_final_after"],
            "forbid": FORBID,
            "final_evidence": None,
        }
        (CASES / c["id"]).mkdir(parents=True, exist_ok=True)
        (CASES / c["id"] / "STATUS-LATEST.json").write_text(
            json.dumps(doc, indent=2) + "\n", encoding="utf-8"
        )
        (CASES / c["id"] / "EVIDENCE-MAP-LATEST.json").write_text(
            json.dumps(
                {
                    "schema": "traveltrust.fg15b_case_evidence_map.v1",
                    "id": c["id"],
                    "recorded_utc": UTC,
                    "pointers": c["evidence"],
                    "status": c["status"],
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

    cnt = Counter(c["status"] for c in cases)
    index = {
        "schema": "traveltrust.fg15b_case_index.v1",
        "recorded_utc": UTC,
        "psg_release_version": PIN,
        "deploy_baseline": BASE,
        "fg15_b": {
            "status": "OBSERVATION_RUNNING",
            "elapsed_pass": False,
            "earliest_elapsed_utc": ELAPSED,
            "settlement_eta_utc": ETA,
        },
        "discipline": {
            "finalize": "FORBIDDEN_UNTIL_ELAPSED_AND_ETA",
            "l5_pass_claim": "FORBIDDEN",
            "hard_gate": "UNTOUCHED_CUTOVER_REFUSED",
            "wave": "FORBIDDEN",
            "production_go": "UNTOUCHED",
            "post_window_ladder": [
                "settlement_finalize",
                "l5_final_evidence",
                "psg_recalculate",
                "formal_release_baseline",
            ],
        },
        "status_counts": dict(cnt),
        "cases": [
            {
                "id": c["id"],
                "name": c["name"],
                "status": c["status"],
                "residuals": c["residuals"],
                "status_file": f"fg-cases/{c['id']}/STATUS-LATEST.json",
                "evidence_map": f"fg-cases/{c['id']}/EVIDENCE-MAP-LATEST.json",
            }
            for c in cases
        ],
        "auditable_roots": [
            ST,
            MP,
            IDENT,
            "evidence/GO_fg15_observation_48h_candidate_v2/samples/",
            "evidence/PSG-L3-security/",
            "evidence/PSG-L2-data/",
        ],
        "equals_l5_pass": False,
        "equals_psg_complete": False,
        "verdict": "STRUCTURE_INDEXED_COLLECTING_WAIT",
    }
    (CASES / "INDEX-LATEST.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
    (ROOT / "FG15B-CASE-INDEX-LATEST.json").write_text(
        json.dumps(index, indent=2) + "\n", encoding="utf-8"
    )

    all_res = []
    for c in cases:
        for r in c["residuals"]:
            all_res.append({"id": r, "case": c["id"], "case_status": c["status"]})
    (CASES / "RESIDUALS-LATEST.json").write_text(
        json.dumps(
            {
                "schema": "traveltrust.fg15b_case_residuals.v1",
                "recorded_utc": UTC,
                "psg_release_version": PIN,
                "count": len(all_res),
                "residuals": all_res,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    (CASES / "README.md").write_text(
        f"""# FG-15-B Case Structure

**Status:** STRUCTURE_INDEXED_COLLECTING_WAIT
**FG15_B:** OBSERVATION_RUNNING · elapsed_pass=false · ELAPSED >= {ELAPSED}
**Settlement ETA:** {ETA}

Forbidden until window: finalize · L5 PASS claim · Hard Gate · Wave · Production GO

Post-window: Settlement finalize -> L5 Final Evidence -> PSG Recalculate -> Formal Release Baseline

Index: INDEX-LATEST.json · ../FG15B-CASE-INDEX-LATEST.json
""",
        encoding="utf-8",
    )
    print("status_counts", dict(cnt))
    print("residuals", len(all_res))


if __name__ == "__main__":
    main()
