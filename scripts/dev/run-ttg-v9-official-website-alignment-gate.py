#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Local Website V9 Alignment Candidate gate (P0+P1 allowlist only)."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE_TAG = "OFFICIAL_V9_PRODUCT_AND_WEB3_CLEAN_BASELINE"
STAMP = ROOT / "evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_PASS.json"

ALLOWLIST = {
    "frontend/lib/governance/governanceParamsTokenomicsModel.ts",
    "frontend/lib/governance/governanceParamsTokenomicsModel.test.ts",
    "frontend/lib/governance/governanceParamsProtocolReferenceMirror.ts",
    "frontend/lib/governance/primaryMarketRuntimePriceSsot.ts",
    "frontend/lib/governance/v9PublicContractRegistry.ts",
    "frontend/lib/governance/ttgPublicUnlockScheduleLocal.ts",
    "frontend/lib/governance/ttgPublicUnlockScheduleLocal.test.ts",
    "frontend/lib/governance/ttgReferencePriceV1.ts",
    "frontend/lib/traveltrustTtgPublicRounds.ts",
    "frontend/lib/traveltrustTtgPublicRounds.test.ts",
    "frontend/lib/traveltrustOfficialMainnetProtocolDirectory.ts",
    "frontend/locales/en.ts",
    "frontend/locales/zh.ts",
    "scripts/dev/run-ttg-v9-official-website-alignment-gate.py",
    "scripts/dev/write-ops-mother-parity-reconciliation.py",
    "scripts/dev/run-v9-pre-production-full-system-clean-convergence.py",
    "scripts/dev/run-v9-pre-production-local-fingerprint-pack.py",
    "evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_BASE_SHA.json",
    "evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_PASS.json",
    "evidence/GO_ttg_v9_audit/V9_DOC_TRUTH_CONVERGENCE_SCAN.json",
    "evidence/GO_ttg_v9_audit/OPS_MOTHER_PARITY_RECONCILIATION.json",
    "evidence/GO_ttg_v9_audit/V9_OFFICIAL_WEBSITE_PRODUCTION_RELEASE_MANIFEST.json",
    "evidence/GO_ttg_v9_audit/V9_PRE_PRODUCTION_FULL_SYSTEM_CLEAN_CONVERGENCE.json",
    "evidence/GO_ttg_v9_audit/V9_PRE_PRODUCTION_LOCAL_FINGERPRINT_PACK.json",
    "evidence/GO_ttg_v9_audit/V9_PRE_PRODUCTION_LOCAL_FULL_CLEAN_PASS.json",
    "docs/runbook/TT-TTG-V9-OFFICIAL-WEBSITE-ALIGNMENT-CANDIDATE-LOCAL-RC-LATEST.md",
    "docs/runbook/TT-OPS-MOTHER-PARITY-RECONCILIATION-WEBSITE-V9-LATEST.md",
    "docs/runbook/TT-V9-PRE-PRODUCTION-FULL-SYSTEM-CLEAN-CONVERGENCE-LATEST.md",
}

ACTIVE_ADDR = {
    "ttg": "0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9",
    "market": "0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b",
    "projectPool": "0x7B21b421981A3B61cc08c8E22D4fd690E457Df37",
    "countryFeeRouter": "0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970",
    "soloTimelock": "0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f",
    "governor": "0xA0DfC4C5C544488AfEfE696AfB8e5823911e5A9c",
}

FORBIDDEN_ACTIVE_ADDR_PREFIXES = (
    "0x96491",  # Safe
    "0x50F0B261",  # KEEP Timelock
    "0xfB906",  # P4Cap
    "0x0EC40c8a",  # old V8 TTG
    "0x882Ad192",  # old V8 PM
)

UI_STRUCTURAL_SUFFIXES = (".tsx", ".jsx", ".css", ".scss", ".sass", ".less")
PAGE_PREFIXES = ("frontend/app/", "frontend/components/", "frontend/modules/")


def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, cwd=ROOT, text=True, encoding="utf-8", errors="replace")


def changed_files(base: str) -> list[str]:
    out = run(["git", "diff", "--name-only", base, "HEAD"])
    unstaged = run(["git", "diff", "--name-only"])
    untracked = run(["git", "ls-files", "--others", "--exclude-standard"])
    files = set()
    for block in (out, unstaged, untracked):
        for line in block.splitlines():
            line = line.strip().replace("\\", "/")
            if line:
                files.add(line)
    # Also include working tree vs base for uncommitted
    vs_base = run(["git", "diff", "--name-only", base])
    for line in vs_base.splitlines():
        line = line.strip().replace("\\", "/")
        if line:
            files.add(line)
    return sorted(files)


def main() -> int:
    base_sha = run(["git", "rev-parse", BASE_TAG]).strip()
    head = run(["git", "rev-parse", "HEAD"]).strip()
    porcelain = run(["git", "status", "--porcelain"]).strip()
    # During candidate work porcelain may be non-zero; final PASS requires clean OR we stamp before commit.
    # Gate measures allowlist vs BASE_TAG working tree.

    files = changed_files(BASE_TAG)
    out_of_scope = [f for f in files if f not in ALLOWLIST]
    unauthorized_pages = [
        f
        for f in files
        if f.startswith(PAGE_PREFIXES) and f not in ALLOWLIST
    ]
    ui_structural = [
        f
        for f in files
        if f.endswith(UI_STRUCTURAL_SUFFIXES) and f not in ALLOWLIST
    ]

    # Truth checks on allowlisted sources
    model = (ROOT / "frontend/lib/governance/governanceParamsTokenomicsModel.ts").read_text(encoding="utf-8")
    registry = (ROOT / "frontend/lib/governance/v9PublicContractRegistry.ts").read_text(encoding="utf-8")
    primary = (ROOT / "frontend/lib/governance/primaryMarketRuntimePriceSsot.ts").read_text(encoding="utf-8")
    unlock = (ROOT / "frontend/lib/governance/ttgPublicUnlockScheduleLocal.ts").read_text(encoding="utf-8")
    rounds = (ROOT / "frontend/lib/traveltrustTtgPublicRounds.ts").read_text(encoding="utf-8")
    ref = (ROOT / "frontend/lib/governance/ttgReferencePriceV1.ts").read_text(encoding="utf-8")
    mirror = (ROOT / "frontend/lib/governance/governanceParamsProtocolReferenceMirror.ts").read_text(encoding="utf-8")
    directory = (ROOT / "frontend/lib/traveltrustOfficialMainnetProtocolDirectory.ts").read_text(encoding="utf-8")
    en = (ROOT / "frontend/locales/en.ts").read_text(encoding="utf-8")
    zh = (ROOT / "frontend/locales/zh.ts").read_text(encoding="utf-8")

    conflicts = []
    if "25_000_000_000_000" not in model or "sharePct: 50" not in model or "sharePct: 35" not in model:
        conflicts.append("tokenomics_model_not_25T_50_35_3_5_7")
    if "sharePct: 3" not in model or "sharePct: 5" not in model or "sharePct: 7" not in model:
        conflicts.append("tokenomics_missing_3_5_7")
    if "ttg_stakers: 0" not in mirror:
        conflicts.append("mirror_stakers_not_exit")
    if "kind: \"upcoming\"" not in unlock or "never date-drive" not in unlock.lower() and "Phase1 cutover pending" not in unlock:
        # soft: require upcoming-only resolve
        if 'kind: "upcoming"' not in unlock and "kind: \"upcoming\"" not in unlock:
            conflicts.append("sale_focus_not_forced_upcoming")
    if "return [];" not in rounds:
        conflicts.append("legacy_three_rounds_still_listed")
    if "LEGACY_DO_NOT_USE_AS_ACTIVE" not in ref:
        conflicts.append("reference_price_not_marked_legacy")
    for role, addr in ACTIVE_ADDR.items():
        if addr not in registry:
            conflicts.append(f"registry_missing_{role}")
    if "V9_PUBLIC_CONTRACTS" not in primary or "ttg" not in primary or "market" not in primary:
        conflicts.append("primary_not_wired_to_registry")
    if "V9_PUBLIC_CONTRACTS" not in directory:
        conflicts.append("directory_not_wired_to_registry")
    for role in ("ttg", "market", "countryFeeRouter", "soloTimelock", "governor", "projectPool"):
        # registry remains SSOT; directory/primary must import it
        if f"{role}" not in registry:
            conflicts.append(f"registry_key_missing_{role}")

    wrong_addrs = []
    scan_blob = "\n".join([primary, directory, registry, en, zh])
    for pref in FORBIDDEN_ACTIVE_ADDR_PREFIXES:
        # allow mention as LEGACY DO NOT USE in registry comments
        if pref.lower() in scan_blob.lower():
            # fail if present in directory or primary as live address assignment
            if pref.lower() in directory.lower() and "LEGACY" not in directory:
                wrong_addrs.append(pref)
            if re.search(rf'address:\s*"{pref}', directory, re.I):
                wrong_addrs.append(pref + ":directory")
            if re.search(rf'PRIMARY_MARKET_LIVE_[A-Z_]+_ADDRESS\s*=\s*"{pref}', primary, re.I):
                wrong_addrs.append(pref + ":primary")

    # Legacy ACTIVE leaks in locales (ACTIVE-facing without LEGACY/EXIT/SUPERSEDED)
    leak_patterns = [
        r"globalStakers 65/20/15(?!.*EXIT)",
        r"Inside the global 55% share: TTG staking incentive 65%",
        r"P4Cap DAO Treasury(?!.*LEGACY|.*SUPERSEDED|.*EXIT)",
    ]
    leaks = []
    for pat in leak_patterns:
        if re.search(pat, en) or re.search(pat, zh):
            leaks.append(pat)

    # zh/en parity keys (subset)
    parity_keys = [
        "governance_params_ttg_supply_treasury_ops",
        "traveltrust_settlement_contract_ttg",
        "traveltrust_role_guide_tag",
        "governance_fee_routes_title",
        "staking_pageSubtitle",
    ]
    parity_miss = [k for k in parity_keys if f"{k}:" not in en or f"{k}:" not in zh]

    p0_closed = all(
        x not in conflicts
        for x in [
            "tokenomics_model_not_25T_50_35_3_5_7",
            "tokenomics_missing_3_5_7",
            "mirror_stakers_not_exit",
            "legacy_three_rounds_still_listed",
            "reference_price_not_marked_legacy",
        ]
    ) and 'kind: "upcoming"' in unlock.replace("'", '"') or 'kind: "upcoming"' in unlock

    # Fix p0_closed boolean carefully
    forced_upcoming = 'return { batch: TTG_PUBLIC_UNLOCK_BATCHES[0], kind: "upcoming" }' in unlock
    p0_ids = {
        "W-P0-01": "25_000_000_000_000" in model and "sharePct: 50" in model and len(re.findall(r"sharePct:", model)) >= 5,
        "W-P0-02": "ProjectPool" in en and "ProjectPool" in zh and "ttg_stakers: 0" in mirror,
        "W-P0-03": "ttg_stakers: 0" in mirror and "LEGACY" in mirror,
        "W-P0-04": ACTIVE_ADDR["ttg"] in registry
        and ACTIVE_ADDR["market"] in registry
        and ACTIVE_ADDR["projectPool"] in registry
        and "V9_PUBLIC_CONTRACTS" in primary
        and "DEPLOYED_PENDING_CUTOVER" in primary,
        "W-P0-05": forced_upcoming,
        "W-P0-06": "return [];" in rounds,
        "W-P0-07": "LEGACY_DO_NOT_USE_AS_ACTIVE" in ref,
        "W-P0-08": "25T total supply" in en and "总供应 25T" in zh,
    }
    p1_ids = {
        "W-P1-01": "not an invitation" in en.lower() or "不是买入邀请" in zh,
        "W-P1-02": "Role Stake DISABLED" in en and "Role Stake 未启用" in zh,
        "W-P1-03": "NOT V9 Role Stake" in en and "≠ V9 Role Stake" in zh,
        "W-P1-04": "KEEP Money Path" in en and "KEEP Money Path" in zh,
        "W-P1-05": "no commissioned audit" in en.lower() or "尚未委托独立审计" in zh,
        "W-P1-06": "V9_PUBLIC_CONTRACTS" in directory
        and ACTIVE_ADDR["ttg"] in registry
        and "0x50F0B261" not in directory
        and "0x96491" not in directory,
        "W-P1-07": len(parity_miss) == 0,
    }

    metrics = {
        "OUT_OF_SCOPE_CHANGED_FILES": len(out_of_scope),
        "UNAUTHORIZED_PAGE_DIFF": len(unauthorized_pages),
        "UI_UX_STRUCTURAL_DIFF": len(ui_structural),
        "WEBSITE_V9_TRUTH_CONFLICTS": len(conflicts),
        "LEGACY_ACTIVE_LEAKS": len(leaks),
        "WRONG_CONTRACT_ADDRESSES": len(wrong_addrs),
        "P0_OPEN": sum(1 for v in p0_ids.values() if not v),
        "P1_OPEN": sum(1 for v in p1_ids.values() if not v),
        "ZH_EN_PARITY_MISS": len(parity_miss),
    }

    ok = all(v == 0 for k, v in metrics.items() if k != "ZH_EN_PARITY_MISS") and metrics["ZH_EN_PARITY_MISS"] == 0

    payload = {
        "stamp": "V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_PASS" if ok else "V9_OFFICIAL_WEBSITE_ALIGNMENT_CANDIDATE_FAIL",
        "base_tag": BASE_TAG,
        "base_sha": base_sha,
        "head_sha_at_gate": head,
        "tt_production_go": "NO_GO",
        "scope": "P0+P1_allowlist_only",
        "deploy": "FORBIDDEN",
        "meta_indexer_cutover": "FORBIDDEN",
        "dl_r1_phase1_mutation": "FORBIDDEN",
        "metrics": metrics,
        "p0": p0_ids,
        "p1": p1_ids,
        "out_of_scope_files": out_of_scope,
        "unauthorized_pages": unauthorized_pages,
        "ui_structural": ui_structural,
        "conflicts": conflicts,
        "leaks": leaks,
        "wrong_addrs": wrong_addrs,
        "parity_miss": parity_miss,
        "allowlist": sorted(ALLOWLIST),
        "working_tree_porcelain_nonempty": bool(porcelain),
    }

    STAMP.parent.mkdir(parents=True, exist_ok=True)
    STAMP.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps({"ok": ok, "metrics": metrics, "stamp": str(STAMP.relative_to(ROOT))}, indent=2))
    if not ok:
        print("FAIL detail:", json.dumps({k: payload[k] for k in ("out_of_scope_files", "conflicts", "leaks", "wrong_addrs", "parity_miss", "p0", "p1")}, indent=2, ensure_ascii=False))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
