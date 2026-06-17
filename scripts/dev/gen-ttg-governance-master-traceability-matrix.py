#!/usr/bin/env python3
"""Generate TTG Governance Master Traceability Matrix from CHK checklist (cert-only, no code audit)."""
import json
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
TIER_ORDER = ["DEV_DONE", "TESTNET_DONE", "HUMAN_DONE", "OPS_DONE", "DR_DONE"]
OVERRIDES_PATH = ROOT / "docs/spec/governance-token/artifacts/ttg-governance-tier-overrides.v1.json"


def _tier_rank(t: str) -> int:
    return TIER_ORDER.index(t) if t in TIER_ORDER else -1


def load_tier_overrides() -> dict[str, str]:
    if not OVERRIDES_PATH.exists():
        return {}
    data = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    return dict(data.get("overrides", {}))


def effective_tier(base: str, overrides: dict[str, str], row_id: str) -> str:
    ov = overrides.get(row_id)
    if not ov or _tier_rank(ov) <= _tier_rank(base):
        return base
    return ov

CONTRACTS = {
    "Governor": "0x847b…9fcb",
    "V2_TL": "0x904a…20cc",
    "Legacy_TL": "0x0359…Ee8f",
    "PM": "0x7af1…4016",
    "StakePool": "0x3a89…8784e",
    "Seat": "0xc997…ad1f",
    "DE_Ledger": "0x270456…a8Aa",
    "GovTreasury": "env GovernanceTreasury",
    "StewardVault": "env StewardPathVault",
    "UnallocVault": "env UnallocatedStewardVault",
    "FeeRouter": "0x81A8…",
    "Proxy": "env proxy family",
    "TTG": "0x2837…62c5",
    "InvestorDistributionClaim": "env InvestorDistributionClaim",
    "RegionVault": "env RegionVault",
    "Safe": "Safe multisig",
    "multi": "multi-stack",
    "—": "—",
}

ROWS: list[dict] = []


def add(
    mid,
    name,
    page,
    api,
    db,
    sc,
    role,
    flow,
    pool,
    tier,
    matrix,
    status,
    owner,
    recovery,
):
    ROWS.append(
        {
            "id": mid,
            "name": name,
            "page": page,
            "api": api,
            "db": db,
            "sc": sc,
            "role": role,
            "flow": flow,
            "pool": pool,
            "tier": tier,
            "matrix": matrix,
            "status": status,
            "owner": owner,
            "recovery": recovery,
        }
    )


# §0 CORE (30)
add("CHK-CORE-01", "真人验收 aggregate", "/governance/*", "—", "—", "—", "Owner·全角色", "—", "—", "DEV_DONE", 1, "OPEN", "Owner", "Cert#1 UAT signoff")
add("CHK-CORE-02", "多身份 enterprise", "/me/identities", "GET /me/*", "users", "—", "Traveler…Admin", "—", "—", "DEV_DONE", 12, "OPEN", "Owner", "Cert#2 walkthrough")
add("CHK-CORE-03", "管理员 enterprise", "/admin", "—", "audit_trail", "—", "Admin", "—", "—", "DEV_DONE", 11, "OPEN", "Owner", "Cert#3 admin walk")
add("CHK-CORE-04", "提案", "/governance/proposals/new", "GET/POST proposals", "governance_proposals", "Governor", "proposer", "—", "—", "TESTNET_DONE", 6, "PASS", "Governor", "Phase A evidence")
add("CHK-CORE-05", "投票", "/governance/proposals/[id]", "POST …/vote", "governance_proposals", "Governor", "voter", "—", "—", "TESTNET_DONE", 6, "PASS", "voter", "Phase A vote tx")
add("CHK-CORE-06", "Queue", "/governance/proposals/[id]", "GET proposal-status", "governance_proposals", "Governor→V2_TL", "anyone", "—", "V2 Timelock", "TESTNET_DONE", 6, "PASS", "Governor", "queue tx")
add("CHK-CORE-07", "Execute", "/governance/proposals/[id]", "—", "governance_proposals", "V2_TL", "anyone", "payload effect", "V2 Timelock", "DEV_DONE", 6, "BLOCKED", "Timelock executor", "Cert#7 Phase B")
add("CHK-CORE-08", "Treasury Spend", "/governance/params#treasury", "—", "—", "GovTreasury", "V2_TL only", "USDC out", "Global Treasury", "DEV_DONE", 3, "BLOCKED", "Treasury Op", "Cert#8 Phase B")
add("CHK-CORE-09", "Country Pool 45/55", "/governance/params", "GET params·country-ledger", "cp_epochs", "DE_Ledger", "public+session", "NPP→45/55", "DE CP", "TESTNET_DONE", 4, "PASS", "Finance Op", "four-ledger PASS")
add("CHK-CORE-10", "Steward 收益路径", "/governance?view=region", "GET steward/*", "—", "StewardVault·UnallocVault", "Steward", "45% vault", "DE CP", "TESTNET_DONE", 7, "PASS", "Steward", "split drill")
add("CHK-CORE-11", "TTG 持有人 distribution", "/governance/distribution-*", "GET accruals", "investor_accruals", "—", "Investor", "off-chain accrual", "—", "DEV_DONE", 8, "OPEN", "Investor", "live accrual UAT")
add("CHK-CORE-12", "Claim", "/governance/distribution-claim", "—", "investor_accruals", "InvestorDistributionClaim", "Investor", "USDC claim", "—", "DEV_DONE", 8, "OPEN", "Investor", "live claim UAT")
add("CHK-CORE-13", "Buyback/Burn", "/governance/params", "—", "—", "GovTreasury·TTG", "Timelock", "USDC→buyback·TTG burn", "Global Treasury", "DEV_DONE", 9, "OPEN", "Treasury Op", "pre-enable tabletop")
add("CHK-CORE-14", "USDC Treasury 使用", "/governance/params#treasury", "GET protocol-reference", "—", "GovTreasury·P4Cap", "public", "P1–P4·55% receipt", "Global·DE", "TESTNET_DONE", 3, "PASS", "Finance Op", "cutover fund-flow")
add("CHK-CORE-15", "Finance Operator", "doc+params", "—", "—", "—", "Finance Op", "fundingSource pull", "DE CP", "DEV_DONE", 3, "OPEN", "Finance Op", "Cert#5 W-F")
add("CHK-CORE-16", "Treasury Operator", "Safe+doc", "—", "—", "GovTreasury", "Treasury Op", "Safe→TL batches", "Global Treasury", "DEV_DONE", 3, "OPEN", "Treasury Op", "Cert#4 Safe")
add("CHK-CORE-17", "Safe 多签", "Safe UI", "—", "—", "Safe", "Safe Signer", "multisig", "—", "DEV_DONE", 3, "OPEN", "Safe Signer", "Cert#4 GORP-06")
add("CHK-CORE-18", "Disaster Recovery aggregate", "—", "—", "—", "multi", "On-call", "—", "—", "DEV_DONE", 14, "OPEN", "Owner", "Cert#10-11 DR")
add("CHK-CORE-19", "Four-Ledger", "/governance/params", "GET country-ledger/DE", "cp_*", "DE_Ledger", "session", "45/55 reconcile", "DE CP", "TESTNET_DONE", 13, "PARTIAL", "Finance Op", "DB leg OPEN")
add("CHK-CORE-20", "DB 对账", "—", "internal reconcile", "all gov tables", "—", "Finance Op", "—", "DE CP", "DEV_DONE", 13, "OPEN", "Finance Op", "DATABASE_URL run")
add("CHK-CORE-21", "API 对账", "—", "GET country-ledger", "—", "DE_Ledger", "API", "chain=API", "DE CP", "TESTNET_DONE", 13, "PASS", "SRE", "four-ledger json")
add("CHK-CORE-22", "页面展示", "/governance/*", "multi GET", "—", "—", "public", "—", "multi", "TESTNET_DONE", 1, "PASS", "Owner", "Human UAT pending")
add("CHK-CORE-23", "多角色权限", "/me/*·/governance", "RBAC", "users", "—", "all roles", "—", "—", "DEV_DONE", 2, "OPEN", "Owner", "Cert#2")
add("CHK-CORE-24", "Admin 权限边界", "/admin", "—", "audit_trail", "—", "Admin", "no spend", "—", "DEV_DONE", 11, "OPEN", "Admin", "Cert#3 C1-C2")
add("CHK-CORE-25", "Upgrade 流程", "/governance/params", "GET state-machines", "—", "Proxy", "Timelock", "—", "—", "DEV_DONE", 10, "OPEN", "Owner", "UP drill")
add("CHK-CORE-26", "Rollback 流程", "—", "—", "—", "Proxy", "Owner", "—", "—", "DEV_DONE", 10, "OPEN", "Owner", "UP-04 drill")
add("CHK-CORE-27", "Timelock 故障恢复", "—", "—", "—", "V2_TL·Legacy_TL", "On-call", "—", "Timelock", "DEV_DONE", 14, "OPEN", "Treasury Op", "DR-04")
add("CHK-CORE-28", "Treasury 误转恢复", "—", "—", "—", "GovTreasury", "Treasury Op", "USDC mis-route", "Global Treasury", "DEV_DONE", 14, "OPEN", "Treasury Op", "DR-02 tabletop")
add("CHK-CORE-29", "Country Pool 异常恢复", "—", "—", "cp_epochs", "DE_Ledger", "Finance Op", "split pause", "DE CP", "DEV_DONE", 14, "OPEN", "Finance Op", "DR-03·DR-05")
add("CHK-CORE-30", "Governance 运营流程", "GORP doc", "—", "—", "—", "Owner", "—", "—", "DEV_DONE", 1, "OPEN", "Owner", "Cert#12 GORP signoff")

# Helper for bulk rows: (id_prefix_section, tuples)
def bulk(tuples):
    for t in tuples:
        add(*t)


bulk([
("CHK-FE-01","Hub UAT A1","/governance","GET pool·rewards","—","—","guest","—","multi","DEV_DONE",1,"OPEN","Owner","A1录屏"),
("CHK-FE-02","Params UAT A2","/governance/params","GET params","—","—","TTG holder","45/55 read","DE CP","DEV_DONE",1,"OPEN","Owner","A2录屏"),
("CHK-FE-03","Treasury policy UAT A3","/governance/params#gov-params-treasury-policy","GET protocol-reference","—","GovTreasury","TTG holder","P1–P4 narrative","Global","DEV_DONE",3,"OPEN","Owner","A3录屏"),
("CHK-FE-04","Proposals list","/governance/proposals","GET proposals","governance_proposals","Governor","public","—","—","TESTNET_DONE",6,"PASS","public","indexer ②"),
("CHK-FE-05","Proposals new","/governance/proposals/new","—","—","Governor","proposer","—","—","TESTNET_DONE",6,"PASS","proposer","UI+Phase A"),
("CHK-FE-06","Vote UI","/governance/proposals/[id]","POST vote","governance_proposals","Governor","voter","—","—","TESTNET_DONE",6,"PASS","voter","Phase A"),
("CHK-FE-07","Queue UI","/governance/proposals/[id]","GET proposal-status","—","Governor","public","—","V2 Timelock","TESTNET_DONE",6,"PASS","public","queue display"),
("CHK-FE-08","Execute UI","/governance/proposals/[id]","—","—","V2_TL","public","—","V2 Timelock","DEV_DONE",6,"BLOCKED","public","Phase B PAUSED"),
("CHK-FE-09","Accruals UAT A5","/governance/distribution-accruals","GET accruals","investor_accruals","—","Investor","accrual read","—","DEV_DONE",8,"OPEN","Investor","A5录屏"),
("CHK-FE-10","Claim UAT A6","/governance/distribution-claim","—","—","InvestorDistributionClaim","Investor","claim boundary","—","DEV_DONE",8,"OPEN","Investor","A6录屏"),
("CHK-FE-11","PM exchange UI","/governance/params","GET ttg-exchange/quote","—","PM","Investor","USDC→TTG quote","Primary Market","TESTNET_DONE",5,"PASS","Investor","quote ②"),
("CHK-FE-12","Stake/Seat B2","/governance?view=region","GET steward/*","—","StakePool·Seat","Steward","TTG lock","Region stake","TESTNET_DONE",7,"PASS","Steward","Phase A stake"),
("CHK-FE-13","CP 45/55 visual D1","/governance/params","GET country-ledger","cp_epochs","DE_Ledger","public","45/55 display","DE CP","TESTNET_DONE",4,"PASS","public","four-ledger page"),
("CHK-FE-14","Admin read C1","/admin","—","audit_trail","—","Admin","no spend","—","DEV_DONE",11,"OPEN","Admin","C1录屏"),
("CHK-FE-15","Multi-id B1/B3/B4","/me/identities","GET /me/*","users","—","multi","—","—","DEV_DONE",12,"OPEN","Owner","B1-4录屏"),
("CHK-FE-16","Delegate UI","/governance/delegate","GET/POST delegate","—","Governor","TTG holder","—","—","DEV_DONE",6,"OPEN","TTG holder","live delegate P2"),
("CHK-FE-17","Vault forwards","/governance/vault-forwards","GET vault-forwards","—","RegionVault","public","escrow forward","FeeRouter escrow","TESTNET_DONE",4,"PARTIAL","public","orthogonal fee"),
("CHK-FE-18","Fee routes","/governance/fee-routes","GET fee-routes","—","FeeRouter","public","65/20/15","Escrow fee pool","TESTNET_DONE",4,"PARTIAL","public","≠ NetProfit SSOT"),
])

# Continue with remaining sections - abbreviated in script for length
# BE, DB, ADM, ID, FN, SC, UP, OPS, DR, BASE - same as inline script above

BE = [
("CHK-BE-01","protocol-reference","—","GET /governance/protocol-reference","—","multi","public","GOV mirror","—","TESTNET_DONE",1,"PASS","public","C-GOV-011"),
("CHK-BE-02","params API","/governance/params","GET /governance/params","—","DE_Ledger·PM","public","45/55 params","DE CP","TESTNET_DONE",4,"PASS","public","params SSOT"),
("CHK-BE-03","country-ledger DE","—","GET /governance/country-ledger/:j","cp_epochs·lines","DE_Ledger","session","ledger read","DE CP","TESTNET_DONE",13,"PASS","session user","four-ledger API"),
("CHK-BE-04","proposals API","—","GET /governance/proposals","governance_proposals","Governor","public","—","—","TESTNET_DONE",6,"PASS","public","indexer"),
("CHK-BE-05","vote API","—","POST …/vote","governance_proposals","Governor","voter","—","—","TESTNET_DONE",6,"PARTIAL","voter","API+wallet dual"),
("CHK-BE-06","proposal-status","—","GET /governance/proposal-status/:id","governance_proposals","Governor","public","—","V2 Timelock","TESTNET_DONE",6,"PASS","public","queue status"),
("CHK-BE-07","ttg-exchange quote","—","GET /governance/ttg-exchange/quote","—","PM","public","USDC→TTG","Primary Market","TESTNET_DONE",5,"PASS","public","RPC read"),
("CHK-BE-08","investor accruals","/governance/distribution-accruals","GET investor-distribution-accruals","investor_accruals","—","Investor","accrual","—","DEV_DONE",8,"OPEN","Investor","DB dependent"),
("CHK-BE-09","internal distribution write","—","POST /internal/investor-distribution-*","investor_accruals","—","internal","accrual write","—","DEV_DONE",8,"OPEN","Distribution Admin","internal only"),
("CHK-BE-10","fee-pool-aggregates","—","GET /governance/fee-pool-aggregates","fee aggregates","—","public","Σ read","FeeRouter","DEV_DONE",4,"OPEN","Finance Op","ERP reconcile P2"),
("CHK-BE-11","state-machines","/governance/params","GET /governance/state-machines","—","DE_Ledger","public","epoch FSM","DE CP","TESTNET_DONE",4,"PASS","public","state_machines.rs"),
("CHK-BE-12","steward APIs","/governance?view=region","GET /steward/*","steward apps","StakePool·Seat","Steward","stake·apply","Region stake","TESTNET_DONE",7,"PARTIAL","Steward","stake ② unstake OPEN"),
("CHK-BE-13","audit observability","/admin","audit endpoints","audit_trail","—","Admin·SRE","—","—","DEV_DONE",1,"OPEN","SRE","TTG SEV-1 bind"),
]
bulk(BE)

DB = [
("CHK-DB-01","proposals projection","—","—","governance_proposals","Governor events","indexer","—","—","TESTNET_DONE",6,"PASS","SRE","indexer ②"),
("CHK-DB-02","rewards projection","/governance","GET /governance/rewards","governance_rewards","—","auth","—","—","DEV_DONE",8,"OPEN","SRE","drift risk P1"),
("CHK-DB-03","cp epochs projection","—","—","country_pool_net_profit_epochs","DE_Ledger","indexer","NPP epochs","DE CP","DEV_DONE",4,"OPEN","SRE","CPNP deferred"),
("CHK-DB-04","accrual lines projection","—","—","country_pool_net_profit_accrual_lines","DE_Ledger","indexer","accrual lines","DE CP","DEV_DONE",4,"OPEN","SRE","CPNP deferred"),
("CHK-DB-05","investor accrual reconcile","—","GET accruals","investor_accruals","—","Finance Op","accrual=DB","—","DEV_DONE",8,"OPEN","Finance Op","monthly sign"),
("CHK-DB-06","Four-Ledger DB leg","—","reconcile","cp_*·accruals","DE_Ledger","Finance Op","DB=chain","DE CP","DEV_DONE",13,"OPEN","Finance Op","run w/ DATABASE_URL"),
("CHK-DB-07","audit trail","/admin","audit","audit_trail","—","Admin","—","—","DEV_DONE",11,"OPEN","Admin","incident trail"),
("CHK-DB-08","PG backup restore drill","—","—","all gov tables","—","SRE","—","—","DEV_DONE",14,"OPEN","SRE","DR PG restore"),
]
bulk(DB)

ADM = [
("CHK-ADM-01","Gov admin walkthrough C1","/admin","—","audit_trail","—","Admin","read only","—","DEV_DONE",11,"OPEN","Admin","Cert#3"),
("CHK-ADM-02","Treasury admin no spend","/admin","—","—","GovTreasury","Admin","forbidden spend","Global","DEV_DONE",11,"OPEN","Admin","C1 boundary"),
("CHK-ADM-03","CP admin no split","/admin","—","cp_epochs","DE_Ledger","Admin","no split write","DE CP","DEV_DONE",11,"OPEN","Admin","no on-chain split btn"),
("CHK-ADM-04","Steward review walk","/admin","POST steward review","steward apps","Seat","Admin","Seat gate","Region","DEV_DONE",7,"OPEN","Admin","Q-01 TL batch"),
("CHK-ADM-05","Distribution admin write","/admin","internal POST","investor_accruals","—","Distribution Admin","internal write","—","DEV_DONE",8,"OPEN","Distribution Admin","internal gate"),
("CHK-ADM-06","RBAC SoD ADM-U02","/admin/rbac","—","users","—","Admin","SoD","—","DEV_DONE",2,"OPEN","Owner","POL-06"),
("CHK-ADM-07","suspend no 45/55","/admin","suspend","users","—","Admin","gate only","DE CP","DEV_DONE",11,"OPEN","Admin","C2录屏"),
("CHK-ADM-08","Seat→链上 E2E","/admin","—","steward apps","Seat·StakePool","Admin","Seat active","Region","DEV_DONE",7,"OPEN","Admin","GORP-13 ops"),
]
bulk(ADM)

IDS = [
("CHK-ID-01","Traveler boundary","/me/*·/governance","GET /me/*","users","—","Traveler","—","—","DEV_DONE",12,"OPEN","Owner","W-T walk"),
("CHK-ID-02","Investor boundary","/governance/distribution-*","GET accruals","investor_accruals","—","Investor","distribution read","—","DEV_DONE",12,"OPEN","Owner","W-I walk"),
("CHK-ID-03","Steward boundary","/governance?view=region","GET steward/*","—","StakePool","Steward","stake path","Region","DEV_DONE",12,"OPEN","Owner","W-S walk"),
("CHK-ID-04","Guide boundary","/guide/*","—","—","—","Guide","no gov write","—","DEV_DONE",12,"OPEN","Owner","isolation walk"),
("CHK-ID-05","Merchant boundary","/provider/*","—","—","—","Merchant","no gov write","—","DEV_DONE",12,"OPEN","Owner","isolation walk"),
("CHK-ID-06","Moderator boundary","/moderation/*","—","—","—","Moderator","no Treasury","—","DEV_DONE",12,"OPEN","Owner","B4 walk"),
("CHK-ID-07","Admin boundary walk","/admin","—","audit_trail","—","Admin","read/gate","—","DEV_DONE",12,"OPEN","Owner","W-A walk"),
("CHK-ID-08","Treasury Op POL-01","Safe+doc","—","—","Safe·GovTreasury","Treasury Op","Safe sign","Global","DEV_DONE",2,"OPEN","Owner","POL-01 sign"),
("CHK-ID-09","Finance Op POL-02","doc","—","—","DE_Ledger","Finance Op","fundingSource","DE CP","DEV_DONE",2,"OPEN","Owner","POL-02 sign"),
("CHK-ID-10","Safe Signer POL-03","Safe UI","—","—","Safe","Safe Signer","multisig","—","DEV_DONE",2,"OPEN","Owner","POL-03 sign"),
("CHK-ID-11","TL Executor on-call","GORP","—","—","V2_TL","On-call","execute","Timelock","DEV_DONE",2,"OPEN","Owner","on-call roster"),
("CHK-ID-12","POL-06 Seat SoD","/admin","—","users","Seat","Admin","SoD sign","Region","DEV_DONE",2,"OPEN","Owner","POL-06 sign"),
]
bulk(IDS)

FN = [
("CHK-FN-01","USDC→TTG Primary Market","/governance/params","GET ttg-exchange/quote","—","PM","Investor","USDC in→TTG","Primary Market","TESTNET_DONE",5,"PARTIAL","Investor","live purchase P2"),
("CHK-FN-02","Treasury P1–P4 spend","/governance/params#treasury","—","—","GovTreasury","V2_TL","USDC spend","Global Treasury","DEV_DONE",3,"BLOCKED","Treasury Op","Cert#8"),
("CHK-FN-03","CP Revenue 45/55","/governance/params","GET country-ledger","cp_epochs","DE_Ledger","Finance Op","NPP split","DE CP","TESTNET_DONE",4,"PASS","Finance Op","cutover split"),
("CHK-FN-04","Steward 45% path","/governance/params","—","—","StewardVault·UnallocVault","Steward","45% vault","DE CP","TESTNET_DONE",4,"PASS","Steward","eligible/ineligible"),
("CHK-FN-05","Global 55%→V2 TL","/governance/params","GET country-ledger","cp_epochs","DE_Ledger","Ledger owner TL","55% USDC","Global Treasury","TESTNET_DONE",4,"PASS","Finance Op","+605000 raw"),
("CHK-FN-06","holder distribution path","/governance/distribution-*","GET accruals","investor_accruals","—","Investor","accrual","—","DEV_DONE",8,"OPEN","Investor","orthogonal steward"),
("CHK-FN-07","Buyback","/governance/params","—","—","GovTreasury","Timelock","USDC buyback","Global Treasury","DEV_DONE",9,"OPEN","Treasury Op","pre-enable"),
("CHK-FN-08","Burn","/governance/params","—","—","TTG","Timelock","TTG burn","TTG supply","DEV_DONE",9,"OPEN","Treasury Op","pre-enable"),
("CHK-FN-09","Claim live","/governance/distribution-claim","—","investor_accruals","InvestorDistributionClaim","Investor","USDC out","—","DEV_DONE",8,"OPEN","Investor","live tx P1"),
("CHK-FN-10","Distribution accrual","/governance/distribution-accruals","GET accruals","investor_accruals","—","Investor","register accrual","—","DEV_DONE",8,"OPEN","Finance Op","internal+read"),
("CHK-FN-11","fundingSource custody","doc","—","—","DE_Ledger","Finance Op","USDC pull approve","DE CP","DEV_DONE",3,"OPEN","Finance Op","custody sign"),
("CHK-FN-12","Four-Ledger full+DB","/governance/params","GET country-ledger","cp_*","DE_Ledger","Finance Op","chain=API=page(+DB)","DE CP","TESTNET_DONE",13,"PARTIAL","Finance Op","DB leg OPEN"),
]
bulk(FN)

SC = [
("CHK-SC-01","Governor lifecycle+Execute","/governance/proposals/*","—","—","Governor","proposer·voter","—","Governance","DEV_DONE",6,"PARTIAL","Governor","Phase A yes Execute BLOCKED"),
("CHK-SC-02","V2 Timelock queue/execute","/governance/proposals/[id]","GET proposal-status","—","V2_TL","anyone","schedule/execute","V2 Timelock","DEV_DONE",6,"PARTIAL","On-call","queue ② exec BLOCKED"),
("CHK-SC-03","Legacy TL NetProfit batch","—","—","cp_epochs","Legacy_TL·DE_Ledger","Safe→Legacy TL","batch ops","DE CP","TESTNET_DONE",4,"PASS","Treasury Op","cutover exec logs"),
("CHK-SC-04","GovTreasury spend","—","—","—","GovTreasury","V2_TL only","USDC out","Global Treasury","DEV_DONE",3,"BLOCKED","V2_TL","Phase B spend"),
("CHK-SC-05","PM purchase contract","/governance/params","GET quote","—","PM","buyer EOA","USDC→TTG","Primary Market","TESTNET_DONE",5,"PARTIAL","Investor","quote ② live skip"),
("CHK-SC-06","StakePool stake/unstake","/governance?view=region","GET steward/*","—","StakePool","Steward","TTG lock/unlock","Region stake","DEV_DONE",7,"PARTIAL","Steward","stake ② unstake BLOCKED"),
("CHK-SC-07","Seat Registry","/governance?view=region","POST applications","steward apps","Seat","Steward","Seat logic","Region","TESTNET_DONE",7,"PARTIAL","Steward","apply partial"),
("CHK-SC-08","DE NetProfit epoch","—","GET country-ledger","cp_epochs","DE_Ledger","Ledger owner TL","epoch FSM","DE CP","TESTNET_DONE",4,"PASS","Finance Op","drill accrue/close"),
("CHK-SC-09","StewardPathVault","—","—","—","StewardVault","ledger only","45% eligible","DE CP","TESTNET_DONE",4,"PASS","Steward","depositFromLedger"),
("CHK-SC-10","UnallocatedStewardVault","—","—","—","UnallocVault","ledger only","45% ineligible","DE CP","TESTNET_DONE",4,"PASS","Finance Op","495000 unalloc"),
("CHK-SC-11","settlementPaused drill","—","—","cp_epochs","DE_Ledger","Owner","pause split","DE CP","DEV_DONE",14,"OPEN","Owner","DR-05 drill"),
("CHK-SC-12","双 Timelock 运维矩阵","Safe+doc","—","—","V2_TL·Legacy_TL","Treasury Op","matrix","Timelock","DEV_DONE",3,"OPEN","Treasury Op","GORP-08 post"),
]
bulk(SC)

UP = [
("CHK-UP-01","Proxy upgrade drill","—","—","—","Proxy","Timelock","—","—","DEV_DONE",10,"OPEN","Owner","DR upgrade drill"),
("CHK-UP-02","Upgrade authority doc","/governance/params","GET state-machines","—","Proxy·V2_TL","public","Timelock upgrade","Governance","TESTNET_DONE",10,"PASS","Owner","G24-P-UPGRADE machine"),
("CHK-UP-03","Emergency upgrade 08-4","doc","—","—","Proxy·GovTreasury","Owner","emergency path","Global Treasury","DEV_DONE",10,"OPEN","Owner","08-4 bind P0③"),
("CHK-UP-04","Rollback drill","—","—","—","Proxy","Owner","rollback","—","DEV_DONE",10,"OPEN","Owner","EVD-G10 drill"),
("CHK-UP-05","UPGRADE posture ops","/governance/params","GET protocol-reference","—","Proxy","Owner","ops confirm","—","TESTNET_DONE",10,"PARTIAL","Owner","GORP sign pending"),
]
bulk(UP)

OPS = [
("CHK-OPS-01","GORP Authority roster","GORP §1.3","—","—","—","Owner","—","—","DEV_DONE",1,"OPEN","Owner","GORP-01 sign"),
("CHK-OPS-02","Finance walk GORP-05","doc","—","—","DE_Ledger","Finance Op","W-F","DE CP","DEV_DONE",3,"OPEN","Finance Op","Cert#5"),
("CHK-OPS-03","Safe walk GORP-06","Safe","—","—","Safe","Treasury Op","Safe ops","Global Treasury","DEV_DONE",3,"OPEN","Treasury Op","Cert#4"),
("CHK-OPS-04","Runbook confirm GORP-02","GORP","—","—","—","Owner","—","—","DEV_DONE",1,"OPEN","Owner","GORP-02"),
("CHK-OPS-05","双 TL 矩阵 GORP-08","Safe wall","—","—","V2_TL·Legacy_TL","Treasury Op","matrix posted","Timelock","DEV_DONE",3,"OPEN","Treasury Op","print+post"),
("CHK-OPS-06","settlementPaused policy GORP-09","doc","—","—","DE_Ledger","Owner","pause policy","DE CP","DEV_DONE",4,"OPEN","Owner","GORP-09 sign"),
("CHK-OPS-07","SEV-1 POL-08","incident","—","audit_trail","—","Owner","TTG incident","—","DEV_DONE",1,"OPEN","Owner","POL-08"),
("CHK-OPS-08","Four-Ledger standing GORP-11","reconcile","reconcile scripts","cp_*","DE_Ledger","Finance Op","monthly","DE CP","DEV_DONE",13,"OPEN","Finance Op","REC-06 template"),
("CHK-OPS-09","GORP-SIGNOFF.json","—","—","—","—","Owner","—","—","DEV_DONE",1,"OPEN","Owner","Cert#12"),
("CHK-OPS-10","GECP-SIGNOFF.json","—","—","—","—","Owner","—","—","DEV_DONE",1,"OPEN","Owner","Enterprise 100"),
("CHK-OPS-11","Phase B evidence GORP-07","/governance/proposals/[id]","—","—","V2_TL·GovTreasury·StakePool","Owner","Execute→Spend→Unstake","multi","DEV_DONE",6,"BLOCKED","Owner","Cert#6-9"),
("CHK-OPS-12","HUMAN-SCREEN signoff","/governance/*","—","—","—","Owner","UAT sign","multi","DEV_DONE",1,"OPEN","Owner","Cert#1"),
]
bulk(OPS)

DR = [
("CHK-DR-01","Execute/CallFailed RB-G-01","/governance/proposals/[id]","—","—","V2_TL","On-call","failed execute","V2 Timelock","DEV_DONE",14,"OPEN","On-call","Cert#10 tabletop"),
("CHK-DR-02","Treasury mis-transfer RB-G-05","—","—","—","GovTreasury","Treasury Op","USDC mis-route","Global Treasury","DEV_DONE",14,"OPEN","Treasury Op","tabletop"),
("CHK-DR-03","CP split interrupt RB-G-03","—","—","cp_epochs","DE_Ledger","Finance Op","split fail","DE CP","DEV_DONE",14,"OPEN","Finance Op","DR-03 drill"),
("CHK-DR-04","TL/Safe stall RB-G-02","Safe","—","—","V2_TL·Safe","Treasury Op","stuck ops","Timelock","DEV_DONE",14,"OPEN","Treasury Op","DR-04 drill"),
("CHK-DR-05","settlementPaused RB-G-04","—","—","cp_epochs","DE_Ledger","Owner","pause","DE CP","DEV_DONE",14,"OPEN","Owner","DR-05 drill"),
("CHK-DR-06","fundingSource leak REC-07","—","—","—","DE_Ledger","Finance Op","key rotate","DE CP","DEV_DONE",14,"OPEN","Finance Op","REC-07"),
("CHK-DR-07","Four-Ledger FAIL REC-06","reconcile","reconcile","cp_*","DE_Ledger","Finance Op","FAIL triage","DE CP","DEV_DONE",13,"OPEN","Finance Op","standing template"),
("CHK-DR-08","CPNP replay REC-08","—","indexer replay","cp_*","DE_Ledger","SRE","indexer replay","DE CP","DEV_DONE",14,"OPEN","SRE","REC-08"),
("CHK-DR-09","RTO/RPO sign","doc","—","—","—","Owner","DR numbers","—","DEV_DONE",14,"OPEN","Owner","RTO/RPO sign"),
("CHK-DR-10","Incident tabletop GORP-03","—","—","—","multi","Owner","incident","multi","DEV_DONE",14,"OPEN","Owner","Cert#10 HW-06"),
]
bulk(DR)

BASE = [
("CHK-BASE-01","GovFreeze V2 baseline","—","GET /meta","—","multi","observability","—","GovFreeze","TESTNET_DONE",1,"PASS","Owner","baseline freeze record"),
("CHK-BASE-02","Legacy rollback forbid","—","—","—","Legacy stack","—","forbidden rollback","Legacy","TESTNET_DONE",1,"PASS","Owner","assert script"),
("CHK-BASE-03","Enterprise HAT L9 machine","—","—","—","—","—","—","DE CP","TESTNET_DONE",13,"PASS","Owner","L9-RECHECK.json"),
("CHK-BASE-04","CP HAT four-ledger machine","/governance/params","GET country-ledger","—","DE_Ledger","—","four-ledger","DE CP","TESTNET_DONE",13,"PASS","Finance Op","20260616T084248Z"),
("CHK-BASE-05","HAT-R1 Phase A chain","/governance/proposals/*","multi","governance_proposals","Governor·PM·StakePool","HAT wallet","Phase A txs","multi","TESTNET_DONE",6,"PASS","Owner",HAT_R1_STAMP),
("CHK-BASE-06","HUMAN-ENTERPRISE-HAT sign","—","—","—","—","Owner","human sign","—","DEV_DONE",1,"OPEN","Owner","HUMAN-ENTERPRISE sign"),
]
bulk(BASE)

assert len(ROWS) == 146, f"expected 146 rows got {len(ROWS)}"

MATRIX_NAMES = {
    1: "Governance Function Matrix",
    2: "Governance Permission Matrix",
    3: "Governance Treasury Matrix",
    4: "Country Pool Matrix",
    5: "TTG Purchase Matrix",
    6: "Proposal/Vote/Queue/Execute Matrix",
    7: "Stake/Seat/Unstake Matrix",
    8: "Claim/Distribution Matrix",
    9: "Buyback/Burn Matrix",
    10: "Upgrade/Proxy Matrix",
    11: "Admin Boundary Matrix",
    12: "Multi-Identity Matrix",
    13: "Four-Ledger Matrix",
    14: "Disaster Recovery Matrix",
}

HEADER = "| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |"
SEP = "|---|" + "---|" * 12


def row_line(r: dict) -> str:
    sc = CONTRACTS.get(r["sc"], r["sc"])
    return (
        f"| {r['id']} | {r['name']} | {r['page']} | {r['api']} | {r['db']} | {sc} | "
        f"{r['role']} | {r['flow']} | {r['pool']} | {r['tier']} | {r['status']} | "
        f"{r['owner']} | {r['recovery']} |"
    )


def main() -> None:
    overrides = load_tier_overrides()
    for r in ROWS:
        r["tier"] = effective_tier(r["tier"], overrides, r["id"])

    dev = sum(1 for r in ROWS if r["tier"] == "DEV_DONE")
    tn = sum(1 for r in ROWS if r["tier"] == "TESTNET_DONE")
    human = sum(1 for r in ROWS if _tier_rank(r["tier"]) >= _tier_rank("HUMAN_DONE"))
    ops = sum(1 for r in ROWS if _tier_rank(r["tier"]) >= _tier_rank("OPS_DONE"))
    dr = sum(1 for r in ROWS if r["tier"] == "DR_DONE")
    human_exact = sum(1 for r in ROWS if r["tier"] == "HUMAN_DONE")
    ops_exact = sum(1 for r in ROWS if r["tier"] == "OPS_DONE")
    cert_done_n = 0
    if OVERRIDES_PATH.exists():
        cert_done_n = len(
            json.loads(OVERRIDES_PATH.read_text(encoding="utf-8")).get("cert_queue_completed", [])
        )
    ent_score = min(
        100,
        53
        + int(45 * human / 58)
        + int(20 * ops / 34)
        + int(12 * dr / 20)
        + cert_done_n,
    )
    mtm_key = f"TTG_GOV_MTM: ROWS=146 DEV={dev} TN={tn} HUMAN={human} OPS={ops} DR={dr}"

    F_ent = [
        "CHK-CORE-01", "CHK-CORE-07", "CHK-CORE-08", "CHK-FE-08", "CHK-FN-02",
        "CHK-SC-01", "CHK-SC-02", "CHK-SC-04", "CHK-SC-06", "CHK-OPS-09",
        "CHK-OPS-10", "CHK-OPS-11", "CHK-OPS-12", "CHK-BASE-06",
    ]

    lines = [
        "# TTG Governance Master Traceability Matrix",
        "",
        "**Matrix ID:** `TTG-GOV-MASTER-TRACEABILITY`",
        "**Version:** v1-20260616",
        "**Mode:** Governance Master Traceability Matrix Certification · Certification-Only",
        "**Baseline:** [GovFreeze V2 Clean Baseline](GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)",
        "**Parent:** [Full Coverage Certification Report](TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md)",
        "",
        "**禁止：** 新增功能 · Tokenomics 变更 · 开发/GovFreeze 复审计",
        "",
        "**Tier：** `DEV_DONE` → `TESTNET_DONE` → `HUMAN_DONE` → `OPS_DONE` → `DR_DONE`",
        "**状态：** `PASS` · `PARTIAL` · `OPEN` · `BLOCKED`",
        "",
        f"**总行数：146** · DEV_DONE **{dev}** · TESTNET_DONE **{tn}** · HUMAN_DONE **{human}** · OPS_DONE **{ops}** · DR_DONE **{dr}**",
        "",
        f"**机读键：** `{mtm_key}`",
        "",
        "**Gate-2.4：** **G24-MTM-01**",
        "",
        "---",
        "",
        "## 分类 A～G",
        "",
        "### A · 已完成（100% 覆盖 · DR_DONE + Ent ☑）",
        "",
        "**0 项**",
        "",
        f"### B · 已开发未验证（DEV_DONE · {dev} 项）",
        "",
    ]
    lines.append(", ".join(r["id"] for r in ROWS if r["tier"] == "DEV_DONE"))
    lines += [
        "",
        f"### C · 已测试网未真人验证（TESTNET_DONE · {tn} 项）",
        "",
    ]
    lines.append(", ".join(r["id"] for r in ROWS if r["tier"] == "TESTNET_DONE"))
    human_done_ids = [r["id"] for r in ROWS if _tier_rank(r["tier"]) >= _tier_rank("HUMAN_DONE")]
    lines += [
        "",
        f"### D · 已真人验证未运营验证（HUMAN_DONE · {human} 项）",
        "",
    ]
    if human_done_ids:
        lines.append(", ".join(human_done_ids))
    else:
        lines.append("**0 项**")
    lines += [
        "",
        f"### E · 已运营验证未灾备验证（OPS_DONE · {ops} 项）",
        "",
        "**0 项**" if ops_exact == 0 else ", ".join(r["id"] for r in ROWS if r["tier"] == "OPS_DONE"),
        "",
        "### F · 企业级阻塞项",
        "",
    ]
    for i in F_ent:
        lines.append(f"- {i}")
    lines.append(
        f"- Enterprise Ent ☑ **0/146** · Human **{human}/58** · Ops **{ops}/34** · DR **{dr}/20** · Score **{ent_score}/100**"
    )
    lines += [
        "",
        "### G · Production 阻塞项（③）",
        "",
        "- CHK-UP-03（08-4 emergency · ③ KYC/LEG）",
        "- CHK-CORE-17 · CHK-ID-08 · CHK-ID-10（Safe 异名双人 · ③）",
        "- 主网部署 · Production PSP · B-475 prod restore · 十国 CP 全矩阵（若 ③ 宣称）",
        "- ② Governance Production Ready **NOT** · ③ Production GO **NOT**",
        "",
        "---",
        "",
    ]

    for m in range(1, 15):
        subset = [r for r in ROWS if r["matrix"] == m]
        lines.append(f"## {m} · {MATRIX_NAMES[m]}（{len(subset)} 项）")
        lines.append("")
        lines.append(HEADER)
        lines.append(SEP)
        for r in subset:
            lines.append(row_line(r))
        lines.append("")
        lines.append("---")
        lines.append("")

    lines += [
        "## 附录 · Master Index（146 项 · §0→§11 全序）",
        "",
        HEADER,
        SEP,
    ]
    for r in ROWS:
        lines.append(row_line(r))
    lines += [
        "",
        "---",
        "",
        "## 追溯问题一览",
        "",
        "| 问题 | 如何读本矩阵 |",
        "|------|--------------|",
        "| **做没做** | Tier ≥ DEV_DONE |",
        "| **测没测（②）** | Tier ≥ TESTNET_DONE · 状态 PASS/PARTIAL |",
        "| **真人测过** | Tier ≥ HUMAN_DONE |",
        "| **运营签字** | Tier ≥ OPS_DONE |",
        "| **灾备 drill** | Tier = DR_DONE |",
        "| **谁能用/不能用** | 「权限角色」列 |",
        "| **钱从哪来/到哪去** | 「资金流」「依赖池」列 |",
        "| **事故谁负责** | 「负责人」列 |",
        "| **如何恢复** | 「恢复」列 + GORP/DR runbook |",
        "",
        "**Regenerate:** `python scripts/dev/gen-ttg-governance-master-traceability-matrix.py`",
        "",
    ]

    out = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(mtm_key)
    print(f"TTG_GOV_MTM: OK rows={len(ROWS)} path={out}")


if __name__ == "__main__":
    main()
