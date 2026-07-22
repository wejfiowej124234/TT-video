#!/usr/bin/env python3
"""FINAL RELEASE deep consistency audit v2 — six chains, audit-only."""
from __future__ import annotations

import json
import re
import ssl
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

ROOT = Path(__file__).resolve().parents[2]
TIP = "97289a7185610ef0ad8822f0af04bfa533e42986"
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
PROFILE = "v311_fund_safety_candidate_v2"
BAD = "PSG-REL-20260722-STAGING-ALIGN-W0"
OUT = ROOT / "docs/runbook/TT-FINAL-RELEASE-DEEP-CONSISTENCY-AUDIT-V2-LATEST.json"
OUT_MD = ROOT / "docs/runbook/TT-FINAL-RELEASE-DEEP-CONSISTENCY-AUDIT-V2-LATEST.md"


def git(*a: str) -> str:
    return subprocess.check_output(["git", "-C", str(ROOT), *a], text=True).strip()


def get(url: str, retries: int = 3):
    ctx = ssl.create_default_context()
    last = None
    for _ in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "tt-audit-v2"})
            with urllib.request.urlopen(req, context=ctx, timeout=45) as r:
                return json.loads(r.read().decode())
        except Exception as e:  # noqa: BLE001
            last = e
    raise last  # type: ignore[misc]


def load_yaml(rel: str) -> dict:
    p = ROOT / rel
    if not p.exists() or yaml is None:
        return {}
    return yaml.safe_load(p.read_text(encoding="utf-8")) or {}


def main() -> int:
    findings: list[dict] = []
    chains: dict = {}

    head = git("rev-parse", "HEAD")
    # Ignore audit/formal evidence outputs when judging worktree cleanliness
    ignore_dirty_prefixes = (
        "docs/runbook/TT-FINAL-RELEASE-DEEP-CONSISTENCY-AUDIT-V2",
        "docs/runbook/TT-PSG-DELTA-RECERTIFY-THREE-BASELINE-FORMAL",
        "evidence/PSG-DELTA-RECERTIFY/",
        "scripts/dev/run-final-release-deep-consistency-audit-v2.py",
        "scripts/dev/run-psg-delta-recertify-three-baseline-formal.py",
    )
    dirty_lines = []
    for ln in git("status", "--porcelain").splitlines():
        path = ln[3:].strip() if len(ln) > 3 else ln.strip()
        if any(path.replace("\\", "/").startswith(p) for p in ignore_dirty_prefixes):
            continue
        dirty_lines.append(ln)
    dirty = len(dirty_lines)
    frb = load_yaml("registry/final-release-baseline.v1.yaml")
    ver = load_yaml("registry/psg-release-version-LATEST.yaml")
    act = ver.get("active") or {}
    eng = load_yaml("registry/engineering-ssot-anchor.v1.yaml")
    sot = load_yaml("registry/psg-release-source-of-truth.v1.yaml")

    api = get("https://tt-api-staging.fly.dev/meta")
    b = api.get("build") or {}
    bake = get("https://tt-web-staging.fly.dev/tt-release-identity.bake.json")
    ident = get("https://tt-web-staging.fly.dev/api/release-identity")

    # RELEASE
    release = {
        "freeze": frb.get("freeze_status"),
        "cert_suite": frb.get("cert_suite"),
        "registry_pin": act.get("psg_release_version"),
        "registry_sha": act.get("git_sha"),
        "api_pin": b.get("psg_release_version"),
        "api_sha": b.get("git_sha"),
        "api_att": b.get("attestation_status"),
        "web_pin": bake.get("psg_release_version"),
        "web_sha": bake.get("git_sha"),
        "id_att": ident.get("attestation_status"),
        "eng_anchor": eng.get("machine_key"),
        "psg_ssot": (sot.get("machine_keys") or {}).get("TT_PSG_RELEASE_SSOT"),
        "head": head,
        "dirty": dirty,
    }
    release["ok"] = (
        frb.get("freeze_status") == "FROZEN"
        and act.get("psg_release_version") == PIN
        and act.get("git_sha") == TIP
        and b.get("git_sha") == TIP
        and b.get("psg_release_version") == PIN
        and b.get("attestation_status") == "ok"
        and bake.get("git_sha") == TIP
        and bake.get("psg_release_version") == PIN
        and ident.get("attestation_status") == "ok"
        and eng.get("machine_key") == "TT_ENGINEERING_SSOT_ANCHOR"
        and dirty == 0
    )
    if not release["ok"]:
        findings.append({"chain": "release", "sev": "P0", "id": "RELEASE_CHAIN_FAIL", "detail": release})
    chains["release"] = release

    # DATA
    data = {
        "database_baseline": bake.get("database_baseline"),
        "cms_baseline": bake.get("cms_baseline"),
        "expected_db": "staging_rc_ssot_alignment.v1#expected_staging_surface",
    }
    data["ok"] = data["database_baseline"] == data["expected_db"] and bool(data["cms_baseline"])
    if not data["ok"]:
        findings.append({"chain": "data", "sev": "P1", "id": "DATA_BASELINE_DRIFT", "detail": data})
    chains["data"] = data

    # CODE
    code_paths = [
        "crates/api/src/routes/health_meta/meta_build.rs",
        "frontend/app/api/release-identity/route.ts",
        "frontend/Dockerfile.fly-staging",
        "scripts/deploy/_lib.sh",
        "scripts/dev/deploy-tt-web-staging.sh",
        "scripts/dev/phase2-staging-fly-deploy-and-sync.sh",
        "scripts/dev/run-psg-version-gate.py",
        "scripts/dev/run-deployment-identity-gate.py",
    ]
    polluted: list[str] = []
    for rel in code_paths:
        p = ROOT / rel
        if not p.exists():
            findings.append({"chain": "code", "sev": "P0", "id": "MISSING_PATH", "detail": rel})
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for i, line in enumerate(text.splitlines(), 1):
            if BAD not in line:
                continue
            if any(
                x in line
                for x in (
                    "Forbidden",
                    "FORBIDDEN",
                    "SUPERSEDED",
                    "ARCHIVED",
                    "BAD=",
                    "#",
                    "///",
                    "refuse",
                    "REFUSED",
                )
            ):
                continue
            compact = line.replace(" ", "")
            if f"={BAD}" in compact or f':-"{BAD}"' in compact or f":-{BAD}" in compact or f'"{BAD}"' in line:
                # default after :- must not be BAD
                if ":-" in line and BAD in line.split(":-")[-1] and PIN not in line.split(":-")[-1]:
                    polluted.append(f"{rel}:{i}")
                elif f'"{BAD}"' in line and "FROZEN_PSG" in line:
                    polluted.append(f"{rel}:{i}")
                elif f"DEFAULT" in line and BAD in line:
                    polluted.append(f"{rel}:{i}")
                elif "ARG NEXT_PUBLIC_PSG_RELEASE_VERSION=" in line and BAD in line:
                    polluted.append(f"{rel}:{i}")
    meta = (ROOT / "crates/api/src/routes/health_meta/meta_build.rs").read_text(encoding="utf-8", errors="ignore")
    code = {"polluted_defaults": polluted, "profile_const_ok": PROFILE in meta and PIN in meta}
    code["ok"] = len(polluted) == 0 and code["profile_const_ok"]
    if polluted:
        findings.append({"chain": "code", "sev": "P0", "id": "CODE_DEFAULT_POLLUTION", "detail": polluted})
    chains["code"] = code

    # DOCS
    doc_checks = [
        ("docs/runbook/TT-FINAL-RELEASE-BASELINE-LATEST.md", ["FROZEN", "Candidate"]),
        ("docs/runbook/TT-ENGINEERING-SSOT-ANCHOR-LATEST.md", ["TT_ENGINEERING_SSOT_ANCHOR", PIN]),
        ("docs/runbook/TT-FINAL-RELEASE-SYSTEM-ARCHITECTURE-LATEST.md", ["PSG", "Engineering"]),
        ("docs/governance/economic-governance/TT-EGM-MASTER.md", ["CLOSED_AS_FRAMEWORK_DESIGN"]),
        ("docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md", ["3.1.1"]),
    ]
    docs: dict = {"missing": [], "ok_files": [], "living_active_without_archive_banner": []}
    for path, needles in doc_checks:
        p = ROOT / path
        if not p.exists():
            docs["missing"].append(path)
            findings.append({"chain": "docs", "sev": "P0", "id": "DOC_MISSING", "detail": path})
            continue
        t = p.read_text(encoding="utf-8", errors="ignore")
        if all(n in t for n in needles):
            docs["ok_files"].append(path)
        else:
            findings.append({"chain": "docs", "sev": "P1", "id": "DOC_NEEDLE_MISS", "detail": path})
    for p in (ROOT / "docs/runbook").glob("TT-FG15-*-LATEST.md"):
        t = p.read_text(encoding="utf-8", errors="ignore")
        head = t[:900]
        if "ACTIVE_DURING_WINDOW" in t and "ARCHIVED" not in head and "SUPERSEDED" not in head:
            docs["living_active_without_archive_banner"].append(str(p.relative_to(ROOT)))
    if docs["living_active_without_archive_banner"]:
        findings.append(
            {
                "chain": "docs",
                "sev": "P1",
                "id": "FG15_LIVING_ACTIVE",
                "detail": docs["living_active_without_archive_banner"],
            }
        )
    docs["ok"] = not docs["missing"] and not docs["living_active_without_archive_banner"]
    chains["docs"] = docs

    # SECURITY
    sec = {
        "api_attestation": b.get("attestation_status"),
        "web_attestation": ident.get("attestation_status"),
        "mint_w0_refused": "ALLOW_HISTORICAL_STAGING_ALIGN_MINT"
        in (ROOT / "scripts/dev/run-psg-mint-staging-align-w0.py").read_text(encoding="utf-8", errors="ignore"),
        "fg15_unguarded": [],
    }
    for p in (ROOT / "scripts/dev").glob("run-fg15*.py"):
        if "TRAVELTRUST_ALLOW_HISTORICAL_BASELINE" not in p.read_text(encoding="utf-8", errors="ignore"):
            sec["fg15_unguarded"].append(str(p.relative_to(ROOT)))
            findings.append({"chain": "security", "sev": "P0", "id": "FG15_UNGUARDED", "detail": str(p)})
    sec["ok"] = (
        sec["api_attestation"] == "ok"
        and sec["web_attestation"] == "ok"
        and sec["mint_w0_refused"]
        and not sec["fg15_unguarded"]
    )
    chains["security"] = sec

    # EVIDENCE
    ev = ROOT / "evidence/GO_web3_candidate_v2/WEB3-CANDIDATE-V2-RELEASE-IDENTITY-LATEST.json"
    ej = json.loads(ev.read_text(encoding="utf-8")) if ev.exists() else {}
    egm = load_yaml("registry/economic-governance/egm-baseline.yaml")
    cand = load_yaml("registry/web3-candidate-v2.v1.yaml")
    evidence = {
        "identity_sha": ej.get("git_sha"),
        "identity_pin": ej.get("psg_release_version"),
        "egm": egm.get("adjudication"),
        "candidate_present": bool(cand),
        "candidate_dir": (ROOT / "evidence/GO_web3_candidate_v2").is_dir(),
    }
    evidence["ok"] = (
        ej.get("git_sha") == TIP
        and ej.get("psg_release_version") == PIN
        and egm.get("adjudication") == "CLOSED_AS_FRAMEWORK_DESIGN"
        and evidence["candidate_dir"]
        and evidence["candidate_present"]
    )
    if not evidence["ok"]:
        findings.append({"chain": "evidence", "sev": "P0", "id": "EVIDENCE_CHAIN_FAIL", "detail": evidence})
    chains["evidence"] = evidence

    # Anchor hidden drift
    anchor_drift: list[str] = []
    gp = eng.get("governance_parent") or {}
    if gp.get("active_psg_release_version") and gp.get("active_psg_release_version") != PIN:
        anchor_drift.append(f"eng_pin={gp.get('active_psg_release_version')}")
    if gp.get("git_sha") and gp.get("git_sha") != TIP:
        anchor_drift.append(f"eng_tip={gp.get('git_sha')}")
    fg = sot.get("fg15_window") or {}
    if fg.get("active_version") and fg.get("active_version") != PIN:
        anchor_drift.append(f"sot_active_version={fg.get('active_version')}")
    if fg.get("freeze_git_sha") and fg.get("freeze_git_sha") not in (TIP, "TRACK_HEAD"):
        if fg.get("freeze_git_sha") != TIP:
            anchor_drift.append(f"sot_freeze_sha={fg.get('freeze_git_sha')}")
    if anchor_drift:
        findings.append({"chain": "release", "sev": "P0", "id": "ANCHOR_HIDDEN_DRIFT", "detail": anchor_drift})

    p0 = [f for f in findings if f["sev"] == "P0"]
    expected = []
    if head != TIP:
        expected.append(
            {
                "id": "FREEZE_OVERLAY_HEAD_VS_RUNTIME_TIP",
                "detail": f"HEAD={head[:12]} tip={TIP[:12]}",
                "disposition": "CONFIRM_DESIGN",
            }
        )

    verdict = "AUDIT_V2_PASS" if not p0 else "AUDIT_V2_BLOCKED"
    if expected and verdict == "AUDIT_V2_PASS":
        verdict = "AUDIT_V2_PASS_WITH_EXPECTED_DIFFERENCE"

    report = {
        "schema": "traveltrust.final_release_deep_consistency_audit_v2.v1",
        "machine_key": "TT_FINAL_RELEASE_DEEP_CONSISTENCY_AUDIT_V2",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": "AUDIT_ONLY_NO_FEATURE",
        "equals_production_go": False,
        "pin": PIN,
        "runtime_tip": TIP,
        "head": head,
        "chains": chains,
        "findings": findings,
        "anchor_hidden_drift": anchor_drift,
        "expected_differences": expected,
        "verdict": verdict,
        "p0_count": len(p0),
        "chains_ok": {k: bool(v.get("ok")) for k, v in chains.items()},
    }
    OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# TT · FINAL RELEASE · 深度一致性审计 v2（六链）",
        "",
        f"**Verdict:** `{verdict}` · **P0:** {len(p0)} · **≠ GO** · **只审不扩**",
        f"**Recorded:** `{report['recorded_utc']}` · HEAD `{head[:12]}…` · tip `{TIP[:12]}…`",
        "",
        "| 链 | OK |",
        "|----|----|",
    ]
    for k, ok in report["chains_ok"].items():
        lines.append(f"| {k} | {'✅' if ok else '❌'} |")
    lines += ["", "## Anchor hidden drift", ""]
    lines.append("_none_" if not anchor_drift else "\n".join(f"- `{x}`" for x in anchor_drift))
    lines += ["", "## Findings", ""]
    if not findings:
        lines.append("_none_")
    else:
        for f in findings:
            lines.append(f"- **{f['sev']}** `{f['id']}` ({f['chain']}) — `{f.get('detail')}`")
    lines += ["", "## Expected Differences", ""]
    if not expected:
        lines.append("_none_")
    else:
        for e in expected:
            lines.append(f"- `{e['id']}` — {e['detail']} · {e['disposition']}")
    lines += [
        "",
        "## Honesty",
        "",
        "AUDIT_V2 ≠ formal Delta PASS ≠ Staging-grade GO ≠ Production GO.",
        "",
    ]
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"verdict": verdict, "p0": len(p0), "anchor_drift": anchor_drift, "chains_ok": report["chains_ok"]}, indent=2))
    return 0 if verdict.startswith("AUDIT_V2_PASS") else 2


if __name__ == "__main__":
    sys.exit(main())
