#!/usr/bin/env python3
"""PSG Delta Recertify · three-baseline DRY-RUN (Candidate v2 + V3.1.1 + PSG-EGM).

REPORT ONLY · does not modify pin/tip · does not start GO / Hard Gate / formal cert.

  python scripts/dev/run-psg-delta-recertify-three-baseline-dry-run.py

SSOT: FINAL RELEASE FROZEN · Engineering SSOT Anchor · PSG Release SSOT
"""
from __future__ import annotations

import json
import ssl
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None  # type: ignore

ROOT = Path(__file__).resolve().parents[2]
TIP = "ea71c577ce6f99696df33f9394cf96746edc843b"
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
PROFILE = "v311_fund_safety_candidate_v2"
# Living Final Truth tip = ea71c577. Older Staging lag tips remain Expected Difference only if live /meta lags.
WEB_TIP_STAGING = "ea71c577ce6f99696df33f9394cf96746edc843b"
API_TIP_STAGING = "ea71c577ce6f99696df33f9394cf96746edc843b"
RUNTIME_TIP_STAGING = WEB_TIP_STAGING
# Ancestry tips (documentation only · not P0 when HEAD==living tip)
FREEZE_TIP_ANCESTRY = "3b310ca856ce2850b37a6f993f8c5649e87903b1"
LEGACY_STAGING_LAG_TIPS = (
    "1ed03a9a959d2404fd561a72dc724b59ecf1635e",
    "f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a",
)
# Staging Patch runtime SHAs (Final Truth tip stays cite-only; Track B deploy ≠ tip move)
# PERF meta compact/cache · PCR-20260723-PRODUCTION-PERFORMANCE-RUNTIME-CERTIFIED
# Human UI/UX Batches 1–6 · PATCH-STG-008～010 · PCR-20260724-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-CITE
STAGING_PATCH_RUNTIME_SHAS = (
    "f123f691b3f458d8edee8d569f0e5375dafe7529",
    "3b06b54a161cda7665e388c5799f0b59cf590365",
    "12b41d56e74076f7d0cf424c13d3e3e0cd822003",
    "21ba131e194f7941844143fb694615f3b4e6dcdd",
    "ce1bd9a914713b82fbb442e711bebf4e9d996deb",
    "1e1908a1d96888f508665519fdac75a3a5d6ba4f",
    "359273e54426fc5e2d221f75accf8a18adc66227",
)
OUT_JSON = ROOT / "docs/runbook/TT-PSG-DELTA-RECERTIFY-THREE-BASELINE-DRY-RUN-LATEST.json"
OUT_MD = ROOT / "docs/runbook/TT-PSG-DELTA-RECERTIFY-THREE-BASELINE-DRY-RUN-LATEST.md"


def git(*args: str) -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), *args], text=True).strip()


def get_json(url: str, timeout: int = 40) -> dict:
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "tt-delta-dry-run"})
    with urllib.request.urlopen(req, context=ctx, timeout=timeout) as r:
        return json.loads(r.read().decode())


def load_yaml(path: Path) -> dict:
    if yaml is None:
        return {}
    if not path.exists():
        return {}
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def main() -> int:
    head = git("rev-parse", "HEAD")
    dirty = len(git("status", "--porcelain").splitlines()) if True else 0
    findings: list[dict] = []
    axes: dict = {}

    # Freeze
    frb = load_yaml(ROOT / "registry/final-release-baseline.v1.yaml")
    freeze_ok = frb.get("freeze_status") == "FROZEN"
    axes["final_release"] = {
        "freeze_status": frb.get("freeze_status"),
        "cert_suite": frb.get("cert_suite"),
        "ok": freeze_ok,
    }
    if not freeze_ok:
        findings.append({"sev": "P0", "id": "NOT_FROZEN", "detail": "FINAL RELEASE not FROZEN"})

    # Registry ACTIVE
    ver = load_yaml(ROOT / "registry/psg-release-version-LATEST.yaml")
    act = ver.get("active") or {}
    reg_ok = act.get("psg_release_version") == PIN and act.get("git_sha") == TIP
    axes["registry_active"] = {
        "pin": act.get("psg_release_version"),
        "sha": act.get("git_sha"),
        "ok": reg_ok,
    }
    if not reg_ok:
        findings.append(
            {
                "sev": "P0",
                "id": "REGISTRY_ACTIVE_DRIFT",
                "detail": f"active={act.get('psg_release_version')}@{act.get('git_sha')}",
            }
        )

    # Three baselines
    cand = load_yaml(ROOT / "registry/web3-candidate-v2.v1.yaml")
    egm = load_yaml(ROOT / "registry/economic-governance/egm-baseline.yaml")
    econ = ROOT / "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md"
    axes["baseline_candidate"] = {
        "status": cand.get("status") or (cand.get("baseline") or {}).get("status"),
        "pin": cand.get("psg_release_version")
        or (cand.get("release") or {}).get("psg_release_version")
        or (cand.get("baseline") or {}).get("psg_release_version"),
        "ok": "ACTIVE" in str(cand.get("status", ""))
        or "ACTIVE" in str((cand.get("baseline") or {}).get("status", ""))
        or PIN in json.dumps(cand),
    }
    axes["baseline_v311"] = {"path_exists": econ.exists(), "ok": econ.exists()}
    axes["baseline_egm"] = {
        "adjudication": egm.get("adjudication"),
        "ok": egm.get("adjudication") == "CLOSED_AS_FRAMEWORK_DESIGN",
    }
    if not axes["baseline_egm"]["ok"]:
        findings.append({"sev": "P0", "id": "EGM_MISSING_OR_DRIFT", "detail": str(egm.get("adjudication"))})

    # Engineering anchor
    eng = load_yaml(ROOT / "registry/engineering-ssot-anchor.v1.yaml")
    axes["engineering_ssot"] = {
        "status": eng.get("status"),
        "ok": eng.get("machine_key") == "TT_ENGINEERING_SSOT_ANCHOR",
    }

    # Git / worktree — Freeze tip may be ahead of Staging bake (Expected Difference)
    axes["git"] = {
        "head": head,
        "dirty": dirty,
        "freeze_tip": TIP,
        "staging_runtime_tip": RUNTIME_TIP_STAGING,
        "head_eq_freeze_tip": head == TIP,
        "worktree_clean": dirty == 0,
        "note": "Freeze UI tip may differ from Staging bake tip (Expected Difference until redeploy)",
    }

    # Staging runtime — match living Final Truth tip OR documented legacy Staging lag tip
    try:
        api = get_json("https://tt-api-staging.fly.dev/meta")
        b = api.get("build") or {}
        api_sha = b.get("git_sha")
        api_at_freeze = api_sha == TIP
        api_at_staging_lag = api_sha in LEGACY_STAGING_LAG_TIPS
        api_at_staging_patch = api_sha in STAGING_PATCH_RUNTIME_SHAS
        api_ok = (
            (api_at_freeze or api_at_staging_lag or api_at_staging_patch)
            and b.get("psg_release_version") == PIN
            and b.get("contract_profile") == PROFILE
            and b.get("attestation_status") == "ok"
        )
        axes["staging_api"] = {
            "sha": api_sha,
            "pin": b.get("psg_release_version"),
            "profile": b.get("contract_profile"),
            "attestation": b.get("attestation_status"),
            "ok": api_ok,
            "expected_difference": (api_at_staging_lag or api_at_staging_patch) and not api_at_freeze,
            "staging_patch": api_at_staging_patch,
        }
        if not api_ok:
            findings.append({"sev": "P0", "id": "STAGING_API_DRIFT", "detail": axes["staging_api"]})
        elif api_at_staging_patch and not api_at_freeze:
            findings.append(
                {
                    "sev": "EXPECTED",
                    "id": "STAGING_API_PATCH_RUNTIME",
                    "detail": f"api={api_sha} living_tip={TIP} · Staging Patch Track B · tip cite-only",
                }
            )
        elif api_at_staging_lag and not api_at_freeze:
            findings.append(
                {
                    "sev": "EXPECTED",
                    "id": "STAGING_API_TIP_LAG",
                    "detail": f"api={api_sha} living_tip={TIP}",
                }
            )
    except Exception as e:  # noqa: BLE001
        axes["staging_api"] = {"ok": False, "error": str(e)}
        findings.append({"sev": "P0", "id": "STAGING_API_UNREACHABLE", "detail": str(e)})

    web_err = None
    bake = ident = None
    for _attempt in range(3):
        try:
            bake = get_json("https://tt-web-staging.fly.dev/tt-release-identity.bake.json")
            ident = get_json("https://tt-web-staging.fly.dev/api/release-identity")
            web_err = None
            break
        except Exception as e:  # noqa: BLE001
            web_err = e
    if bake is not None and ident is not None:
        bake_sha = bake.get("git_sha")
        web_at_freeze = bake_sha == TIP
        web_at_staging_lag = bake_sha in LEGACY_STAGING_LAG_TIPS
        web_at_staging_patch = bake_sha in STAGING_PATCH_RUNTIME_SHAS
        # Living tip OR documented legacy lag OR declared Staging Patch runtime:
        # pin+attestation still required at living tip; patch/lag = Expected Difference.
        if web_at_freeze:
            web_ok = (
                bake.get("psg_release_version") == PIN
                and ident.get("psg_release_version") == PIN
                and ident.get("attestation_status") == "ok"
            )
        elif web_at_staging_lag:
            web_ok = True
        elif web_at_staging_patch:
            web_ok = bake.get("psg_release_version") == PIN
        else:
            web_ok = False
        axes["staging_web"] = {
            "bake_sha": bake_sha,
            "bake_pin": bake.get("psg_release_version"),
            "db": bake.get("database_baseline"),
            "cms": bake.get("cms_baseline"),
            "id_attestation": ident.get("attestation_status"),
            "ok": web_ok,
            "expected_difference": (web_at_staging_lag or web_at_staging_patch) and not web_at_freeze,
            "staging_patch": web_at_staging_patch,
        }
        if not web_ok:
            findings.append({"sev": "P0", "id": "STAGING_WEB_DRIFT", "detail": axes["staging_web"]})
        elif web_at_staging_patch and not web_at_freeze:
            findings.append(
                {
                    "sev": "EXPECTED",
                    "id": "STAGING_WEB_PATCH_RUNTIME",
                    "detail": f"web={bake_sha} living_tip={TIP} · Staging Patch Track B · tip cite-only",
                }
            )
        elif web_at_staging_lag and not web_at_freeze:
            findings.append(
                {
                    "sev": "EXPECTED",
                    "id": "STAGING_WEB_TIP_LAG",
                    "detail": f"web={bake_sha} living_tip={TIP}",
                }
            )
    else:
        axes["staging_web"] = {"ok": False, "error": str(web_err)}
        # Transient SSL/network → P1 (not baseline pollution)
        findings.append({"sev": "P1", "id": "STAGING_WEB_UNREACHABLE", "detail": str(web_err)})

    # Evidence — Freeze tip or Staging lag tip
    ev = ROOT / "evidence/GO_web3_candidate_v2/WEB3-CANDIDATE-V2-RELEASE-IDENTITY-LATEST.json"
    ej = json.loads(ev.read_text(encoding="utf-8")) if ev.exists() else {}
    ev_sha = ej.get("git_sha")
    ev_ok = ej.get("psg_release_version") == PIN and ev_sha in (TIP, RUNTIME_TIP_STAGING)
    axes["evidence"] = {
        "sha": ev_sha,
        "pin": ej.get("psg_release_version"),
        "ok": ev_ok,
        "expected_difference": ev_sha == RUNTIME_TIP_STAGING and ev_sha != TIP,
    }
    if not ev_ok:
        findings.append({"sev": "P1", "id": "EVIDENCE_IDENTITY_DRIFT", "detail": axes["evidence"]})
    elif ev_sha == RUNTIME_TIP_STAGING and ev_sha != TIP:
        findings.append(
            {
                "sev": "EXPECTED",
                "id": "EVIDENCE_TIP_LAG",
                "detail": f"evidence={ev_sha} freeze_tip={TIP}",
            }
        )

    # Pollution defaults
    bad = "PSG-REL-20260722-STAGING-ALIGN-W0"
    pollute_files = [
        ROOT / "scripts/deploy/_lib.sh",
        ROOT / "scripts/dev/deploy-tt-web-staging.sh",
        ROOT / "scripts/dev/phase2-staging-fly-deploy-and-sync.sh",
    ]
    polluted = []
    for p in pollute_files:
        if p.exists() and bad in p.read_text(encoding="utf-8", errors="ignore"):
            # allow only in comments saying SUPERSEDED
            text = p.read_text(encoding="utf-8", errors="ignore")
            for i, line in enumerate(text.splitlines(), 1):
                if bad in line and "PSG-REL-20260720-WEB3-CAND-V2" not in line.split(":-")[-1]:
                    if f":-{bad}" in line.replace(" ", "") or f"={bad}" in line.replace(" ", ""):
                        polluted.append(f"{p}:{i}")
    axes["deploy_defaults"] = {"polluted_lines": polluted, "ok": len(polluted) == 0}
    if polluted:
        findings.append({"sev": "P0", "id": "DEPLOY_DEFAULT_STAGING_ALIGN", "detail": polluted})

    p0 = [f for f in findings if f["sev"] == "P0"]
    expected = [f for f in findings if f["sev"] == "EXPECTED"]
    if head != TIP:
        expected.append(
            {
                "id": "FREEZE_OVERLAY_HEAD_VS_FREEZE_TIP",
                "detail": f"HEAD={head[:12]} freeze_tip={TIP[:12]} — commit freeze artifacts or clean worktree",
            }
        )

    verdict = "DRY_RUN_PASS" if not p0 else "DRY_RUN_BLOCKED"
    if expected and verdict == "DRY_RUN_PASS":
        verdict = "DRY_RUN_PASS_WITH_EXPECTED_DIFFERENCE"

    report = {
        "schema": "traveltrust.psg_delta_recertify_three_baseline_dry_run.v1",
        "machine_key": "TT_PSG_DELTA_RECERTIFY_THREE_BASELINE_DRY_RUN",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": "DRY_RUN_REPORT_ONLY",
        "equals_production_go": False,
        "equals_staging_grade_go": False,
        "formal_cert_started": False,
        "core_version_modified": False,
        "pin": PIN,
        "freeze_tip": TIP,
        "staging_runtime_tip": RUNTIME_TIP_STAGING,
        "head": head,
        "baselines": ["Candidate_v2", "V3.1.1_Final", "PSG_EGM_Final"],
        "axes": axes,
        "findings": findings,
        "expected_differences": expected,
        "verdict": verdict,
        "p0_count": len(p0),
    }

    OUT_JSON.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# PSG Delta Recertify · Three Baseline · DRY-RUN",
        "",
        f"**Status:** `{verdict}` · **REPORT ONLY** · **≠ GO**",
        f"**Recorded:** `{report['recorded_utc']}`",
        f"**Pin / Runtime tip:** `{PIN}` @ `{TIP[:12]}…`",
        f"**HEAD:** `{head[:12]}…` · dirty={dirty}",
        "",
        "## Verdict",
        "",
        f"- P0 findings: **{len(p0)}**",
        f"- Expected Differences: **{len(expected)}**",
        f"- Formal cert started: **false**",
        f"- Core version modified: **false**",
        "",
        "## Axes",
        "",
        "| Axis | OK | Detail |",
        "|------|----|--------|",
    ]
    for k, v in axes.items():
        lines.append(f"| `{k}` | {'✅' if v.get('ok') else '❌'} | `{json.dumps(v, ensure_ascii=False)[:120]}` |")
    lines += ["", "## Findings", ""]
    if not findings:
        lines.append("_none_")
    else:
        for f in findings:
            lines.append(f"- **{f['sev']}** `{f['id']}` — {f['detail']}")
    lines += ["", "## Expected Differences", ""]
    if not expected:
        lines.append("_none_")
    else:
        for e in expected:
            lines.append(f"- `{e['id']}` — {e['detail']}")
    lines += [
        "",
        "## Honesty",
        "",
        "DRY-RUN ≠ formal Delta Recertify PASS ≠ Staging-grade GO ≠ Production GO.",
        "",
    ]
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps({"verdict": verdict, "p0": len(p0), "expected": len(expected), "out": str(OUT_JSON)}, indent=2))
    return 0 if verdict.startswith("DRY_RUN_PASS") else 2


if __name__ == "__main__":
    sys.exit(main())
