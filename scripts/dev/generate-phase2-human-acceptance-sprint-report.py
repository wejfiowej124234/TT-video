#!/usr/bin/env python3
"""Merge P2HA local + staging findings into manifest and sprint report."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load(p: str) -> dict:
    return json.loads(Path(p).read_text(encoding="utf-8"))


def role_table(local: dict, staging: dict) -> list[dict]:
    local_roles = {r["role"]: r for r in local.get("roles", [])}
    staging_roles = {r["role"]: r for r in staging.get("roles", [])}
    rows = []
    for role in ("旅行者", "向导", "管理员", "收购/运营"):
        lv = local_roles.get(role, {}).get("verdict", "SKIP")
        sv = staging_roles.get(role, {}).get("verdict", "SKIP")
        closed = "PASS" if lv == "PASS" and sv == "PASS" else "FAIL"
        rows.append({"role": role, "local": lv, "staging": sv, "closed": closed})
    return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--local", required=True)
    ap.add_argument("--staging", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--stamp", required=True)
    args = ap.parse_args()

    local = load(args.local)
    staging = load(args.staging)
    rows = role_table(local, staging)
    all_pass = all(r["closed"] == "PASS" for r in rows)
    overall = "PASS" if all_pass else "FAIL"
    p3 = "REQUESTED" if overall == "PASS" else "HOLD"

    manifest = {
        "schema": "traveltrust.phase2_human_acceptance_manifest.v1",
        "stamp": args.stamp,
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "overall_verdict": overall,
        "phase3_review_status": p3,
        "role_matrix": rows,
        "local": {"verdict": local.get("verdict"), "meta_git_sha": local.get("meta_git_sha")},
        "staging": {"verdict": staging.get("verdict"), "meta_git_sha": staging.get("meta_git_sha")},
        "honest_boundary": "② PASS ≠ ③ Production GO",
    }

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = out_dir / "phase2-human-acceptance-manifest.v1.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# Phase ② · Human Acceptance Sprint Report",
        "",
        f"**stamp:** `{args.stamp}`  ",
        f"**overall:** **{overall}**  ",
        f"**Phase ③ Review:** **{p3}**  ",
        "",
        "## Role matrix",
        "",
        "| 角色 | ① 本地 | ② 测试网 | 收口 |",
        "|------|--------|----------|------|",
    ]
    for r in rows:
        mark = "✅ PASS" if r["closed"] == "PASS" else "❌ FAIL"
        md.append(f"| **{r['role']}** | {r['local']} | {r['staging']} | {mark} |")
    md.extend(
        [
            "",
            "```text",
            f"TT_PHASE2_HUMAN_ACCEPTANCE_SPRINT: {'OK' if overall == 'PASS' else 'NO-GO'} {args.stamp}",
            f"TT_PHASE3_PRODUCTION_READINESS_REVIEW: {p3} {args.stamp}",
            "```",
            "",
        ]
    )
    report = ROOT / "docs/runbook/PHASE2-HUMAN-ACCEPTANCE-SPRINT-REPORT.md"
    report.write_text("\n".join(md), encoding="utf-8")
    print(f"manifest: {manifest_path}")
    print(f"overall: {overall} phase3: {p3}")
    return 0 if overall == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
