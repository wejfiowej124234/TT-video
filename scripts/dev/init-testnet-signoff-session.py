#!/usr/bin/env python3
"""Initialize Testnet Sign-off session (② · TT-TESTNET-SIGNOFF-CHECKLIST)."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

CHECKLIST = [
    ("T-ENV-01", "A", "Staging API /health", "probe"),
    ("T-ENV-02", "A", "Staging FE /", "probe"),
    ("T-ENV-03", "A", "deployment_profile=staging", "probe"),
    ("T-ENV-04", "A", "chain_id Sepolia", "probe"),
    ("T-CHAIN-01", "B", "chain.contracts 非空", "probe"),
    ("T-CHAIN-02", "B", "registry/fee_router/escrow_factory", "probe"),
    ("T-CHAIN-03", "B", "governance/staking/steward pool", "probe"),
    ("T-ID-01", "C", "登录 API 门闸", "probe"),
    ("T-RBAC-01", "C", "Admin RBAC", "record-adm-u01-staging-evidence.sh"),
    ("T-HAT-01", "C", "HAT 六角色", "record-tn-p1-007-008-hat-staging-evidence.sh"),
    ("T-ORD-01", "D", "订单 S01-S10", "smoke-phase2-testnet-execution-sprint.sh"),
    ("T-PROV-01", "D", "商家入驻", "record-tn-p1-002-provider-onboarding-staging-evidence.sh"),
    ("T-ESC-01", "D", "Escrow", "record-tn-p1-006-escrow-staging-evidence.sh"),
    ("T-ACQ-01", "D", "收购 PD-009", "record-tn-p1-003-acquisition-staging-evidence.sh"),
    ("T-STK-01", "D", "主理人 Stake", "record-tn-p1-004-steward-stake-staging-evidence.sh"),
    ("T-PSP-01", "D", "Stripe test", "smoke-onboarding-testnet.sh"),
    ("T-GOV-01", "E", "治理 MANUAL-P1", "human+staging"),
    ("T-IDX-01", "E", "Indexer reconcile", "record-tn-p1-010-indexer-reconcile-staging-evidence.sh"),
    ("T-COM-01", "E", "社区 C1-C12", "PHASE2-START-CHECKLIST"),
    ("T-REG-01", "F", "P0/P1 归零", "defects-registry"),
    ("T-GRAD-01", "F", "毕业矩阵", "run-phase2-testnet-closure-governance-audit.sh"),
    ("T-SIGN-01", "F", "Owner sign-off", "signoff"),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--commit", required=True)
    ap.add_argument("--session-dir", required=True)
    ap.add_argument("--manual-uat-session", default="20260630T142222Z")
    args = ap.parse_args()
    sess = Path(args.session_dir)
    sess.mkdir(parents=True, exist_ok=True)
    utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    probes: dict[str, str] = {}
    pf = sess / "testnet-probes.jsonl"
    if pf.is_file():
        for line in pf.read_text(encoding="utf-8").splitlines():
            if line.strip():
                row = json.loads(line)
                probes[row["id"]] = row.get("status", "")

    items = []
    prep = 0
    for cid, section, title, method in CHECKLIST:
        st = probes.get(cid, "PENDING")
        if st == "PASS":
            prep += 1
            ui = "PROBE_PASS" if method == "probe" else "PENDING"
        else:
            ui = "PENDING"
        items.append(
            {
                "id": cid,
                "section": section,
                "title": title,
                "method": method,
                "status": "PASS" if st == "PASS" else "PENDING",
                "probe_prep": ui,
            }
        )

    lines = [
        "# TESTNET-CHECKLIST · ② Sign-off",
        "",
        f"**Session:** `{args.stamp}` · **Commit:** `{args.commit}` · **① baseline:** `{args.manual_uat_session}`",
        "",
        "| ID | § | 检查项 | 方法 | 状态 | □ |",
        "|----|---|--------|------|------|---|",
    ]
    for it in items:
        mark = "☑" if it["status"] == "PASS" else "□"
        lines.append(
            f"| {it['id']} | {it['section']} | {it['title']} | `{it['method']}` | {it['status']} | {mark} |"
        )
    (sess / "TESTNET-CHECKLIST.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    summary = {
        "session_id": f"TN-{args.stamp}",
        "session_stamp": args.stamp,
        "phase": "②-testnet",
        "track": "testnet-signoff",
        "commit": args.commit,
        "manual_uat_baseline": args.manual_uat_session,
        "started_utc": utc,
        "testnet_signoff": {"pass": prep, "fail": 0, "blocked": 0, "total": len(CHECKLIST)},
        "checklist_items": items,
    }
    (sess / "SUMMARY.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    (sess / "SESSION-LOG.md").write_text(
        f"""# SESSION-LOG · Testnet Sign-off {args.stamp}

| 字段 | 值 |
|------|-----|
| **Track** | testnet-signoff |
| **Phase** | ② testnet |
| **① Baseline** | Manual UAT 27/27 · `{args.manual_uat_session}` |
| **Checklist SSOT** | docs/runbook/TT-TESTNET-SIGNOFF-CHECKLIST.md |
| **Config** | FROZEN — no Configuration Sprint |

Probe prep pass: {prep}/{len(CHECKLIST)}
""",
        encoding="utf-8",
    )
    print(f"init-testnet-signoff-session: {sess} prep={prep}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
