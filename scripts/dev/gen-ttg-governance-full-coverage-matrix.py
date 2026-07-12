#!/usr/bin/env python3
"""Generate TTG Governance Full Coverage Matrix (read-only inventory · no new tests).

SUPERSEDED · READ-ONLY · replaced by MTM 146 — use gen-ttg-governance-master-traceability-matrix.py
"""
from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

import sys
sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))
from hat_r1_resolve import resolve_hat_r1_evid_dir, hat_r1_rel_path, hat_r1_stamp

try:
    HAT_R1_EVID_REL = hat_r1_rel_path(ROOT, resolve_hat_r1_evid_dir(ROOT))
    HAT_R1_STAMP = hat_r1_stamp(resolve_hat_r1_evid_dir(ROOT))
except FileNotFoundError:
    HAT_R1_EVID_REL = "evidence/GO_hat_r1_sepolia/unknown"
    HAT_R1_STAMP = "unknown"
OUT_MD = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md"
OUT_JSON = ROOT / "docs/spec/governance-token/artifacts/ttg-governance-full-coverage-matrix.v1.json"

# Columns: module, function, sub_function, page, api, contract, permission, fund_flow,
# test_status, evidence, gap, verify_class
Row = tuple[str, ...]

ROWS: list[Row] = [
    # GOV-FREEZE / Tokenomics SSOT
    ("GOV-FREEZE-V1", "Tokenomics SSOT", "TTG supply 10B / rounds", "/governance/params", "GET /governance/protocol-reference", "TtgPrimaryMarketV1 · TTG", "public read", "USDC→PM→TTG", "PASS", "docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md", "—", "已验证"),
    ("GOV-FREEZE-V1", "Tokenomics SSOT", "45/55 NetProfit bps", "/governance/params", "GET /governance/params", "CountryPoolNetProfitLedger", "public read", "NPP→45% steward / 55% global", "PASS", "frontend/lib/governanceParamsTtgTokenomicsFreeze.ts · cutover-drill/20260616T082259Z", "—", "已验证"),
    ("GOV-FREEZE-V1", "Tokenomics SSOT", "P1–P4 treasury policy copy", "/governance/params#gov-params-treasury-policy", "GET /governance/protocol-reference", "GovernanceTreasury · P4Cap", "public read", "P4 via governance only", "PASS", "GOVERNANCE-PARAMS-L5-FREEZE.md", "—", "需真人验证"),
    ("GOV-FREEZE-V2", "Sepolia baseline", "V2 shell addresses frozen", "—", "GET /meta", "Governor·Timelock·PM·Pool·Seat", "observability read", "—", "PASS", "GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md · 20260616T054554Z", "—", "已验证"),
    ("GOV-FREEZE-V2", "Sepolia baseline", "Legacy stack read-only", "—", "—", "LEGACY_* env", "forbidden rollback", "—", "PASS", "assert-gov-freeze-v2-active-baseline-only.sh", "—", "已验证"),
    ("GOV-01", "Treasury P4 deploy cap", "30% cap enforce", "/governance/params", "GET /governance/protocol-reference", "GovernanceTreasuryP4Cap 0xc1de…", "Timelock path", "deploy cap not spend", "PASS", "G24-GOV-01 · verify-gov-freeze-v1-sepolia-onchain.sh", "—", "需链上验证"),
    ("GOV-02", "Quorum + Timelock", "400 bps quorum · 48h delay", "/governance/proposals/[id]", "GET /governance/proposal-status/:id", "Governor·Timelock 0x904a…", "Governor queue", "—", "PASS", "G24-GOV-02 · HAT-R1 Phase A queue tx", "—", "需链上验证"),
    ("GOV-03", "Seat concentration", "cap disabled (unlimited per-address weight)", "/governance?view=region", "GET /governance/voting-power", "TtgSeatConcentrationRegistry", "Seat holder", "—", "PASS", "G24-GOV-CONC-01 · GO_governance_concentration_audit_sepolia/", "—", "需链上验证"),
    ("GOV-03", "Seat concentration", "stake aggregate cap", "/governance?view=region", "GET /steward/stake-status", "RegionStewardStakePool", "steward", "TTG stake lock", "PASS", "concentration audit · Phase A stake", "—", "需链上验证"),
    ("GOV-04", "Primary Market", "25k per wallet cap", "/governance/params", "GET /governance/ttg-exchange/quote", "TtgPrimaryMarketV1 0x7af1…", "buyer EOA", "USDC→PM", "PASS", "G24-GOV-04 · Enterprise HAT L2", "—", "需链上验证"),
    ("GOV-04", "Primary Market", "min 100 USDC purchase", "—", "GET /governance/ttg-exchange/quote", "TtgPrimaryMarketV1", "buyer", "USDC in", "PARTIAL", "Enterprise HAT L2 · HAT-R1 purchase skipped (USDC=0)", "P2", "需链上验证"),
    ("Primary Market", "Purchase flow", "approve + purchase tx", "—", "—", "TtgPrimaryMarketV1", "wallet signer", "USDC→TTG", "PARTIAL", "HAT-R1 Phase A skip · forge local tests PASS", "P2", "需链上验证"),
    ("Primary Market", "Exchange quote API", "quote read", "—", "GET /governance/ttg-exchange/quote", "TtgPrimaryMarketV1", "public", "—", "PASS", "ttg_exchange_quote.rs · ② RPC read", "—", "已验证"),
    ("Seat / Stake", "Stake quote", "10 jurisdictions min stake", "/governance?view=region", "GET /steward/stake-quote", "RegionStewardStakePool 0x3a89…", "steward applicant", "TTG lock", "PASS", "Phase A stake tx · G24-SPB-01", "—", "需链上验证"),
    ("Seat / Stake", "Stake status", "on-chain stake read", "/governance?view=region", "GET /steward/stake-status", "RegionStewardStakePool", "authenticated", "—", "PASS", f"HAT-R1 Phase A {HAT_R1_EVID_REL}/", "—", "需链上验证"),
    ("Seat / Stake", "Seat application", "POST application", "/governance?view=region", "POST /steward/applications", "DB + gate", "auth user", "—", "PARTIAL", "Enterprise HAT L3 · ② full admin approve NOT TESTED", "P1", "需真人验证"),
    ("Seat / Stake", "180d resign notice", "resign API", "/governance?view=region", "POST /steward/resign-notice", "StakePool release path", "steward", "TTG unlock after notice", "NOT TESTED", "steward.rs · Gate-2.4", "P1", "需链上验证"),
    ("Seat / Stake", "Finalize resign / unstake", "exit tx", "/governance?view=region", "POST /steward/finalize-resign", "RegionStewardStakePool", "steward", "TTG return", "NOT TESTED", "HAT-R1 Phase B scope · PAUSED", "P0", "需链上验证"),
    ("Governor", "Propose", "create proposal UI", "/governance/proposals/new", "—", "TravelTrustGovernor 0x847b…", "proposer", "—", "PARTIAL", "governanceProposalCreatePage.contract.test.ts · ② live NOT TESTED", "P1", "需链上验证"),
    ("Governor", "Propose", "list proposals", "/governance/proposals", "GET /governance/proposals", "Governor events / DB", "public", "—", "PASS", "C-GOV-002 · indexer ②", "—", "已验证"),
    ("Governor", "Vote", "cast vote wallet", "/governance/proposals/[id]", "POST /governance/proposals/:id/vote", "Governor", "voter", "—", "PARTIAL", "Phase A on-chain vote · API stub ① PASS", "P1", "需链上验证"),
    ("Governor", "Vote", "vote on-chain Phase A", "/governance/proposals/[id]", "—", "Governor", "HAT wallet", "—", "PASS", f"HAT-R1 {HAT_R1_STAMP} · proposal 1", "—", "需链上验证"),
    ("Governor", "Queue", "queue after vote period", "/governance/proposals/[id]", "GET /governance/proposal-status/:id", "Governor→Timelock", "anyone after vote", "—", "PASS", "HAT-R1 queue tx 0xcfd0…", "—", "需链上验证"),
    ("Timelock", "Execute", "execute after 48h", "/governance/proposals/[id]", "—", "Timelock 0x904a…", "anyone", "payload effect", "NOT TESTED", "HAT-R1 Phase B PAUSED · EXECUTE_EARLIEST_UNIX.txt", "P0", "需链上验证"),
    ("Timelock", "Schedule admin", "legacy ledger ops", "—", "—", "Legacy Timelock 0x0359…", "Safe admin", "CPNP payloads", "PASS", "cutover-drill/20260616T082259Z exec-*.log", "—", "需链上验证"),
    ("Treasury", "GovernanceTreasury", "spend via Timelock only", "/governance/params#gov-params-treasury-policy", "—", "GovernanceTreasury 0x6a83…", "Timelock spender", "USDC out", "PARTIAL", "Enterprise HAT L5 · spend tx NOT TESTED", "P0", "需财务验证"),
    ("Treasury", "Global Treasury 55%", "NetProfit split leg", "/governance/params", "GET /governance/country-ledger/DE", "CountryPoolNetProfitLedger", "ledger owner TL", "USDC→V2 Timelock", "PASS", "cutover-drill fund-flow-verdict PASS · +605000 raw", "—", "需财务验证"),
    ("Treasury", "P4 cap contract", "deploy cap enforce", "—", "—", "GovernanceTreasuryP4Cap", "governance", "—", "PASS", "GOV-01 on-chain verify", "—", "需链上验证"),
    ("45/55 Revenue", "Accrual", "recordAccrual R/E codes", "—", "—", "CountryPoolNetProfitLedger", "ledger owner", "off-chain→ledger", "PASS", "cutover drill-accrue-* logs", "—", "需链上验证"),
    ("45/55 Revenue", "Close epoch", "closeDelay + NPP", "—", "—", "CountryPoolNetProfitLedger", "ledger owner", "—", "PASS", "cutover drill-close", "—", "需链上验证"),
    ("45/55 Revenue", "Fund split", "fundLedgerForSplit", "—", "—", "CountryPoolNetProfitLedger", "fundingSource EOA", "USDC pull", "PASS", "cutover drill-fund", "—", "需财务验证"),
    ("45/55 Revenue", "Split", "45/55 conservation", "—", "—", "CountryPoolNetProfitLedger", "ledger owner", "45% vault / 55% TL", "PASS", "four-ledger-reconcile.json PASS · epoch status=4", "—", "需财务验证"),
    ("45/55 Revenue", "Ineligible steward", "Unallocated 45% leg", "—", "—", "UnallocatedStewardPathVault 0xAbE3…", "ledger", "495000 unallocated", "PASS", "post-state.json balances", "—", "需财务验证"),
    ("Country Pool", "NetProfit Ledger DE", "on-chain config read", "—", "GET /governance/country-ledger/DE", "0x270456…", "public+session", "—", "PASS", "CP Revenue HAT 20260616T084248Z", "—", "已验证"),
    ("Country Pool", "Registry JSON", "DE triplet SSOT", "—", "—", "config/jurisdiction_country_pool_net_profit.sepolia.json", "—", "—", "PASS", "G24-P-07", "—", "已验证"),
    ("Country Pool", "globalTreasury cutover", "V2 Timelock wired", "—", "—", "setSettlementParams via TL", "Safe→legacy TL", "—", "PASS", "cutover-settlement-params.log", "—", "需链上验证"),
    ("Country Pool", "Ledger owner", "legacy TL still owner", "—", "—", "owner=0x0359…", "governance future", "—", "PARTIAL", "GOV-FREEZE-V2 acceptance-only doc · out of scope", "P2", "无证据"),
    ("Vault", "StewardPathVault", "depositFromLedger", "—", "—", "StewardPathVault 0x6B33…", "ledger only", "45% eligible path", "PARTIAL", "drill ineligible→0 steward leg", "P2", "需链上验证"),
    ("Vault", "UnallocatedStewardVault", "depositFromLedger", "—", "—", "UnallocatedStewardPathVault", "ledger", "45% ineligible", "PASS", "split event · balance 495000", "—", "需财务验证"),
    ("Vault", "RegionVault", "forward audit UI", "/governance/vault-forwards", "GET /governance/vault-forwards", "RegionVault 0x2Ea0…", "read", "escrow fee path", "PARTIAL", "C-GOV-008 · ② projection", "P2", "部分验证"),
    ("FeeRouter", "Fee split 65/20/15", "orthogonal to 45/55", "/governance/fee-routes", "GET /governance/fee-routes", "FeeRouter 0x81A8…", "read", "escrow fees", "PARTIAL", "C-GOV-007 · not NetProfit SSOT", "P2", "部分验证"),
    ("Distribution", "Accrual list", "investor accruals read", "/governance/distribution-accruals", "GET /governance/investor-distribution-accruals", "DB projection B-086", "auth/session", "off-chain accrual", "PARTIAL", "C-GOV-009 · DB/indexer dependent", "P1", "部分验证"),
    ("Distribution", "Accrual detail", "line detail", "/governance/distribution-accruals/[id]", "GET /governance/investor-distribution-accruals", "DB", "auth", "—", "PARTIAL", "C-GOV-009", "P1", "部分验证"),
    ("Distribution", "Internal accrual write", "register accrual", "—", "POST /internal/investor-distribution-*", "DB", "internal only", "—", "NOT TESTED", "investor_distribution.rs · ② staging", "P1", "未验证"),
    ("Claim", "InvestorDistributionClaim", "withdraw UI", "/governance/distribution-claim", "—", "InvestorDistributionClaim", "wallet", "USDC to investor", "PARTIAL", "C-GOV-010 · live claim tx NOT TESTED", "P1", "需链上验证"),
    ("Claim", "P4 auto-dividend boundary", "no auto TTG dividend", "/governance/distribution-claim", "—", "—", "narrative", "—", "PASS", "Enterprise HAT L4 · distributionClaimPage.contract", "—", "需真人验证"),
    ("Buyback/Burn", "Treasury buyback path", "governance-only", "/governance/params", "—", "GovernanceTreasury policy", "Timelock", "USDC→buyback", "NOT TESTED", "TTG-TOKENOMICS-FULL-SYSTEM-AUDIT PASS_WITH_PARTIAL", "P1", "需链上验证"),
    ("Buyback/Burn", "Burn execution", "on-chain burn", "—", "—", "TTG burn hook", "governance", "TTG supply↓", "NOT TESTED", "G24-FSA-01 open item", "P1", "需链上验证"),
    ("Unstake", "Phase B unstake", "live wallet exit", "/governance?view=region", "—", "StakePool", "steward", "TTG unlock", "NOT TESTED", "HAT-R1 Phase B PAUSED", "P0", "需链上验证"),
    ("Delegate", "Vote delegation UI", "delegate page", "/governance/delegate", "GET/POST/DELETE /governance/delegate", "Governor delegation", "token holder", "—", "PARTIAL", "C-GOV-005 · ② live delegate NOT TESTED", "P2", "需链上验证"),
    ("Delegate", "Voting power read", "snapshot power", "—", "GET /governance/voting-power", "GovernorVotesToken", "public/auth", "—", "PASS", "C-GOV-006 · Phase A", "—", "已验证"),
    ("Admin", "Governance ops read-only", "admin links no spend", "—", "—", "—", "admin RBAC read", "—", "PASS", "Enterprise HAT L7", "—", "需真人验证"),
    ("Admin", "Treasury bypass", "must not exist", "—", "—", "—", "admin denied", "—", "PASS", "Enterprise HAT L7 · no POST spend", "—", "已验证"),
    ("Multi-Role", "Traveler vs Steward", "data isolation", "/me/identities · /governance", "GET /me/*", "—", "role scoped", "—", "PARTIAL", "Enterprise HAT L6 · human UAT NOT TESTED", "P1", "需真人验证"),
    ("Multi-Role", "Merchant/Guide", "no governance bleed", "—", "—", "—", "RBAC", "—", "PARTIAL", "Enterprise HAT L6", "P1", "需真人验证"),
    ("Multi-Role", "Moderator", "no treasury spend", "—", "—", "—", "moderator", "—", "PASS", "Enterprise HAT L7", "—", "需真人验证"),
    ("UI/UX", "Governance hub", "pool/rewards read", "/governance", "GET /governance/pool · /rewards", "—", "public", "—", "PASS", "C-GOV-001 · governance-matrix-local-gate", "—", "需真人验证"),
    ("UI/UX", "Params page L5 freeze", "45/55 visual + GOV table", "/governance/params", "GET /governance/params", "—", "public", "—", "PASS", "GOVERNANCE-PARAMS-L5-FREEZE · G24-UI-ALIGN-01", "—", "需真人验证"),
    ("UI/UX", "Steward workbench", "stake panel anchors", "/governance?view=region", "—", "—", "steward", "—", "PASS", "STEWARD-WORKBENCH-L5-FREEZE.md", "—", "需真人验证"),
    ("UI/UX", "Human screen UAT", "A1–D4 checklist", "see HUMAN-SCREEN checklist", "—", "—", "all roles", "—", "NOT TESTED", "G24-HUMAN-UAT-01 · prep 20260616T085954Z", "P0", "需真人验证"),
    ("API", "Country ledger env priority", "NET_PROFIT first", "—", "GET /governance/country-ledger/:j", "chain/mod.rs", "session gate", "—", "PASS", "crates/api/src/chain/mod.rs fix · four-ledger PASS", "—", "已验证"),
    ("API", "Protocol reference", "GOV-01~04 mirror", "—", "GET /governance/protocol-reference", "doc_params", "public", "—", "PASS", "C-GOV-011", "—", "已验证"),
    ("API", "Fee pool aggregates", "Σ read", "—", "GET /governance/fee-pool-aggregates", "DB/chain", "public", "—", "PARTIAL", "fee_pool_aggregate.rs", "P2", "部分验证"),
    ("API", "State machines doc", "doc mirror", "—", "GET /governance/state-machines", "—", "public", "—", "PASS", "state_machines.rs", "—", "已验证"),
    ("Indexer", "Proposal events", "index → API list", "—", "GET /governance/proposals", "Governor logs", "—", "—", "PARTIAL", "② indexer · ISS-007 partial GO", "P1", "部分验证"),
    ("Indexer", "NetProfit events", "CPNP decoder", "—", "—", "registry/event-decoders/country-pool-net-profit-v1.yaml", "—", "—", "NOT TESTED", "G24-P-04 decoder impl deferred", "P1", "未验证"),
    ("DB", "Investor accruals", "accrual rows", "—", "GET investor-distribution-accruals", "PostgreSQL", "session", "—", "PARTIAL", "CP HAT db-snapshot-skipped without DATABASE_URL", "P1", "部分验证"),
    ("DB", "Governance rewards", "reward records", "—", "GET /governance/rewards", "DB", "auth", "—", "PARTIAL", "governance_reads", "P2", "部分验证"),
    ("Exception", "USDC=0 purchase", "TransferFailed path", "—", "—", "PrimaryMarket", "wallet", "—", "PASS", "HAT-R1 skip purchase note", "—", "已验证"),
    ("Exception", "Queue GovBadState", "wait vote period", "—", "—", "Governor", "—", "—", "PASS", "HAT-R1 Phase A fix evidence", "—", "已验证"),
    ("Exception", "Session gate 401", "country-ledger auth", "—", "GET /governance/country-ledger/DE", "—", "Bearer required", "—", "PARTIAL", "CP Revenue HAT step-06 api 401 without token", "P2", "部分验证"),
    ("Permission", "Timelock allowed targets", "B-407 allowlist", "—", "—", "GovernanceTimelock", "admin", "—", "PASS", "cutover setAllowedExecutionTarget", "—", "需链上验证"),
    ("Permission", "onlySpender Treasury", "non-TL reject", "—", "—", "GovernanceTreasury", "Timelock only", "—", "PASS", "Enterprise HAT L5-01", "—", "已验证"),
    ("Financial closure", "Four-ledger reconcile", "chain=API=page", "—", "GET country-ledger + params", "Ledger+API env", "—", "45/55", "PASS", "20260616T084248Z/four-ledger-reconcile.json", "—", "需财务验证"),
    ("Financial closure", "Enterprise HAT L9", "L9 recheck", "—", "—", "—", "—", "—", "PASS", "l9-recheck/20260616T084529Z/L9-RECHECK.json", "—", "需财务验证"),
    ("Financial closure", "DB ledger parity", "accrual vs chain", "—", "—", "DB", "—", "—", "NOT TESTED", "four-ledger · DB skipped ②", "P1", "需财务验证"),
    ("HAT-R1", "Phase A", "purchase·stake·propose·vote·queue", "—", "—", "full stack", "HAT wallet", "TTG+USDC", "PASS", f"{HAT_R1_EVID_REL}/", "—", "需链上验证"),
    ("HAT-R1", "Phase B", "execute·treasury·unstake", "—", "—", "Timelock+Treasury+Pool", "HAT wallet", "USDC", "NOT TESTED", "Phase B PAUSED · EXECUTE_EARLIEST_UNIX.txt", "P0", "需链上验证"),
    ("Enterprise HAT", "L1 UI/UX", "machine narrative", "/governance/*", "—", "—", "—", "—", "PARTIAL", "audit/20260616T074359Z L1 PASS machine", "P1", "需真人验证"),
    ("Enterprise HAT", "L2–L8", "purchase·seat·revenue·treasury·roles", "see layers", "see APIs", "see contracts", "—", "—", "PASS", "Enterprise audit + L9 recheck overall", "—", "部分验证"),
    ("Enterprise HAT", "L9 pre-recheck", "four-ledger FAIL", "—", "—", "—", "—", "—", "FAIL", "audit/20260616T074359Z (superseded)", "—", "已验证"),
    ("CP Revenue HAT", "Nine-step audit", "four-ledger PASS", "—", "multi GET", "DE NetProfit stack", "—", "45/55", "PASS", "20260616T084248Z/", "—", "需财务验证"),
    ("Gate-2.4", "G24-P-11 Legal", "LEG-XJ-05", "—", "—", "—", "—", "—", "NOT TESTED", "country-pool-settlement-gate2.4 checklist ☐", "P2", "未验证"),
    ("Gate-2.4", "D-4555-B local HAT", "forge six chains", "—", "—", "CountryPoolNetProfit", "—", "45/55", "PASS", "GO_local_country_pool_net_profit_gate2.3/", "—", "已验证"),
    ("Gate-2.4", "ABI freeze", "manifest+check-55-s13", "—", "—", "ABI manifests", "—", "—", "PASS", "G24-P-03", "—", "已验证"),
    ("Concentration", "8M TTG scenario", "GOV-02/03 audit", "—", "—", "Governor+Seat", "—", "—", "PASS", "GO_governance_concentration_audit_sepolia/", "—", "已验证"),
    ("Full-System Audit", "TTG tokenomics", "PASS_WITH_PARTIAL", "—", "—", "multi", "—", "—", "PARTIAL", "TTG-TOKENOMICS-FULL-SYSTEM-AUDIT-REPORT.md", "P1", "部分验证"),
]


def classify_row(status: str, verify: str) -> str:
    if status == "PASS" and verify == "已验证":
        return "verified"
    if status in ("PASS", "PARTIAL") and verify in ("部分验证", "需真人验证", "需链上验证", "需财务验证"):
        return "partial"
    if status == "NOT TESTED":
        return "not_tested"
    if status == "FAIL":
        return "failed"
    if verify == "无证据":
        return "no_evidence"
    return "partial"


def main() -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    status_counts = Counter(r[8] for r in ROWS)
    gap_counts = Counter(r[10] for r in ROWS if r[10] != "—")
    verify_buckets: dict[str, list[str]] = {
        "已验证": [],
        "部分验证": [],
        "未验证": [],
        "无证据": [],
        "需真人验证": [],
        "需链上验证": [],
        "需财务验证": [],
    }
    for i, r in enumerate(ROWS, 1):
        key = r[11]
        verify_buckets.setdefault(key, []).append(f"M-{i:03d} {r[0]} / {r[2]}")

    total = len(ROWS)
    pass_n = status_counts["PASS"]
    partial_n = status_counts["PARTIAL"]
    fail_n = status_counts["FAIL"]
    nt_n = status_counts["NOT TESTED"]
    tested_n = pass_n + partial_n + fail_n
    coverage_pct = round(100.0 * tested_n / total, 1)

    md_lines = [
        "# TTG Governance Full Coverage Matrix",
        "",
        "> **SUPERSEDED · READ-ONLY · replaced by MTM 146** — [TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md](TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md) 为 **ACTIVE** 执行真源；本矩阵 **禁止** 扩写 · 仅作 cutover 旁证。",
        "",
        f"**Matrix ID:** `TTG-GOVERNANCE-FULL-COVERAGE-MATRIX`  ",
        f"**Version:** v1-{stamp[:8]}  ",
        f"**Generated:** {stamp} (UTC)  ",
        "**Phase:** **② Sepolia 经济基线锁定** · **≠ ③ Production GO**  ",
        "**Baseline SSOT:** GovFreeze V2 + Four-Ledger PASS (`20260616T084248Z`)  ",
        "**Policy:** 停止 Tokenomics 设计变更 · 停止新增治理开发/测试 · 仅验收维护窗  ",
        "",
        "---",
        "",
        "## 列说明",
        "",
        "| 列 | 含义 |",
        "|----|------|",
        "| 模块 | 治理域顶层 |",
        "| 功能 / 子功能 | 能力分解 |",
        "| 页面 | 前端路由（`—` = 无专页） |",
        "| API | HTTP 读/写面 |",
        "| 合约 | 链上组件或 env SSOT |",
        "| 权限 | 角色/门闸 |",
        "| 资金流 | 资金走向摘要 |",
        "| 测试状态 | PASS / PARTIAL / FAIL / NOT TESTED |",
        "| 证据路径 | 仓库内路径（② 优先） |",
        "| 缺口 | P0 / P1 / P2 / — |",
        "| 验证分类 | 七类清单键 |",
        "",
        "---",
        "",
        "## 覆盖率统计",
        "",
        f"| 指标 | 值 |",
        f"|------|-----|",
        f"| 矩阵行数 | **{total}** |",
        f"| PASS | **{pass_n}** ({round(100*pass_n/total,1)}%) |",
        f"| PARTIAL | **{partial_n}** ({round(100*partial_n/total,1)}%) |",
        f"| FAIL | **{fail_n}** ({round(100*fail_n/total,1)}%) |",
        f"| NOT TESTED | **{nt_n}** ({round(100*nt_n/total,1)}%) |",
        f"| 已触达测试（PASS+PARTIAL+FAIL） | **{tested_n}** ({coverage_pct}%) |",
        f"| P0 缺口行 | **{gap_counts.get('P0',0)}** |",
        f"| P1 缺口行 | **{gap_counts.get('P1',0)}** |",
        f"| P2 缺口行 | **{gap_counts.get('P2',0)}** |",
        "",
        "---",
        "",
        "## 完整矩阵",
        "",
        "| # | 模块 | 功能 | 子功能 | 页面 | API | 合约 | 权限 | 资金流 | 测试状态 | 证据路径 | 缺口 | 验证分类 |",
        "|---|------|------|--------|------|-----|------|------|--------|----------|----------|------|----------|",
    ]

    for i, r in enumerate(ROWS, 1):
        md_lines.append(
            "| "
            + " | ".join(
                [
                    str(i),
                    r[0],
                    r[1],
                    r[2],
                    r[3],
                    r[4],
                    r[5],
                    r[6],
                    r[7],
                    f"**{r[8]}**",
                    r[9],
                    r[10],
                    r[11],
                ]
            )
            + " |"
        )

    md_lines.extend(["", "---", "", "## 七类清单", ""])

    titles = [
        ("已验证", "verified"),
        ("部分验证", "partial"),
        ("未验证", "not_tested"),
        ("无证据", "no_evidence"),
        ("需真人验证", "human"),
        ("需链上验证", "onchain"),
        ("需财务验证", "financial"),
    ]
    for title, key in titles:
        items = verify_buckets.get(title, [])
        md_lines.append(f"### {title}（{len(items)}）")
        md_lines.append("")
        if not items:
            md_lines.append("—")
        else:
            for it in items:
                md_lines.append(f"- {it}")
        md_lines.append("")

    md_lines.extend(
        [
            "---",
            "",
            "## 诚实边界",
            "",
            "- 本矩阵 **不** 宣称 93 域全站矩阵 GO · **不** 宣称 ③ Production GO",
            "- ① 本地 vitest/forge **≠** ② 真人录屏 **≠** ② 链上 Phase B 闭环",
            "- `FAIL` 行若已 superseded（如 L9 pre-recheck）仍以历史证据保留 · 现行以 L9 recheck **PASS** 为准",
            "",
            "**机读副本：** `docs/spec/governance-token/artifacts/ttg-governance-full-coverage-matrix.v1.json`",
            "",
            f"**生成命令：** `python scripts/dev/gen-ttg-governance-full-coverage-matrix.py`（只读盘点 · 不跑新测试）",
        ]
    )

    OUT_MD.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_MD.write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    payload = {
        "schema": "traveltrust.ttg-governance-full-coverage-matrix.v1",
        "generated_at_utc": stamp,
        "phase": "②",
        "baseline": {
            "govfreeze_v2": True,
            "four_ledger_stamp": "20260616T084248Z",
            "l9_recheck_stamp": "20260616T084529Z",
        },
        "statistics": {
            "total_rows": total,
            "pass": pass_n,
            "partial": partial_n,
            "fail": fail_n,
            "not_tested": nt_n,
            "tested_coverage_pct": coverage_pct,
            "gap_p0": gap_counts.get("P0", 0),
            "gap_p1": gap_counts.get("P1", 0),
            "gap_p2": gap_counts.get("P2", 0),
        },
        "rows": [
            {
                "id": f"M-{i:03d}",
                "module": r[0],
                "function": r[1],
                "sub_function": r[2],
                "page": r[3],
                "api": r[4],
                "contract": r[5],
                "permission": r[6],
                "fund_flow": r[7],
                "test_status": r[8],
                "evidence_path": r[9],
                "gap_level": r[10],
                "verify_class": r[11],
            }
            for i, r in enumerate(ROWS, 1)
        ],
        "verify_class_index": {k: v for k, v in verify_buckets.items()},
    }
    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"TTG_GOV_FULL_COVERAGE_MATRIX: rows={total} coverage={coverage_pct}%")
    print(f"  md={OUT_MD.relative_to(ROOT)}")
    print(f"  json={OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
