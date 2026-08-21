#!/usr/bin/env python3
"""V9 documentation truth convergence gate (phase-2).

OLD_V9_ACTIVE_DOCUMENT_REFERENCES must reach 0 for FULL_CONVERGENCE_PASS.
Also reports ACTIVE_TRUTH_CONFLICTS and UNRESOLVED_V9_DOC_DRIFT (aliases of residue classes).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCAN = ROOT / "evidence/GO_ttg_v9_audit/V9_DOC_TRUTH_CONVERGENCE_SCAN.json"
BASELINE = ROOT / "evidence/GO_ttg_v9_audit/V9_DOCUMENTATION_TRUTH_BASELINE.json"
PASS = ROOT / "evidence/GO_ttg_v9_audit/V9_DOCUMENTATION_FULL_CONVERGENCE_PASS.json"
YAML = ROOT / "registry/ttg-v9-documentation-truth-baseline.v1.yaml"
DOC = ROOT / "docs/runbook/TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md"

ALLOW_PATHS = {
    "docs/runbook/TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md",
    "docs/runbook/TT-TTG-V9-DOCUMENTATION-TRUTH-CONVERGENCE-RESIDUE-LATEST.md",
    "docs/runbook/TT-TTG-V9-MAINNET-DL-R1-PHASE2-FREEZE-WAIT-LATEST.md",
    "docs/runbook/TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md",
    "docs/runbook/TT-TTG-V9-MAINNET-BROADCAST-PHASE1-STOP-LATEST.md",
    "docs/runbook/TT-TTG-V9-MAINNET-PRE-BROADCAST-FINAL-LATEST.md",
    "docs/runbook/TT-TTG-V9-OWNER-MAINNET-CUTOVER-FINAL-REVIEW-DESIGN-LOCK-LATEST.md",
    "registry/ttg-v9-documentation-truth-baseline.v1.yaml",
}

DEMOTE = re.compile(
    r"SUPERSEDED|LEGACY|DO_NOT_USE|DEMOTED|not inherited|非.?ACTIVE|EXIT|"
    r"非本波|非 living|非当前|DO NOT USE|historical only|LINEAGE|reference only|"
    r"降级|已退出|DOCUMENTATION_TRUTH_BASELINE|DEPLOYED_PENDING_CUTOVER|"
    r"TIMELOCK_CUTOVER_PENDING|DO_NOT_USE_AS_ACTIVE_TRUTH|HISTORICAL|"
    r"interim custody|does not cover|does not inherit|Forbidden:|≠\s*Safe|no Safe|"
    r"without Safe|forbid.*Safe|no globalStakers|退出 ACTIVE|Supersedes|"
    r"Mutate R2|old R2|not cover|≠\s*RegionVault",
    re.I,
)

HEADER_SKIP = re.compile(
    r"SUPERSEDED as Official ACTIVE|DO_NOT_USE for Official V9 ACTIVE|"
    r"LEGACY / SUPERSEDED / DO_NOT_USE|DO_NOT_USE_AS_ACTIVE_TRUTH|"
    r"HISTORICAL for Official V9 ACTIVE",
    re.I,
)


def _fp_skip(kind: str, window: str) -> bool:
    """Class-specific false-positive filters (demotion / negation)."""
    w = window
    if DEMOTE.search(w):
        return True
    if kind == "R2_FINAL_unmarked":
        if re.search(
            r"does not|do not|don'?t|Forbidden|Mutate|inherit|not cover|old `|old R2|≠|not claim",
            w,
            re.I,
        ):
            return True
    if kind == "globalStakers_unmarked":
        if re.search(
            r"no globalStakers|without globalStakers|exit|退出|supersede|not living|非.?运营|interim",
            w,
            re.I,
        ):
            return True
    if kind == "safe_v9_admin_unmarked":
        if re.search(
            r"no Safe|≠\s*Safe|without Safe|forbid|禁止.*Safe|not.*Safe|interim custody|one-shot",
            w,
            re.I,
        ):
            return True
    if kind == "sale_to_p4cap_unmarked":
        if re.search(
            r"never|≠|not\s+V9|LEGACY|SUPERSEDED|NEW ProjectPool|NEW Pool|not.*sale sink|forbidden",
            w,
            re.I,
        ):
            return True
    return False


def rescan() -> dict:
    roots = [ROOT / "docs/runbook", ROOT / "registry", ROOT / "docs/spec"]
    patterns = {
        "R2_FINAL_unmarked": re.compile(r"V9_AUDIT_CANDIDATE_R2_FINAL|\bR2_FINAL\b"),
        "globalStakers_unmarked": re.compile(r"globalStakers|35\.75\s*%"),
        "sale_to_p4cap_unmarked": re.compile(
            r"(公售|sale|USDC).{0,60}(P4Cap|0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF)|usdcTreasury.{0,40}P4Cap",
            re.I | re.S,
        ),
        "safe_v9_admin_unmarked": re.compile(
            r"(V9|Solo).{0,40}[Tt]imelock.{0,60}(Safe|0x96491aa894658ff7946506318c49F3c76b8f40e7)|"
            r"Timelock admin.{0,30}Safe",
            re.I | re.S,
        ),
        "fully_active_premature": re.compile(
            r"MAINNET_FULLY_ACTIVE|V9_FULLY_ACTIVE|FULLY.?ACTIVE.?V9", re.I
        ),
    }
    exclude_sub = ("SUPERSEDED", "ARCHIVED", "20260812", "V8-CYCLE", "HISTORICAL", ".bak")
    hits: dict[str, list] = {k: [] for k in patterns}
    files_scanned = 0
    for root in roots:
        if not root.exists():
            continue
        for p in root.rglob("*"):
            if not p.is_file() or p.suffix.lower() not in {".md", ".yaml", ".yml", ".json"}:
                continue
            if any(x in p.name for x in exclude_sub):
                continue
            rel = p.relative_to(ROOT).as_posix()
            if rel in ALLOW_PATHS or "DOCUMENTATION-TRUTH" in rel:
                continue
            try:
                if p.stat().st_size > 2_000_000:
                    continue
                text = p.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            head = "\n".join(text.splitlines()[:45])
            if HEADER_SKIP.search(head):
                continue
            files_scanned += 1
            for k, pat in patterns.items():
                for m in pat.finditer(text):
                    window = text[max(0, m.start() - 220) : m.end() + 220]
                    if _fp_skip(k, window):
                        continue
                    start = text.rfind("\n", 0, m.start()) + 1
                    end = text.find("\n", m.end())
                    if end < 0:
                        end = min(len(text), m.end() + 100)
                    hits[k].append({"path": rel, "snippet": text[start:end].strip()[:200]})
    files = {h["path"] for v in hits.values() for h in v}
    total = sum(len(v) for v in hits.values())
    # Conflict aliases for Owner exit criteria
    conflicts = (
        hits["sale_to_p4cap_unmarked"]
        + hits["globalStakers_unmarked"]
        + hits["safe_v9_admin_unmarked"]
        + hits["fully_active_premature"]
    )
    drift = hits["R2_FINAL_unmarked"] + hits["fully_active_premature"]
    return {
        "stamp": "V9_DOC_TRUTH_CONVERGENCE_SCAN",
        "files_scanned": files_scanned,
        "files_with_unmarked_hits": len(files),
        "OLD_V9_ACTIVE_DOCUMENT_REFERENCES": total,
        "ACTIVE_TRUTH_CONFLICTS": len(conflicts),
        "UNRESOLVED_V9_DOC_DRIFT": len(drift),
        "by_class": {k: len(v) for k, v in hits.items()},
        "hits": {k: v for k, v in hits.items()},
        "hit_files": sorted(files),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--require-zero", action="store_true")
    ap.add_argument("--report-only", action="store_true")
    ap.add_argument("--stamp-pass", action="store_true", help="Write FULL_CONVERGENCE_PASS when zero")
    args = ap.parse_args()

    scan = rescan()
    SCAN.parent.mkdir(parents=True, exist_ok=True)
    SCAN.write_text(json.dumps(scan, indent=2) + "\n", encoding="utf-8")

    n = scan["OLD_V9_ACTIVE_DOCUMENT_REFERENCES"]
    c = scan["ACTIVE_TRUTH_CONFLICTS"]
    d = scan["UNRESOLVED_V9_DOC_DRIFT"]
    zero = n == 0 and c == 0 and d == 0

    baseline = {
        "stamp": "V9_DOCUMENTATION_TRUTH_BASELINE",
        "status": "CONVERGENCE_PASS" if zero else "CONVERGENCE_ACTIVE",
        "candidate": "V9_AUDIT_CANDIDATE_DESIGN_LOCK",
        "remediation_wave": "DL_R1",
        "mainnet_status": "DEPLOYED_PENDING_CUTOVER",
        "tt_production_go": "NO_GO",
        "doc": DOC.relative_to(ROOT).as_posix(),
        "registry": YAML.relative_to(ROOT).as_posix(),
        "OLD_V9_ACTIVE_DOCUMENT_REFERENCES": n,
        "ACTIVE_TRUTH_CONFLICTS": c,
        "UNRESOLVED_V9_DOC_DRIFT": d,
        "scan": SCAN.relative_to(ROOT).as_posix(),
        "forbid": [
            "mutate_DL_R1_sources",
            "redeploy_or_swap_phase1_addresses",
            "live_param_edit",
            "TT_PRODUCTION_GO_flip",
            "claim_MAINNET_FULLY_ACTIVE",
            "whitepaper_github_www_before_full_convergence_pass",
        ],
    }
    BASELINE.write_text(json.dumps(baseline, indent=2) + "\n", encoding="utf-8")

    summary = {
        k: scan[k]
        for k in [
            "files_scanned",
            "files_with_unmarked_hits",
            "OLD_V9_ACTIVE_DOCUMENT_REFERENCES",
            "ACTIVE_TRUTH_CONFLICTS",
            "UNRESOLVED_V9_DOC_DRIFT",
            "by_class",
        ]
    }
    print(json.dumps(summary, indent=2))

    if zero and (args.stamp_pass or args.require_zero):
        pass_doc = {
            "stamp": "V9_DOCUMENTATION_FULL_CONVERGENCE_PASS",
            "candidate": "V9_AUDIT_CANDIDATE_DESIGN_LOCK",
            "remediation_wave": "DL_R1",
            "mainnet_status": "DEPLOYED_PENDING_CUTOVER",
            "aliases": ["MAINNET_DEPLOYED_PHASE1", "TIMELOCK_CUTOVER_PENDING"],
            "forbid_claim": ["MAINNET_FULLY_ACTIVE", "ACTIVE_OFFICIAL"],
            "OLD_V9_ACTIVE_DOCUMENT_REFERENCES": 0,
            "ACTIVE_TRUTH_CONFLICTS": 0,
            "UNRESOLVED_V9_DOC_DRIFT": 0,
            "documentation_upstream": DOC.relative_to(ROOT).as_posix(),
            "tt_production_go": "NO_GO",
            "downstream_still_forbidden_until_owner": [
                "Mainnet_Edition_Whitepaper",
                "GitHub_Official_Docs",
                "Official_www_V9_copy",
                "Production_meta_Indexer_cutover",
            ],
            "stop": True,
        }
        PASS.write_text(json.dumps(pass_doc, indent=2) + "\n", encoding="utf-8")
        print("V9_DOCUMENTATION_FULL_CONVERGENCE_PASS")

    if args.report_only:
        return 0
    if args.require_zero and not zero:
        print(
            f"STOP refs={n} conflicts={c} drift={d} (require all 0)",
            file=sys.stderr,
        )
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
