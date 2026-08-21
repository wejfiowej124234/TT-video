#!/usr/bin/env python3
"""V9 Canonical Baseline Cleanup — demote old Remint/R2 ACTIVE pointers; Design Lock sole ACTIVE.

Does NOT delete historical evidence bytes. Does NOT flip TT_PRODUCTION_GO. Does NOT Mainnet broadcast.
Does NOT mutate V9_AUDIT_CANDIDATE_DESIGN_LOCK freeze bytes (caller must re-freeze separately after code remediations).
"""
from __future__ import annotations

import hashlib
import json
import re
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_ttg_v9_audit"
DESIGN_LOCK = "V9_AUDIT_CANDIDATE_DESIGN_LOCK"
SUCCESSOR = DESIGN_LOCK

LEGACY_STAMPS = [
    "evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_R2_FINAL_MANIFEST.json",
    "evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_R1_FINAL_MANIFEST.json",
    "evidence/GO_ttg_v9_audit/V9_AUDIT_CANDIDATE_MANIFEST.json",
    "evidence/GO_ttg_v9_audit/V9_PRE_MAINNET_SECURITY_PASS.json",
    "evidence/GO_ttg_v9_audit/V9_MAINNET_READY_STOP.json",
    "evidence/GO_ttg_v9_audit/V9_MAINNET_CUTOVER_AUTH_READY_STOP.json",
    "evidence/GO_ttg_v9_audit/V9_OWNER_MAINNET_DEPLOY_AUTHORIZATION_RECORDED.json",
    "evidence/GO_ttg_v9_audit/V9_SEPOLIA_REGRESSION2_PASS.json",
    "evidence/GO_ttg_v9_audit/V9_SEPOLIA_REGRESSION_PASS.json",
    "evidence/GO_ttg_v9_audit/V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS.json",
    "evidence/GO_ttg_v9_audit/V9_EXTERNAL_FIRM_AUDIT_PACK_R2_FINAL.json",
    "evidence/GO_ttg_v9_remint_sepolia/V9_REMINT_SEPOLIA_PASS_STOP.json",
]

LEGACY_SCRIPTS = [
    "scripts/dev/run-ttg-v9-remint-sepolia.sh",
    "scripts/dev/run-ttg-v9-remint-sepolia-continue.sh",
    "scripts/dev/run-ttg-v9-sepolia-regression.sh",
    "scripts/dev/run-ttg-v9-sepolia-regression2.sh",
    "scripts/dev/run-ttg-v9-full-topology-audit.sh",
    "scripts/dev/freeze-ttg-v9-audit-candidate.py",
    "scripts/dev/stamp-ttg-v9-pre-mainnet-security-pass.py",
    "scripts/dev/stamp-ttg-v9-mainnet-cutover-auth-ready-stop.py",
    "scripts/dev/lock-ttg-v9-external-firm-audit-pack.py",
]

REFUSE_SNIPPET_SH = r'''
# SUPERSEDED_AS_OFFICIAL_V9_ENTRY — Design Lock is sole ACTIVE (V9_AUDIT_CANDIDATE_DESIGN_LOCK).
# Historical Remint/R2 path. DO_NOT_USE for Official deploy/audit/cutover unless override.
if [[ "${TTG_V9_ALLOW_LEGACY_R2_REMINT:-0}" != "1" ]]; then
  echo "LEGACY_R2_REMINT_REFUSED: set TTG_V9_ALLOW_LEGACY_R2_REMINT=1 only for historical replay" >&2
  exit 2
fi
'''

REFUSE_SNIPPET_PY = '''
# SUPERSEDED_AS_OFFICIAL_V9_ENTRY — Design Lock is sole ACTIVE.
import os, sys
if os.environ.get("TTG_V9_ALLOW_LEGACY_R2_REMINT", "0") != "1":
    print("LEGACY_R2_REMINT_REFUSED: set TTG_V9_ALLOW_LEGACY_R2_REMINT=1 only for historical replay", file=sys.stderr)
    raise SystemExit(2)
'''

# Patterns that must NOT appear as ACTIVE in living entry scripts without refuse guard
ACTIVE_RISK_PATTERNS = [
    (r"CANDIDATE_ID=\"\$\{TTG_V9_CANDIDATE_ID:-V9_AUDIT_CANDIDATE_R2_FINAL\}\"", "scripts"),
    (r'default="V9_AUDIT_CANDIDATE_R2_FINAL"', "scripts"),
]


def sha256(p: Path) -> str:
    return "sha256:" + hashlib.sha256(p.read_bytes()).hexdigest()


def write_sidecar(rel: str) -> Path | None:
    p = ROOT / rel
    if not p.is_file():
        return None
    side = p.with_name(p.name + ".SUPERSEDED.json")
    payload = {
        "status": "SUPERSEDED_AS_ACTIVE_AUDIT_BASELINE",
        "do_not_use": True,
        "reason": "Official ACTIVE V9 baseline is Design Lock (Fee/Root/Stake/NEW Timelock/NEW Pool)",
        "successor_candidate": SUCCESSOR,
        "original_artifact": rel.replace("\\", "/"),
        "original_sha256": sha256(p),
        "superseded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "inherits_to_design_lock_pass": False,
        "mainnet_broadcast": "FORBIDDEN",
        "tt_production_go": "UNCHANGED",
    }
    side.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return side


def ensure_refuse_guard(rel: str) -> bool:
    p = ROOT / rel
    if not p.is_file():
        return False
    text = p.read_text(encoding="utf-8")
    if "LEGACY_R2_REMINT_REFUSED" in text or "SUPERSEDED_AS_OFFICIAL_V9_ENTRY" in text:
        return False
    if rel.endswith(".py"):
        # After shebang + optional module docstring
        m = re.match(r"(#!.*\n)?(\"\"\"[\s\S]*?\"\"\"\n)", text)
        if m:
            text = text[: m.end()] + REFUSE_SNIPPET_PY + text[m.end() :]
        else:
            text = REFUSE_SNIPPET_PY + text
        p.write_text(text, encoding="utf-8")
    else:
        if "set -euo pipefail" in text:
            text = text.replace("set -euo pipefail\n", "set -euo pipefail\n" + REFUSE_SNIPPET_SH, 1)
        else:
            lines = text.splitlines(keepends=True)
            insert_at = 1 if lines and lines[0].startswith("#!") else 0
            text = "".join(lines[:insert_at]) + REFUSE_SNIPPET_SH + "".join(lines[insert_at:])
        p.write_text(text, encoding="utf-8")
    return True


def patch_registry() -> None:
    reg = ROOT / "registry" / "ttg-v9-upgrade-design.v1.yaml"
    if not reg.is_file():
        return
    text = reg.read_text(encoding="utf-8")
    # Prepend living pointer block if missing
    banner = (
        "# LIVING ACTIVE (2026-08-21 Design Lock cleanup):\n"
        "#   active_audit_candidate: V9_AUDIT_CANDIDATE_DESIGN_LOCK\n"
        "#   Remint/R1/R2_FINAL stamps below = LEGACY/SUPERSEDED/DO_NOT_USE for Official gates\n"
        "#   sepolia living: evidence/GO_ttg_v9_design_lock_sepolia/V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json\n"
        "#   Owner Design Lock SSOT: docs/runbook/TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md\n"
    )
    if "active_audit_candidate: V9_AUDIT_CANDIDATE_DESIGN_LOCK" not in text:
        text = banner + text
    text = re.sub(
        r"^status: V9_AUDIT_CANDIDATE_R1\s*$",
        "status: SUPERSEDED_REMINT_R1_SEE_DESIGN_LOCK\nactive_audit_candidate: V9_AUDIT_CANDIDATE_DESIGN_LOCK\n"
        "active_sepolia_stamp: evidence/GO_ttg_v9_design_lock_sepolia/V9_DESIGN_LOCK_SEPOLIA_PASS_STOP.json\n"
        "legacy_status: LEGACY_DO_NOT_USE_FOR_OFFICIAL_V9",
        text,
        count=1,
        flags=re.M,
    )
    reg.write_text(text, encoding="utf-8")


def patch_key_docs() -> list[str]:
    updated = []
    patches = {
        "docs/runbook/TT-TTG-V9-OWNER-MAINNET-GATE-LATEST.md": (
            "**STATUS:** `OWNER_GATE_ACTIVE`",
            "**STATUS:** `SUPERSEDED_AS_ACTIVE_AUDIT_BASELINE` · living Official V9 = "
            "`V9_AUDIT_CANDIDATE_DESIGN_LOCK` · **DO_NOT_USE** R2_FINAL / KEEP Safe-Timelock for Design Lock cutover\n\n"
            "> **Historical note (frozen body below):** previously `OWNER_GATE_ACTIVE` on R2_FINAL. "
            "R2 PASS does **not** inherit. Next = Design Lock 3× AI audits → new Mainnet Cutover Review.",
        ),
        "docs/runbook/TT-TTG-V9-SECURITY-AUDIT-LADDER-LATEST.md": (
            "**STATUS:** `AUDIT_LADDER_BINDING`",
            "**STATUS:** `AUDIT_LADDER_BINDING` · **ACTIVE candidate = `V9_AUDIT_CANDIDATE_DESIGN_LOCK`** · "
            "R2_FINAL / Remint ladder position = **SUPERSEDED historical**\n\n"
            "> Freeze tooling (ACTIVE): `python scripts/dev/freeze-ttg-v9-audit-candidate-design-lock.py` · "
            "old `freeze-ttg-v9-audit-candidate.py` = LEGACY refuse unless override.",
        ),
        "docs/runbook/TT-TTG-V9-MAINNET-DEPLOY-AUTHORIZATION-AWAIT-LATEST.md": (
            "**Frozen (do not edit):** `V9_AUDIT_CANDIDATE_R2_FINAL`",
            "**STATUS:** `SUPERSEDED_AS_ACTIVE_AUTH_TEMPLATE` · living auth must name "
            "`V9_AUDIT_CANDIDATE_DESIGN_LOCK` + NEW Solo Timelock / NEW Project Pool (no Safe admin)\n\n"
            "**Historical frozen (do not edit):** `V9_AUDIT_CANDIDATE_R2_FINAL`",
        ),
        "docs/runbook/TT-TTG-V9-PRE-MAINNET-FINAL-SECURITY-AUDIT-LATEST.md": (
            "**Candidate (only):** `V9_AUDIT_CANDIDATE_R2_FINAL`",
            "**STATUS:** `SUPERSEDED_AS_ACTIVE_SECURITY_GATE` · living security gate = Design Lock 3× AI audits\n\n"
            "**Historical Candidate (only):** `V9_AUDIT_CANDIDATE_R2_FINAL`",
        ),
        "docs/runbook/TT-TTG-V9-OFFICIAL-FULL-TOPOLOGY-AUDIT-LATEST.md": (
            "**STATUS:**",
            "**STATUS:** `SUPERSEDED_AS_ACTIVE_TOPOLOGY_MATRIX` · living topology = Design Lock "
            "(NEW Timelock/Pool/FeeRouter/RoleStake) · KEEP EF/SR retarget only\n\n**Historical STATUS:**",
        ),
        "docs/runbook/TT-TTG-V9-EXTERNAL-FIRM-AUDIT-PACK-LATEST.md": (
            "# TT · TTG V9 External Firm Audit Pack (R2_FINAL · LOCKED)",
            "# TT · TTG V9 External Firm Audit Pack (R2_FINAL · **SUPERSEDED**)\n\n"
            "**STATUS:** `SUPERSEDED_AS_ACTIVE_FIRM_PACK` · firm pack MUST target "
            "`V9_AUDIT_CANDIDATE_DESIGN_LOCK` only · R2 pack = DO_NOT_USE for Official Mainnet claim\n\n"
            "# Historical title: External Firm Audit Pack (R2_FINAL · LOCKED)",
        ),
        "docs/runbook/TT-TTG-V9-FULL-25T-REMINT-DESIGN-LATEST.md": (
            "**STATUS:**",
            "**STATUS:** `LEGACY_MONETARY_NORM_REFERENCE` · Official topology SSOT = "
            "[Owner Design Lock](TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md) · remint script = DO_NOT_USE entry\n\n"
            "**Historical STATUS:**",
        ),
        "docs/runbook/TT-TTG-V9-DESIGN-LOCK-LOCAL-PASS-LATEST.md": (
            "| Sepolia lifecycle · new Audit Candidate · 3× AI audits | **Not started** · R2_FINAL PASS **not inherited** |",
            "| Sepolia lifecycle · Audit Candidate · 3× AI audits | **Sepolia PASS + `V9_AUDIT_CANDIDATE_DESIGN_LOCK` FROZEN** · R2_FINAL PASS **not inherited** |",
        ),
    }
    for rel, (old, new) in patches.items():
        p = ROOT / rel
        if not p.is_file():
            continue
        text = p.read_text(encoding="utf-8")
        if "SUPERSEDED_AS_ACTIVE" in text[:800] and rel != "docs/runbook/TT-TTG-V9-DESIGN-LOCK-LOCAL-PASS-LATEST.md":
            continue
        if old in text:
            p.write_text(text.replace(old, new, 1), encoding="utf-8")
            updated.append(rel)
    return updated


def scan_old_active_refs() -> list[str]:
    """Fail if living entry scripts still default to R2 without refuse."""
    hits = []
    for rel in LEGACY_SCRIPTS:
        p = ROOT / rel
        if not p.is_file():
            continue
        text = p.read_text(encoding="utf-8")
        if "LEGACY_R2_REMINT_REFUSED" not in text and "SUPERSEDED_AS_OFFICIAL_V9_ENTRY" not in text:
            hits.append(f"NO_REFUSE_GUARD:{rel}")
    # Registry must point Design Lock
    reg = (ROOT / "registry" / "ttg-v9-upgrade-design.v1.yaml").read_text(encoding="utf-8")
    if "active_audit_candidate: V9_AUDIT_CANDIDATE_DESIGN_LOCK" not in reg:
        hits.append("REGISTRY_MISSING_DESIGN_LOCK_ACTIVE")
    # Candidate must exist
    cand = EV / "V9_AUDIT_CANDIDATE_DESIGN_LOCK.json"
    if not cand.is_file():
        hits.append("MISSING_DESIGN_LOCK_CANDIDATE")
    else:
        d = json.loads(cand.read_text(encoding="utf-8"))
        if d.get("candidate_id") != DESIGN_LOCK:
            hits.append("BAD_CANDIDATE_ID")
        if d.get("inherits_r2_final_audit_pass") is not False:
            hits.append("CANDIDATE_INHERITS_R2")
    return hits


def main() -> None:
    EV.mkdir(parents=True, exist_ok=True)
    sidecars = []
    for rel in LEGACY_STAMPS:
        s = write_sidecar(rel)
        if s:
            sidecars.append(str(s.relative_to(ROOT)).replace("\\", "/"))

    guarded = []
    for rel in LEGACY_SCRIPTS:
        if ensure_refuse_guard(rel):
            guarded.append(rel)

    patch_registry()
    docs = patch_key_docs()

    hits = scan_old_active_refs()
    index = {
        "schema": "traveltrust.ttg_v9_legacy_supersession.v1",
        "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "successor_candidate": SUCCESSOR,
        "status": "LEGACY_SUPERSESSION_INDEX",
        "sidecars": sidecars,
        "refuse_guards_applied": guarded,
        "docs_patched": docs,
        "do_not_delete_original_bytes": True,
        "mainnet_broadcast": "FORBIDDEN",
        "tt_production_go": "UNCHANGED",
        "r2_final_pass_inherits": False,
    }
    (EV / "V9_LEGACY_SUPERSESSION_INDEX.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")

    clean = {
        "stamp": "V9_CANONICAL_BASELINE_CLEAN_PASS",
        "issued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "active_candidate": SUCCESSOR,
        "active_baseline": "TT-TTG-V9-OWNER-DESIGN-LOCK + V9_DESIGN_LOCK_LOCAL_PASS + V9_DESIGN_LOCK_SEPOLIA_PASS_STOP",
        "OLD_V9_ACTIVE_REFERENCES": len(hits),
        "old_v9_active_hits": hits,
        "legacy_supersession_index": "evidence/GO_ttg_v9_audit/V9_LEGACY_SUPERSESSION_INDEX.json",
        "inherits_r2_final_audit_pass": False,
        "mainnet_broadcast": "FORBIDDEN",
        "tt_production_go": "UNCHANGED",
        "verdict": "PASS" if not hits else "FAIL",
        "next": "AI Audit #1/#2/#3 on V9_AUDIT_CANDIDATE_DESIGN_LOCK only",
    }
    out = EV / "V9_CANONICAL_BASELINE_CLEAN_PASS.json"
    if hits:
        out = EV / "V9_CANONICAL_BASELINE_CLEAN_FAIL.json"
    out.write_text(json.dumps(clean, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(clean, indent=2))
    if hits:
        raise SystemExit(2)
    print("V9_CANONICAL_BASELINE_CLEAN_PASS")


if __name__ == "__main__":
    main()
