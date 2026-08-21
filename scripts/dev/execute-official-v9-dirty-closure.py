#!/usr/bin/env python3
"""Execute dirty closure from PREVIEW JSON. No reset --hard. Requires backup first."""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

OPS = "3e356617a498b0faac42e4ae457343d36294a770"
PREVIEW = Path("evidence/GO_ttg_v9_audit/OFFICIAL_V9_PRODUCT_BASELINE_DIRTY_RECONCILIATION_PREVIEW.json")
BACKUP_DIR = Path("evidence/GO_ttg_v9_audit/DIRTY_CLOSURE_BACKUP")


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print("+", " ".join(cmd))
    return subprocess.run(cmd, check=check, text=True, encoding="utf-8", errors="replace")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--backup-only", action="store_true")
    ap.add_argument("--execute", action="store_true")
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()

    if not PREVIEW.exists():
        print("missing preview", file=sys.stderr)
        return 2
    data = json.loads(PREVIEW.read_text(encoding="utf-8"))
    if data.get("UNKNOWN_COUNT", 1) != 0:
        print("UNKNOWN != 0 — refuse execute", file=sys.stderr)
        return 2

    rows = data["rows"]
    by = {}
    for r in rows:
        by.setdefault(r["action"], []).append(r)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    # Backup: tag HEAD + tracked diff + untracked file list + copy of preview
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
    tag = f"backup/official-v9-dirty-closure-pre-{stamp}"
    run(["git", "tag", "-f", tag, head])
    diff_path = BACKUP_DIR / f"tracked-diff-{stamp}.patch"
    run(["git", "diff"], check=False).stdout  # noqa — write below
    subprocess.run(
        ["git", "diff"],
        check=False,
        stdout=diff_path.open("w", encoding="utf-8", errors="replace"),
    )
    (BACKUP_DIR / f"preview-{stamp}.json").write_text(
        PREVIEW.read_text(encoding="utf-8"), encoding="utf-8"
    )
    porcelain = subprocess.check_output(
        ["git", "-c", "core.quotepath=false", "status", "--porcelain", "-uall"],
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    (BACKUP_DIR / f"porcelain-{stamp}.txt").write_text(porcelain, encoding="utf-8")
    meta = {
        "stamp": "OFFICIAL_V9_DIRTY_CLOSURE_BACKUP",
        "tag": tag,
        "head": head,
        "ops_product_pin": OPS,
        "tracked_diff": diff_path.as_posix(),
        "note": "Recover tracked mods via git apply patch; recover tag via git checkout tag; V9 untracked still on disk until DELETE/COMMIT",
    }
    (BACKUP_DIR / f"BACKUP-META-{stamp}.json").write_text(
        json.dumps(meta, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(meta, indent=2))

    if args.backup_only or not args.execute:
        print("backup done; pass --execute to apply cleanup")
        return 0

    # 1) DELETE_GENERATED
    for r in by.get("DELETE_GENERATED", []):
        p = Path(r["path"])
        if p.exists() or p.is_symlink():
            if p.is_dir():
                shutil.rmtree(p, ignore_errors=True)
            else:
                p.unlink(missing_ok=True)
            print("deleted", r["path"])

    # 2) RESTORE
    ops_paths = []
    head_paths = []
    for r in by.get("RESTORE_FROM_OFFICIAL", []):
        reason = r.get("reason", "")
        path = r["path"]
        if "OPS pin" in reason or "product mother" in reason:
            # only checkout if exists in OPS
            chk = subprocess.run(["git", "cat-file", "-e", f"{OPS}:{path}"], capture_output=True)
            if chk.returncode == 0:
                ops_paths.append(path)
            else:
                head_paths.append(path)
        else:
            head_paths.append(path)

    # batch checkout to avoid arg limits
    def chunked(xs, n=40):
        for i in range(0, len(xs), n):
            yield xs[i : i + n]

    for chunk in chunked(ops_paths):
        run(["git", "checkout", OPS, "--", *chunk])
    for chunk in chunked(head_paths):
        # discard local mods on tracked files
        tracked = []
        for path in chunk:
            chk = subprocess.run(["git", "cat-file", "-e", f"HEAD:{path}"], capture_output=True)
            if chk.returncode == 0:
                tracked.append(path)
            else:
                # untracked leftover under restore class — delete
                p = Path(path)
                if p.exists():
                    if p.is_dir():
                        shutil.rmtree(p, ignore_errors=True)
                    else:
                        p.unlink(missing_ok=True)
        if tracked:
            run(["git", "checkout", "HEAD", "--", *tracked])

    # 3) Stage COMMIT + LEGACY_KEEP (retain on disk)
    keep_paths = [r["path"] for r in by.get("COMMIT", []) + by.get("LEGACY_KEEP", []) + by.get("KEEP", [])]
    # also stage restored OPS frontend (already staged by checkout)
    for chunk in chunked(keep_paths):
        existing = [p for p in chunk if Path(p).exists()]
        if existing:
            run(["git", "add", "-A", "--", *existing], check=False)

    # ensure generated dirs stay untracked / gone
    status = subprocess.check_output(
        ["git", "-c", "core.quotepath=false", "status", "--porcelain"],
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    (BACKUP_DIR / f"post-execute-porcelain-{stamp}.txt").write_text(status, encoding="utf-8")
    print("post-execute porcelain lines:", len([l for l in status.splitlines() if l.strip()]))

    if args.commit:
        msg = (
            "baseline(official-v9): OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE\n\n"
            "Merge Production OPS-2026.08.20-v9 product mother (frontend restore from "
            f"{OPS[:12]}) with retained V9 Web3 SSOT (Design Lock DL_R1 docs/contracts/"
            "registry/whitepaper/github-official/evidence). Delete generated cache/out. "
            "No Production deploy. No TT_PRODUCTION_GO flip. No Phase2.\n"
        )
        run(["git", "commit", "-m", msg])
        new_head = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
        run(["git", "tag", "-f", "OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE", new_head])
        pin = {
            "stamp": "OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE",
            "commit": new_head,
            "tag": "OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE",
            "product_mother_ops_sha": OPS,
            "backup_tag": tag,
            "tt_production_go": "NO_GO",
            "did_not": [
                "production_deploy",
                "meta_indexer_cutover",
                "mainnet_phase2",
                "DL_R1_chain_mutation",
                "TT_PRODUCTION_GO_flip",
                "git_reset_hard",
            ],
            "stop": True,
        }
        Path("evidence/GO_ttg_v9_audit/OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE.json").write_text(
            json.dumps(pin, indent=2) + "\n", encoding="utf-8"
        )
        print(json.dumps(pin, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
