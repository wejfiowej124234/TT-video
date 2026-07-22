#!/usr/bin/env python3
"""Release Completeness Audit — Code/Data/Asset/Config/Runtime/Evidence.

REPORT + optional --archive-clean. Does NOT mint Production GO / Hard Gate.

  python scripts/dev/run-release-completeness-audit.py
  python scripts/dev/run-release-completeness-audit.py --archive-clean

SSOT parents: FINAL RELEASE · Engineering SSOT Anchor · Candidate v2 pin
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import ssl
import subprocess
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

ROOT = Path(__file__).resolve().parents[2]
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
PROFILE = "v311_fund_safety_candidate_v2"
OUT_JSON = ROOT / "docs/runbook/TT-RELEASE-COMPLETENESS-AUDIT-LATEST.json"
OUT_MD = ROOT / "docs/runbook/TT-RELEASE-COMPLETENESS-AUDIT-LATEST.md"
MACHINE_KEY = "TT_RELEASE_COMPLETENESS_AUDIT"

# Paths that MUST enter unique RC (ingest) when present untracked
INGEST_PREFIXES = (
    "frontend/public/media/traveltrust/roles/",
    "registry/traveltrust-role-promo-media-assets.v1.yaml",
    "registry/psg-change-records/PCR-20260722-004.yaml",
    "registry/psg-change-records/PCR-20260722-005.yaml",
    "evidence/GO_fg15_observation_48h_candidate_v2/",
    "evidence/PSG-EVIDENCE-CONSOLIDATION/",
    "evidence/PSG-L1-product/",
    "evidence/PSG-L2-data/",
    "evidence/PSG-L3-security/",
    "evidence/PSG-L4-operations/",
    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/",
    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending-pre-bridge-option-a-",
    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3/",
    "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail/",
    "contracts/script/ExecuteCandidateV2SettlementTimelock.s.sol",
    "scripts/dev/lib/web3-candidate-v2-mainline.sh",
    "scripts/dev/lib/tt_refuse_historical_baseline.py",
    "scripts/dev/check-psg-eta-execution-gate.py",
    "scripts/dev/check-psg-s7-candidate-baseline-gate.py",
    "scripts/dev/check-psg-s7-input-manifest-gate.py",
    "scripts/dev/check-psg-settlement-final-capture.py",
    "scripts/dev/check-public-display-10x4-counts.py",
    "scripts/dev/gen-fg15b-case-index.py",
    "scripts/dev/run-psg-candidate-evidence-bridge-option-a.py",
    "scripts/dev/run-psg-completion-matrix-recalculate.py",
    "scripts/dev/run-psg-completion-matrix-recalculate.sh",
    "scripts/dev/run-psg-project-a-",
    "scripts/dev/run-web3-candidate-v2-settlement-finalize.sh",
    "scripts/dev/archive-staging-non-ocs-market-listings.cjs",
    "scripts/gates/check-production-feature-inventory-gate.sh",
    "scripts/gates/check-reality-closure-gate.sh",
    "docs/runbook/TT-PROJECT-A-FINAL-RELEASE-CHAIN-ALIGNMENT-LATEST.md",
    "docs/runbook/TT-PSG-CANDIDATE-V2-FORMAL-BASELINE-SIGNOFF-PREP-LATEST.md",
    "docs/runbook/TT-PSG-POST-ETA-COMMAND-SHEET-LATEST.md",
    "docs/runbook/TT-RELEASE-COMPLETENESS-AUDIT-LATEST.",
    "scripts/dev/run-release-completeness-audit.py",
    "scripts/gates/check-traveltrust-role-promo-media-ssot-gate.sh",
    "evidence/GO_release_completeness_cleanup/",
)

# Snapshot-only evidence (archive copy · do not delete living Candidate evidence)
ARCHIVE_ONLY_PREFIXES = (
    "evidence/GO_public_display_10x4_lock/20260722T051705Z/",
)

# Safe to remove from worktree after archive (local noise · not SSOT)
DELETE_SAFE_PREFIXES = (
    ".dev_backend.pid",
    ".dev_frontend.pid",
    ".local-repro-",
    ".local-tt9621-api.",
    ".tmp-smoke-api.log",
    ".smoke_ab_body.json",
    "web-stg-deploy.log",
    "web-stg-deploy2.log",
)

# Expected ignored — confirm only
EXPECTED_IGNORED_PREFIXES = (
    "node_modules/",
    "frontend/node_modules/",
    "target/",
    "crates/api/target/",
    "contracts/out/",
    "contracts/cache/",
    "contracts/broadcast/",
    ".env",
    "deploy/fly/tt-web-staging/build.env.local",
    "deploy/fly/tt-web-prod/build.env.local",
    ".playwright-browsers/",
    ".rc1-quarantine/",
    ".tmp/",
    ".tools/",
    "dist/",
    "Cargo.lock",
    "首页角色宣传片/",
    "data/anvil_local/",
    "data/community_post_media/",
)


def git(*a: str) -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), *a], text=True, errors="replace").strip()


def load_yaml(rel: str) -> dict:
    p = ROOT / rel
    if not p.exists() or yaml is None:
        return {}
    return yaml.safe_load(p.read_text(encoding="utf-8")) or {}


def get_json(url: str) -> dict:
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "tt-release-completeness"})
    with urllib.request.urlopen(req, context=ctx, timeout=40) as r:
        return json.loads(r.read().decode())


def norm(p: str) -> str:
    return p.replace("\\", "/").strip()


def matches_any(path: str, prefixes: tuple[str, ...]) -> bool:
    path = norm(path)
    for pref in prefixes:
        if path == pref.rstrip("/") or path.startswith(pref):
            return True
    return False


def expand_untracked(top_paths: list[str]) -> list[str]:
    files: list[str] = []
    for p in top_paths:
        path = ROOT / p
        if path.is_dir():
            for f in path.rglob("*"):
                if f.is_file():
                    files.append(norm(str(f.relative_to(ROOT))))
        elif path.is_file() or path.exists():
            files.append(norm(p))
    return files


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.digest().hex()


def classify_untracked(path: str) -> str:
    if matches_any(path, INGEST_PREFIXES):
        return "INGEST_TO_RC"
    if matches_any(path, ARCHIVE_ONLY_PREFIXES):
        return "ARCHIVE_SNAPSHOT"
    if matches_any(path, DELETE_SAFE_PREFIXES):
        return "DELETE_SAFE"
    # leftover media WIP registry under roles without full LFS policy already covered
    if path.startswith("evidence/"):
        return "EVIDENCE_REVIEW"
    if path.startswith("scripts/"):
        return "SCRIPT_REVIEW"
    if path.startswith("docs/"):
        return "DOC_REVIEW"
    return "UNCLASSIFIED_REVIEW"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--archive-clean",
        action="store_true",
        help="Copy ARCHIVE_SNAPSHOT + DELETE_SAFE into evidence stamp; remove DELETE_SAFE from WT",
    )
    args = ap.parse_args()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    head = git("rev-parse", "HEAD")
    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    porcelain = git("status", "--porcelain", "-u").splitlines() if True else []
    modified = []
    untracked_tops = []
    for ln in porcelain:
        if len(ln) < 4:
            continue
        st, path = ln[:2], norm(ln[3:])
        if st.startswith("??"):
            untracked_tops.append(path)
        else:
            modified.append({"status": st.strip(), "path": path})

    untracked_files = expand_untracked(untracked_tops)
    by_class: dict[str, list[str]] = defaultdict(list)
    for f in untracked_files:
        by_class[classify_untracked(f)].append(f)

    # Ignored top-level sample (not full expand — too large)
    ignored_tops = []
    for ln in git("status", "--ignored", "--porcelain", "-u").splitlines():
        if ln.startswith("!!"):
            ignored_tops.append(norm(ln[3:]))
    ignored_expected = [p for p in ignored_tops if matches_any(p, EXPECTED_IGNORED_PREFIXES)]
    ignored_unexpected = [p for p in ignored_tops if not matches_any(p, EXPECTED_IGNORED_PREFIXES)]

    # Asset: role promo
    promo_reg = load_yaml("registry/traveltrust-role-promo-media-assets.v1.yaml")
    promo_manifest = ROOT / "frontend/public/media/traveltrust/roles/PROMO-MANIFEST.json"
    promo_assets = (promo_reg.get("assets") or []) if promo_reg else []
    asset_checks = []
    for a in promo_assets:
        rel = a.get("path") or ""
        p = ROOT / rel
        entry = {
            "role": a.get("role"),
            "path": rel,
            "expected_sha256": a.get("sha256"),
            "expected_bytes": a.get("bytes"),
            "exists": p.is_file(),
            "gitignored": False,
            "lfs_tracked": False,
        }
        if p.is_file():
            entry["actual_bytes"] = p.stat().st_size
            entry["actual_sha256"] = sha256_file(p)
            entry["sha_match"] = entry["actual_sha256"] == a.get("sha256")
            try:
                ign = git("check-ignore", "-v", rel)
                entry["gitignored"] = bool(ign)
            except subprocess.CalledProcessError:
                entry["gitignored"] = False
        # LFS attr
        try:
            attr = git("check-attr", "filter", "--", rel)
            entry["lfs_tracked"] = "filter: lfs" in attr
        except subprocess.CalledProcessError:
            pass
        asset_checks.append(entry)

    # Config / registry tips
    frb = load_yaml("registry/final-release-baseline.v1.yaml")
    ver = load_yaml("registry/psg-release-version-LATEST.yaml")
    eng = load_yaml("registry/engineering-ssot-anchor.v1.yaml")
    act = ver.get("active") or {}
    freeze_tip = (
        ((frb.get("unique_system") or {}).get("code_release_tip") or {}).get("git_sha")
        or act.get("git_sha")
    )
    eng_tip = (eng.get("governance_parent") or {}).get("git_sha")

    # Runtime
    runtime = {"api": {}, "web_bake": {}, "ok": False}
    try:
        api = get_json("https://tt-api-staging.fly.dev/meta")
        b = api.get("build") or {}
        runtime["api"] = {
            "git_sha": b.get("git_sha"),
            "pin": b.get("psg_release_version"),
            "profile": b.get("contract_profile"),
            "attestation": b.get("attestation_status"),
        }
        bake = get_json("https://tt-web-staging.fly.dev/tt-release-identity.bake.json")
        runtime["web_bake"] = {
            "git_sha": bake.get("git_sha"),
            "pin": bake.get("psg_release_version"),
            "profile": bake.get("contract_profile"),
        }
        runtime["ok"] = (
            runtime["api"].get("pin") == PIN
            and runtime["web_bake"].get("pin") == PIN
            and runtime["api"].get("profile") == PROFILE
            and runtime["api"].get("attestation") == "ok"
        )
    except Exception as e:  # noqa: BLE001
        runtime["error"] = str(e)

    # Data: migrations LF + staging baseline cite
    mig_dir = ROOT / "crates/api/migrations"
    mig_count = len(list(mig_dir.glob("*.sql"))) if mig_dir.is_dir() else 0
    db_baseline = act.get("database_baseline")

    # Old / historical script markers (tracked) — report only
    hist_markers = (
        "run-fg15-observation-running",
        "PSG-REL-20260722-STAGING-ALIGN-W0",
        "v311_sepolia_clean_baseline",
        "652bbab5",
    )
    historical_hits = []
    scripts_dev = ROOT / "scripts/dev"
    if scripts_dev.is_dir():
        for f in scripts_dev.rglob("*"):
            if not f.is_file():
                continue
            if f.suffix.lower() not in {".sh", ".py", ".cjs", ".mjs", ".js"}:
                continue
            try:
                text = f.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            hits = [m for m in hist_markers if m in text]
            if hits:
                historical_hits.append(
                    {"path": norm(str(f.relative_to(ROOT))), "markers": hits[:4]}
                )

    # Findings
    findings = []
    promo_ok = bool(promo_assets) and all(
        c.get("exists") and c.get("sha_match") and c.get("lfs_tracked") and not c.get("gitignored")
        for c in asset_checks
    )
    if not promo_ok:
        findings.append(
            {
                "sev": "P0",
                "dim": "Asset",
                "id": "ROLE_PROMO_NOT_IN_GIT_SSOT",
                "detail": "Role promo MP4s missing Git LFS SSOT and/or checksum mismatch — clean bake loses media",
            }
        )
    ingest_n = len(by_class["INGEST_TO_RC"])
    if ingest_n:
        findings.append(
            {
                "sev": "P0",
                "dim": "Code/Evidence",
                "id": "UNTRACKED_MUST_INGEST",
                "detail": f"{ingest_n} files classified INGEST_TO_RC not yet in unique RC tip",
            }
        )
    if modified:
        findings.append(
            {
                "sev": "P1",
                "dim": "Code",
                "id": "MODIFIED_NOT_COMMITTED",
                "detail": f"{len(modified)} modified tracked paths (e.g. .gitattributes/.gitignore)",
            }
        )
    if freeze_tip and eng_tip and freeze_tip != eng_tip:
        findings.append(
            {
                "sev": "P1",
                "dim": "Config",
                "id": "FREEZE_VS_ENG_TIP_DRIFT",
                "detail": f"final_release tip={freeze_tip} eng tip={eng_tip}",
            }
        )
    web_sha = (runtime.get("web_bake") or {}).get("git_sha")
    if freeze_tip and web_sha and web_sha != freeze_tip and web_sha != head:
        findings.append(
            {
                "sev": "P1",
                "dim": "Runtime",
                "id": "STAGING_WEB_TIP_LAG_OR_DRIFT",
                "detail": f"web_bake={web_sha} freeze_tip={freeze_tip} head={head}",
                "disposition": "CONFIRM_DESIGN_UNTIL_CLEAN_RC_BAKE",
            }
        )

    p0 = sum(1 for f in findings if f.get("sev") == "P0")
    verdict = "BLOCKED_UNTIL_INGEST" if p0 else "READY_FOR_UNIQUE_RC"
    if p0 == 0 and not untracked_files and not modified:
        verdict = "COMPLETE_CLEAN"

    archive_meta = None
    if args.archive_clean:
        out = ROOT / "evidence/GO_release_completeness_cleanup" / stamp
        out.mkdir(parents=True, exist_ok=True)
        archived = []
        removed = []
        for cls in ("ARCHIVE_SNAPSHOT", "DELETE_SAFE", "UNCLASSIFIED_REVIEW"):
            for rel in by_class.get(cls, []):
                src = ROOT / rel
                if not src.exists():
                    continue
                dest = out / "archived" / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                if src.is_file():
                    shutil.copy2(src, dest)
                    archived.append(rel)
                    if cls == "DELETE_SAFE":
                        src.unlink(missing_ok=True)
                        removed.append(rel)
        # Also snapshot porcelain + classification
        (out / "classification.json").write_text(
            json.dumps({k: v for k, v in by_class.items()}, indent=2) + "\n",
            encoding="utf-8",
        )
        archive_meta = {
            "stamp": stamp,
            "out": str(out.relative_to(ROOT)).replace("\\", "/"),
            "archived_count": len(archived),
            "removed_delete_safe": removed,
            "note": "INGEST_TO_RC and Candidate evidence NOT deleted — must commit into unique RC",
        }

    payload = {
        "schema": "traveltrust.release_completeness_audit.v1",
        "machine_key": MACHINE_KEY,
        "recorded_utc": now,
        "equals_production_go": False,
        "equals_staging_grade_go": False,
        "verdict": verdict,
        "p0_count": p0,
        "git": {"head": head, "branch": branch, "freeze_tip": freeze_tip, "eng_tip": eng_tip},
        "dimensions": {
            "Code": {
                "modified": modified,
                "untracked_tops": untracked_tops,
                "untracked_file_count": len(untracked_files),
                "by_class_counts": {k: len(v) for k, v in sorted(by_class.items())},
                "ingest_sample": by_class["INGEST_TO_RC"][:40],
                "historical_script_hits": len(historical_hits),
                "historical_script_sample": historical_hits[:25],
            },
            "Data": {
                "migration_sql_count": mig_count,
                "database_baseline": db_baseline,
                "ok": bool(db_baseline) and mig_count > 0,
            },
            "Asset": {
                "role_promo_registry": bool(promo_reg),
                "role_promo_manifest_exists": promo_manifest.is_file(),
                "checks": asset_checks,
                "promo_ssot_ok": promo_ok,
                "drop_zone_ignored": True,
                "drop_zone_note": "首页角色宣传片/ remains optional ingest only",
            },
            "Config": {
                "pin": act.get("psg_release_version"),
                "registry_sha": act.get("git_sha"),
                "freeze_status": frb.get("freeze_status"),
                "engineering_anchor": eng.get("machine_key"),
                "contract_profile": act.get("contract_bytecode_pin") or PROFILE,
            },
            "Runtime": runtime,
            "Evidence": {
                "candidate_v2_root": "evidence/GO_web3_candidate_v2",
                "fg15b_append_root": "evidence/GO_fg15_observation_48h_candidate_v2",
                "fg15b_untracked": any(
                    f.startswith("evidence/GO_fg15_observation_48h_candidate_v2/")
                    for f in untracked_files
                ),
                "consolidation_untracked": any(
                    f.startswith("evidence/PSG-") for f in untracked_files
                ),
            },
        },
        "ignored": {
            "top_count": len(ignored_tops),
            "expected_sample": ignored_expected[:40],
            "unexpected_sample": ignored_unexpected[:40],
        },
        "findings": findings,
        "disposition_matrix": {
            "INGEST_TO_RC": "Commit into unique Release Candidate (Git/LFS + registry)",
            "ARCHIVE_SNAPSHOT": "Copy under evidence/GO_release_completeness_cleanup · keep or demote",
            "DELETE_SAFE": "Archive then remove from worktree",
            "EXPECTED_IGNORED": "Leave ignored (secrets/build/cache)",
            "HISTORICAL_TRACKED_SCRIPTS": "Keep refuse stubs · do not delete Archive evidence",
        },
        "archive": archive_meta,
        "next": [
            "Commit all INGEST_TO_RC + .gitattributes/.gitignore media SSOT",
            "git lfs push as needed",
            "Re-pin FINAL RELEASE / Engineering tip to unique RC SHA",
            "Clean tip worktree Staging Web bake",
            "Delta dry-run · Inventory/Reality/GO stay paused",
        ],
    }

    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# TT · Release Completeness Audit（Code/Data/Asset/Config/Runtime/Evidence）",
        "",
        f"**Machine key:** `{MACHINE_KEY}`  ",
        f"**Recorded:** `{now}`  ",
        f"**Verdict:** `{verdict}` · P0=`{p0}`  ",
        f"**HEAD:** `{head[:12]}` · branch `{branch}`  ",
        f"**Freeze tip:** `{freeze_tip}` · **Eng tip:** `{eng_tip}`  ",
        f"**Pin:** `{PIN}` · profile `{PROFILE}`  ",
        "",
        "**≠** Staging-grade GO · **≠** Production GO · **≠** Hard Gate",
        "",
        "---",
        "",
        "## 0 · 执行摘要",
        "",
        "| 维 | 结论 |",
        "|----|------|",
        f"| Code | untracked_files=`{len(untracked_files)}` · modified=`{len(modified)}` · INGEST=`{ingest_n}` |",
        f"| Data | migrations=`{mig_count}` · baseline=`{db_baseline}` |",
        f"| Asset | role_promo_ssot_ok=`{promo_ok}` |",
        f"| Config | freeze=`{frb.get('freeze_status')}` · registry_sha=`{(act.get('git_sha') or '')[:12]}` |",
        f"| Runtime | api=`{(runtime.get('api') or {}).get('git_sha','')}` · web=`{(runtime.get('web_bake') or {}).get('git_sha','')}` · ok=`{runtime.get('ok')}` |",
        f"| Evidence | fg15b_untracked=`{payload['dimensions']['Evidence']['fg15b_untracked']}` · consolidation_untracked=`{payload['dimensions']['Evidence']['consolidation_untracked']}` |",
        "",
        "## 1 · Findings",
        "",
    ]
    if not findings:
        lines.append("_none_")
    else:
        lines.append("| Sev | Dim | ID | Detail |")
        lines.append("|-----|-----|----|--------|")
        for f in findings:
            lines.append(
                f"| {f.get('sev')} | {f.get('dim')} | `{f.get('id')}` | {f.get('detail')} |"
            )

    lines += [
        "",
        "## 2 · Untracked classification counts",
        "",
        "| Class | Count | Disposition |",
        "|-------|------:|-------------|",
    ]
    for k, v in sorted(by_class.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        disp = payload["disposition_matrix"].get(k, "review")
        lines.append(f"| `{k}` | {len(v)} | {disp} |")

    lines += [
        "",
        "### INGEST_TO_RC sample (first 40)",
        "",
        "```",
        *by_class["INGEST_TO_RC"][:40],
        "```",
        "",
        "## 3 · Asset · Role promo checksums",
        "",
        "| Role | Exists | SHA match | LFS | Ignored |",
        "|------|:------:|:---------:|:---:|:-------:|",
    ]
    for c in asset_checks:
        lines.append(
            f"| {c.get('role')} | {c.get('exists')} | {c.get('sha_match')} | {c.get('lfs_tracked')} | {c.get('gitignored')} |"
        )

    lines += [
        "",
        "## 4 · Ignored (expected vs unexpected tops)",
        "",
        f"- Expected tops (sample): `{len(ignored_expected)}` listed in JSON",
        f"- Unexpected tops (sample): `{len(ignored_unexpected)}` — review JSON",
        "",
        "## 5 · Historical marker scripts (tracked · refuse/archive — do not delete)",
        "",
        f"Count: **{len(historical_hits)}** (sample in JSON)",
        "",
        "## 6 · Archive / clean",
        "",
    ]
    if archive_meta:
        lines.append(f"Applied `--archive-clean` → `{archive_meta['out']}` · archived={archive_meta['archived_count']} · removed_delete_safe={len(archive_meta['removed_delete_safe'])}")
    else:
        lines.append("Not applied. Re-run with `--archive-clean` to snapshot ARCHIVE_SNAPSHOT/DELETE_SAFE.")

    lines += [
        "",
        "## 7 · Next → Unique Release Candidate",
        "",
        "1. Commit **all** `INGEST_TO_RC` + media LFS + registry SSOT",
        "2. Worktree clean of non-SSOT local noise",
        "3. Re-pin FINAL RELEASE / Engineering / Version LATEST to new RC SHA",
        "4. PCR Delta Freeze · Engineering SSOT Anchor gate",
        "5. Clean tip Staging Web bake · Delta dry-run",
        "",
        "## 诚实边界",
        "",
        "Completeness Audit PASS/INGEST ≠ Inventory PASS ≠ Reality Closure ≠ Staging-grade GO ≠ Production GO.",
        "",
    ]
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps({"verdict": verdict, "p0": p0, "out_json": str(OUT_JSON), "archive": archive_meta}, indent=2))
    return 0 if p0 == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
