#!/usr/bin/env python3
"""TT_ADMIN_RBAC_ALIGNMENT_PROGRAM — scan legacy require_admin_actor drift vs v4 matrix."""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MOD = ROOT / "crates/api/src/routes/admin/mod.rs"
RBAC = ROOT / "crates/api/src/routes/admin/admin_rbac.rs"
YAML = ROOT / "registry/admin-rbac-route-matrix.v1.yaml"
FE_PERM = ROOT / "frontend/lib/admin/adminHomeCardPermission.ts"

CLUSTERS = ("finance", "community", "audit", "approval")

HANDLER_EXPECTED = {
    "get_admin_finance_summary": ("finance", "require_finance_read_uid", "admin.finance.read"),
    "get_admin_finance_summary_export": ("finance", "require_finance_read_uid", "admin.finance.read"),
    "get_admin_fee_router_routed_events": ("finance", "require_finance_read_uid", "admin.finance.read"),
    "get_admin_region_vault_forwarded_events": ("finance", "require_finance_read_uid", "admin.finance.read"),
    "get_admin_region_vault_forwarded_events_export": ("finance", "require_finance_read_uid", "admin.finance.read"),
    "get_admin_community_reports": ("community", "require_admin_perm_uid", "admin.community.read"),
    "get_admin_community_appeals": ("community", "require_admin_perm_uid", "admin.community.read"),
    "get_admin_community_ranking_snapshots": ("community", "require_admin_perm_uid", "admin.community.read"),
    "get_admin_community_penalties": ("community", "require_admin_perm_uid", "admin.community.read"),
    "get_admin_community_moderation_cases": ("community", "require_admin_perm_uid", "admin.community.read"),
    "get_admin_community_risk_signals": ("community", "require_admin_perm_uid", "admin.community.read"),
    "get_admin_community_policy_change_logs": ("community", "require_admin_perm_uid", "admin.community.read"),
    "patch_admin_community_moderation": ("community", "require_admin_perm_uid", "admin.community.moderate"),
    "patch_admin_community_comment": ("community", "require_admin_perm_uid", "admin.community.moderate"),
    "post_admin_community_penalty": ("community", "require_admin_perm_uid", "admin.community.moderate"),
    "patch_admin_community_abuse_policy": ("community", "require_community_super_uid", "admin.community.super"),
    "post_admin_community_appeal_review": ("community", "require_community_super_uid", "admin.community.super"),
    "get_admin_audit_operations": ("audit", "require_read_uid", "admin.read"),
    "get_admin_audit_logs": ("audit", "require_read_uid", "admin.read"),
    "get_admin_audit_log_by_id": ("audit", "require_read_uid", "admin.read"),
    "get_admin_auth_audit_events": ("audit", "require_read_uid", "admin.read"),
    "get_admin_approvals": ("approval", "require_admin_perm_uid", "admin.approve"),
    "get_admin_approval_by_id": ("approval", "require_admin_perm_uid", "admin.approve"),
    "post_admin_approval_approve": ("approval", "require_admin_perm_uid", "admin.approve"),
    "post_admin_approval_reject": ("approval", "require_admin_perm_uid", "admin.approve"),
}


def parse_route_deny_matrix(text: str) -> list[dict]:
    block = text
    m = re.search(r"ROUTE_DENY_MATRIX.*?=&\[([\s\S]*?)\];", text)
    if m:
        block = m.group(1)
    rows: list[dict] = []
    for m in re.finditer(
        r'"(?P<method>GET|POST|PUT|PATCH|DELETE)",\s*"(?P<path>[^"]+)",\s*(?:admin_rbac::)?(?P<perm>PERM_[A-Z_]+)',
        block,
        re.MULTILINE,
    ):
        rows.append({"method": m.group("method"), "path": m.group("path"), "perm_const": m.group("perm")})
    return rows


def perm_const_to_id(const: str, rbac_text: str) -> str:
    m = re.search(rf'pub const {const}: &str = "([^"]+)"', rbac_text)
    return m.group(1) if m else const


def scan_handler_auth(mod_text: str, handler: str) -> str:
    m = re.search(rf"pub async fn {handler}\(", mod_text)
    if not m:
        return "missing_handler"
    chunk = mod_text[m.start() : m.start() + 2500]
    if "require_admin_actor(" in chunk.split("let actor", 1)[-1][:800]:
        return "legacy_require_admin_actor"
    for gate in (
        "require_finance_read_uid",
        "require_read_uid",
        "require_community_super_uid",
        "require_admin_perm_uid",
        "require_admin_permission",
    ):
        if gate in chunk[:1200]:
            return gate
    if "require_super_admin_uid" in chunk[:1200]:
        return "require_super_admin_uid"
    return "unknown"


def yaml_route_count(text: str) -> int:
    return len(re.findall(r"^\s+-\s+method:", text, re.M))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default="")
    args = ap.parse_args()

    mod_text = MOD.read_text(encoding="utf-8")
    rbac_text = RBAC.read_text(encoding="utf-8")
    yaml_text = YAML.read_text(encoding="utf-8")

    matrix_rows = parse_route_deny_matrix(rbac_text)
    matrix_ids = [
        {
            "method": r["method"],
            "path": r["path"],
            "permission": perm_const_to_id(r["perm_const"], rbac_text),
        }
        for r in matrix_rows
    ]

    cluster_handlers: dict[str, list[dict]] = {c: [] for c in CLUSTERS}
    gaps: list[dict] = []
    aligned = 0
    for handler, (cluster, expected_gate, expected_perm) in HANDLER_EXPECTED.items():
        actual = scan_handler_auth(mod_text, handler)
        ok = expected_gate in actual or (
            expected_gate == "require_admin_perm_uid"
            and "require_admin_perm_uid" in actual
        )
        row = {
            "handler": handler,
            "cluster": cluster,
            "expected_gate": expected_gate,
            "expected_permission": expected_perm,
            "actual_gate": actual,
            "status": "ALIGNED" if ok else "GAP",
        }
        cluster_handlers[cluster].append(row)
        if ok:
            aligned += 1
        else:
            gaps.append(row)

    stub_files = sorted(
        p.relative_to(ROOT).as_posix()
        for p in (ROOT / "crates/api/src/routes/admin").glob("admin_*_http.rs")
    )

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir = Path(args.out_dir) if args.out_dir else ROOT / "evidence/GO_admin_rbac_alignment" / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    payload = {
        "program": "TT_ADMIN_RBAC_ALIGNMENT_PROGRAM",
        "phase": "①",
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "ssot": {
            "admin_rbac": "crates/api/src/routes/admin/admin_rbac.rs",
            "live_router": "crates/api/src/routes/admin/mod.rs",
            "route_matrix_yaml": "registry/admin-rbac-route-matrix.v1.yaml",
            "rbac_matrix_version": re.search(r'RBAC_MATRIX_VERSION: &str = "([^"]+)"', rbac_text).group(1),
        },
        "four_cluster_summary": {
            c: {
                "handlers": len(cluster_handlers[c]),
                "aligned": sum(1 for x in cluster_handlers[c] if x["status"] == "ALIGNED"),
                "gaps": sum(1 for x in cluster_handlers[c] if x["status"] == "GAP"),
            }
            for c in CLUSTERS
        },
        "handlers_total": len(HANDLER_EXPECTED),
        "handlers_aligned": aligned,
        "handlers_gap": len(gaps),
        "route_deny_matrix_count": len(matrix_ids),
        "yaml_route_count": yaml_route_count(yaml_text),
        "yaml_version_match": "admin-rbac-v4" in yaml_text,
        "gaps": gaps,
        "clusters": cluster_handlers,
        "orphan_split_stubs": stub_files,
        "admin_ui_routes_ssot": "frontend/lib/admin/adminAdminPerfectClosureL5.contract.test.ts (107 pages)",
    }
    (out_dir / "RBAC-GAP-LIST.v1.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    md_lines = [
        "# RBAC-GAP-LIST · TT_ADMIN_RBAC_ALIGNMENT_PROGRAM",
        "",
        f"**Generated:** {payload['generated_at_utc']} · **Phase:** ①",
        "",
        f"**Handlers aligned:** {aligned}/{len(HANDLER_EXPECTED)} · **Matrix routes:** {len(matrix_ids)} · **YAML routes:** {yaml_route_count(yaml_text)}",
        "",
        "## Four clusters",
        "",
        "| Cluster | Aligned | Gaps |",
        "|---------|---------|------|",
    ]
    for c in CLUSTERS:
        s = payload["four_cluster_summary"][c]
        md_lines.append(f"| **{c}** | {s['aligned']}/{s['handlers']} | {s['gaps']} |")
    md_lines.extend(["", "## Open gaps", ""])
    if gaps:
        for g in gaps:
            md_lines.append(
                f"- `{g['handler']}` · expected `{g['expected_gate']}` · actual `{g['actual_gate']}`"
            )
    else:
        md_lines.append("_None — four clusters aligned with v4 permission gates._")
    md_lines.extend(["", "## Orphan split stubs (not mounted)", ""])
    for s in stub_files:
        md_lines.append(f"- `{s}`")
    (out_dir / "RBAC-GAP-LIST.v1.md").write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    latest = ROOT / "evidence/GO_admin_rbac_alignment/latest-stamp.txt"
    latest.write_text(stamp + "\n", encoding="utf-8")

    verdict = "PASS" if not gaps and len(matrix_ids) == yaml_route_count(yaml_text) else "FAIL"
    print(f"TT_ADMIN_RBAC_GAP_LIST: {verdict} aligned={aligned}/{len(HANDLER_EXPECTED)} gaps={len(gaps)} out={out_dir}")
    if verdict != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
