#!/usr/bin/env bash
# Phase-2 residual check: U01-U03 + P01-P04 + living ACTIVE pointers → Candidate v2
# Exit 0 = residual 0 · exit 1 = open residuals
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
export PYTHONIOENCODING=utf-8
OUT="${1:-evidence/GO_web3_candidate_v2/WEB3-BASELINE-MIGRATION-V2-PHASE2-RESIDUAL-LATEST.json}"
mkdir -p "$(dirname "$OUT")"
PY="/c/Users/plant/AppData/Local/Programs/Python/Python313/python"
[[ -x "$PY" ]] || PY=python

"$PY" - "$ROOT" "$OUT" <<'PY'
import json, re, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(sys.argv[1])
OUT = Path(sys.argv[2])
residuals = []

def need(cond, id_, path, detail):
    if not cond:
        residuals.append({"id": id_, "path": path, "detail": detail, "class": "OPEN_RESIDUAL"})

# U01 — UI gates use getActiveEscrowFactoryAddress
for rel in [
    "frontend/components/escrow/EscrowDetail/index.tsx",
    "frontend/components/escrow/EscrowDetail/EscrowDetailProtocolTailTxModalAndEscrowCreation.tsx",
    "frontend/app/escrow/[id]/chain/EscrowChainPageMain.tsx",
]:
    t = (ROOT / rel).read_text(encoding="utf-8", errors="replace")
    need("getActiveEscrowFactoryAddress" in t and "getEscrowFactoryAddress()" not in t.replace("getActiveEscrowFactoryAddress()", ""),
         "U01", rel, "must gate on getActiveEscrowFactoryAddress only")

# U03 — i18n V2
for rel in ["frontend/locales/zh.ts", "frontend/locales/en.ts"]:
    t = (ROOT / rel).read_text(encoding="utf-8", errors="replace")
    # only check NeedConfig strings near factory
    need("ESCROW_FACTORY_V2_ADDRESS" in t,
         "U03", rel, "escrow_factoryCreateNeedConfig must cite V2 env")
    # fail if NeedConfig still only cites V1 without V2
    m = re.search(r"escrow_factoryCreateNeedConfig:\s*\n?\s*\"([^\"]+)\"", t)
    if m and "ESCROW_FACTORY_ADDRESS" in m.group(1) and "V2" not in m.group(1):
        residuals.append({"id": "U03", "path": rel, "detail": "NeedConfig still V1-only", "class": "OPEN_RESIDUAL"})

# P01 — identity expected_sha Candidate (FINAL RELEASE tip)
TIP = "97289a7185610ef0ad8822f0af04bfa533e42986"
dep = (ROOT / "registry/deployment-identity-gate.v1.yaml").read_text(encoding="utf-8")
need(TIP in dep, "P01", "registry/deployment-identity-gate.v1.yaml", "expected_sha must be FINAL RELEASE tip")
need("PSG-REL-20260720-WEB3-CAND-V2" in dep, "P01", "registry/deployment-identity-gate.v1.yaml", "must cite Candidate pin")
# living CERTIFICATION_FREEZE must not use FG-15-A as expected_sha
need(not re.search(r"CERTIFICATION_FREEZE:\s*\n\s+expected_sha:\s*\"09c72b93", dep),
     "P01", "registry/deployment-identity-gate.v1.yaml", "CERTIFICATION_FREEZE must not expect 09c72b93")

idpy = (ROOT / "scripts/dev/run-deployment-identity-gate.py").read_text(encoding="utf-8")
need(f'FREEZE_SHA = "{TIP}"' in idpy, "P01", "scripts/dev/run-deployment-identity-gate.py", "FREEZE_SHA FINAL RELEASE tip")
need("tt_refuse_historical_baseline" not in idpy, "P01", "scripts/dev/run-deployment-identity-gate.py", "living gate must not refuse by default")

# P02 dual-track
dual = (ROOT / "docs/runbook/TT-PSG-DUAL-TRACK-RELEASE-STAGING-PATCH-LATEST.md").read_text(encoding="utf-8")
need("PSG-REL-20260720-WEB3-CAND-V2" in dual and "FG-15-B" in dual, "P02", "TT-PSG-DUAL-TRACK…", "Track A must be Candidate/FG-15-B")
need("HEAD 必须 = Candidate freeze" in dual or "97289a71" in dual or "652bbab51a1e" in dual, "P02", "TT-PSG-DUAL-TRACK…", "CERTIFICATION_FREEZE rule Candidate")
need("观察对象固定 `09c72b93`" not in dual, "P02", "TT-PSG-DUAL-TRACK…", "must not fix observation on 09c72b93")

# P03 release SSOT §4
ssot = (ROOT / "docs/runbook/TT-PSG-RELEASE-SOURCE-OF-TRUTH-LATEST.md").read_text(encoding="utf-8")
need("Active Version = `09c72b93`" not in ssot, "P03", "TT-PSG-RELEASE-SOURCE-OF-TRUTH…", "§4 must not say Active=09c72b93")
need("PSG-REL-20260720-WEB3-CAND-V2" in ssot, "P03", "TT-PSG-RELEASE-SOURCE-OF-TRUTH…", "must cite Candidate")

# P04 patch tip
patch = (ROOT / "docs/runbook/TT-PSG-PATCH-PROMOTION-GATE-LATEST.md").read_text(encoding="utf-8")
ledger = (ROOT / "docs/runbook/TT-STAGING-PATCH-LEDGER-LATEST.md").read_text(encoding="utf-8")
need("PSG-REL-20260720-WEB3-CAND-V2" in patch, "P04", "TT-PSG-PATCH-PROMOTION…", "tip Candidate")
need("当前 tip | `09c72b93`" not in patch, "P04", "TT-PSG-PATCH-PROMOTION…", "tip must not be 09c72b93")
need(("97289a71" in ledger or "652bbab51a1e" in ledger) and "PSG-REL-20260720-WEB3-CAND-V2" in ledger, "P04", "TT-STAGING-PATCH-LEDGER…", "freeze tip Candidate")

# PCD active
pcd = (ROOT / "registry/protocol-convergence-deployments.v1.yaml").read_text(encoding="utf-8")
need(re.search(r"^active_deploy_baseline:\s*v311_fund_safety_candidate_v2\s*$", pcd, re.M),
     "PCD", "protocol-convergence-deployments.v1.yaml", "active_deploy_baseline Candidate")

# Hard Gate still refused
hg = ROOT / "registry/mainnet-cutover-hard-gate.v1.yaml"
if hg.exists():
    t = hg.read_text(encoding="utf-8")
    need("current_verdict: REFUSED" in t or "CUTOVER_REFUSED" in t or "verdict: REFUSED" in t or "REFUSED" in t,
         "HG", str(hg), "Hard Gate must stay REFUSED")

report = {
    "schema": "traveltrust.web3_baseline_migration_v2_phase2_residual.v1",
    "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "phase": "phase2_u01_u03_p01_p04",
    "active_ssot": "PSG-REL-20260720-WEB3-CAND-V2",
    "open_residual_count": len(residuals),
    "residuals": residuals,
    "verdict": "PASS" if not residuals else "FAIL",
    "hard_gate": "CUTOVER_REFUSED",
    "psg_recalculate": "NOT_EXECUTED",
}
OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"phase2-residual: wrote {OUT}")
print(f"phase2-residual: verdict={report['verdict']} open={report['open_residual_count']}")
for r in residuals:
    print(f"  OPEN {r['id']} {r['path']}: {r['detail']}")
sys.exit(0 if not residuals else 1)
PY
