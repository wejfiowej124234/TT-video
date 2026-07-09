#!/usr/bin/env python3
"""P2FC · post-soak 阻断项全量 L5 预审（只读 · 不 deploy · 不重启 · 不改策略）

聚合 TN-P1-010 依赖链 · Wave1（itineraries/market/escrow/guide）影响面 · G01–G08 前置。

  python scripts/dev/gen-p2fc-post-soak-preblock-full-l5-audit.py
  python scripts/dev/gen-p2fc-post-soak-preblock-full-l5-audit.py --evid-dir evidence/...

末行：TT_P2FC_POST_SOAK_PREBLOCK_L5: PASS|WARN|FAIL
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SOAK_DIR = ROOT / "evidence/P2FC_SOAK_72H_STAGING"
ACTIVE = ROOT / "evidence/GO_phase2_deploy_backlog/ACTIVE.json"
HOTFIX = ROOT / "evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch"
MR12_LOCK = ROOT / "evidence/GO_phase2_deploy_backlog/MR12-EXECUTION-LOCK.json"

WAVE1_DOMAINS: list[tuple[str, str, re.Pattern[str]]] = [
    ("W1_ITINERARIES", "itineraries hub (API)", re.compile(r"itineraries\.rs|routes/itineraries")),
    ("W1_MARKET", "market consumer", re.compile(r"routes/market|frontend/app/market|/market")),
    ("W1_ESCROW", "escrow / orders", re.compile(r"escrow|orders\.rs|routes/orders|EscrowDetail")),
    ("W1_GUIDE", "guide / provider media", re.compile(r"guide_uploads|provider/guide|routes/guide|guide/")),
]

TN_DEP_RULES: list[tuple[str, str, re.Pattern[str]]] = [
    ("TN_DEP_DB", "API DB / indexer read surface", re.compile(r"db/mod\.rs|internal/indexer|indexer")),
    ("TN_DEP_ROUTES", "compound route reads", re.compile(r"itineraries\.rs|routes/")),
    ("TN_DEP_MW", "middleware timeout (meta coupling)", re.compile(r"middleware/mod\.rs|REQUEST_TIMEOUT")),
]

GATE_LABELS = {
    "G01_open_p0": ("G-01", "Open P0 = 0"),
    "G02_open_p1": ("G-02", "Open P1 = 0"),
    "G03_readiness": ("G-03", "Readiness ≥ 100"),
    "G04_perfect_validation": ("G-04", "Perfect validation GO"),
    "G05_blocking_open": ("G-05", "blocking_open = 0"),
    "G06_soak": ("G-06", "P2FC COMPLETED.json"),
    "G07_indexer": ("G-07", "indexer compound + TN-P1-010 @ freeze SHA"),
    "G08_deep_surface": ("G-08", "D1–D24 + surface 100%"),
}


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def parse_diff_stat(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not path.is_file():
        return rows
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line or "|" not in line:
            continue
        m = re.match(r"^(.+?)\s+\|\s+(\d+)\s+([+-]+)?", line)
        if not m:
            continue
        rows.append({"path": m.group(1).strip().replace(" ", ""), "delta": int(m.group(2))})
    return rows


def load_rows() -> tuple[str, list[dict[str, Any]]]:
    active: dict[str, Any] = {}
    if ACTIVE.is_file():
        active = json.loads(ACTIVE.read_text(encoding="utf-8"))
    stamp = str(active.get("stamp") or "")
    diff = ROOT / "evidence/GO_phase2_deploy_backlog" / stamp / "diff-stat.txt"
    return stamp, parse_diff_stat(diff)


def audit_wave1_surface(rows: list[dict[str, Any]]) -> dict[str, Any]:
    domains: list[dict[str, Any]] = []
    for did, title, pat in WAVE1_DOMAINS:
        hits = [r for r in rows if pat.search(r["path"].replace("\\", "/"))]
        severity = "none"
        if hits:
            max_delta = max(r["delta"] for r in hits)
            severity = "critical" if did == "W1_ITINERARIES" and max_delta >= 50 else (
                "high" if max_delta >= 30 else "medium"
            )
        domains.append(
            {
                "id": did,
                "title": title,
                "file_count": len(hits),
                "total_delta": sum(r["delta"] for r in hits),
                "severity": severity,
                "files": sorted(hits, key=lambda x: -x["delta"])[:12],
                "mr02_defer": did == "W1_ITINERARIES",
                "post_soak_note": (
                    "MR-02: defer from wave1 first deploy — follow-up wave or isolated deploy"
                    if did == "W1_ITINERARIES" and hits
                    else None
                ),
            }
        )
    hub = next(d for d in domains if d["id"] == "W1_ITINERARIES")
    return {
        "wave": 1,
        "domains": domains,
        "cross_domain_risk": bool(hub["file_count"] and any(d["file_count"] for d in domains if d["id"] != "W1_ITINERARIES")),
        "verdict": "WARN" if hub["severity"] in ("critical", "high") else "PASS",
    }


def audit_tn_p1_010_chain(rows: list[dict[str, Any]], soak_completed: bool) -> dict[str, Any]:
    deps: list[dict[str, Any]] = []
    for did, title, pat in TN_DEP_RULES:
        hits = [r for r in rows if pat.search(r["path"].replace("\\", "/"))]
        deps.append({"id": did, "title": title, "files": hits[:8], "file_count": len(hits)})
    scripts_ok = (
        (ROOT / "scripts/ops/p2fc-run-tn-p1-010-independent.sh").is_file()
        and (ROOT / "scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh").is_file()
    )
    tn_gate: dict[str, Any] = {"pass": False, "note": "not evaluated"}
    proc = subprocess.run(
        ["node", str(ROOT / "scripts/dev/lib/tn-p1-010-graduation-gate.mjs"), "--root", str(ROOT), "--status-only"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=str(ROOT),
    )
    if proc.stdout.strip():
        try:
            tn_gate = json.loads(proc.stdout.strip().splitlines()[-1])
        except json.JSONDecodeError:
            tn_gate = {"pass": False, "note": "parse_error"}

    blockers: list[dict[str, Any]] = []
    if not scripts_ok:
        blockers.append({"id": "TN-B01", "severity": "critical", "clear_phase": "now", "note": "TN-P1-010 scripts missing"})
    if deps[0]["file_count"] and not soak_completed:
        blockers.append(
            {
                "id": "TN-B02",
                "severity": "high",
                "clear_phase": "post-soak-execute",
                "note": "db/mod.rs in backlog — reconcile after COMPLETED via internal spine",
            }
        )
    if deps[0]["file_count"] and deps[1]["file_count"]:
        blockers.append(
            {
                "id": "TN-B03",
                "severity": "high",
                "clear_phase": "post-soak-execute",
                "note": "compound DB + itineraries delta — run TN-P1-010 step-1 before wave1 deploy",
            }
        )
    if soak_completed and not tn_gate.get("pass"):
        blockers.append(
            {
                "id": "TN-B04",
                "severity": "critical",
                "clear_phase": "post-soak-execute",
                "note": tn_gate.get("note", "TN-P1-010 evidence missing @ freeze SHA"),
            }
        )
    elif not soak_completed:
        blockers.append(
            {
                "id": "TN-B04",
                "severity": "medium",
                "clear_phase": "defer-soak",
                "note": "await COMPLETED.json then run p2fc-run-tn-p1-010-independent.sh",
            }
        )

    return {
        "scripts_ready": scripts_ok,
        "meta_coupling": "none (internal/indexer spine)",
        "dependency_hits": deps,
        "graduation_gate": tn_gate,
        "blockers": blockers,
        "verdict": "FAIL" if any(b["severity"] == "critical" for b in blockers) else ("WARN" if blockers else "PASS"),
    }


def audit_g01_g08(matrix_path: Path, soak_completed: bool) -> dict[str, Any]:
    gates: list[dict[str, Any]] = []
    checks: dict[str, bool] = {}
    if matrix_path.is_file():
        m = json.loads(matrix_path.read_text(encoding="utf-8"))
        g = m.get("gates") or {}
        checks = {
            "G01_open_p0": g.get("open_testnet_p0") == 0,
            "G02_open_p1": g.get("open_testnet_p1") == 0,
            "G03_readiness": (g.get("tt_phase2_readiness") or 0) >= 100,
            "G04_perfect_validation": g.get("perfect_validation_go") is True,
            "G05_blocking_open": (m.get("summary") or {}).get("blocking_open", 1) == 0,
            "G06_soak": g.get("p2fc_soak_completed") is True,
            "G07_indexer": (
                g.get("indexer_compound_pass") is True
                and g.get("missing_projection") == 0
                and g.get("tn_p1_010_graduation_pass") is True
            ),
            "G08_deep_surface": (
                g.get("deep_closure_missing_coverage") == 0
                and g.get("deep_closure_evidence_gap") == 0
                and g.get("full_closure_coverage_pct") == 100
                and g.get("surface_coverage_pct") == 100
                and g.get("untested_ui_element") == 0
                and g.get("untested_user_action") == 0
            ),
        }
        defer_soak = {"G05_blocking_open", "G06_soak", "G08_deep_surface"}
        defer_deploy = {"G04_perfect_validation", "G07_indexer"}
        for key, (gid, label) in GATE_LABELS.items():
            ok = checks.get(key, False)
            if ok:
                phase = "—"
                status = "✅ 完成"
            elif key in defer_soak and not soak_completed:
                phase = "defer-soak"
                status = "❌ 未完成"
            elif key in defer_deploy:
                phase = "post-soak-execute"
                status = "❌ 未完成"
            else:
                phase = "post-soak-execute"
                status = "❌ 未完成"
            gates.append({"gate": gid, "label": label, "pass": ok, "status": status, "clear_phase": phase})
    else:
        for key, (gid, label) in GATE_LABELS.items():
            gates.append({"gate": gid, "label": label, "pass": False, "status": "❌ 未完成", "clear_phase": "probe-missing"})

    clearable_now = [g for g in gates if g["pass"]]
    post_soak_only = [g for g in gates if not g["pass"] and g["clear_phase"] in ("post-soak-execute", "defer-soak")]
    preblock_actions: list[dict[str, Any]] = []
    if not HOTFIX.is_file():
        preblock_actions.append({"id": "PB-01", "action": "ensure meta-availability-hotfix.patch present", "phase": "now"})
    if MR12_LOCK.is_file():
        lock = json.loads(MR12_LOCK.read_text(encoding="utf-8"))
        if lock.get("lock_status") != "FROZEN":
            preblock_actions.append({"id": "PB-02", "action": "MR12 execution lock not FROZEN", "phase": "now"})
    else:
        preblock_actions.append({"id": "PB-02", "action": "MR12-EXECUTION-LOCK.json missing", "phase": "now"})

    non_machine = sum(1 for g in gates if not g["pass"] and g["clear_phase"] == "post-soak-execute")
    verdict = "PASS" if len(clearable_now) >= 4 and not preblock_actions else ("FAIL" if preblock_actions else "WARN")

    return {
        "gates": gates,
        "checks": checks,
        "clearable_now_count": len(clearable_now),
        "post_soak_deferred_count": len(post_soak_only),
        "preblock_actions": preblock_actions,
        "verdict": verdict,
        "honest_boundary": "G06/G05/G08 partial PASS only after COMPLETED + post-soak execute chain",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--soak-dir", default=str(SOAK_DIR))
    ap.add_argument("--evid-dir", default="", help="GO_phase2_testnet_graduation stamp dir")
    ap.add_argument("--out-dir", default="")
    args = ap.parse_args()

    soak_dir = Path(args.soak_dir)
    soak_completed = (soak_dir / "COMPLETED.json").is_file()
    stamp, rows = load_rows()
    out_dir = Path(args.out_dir) if args.out_dir else soak_dir / "post-soak-preblock-l5-audit" / utc_stamp()
    out_dir.mkdir(parents=True, exist_ok=True)

    matrix_path = Path(args.evid_dir) / "graduation-matrix.v1.json" if args.evid_dir else Path("")
    if not matrix_path.is_file():
        grad_root = ROOT / "evidence/GO_phase2_testnet_graduation"
        if grad_root.is_dir():
            dirs = sorted([p for p in grad_root.iterdir() if p.is_dir()], reverse=True)
            for d in dirs:
                mp = d / "graduation-matrix.v1.json"
                if mp.is_file():
                    matrix_path = mp
                    break

    wave1 = audit_wave1_surface(rows)
    tn = audit_tn_p1_010_chain(rows, soak_completed)
    g08 = audit_g01_g08(matrix_path, soak_completed)

    all_blockers: list[dict[str, Any]] = []
    all_blockers.extend(tn.get("blockers", []))
    all_blockers.extend(g08.get("preblock_actions", []))
    for d in wave1["domains"]:
        if d["severity"] in ("critical", "high") and d["id"] == "W1_ITINERARIES":
            all_blockers.append(
                {
                    "id": "W1-B01",
                    "severity": "high",
                    "clear_phase": "post-soak-execute",
                    "note": f"itineraries hub Δ{d['total_delta']} — apply MR-02 defer in wave1",
                }
            )

    clear_now = [b for b in all_blockers if b.get("clear_phase") == "now"]
    overall = "FAIL" if clear_now or any(b.get("severity") == "critical" and b.get("clear_phase") == "now" for b in all_blockers) else (
        "WARN" if all_blockers else "PASS"
    )
    if wave1["verdict"] == "WARN" and overall == "PASS":
        overall = "WARN"
    if g08["verdict"] == "FAIL":
        overall = "FAIL"
    if tn["verdict"] == "FAIL":
        overall = "FAIL"

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_post_soak_preblock_full_l5_audit.v1",
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "phase": "②",
        "soak_completed": soak_completed,
        "backlog_stamp": stamp,
        "backlog_files": len(rows),
        "read_only": True,
        "no_deploy": True,
        "no_restart": True,
        "no_strategy_change": True,
        "execution_strategy_locked": "STRAT-A_PLUS_MR12",
        "wave1_surface_audit": wave1,
        "tn_p1_010_dependency_chain": tn,
        "graduation_g01_g08_preconditions": g08,
        "graduation_matrix_ref": matrix_path.as_posix() if matrix_path.is_file() else None,
        "post_soak_blockers": all_blockers,
        "clear_now_blockers": clear_now,
        "verdict": overall,
    }

    (out_dir / "full-l5-preblock-audit.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    latest = soak_dir / "post-soak-preblock-l5-audit/latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# Post-soak Preblock Full L5 Audit",
        "",
        f"- **verdict:** {overall} · soak_completed={soak_completed}",
        f"- **backlog:** {len(rows)} files · stamp={stamp}",
        "",
        "## Wave1 surface (itineraries / market / escrow / guide)",
        "",
    ]
    for d in wave1["domains"]:
        md.append(f"- **{d['id']}** {d['title']}: {d['file_count']} files Δ{d['total_delta']} [{d['severity']}]")
    md.extend(["", "## TN-P1-010 dependency chain", ""])
    md.append(f"- scripts_ready={tn['scripts_ready']} · gate_pass={tn['graduation_gate'].get('pass')}")
    for b in tn.get("blockers", []):
        md.append(f"- [{b['severity']}] {b['id']}: {b['note']} ({b['clear_phase']})")
    md.extend(["", "## Graduation G01–G08", ""])
    for g in g08["gates"]:
        md.append(f"- {g['gate']} {g['label']}: {g['status']} · clear={g['clear_phase']}")
    md.extend(["", "## Post-soak blockers summary", ""])
    for b in all_blockers:
        md.append(f"- [{b.get('severity', '?')}] {b.get('id', '?')}: {b.get('note', b.get('action', ''))}")
    (out_dir / "FULL-L5-PREBLOCK-AUDIT.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(
        f"TT_P2FC_POST_SOAK_PREBLOCK_L5: {overall} "
        f"wave1={wave1['verdict']} tn={tn['verdict']} g08={g08['verdict']} "
        f"blockers={len(all_blockers)} clear_now={len(clear_now)} "
        f"out={out_dir.as_posix()}"
    )
    return 0 if overall != "FAIL" else 2


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
