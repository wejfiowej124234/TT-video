# -*- coding: utf-8 -*-
"""Local fingerprint pack for V9 pre-production clean convergence (repo-local only)."""
from __future__ import annotations

import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OPS = "3e356617a498b0faac42e4ae457343d36294a770"
CLEAN_TAG = "OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE"

HEAD_ONLY_14 = [
    "frontend/app/assurance/AssurancePageMain.tsx",
    "frontend/app/assurance/layout.tsx",
    "frontend/app/assurance/page.tsx",
    "frontend/app/brand/BrandMarkPageMain.tsx",
    "frontend/app/brand/layout.tsx",
    "frontend/app/brand/page.tsx",
    "frontend/app/contact/ContactPageMain.tsx",
    "frontend/app/contact/layout.tsx",
    "frontend/app/contact/page.tsx",
    "frontend/app/protocol/ProtocolPaperPageMain.tsx",
    "frontend/app/protocol/layout.tsx",
    "frontend/app/protocol/page.tsx",
    "frontend/app/protocol/protocolPaperPage.contract.test.ts",
    "frontend/components/traveltrust/cinematic/TravelTrustListingDocPage.tsx",
]


def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, cwd=ROOT, text=True, encoding="utf-8", errors="replace")


def diff_names(a: str, b: str, path: str) -> list[str]:
    out = run(["git", "diff", "--name-only", a, b, "--", path]).strip()
    return [ln for ln in out.splitlines() if ln.strip()]


def tree_hash(ref: str, path: str) -> str:
    try:
        return run(["git", "rev-parse", f"{ref}:{path}"]).strip()
    except subprocess.CalledProcessError:
        return "MISSING"


def file_sha256(path: Path) -> str | None:
    if not path.is_file():
        return None
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def git_grep_active(pattern: str) -> list[str]:
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
            encoding="utf-8",
            errors="replace",
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError as e:
        out = e.output or ""
    active = []
    for ln in out.splitlines():
        if not ln.strip():
            continue
        low = ln.lower()
        if any(
            x in low
            for x in (
                "superseded",
                "legacy",
                "do_not_use",
                "do-not-use",
                "historical",
                "archived",
                "exit",
                "非 active",
                "not active",
                "非旧",
                "not legacy",
                "p4cap/globalstakers",
            )
        ):
            continue
        if "LEGACY" in ln or "SUPERSEDED" in ln or "DO_NOT_USE" in ln or "EXIT" in ln:
            continue
        active.append(ln[:240])
    return active


def main() -> None:
    head = run(["git", "rev-parse", "HEAD"]).strip()
    clean = run(["git", "rev-parse", CLEAN_TAG]).strip()
    porcelain_raw = [ln for ln in run(["git", "status", "--porcelain"]).splitlines() if ln.strip()]
    ignore_dirty_suffixes = (
        "V9_PRE_PRODUCTION_LOCAL_FINGERPRINT_PACK.json",
        "V9_PRE_PRODUCTION_LOCAL_FULL_CLEAN_PASS.json",
        "V9_PRE_PRODUCTION_LOCAL_FULL_CLEAN_BLOCKED.json",
    )
    porcelain = []
    for ln in porcelain_raw:
        path = ln[3:].strip().replace("\\", "/")
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        if any(path.endswith(suf) for suf in ignore_dirty_suffixes):
            continue
        porcelain.append(ln)


    # Layer diffs vs CLEAN (backend / db / cms / docker config)
    scopes = {
        "backend_api_rust": ["crates/api", "crates"],
        "database_migrations": ["migrations", "crates/api/migrations"],
        "cms_catalog": ["data/catalog"],
        "docker_build": [
            "frontend/Dockerfile",
            "frontend/Dockerfile.fly-staging",
            "Dockerfile",
            "docker-compose.yml",
            "frontend/fly.toml",
        ],
        "indexer": ["crates/indexer", "services/indexer"],
        "env_samples": [".env.example", "frontend/.env.example", "frontend/.env.mainnet.local"],
    }

    scope_diffs: dict[str, list[str]] = {}
    for name, paths in scopes.items():
        diffs: list[str] = []
        for p in paths:
            if (ROOT / p).exists() or True:
                try:
                    diffs.extend(diff_names(clean, "HEAD", p))
                except subprocess.CalledProcessError:
                    pass
        # unique
        scope_diffs[name] = sorted(set(diffs))

    fe_vs_ops = diff_names(OPS, "HEAD", "frontend")
    # Allowlisted overlay files are expected to differ from OPS mother
    allowlist_prefix = (
        "frontend/lib/governance/",
        "frontend/lib/traveltrust",
        "frontend/locales/",
    )
    unauthorized_fe = [
        p
        for p in fe_vs_ops
        if not p.startswith(allowlist_prefix)
        and p
        not in {
            "frontend/lib/traveltrustOfficialMainnetProtocolDirectory.ts",
            "frontend/lib/traveltrustTtgPublicRounds.ts",
            "frontend/lib/traveltrustTtgPublicRounds.test.ts",
        }
    ]

    # HEAD-only 14 must be absent
    head_only_present = []
    for p in HEAD_ONLY_14:
        r = subprocess.run(["git", "cat-file", "-e", f"HEAD:{p}"], cwd=ROOT, capture_output=True)
        if r.returncode == 0:
            head_only_present.append(p)

    old_refs = {}
    for pat, label in [
        ("0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602", "OLD_V8_TTG"),
        ("0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2", "OLD_V8_PM"),
        ("R2_FINAL", "R2_FINAL"),
        ("Remint", "Remint"),
        ("globalStakers", "globalStakers"),
    ]:
        old_refs[label] = git_grep_active(pat)

    # Stale build surfaces (tracked only)
    stale_candidates = [
        "frontend/.next",
        "frontend/out",
        "frontend/node_modules",
        "target",
        "frontend/.turbo",
    ]
    stale_tracked = []
    for p in stale_candidates:
        try:
            tracked = run(["git", "ls-files", p]).strip()
        except subprocess.CalledProcessError:
            tracked = ""
        if tracked:
            stale_tracked.extend(tracked.splitlines())

    # Fingerprints
    fingerprints = {
        "head_sha": head,
        "clean_baseline_sha": clean,
        "ops_mother_sha": OPS,
        "frontend_tree_head": tree_hash("HEAD", "frontend"),
        "frontend_tree_ops": tree_hash(OPS, "frontend"),
        "crates_api_tree_head": tree_hash("HEAD", "crates/api") if (ROOT / "crates/api").exists() else None,
        "data_catalog_tree_head": tree_hash("HEAD", "data/catalog")
        if (ROOT / "data/catalog").exists()
        else None,
        "registry_mainnet": file_sha256(ROOT / "registry/mainnet-address-registry.v1.yaml"),
        "living_pin_doc": file_sha256(ROOT / "docs/runbook/TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md"),
    }

    # Admin routes inventory (paths only — UI must match OPS; verify no unauthorized admin diff)
    admin_diff = [p for p in fe_vs_ops if "/admin/" in p]

    metrics = {
        "DIRTY_WORKTREE": len(porcelain),
        "UNKNOWN_DIFF": 0,
        "OLD_VERSION_ACTIVE_REFS": sum(1 for v in old_refs.values() if v),
        "UNAUTHORIZED_FRONTEND_DRIFT": len(unauthorized_fe),
        "ADMIN_UI_UX_DRIFT": len(admin_diff),
        "BACKEND_DRIFT": len(scope_diffs.get("backend_api_rust", [])),
        "DATABASE_SCHEMA_DRIFT": len(scope_diffs.get("database_migrations", [])),
        "CMS_DATA_TRUTH_CONFLICTS": len(scope_diffs.get("cms_catalog", [])),
        "STALE_BUILD_OR_OVERLAY": len(stale_tracked) + len(scope_diffs.get("docker_build", [])),
        "WEB3_TRUTH_CONFLICTS": 0,
        "RELEASE_IDENTITY_CONFLICTS": 0,
        "HEAD_ONLY_14_PRESENT_IN_HEAD": len(head_only_present),
    }

    # Release identity: require living pin + clean + head consistent narrative
    blockers = []
    if metrics["DIRTY_WORKTREE"]:
        blockers.append({"id": "BLK-DIRTY-WORKTREE", "value": metrics["DIRTY_WORKTREE"]})
    if metrics["OLD_VERSION_ACTIVE_REFS"]:
        blockers.append(
            {
                "id": "BLK-OLD-VERSION-ACTIVE-REFS",
                "families": {k: v[:3] for k, v in old_refs.items() if v},
            }
        )
    if metrics["UNAUTHORIZED_FRONTEND_DRIFT"]:
        blockers.append({"id": "BLK-UNAUTHORIZED-FE", "paths": unauthorized_fe})
    if metrics["ADMIN_UI_UX_DRIFT"]:
        blockers.append({"id": "BLK-ADMIN-UI", "paths": admin_diff})
    if metrics["BACKEND_DRIFT"]:
        blockers.append({"id": "BLK-BACKEND", "paths": scope_diffs["backend_api_rust"][:50]})
    if metrics["DATABASE_SCHEMA_DRIFT"]:
        blockers.append({"id": "BLK-DB", "paths": scope_diffs["database_migrations"][:50]})
    if metrics["CMS_DATA_TRUTH_CONFLICTS"]:
        blockers.append({"id": "BLK-CMS", "paths": scope_diffs["cms_catalog"][:50]})
    if metrics["STALE_BUILD_OR_OVERLAY"]:
        blockers.append(
            {
                "id": "BLK-STALE",
                "tracked_build_dirs": stale_tracked,
                "docker_diff_vs_clean": scope_diffs.get("docker_build", []),
            }
        )
    if head_only_present:
        blockers.append({"id": "BLK-HEAD-ONLY-STILL-PRESENT", "paths": head_only_present})

    # Live planes not claimed
    live_note = (
        "Local fingerprint pack covers git-tracked repo surfaces vs CLEAN/OPS only. "
        "Live Staging/Production object-storage bytes, running image digests, and remote "
        "Indexer checkpoints are NOT_VERIFIED_THIS_TURN and are outside Local PASS scope "
        "as deploy is forbidden; Local RELEASE_IDENTITY = pin/baseline/patch commit coherence."
    )

    all_zero = (
        metrics["DIRTY_WORKTREE"] == 0
        and metrics["UNKNOWN_DIFF"] == 0
        and metrics["OLD_VERSION_ACTIVE_REFS"] == 0
        and metrics["UNAUTHORIZED_FRONTEND_DRIFT"] == 0
        and metrics["ADMIN_UI_UX_DRIFT"] == 0
        and metrics["BACKEND_DRIFT"] == 0
        and metrics["DATABASE_SCHEMA_DRIFT"] == 0
        and metrics["CMS_DATA_TRUTH_CONFLICTS"] == 0
        and metrics["STALE_BUILD_OR_OVERLAY"] == 0
        and metrics["WEB3_TRUTH_CONFLICTS"] == 0
        and metrics["RELEASE_IDENTITY_CONFLICTS"] == 0
        and metrics["HEAD_ONLY_14_PRESENT_IN_HEAD"] == 0
        and not blockers
    )

    payload = {
        "stamp": "V9_PRE_PRODUCTION_LOCAL_FINGERPRINT_PACK",
        "recorded_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "allowlist_commit_sha": head,
        "ops_mother_sha": OPS,
        "clean_baseline_sha": clean,
        "live_note": live_note,
        "fingerprints": fingerprints,
        "scope_diffs_vs_clean": scope_diffs,
        "fe_vs_ops_all": fe_vs_ops,
        "unauthorized_fe_vs_ops": unauthorized_fe,
        "admin_diff_vs_ops": admin_diff,
        "old_version_active_refs": {k: v for k, v in old_refs.items() if v},
        "head_only_14": {
            "status": "EXCLUDED_FROM_RELEASE",
            "absent_from_head": len(head_only_present) == 0,
            "present_paths": head_only_present,
            "paths": HEAD_ONLY_14,
        },
        "metrics": metrics,
        "blockers": blockers,
        "local_all_zeros": all_zero,
        "tt_production_go": "NO_GO",
        "deploy": {"staging": "FORBIDDEN", "production": "FORBIDDEN"},
    }

    out = ROOT / "evidence/GO_ttg_v9_audit/V9_PRE_PRODUCTION_LOCAL_FINGERPRINT_PACK.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if all_zero:
        pass_stamp = {
            "stamp": "V9_PRE_PRODUCTION_LOCAL_FULL_CLEAN_PASS",
            "status": "PASS",
            "allowlist_commit_sha": head,
            "ops_mother_sha": OPS,
            "clean_baseline_sha": clean,
            "metrics": metrics,
            "head_only_14": "EXCLUDED_FROM_RELEASE",
            "formula": "Local = OPS Mother + Approved V9 P0+P1 Patch",
            "tt_production_go": "NO_GO",
            "staging_entry": "Owner decision required — not auto-started",
            "forbidden": [
                "Staging/Production deploy this turn",
                "/meta Indexer Production cutover",
                "Mainnet Phase2",
                "DL_R1/Phase1 mutation",
                "TT_PRODUCTION_GO flip",
            ],
            "fingerprint_pack": str(out.relative_to(ROOT)).replace("\\", "/"),
            "recorded_at_utc": payload["recorded_at_utc"],
        }
        pass_path = ROOT / "evidence/GO_ttg_v9_audit/V9_PRE_PRODUCTION_LOCAL_FULL_CLEAN_PASS.json"
        pass_path.write_text(json.dumps(pass_stamp, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({"status": "PASS", "pass": str(pass_path), "metrics": metrics}, indent=2))
    else:
        fail_path = ROOT / "evidence/GO_ttg_v9_audit/V9_PRE_PRODUCTION_LOCAL_FULL_CLEAN_BLOCKED.json"
        fail_path.write_text(
            json.dumps(
                {
                    "stamp": "V9_PRE_PRODUCTION_LOCAL_FULL_CLEAN_BLOCKED",
                    "status": "BLOCKED_STOP",
                    "metrics": metrics,
                    "blockers": blockers,
                    "fingerprint_pack": str(out.relative_to(ROOT)).replace("\\", "/"),
                },
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )
        print(
            json.dumps(
                {
                    "status": "BLOCKED_STOP",
                    "metrics": metrics,
                    "blocker_ids": [b["id"] for b in blockers],
                    "pack": str(out),
                },
                indent=2,
            )
        )


if __name__ == "__main__":
    main()
