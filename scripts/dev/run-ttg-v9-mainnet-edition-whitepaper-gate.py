#!/usr/bin/env python3
"""TTG V9 Mainnet Edition Whitepaper gate.

Requires:
  WHITEPAPER_ACTIVE_TRUTH_CONFLICTS == 0
  LEGACY_ACTIVE_LEAKS == 0
  V9_BASELINE_COVERAGE == 100%

Does not mutate DL_R1 / Phase1 addresses / chain params / TT_PRODUCTION_GO.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MATRIX = ROOT / "registry/ttg-v9-mainnet-edition-whitepaper-fact-matrix.v1.yaml"
SCAN = ROOT / "evidence/GO_ttg_v9_audit/TTG_V9_MAINNET_EDITION_WHITEPAPER_SCAN.json"
PASS = ROOT / "evidence/GO_ttg_v9_audit/TTG_V9_MAINNET_EDITION_WHITEPAPER_PASS.json"
ZH = ROOT / "docs/whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-LATEST.md"
EN = ROOT / "docs/whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-EN-LATEST.md"

# Minimal YAML subset reader (no PyYAML dependency)
COVERAGE_IDS = [
    ("protocol_positioning", [r"协议定位", r"Protocol positioning"]),
    ("supply_25t_nomint", [r"25T|25,000,000,000,000|NO-MINT"]),
    ("genesis_50_35_3_5_7", [r"50\s*/\s*35\s*/\s*3\s*/\s*5\s*/\s*7|50/35/3/5/7"]),
    ("five_batch_primary_market", [r"五批|five Norm batches|Five Norm"]),
    ("sale_usdc_project_pool", [r"USDC\s*→\s*NEW ProjectPool|Sale USDC\s*→\s*NEW ProjectPool|公售 USDC\s*→\s*NEW ProjectPool"]),
    ("platform_fee_5pct", [r"500 bps|\b5%"]),
    ("steward_45_55", [r"45%"]),
    ("no_steward_100_pool", [r"100%"]),
    ("access_fee_300k", [r"300,000 USDC|300k"]),
    ("role_stake_live_supply", [r"totalSupply\(\)|live TTG\.totalSupply\(\)"]),
    ("merchant_guide_disabled", [r"DISABLED"]),
    ("p4_90d_30pct", [r"90|30%"]),
    ("governance_burn", [r"Governance Burn|治理 Burn"]),
    ("governor_solo_timelock_48h", [r"48h|SoloTimelock"]),
    ("periphery_upgradeable_token_nomint", [r"外围|Periphery|NO-MINT"]),
    ("new_keep_legacy", [r"NEW\s*/\s*KEEP\s*/\s*LEGACY|NEW/KEEP/LEGACY"]),
    ("security_model", [r"安全模型|Security model"]),
    ("legacy_policy_v8_old_v9", [r"Legacy Policy"]),
    ("mainnet_phase1_status", [r"MAINNET_DEPLOYED_PHASE1|TIMELOCK_CUTOVER_PENDING|DEPLOYED_PENDING_CUTOVER"]),
    ("phase1_ttg_address", [r"0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9"]),
    ("phase1_project_pool", [r"0x7B21b421981A3B61cc08c8E22D4fd690E457Df37"]),
    ("phase1_fee_router", [r"0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970"]),
    ("keep_escrow_factory", [r"0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6"]),
    ("demote_globalStakers", [r"globalStakers"]),
    ("demote_legacy_p4cap", [r"P4Cap|0xfB906"]),
    ("demote_safe_admin", [r"\bSafe\b"]),
    ("demote_r2_final", [r"R2_FINAL"]),
    ("no_production_go", [r"TT_PRODUCTION_GO|NO_GO"]),
]

ADDRS = [
    "0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9",
    "0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f",
    "0x7B21b421981A3B61cc08c8E22D4fd690E457Df37",
    "0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970",
    "0xe87378e49Ead2E1a422B8cae118d3C905Ee45B6C",
    "0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b",
    "0xA0DfC4C5C544488AfEfE696AfB8e5823911e5A9c",
    "0xf6A1Fb4435E463117a666818611F49D03F91E7A7",
    "0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6",
    "0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372",
]

DEMOTE = re.compile(
    r"LEGACY|SUPERSEDED|DO_NOT_USE|EXIT|HISTORICAL|one-shot|一次性|never|≠|NO\b|not living|not the V9",
    re.I,
)


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def _conflicts(text: str, label: str) -> list[dict]:
    out: list[dict] = []
    # Claiming Fully Active as current truth (must say NO / ≠ / not)
    for m in re.finditer(r"MAINNET_FULLY_ACTIVE|ACTIVE_OFFICIAL", text):
        window = text[max(0, m.start() - 120) : m.end() + 120]
        if re.search(r"\bNO\b|≠|not |禁止|不得|must not|Fully Active Official", window, re.I):
            continue
        out.append({"class": "fully_active_claim", "doc": label, "snippet": window.strip()[:160]})
    # Claiming Production GO issued
    for m in re.finditer(r"TT_PRODUCTION_GO\s*[:=]\s*GO\b|Production GO\s*[:=]\s*GO\b", text, re.I):
        out.append({"class": "production_go_flip", "doc": label, "snippet": text[m.start() : m.end() + 40]})
    # Sale USDC to P4Cap as active sink
    for m in re.finditer(
        r"(公售|sale|USDC).{0,40}(→|->|to).{0,20}(P4Cap|0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF)",
        text,
        re.I | re.S,
    ):
        window = text[max(0, m.start() - 80) : m.end() + 80]
        if DEMOTE.search(window) or re.search(r"never|永远不是|not the V9", window, re.I):
            continue
        out.append({"class": "sale_to_p4cap_active", "doc": label, "snippet": window.strip()[:160]})
    return out


def _leaks(text: str, label: str) -> list[dict]:
    out: list[dict] = []
    checks = [
        (
            "globalStakers_leak",
            r"globalStakers|35\.75\s*%",
            r"EXIT|LEGACY|DO_NOT_USE|无\s*globalStakers|No\s*globalStakers|≠|禁止|not living",
        ),
        (
            "r2_final_leak",
            r"\bR2_FINAL\b|V9_AUDIT_CANDIDATE_R2_FINAL",
            r"LEGACY|SUPERSEDED|DO_NOT_USE|must not|不得|冒充|not claimed|≠|无\s*R2|No\s*R2",
        ),
        (
            "safe_admin_leak",
            r"Timelock admin.{0,40}Safe|Safe.{0,40}(as V9 Official|Timelock admin)",
            r"LEGACY|no Safe|≠\s*Safe|禁止|No Safe",
        ),
        (
            "p4cap_active_sink",
            r"usdcTreasury.{0,30}P4Cap|sale.{0,30}sink.{0,20}P4Cap",
            r"LEGACY|never|DO_NOT_USE|not|永远不是",
        ),
    ]
    for cls, pat, need in checks:
        for m in re.finditer(pat, text, re.I | re.S):
            window = text[max(0, m.start() - 160) : m.end() + 160]
            if re.search(need, window, re.I):
                continue
            out.append({"class": cls, "doc": label, "snippet": window.strip()[:160]})
    return out


def _coverage(zh: str, en: str) -> tuple[float, list[str], list[str]]:
    missing: list[str] = []
    present: list[str] = []
    for cid, pats in COVERAGE_IDS:
        ok = False
        for p in pats:
            if re.search(p, zh, re.I) and re.search(p, en, re.I):
                ok = True
                break
            # bilingual pair: allow either pattern in each doc if list is bilingual
            if len(pats) >= 2 and re.search(pats[0], zh, re.I) and re.search(pats[1], en, re.I):
                ok = True
                break
            if len(pats) >= 2 and re.search(pats[1], zh, re.I) and re.search(pats[0], en, re.I):
                ok = True
                break
        # Also accept if same pattern hits both
        if not ok:
            for p in pats:
                if re.search(p, zh, re.I) and re.search(p, en, re.I):
                    ok = True
                    break
        if ok:
            present.append(cid)
        else:
            # Fallback: union of patterns across both docs for bilingual topics
            joined = zh + "\n" + en
            if any(re.search(p, joined, re.I) for p in pats) and (
                any(re.search(p, zh, re.I) for p in pats) and any(re.search(p, en, re.I) for p in pats)
            ):
                present.append(cid)
            else:
                missing.append(cid)
    pct = 100.0 * len(present) / max(1, len(COVERAGE_IDS))
    return pct, present, missing


def _addr_coverage(zh: str, en: str) -> list[str]:
    miss = []
    for a in ADDRS:
        if a not in zh or a not in en:
            miss.append(a)
    return miss


def scan() -> dict:
    zh = _read(ZH)
    en = _read(EN)
    conflicts = _conflicts(zh, "zh") + _conflicts(en, "en")
    leaks = _leaks(zh, "zh") + _leaks(en, "en")
    pct, present, missing = _coverage(zh, en)
    addr_miss = _addr_coverage(zh, en)
    # Address miss counts as coverage gap
    if addr_miss:
        for a in addr_miss:
            missing.append(f"addr:{a}")
        pct = 100.0 * len(present) / (len(COVERAGE_IDS) + len(ADDRS))
        # recompute properly
        covered = len(present) + (len(ADDRS) - len(addr_miss))
        total = len(COVERAGE_IDS) + len(ADDRS)
        pct = 100.0 * covered / total
    else:
        # include addrs in 100% denominator when all present
        covered = len(present) + len(ADDRS)
        total = len(COVERAGE_IDS) + len(ADDRS)
        pct = 100.0 * covered / total

    return {
        "stamp": "TTG_V9_MAINNET_EDITION_WHITEPAPER_SCAN",
        "docs": {
            "zh": ZH.relative_to(ROOT).as_posix(),
            "en": EN.relative_to(ROOT).as_posix(),
            "matrix": MATRIX.relative_to(ROOT).as_posix(),
        },
        "WHITEPAPER_ACTIVE_TRUTH_CONFLICTS": len(conflicts),
        "LEGACY_ACTIVE_LEAKS": len(leaks),
        "V9_BASELINE_COVERAGE": round(pct, 4),
        "coverage_present": present,
        "coverage_missing": missing,
        "address_missing": addr_miss,
        "conflicts": conflicts,
        "leaks": leaks,
        "mainnet_status": "DEPLOYED_PENDING_CUTOVER",
        "tt_production_go": "NO_GO",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--require-zero", action="store_true")
    ap.add_argument("--report-only", action="store_true")
    ap.add_argument("--stamp-pass", action="store_true")
    args = ap.parse_args()

    if not ZH.exists() or not EN.exists():
        print("missing whitepaper files", file=sys.stderr)
        return 2

    result = scan()
    SCAN.parent.mkdir(parents=True, exist_ok=True)
    SCAN.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    c = result["WHITEPAPER_ACTIVE_TRUTH_CONFLICTS"]
    l = result["LEGACY_ACTIVE_LEAKS"]
    cov = result["V9_BASELINE_COVERAGE"]
    ok = c == 0 and l == 0 and cov >= 100.0 - 1e-9

    summary = {
        "WHITEPAPER_ACTIVE_TRUTH_CONFLICTS": c,
        "LEGACY_ACTIVE_LEAKS": l,
        "V9_BASELINE_COVERAGE": cov,
        "coverage_missing": result["coverage_missing"],
        "address_missing": result["address_missing"],
    }
    print(json.dumps(summary, indent=2, ensure_ascii=False))

    if ok and (args.stamp_pass or args.require_zero):
        pass_doc = {
            "stamp": "TTG_V9_MAINNET_EDITION_WHITEPAPER_PASS",
            "candidate": "V9_AUDIT_CANDIDATE_DESIGN_LOCK",
            "remediation_wave": "DL_R1",
            "mainnet_status": "DEPLOYED_PENDING_CUTOVER",
            "aliases": ["MAINNET_DEPLOYED_PHASE1", "TIMELOCK_CUTOVER_PENDING"],
            "forbid_claim": ["MAINNET_FULLY_ACTIVE", "ACTIVE_OFFICIAL"],
            "WHITEPAPER_ACTIVE_TRUTH_CONFLICTS": 0,
            "LEGACY_ACTIVE_LEAKS": 0,
            "V9_BASELINE_COVERAGE": 100.0,
            "documents": result["docs"],
            "upstream": "docs/runbook/TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md",
            "tt_production_go": "NO_GO",
            "forbid_mutations": [
                "DL_R1_sources",
                "phase1_addresses",
                "live_chain_params",
                "TT_PRODUCTION_GO",
            ],
            "still_forbidden_auto": [
                "GitHub_Official_Docs_cutover",
                "Official_www_V9_copy_cutover",
                "Production_meta_Indexer_cutover",
            ],
            "stop": True,
        }
        PASS.write_text(json.dumps(pass_doc, indent=2) + "\n", encoding="utf-8")
        print("TTG_V9_MAINNET_EDITION_WHITEPAPER_PASS")

    if args.report_only:
        return 0
    if args.require_zero and not ok:
        print(f"STOP conflicts={c} leaks={l} coverage={cov}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
