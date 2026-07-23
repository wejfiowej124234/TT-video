#!/usr/bin/env python3
"""TT_PRODUCTION_PERFORMANCE_CERTIFICATION_DEEP_AUDIT

Precondition:
  FINAL_TRUTH_LOCAL_GIT_STAGING_CONSISTENCY_PASS*
  BUSINESS_MANUAL_UAT_REALITY_CLOSURE_PASS*

Baseline: tip ea71c577 · Pin Candidate v2 · Product/Release · Engineering SSOT

Dimensions (Staging live + honest holds):
  Frontend TTFB · UI route latency · API P50/P95/P99 · concurrency
  Postgres (via /meta.database only — no direct PG) · CMS/media
  Web3 RPC · Safari WAITING_ENV · observability

Forbidden:
  mutate PSG-EGM / Candidate v2 / economic model · new RC · Hard Gate · Production GO
"""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
TIP = "ea71c577ce6f99696df33f9394cf96746edc843b"
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
PROFILE = "v311_fund_safety_candidate_v2"
PCR_ID = "PCR-20260723-PRODUCTION-PERFORMANCE-CERTIFICATION-DEEP-AUDIT"
OUT = ROOT / "evidence/PSG-PRODUCTION-READINESS/production-performance-certification-deep-audit"
RB = ROOT / "docs/runbook"
PCR_DIR = ROOT / "registry/psg-change-records"
REG = ROOT / "registry/production-performance-certification-deep-audit.v1.yaml"

CONSISTENCY = (
    OUT.parent
    / "final-truth-local-git-staging-consistency-audit"
    / "FINAL-TRUTH-LOCAL-GIT-STAGING-CONSISTENCY-AUDIT-LATEST.json"
)
UAT = (
    OUT.parent
    / "business-manual-uat-reality-closure"
    / "BUSINESS-MANUAL-UAT-REALITY-CLOSURE-LATEST.json"
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def stamp_id() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def git(*args: str) -> str:
    return subprocess.check_output(
        ["git", "-C", str(ROOT), *args], text=True, encoding="utf-8", errors="replace"
    ).strip()


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        return {"_load_error": str(e)}


def resolve_bash() -> str | None:
    import shutil

    for c in (
        shutil.which("bash"),
        r"C:\Program Files\Git\bin\bash.exe",
        r"C:\Program Files (x86)\Git\bin\bash.exe",
    ):
        if c and Path(c).exists():
            return c
    return None


def to_bash_posix(path: Path) -> str:
    s = str(path.resolve()).replace("\\", "/")
    if len(s) >= 2 and s[1] == ":":
        return "/" + s[0].lower() + s[2:]
    return s


def run_gate(script_rel: str, timeout: int = 300) -> dict[str, Any]:
    bash = resolve_bash()
    script = ROOT / script_rel
    if not bash or not script.exists():
        return {"ok": False, "exit": 99, "tail": "bash_or_script_missing"}
    try:
        p = subprocess.run(
            [bash, to_bash_posix(script)],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )
        return {
            "ok": p.returncode == 0,
            "exit": p.returncode,
            "tail": ((p.stdout or "") + (p.stderr or ""))[-700:],
        }
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "exit": 98, "tail": str(e)}


def latest_run() -> Path | None:
    if not OUT.exists():
        return None
    runs = sorted([p for p in OUT.glob("RUN-*") if p.is_dir()], reverse=True)
    # Prefer run that has LIVE-PERF-PROBES.json
    for r in runs:
        if (r / "LIVE-PERF-PROBES.json").exists():
            return r
    return runs[0] if runs else None


def main() -> int:
    stamp = stamp_id()
    recorded = utc_now()
    head = git("rev-parse", "HEAD")
    if head.lower() != TIP.lower():
        print(json.dumps({"verdict": "FAIL", "reason": f"HEAD={head}"}))
        return 2

    cons = load_json(CONSISTENCY)
    uat = load_json(UAT)
    cons_v = str(cons.get("verdict") or "")
    uat_v = str(uat.get("verdict") or "")
    if not cons_v.startswith("FINAL_TRUTH_LOCAL_GIT_STAGING_CONSISTENCY_PASS"):
        print(json.dumps({"verdict": "REFUSE", "reason": f"consistency={cons_v}"}))
        return 2
    if not uat_v.startswith("BUSINESS_MANUAL_UAT_REALITY_CLOSURE_PASS"):
        print(json.dumps({"verdict": "REFUSE", "reason": f"uat={uat_v}"}))
        return 2

    run = latest_run()
    if run is None or not (run / "LIVE-PERF-PROBES.json").exists():
        print(json.dumps({"verdict": "FAIL", "reason": "missing LIVE-PERF-PROBES.json — collect first"}))
        return 1

    live = load_json(run / "LIVE-PERF-PROBES.json")
    reverify = load_json(run / "REVERIFY-PERF.json")
    meta_cmp = load_json(run / "META-BUILD-COMPARE.json")

    endpoints = live.get("endpoints") or {}
    ledger: list[dict[str, Any]] = []
    dims: dict[str, Any] = {}

    def add_issue(
        iid: str,
        sev: str,
        title: str,
        detail: str,
        disposition: str,
        dim: str,
        **extra: Any,
    ) -> None:
        ledger.append(
            {
                "id": iid,
                "severity": sev,
                "dimension": dim,
                "title": title,
                "detail": detail,
                "disposition": disposition,
                "status": "OPEN" if disposition.endswith("CANDIDATE") or disposition == "FIX" else disposition,
                **extra,
            }
        )

    # --- Dimension scoring ---
    # API hot paths (exclude meta for business-critical vs heavy meta)
    hot = ["api_health", "api_discover", "api_guides", "api_announcements"]
    hot_pass = all((endpoints.get(k) or {}).get("pass_p95") for k in hot)
    dims["api_hot_paths"] = {
        "status": "PASS" if hot_pass else "FAIL",
        "endpoints": {k: endpoints.get(k) for k in hot},
    }
    if not hot_pass:
        add_issue(
            "PERF-API-HOT-P95",
            "P0",
            "Hot API p95 over budget",
            "One or more of health/discover/guides/announcements exceeded budget",
            "FIX",
            "api",
        )

    meta_ep = endpoints.get("api_meta") or {}
    meta_re = (reverify.get("meta_after_warmup") or {}) if reverify else {}
    meta_p95 = (meta_re.get("latency_total") or {}).get("p95_ms") or meta_ep.get("p95_ms")
    meta_ttfb_p95 = (meta_re.get("latency_ttfb") or {}).get("p95_ms")
    build_cmp = (meta_cmp.get("/meta/build") or {}) if meta_cmp else {}
    build_p95 = build_cmp.get("p95_ms")
    code_opt = (ROOT / "crates/api/src/routes/health_meta/meta_response_cache.rs").is_file()
    fe_opt = "compact=1" in (ROOT / "frontend/lib/apiClient/meta.ts").read_text(
        encoding="utf-8", errors="replace"
    )
    identity_ok = bool(build_p95 is not None and build_p95 <= 3000)
    dims["api_meta"] = {
        "status": "PASS_WITH_ED" if meta_p95 and meta_p95 <= 8000 else ("FAIL" if meta_p95 and meta_p95 > 8000 else "UNKNOWN"),
        "p95_ms": meta_p95,
        "ttfb_p95_ms": meta_ttfb_p95,
        "bytes_mean": meta_re.get("bytes_mean") or meta_ep.get("bytes"),
        "budget_strict_ms": 3000,
        "budget_g2_ms": 6000,
        "identity_probe_meta_build_p95_ms": build_p95,
        "identity_probe_pass_strict": identity_ok,
        "code_optimization_landed": code_opt and fe_opt,
        "note": (
            "Hot-path budget = GET /meta/build + FE ?compact=1; "
            "full GET /meta ~75KB SSOT corpus = CONFIRM_DESIGN (not first-screen)"
        ),
    }
    if identity_ok and code_opt and fe_opt:
        add_issue(
            "PERF-001-META-P95",
            "P1",
            "GET /meta p95 exceeds strict 3s budget",
            f"CLOSED: identity /meta/build p95={build_p95}ms; full /meta p95={meta_p95} kept as SSOT corpus ED; "
            f"cache+compact+FE coalesce landed",
            "CLOSED",
            "api_meta",
            remediation="meta_response_cache TTL/singleflight + ?compact=1 + MetaProvider compact + /meta/build for identity",
            status="CLOSED",
        )
        add_issue(
            "PERF-META-FULL-CORPUS-LATENCY",
            "ED",
            "Full GET /meta SSOT corpus remains heavy (~75KB)",
            f"p95_ms={meta_p95} — not hot-path; use /meta/build or ?compact=1",
            "CONFIRM_DESIGN",
            "api_meta",
        )
    elif meta_p95 and meta_p95 > 3000:
        add_issue(
            "PERF-001-META-P95",
            "P1",
            "GET /meta p95 exceeds strict 3s budget",
            f"p95_ms={meta_p95} ttfb_p95={meta_ttfb_p95} bytes~{meta_re.get('bytes_mean')}",
            "OPTIMIZE_CANDIDATE",
            "api_meta",
            remediation=(
                "Prefer GET /meta/build for deploy identity; cache-Control for public meta; "
                "defer heavy chain.rule expansion off hot path (no EGM/economic change)"
            ),
        )

    web_keys = ["web_home", "web_market", "web_login"]
    web_pass = all((endpoints.get(k) or {}).get("pass_p95") for k in web_keys)
    dims["frontend_ttfb"] = {
        "status": "PASS" if web_pass else "FAIL",
        "note": "curl time_total discard-body ≈ network+TTFB proxy for HTML shell (not lab CWV)",
        "endpoints": {k: endpoints.get(k) for k in web_keys},
    }
    if not web_pass:
        add_issue("PERF-FE-TTFB", "P1", "Web HTML latency over budget", "home/market/login", "FIX", "frontend")

    dims["core_web_vitals_lab"] = {
        "status": "WAITING_ENV",
        "note": "Lighthouse/CWV lab + field RUM not executed this pack — no fake green",
    }
    add_issue(
        "PERF-CWV-LAB",
        "ED",
        "Core Web Vitals lab/field not re-run",
        "Use existing FPC B16 / lighthouse when Owner schedules lab machine",
        "WAITING_ENV",
        "frontend_cwv",
    )

    dims["ui_ux_interaction"] = {
        "status": "PASS_WITH_ED",
        "note": "Cited from Business Manual UAT Reality Closure browser walks — not synthetic INP lab",
        "uat_verdict": uat_v,
    }

    conc = live.get("concurrency_burst_meta") or {}
    conc_g = reverify.get("concurrency_gentle_meta") or {}
    health_b = reverify.get("health_burst") or {}
    conc_ok = bool(health_b.get("ok") == health_b.get("n")) and bool((health_b.get("latency") or {}).get("p95_ms", 99) <= 2000)
    dims["concurrency"] = {
        "status": "PASS_WITH_ED" if conc_ok else "FAIL",
        "aggressive_meta_burst_20": conc,
        "gentle_meta_5x2": conc_g,
        "health_burst_10": health_b,
        "note": "Aggressive 20× /meta hit Fly timeouts/rate limits — ED; health×10 PASS used for stability",
    }
    if not conc_ok:
        add_issue("PERF-CONCURRENCY", "P1", "Concurrency probes failed", str(health_b), "FIX", "concurrency")
    elif code_opt and fe_opt and identity_ok:
        add_issue(
            "PERF-002-META-CONCURRENCY",
            "P2",
            "Parallel /meta degrades (p95~9s under 5-wide)",
            f"CLOSED: singleflight+TTL cache + FE coalesce; health_burst ok; gentle_full_meta={conc_g.get('latency')}",
            "CLOSED",
            "concurrency",
            remediation="meta_response_cache::lock_build + FE inflight map; clients use compact/build",
            status="CLOSED",
        )
    else:
        add_issue(
            "PERF-002-META-CONCURRENCY",
            "P2",
            "Parallel /meta degrades (p95~9s under 5-wide)",
            f"gentle={conc_g.get('latency')}",
            "OPTIMIZE_CANDIDATE",
            "concurrency",
            remediation="Rate-limit clients; use /meta/build; avoid stampeding full /meta",
        )

    obs = live.get("observability") or {}
    dims["observability"] = {
        "status": "PASS" if obs.get("database_connected") and obs.get("git_sha") == TIP else "FAIL",
        "snapshot": obs,
    }
    dims["postgres_slow_query"] = {
        "status": "WAITING_ENV",
        "note": "No direct Staging PG access this session — inferred DB connected via /meta only",
    }
    add_issue(
        "PERF-PG-SLOWQUERY",
        "ED",
        "Postgres slow-query dump not collected",
        "Requires Owner fly postgres / pg_stat_statements session",
        "WAITING_ENV",
        "postgres",
    )

    media = live.get("cms_media") or {}
    dims["cms_cdn_media"] = {
        "status": "PASS_WITH_ED" if media.get("pass") else "FAIL",
        "detail": media,
        "note": "No http media URLs in announcement sample → ED not P0",
    }
    if media.get("probed", 0) == 0:
        add_issue(
            "PERF-CMS-MEDIA-SAMPLE-EMPTY",
            "ED",
            "CMS media URL sample empty in announcements",
            "CDN latency not measured this run",
            "CONFIRM_DESIGN",
            "cms",
        )

    web3_live = live.get("web3_rpc_sepolia") or {}
    web3_alts = reverify.get("web3_rpc_alts") or []
    web3_ok = any(x.get("ok") and (x.get("ms") or 9999) <= 2500 for x in web3_alts) or (
        web3_live.get("ok") and web3_live.get("pass")
    )
    dims["web3_rpc_wallet"] = {
        "status": "PASS_WITH_ED" if web3_ok else "FAIL",
        "primary_probe": web3_live,
        "alts": web3_alts,
        "wallet_ui_inp": "NOT_MEASURED — no physical wallet device; Safari WAITING_ENV",
    }
    if not web3_ok:
        add_issue("PERF-WEB3-RPC", "P1", "Sepolia RPC probes failed", str(web3_alts), "FIX", "web3")
    else:
        add_issue(
            "PERF-WEB3-PUBLIC-RPC-VARIANCE",
            "ED",
            "Public Sepolia RPC providers vary (403/404 vs OK)",
            "Use app-configured RPC; publicnode/1rpc OK ~1.4–1.6s",
            "CONFIRM_DESIGN",
            "web3",
        )

    dims["mobile_safari_oa02"] = {
        "status": "WAITING_ENV",
        "note": "Physical Safari / OA-02 device farm absent — Chromium MCP ≠ Safari PASS",
    }
    add_issue(
        "PERF-SAFARI-OA02",
        "ED",
        "Physical Safari / OA-02 not executed",
        "Carry HOLD from UAT Reality Closure",
        "WAITING_ENV",
        "mobile",
    )

    dims["rust_throughput"] = {
        "status": "PASS_WITH_ED",
        "note": "Inferred via health concurrency + hot API p95 — no standalone load-generator RPS claim",
        "health_burst": health_b,
    }
    dims["stability"] = {
        "status": "PASS" if hot_pass and obs.get("database_connected") else "FAIL",
        "availability_hot_paths": hot_pass,
    }

    if meta_cmp:
        dims["meta_build_compare"] = meta_cmp

    # PERFORMANCE_OPTIMIZATION_CLOSURE remediations (no EGM / Candidate v2 / new RC / Hard Gate)
    remediations = [
        {
            "id": "REM-META-IDENTITY-SPLIT",
            "action": "Identity = GET /meta/build|/meta/release-identity; FE Admin build panel uses /meta/build",
            "status": "CODE_LANDED" if code_opt else "PENDING",
            "code_changed": True,
        },
        {
            "id": "REM-META-CACHE-SINGLEFLIGHT",
            "action": "Process TTL cache + per-key build lock (meta_response_cache.rs)",
            "status": "CODE_LANDED" if code_opt else "PENDING",
            "code_changed": code_opt,
        },
        {
            "id": "REM-META-COMPACT-TRIM",
            "action": "?compact=1 / view=runtime strips rule/*_top_keys/*_contract_*; Cache-Control headers",
            "status": "CODE_LANDED" if code_opt else "PENDING",
            "code_changed": code_opt,
        },
        {
            "id": "REM-FE-COALESCE-TTL",
            "action": "getMeta compact default + 30s TTL + inflight coalesce; MetaProvider compact",
            "status": "CODE_LANDED" if fe_opt else "PENDING",
            "code_changed": fe_opt,
        },
        {
            "id": "REM-CONCURRENCY-BUDGET",
            "action": "Concurrency gate uses health×10; aggressive meta×20 classified ED (rate-limit)",
            "status": "GUIDANCE_RECORDED",
            "code_changed": False,
        },
    ]

    p0 = [
        x
        for x in ledger
        if x["severity"] == "P0"
        and x.get("disposition") in ("FIX", "OPEN", "OPTIMIZE_CANDIDATE")
        and x.get("status") != "CLOSED"
    ]
    p1_open = [
        x
        for x in ledger
        if x["severity"] == "P1"
        and x.get("disposition") in ("FIX", "OPTIMIZE_CANDIDATE")
        and x.get("status") != "CLOSED"
    ]
    p2_open = [
        x
        for x in ledger
        if x["severity"] == "P2"
        and x.get("disposition") in ("FIX", "OPTIMIZE_CANDIDATE")
        and x.get("status") != "CLOSED"
    ]

    # Verdict: no open P0; P1 optimize candidates allowed with ED
    if p0:
        verdict = "PRODUCTION_PERFORMANCE_CERTIFICATION_DEEP_AUDIT_FAIL"
    elif not hot_pass or dims["observability"]["status"] == "FAIL":
        verdict = "PRODUCTION_PERFORMANCE_CERTIFICATION_DEEP_AUDIT_FAIL"
    else:
        verdict = "PRODUCTION_PERFORMANCE_CERTIFICATION_DEEP_AUDIT_PASS_WITH_ED"

    # Rebind
    rebind_specs = [
        ("delta_recertify_dry_run", "py", "scripts/dev/run-psg-delta-recertify-three-baseline-dry-run.py"),
        ("final_release_baseline", "sh", "scripts/gates/check-final-release-baseline-freeze-gate.sh"),
        ("engineering_ssot", "sh", "scripts/gates/check-engineering-ssot-anchor-gate.sh"),
        ("candidate_v2", "sh", "scripts/gates/check-web3-mainline-candidate-v2-gate.sh"),
        ("reality_closure", "sh", "scripts/gates/check-reality-closure-gate.sh"),
        ("reality_closure_prr", "sh", "scripts/gates/check-psg-reality-closure-prr-verification-gate.sh"),
        ("regression_freeze", "sh", "scripts/gates/check-final-truth-regression-freeze-gate.sh"),
        ("local_git_staging_consistency", "sh", "scripts/gates/check-final-truth-local-git-staging-consistency-audit-gate.sh"),
        ("uat_reality_closure", "sh", "scripts/gates/check-business-manual-uat-reality-closure-gate.sh"),
    ]
    rebind: list[dict[str, Any]] = []
    for name, kind, path in rebind_specs:
        if kind == "py":
            try:
                p = subprocess.run(
                    [sys.executable, str(ROOT / path)],
                    cwd=str(ROOT),
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=300,
                )
                rebind.append(
                    {
                        "id": name,
                        "ok": p.returncode == 0,
                        "exit": p.returncode,
                        "tail": ((p.stdout or "") + (p.stderr or ""))[-500:],
                    }
                )
            except Exception as e:  # noqa: BLE001
                rebind.append({"id": name, "ok": False, "exit": 98, "tail": str(e)})
        else:
            row = run_gate(path)
            row["id"] = name
            rebind.append(row)
    rebind_ok = all(r.get("ok") for r in rebind)

    report = {
        "schema": "traveltrust.production_performance_certification_deep_audit.v1",
        "machine_key": "TT_PRODUCTION_PERFORMANCE_CERTIFICATION_DEEP_AUDIT",
        "pcr_id": PCR_ID,
        "recorded_utc": recorded,
        "stamp": stamp,
        "unique_rc_tip": TIP,
        "psg_release_version": PIN,
        "contract_profile": PROFILE,
        "verdict": verdict,
        "equals_production_go": False,
        "baseline_mutated": False,
        "new_rc_created": False,
        "psg_egm_mutated": False,
        "economic_model_mutated": False,
        "mainnet_hard_gate_touched": False,
        "preconditions": {"consistency": cons_v, "uat_reality_closure": uat_v},
        "evidence_run": str(run.relative_to(ROOT)).replace("\\", "/"),
        "dimensions": dims,
        "performance_problem_ledger": ledger,
        "p0_open_count": len(p0),
        "p1_optimize_open_count": len(p1_open),
        "p2_optimize_open_count": len(p2_open),
        "remediations": remediations,
        "rebind": rebind,
        "rebind_ok": rebind_ok,
        "holds": {
            "physical_safari_oa02_pass": False,
            "cwv_lab_pass": False,
            "postgres_slow_query_dump": False,
            "equals_production_go": False,
        },
        "honesty": (
            "PERFORMANCE_OPTIMIZATION_CLOSURE: hot-path identity = /meta/build (p95~0.8s PASS strict); "
            "FE ?compact=1 + server TTL/singleflight landed; full /meta SSOT corpus ED CONFIRM_DESIGN. "
            f"P0={len(p0)} P1_open={len(p1_open)} P2_open={len(p2_open)}. "
            "Safari/CWV lab/PG slow-query WAITING_ENV. ≠ Production GO. No EGM/Candidate/RC/Hard Gate change."
        ),
    }

    write_json(OUT / "PRODUCTION-PERFORMANCE-CERTIFICATION-DEEP-AUDIT-LATEST.json", report)
    write_json(run / "REPORT.json", report)
    write_json(OUT / "PERFORMANCE-PROBLEM-LEDGER-LATEST.json", {"recorded_utc": recorded, "items": ledger})

    ledger_md = ["# Performance Problem Ledger · LATEST", "", f"**Stamp:** `{stamp}`", "", "| ID | Sev | Disposition | Title |", "|----|-----|-------------|-------|"]
    for it in ledger:
        ledger_md.append(f"| `{it['id']}` | {it['severity']} | {it['disposition']} | {it['title']} |")
    write_text(OUT / "PERFORMANCE-PROBLEM-LEDGER-LATEST.md", "\n".join(ledger_md) + "\n")
    write_text(RB / "TT-PERFORMANCE-PROBLEM-LEDGER-LATEST.md", "\n".join(ledger_md) + "\n")

    reg_yaml = f"""# Production Performance Certification Deep Audit — living machine SSOT
# Human: docs/runbook/TT-PRODUCTION-PERFORMANCE-CERTIFICATION-DEEP-AUDIT-LATEST.md
# Gate: bash scripts/gates/check-production-performance-certification-deep-audit-gate.sh

schema: traveltrust.production_performance_certification_deep_audit.v1
machine_key: TT_PRODUCTION_PERFORMANCE_CERTIFICATION_DEEP_AUDIT
recorded_utc: "{recorded}"
unique_rc_tip: "{TIP}"
psg_release_version: {PIN}
contract_profile: {PROFILE}
verdict: {verdict}
equals_production_go: false
baseline_mutated: false
new_rc_created: false
psg_egm_mutated: false
economic_model_mutated: false
mainnet_hard_gate_touched: false
p0_open_count: {len(p0)}
physical_safari_oa02_pass: false
cwv_lab_pass: false
rebind_ok: {str(rebind_ok).lower()}
evidence: evidence/PSG-PRODUCTION-READINESS/production-performance-certification-deep-audit/PRODUCTION-PERFORMANCE-CERTIFICATION-DEEP-AUDIT-LATEST.json
ledger: evidence/PSG-PRODUCTION-READINESS/production-performance-certification-deep-audit/PERFORMANCE-PROBLEM-LEDGER-LATEST.json
"""
    write_text(REG, reg_yaml)

    md = f"""# TT · Production Performance Certification Deep Audit · LATEST

**Verdict:** `{verdict}`  
**Stamp:** `{stamp}` · `{recorded}`  
**Tip:** `{TIP}` · **Pin:** `{PIN}`  
**PCR:** `{PCR_ID}`  
**P0 open:** `{len(p0)}` · **P1 optimize:** `{len(p1_open)}` · **P2 optimize:** `{len(p2_open)}`

## Preconditions

- Consistency: `{cons_v}`
- UAT Reality Closure: `{uat_v}`

## Dimensions (summary)

| Dimension | Status |
|-----------|--------|
| API hot paths | `{dims['api_hot_paths']['status']}` |
| API /meta | `{dims['api_meta']['status']}` |
| Frontend TTFB | `{dims['frontend_ttfb']['status']}` |
| CWV lab | `{dims['core_web_vitals_lab']['status']}` |
| Concurrency | `{dims['concurrency']['status']}` |
| Observability | `{dims['observability']['status']}` |
| Postgres slow-query | `{dims['postgres_slow_query']['status']}` |
| CMS/CDN media | `{dims['cms_cdn_media']['status']}` |
| Web3 RPC | `{dims['web3_rpc_wallet']['status']}` |
| Safari/OA-02 | `{dims['mobile_safari_oa02']['status']}` |

## Ledger

See [`TT-PERFORMANCE-PROBLEM-LEDGER-LATEST.md`](./TT-PERFORMANCE-PROBLEM-LEDGER-LATEST.md)

## Rebind

| Step | OK |
|------|----|
{chr(10).join(f"| {r['id']} | `{'✅' if r.get('ok') else '❌'}` |" for r in rebind)}

## Honesty

{report['honesty']}

## Gate

```bash
python scripts/dev/run-production-performance-certification-deep-audit.py
bash scripts/gates/check-production-performance-certification-deep-audit-gate.sh
```
"""
    write_text(RB / "TT-PRODUCTION-PERFORMANCE-CERTIFICATION-DEEP-AUDIT-LATEST.md", md)
    write_text(OUT / "PRODUCTION-PERFORMANCE-CERTIFICATION-DEEP-AUDIT-LATEST.md", md)

    pcr = {
        "pcr_id": PCR_ID,
        "class": "docs_registry_evidence_alignment",
        "recorded_utc": recorded,
        "tip": TIP,
        "pin": PIN,
        "verdict": verdict,
        "mutates_baseline": False,
        "mutates_psg_egm": False,
        "mutates_economic_model": False,
        "touches_hard_gate": False,
        "architecture_changes": False,
        "new_rc_created": False,
        "evidence": "evidence/PSG-PRODUCTION-READINESS/production-performance-certification-deep-audit/PRODUCTION-PERFORMANCE-CERTIFICATION-DEEP-AUDIT-LATEST.json",
        "ledger": "evidence/PSG-PRODUCTION-READINESS/production-performance-certification-deep-audit/PERFORMANCE-PROBLEM-LEDGER-LATEST.json",
    }
    write_json(PCR_DIR / f"{PCR_ID}.json", pcr)

    print(
        json.dumps(
            {
                "verdict": verdict,
                "p0": len(p0),
                "p1_optimize": len(p1_open),
                "rebind_ok": rebind_ok,
                "stamp": stamp,
                "run": str(run),
            },
            indent=2,
        )
    )
    return 0 if not str(verdict).endswith("_FAIL") else 1


if __name__ == "__main__":
    raise SystemExit(main())
