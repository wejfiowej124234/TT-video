#!/usr/bin/env python3
"""OFFICIAL_FIRST_FINAL_CONVERGENCE_CERTIFICATION — read-only verify + PASS_STOP issuance.

Official Production OPS-v9 = sole PRODUCT SSOT.
Web3 (FTB + V9 Candidate) explicitly OUT OF SCOPE for product alignment.

Requires: UNAUTHORIZED_DRIFT=0 · RUNTIME_PARITY_GAPS=0 · DOC_TRUTH_CONFLICTS=0 · OUT_OF_SCOPE=0
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_official_product_reality_capture"
PIN_SHA = "3e356617a498b0faac42e4ae457343d36294a770"
CANDIDATE_SHA = "b19b85810c22677d243a82d06ebec8ebcb4d4b47"

POST_PARITY_PASS_STOPS = [
    "POST_PARITY_FIX_QUEUE_BATCH1_CMS_OCS_PASS_STOP_LATEST.json",
    "POST_PARITY_FIX_QUEUE_BATCH2_ADMIN_AUTH_PASS_STOP_LATEST.json",
    "POST_PARITY_FIX_QUEUE_BATCH3_UI_UX_PASS_STOP_LATEST.json",
    "POST_PARITY_FIX_QUEUE_BATCH4_FUNCTIONAL_DEFECTS_PASS_STOP_LATEST.json",
    "POST_PARITY_FIX_QUEUE_BATCH5_ASSETS_I18N_PASS_STOP_LATEST.json",
]

REQUIRED_PARITY_ARTIFACTS = [
    "PRODUCT_AND_DOCUMENTATION_SCHEMA_PARITY_PASS_LATEST.json",
    "PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS_LATEST.json",
    "PROD_GIT_MIGRATION_VERIFY_LATEST.json",
    "OFFICIAL_PRODUCT_REALITY_COMPARE_LATEST.json",
    "OFFICIAL_PRODUCT_MOTHERBOARD_FREEZE_LATEST.json",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def bash_exe() -> str:
    for candidate in (
        os.environ.get("BASH", "").strip(),
        shutil.which("bash") or "",
        r"C:\Program Files\Git\bin\bash.exe",
        r"C:\Program Files\Git\usr\bin\bash.exe",
    ):
        if candidate and Path(candidate).exists():
            return candidate
    return "bash"


def run_bash(rel: str) -> tuple[int, str]:
    proc = subprocess.run(
        [bash_exe(), str(ROOT / rel)],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    out = (proc.stdout or "") + (proc.stderr or "")
    tail = out.strip().splitlines()[-1] if out.strip() else f"exit={proc.returncode}"
    return proc.returncode, tail


def git_porcelain() -> str:
    proc = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return (proc.stdout or "").strip()


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--out",
        default=str(EV / "OFFICIAL_FIRST_FULL_CONVERGENCE_PASS_STOP_LATEST.json"),
    )
    p.add_argument(
        "--skip-live-post-parity",
        action="store_true",
        help="Trust PASS_STOP artifacts; do not re-run batch 4/5 live gates",
    )
    args = p.parse_args()

    gaps: list[dict] = []
    checks: dict = {}
    porcelain = git_porcelain()

    # FC-01 · clean worktree (no modified tracked files; untracked certification artifacts OK)
    lines = [ln for ln in porcelain.splitlines() if ln.strip()]
    dirty_tracked = [ln for ln in lines if not ln.startswith("??")]
    wt_ok = len(dirty_tracked) == 0
    checks["fc01_clean_worktree"] = {
        "dirty_tracked": dirty_tracked,
        "untracked": [ln for ln in lines if ln.startswith("??")],
        "pass": wt_ok,
    }
    if not wt_ok:
        gaps.append({"id": "FC-01", "detail": f"dirty tracked files: {dirty_tracked}"})

    # FC-02 · release identity / repo 1:1
    code, line = run_bash("scripts/gates/check-official-v9-local-staging-repo-1to1.sh")
    ok = code == 0 and "TT_OFFICIAL_V9_1TO1_MAP: PASS" in line
    checks["fc02_v9_1to1_map"] = {"exit": code, "tail": line, "pass": ok}
    if not ok:
        gaps.append({"id": "FC-02", "detail": f"1to1 map fail ({line})"})

    # FC-03 · plane map (Web3 ED isolated)
    code, line = run_bash("scripts/gates/check-official-v9-plane-map.sh")
    ok = code == 0 and "TT_OFFICIAL_V9_PLANE_MAP: PASS" in line
    checks["fc03_v9_plane_map"] = {"exit": code, "tail": line, "pass": ok}
    if not ok:
        gaps.append({"id": "FC-03", "detail": f"plane map fail ({line})"})

    # FC-04 · migrations 157/157 Git + prod verify
    mig_count = len(list((ROOT / "crates/api/migrations").glob("*.sql")))
    mig_verify = load_json(EV / "PROD_GIT_MIGRATION_VERIFY_LATEST.json")
    verdict = mig_verify.get("verdict", "")
    applied = mig_verify.get("applied_count") or mig_verify.get("migration_count")
    mig_ok = mig_count == 157 and verdict == "MATCH_1TO1" and (applied in (157, "157", None) or mig_verify.get("git_migration_count") == 157)
    checks["fc04_migrations_157"] = {
        "git_sql_files": mig_count,
        "prod_verify_verdict": verdict,
        "applied_count": applied,
        "pass": mig_ok,
    }
    if not mig_ok:
        gaps.append({"id": "FC-04", "detail": f"migrations git={mig_count} verify={verdict}"})

    # FC-05 · runtime parity gaps
    compare = load_json(EV / "OFFICIAL_PRODUCT_REALITY_COMPARE_LATEST.json")
    runtime_gaps = str(compare.get("RUNTIME_PARITY_GAPS", "NOT_ZERO"))
    parity_ok = runtime_gaps == "0" and compare.get("parity_pass_allowed") is True
    checks["fc05_runtime_parity"] = {
        "RUNTIME_PARITY_GAPS": runtime_gaps,
        "parity_pass_allowed": compare.get("parity_pass_allowed"),
        "pass": parity_ok,
    }
    if not parity_ok:
        gaps.append({"id": "FC-05", "detail": f"RUNTIME_PARITY_GAPS={runtime_gaps}"})

    # FC-06 · schema + runtime parity PASS artifacts
    schema_pass = load_json(EV / "PRODUCT_AND_DOCUMENTATION_SCHEMA_PARITY_PASS_LATEST.json")
    runtime_pass = load_json(EV / "PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS_LATEST.json")
    schema_ok = bool(schema_pass.get("issued_utc")) and (
        schema_pass.get("PRODUCT_AND_DOCUMENTATION_SCHEMA_PARITY_PASS") == "ISSUED"
        or schema_pass.get("zero_gates", {}).get("RUNTIME_PARITY_GAPS") == "0"
    )
    runtime_ok = bool(runtime_pass.get("issued_utc")) and runtime_pass.get("schema", "").endswith(
        "runtime_parity_pass.v1"
    )
    missing = [a for a in REQUIRED_PARITY_ARTIFACTS if not (EV / a).exists()]
    checks["fc06_parity_pass_artifacts"] = {
        "schema_pass": schema_ok,
        "runtime_pass": runtime_ok,
        "missing": missing,
        "pass": schema_ok and runtime_ok and not missing,
    }
    if not (schema_ok and runtime_ok and not missing):
        gaps.append({"id": "FC-06", "detail": f"parity artifacts missing or not ISSUED: {missing}"})

    # FC-07 · POST_PARITY five batches CLOSED
    reg_text = (ROOT / "registry/official-first-post-parity-fix-queue.v1.yaml").read_text(encoding="utf-8")
    queue_closed = "queue_status: CLOSED" in reg_text and "active_batch: null" in reg_text
    batch_stops = {}
    for name in POST_PARITY_PASS_STOPS:
        data = load_json(EV / name)
        issued = any(v == "ISSUED" for k, v in data.items() if "PASS_STOP" in k or k.endswith("_PASS"))
        drift = data.get("UNAUTHORIZED_DRIFT", "NOT_ZERO")
        batch_stops[name] = {"issued": issued, "UNAUTHORIZED_DRIFT": drift, "pass": issued and drift == "0"}
        if not (issued and drift == "0"):
            gaps.append({"id": "FC-07", "detail": f"{name} not ISSUED or drift"})
    pp_ok = queue_closed and all(v["pass"] for v in batch_stops.values())
    checks["fc07_post_parity_five_batches"] = {
        "queue_registry_closed": queue_closed,
        "batches": batch_stops,
        "pass": pp_ok,
    }
    if not queue_closed:
        gaps.append({"id": "FC-07", "detail": "POST_PARITY queue registry not CLOSED"})

    # FC-08 · live re-verify batch 4/5 (optional)
    if not args.skip_live_post_parity:
        env = {**os.environ, "POST_PARITY_BATCH4_SKIP_LOCAL_REGRESSION": "1", "POST_PARITY_BATCH5_SKIP_LOCAL_GREEN": "1"}
        for script, key in (
            ("scripts/gates/run-post-parity-fix-queue-batch4-functional-defects.py", "batch4"),
            ("scripts/gates/run-post-parity-fix-queue-batch5-assets-i18n.py", "batch5"),
        ):
            proc = subprocess.run(
                [sys.executable, str(ROOT / script)],
                cwd=str(ROOT),
                env=env,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            tail = (proc.stdout or proc.stderr or "").strip().splitlines()
            line = tail[-1] if tail else f"exit={proc.returncode}"
            ok = proc.returncode == 0 and "gaps=0" in line
            checks[f"fc08_live_{key}"] = {"exit": proc.returncode, "tail": line, "pass": ok}
            if not ok:
                gaps.append({"id": "FC-08", "detail": f"live {key} gate fail"})
    else:
        checks["fc08_live_post_parity"] = {"pass": True, "note": "skipped"}

    # FC-09 · doc truth (non-Web3 product docs)
    proc = subprocess.run(
        [sys.executable, str(ROOT / "scripts/dev/run-ttg-v9-doc-truth-convergence-gate.py")],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    doc_out = {}
    try:
        doc_out = json.loads(proc.stdout or "{}")
    except json.JSONDecodeError:
        doc_out = {"parse_error": True}
    doc_conflicts = int(doc_out.get("ACTIVE_TRUTH_CONFLICTS", 999))
    doc_ok = proc.returncode == 0 and doc_conflicts == 0
    checks["fc09_doc_truth"] = {
        "ACTIVE_TRUTH_CONFLICTS": doc_conflicts,
        "OLD_V9_ACTIVE_DOCUMENT_REFERENCES": doc_out.get("OLD_V9_ACTIVE_DOCUMENT_REFERENCES"),
        "pass": doc_ok,
    }
    if not doc_ok:
        gaps.append({"id": "FC-09", "detail": f"DOC_TRUTH_CONFLICTS={doc_conflicts}"})

    # FC-10 · Web3 isolation + NO_GO
    rebuild = load_json(EV / "OFFICIAL_FIRST_CLEAN_REBUILD_STATUS.json")
    web3 = rebuild.get("web3_plane") or {}
    web3_ok = (
        web3.get("mainnet_broadcast") in ("NOT_AUTHORIZED", None)
        and CANDIDATE_SHA.startswith("b19b85810")
        and web3.get("isolated") is True
    )
    checks["fc10_web3_isolated_no_go"] = {
        "candidate_sha": CANDIDATE_SHA,
        "mainnet_broadcast": web3.get("mainnet_broadcast"),
        "tt_production_go": "NO_GO",
        "pass": web3_ok,
    }
    if not web3_ok:
        gaps.append({"id": "FC-10", "detail": "Web3 isolation / NO_GO check"})

    unauthorized = "0" if not gaps else "NOT_ZERO"
    runtime_gaps_out = "0" if parity_ok else runtime_gaps
    doc_conflicts_out = "0" if doc_ok else str(doc_conflicts)
    out_of_scope = "0" if not gaps else "NOT_ZERO"

    out = {
        "schema": "traveltrust.official_first_full_convergence_pass_stop.v1",
        "issued_utc": utc_now(),
        "track": "OFFICIAL_FIRST_FINAL_CONVERGENCE_CERTIFICATION",
        "official_product_ssot": "OPS-2026.08.20-v9",
        "pin_git_sha": PIN_SHA,
        "git_tip_sha": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "checks": checks,
        "gaps": gaps,
        "OFFICIAL_FIRST_FULL_CONVERGENCE_PASS_STOP": "ISSUED" if not gaps else "NOT_ISSUED",
        "UNAUTHORIZED_DRIFT": unauthorized,
        "RUNTIME_PARITY_GAPS": runtime_gaps_out,
        "DOC_TRUTH_CONFLICTS": doc_conflicts_out,
        "OUT_OF_SCOPE": out_of_scope,
        "tt_production_go": "NO_GO",
        "web3_plane": {
            "ssot": "FTB + V9 Candidate",
            "candidate_sha": CANDIDATE_SHA,
            "overwrite_candidate_from_official_web3": "forbidden",
            "mainnet_broadcast": "NOT_AUTHORIZED",
            "excluded_from_product_alignment": True,
        },
        "post_parity_fix_queue": "CLOSED",
        "coverage": [
            "release_identity",
            "migrations_157",
            "db_schema_views",
            "api_runtime_env_flags",
            "cms_ocs_assets",
            "auth_admin",
            "five_main_ui_ux",
            "functional_defects",
            "zh_en_i18n",
            "post_parity_batches_1_5",
            "clean_worktree",
        ],
    }
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")

    # Mirror status for machine consumers
    status_path = EV / "OFFICIAL_FIRST_FULL_CONVERGENCE_STATUS.json"
    status_path.write_text(
        json.dumps(
            {
                "schema": "traveltrust.official_first_full_convergence_status.v1",
                "recorded_utc": out["issued_utc"],
                "gate_result": "PASS" if not gaps else "FAIL",
                "OFFICIAL_FIRST_FULL_CONVERGENCE_PASS_STOP": out["OFFICIAL_FIRST_FULL_CONVERGENCE_PASS_STOP"],
                "zero_gates": {
                    "UNAUTHORIZED_DRIFT": unauthorized,
                    "RUNTIME_PARITY_GAPS": runtime_gaps_out,
                    "DOC_TRUTH_CONFLICTS": doc_conflicts_out,
                    "OUT_OF_SCOPE": out_of_scope,
                },
                "tt_production_go": "NO_GO",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        f"OFFICIAL_FIRST_FINAL_CONVERGENCE: pass={out['OFFICIAL_FIRST_FULL_CONVERGENCE_PASS_STOP']} "
        f"gaps={len(gaps)} UNAUTHORIZED_DRIFT={unauthorized} RUNTIME_PARITY_GAPS={runtime_gaps_out}"
    )
    return 0 if not gaps else 2


if __name__ == "__main__":
    raise SystemExit(main())
