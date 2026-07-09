#!/usr/bin/env python3
"""Generate 146-row TTG cert execution ledger (MTM rows × §14 cert ownership)."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# §14 Final Closure Checklist — cert step → target tier + checklist IDs
CERT_STEPS: dict[int, dict] = {
    1: {
        "name": "Human UAT",
        "target_tier": "HUMAN_DONE",
        "ids": [
            "CHK-CORE-01",
            "CHK-FE-01",
            "CHK-FE-02",
            "CHK-FE-03",
            "CHK-FE-09",
            "CHK-FE-10",
            "CHK-FE-13",
            "CHK-OPS-12",
            "CHK-BASE-06",
        ],
        "uat_refs": ["A1", "A2", "A3", "A4", "A5", "A6", "D1", "D2", "D3", "D4"],
        "evidence_subdir": "human-uat",
        "signoff_file": "HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json",
    },
    2: {
        "name": "Multi Identity Walkthrough",
        "target_tier": "HUMAN_DONE",
        "ids": [
            "CHK-CORE-02",
            "CHK-CORE-23",
            "CHK-FE-15",
            "CHK-FE-12",
            "CHK-ID-01",
            "CHK-ID-02",
            "CHK-ID-03",
            "CHK-ID-04",
            "CHK-ID-05",
            "CHK-ID-06",
            "CHK-ID-07",
        ],
        "uat_refs": ["B1", "B2", "B3", "B4"],
        "evidence_subdir": "walkthrough/multi-identity",
        "signoff_file": "MULTI-IDENTITY-WALKTHROUGH-SIGNOFF.json",
    },
    3: {
        "name": "Admin Walkthrough",
        "target_tier": "HUMAN_DONE",
        "ids": [
            "CHK-CORE-03",
            "CHK-CORE-24",
            "CHK-FE-14",
            "CHK-ADM-01",
            "CHK-ADM-02",
            "CHK-ADM-03",
            "CHK-ADM-04",
            "CHK-ADM-05",
            "CHK-ADM-06",
            "CHK-ADM-07",
        ],
        "uat_refs": ["C1", "C2"],
        "evidence_subdir": "walkthrough/admin",
        "signoff_file": "ADMIN-WALKTHROUGH-SIGNOFF.json",
    },
    4: {
        "name": "Safe Walkthrough",
        "target_tier": "OPS_DONE",
        "ids": ["CHK-CORE-17", "CHK-OPS-03", "CHK-ID-10", "CHK-SC-12"],
        "evidence_subdir": "walkthrough/safe",
        "signoff_file": "SAFE-WALKTHROUGH-SIGNOFF.json",
    },
    5: {
        "name": "Finance Walkthrough",
        "target_tier": "OPS_DONE",
        "ids": ["CHK-CORE-15", "CHK-OPS-02", "CHK-ID-09", "CHK-FN-11"],
        "evidence_subdir": "walkthrough/finance",
        "signoff_file": "FINANCE-WALKTHROUGH-SIGNOFF.json",
    },
    6: {
        "name": "Phase B unpause",
        "target_tier": "OPS_DONE",
        "ids": ["CHK-OPS-11", "CHK-BASE-05", "CHK-CORE-04", "CHK-CORE-05", "CHK-CORE-06"],
        "evidence_subdir": "phase-b/unpause",
        "signoff_file": "PHASE-B-UNPAUSE-SIGNOFF.json",
    },
    7: {
        "name": "Execute",
        "target_tier": "OPS_DONE",
        "ids": ["CHK-CORE-07", "CHK-FE-08", "CHK-SC-01", "CHK-SC-02", "CHK-DR-01"],
        "evidence_subdir": "phase-b/execute",
        "signoff_file": "PHASE-B-EXECUTE-SIGNOFF.json",
    },
    8: {
        "name": "Treasury Spend",
        "target_tier": "OPS_DONE",
        "ids": ["CHK-CORE-08", "CHK-CORE-14", "CHK-FN-02", "CHK-SC-04"],
        "evidence_subdir": "phase-b/treasury-spend",
        "signoff_file": "PHASE-B-TREASURY-SPEND-SIGNOFF.json",
    },
    9: {
        "name": "Unstake",
        "target_tier": "OPS_DONE",
        "ids": ["CHK-SC-06", "CHK-CORE-10", "CHK-FE-12"],
        "evidence_subdir": "phase-b/unstake",
        "signoff_file": "PHASE-B-UNSTAKE-SIGNOFF.json",
    },
    10: {
        "name": "Emergency Pause",
        "target_tier": "DR_DONE",
        "ids": ["CHK-DR-10", "CHK-CORE-18", "CHK-OPS-07"],
        "evidence_subdir": "phase-b/emergency-pause",
        "signoff_file": "INCIDENT-TABLETOP-SIGNOFF.json",
    },
    11: {
        "name": "Emergency Unpause / DR Drill",
        "target_tier": "DR_DONE",
        "ids": [
            "CHK-DR-01",
            "CHK-DR-02",
            "CHK-DR-03",
            "CHK-DR-04",
            "CHK-DR-05",
            "CHK-DR-06",
            "CHK-DR-07",
            "CHK-DR-08",
            "CHK-DR-09",
            "CHK-CORE-27",
            "CHK-CORE-28",
            "CHK-CORE-29",
            "CHK-UP-01",
            "CHK-UP-04",
            "CHK-DB-08",
        ],
        "evidence_subdir": "phase-b/emergency-unpause",
        "signoff_file": "DR-DRILL-SIGNOFF.json",
    },
    12: {
        "name": "GORP / DR Replay",
        "target_tier": "OPS_DONE",
        "ids": [
            "CHK-OPS-01",
            "CHK-OPS-04",
            "CHK-OPS-05",
            "CHK-OPS-06",
            "CHK-OPS-08",
            "CHK-OPS-09",
            "CHK-OPS-10",
            "CHK-CORE-30",
            "CHK-ID-08",
            "CHK-ID-11",
            "CHK-ID-12",
            "CHK-UP-05",
        ],
        "evidence_subdir": "phase-b/dr-replay",
        "signoff_file": "GORP-SIGNOFF.json",
    },
}

TIER_ORDER = ["DEV_DONE", "TESTNET_DONE", "HUMAN_DONE", "OPS_DONE", "DR_DONE"]


def load_mtm_rows() -> list[dict]:
    spec_path = ROOT / "scripts/dev/gen-ttg-governance-master-traceability-matrix.py"
    spec = importlib.util.spec_from_file_location("ttg_mtm_gen", spec_path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.ROWS  # type: ignore[attr-defined]


def id_to_cert() -> dict[str, int]:
    out: dict[str, int] = {}
    for step, meta in CERT_STEPS.items():
        for cid in meta["ids"]:
            out[cid] = step
    return out


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--cert-stamp", required=True, help="evidence/GO_ttg_cert/<stamp>")
    ap.add_argument(
        "--out",
        default="",
        help="output JSON path (default: evidence/GO_ttg_cert/<stamp>/CERT-EXECUTION-LEDGER.v1.json)",
    )
    args = ap.parse_args()

    rows = load_mtm_rows()
    cert_by_id = id_to_cert()
    evid_root = f"evidence/GO_ttg_cert/{args.cert_stamp}"

    ledger_rows = []
    for r in rows:
        cid = r["id"]
        cert_step = cert_by_id.get(cid)
        meta = CERT_STEPS.get(cert_step) if cert_step else None
        ledger_rows.append(
            {
                "mtm_id": cid,
                "name": r["name"],
                "page": r["page"],
                "baseline_tier": r["tier"],
                "cert_step": cert_step,
                "cert_name": meta["name"] if meta else None,
                "target_tier_on_cert": meta["target_tier"] if meta else None,
                "recording_required": cert_step is not None,
                "uat_ref": r.get("recovery", ""),
                "evidence_subdir": f"{evid_root}/{meta['evidence_subdir']}" if meta else None,
                "screenshot_slot": f"{evid_root}/ledger-screenshots/{cid}.png",
                "execution_status": "PENDING",
                "owner": r["owner"],
            }
        )

    out_path = Path(args.out) if args.out else ROOT / evid_root / "CERT-EXECUTION-LEDGER.v1.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "schema": "traveltrust.ttg-cert-execution-ledger.v1",
        "cert_stamp": args.cert_stamp,
        "phase": "②",
        "baseline": "GovFreeze V2 Clean Baseline",
        "total_rows": len(ledger_rows),
        "recording_required_rows": sum(1 for x in ledger_rows if x["recording_required"]),
        "machine_only_rows": sum(1 for x in ledger_rows if not x["recording_required"]),
        "cert_steps": {
            str(k): {"name": v["name"], "target_tier": v["target_tier"], "id_count": len(v["ids"])}
            for k, v in CERT_STEPS.items()
        },
        "rows": ledger_rows,
        "honest_boundary": "146-row ledger tracks all MTM rows; tier upgrades only on §14 cert signoff",
    }
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    md_path = out_path.with_suffix(".md")
    lines = [
        f"# TTG Cert Execution Ledger · {args.cert_stamp}",
        "",
        f"**Rows:** {len(ledger_rows)} · **Recording required:** {payload['recording_required_rows']} · **Machine-only track:** {payload['machine_only_rows']}",
        "",
        "| # | MTM ID | Cert | Target tier | Page | Status | Screenshot |",
        "|---|--------|------|-------------|------|--------|------------|",
    ]
    for i, row in enumerate(ledger_rows, 1):
        cert = f"#{row['cert_step']} {row['cert_name']}" if row["cert_step"] else "— (machine track)"
        lines.append(
            f"| {i} | {row['mtm_id']} | {cert} | {row['target_tier_on_cert'] or '—'} | "
            f"{row['page']} | {row['execution_status']} | `{row['screenshot_slot']}` |"
        )
    md_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"TTG_CERT_LEDGER: OK rows={len(ledger_rows)} path={out_path}")


if __name__ == "__main__":
    main()
