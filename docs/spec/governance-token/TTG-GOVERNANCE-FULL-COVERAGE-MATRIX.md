# TTG Governance Full Coverage Matrix

> **SUPERSEDED · READ-ONLY · replaced by MTM 146** — [TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md](TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md) 为 **ACTIVE** 执行真源；本矩阵 **禁止** 扩写 · 仅作 cutover 旁证。

**Matrix ID:** `TTG-GOVERNANCE-FULL-COVERAGE-MATRIX`  
**Version:** v1-20260616  
**Generated:** 20260616T090309Z (UTC)  
**Phase:** **② Sepolia 经济基线锁定** · **≠ ③ Production GO**  
**Baseline SSOT:** GovFreeze V2 + Four-Ledger PASS (`20260616T084248Z`)  
**Policy:** 停止 Tokenomics 设计变更 · 停止新增治理开发/测试 · 仅验收维护窗  

---

## 列说明

| 列 | 含义 |
|----|------|
| 模块 | 治理域顶层 |
| 功能 / 子功能 | 能力分解 |
| 页面 | 前端路由（`—` = 无专页） |
| API | HTTP 读/写面 |
| 合约 | 链上组件或 env SSOT |
| 权限 | 角色/门闸 |
| 资金流 | 资金走向摘要 |
| 测试状态 | PASS / PARTIAL / FAIL / NOT TESTED |
| 证据路径 | 仓库内路径（② 优先） |
| 缺口 | P0 / P1 / P2 / — |
| 验证分类 | 七类清单键 |

---

## 覆盖率统计

| 指标 | 值 |
|------|-----|
| 矩阵行数 | **87** |
| PASS | **51** (58.6%) |
| PARTIAL | **23** (26.4%) |
| FAIL | **1** (1.1%) |
| NOT TESTED | **12** (13.8%) |
| 已触达测试（PASS+PARTIAL+FAIL） | **75** (86.2%) |
| P0 缺口行 | **6** |
| P1 缺口行 | **18** |
| P2 缺口行 | **11** |

---

## 完整矩阵

| # | 模块 | 功能 | 子功能 | 页面 | API | 合约 | 权限 | 资金流 | 测试状态 | 证据路径 | 缺口 | 验证分类 |
|---|------|------|--------|------|-----|------|------|--------|----------|----------|------|----------|
| 1 | GOV-FREEZE-V1 | Tokenomics SSOT | TTG supply 10B / rounds | /governance/params | GET /governance/protocol-reference | TtgPrimaryMarketV1 · TTG | public read | USDC→PM→TTG | **PASS** | docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md | — | 已验证 |
| 2 | GOV-FREEZE-V1 | Tokenomics SSOT | 45/55 NetProfit bps | /governance/params | GET /governance/params | CountryPoolNetProfitLedger | public read | NPP→45% steward / 55% global | **PASS** | frontend/lib/governanceParamsTtgTokenomicsFreeze.ts · cutover-drill/20260616T082259Z | — | 已验证 |
| 3 | GOV-FREEZE-V1 | Tokenomics SSOT | P1–P4 treasury policy copy | /governance/params#gov-params-treasury-policy | GET /governance/protocol-reference | GovernanceTreasury · P4Cap | public read | P4 via governance only | **PASS** | GOVERNANCE-PARAMS-L5-FREEZE.md | — | 需真人验证 |
| 4 | GOV-FREEZE-V2 | Sepolia baseline | V2 shell addresses frozen | — | GET /meta | Governor·Timelock·PM·Pool·Seat | observability read | — | **PASS** | GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md · 20260616T054554Z | — | 已验证 |
| 5 | GOV-FREEZE-V2 | Sepolia baseline | Legacy stack read-only | — | — | LEGACY_* env | forbidden rollback | — | **PASS** | assert-gov-freeze-v2-active-baseline-only.sh | — | 已验证 |
| 6 | GOV-01 | Treasury P4 deploy cap | 30% cap enforce | /governance/params | GET /governance/protocol-reference | GovernanceTreasuryP4Cap 0xc1de… | Timelock path | deploy cap not spend | **PASS** | G24-GOV-01 · verify-gov-freeze-v1-sepolia-onchain.sh | — | 需链上验证 |
| 7 | GOV-02 | Quorum + Timelock | 400 bps quorum · 48h delay | /governance/proposals/[id] | GET /governance/proposal-status/:id | Governor·Timelock 0x904a… | Governor queue | — | **PASS** | G24-GOV-02 · HAT-R1 Phase A queue tx | — | 需链上验证 |
| 8 | GOV-03 | Seat concentration | vote cap 400 bps | /governance?view=region | GET /governance/voting-power | TtgSeatConcentrationRegistry | Seat holder | — | **PASS** | G24-GOV-CONC-01 · GO_governance_concentration_audit_sepolia/ | — | 需链上验证 |
| 9 | GOV-03 | Seat concentration | stake aggregate cap | /governance?view=region | GET /steward/stake-status | RegionStewardStakePool | steward | TTG stake lock | **PASS** | concentration audit · Phase A stake | — | 需链上验证 |
| 10 | GOV-04 | Primary Market | 25k per wallet cap | /governance/params | GET /governance/ttg-exchange/quote | TtgPrimaryMarketV1 0x7af1… | buyer EOA | USDC→PM | **PASS** | G24-GOV-04 · Enterprise HAT L2 | — | 需链上验证 |
| 11 | GOV-04 | Primary Market | min 100 USDC purchase | — | GET /governance/ttg-exchange/quote | TtgPrimaryMarketV1 | buyer | USDC in | **PARTIAL** | Enterprise HAT L2 · HAT-R1 purchase skipped (USDC=0) | P2 | 需链上验证 |
| 12 | Primary Market | Purchase flow | approve + purchase tx | — | — | TtgPrimaryMarketV1 | wallet signer | USDC→TTG | **PARTIAL** | HAT-R1 Phase A skip · forge local tests PASS | P2 | 需链上验证 |
| 13 | Primary Market | Exchange quote API | quote read | — | GET /governance/ttg-exchange/quote | TtgPrimaryMarketV1 | public | — | **PASS** | ttg_exchange_quote.rs · ② RPC read | — | 已验证 |
| 14 | Seat / Stake | Stake quote | 10 jurisdictions min stake | /governance?view=region | GET /steward/stake-quote | RegionStewardStakePool 0x3a89… | steward applicant | TTG lock | **PASS** | Phase A stake tx · G24-SPB-01 | — | 需链上验证 |
| 15 | Seat / Stake | Stake status | on-chain stake read | /governance?view=region | GET /steward/stake-status | RegionStewardStakePool | authenticated | — | **PASS** | HAT-R1 Phase A evidence/GO_hat_r1_sepolia/20260616T063612Z/ | — | 需链上验证 |
| 16 | Seat / Stake | Seat application | POST application | /governance?view=region | POST /steward/applications | DB + gate | auth user | — | **PARTIAL** | Enterprise HAT L3 · ② full admin approve NOT TESTED | P1 | 需真人验证 |
| 17 | Seat / Stake | 180d resign notice | resign API | /governance?view=region | POST /steward/resign-notice | StakePool release path | steward | TTG unlock after notice | **NOT TESTED** | steward.rs · Gate-2.4 | P1 | 需链上验证 |
| 18 | Seat / Stake | Finalize resign / unstake | exit tx | /governance?view=region | POST /steward/finalize-resign | RegionStewardStakePool | steward | TTG return | **NOT TESTED** | HAT-R1 Phase B scope · PAUSED | P0 | 需链上验证 |
| 19 | Governor | Propose | create proposal UI | /governance/proposals/new | — | TravelTrustGovernor 0x847b… | proposer | — | **PARTIAL** | governanceProposalCreatePage.contract.test.ts · ② live NOT TESTED | P1 | 需链上验证 |
| 20 | Governor | Propose | list proposals | /governance/proposals | GET /governance/proposals | Governor events / DB | public | — | **PASS** | C-GOV-002 · indexer ② | — | 已验证 |
| 21 | Governor | Vote | cast vote wallet | /governance/proposals/[id] | POST /governance/proposals/:id/vote | Governor | voter | — | **PARTIAL** | Phase A vote capped · API stub ① PASS | P1 | 需链上验证 |
| 22 | Governor | Vote | vote on-chain Phase A | /governance/proposals/[id] | — | Governor | HAT wallet | — | **PASS** | HAT-R1 20260616T063612Z · proposal 1 | — | 需链上验证 |
| 23 | Governor | Queue | queue after vote period | /governance/proposals/[id] | GET /governance/proposal-status/:id | Governor→Timelock | anyone after vote | — | **PASS** | HAT-R1 queue tx 0xcfd0… | — | 需链上验证 |
| 24 | Timelock | Execute | execute after 48h | /governance/proposals/[id] | — | Timelock 0x904a… | anyone | payload effect | **NOT TESTED** | HAT-R1 Phase B PAUSED · EXECUTE_EARLIEST_UNIX.txt | P0 | 需链上验证 |
| 25 | Timelock | Schedule admin | legacy ledger ops | — | — | Legacy Timelock 0x0359… | Safe admin | CPNP payloads | **PASS** | cutover-drill/20260616T082259Z exec-*.log | — | 需链上验证 |
| 26 | Treasury | GovernanceTreasury | spend via Timelock only | /governance/params#gov-params-treasury-policy | — | GovernanceTreasury 0x6a83… | Timelock spender | USDC out | **PARTIAL** | Enterprise HAT L5 · spend tx NOT TESTED | P0 | 需财务验证 |
| 27 | Treasury | Global Treasury 55% | NetProfit split leg | /governance/params | GET /governance/country-ledger/DE | CountryPoolNetProfitLedger | ledger owner TL | USDC→V2 Timelock | **PASS** | cutover-drill fund-flow-verdict PASS · +605000 raw | — | 需财务验证 |
| 28 | Treasury | P4 cap contract | deploy cap enforce | — | — | GovernanceTreasuryP4Cap | governance | — | **PASS** | GOV-01 on-chain verify | — | 需链上验证 |
| 29 | 45/55 Revenue | Accrual | recordAccrual R/E codes | — | — | CountryPoolNetProfitLedger | ledger owner | off-chain→ledger | **PASS** | cutover drill-accrue-* logs | — | 需链上验证 |
| 30 | 45/55 Revenue | Close epoch | closeDelay + NPP | — | — | CountryPoolNetProfitLedger | ledger owner | — | **PASS** | cutover drill-close | — | 需链上验证 |
| 31 | 45/55 Revenue | Fund split | fundLedgerForSplit | — | — | CountryPoolNetProfitLedger | fundingSource EOA | USDC pull | **PASS** | cutover drill-fund | — | 需财务验证 |
| 32 | 45/55 Revenue | Split | 45/55 conservation | — | — | CountryPoolNetProfitLedger | ledger owner | 45% vault / 55% TL | **PASS** | four-ledger-reconcile.json PASS · epoch status=4 | — | 需财务验证 |
| 33 | 45/55 Revenue | Ineligible steward | Unallocated 45% leg | — | — | UnallocatedStewardPathVault 0xAbE3… | ledger | 495000 unallocated | **PASS** | post-state.json balances | — | 需财务验证 |
| 34 | Country Pool | NetProfit Ledger DE | on-chain config read | — | GET /governance/country-ledger/DE | 0x270456… | public+session | — | **PASS** | CP Revenue HAT 20260616T084248Z | — | 已验证 |
| 35 | Country Pool | Registry JSON | DE triplet SSOT | — | — | config/jurisdiction_country_pool_net_profit.sepolia.json | — | — | **PASS** | G24-P-07 | — | 已验证 |
| 36 | Country Pool | globalTreasury cutover | V2 Timelock wired | — | — | setSettlementParams via TL | Safe→legacy TL | — | **PASS** | cutover-settlement-params.log | — | 需链上验证 |
| 37 | Country Pool | Ledger owner | legacy TL still owner | — | — | owner=0x0359… | governance future | — | **PARTIAL** | GOV-FREEZE-V2 acceptance-only doc · out of scope | P2 | 无证据 |
| 38 | Vault | StewardPathVault | depositFromLedger | — | — | StewardPathVault 0x6B33… | ledger only | 45% eligible path | **PARTIAL** | drill ineligible→0 steward leg | P2 | 需链上验证 |
| 39 | Vault | UnallocatedStewardVault | depositFromLedger | — | — | UnallocatedStewardPathVault | ledger | 45% ineligible | **PASS** | split event · balance 495000 | — | 需财务验证 |
| 40 | Vault | RegionVault | forward audit UI | /governance/vault-forwards | GET /governance/vault-forwards | RegionVault 0x2Ea0… | read | escrow fee path | **PARTIAL** | C-GOV-008 · ② projection | P2 | 部分验证 |
| 41 | FeeRouter | Fee split 65/20/15 | orthogonal to 45/55 | /governance/fee-routes | GET /governance/fee-routes | FeeRouter 0x81A8… | read | escrow fees | **PARTIAL** | C-GOV-007 · not NetProfit SSOT | P2 | 部分验证 |
| 42 | Distribution | Accrual list | investor accruals read | /governance/distribution-accruals | GET /governance/investor-distribution-accruals | DB projection B-086 | auth/session | off-chain accrual | **PARTIAL** | C-GOV-009 · DB/indexer dependent | P1 | 部分验证 |
| 43 | Distribution | Accrual detail | line detail | /governance/distribution-accruals/[id] | GET /governance/investor-distribution-accruals | DB | auth | — | **PARTIAL** | C-GOV-009 | P1 | 部分验证 |
| 44 | Distribution | Internal accrual write | register accrual | — | POST /internal/investor-distribution-* | DB | internal only | — | **NOT TESTED** | investor_distribution.rs · ② staging | P1 | 未验证 |
| 45 | Claim | InvestorDistributionClaim | withdraw UI | /governance/distribution-claim | — | InvestorDistributionClaim | wallet | USDC to investor | **PARTIAL** | C-GOV-010 · live claim tx NOT TESTED | P1 | 需链上验证 |
| 46 | Claim | P4 auto-dividend boundary | no auto TTG dividend | /governance/distribution-claim | — | — | narrative | — | **PASS** | Enterprise HAT L4 · distributionClaimPage.contract | — | 需真人验证 |
| 47 | Buyback/Burn | Treasury buyback path | governance-only | /governance/params | — | GovernanceTreasury policy | Timelock | USDC→buyback | **NOT TESTED** | TTG-TOKENOMICS-FULL-SYSTEM-AUDIT PASS_WITH_PARTIAL | P1 | 需链上验证 |
| 48 | Buyback/Burn | Burn execution | on-chain burn | — | — | TTG burn hook | governance | TTG supply↓ | **NOT TESTED** | G24-FSA-01 open item | P1 | 需链上验证 |
| 49 | Unstake | Phase B unstake | live wallet exit | /governance?view=region | — | StakePool | steward | TTG unlock | **NOT TESTED** | HAT-R1 Phase B PAUSED | P0 | 需链上验证 |
| 50 | Delegate | Vote delegation UI | delegate page | /governance/delegate | GET/POST/DELETE /governance/delegate | Governor delegation | token holder | — | **PARTIAL** | C-GOV-005 · ② live delegate NOT TESTED | P2 | 需链上验证 |
| 51 | Delegate | Voting power read | snapshot power | — | GET /governance/voting-power | GovernorVotesToken | public/auth | — | **PASS** | C-GOV-006 · Phase A | — | 已验证 |
| 52 | Admin | Governance ops read-only | admin links no spend | — | — | — | admin RBAC read | — | **PASS** | Enterprise HAT L7 | — | 需真人验证 |
| 53 | Admin | Treasury bypass | must not exist | — | — | — | admin denied | — | **PASS** | Enterprise HAT L7 · no POST spend | — | 已验证 |
| 54 | Multi-Role | Traveler vs Steward | data isolation | /me/identities · /governance | GET /me/* | — | role scoped | — | **PARTIAL** | Enterprise HAT L6 · human UAT NOT TESTED | P1 | 需真人验证 |
| 55 | Multi-Role | Merchant/Guide | no governance bleed | — | — | — | RBAC | — | **PARTIAL** | Enterprise HAT L6 | P1 | 需真人验证 |
| 56 | Multi-Role | Moderator | no treasury spend | — | — | — | moderator | — | **PASS** | Enterprise HAT L7 | — | 需真人验证 |
| 57 | UI/UX | Governance hub | pool/rewards read | /governance | GET /governance/pool · /rewards | — | public | — | **PASS** | C-GOV-001 · governance-matrix-local-gate | — | 需真人验证 |
| 58 | UI/UX | Params page L5 freeze | 45/55 visual + GOV table | /governance/params | GET /governance/params | — | public | — | **PASS** | GOVERNANCE-PARAMS-L5-FREEZE · G24-UI-ALIGN-01 | — | 需真人验证 |
| 59 | UI/UX | Steward workbench | stake panel anchors | /governance?view=region | — | — | steward | — | **PASS** | STEWARD-WORKBENCH-L5-FREEZE.md | — | 需真人验证 |
| 60 | UI/UX | Human screen UAT | A1–D4 checklist | see HUMAN-SCREEN checklist | — | — | all roles | — | **NOT TESTED** | G24-HUMAN-UAT-01 · prep 20260616T085954Z | P0 | 需真人验证 |
| 61 | API | Country ledger env priority | NET_PROFIT first | — | GET /governance/country-ledger/:j | chain/mod.rs | session gate | — | **PASS** | crates/api/src/chain/mod.rs fix · four-ledger PASS | — | 已验证 |
| 62 | API | Protocol reference | GOV-01~04 mirror | — | GET /governance/protocol-reference | doc_params | public | — | **PASS** | C-GOV-011 | — | 已验证 |
| 63 | API | Fee pool aggregates | Σ read | — | GET /governance/fee-pool-aggregates | DB/chain | public | — | **PARTIAL** | fee_pool_aggregate.rs | P2 | 部分验证 |
| 64 | API | State machines doc | doc mirror | — | GET /governance/state-machines | — | public | — | **PASS** | state_machines.rs | — | 已验证 |
| 65 | Indexer | Proposal events | index → API list | — | GET /governance/proposals | Governor logs | — | — | **PARTIAL** | ② indexer · ISS-007 partial GO | P1 | 部分验证 |
| 66 | Indexer | NetProfit events | CPNP decoder | — | — | registry/event-decoders/country-pool-net-profit-v1.yaml | — | — | **NOT TESTED** | G24-P-04 decoder impl deferred | P1 | 未验证 |
| 67 | DB | Investor accruals | accrual rows | — | GET investor-distribution-accruals | PostgreSQL | session | — | **PARTIAL** | CP HAT db-snapshot-skipped without DATABASE_URL | P1 | 部分验证 |
| 68 | DB | Governance rewards | reward records | — | GET /governance/rewards | DB | auth | — | **PARTIAL** | governance_reads | P2 | 部分验证 |
| 69 | Exception | USDC=0 purchase | TransferFailed path | — | — | PrimaryMarket | wallet | — | **PASS** | HAT-R1 skip purchase note | — | 已验证 |
| 70 | Exception | Queue GovBadState | wait vote period | — | — | Governor | — | — | **PASS** | HAT-R1 Phase A fix evidence | — | 已验证 |
| 71 | Exception | Session gate 401 | country-ledger auth | — | GET /governance/country-ledger/DE | — | Bearer required | — | **PARTIAL** | CP Revenue HAT step-06 api 401 without token | P2 | 部分验证 |
| 72 | Permission | Timelock allowed targets | B-407 allowlist | — | — | GovernanceTimelock | admin | — | **PASS** | cutover setAllowedExecutionTarget | — | 需链上验证 |
| 73 | Permission | onlySpender Treasury | non-TL reject | — | — | GovernanceTreasury | Timelock only | — | **PASS** | Enterprise HAT L5-01 | — | 已验证 |
| 74 | Financial closure | Four-ledger reconcile | chain=API=page | — | GET country-ledger + params | Ledger+API env | — | 45/55 | **PASS** | 20260616T084248Z/four-ledger-reconcile.json | — | 需财务验证 |
| 75 | Financial closure | Enterprise HAT L9 | L9 recheck | — | — | — | — | — | **PASS** | l9-recheck/20260616T084529Z/L9-RECHECK.json | — | 需财务验证 |
| 76 | Financial closure | DB ledger parity | accrual vs chain | — | — | DB | — | — | **NOT TESTED** | four-ledger · DB skipped ② | P1 | 需财务验证 |
| 77 | HAT-R1 | Phase A | purchase·stake·propose·vote·queue | — | — | full stack | HAT wallet | TTG+USDC | **PASS** | evidence/GO_hat_r1_sepolia/20260616T063612Z/ | — | 需链上验证 |
| 78 | HAT-R1 | Phase B | execute·treasury·unstake | — | — | Timelock+Treasury+Pool | HAT wallet | USDC | **NOT TESTED** | Phase B PAUSED · EXECUTE_EARLIEST_UNIX.txt | P0 | 需链上验证 |
| 79 | Enterprise HAT | L1 UI/UX | machine narrative | /governance/* | — | — | — | — | **PARTIAL** | audit/20260616T074359Z L1 PASS machine | P1 | 需真人验证 |
| 80 | Enterprise HAT | L2–L8 | purchase·seat·revenue·treasury·roles | see layers | see APIs | see contracts | — | — | **PASS** | Enterprise audit + L9 recheck overall | — | 部分验证 |
| 81 | Enterprise HAT | L9 pre-recheck | four-ledger FAIL | — | — | — | — | — | **FAIL** | audit/20260616T074359Z (superseded) | — | 已验证 |
| 82 | CP Revenue HAT | Nine-step audit | four-ledger PASS | — | multi GET | DE NetProfit stack | — | 45/55 | **PASS** | 20260616T084248Z/ | — | 需财务验证 |
| 83 | Gate-2.4 | G24-P-11 Legal | LEG-XJ-05 | — | — | — | — | — | **NOT TESTED** | country-pool-settlement-gate2.4 checklist ☐ | P2 | 未验证 |
| 84 | Gate-2.4 | D-4555-B local HAT | forge six chains | — | — | CountryPoolNetProfit | — | 45/55 | **PASS** | GO_local_country_pool_net_profit_gate2.3/ | — | 已验证 |
| 85 | Gate-2.4 | ABI freeze | manifest+check-55-s13 | — | — | ABI manifests | — | — | **PASS** | G24-P-03 | — | 已验证 |
| 86 | Concentration | 8M TTG scenario | GOV-02/03 audit | — | — | Governor+Seat | — | — | **PASS** | GO_governance_concentration_audit_sepolia/ | — | 已验证 |
| 87 | Full-System Audit | TTG tokenomics | PASS_WITH_PARTIAL | — | — | multi | — | — | **PARTIAL** | TTG-TOKENOMICS-FULL-SYSTEM-AUDIT-REPORT.md | P1 | 部分验证 |

---

## 七类清单

### 已验证（20）

- M-001 GOV-FREEZE-V1 / TTG supply 10B / rounds
- M-002 GOV-FREEZE-V1 / 45/55 NetProfit bps
- M-004 GOV-FREEZE-V2 / V2 shell addresses frozen
- M-005 GOV-FREEZE-V2 / Legacy stack read-only
- M-013 Primary Market / quote read
- M-020 Governor / list proposals
- M-034 Country Pool / on-chain config read
- M-035 Country Pool / DE triplet SSOT
- M-051 Delegate / snapshot power
- M-053 Admin / must not exist
- M-061 API / NET_PROFIT first
- M-062 API / GOV-01~04 mirror
- M-064 API / doc mirror
- M-069 Exception / TransferFailed path
- M-070 Exception / wait vote period
- M-073 Permission / non-TL reject
- M-081 Enterprise HAT / four-ledger FAIL
- M-084 Gate-2.4 / forge six chains
- M-085 Gate-2.4 / manifest+check-55-s13
- M-086 Concentration / GOV-02/03 audit

### 部分验证（11）

- M-040 Vault / forward audit UI
- M-041 FeeRouter / orthogonal to 45/55
- M-042 Distribution / investor accruals read
- M-043 Distribution / line detail
- M-063 API / Σ read
- M-065 Indexer / index → API list
- M-067 DB / accrual rows
- M-068 DB / reward records
- M-071 Exception / country-ledger auth
- M-080 Enterprise HAT / purchase·seat·revenue·treasury·roles
- M-087 Full-System Audit / PASS_WITH_PARTIAL

### 未验证（3）

- M-044 Distribution / register accrual
- M-066 Indexer / CPNP decoder
- M-083 Gate-2.4 / LEG-XJ-05

### 无证据（1）

- M-037 Country Pool / legacy TL still owner

### 需真人验证（12）

- M-003 GOV-FREEZE-V1 / P1–P4 treasury policy copy
- M-016 Seat / Stake / POST application
- M-046 Claim / no auto TTG dividend
- M-052 Admin / admin links no spend
- M-054 Multi-Role / data isolation
- M-055 Multi-Role / no governance bleed
- M-056 Multi-Role / no treasury spend
- M-057 UI/UX / pool/rewards read
- M-058 UI/UX / 45/55 visual + GOV table
- M-059 UI/UX / stake panel anchors
- M-060 UI/UX / A1–D4 checklist
- M-079 Enterprise HAT / machine narrative

### 需链上验证（30）

- M-006 GOV-01 / 30% cap enforce
- M-007 GOV-02 / 400 bps quorum · 48h delay
- M-008 GOV-03 / vote cap 400 bps
- M-009 GOV-03 / stake aggregate cap
- M-010 GOV-04 / 25k per wallet cap
- M-011 GOV-04 / min 100 USDC purchase
- M-012 Primary Market / approve + purchase tx
- M-014 Seat / Stake / 10 jurisdictions min stake
- M-015 Seat / Stake / on-chain stake read
- M-017 Seat / Stake / resign API
- M-018 Seat / Stake / exit tx
- M-019 Governor / create proposal UI
- M-021 Governor / cast vote wallet
- M-022 Governor / vote on-chain Phase A
- M-023 Governor / queue after vote period
- M-024 Timelock / execute after 48h
- M-025 Timelock / legacy ledger ops
- M-028 Treasury / deploy cap enforce
- M-029 45/55 Revenue / recordAccrual R/E codes
- M-030 45/55 Revenue / closeDelay + NPP
- M-036 Country Pool / V2 Timelock wired
- M-038 Vault / depositFromLedger
- M-045 Claim / withdraw UI
- M-047 Buyback/Burn / governance-only
- M-048 Buyback/Burn / on-chain burn
- M-049 Unstake / live wallet exit
- M-050 Delegate / delegate page
- M-072 Permission / B-407 allowlist
- M-077 HAT-R1 / purchase·stake·propose·vote·queue
- M-078 HAT-R1 / execute·treasury·unstake

### 需财务验证（10）

- M-026 Treasury / spend via Timelock only
- M-027 Treasury / NetProfit split leg
- M-031 45/55 Revenue / fundLedgerForSplit
- M-032 45/55 Revenue / 45/55 conservation
- M-033 45/55 Revenue / Unallocated 45% leg
- M-039 Vault / depositFromLedger
- M-074 Financial closure / chain=API=page
- M-075 Financial closure / L9 recheck
- M-076 Financial closure / accrual vs chain
- M-082 CP Revenue HAT / four-ledger PASS

---

## 诚实边界

- 本矩阵 **不** 宣称 93 域全站矩阵 GO · **不** 宣称 ③ Production GO
- ① 本地 vitest/forge **≠** ② 真人录屏 **≠** ② 链上 Phase B 闭环
- `FAIL` 行若已 superseded（如 L9 pre-recheck）仍以历史证据保留 · 现行以 L9 recheck **PASS** 为准

**机读副本：** `docs/spec/governance-token/artifacts/ttg-governance-full-coverage-matrix.v1.json`

**生成命令：** `python scripts/dev/gen-ttg-governance-full-coverage-matrix.py`（只读盘点 · 不跑新测试）
