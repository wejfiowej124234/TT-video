#!/usr/bin/env python3
"""Web3 Production-Grade Alignment Audit — GOV-03 V1.1 / Genesis-Public / Registry SSOT.

Orchestrates: consistency audit · drift scan · forge · vitest · evidence + manual checklist.
Does NOT broadcast Sepolia / mainnet · does NOT fill Owner vesting params.
"""
from __future__ import annotations

import json
import shutil
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None

ROOT = Path(os.environ.get("TT_ROOT", Path(__file__).resolve().parents[2]))
STAMP = os.environ.get("WEB3_ALIGN_AUDIT_STAMP", datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
EVID = Path(os.environ.get("WEB3_ALIGN_EVID", ROOT / "evidence/GO_web3_production_grade_alignment_audit" / STAMP))
AUDIT_ID = "WPGA-2026-07-12-v1"

# Paths allowed to mention legacy 4% wallet cap (historical / amendment prose)
STALE_ALLOW = (
    "GOV-03-AMENDMENT",
    "废止",
    "移除单地址",
    "legacy",
    "LEGACY",
    "max_vote=400",
    "V1（2026-06-16）",
    "400 | **0**",
)

STALE_PATTERNS = [
    (re.compile(r"vote\s*cap\s*400", re.I), "vote cap 400"),
    (re.compile(r"max_voting_power_per_address_bps:\s*400\b"), "yaml max_voting 400"),
    (re.compile(r"MAX_VOTING_POWER_PER_ADDRESS_BPS\s*=\s*400"), "sol max voting 400"),
    (re.compile(r"单地址治理\s*≤\s*4"), "zh single-address vote cap 4%"),
    (re.compile(r"单地址.*≤\s*4\.00%.*治理"), "zh governance 4% cap"),
    (re.compile(r"Max voting power / address \| 400 bps"), "master audit 400 bps row"),
    (re.compile(r"满足任一.*G-END"), "genesis OR exit"),
]


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace") if p.is_file() else ""


def _resolve_exe(cmd: list[str]) -> list[str]:
    if not cmd:
        return cmd
    exe = shutil.which(cmd[0])
    return [exe, *cmd[1:]] if exe else cmd


def _run(cmd: list[str], cwd: Path | None = None, timeout: int = 600) -> dict:
    cmd = _resolve_exe(cmd)
    try:
        r = subprocess.run(
            cmd,
            cwd=cwd or ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
            shell=False,
        )
        return {
            "cmd": " ".join(cmd),
            "exit_code": r.returncode,
            "stdout_tail": (r.stdout or "")[-4000:],
            "stderr_tail": (r.stderr or "")[-2000:],
        }
    except subprocess.TimeoutExpired as e:
        return {"cmd": " ".join(cmd), "exit_code": 124, "error": "timeout", "stdout_tail": str(e)}


def _scan_drift() -> list[dict]:
    findings: list[dict] = []
    skip_dirs = {".git", "node_modules", "target", "out", "cache", ".fpc-b40-docker-test", ".fpc-b40-check-worktree"}
    exts = {".md", ".yaml", ".yml", ".ts", ".tsx", ".rs", ".sol", ".py", ".sh", ".json"}
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in skip_dirs for part in path.parts):
            continue
        if path.suffix.lower() not in exts:
            continue
        rel = str(path.relative_to(ROOT)).replace("\\", "/")
        skip_fragments = (
            "run-web3-production-grade-alignment-audit.py",
            "run-governance-consistency-audit.py",
            "GOV-03-AMENDMENT",
            "evidence/",
            "330-阶段数据迁移",
            ".fpc-b40-",
        )
        if any(s in rel for s in skip_fragments):
            continue
        text = _read(path)
        if not text:
            continue
        for pat, label in STALE_PATTERNS:
            if not pat.search(text):
                continue
            if label == "genesis OR exit" and "G-END" not in text:
                continue
            if label.startswith("zh") and any(x in text for x in ("废止", "移除单地址", "无单地址", "cap_disabled", "V1.1")):
                continue
            if "GOV-03-AMENDMENT" in rel or "TTG-TOKENOMICS-FREEZE-V1.md" in rel:
                if label.startswith("zh") or label == "yaml max_voting 400":
                    continue
            if label == "master audit 400 bps row" and "cap_disabled" in text:
                continue
            findings.append({"path": rel, "pattern": label, "severity": "error"})
            break
    return findings


def _registry_checks() -> list[tuple[str, bool, str, str]]:
    out: list[tuple[str, bool, str, str]] = []
    if yaml is None:
        return [("registry-yaml", False, "error", "pyyaml missing")]

    ssot = yaml.safe_load(_read(ROOT / "docs/spec/governance-token/protocol-ssot.v1.yaml")) or {}
    gov3 = (ssot.get("governance_freeze_v1") or {}).get("GOV-03") or {}
    phase = yaml.safe_load(_read(ROOT / "registry/governance-phase-transition.v1.yaml")) or {}

    out.append(
        (
            "REG-protocol-ssot-gov03",
            gov3.get("max_voting_power_cap_disabled") is True and gov3.get("max_voting_power_per_address_bps") == 0,
            "pass" if gov3.get("max_voting_power_cap_disabled") else "error",
            f"cap_disabled={gov3.get('max_voting_power_cap_disabled')} bps={gov3.get('max_voting_power_per_address_bps')}",
        )
    )
    out.append(
        (
            "REG-phase-transition-and",
            (phase.get("genesis_exit") or {}).get("logic") == "AND",
            "pass" if (phase.get("genesis_exit") or {}).get("logic") == "AND" else "error",
            f"logic={(phase.get('genesis_exit') or {}).get('logic')}",
        )
    )
    pgt = phase.get("public_governance_threshold") or {}
    out.append(
        (
            "REG-public-governance-threshold",
            isinstance(pgt.get("active_voting_supply_min_bps"), int) and isinstance(pgt.get("public_bucket_votable_min_bps"), int),
            "pass",
            f"active={pgt.get('active_voting_supply_min_bps')} public_bucket={pgt.get('public_bucket_votable_min_bps')}",
        )
    )
    vest = yaml.safe_load(_read(ROOT / "registry/ttg-vesting-registry.v1.yaml")) or {}
    team = (vest.get("pools") or {}).get("team") or {}
    out.append(
        (
            "REG-vesting-owner-input",
            team.get("cliff_seconds") == "OWNER_INPUT",
            "warn",
            "team vesting commercial params OWNER_INPUT (expected pre-Owner Decision)",
        )
    )
    return out


def _required_docs() -> list[tuple[str, bool]]:
    docs = [
        "docs/spec/governance-token/TTG-GOVERNANCE-LIFECYCLE.md",
        "docs/spec/governance-token/TTG-GOVERNANCE-FREEZE-CERTIFICATE.md",
        "docs/spec/governance-token/GENESIS-GOVERNANCE-PHASE.md",
        "docs/spec/governance-token/PUBLIC-GOVERNANCE-PHASE.md",
        "docs/spec/governance-token/GOV-03-AMENDMENT-V1.1.md",
    ]
    return [(d, (ROOT / d).is_file()) for d in docs]


def main() -> int:
    EVID.mkdir(parents=True, exist_ok=True)
    checks: list[dict] = []
    manual: list[dict] = []
    blockers: list[dict] = []

    py = "python" if (ROOT / "scripts").exists() else "python3"

    # 1 · Governance consistency
    cons = _run([py, "scripts/dev/run-governance-consistency-audit.py"])
    cons_ok = cons.get("exit_code") == 0
    checks.append({"id": "CHK-CONSISTENCY", "status": "PASS" if cons_ok else "FAIL", "risk": "P0", "detail": cons})

    # 2 · Drift scan
    drift = _scan_drift()
    drift_ok = len(drift) == 0
    checks.append(
        {
            "id": "CHK-DRIFT-SCAN",
            "status": "PASS" if drift_ok else "WARN" if len(drift) <= 3 else "FAIL",
            "risk": "P2" if drift_ok else "P1",
            "detail": drift[:20],
            "count": len(drift),
        }
    )

    # 3 · Registry
    for cid, ok, sev, detail in _registry_checks():
        checks.append({"id": cid, "status": "PASS" if ok else ("WARN" if sev == "warn" else "FAIL"), "risk": "P2" if sev == "warn" else "P1", "detail": detail})

    # 4 · Required docs
    for doc, ok in _required_docs():
        checks.append({"id": f"DOC-{Path(doc).stem[:24]}", "status": "PASS" if ok else "FAIL", "risk": "P1", "detail": doc})

    # 5 · Forge GOV tests
    forge = _run(
        ["forge", "test", "--match-contract", "TtgGovFreezeV1EnforcementTest", "-vv"],
        cwd=ROOT / "contracts",
        timeout=300,
    )
    forge_ok = forge.get("exit_code") == 0
    checks.append({"id": "CHK-FORGE-GOV-FREEZE", "status": "PASS" if forge_ok else "FAIL", "risk": "P0", "detail": forge})

    # 6 · Frontend vitest governance params
    vitest_bin = shutil.which("npx") or shutil.which("npm")
    if vitest_bin and vitest_bin.endswith("npm"):
        vitest_cmd = ["npm", "exec", "--", "vitest", "run", "lib/governance/governanceParamsTokenomicsModel.test.ts", "lib/governance/governanceParamsPageL5FullClosure.contract.test.ts"]
    else:
        vitest_cmd = ["npx", "vitest", "run", "lib/governance/governanceParamsTokenomicsModel.test.ts", "lib/governance/governanceParamsPageL5FullClosure.contract.test.ts"]
    vitest = _run(vitest_cmd, cwd=ROOT / "frontend", timeout=180) if vitest_bin else {"exit_code": 127, "error": "npx/npm not found"}
    vitest_ok = vitest.get("exit_code") == 0
    checks.append({"id": "CHK-VITEST-GOV-PARAMS", "status": "PASS" if vitest_ok else "FAIL", "risk": "P1", "detail": vitest})

    # 7 · Regenerate coverage matrix (best-effort)
    gen = _run([py, "scripts/dev/gen-ttg-governance-full-coverage-matrix.py"], timeout=60)
    checks.append({"id": "CHK-REGEN-COVERAGE-MATRIX", "status": "PASS" if gen.get("exit_code") == 0 else "WARN", "risk": "P2", "detail": gen})

    # Manual actions (never simulated)
    manual.extend(
        [
            {"id": "MAN-OWNER-VESTING", "priority": "P0", "owner": True, "item": "Fill registry/ttg-vesting-registry.v1.yaml commercial params (cliff/duration/start)", "blocked_by": "Owner commercial decision"},
            {"id": "MAN-FREEZE-SIGNOFF", "priority": "P1", "owner": True, "item": "Owner attestation on TTG-GOVERNANCE-FREEZE-CERTIFICATE.md §4", "blocked_by": "Owner signature"},
            {"id": "MAN-SEPOLIA-V11", "priority": "P0", "owner": True, "item": "Sepolia Governor V1.1 upgrade (cap_disabled) via Timelock · chain_id=11155111 only", "blocked_by": "Owner authorization + post-vesting decision"},
            {"id": "MAN-SEPOLIA-ONCHAIN", "priority": "P1", "owner": False, "item": "Sepolia deployed Governor may still read maxVotingPowerPerAddressBps=400 until upgrade", "blocked_by": "On-chain upgrade not executed"},
            {"id": "MAN-MAINNET-PREP", "priority": "P1", "owner": True, "item": "Mainnet address registry · multisig · deployment manifest · vesting deploy", "blocked_by": "Phase ③ gates"},
        ]
    )

    fail = [c for c in checks if c["status"] == "FAIL"]
    warn = [c for c in checks if c["status"] == "WARN"]
    if fail:
        verdict = "FAIL"
    elif warn:
        verdict = "WARN"
    else:
        verdict = "PASS"

    for f in fail:
        if f.get("risk") == "P0":
            blockers.append({"id": f["id"], "risk": "P0", "detail": f.get("detail")})

    report = {
        "audit_id": AUDIT_ID,
        "stamp_utc": STAMP,
        "phase": "① local alignment",
        "framework": "Governance Framework V1.1 FROZEN",
        "verdict": verdict,
        "summary": {
            "pass": sum(1 for c in checks if c["status"] == "PASS"),
            "warn": len(warn),
            "fail": len(fail),
            "manual_actions": len(manual),
            "blockers": len(blockers),
        },
        "checks": checks,
        "drift_findings": drift,
        "manual_action_checklist": manual,
        "blockers": blockers,
        "re_freeze_recommendation": {
            "action": "MAINTAIN TTG-GOVERNANCE-FREEZE-CERTIFICATE v1.1",
            "note": "No further governance rule edits; next changes via GOV-02 proposal only",
            "after_owner_vesting": "Bump Certificate patch + re-run this audit before Sepolia V1.1",
        },
        "honest_boundary": "① alignment PASS ≠ ② Sepolia on-chain V1.1 ≠ ③ Production GO",
    }

    (EVID / "web3-production-grade-alignment-audit.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    latest = ROOT / "evidence/GO_web3_production_grade_alignment_audit/WEB3-PRODUCTION-GRADE-ALIGNMENT-AUDIT-LATEST.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(report, indent=2), encoding="utf-8")

    md = [
        "# Web3 Production-Grade Alignment Audit — Latest",
        "",
        f"**Audit ID:** `{AUDIT_ID}` · **Verdict:** `{verdict}` · **Stamp:** `{STAMP}`",
        "",
        "## Summary",
        "",
        f"- PASS: {report['summary']['pass']} · WARN: {report['summary']['warn']} · FAIL: {report['summary']['fail']}",
        f"- Manual actions: {report['summary']['manual_actions']} · Blockers: {report['summary']['blockers']}",
        "",
        "## Checks",
        "",
    ]
    for c in checks:
        md.append(f"- **{c['status']}** `{c['id']}` ({c.get('risk', '—')})")
    md.extend(["", "## Manual Action Checklist (not simulated)", ""])
    for m in manual:
        md.append(f"- **[{m['priority']}]** `{m['id']}` — {m['item']} · *{m['blocked_by']}*")
    md.extend(["", "## Drift findings", ""])
    if drift:
        for d in drift[:10]:
            md.append(f"- `{d['path']}` · {d['pattern']}")
    else:
        md.append("- None in active tree (worktrees/evidence excluded).")
    md.extend(["", "## Re-freeze recommendation", "", report["re_freeze_recommendation"]["note"], ""])
    (ROOT / "docs/spec/governance-token/WEB3-PRODUCTION-GRADE-ALIGNMENT-AUDIT-LATEST.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"WEB3_PRODUCTION_GRADE_ALIGNMENT_AUDIT: {verdict}")
    print(f"TT_WEB3_ALIGN_SUMMARY: {verdict} pass={report['summary']['pass']} fail={report['summary']['fail']} warn={report['summary']['warn']}")
    return 0 if verdict != "FAIL" else 1


if __name__ == "__main__":
    sys.exit(main())
