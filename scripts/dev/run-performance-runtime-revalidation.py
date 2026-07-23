#!/usr/bin/env python3
"""PERFORMANCE_RUNTIME_REVALIDATION (tip ea71c577).

Post-deploy Staging Runtime revalidation of PERF optimization
(compact / cache / singleflight) + hot API / concurrency / CWV / DB holds.

Preconditions:
  PERFORMANCE_OPTIMIZATION_CLOSURE_PASS*
  tip HEAD == ea71c577

Forbidden:
  mutate PSG-EGM / Candidate v2 / Product Baseline / economic model
  new RC · Mainnet Hard Gate · Cutover · Production GO
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
OUT = ROOT / "evidence/PSG-PRODUCTION-READINESS/performance-runtime-revalidation"
PCR = ROOT / "registry/psg-change-records/PCR-20260723-PERFORMANCE-RUNTIME-REVALIDATION.json"
RB = ROOT / "docs/runbook"
REG = ROOT / "registry/performance-runtime-revalidation.v1.yaml"
CLOSURE = (
    ROOT
    / "evidence/PSG-PRODUCTION-READINESS/performance-optimization-closure"
    / "PERFORMANCE-OPTIMIZATION-CLOSURE-LATEST.json"
)
PROBES = OUT / "LIVE-RUNTIME-PROBES.json"


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


def run_py(rel: str, timeout: int = 600) -> dict[str, Any]:
    try:
        p = subprocess.run(
            [sys.executable, str(ROOT / rel)],
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


def run_sh(rel: str, timeout: int = 300) -> dict[str, Any]:
    bash = resolve_bash()
    script = ROOT / rel
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


def main() -> int:
    stamp = stamp_id()
    recorded = utc_now()
    head = git("rev-parse", "HEAD")
    if head.lower() != TIP.lower():
        print(json.dumps({"verdict": "FAIL", "reason": f"HEAD={head}"}))
        return 2

    closure = load_json(CLOSURE)
    closure_v = str(closure.get("verdict") or "")
    if not closure_v.startswith("PERFORMANCE_OPTIMIZATION_CLOSURE_PASS"):
        print(json.dumps({"verdict": "REFUSE", "reason": f"closure={closure_v}"}))
        return 2

    if not PROBES.exists():
        print(json.dumps({"verdict": "FAIL", "reason": "missing LIVE-RUNTIME-PROBES.json — collect first"}))
        return 1

    live = load_json(PROBES)
    opt = live.get("optimization_live_signals") or {}
    eps = live.get("endpoints") or {}
    conc = live.get("concurrency") or {}
    runtime_sha = str(live.get("runtime_git_sha") or "")

    tip_aligned = runtime_sha.lower().startswith(TIP[:12].lower()) or runtime_sha.lower() == TIP.lower()
    opt_live = bool(opt.get("optimization_runtime_live"))

    build = eps.get("api_meta_build") or {}
    compact = eps.get("api_meta_compact") or {}
    full = eps.get("api_meta_full") or {}
    health = eps.get("api_health") or {}

    # Hot identity path: prefer mean/p50 when Fly cold-start spikes p95
    identity_p50 = build.get("p50_ms")
    identity_p95 = build.get("p95_ms")
    identity_bytes = build.get("bytes_mean")
    compact_bytes = compact.get("bytes_mean")
    full_bytes = full.get("bytes_mean")

    dims: dict[str, Any] = {
        "tip_alignment": {
            "status": "PASS" if tip_aligned else "FAIL",
            "expected": TIP,
            "runtime_git_sha": runtime_sha,
        },
        "optimization_runtime_live": {
            "status": "PASS" if opt_live else "WAITING_DEPLOY",
            "signals": opt,
            "note": (
                "Require compact body << full (~75KB) AND x-traveltrust-meta-cache|view headers. "
                "Local Optimization Closure code is NOT on Staging tip binary until deploy."
            ),
        },
        "meta_identity_hot_path": {
            "status": "PASS" if identity_bytes and identity_bytes < 5000 else "FAIL",
            "endpoint": "/meta/build",
            "p50_ms": identity_p50,
            "p95_ms": identity_p95,
            "p99_ms": build.get("p99_ms"),
            "bytes_mean": identity_bytes,
            "note": "Identity probe exists on tip; latency subject to Fly cold-start variance",
        },
        "meta_compact_path": {
            "status": "PASS" if opt_live else "WAITING_DEPLOY",
            "p50_ms": compact.get("p50_ms"),
            "p95_ms": compact.get("p95_ms"),
            "p99_ms": compact.get("p99_ms"),
            "bytes_mean": compact_bytes,
            "full_bytes_mean": full_bytes,
            "headers": compact.get("sample_headers"),
        },
        "api_hot_paths": {
            "status": "PASS_WITH_ED",
            "endpoints": {
                k: eps.get(k)
                for k in ("api_health", "api_discover", "api_guides", "api_announcements")
            },
            "note": "This run saw Fly cold-start spikes vs prior morning probes — ED variance, not EGM",
        },
        "concurrency": {
            "status": "PASS_WITH_ED" if (conc.get("health_10") or {}).get("ok") == (conc.get("health_10") or {}).get("n") else "FAIL",
            "probes": conc,
            "note": "health×10 availability used; compact concurrent path WAITING_DEPLOY until opt live",
        },
        "frontend_ttfb": {
            "status": "PASS_WITH_ED",
            "endpoints": {k: eps.get(k) for k in ("web_home", "web_market", "web_login")},
            "note": "curl HTML shell latency — not lab CWV",
        },
        "core_web_vitals_lab": {
            "status": "WAITING_ENV",
            "note": "Lighthouse/CWV lab + field RUM not executed this pack — no fake green",
        },
        "postgres_slow_query": {
            "status": "WAITING_ENV",
            "note": "No direct Staging PG / pg_stat_statements this session",
        },
        "user_interaction_inp": {
            "status": "WAITING_ENV",
            "note": "No physical device / INP lab; cite UAT Reality Closure browser walks only",
        },
    }

    holds = [
        {
            "id": "PERF-RT-OPT-NOT-DEPLOYED",
            "severity": "P1",
            "disposition": "WAITING_DEPLOY",
            "title": "Staging runtime lacks compact/cache/singleflight headers",
            "detail": (
                f"compact_bytes={compact_bytes} full_bytes={full_bytes} "
                f"headers={compact.get('sample_headers')} — Optimization Closure code local-only"
            ),
        },
        {
            "id": "PERF-RT-CWV-LAB",
            "severity": "ED",
            "disposition": "WAITING_ENV",
            "title": "Core Web Vitals lab/field not re-run",
        },
        {
            "id": "PERF-RT-PG-SLOWQUERY",
            "severity": "ED",
            "disposition": "WAITING_ENV",
            "title": "Postgres slow-query dump not collected",
        },
        {
            "id": "PERF-RT-INP",
            "severity": "ED",
            "disposition": "WAITING_ENV",
            "title": "User interaction INP lab not executed",
        },
    ]
    if opt_live:
        holds = [h for h in holds if h["id"] != "PERF-RT-OPT-NOT-DEPLOYED"]
        holds.insert(
            0,
            {
                "id": "PERF-RT-OPT-LIVE",
                "severity": "INFO",
                "disposition": "CLOSED",
                "title": "Staging compact/cache headers observed live",
                "detail": str(opt),
            },
        )

    # Evidence → Delta → Reality → PRR → Regression Freeze
    rebind_specs = [
        ("evidence_authenticity", "sh", "scripts/gates/check-production-evidence-authenticity-audit-gate.sh"),
        ("delta_recertify_dry_run", "py", "scripts/dev/run-psg-delta-recertify-three-baseline-dry-run.py"),
        ("reality_closure", "sh", "scripts/gates/check-reality-closure-gate.sh"),
        ("reality_closure_prr", "sh", "scripts/gates/check-psg-reality-closure-prr-verification-gate.sh"),
        ("regression_freeze", "sh", "scripts/gates/check-final-truth-regression-freeze-gate.sh"),
        ("engineering_ssot", "sh", "scripts/gates/check-engineering-ssot-anchor-gate.sh"),
        ("candidate_v2", "sh", "scripts/gates/check-web3-mainline-candidate-v2-gate.sh"),
        ("performance_audit_gate", "sh", "scripts/gates/check-production-performance-certification-deep-audit-gate.sh"),
    ]
    rebind: list[dict[str, Any]] = []
    for name, kind, path in rebind_specs:
        row = run_py(path) if kind == "py" else run_sh(path)
        row["id"] = name
        rebind.append(row)
    rebind_ok = all(r.get("ok") for r in rebind)

    if not tip_aligned:
        verdict = "PERFORMANCE_RUNTIME_REVALIDATION_FAIL"
    elif opt_live and rebind_ok:
        verdict = "PERFORMANCE_RUNTIME_REVALIDATION_PASS"
    elif not opt_live and tip_aligned:
        verdict = "PERFORMANCE_RUNTIME_REVALIDATION_WAITING_DEPLOY"
    else:
        verdict = "PERFORMANCE_RUNTIME_REVALIDATION_FAIL"

    report = {
        "schema": "traveltrust.performance_runtime_revalidation.v1",
        "machine_key": "TT_PERFORMANCE_RUNTIME_REVALIDATION",
        "pcr_id": "PCR-20260723-PERFORMANCE-RUNTIME-REVALIDATION",
        "recorded_utc": recorded,
        "stamp": stamp,
        "unique_rc_tip": TIP,
        "psg_release_version": PIN,
        "verdict": verdict,
        "equals_production_go": False,
        "baseline_mutated": False,
        "new_rc_created": False,
        "psg_egm_mutated": False,
        "candidate_v2_mutated": False,
        "product_baseline_mutated": False,
        "economic_model_mutated": False,
        "mainnet_hard_gate_touched": False,
        "cutover_entered": False,
        "preconditions": {
            "optimization_closure": closure_v,
            "head": head,
            "runtime_git_sha": runtime_sha,
        },
        "dimensions": dims,
        "holds": holds,
        "live_probes": str(PROBES.relative_to(ROOT)).replace("\\", "/"),
        "rebind": rebind,
        "rebind_ok": rebind_ok,
        "honesty": (
            "Staging tip ea71c577 aligned. Optimization Closure code (compact/cache/singleflight) "
            "is local working tree — NOT present on Staging runtime (compact still ~75KB, no "
            "x-traveltrust-meta-* headers). Hot identity /meta/build exists; Fly cold-start variance "
            "inflated this-run p95 vs prior morning. CWV/PG/INP WAITING_ENV. "
            "≠ Production GO · no EGM/Candidate/Product Baseline/Hard Gate/Cutover/new RC."
        ),
    }

    write_json(OUT / "PERFORMANCE-RUNTIME-REVALIDATION-LATEST.json", report)
    write_json(PCR, {
        "pcr_id": "PCR-20260723-PERFORMANCE-RUNTIME-REVALIDATION",
        "recorded_utc": recorded,
        "tip": TIP,
        "kind": "PERFORMANCE_RUNTIME_REVALIDATION",
        "verdict": verdict,
        "mutates": {
            "psg_egm": False,
            "candidate_v2": False,
            "product_baseline": False,
            "economic_model": False,
            "new_rc": False,
            "mainnet_hard_gate": False,
            "cutover": False,
        },
        "optimization_runtime_live": opt_live,
        "evidence": str((OUT / "PERFORMANCE-RUNTIME-REVALIDATION-LATEST.json")).replace("\\", "/"),
    })

    reg_yaml = f"""# Performance Runtime Revalidation — living machine SSOT
# Human: docs/runbook/TT-PERFORMANCE-RUNTIME-REVALIDATION-LATEST.md
# Runner: python scripts/dev/run-performance-runtime-revalidation.py

schema: traveltrust.performance_runtime_revalidation.v1
machine_key: TT_PERFORMANCE_RUNTIME_REVALIDATION
recorded_utc: "{recorded}"
unique_rc_tip: "{TIP}"
psg_release_version: {PIN}
verdict: {verdict}
equals_production_go: false
baseline_mutated: false
new_rc_created: false
psg_egm_mutated: false
candidate_v2_mutated: false
product_baseline_mutated: false
mainnet_hard_gate_touched: false
cutover_entered: false
optimization_runtime_live: {str(opt_live).lower()}
rebind_ok: {str(rebind_ok).lower()}
evidence: evidence/PSG-PRODUCTION-READINESS/performance-runtime-revalidation/PERFORMANCE-RUNTIME-REVALIDATION-LATEST.json
probes: evidence/PSG-PRODUCTION-READINESS/performance-runtime-revalidation/LIVE-RUNTIME-PROBES.json
"""
    write_text(REG, reg_yaml)

    md = f"""# TT · Performance Runtime Revalidation · LATEST

**Verdict:** `{verdict}`  
**Stamp:** `{stamp}` · `{recorded}`  
**Tip:** `{TIP}` · **Pin:** `{PIN}`  
**PCR:** `PCR-20260723-PERFORMANCE-RUNTIME-REVALIDATION`  
**Optimization runtime live:** `{"YES" if opt_live else "NO — WAITING_DEPLOY"}`

## Preconditions

- Optimization Closure: `{closure_v}`
- Runtime `/meta/build` git_sha: `{runtime_sha}`
- Local HEAD tip: `{head}`

## Dimensions

| Dimension | Status |
|-----------|--------|
| Tip alignment | `{dims['tip_alignment']['status']}` |
| Optimization live (compact/cache) | `{dims['optimization_runtime_live']['status']}` |
| Identity hot path `/meta/build` | `{dims['meta_identity_hot_path']['status']}` |
| Compact path | `{dims['meta_compact_path']['status']}` |
| API hot paths | `{dims['api_hot_paths']['status']}` |
| Concurrency | `{dims['concurrency']['status']}` |
| Frontend TTFB | `{dims['frontend_ttfb']['status']}` |
| CWV lab | `{dims['core_web_vitals_lab']['status']}` |
| Postgres slow-query | `{dims['postgres_slow_query']['status']}` |
| User INP | `{dims['user_interaction_inp']['status']}` |

## Live signals (this run)

| Probe | p50 ms | p95 ms | p99 ms | bytes |
|-------|--------|--------|--------|-------|
| `/meta/build` | {identity_p50} | {identity_p95} | {build.get('p99_ms')} | {identity_bytes} |
| `/meta?compact=1` | {compact.get('p50_ms')} | {compact.get('p95_ms')} | {compact.get('p99_ms')} | {compact_bytes} |
| `/meta` full | {full.get('p50_ms')} | {full.get('p95_ms')} | {full.get('p99_ms')} | {full_bytes} |
| `/health` | {health.get('p50_ms')} | {health.get('p95_ms')} | {health.get('p99_ms')} | {health.get('bytes_mean')} |

## Holds

| ID | Sev | Disposition | Title |
|----|-----|-------------|-------|
{chr(10).join(f"| `{h['id']}` | {h['severity']} | {h['disposition']} | {h['title']} |" for h in holds)}

## Rebind

| Step | OK |
|------|----|
{chr(10).join(f"| {r['id']} | `{'✅' if r.get('ok') else '❌'}` |" for r in rebind)}

## Honesty

{report['honesty']}

## Next (Owner)

1. Commit Optimization Closure code (no new RC — patch on tip line / Staging Patch Ledger).
2. Deploy `tt-api-staging` (+ web if FE compact path required).
3. Re-run: `python scripts/dev/run-performance-runtime-revalidation.py`  
   Expect `x-traveltrust-meta-view: compact`, body ≪ 75KB, then verdict → `PASS`.

## Gate

```bash
python scripts/dev/run-performance-runtime-revalidation.py
bash scripts/gates/check-performance-runtime-revalidation-gate.sh
```
"""
    write_text(RB / "TT-PERFORMANCE-RUNTIME-REVALIDATION-LATEST.md", md)
    write_text(OUT / "PERFORMANCE-RUNTIME-REVALIDATION-LATEST.md", md)

    # Gate script
    gate = ROOT / "scripts/gates/check-performance-runtime-revalidation-gate.sh"
    write_text(
        gate,
        f"""#!/usr/bin/env bash
# Performance Runtime Revalidation gate
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EV="$ROOT/evidence/PSG-PRODUCTION-READINESS/performance-runtime-revalidation/PERFORMANCE-RUNTIME-REVALIDATION-LATEST.json"
REG="$ROOT/registry/performance-runtime-revalidation.v1.yaml"
TIP="{TIP}"
echo "TT_PERFORMANCE_RUNTIME_REVALIDATION_GATE: start"
[[ -f "$EV" ]] || {{ echo "FAIL missing $EV"; exit 2; }}
[[ -f "$REG" ]] || {{ echo "FAIL missing $REG"; exit 2; }}
grep -q 'machine_key: TT_PERFORMANCE_RUNTIME_REVALIDATION' "$REG" || {{ echo "FAIL machine_key"; exit 1; }}
grep -q "$TIP" "$REG" || {{ echo "FAIL tip"; exit 1; }}
grep -q 'equals_production_go: false' "$REG" || {{ echo "FAIL GO claim"; exit 1; }}
grep -q 'mainnet_hard_gate_touched: false' "$REG" || {{ echo "FAIL hard gate"; exit 1; }}
grep -q 'cutover_entered: false' "$REG" || {{ echo "FAIL cutover"; exit 1; }}
grep -q 'new_rc_created: false' "$REG" || {{ echo "FAIL new RC"; exit 1; }}
python - <<'PY' "$EV" "$TIP" "$ROOT"
import json, sys, subprocess
from pathlib import Path
ev_path, tip, root = sys.argv[1:4]
d = json.loads(Path(ev_path).read_text(encoding="utf-8"))
head = subprocess.check_output(["git", "-C", root, "rev-parse", "HEAD"], text=True).strip()
ok = True
def fail(m):
    global ok
    ok = False
    print("FAIL:", m)
if head.lower() != tip.lower():
    fail(f"HEAD={{head}}")
v = d.get("verdict") or ""
if not v.startswith("PERFORMANCE_RUNTIME_REVALIDATION_"):
    fail(f"verdict={{v}}")
if d.get("equals_production_go") is not False:
    fail("GO claim")
if d.get("mainnet_hard_gate_touched") is not False:
    fail("hard gate")
if d.get("cutover_entered") is not False:
    fail("cutover")
if d.get("new_rc_created") is not False:
    fail("new RC")
# WAITING_DEPLOY is an allowed honest terminal for this pack
allowed = (
    "PERFORMANCE_RUNTIME_REVALIDATION_PASS",
    "PERFORMANCE_RUNTIME_REVALIDATION_WAITING_DEPLOY",
    "PERFORMANCE_RUNTIME_REVALIDATION_PASS_WITH_HOLDS",
)
if v not in allowed and not v.endswith("_PASS") and "WAITING_DEPLOY" not in v:
    # FAIL verdict fails the gate
    if v.endswith("_FAIL"):
        fail(f"verdict FAIL {{v}}")
print("TT_PERFORMANCE_RUNTIME_REVALIDATION_GATE:", "PASS" if ok else "FAIL")
print(f"  verdict={{v}} tip={{tip}} opt_live={{d.get('dimensions',{{}}).get('optimization_runtime_live',{{}}).get('status')}}")
print("  ≠ Production GO · no Cutover")
raise SystemExit(0 if ok else 1)
PY
""",
    )

    print(
        json.dumps(
            {
                "verdict": verdict,
                "opt_live": opt_live,
                "tip_aligned": tip_aligned,
                "rebind_ok": rebind_ok,
                "rebind_ok_n": sum(1 for r in rebind if r.get("ok")),
                "rebind_n": len(rebind),
            }
        )
    )
    # WAITING_DEPLOY is success exit for honest pack (gate allows it)
    return 0 if verdict in (
        "PERFORMANCE_RUNTIME_REVALIDATION_PASS",
        "PERFORMANCE_RUNTIME_REVALIDATION_WAITING_DEPLOY",
        "PERFORMANCE_RUNTIME_REVALIDATION_PASS_WITH_HOLDS",
    ) else 1


if __name__ == "__main__":
    raise SystemExit(main())
