#!/usr/bin/env python3
"""Read-only · staging runtime vs local HEAD full-dimension diff."""
from __future__ import annotations

import json
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API = "https://tt-api-staging.fly.dev"
WEB = "https://tt-web-staging.fly.dev"


def fetch(url: str, timeout: int = 90) -> tuple[int | str, dict]:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "tt-full-diff/1"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode("utf-8", errors="replace")
            return r.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            body = {"raw": raw[:300]}
        return e.code, body
    except Exception as e:
        return 0, {"error": str(e)}


def git_head() -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "HEAD"], text=True).strip()


def dirty_deploy_paths() -> tuple[list[str], list[str]]:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "status", "--porcelain", "--", "crates/", "frontend/", "deploy/", "registry/"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    lines = [ln for ln in proc.stdout.splitlines() if ln.strip()]
    key = [
        ln
        for ln in lines
        if any(p in ln for p in ("crates/api/src/db/mod.rs", "itineraries.rs", "auth_pause_metrics"))
    ]
    return lines, key


def main() -> int:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir = ROOT / "evidence/GO_phase2_baseline_consistency_audit" / f"full-diff-{stamp}"
    out_dir.mkdir(parents=True, exist_ok=True)

    local = git_head()
    findings: list[dict] = []
    risks: list[dict] = []

    def add(domain: str, item: str, local_v: str, remote: str, severity: str, note: str = "") -> None:
        rec = {
            "domain": domain,
            "item": item,
            "local": local_v,
            "staging_or_evidence": remote,
            "severity": severity,
            "note": note,
        }
        (findings if severity in ("DIFF", "FAIL") else risks).append(rec)

    live: dict = {}
    meta: dict = {}
    meta_build: dict = {}
    web_meta: dict = {}

    live["api_health"], _ = fetch(f"{API}/health", timeout=15)
    live["api_meta"], meta = fetch(f"{API}/meta", timeout=90)
    live["api_meta_build"], meta_build = fetch(f"{API}/meta/build", timeout=45)
    live["web_meta"], web_meta = fetch(f"{WEB}/meta", timeout=45)

    api_sha = str((meta.get("build") or {}).get("git_sha") or "") if isinstance(meta, dict) else ""
    build_sha = str(meta_build.get("git_sha") or "") if isinstance(meta_build, dict) else ""
    web_sha = ""
    if isinstance(web_meta, dict):
        web_sha = str((web_meta.get("build") or {}).get("git_sha") or web_meta.get("git_sha") or "")

    # SHA
    if build_sha and build_sha.lower() == local.lower():
        pass
    elif build_sha:
        add("commit/build SHA", "local HEAD vs /meta/build", local, build_sha, "DIFF")
    else:
        add("commit/build SHA", "/meta/build git_sha", local, "(unavailable)", "RISK", "build manifest probe failed")

    if api_sha and build_sha and api_sha.lower() != build_sha.lower():
        add("build manifest", "/meta.build vs /meta/build", api_sha, build_sha, "DIFF")
    if web_sha and build_sha and web_sha.lower() != build_sha.lower():
        add("build manifest", "web /meta vs api /meta/build", web_sha, build_sha, "DIFF")

    if isinstance(meta_build, dict):
        btk = meta_build.get("build_top_keys") or []
        if len(btk) != 5:
            add("build manifest", "build_top_keys length", "5 (730 contract)", str(len(btk)), "DIFF")

    if isinstance(meta, dict) and meta.get("meta_top_keys") is not None:
        mtk = len(meta.get("meta_top_keys") or [])
        if mtk != 37:
            add("API schema", "meta_top_keys length", "37 (S6 G02 PASS)", str(mtk), "DIFF")
    else:
        add(
            "API schema",
            "GET /meta full contract",
            "37 meta_top_keys (S6 G02 PASS)",
            f"unavailable (HTTP {live.get('api_meta')})",
            "RISK",
            "runtime availability · not version drift",
        )

    # evidence
    freeze: dict = {}
    fp = ROOT / "evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"
    if fp.is_file():
        freeze = json.loads(fp.read_text(encoding="utf-8"))
        if (freeze.get("git_sha") or "").lower() != local.lower():
            add(
                "证据层 metadata",
                "TESTNET_STAGING_FREEZE ACTIVE.git_sha",
                local,
                freeze.get("git_sha", ""),
                "RISK",
                "doc freeze baseline · S5 deployed newer HEAD with override",
            )

    soak_job: dict | None = None
    soak_dir = ROOT / "evidence/P2FC_SOAK_72H_STAGING"
    for jd in sorted(soak_dir.glob("job-*/job.json")):
        soak_job = json.loads(jd.read_text(encoding="utf-8"))
    if soak_job:
        exp = soak_job.get("expect_git_sha", "")
        if exp.lower() != local.lower():
            add("证据层 metadata", "soak job expect_git_sha", local, exp, "RISK")
        prev = soak_job.get("metadata_baseline_previous_expect_git_sha")
        if prev and prev.lower() != local.lower() and exp.lower() == local.lower():
            risks.append(
                {
                    "domain": "证据层 metadata",
                    "item": "soak baseline patched",
                    "local": local,
                    "staging_or_evidence": f"was {prev[:12]}…",
                    "severity": "INFO",
                    "note": soak_job.get("metadata_baseline_updated_at", ""),
                }
            )

    s6_summary = None
    s6 = ROOT / "evidence/GO_phase2_testnet_20260526/local-staging-parity/20260623T160429Z/deep-release-gate-retry/report.json"
    if s6.is_file():
        dg = json.loads(s6.read_text(encoding="utf-8"))
        s6_summary = {
            "expect": dg.get("expect_git_sha"),
            "release": dg.get("release_gate"),
            "g01": next((g["verdict"] for g in dg.get("gates", []) if g["id"] == "G01_API_WEB_SHA"), None),
            "g02": next((g["verdict"] for g in dg.get("gates", []) if g["id"] == "G02_META_CONTRACT"), None),
        }
        if (dg.get("expect_git_sha") or "").lower() != local.lower():
            add("commit SHA", "S6 expect vs current HEAD", dg.get("expect_git_sha", ""), local, "DIFF")

    dirty, key_dirty = dirty_deploy_paths()
    if dirty:
        add(
            "工作区",
            "deploy-path 未提交变更",
            f"clean @ {local[:12]}…",
            f"{len(dirty)} paths",
            "RISK",
            "staging mirrors committed tree only",
        )
        for ln in key_dirty[:6]:
            risks.append(
                {
                    "domain": "工作区",
                    "item": "key API dirty file",
                    "local": ln.strip(),
                    "staging_or_evidence": "not deployed",
                    "severity": "RISK",
                }
            )

    if str(live.get("api_meta")) not in ("200", 200):
        add("运行时可用性", "GET /meta", "200", str(live.get("api_meta")), "RISK", "stability · not version drift")
    if str(live.get("web_meta")) not in ("200", 200):
        add("运行时可用性", "GET web /meta", "200", str(live.get("web_meta")), "RISK")
    if live.get("api_health") != 200:
        add("运行时可用性", "GET /health", "200", str(live.get("api_health")), "DIFF")

    version_fork = any(f["domain"] == "commit/build SHA" and f["severity"] == "DIFF" for f in findings)
    evidence_lag = any("证据层" in r.get("domain", "") for r in findings + risks)
    avail_diff = any(r.get("domain") == "运行时可用性" for r in findings + risks)

    report = {
        "schema": "staging_local_full_diff.v1",
        "stamp_utc": stamp,
        "local_HEAD": local,
        "live_probes": live,
        "staging_git_sha": {"meta_build": build_sha, "meta": api_sha, "web_meta": web_sha},
        "s6_deep_gate": s6_summary,
        "freeze_ACTIVE_git_sha": freeze.get("git_sha"),
        "soak_expect_git_sha": soak_job.get("expect_git_sha") if soak_job else None,
        "soak_metadata_patched_at": soak_job.get("metadata_baseline_updated_at") if soak_job else None,
        "dirty_deploy_path_count": len(dirty),
        "diff_count": len(findings),
        "risk_count": len(risks),
        "version_fork": version_fork,
        "evidence_lag": evidence_lag,
        "runtime_availability_diff": avail_diff,
        "findings": findings,
        "risks": risks,
    }
    (out_dir / "full-diff.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print("TT_STAGING_LOCAL_FULL_DIFF: START")
    summary = {k: report[k] for k in [
        "local_HEAD", "staging_git_sha", "live_probes", "s6_deep_gate",
        "freeze_ACTIVE_git_sha", "soak_expect_git_sha", "soak_metadata_patched_at",
        "dirty_deploy_path_count", "diff_count", "risk_count", "version_fork",
        "evidence_lag", "runtime_availability_diff",
    ]}
    print(json.dumps(summary, indent=2))
    print("---FINDINGS---")
    for f in findings:
        print(f"{f['severity']}|{f['domain']}|{f['item']}")
    print("---RISKS (top 10)---")
    for r in risks[:10]:
        print(f"{r['severity']}|{r['domain']}|{r['item']}|{r.get('note','')[:70]}")
    if not version_fork and build_sha.lower() == local.lower():
        print("TT_STAGING_LOCAL_FULL_DIFF: VERSION_ALIGNED")
    else:
        print("TT_STAGING_LOCAL_FULL_DIFF: VERSION_FORK")
    print(f"evidence={out_dir / 'full-diff.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
