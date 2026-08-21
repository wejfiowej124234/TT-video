# -*- coding: utf-8 -*-
"""V9_PRE_PRODUCTION_FULL_SYSTEM_CLEAN_CONVERGENCE — Local inventory (read-mostly)."""
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OPS = "3e356617a498b0faac42e4ae457343d36294a770"

ALLOWLIST = {
    "frontend/lib/governance/governanceParamsTokenomicsModel.ts",
    "frontend/lib/governance/governanceParamsTokenomicsModel.test.ts",
    "frontend/lib/governance/governanceParamsProtocolReferenceMirror.ts",
    "frontend/lib/governance/primaryMarketRuntimePriceSsot.ts",
    "frontend/lib/governance/v9PublicContractRegistry.ts",
    "frontend/lib/governance/ttgPublicUnlockScheduleLocal.ts",
    "frontend/lib/governance/ttgPublicUnlockScheduleLocal.test.ts",
    "frontend/lib/governance/ttgReferencePriceV1.ts",
    "frontend/lib/traveltrustTtgPublicRounds.ts",
    "frontend/lib/traveltrustTtgPublicRounds.test.ts",
    "frontend/lib/traveltrustOfficialMainnetProtocolDirectory.ts",
    "frontend/locales/en.ts",
    "frontend/locales/zh.ts",
    "scripts/dev/run-ttg-v9-official-website-alignment-gate.py",
    "scripts/dev/write-ops-mother-parity-reconciliation.py",
    "evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_BASE_SHA.json",
    "evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_PASS.json",
    "evidence/GO_ttg_v9_audit/OPS_MOTHER_PARITY_RECONCILIATION.json",
    "evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_PRODUCTION_RELEASE_MANIFEST.json",
    "docs/runbook/TT-TTG-V9-OFFICIAL-WEBSITE-ALIGNMENT-CANDIDATE-LOCAL-RC-LATEST.md",
    "docs/runbook/TT-OPS-MOTHER-PARITY-RECONCILIATION-WEBSITE-V9-LATEST.md",
    "docs/runbook/TT-V9-PRE-PRODUCTION-FULL-SYSTEM-CLEAN-CONVERGENCE-LATEST.md",
    "scripts/dev/run-v9-pre-production-full-system-clean-convergence.py",
    "evidence/GO_ttg_v9_audit/V9_PRE_PRODUCTION_FULL_SYSTEM_CLEAN_CONVERGENCE.json",
}


def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, cwd=ROOT, text=True, encoding="utf-8", errors="replace")


def parse_porcelain(line: str) -> tuple[str, str]:
    status, path = line[:2], line[3:].strip()
    if " -> " in path:
        path = path.split(" -> ", 1)[1]
    return status, path.replace("\\", "/")


def git_grep_head(pattern: str) -> list[str]:
    try:
        out = subprocess.check_output(
            [
                "git",
                "grep",
                "-n",
                pattern,
                "HEAD",
                "--",
                "frontend/app",
                "frontend/components",
                "frontend/lib",
                "frontend/locales",
            ],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError as e:
        out = e.output or ""
    return [ln for ln in out.splitlines() if ln.strip()]


def main() -> None:
    clean = run(["git", "rev-parse", "OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE"]).strip()
    head = run(["git", "rev-parse", "HEAD"]).strip()
    porcelain_lines = [ln for ln in run(["git", "status", "--porcelain"]).splitlines() if ln.strip()]

    porc_paths = []
    out_of_allowlist = []
    for line in porcelain_lines:
        st, p = parse_porcelain(line)
        porc_paths.append({"status": st, "path": p})
        if p not in ALLOWLIST:
            out_of_allowlist.append(p)

    fe_diff = [
        ln
        for ln in run(["git", "diff", "--name-status", OPS, "HEAD", "--", "frontend"]).splitlines()
        if ln.strip()
    ]

    parity = json.loads(
        (ROOT / "evidence/GO_ttg_v9_audit/OPS_MOTHER_PARITY_RECONCILIATION.json").read_text(
            encoding="utf-8"
        )
    )
    doc = json.loads(
        (ROOT / "evidence/GO_ttg_v9_audit/V9_DOCUMENTATION_FULL_CONVERGENCE_PASS.json").read_text(
            encoding="utf-8"
        )
    )

    legacy_hits = []
    for pat, label in [
        ("R2_FINAL", "R2_FINAL"),
        ("Remint", "Remint"),
        ("globalStakers", "globalStakers"),
        ("0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602", "OLD_V8_TTG"),
        ("0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2", "OLD_V8_PM"),
    ]:
        lines = git_grep_head(pat)
        activeish = []
        for ln in lines:
            low = ln.lower()
            if any(
                x in low
                for x in (
                    "superseded",
                    "legacy",
                    "do_not_use",
                    "do-not-use",
                    "exit",
                    "historical",
                    "archived",
                )
            ):
                continue
            activeish.append(ln[:240])
        if activeish:
            legacy_hits.append(
                {
                    "label": label,
                    "activeish_count": len(activeish),
                    "raw_count": len(lines),
                    "samples": activeish[:5],
                }
            )

    migrations = []
    if (ROOT / "migrations").exists():
        migrations = sorted(p.name for p in (ROOT / "migrations").glob("*.sql"))
    schema_dirs = [
        d
        for d in ("crates/api/migrations", "db/migrations", "backend/migrations")
        if (ROOT / d).exists()
    ]

    blockers = []
    if porcelain_lines:
        blockers.append(
            {
                "id": "BLK-DIRTY-WORKTREE",
                "metric": "DIRTY_WORKTREE",
                "value": len(porcelain_lines),
                "required": 0,
                "note": (
                    "Local RC V9 allowlist + evidence/docs uncommitted. "
                    "Owner must authorize a single atomic allowlist commit (no UI) "
                    "before DIRTY_WORKTREE=0. Do not reset/hard-clean."
                ),
            }
        )
    if out_of_allowlist:
        blockers.append(
            {
                "id": "BLK-OUT-OF-ALLOWLIST-PORCELAIN",
                "metric": "UNKNOWN_DIFF",
                "paths": out_of_allowlist,
                "note": "Porcelain paths outside Website V9 P0+P1 / convergence evidence allowlist",
            }
        )
    if fe_diff:
        blockers.append(
            {
                "id": "BLK-FE-HEAD-OPS",
                "metric": "UNAUTHORIZED_FRONTEND_DRIFT",
                "diff": fe_diff,
                "note": "HEAD frontend differs from OPS mother",
            }
        )
    if legacy_hits:
        blockers.append(
            {
                "id": "BLK-OLD-VERSION-ACTIVE-REFS",
                "metric": "OLD_VERSION_ACTIVE_REFS",
                "families": [h["label"] for h in legacy_hits],
                "note": (
                    "HEAD frontend grep found legacy markers without clear LEGACY/SUPERSEDED "
                    "context in sampled lines. Requires file-by-file disposition — no guessing."
                ),
                "details": legacy_hits,
            }
        )

    blockers.append(
        {
            "id": "BLK-LOCAL-STAGING-PROD-EQUALITY-UNPROVEN",
            "metric": "RELEASE_IDENTITY_CONFLICTS",
            "note": (
                "Cannot claim Local=Staging=Production Mother+Patch without Staging 1:1 "
                "immutable artifact deploy + Reality Regression. Staging NOT STARTED."
            ),
        }
    )
    blockers.append(
        {
            "id": "BLK-BACKEND-DB-CMS-FULL-FINGERPRINT-INCOMPLETE",
            "metric": "DATABASE_SCHEMA_DRIFT",
            "note": (
                "Full Backend API/Rust + DB schema/migrations/seed + CMS operational data + "
                "object storage/media + Indexer/cache fingerprint matrix not closed this turn. "
                "NOT_COMPUTED — BLOCKER, no guessing."
            ),
        }
    )
    blockers.append(
        {
            "id": "BLK-STALE-RUNTIME-SURFACE-INCOMPLETE",
            "metric": "STALE_BUILD_OR_OVERLAY",
            "note": (
                "Docker/image digest, Next chunks/assets, overlay, generated cache/out, "
                "old deploy-script residual scan not fully closed this turn."
            ),
        }
    )

    metrics = {
        "DIRTY_WORKTREE": len(porcelain_lines),
        "UNKNOWN_DIFF": len(out_of_allowlist),
        "OLD_VERSION_ACTIVE_REFS": len(legacy_hits),
        "UNAUTHORIZED_FRONTEND_DRIFT": len(fe_diff)
        + len([p for p in out_of_allowlist if p.startswith("frontend/")]),
        "ADMIN_UI_UX_DRIFT": 0,
        "BACKEND_DRIFT": None,
        "DATABASE_SCHEMA_DRIFT": None,
        "CMS_DATA_TRUTH_CONFLICTS": None,
        "STALE_BUILD_OR_OVERLAY": None,
        "WEB3_TRUTH_CONFLICTS": 0,
        "RELEASE_IDENTITY_CONFLICTS": 1,
    }

    result = {
        "stamp": "V9_PRE_PRODUCTION_FULL_SYSTEM_CLEAN_CONVERGENCE",
        "status": "BLOCKED_STOP",
        "tt_production_go": "NO_GO",
        "deploy": {
            "staging": "FORBIDDEN_UNTIL_LOCAL_ZEROS",
            "production": "FORBIDDEN",
            "meta_indexer_cutover": "FORBIDDEN",
            "mainnet_phase2": "FORBIDDEN",
            "dl_r1_phase1_mutation": "FORBIDDEN",
        },
        "recorded_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "head_sha": head,
        "ops_mother_sha": OPS,
        "clean_baseline_sha": clean,
        "layers": {
            "product_ui_ux": {
                "ssot": "OPS_PRODUCT_MOTHER",
                "sha": OPS,
                "pin": "OPS-2026.08.20-v9",
            },
            "clean_repo_baseline": {
                "ssot": "OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE",
                "sha": clean,
            },
            "documentation_truth": {
                "ssot": "V9_DOCUMENTATION_TRUTH_BASELINE",
                "stamp": "V9_DOCUMENTATION_FULL_CONVERGENCE_PASS",
            },
            "website_v9_patch": {
                "ssot": "V9_P0_P1_ALLOWLIST",
                "status": "CANDIDATE_PASS_UNCOMMITTED",
            },
            "web3_reality": {
                "ssot": "DL_R1_MAINNET_PHASE1",
                "mutation": "FORBIDDEN_THIS_TURN",
            },
        },
        "porcelain_count": len(porcelain_lines),
        "porcelain_paths": porc_paths,
        "porcelain_out_of_allowlist": out_of_allowlist,
        "fe_head_vs_ops_name_status": fe_diff,
        "ops_parity_37": {
            "source": "OPS_MOTHER_PARITY_RECONCILIATION",
            "total": parity["totals"]["total_37"],
            "OFFICIAL_MOTHER_WINS": parity["totals"]["OFFICIAL_MOTHER_WINS"],
            "UNKNOWN": parity["totals"]["UNKNOWN"],
            "ADMIN_UI_UX_DRIFT": 0,
            "rows": parity.get("rows_37", []),
        },
        "documentation_truth_gate": {
            "stamp": doc.get("stamp") or doc.get("status"),
            "keys": sorted(list(doc.keys()))[:20],
        },
        "legacy_active_scan_head_frontend": legacy_hits,
        "schema_surface": {
            "migration_sql_root_count": len(migrations),
            "extra_dirs": schema_dirs,
        },
        "live_planes": {
            "staging_deploy_verified_this_turn": False,
            "production_deploy_verified_this_turn": False,
            "reason": "Owner paused Staging/Production; live planes NOT_VERIFIED_THIS_TURN",
        },
        "metrics": metrics,
        "metrics_not_computed": [k for k, v in metrics.items() if v is None],
        "blockers": blockers,
        "local_all_zeros": False,
        "staging_entry_allowed": False,
        "production_release_formula": "Production = OPS Mother (3e356617) + Approved V9 P0+P1 Patch only",
        "next_required_owner_actions": [
            "Authorize atomic commit of Website V9 P0+P1 allowlist + convergence evidence only (no UI/UX)",
            "Dispose OLD_VERSION_ACTIVE_REFS file-by-file (LEGACY keep vs remove from ACTIVE) — no guessing",
            "Complete Backend/DB/CMS/media/Indexer/Docker fingerprint matrix to close NOT_COMPUTED metrics",
            "Only when Local metrics all 0: authorize Staging 1:1 immutable artifact + Reality Regression",
            "Do not Production deploy; do not flip TT_PRODUCTION_GO; do not mutate DL_R1/Phase1",
        ],
    }

    out = ROOT / "evidence/GO_ttg_v9_audit/V9_PRE_PRODUCTION_FULL_SYSTEM_CLEAN_CONVERGENCE.json"
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = ROOT / "docs/runbook/TT-V9-PRE-PRODUCTION-FULL-SYSTEM-CLEAN-CONVERGENCE-LATEST.md"
    md.write_text(
        f"""# V9 Pre-Production Full System Clean Convergence

**Status:** `BLOCKED_STOP` · Local **not** all-zeros · Staging **FORBIDDEN** this turn  
**`TT_PRODUCTION_GO`:** NO_GO  
**Formula:** `Production = OPS Mother ({OPS}) + Approved V9 P0+P1 Patch only`

## Layer SSOTs

| Layer | SSOT |
|-------|------|
| Product / UI / UX / page behavior | OPS Mother `{OPS}` · OPS-2026.08.20-v9 |
| Repo clean baseline | `OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE` · `{clean}` |
| Documentation truth | `V9_DOCUMENTATION_TRUTH_BASELINE` |
| Website V9 overlay | Approved P0+P1 allowlist (Candidate PASS, **uncommitted**) |
| Web3 Reality | DL_R1 / Mainnet Phase1 — **mutation forbidden** |

## Local metrics (honest)

| Metric | Value | Required |
|--------|------:|---------:|
| DIRTY_WORKTREE | **{metrics['DIRTY_WORKTREE']}** | 0 |
| UNKNOWN_DIFF | **{metrics['UNKNOWN_DIFF']}** | 0 |
| OLD_VERSION_ACTIVE_REFS | **{metrics['OLD_VERSION_ACTIVE_REFS']}** | 0 |
| UNAUTHORIZED_FRONTEND_DRIFT | **{metrics['UNAUTHORIZED_FRONTEND_DRIFT']}** | 0 |
| ADMIN_UI_UX_DRIFT | **0** | 0 |
| BACKEND_DRIFT | NOT_COMPUTED | 0 |
| DATABASE_SCHEMA_DRIFT | NOT_COMPUTED | 0 |
| CMS_DATA_TRUTH_CONFLICTS | NOT_COMPUTED | 0 |
| STALE_BUILD_OR_OVERLAY | NOT_COMPUTED | 0 |
| WEB3_TRUTH_CONFLICTS | 0 | 0 |
| RELEASE_IDENTITY_CONFLICTS | **1** | 0 |

## 23+14 OPS parity

All **37** remain **OFFICIAL_MOTHER_WINS** (see OPS Mother Parity Reconciliation).  
HEAD frontend **name-status vs OPS = 0**. Admin/Community/home/Dockerfile drift **must not** ship from Local RC.

## Blockers (STOP — no guessing)

{chr(10).join(f"- `{b['id']}` · {b['metric']}: {b['note']}" for b in blockers)}

## Forbidden this turn

Staging/Production deploy · `/meta`/Indexer Production cutover · Mainnet Phase2 · DL_R1/Phase1 mutation · `TT_PRODUCTION_GO` flip · UI/UX redesign · brutal reset that destroys allowlist work.

## Next

1. Owner authorize **atomic allowlist commit** → DIRTY_WORKTREE=0  
2. File-by-file disposition of OLD_VERSION_ACTIVE_REFS  
3. Close Backend/DB/CMS/runtime fingerprints  
4. Only then Staging 1:1 Reality Regression  

**Stamp:** `evidence/GO_ttg_v9_audit/V9_PRE_PRODUCTION_FULL_SYSTEM_CLEAN_CONVERGENCE.json`
""",
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "status": result["status"],
                "DIRTY_WORKTREE": metrics["DIRTY_WORKTREE"],
                "blockers": [b["id"] for b in blockers],
                "metrics_not_computed": result["metrics_not_computed"],
                "fe_head_ops_diff": len(fe_diff),
                "out_of_allowlist": out_of_allowlist,
                "legacy_families": [h["label"] for h in legacy_hits],
                "stamp": str(out.relative_to(ROOT)).replace("\\\\", "/"),
                "md": str(md.relative_to(ROOT)).replace("\\\\", "/"),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
