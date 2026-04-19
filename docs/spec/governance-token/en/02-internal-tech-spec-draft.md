# TravelTrust — Governance Token Internal Technical Spec (DRAFT, EN)

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **English draft** | **正文** |
| **中文主稿** | **[../01-对外白皮书-草案](../01-对外白皮书-草案.md)** 或 **[../02-对内技术规格-草案](../02-对内技术规格-草案.md)** |
| **SSOT** | **[../82-治理币-文档总览](../../82-治理币-文档总览.md)** |

**Status**: DRAFT — implementation SSOT remains **code**, **04 §3.4**, **14**  
**Version**: 0.1.3-draft-en  
**Last updated**: 2026-04-19  
**Audience**: Engineering, security, internal audit  

**Do not distribute externally.** Public narrative: [01-external-litepaper-draft.md](01-external-litepaper-draft.md) (after legal sign-off). Chinese SSOT: [../02-对内技术规格-草案.md](../02-对内技术规格-草案.md).

---

## 1. Baseline (as-is)

- Guide / provider **identity staking** uses an injected ERC-20 (e.g. USDC), not a dedicated governance token — SSOT **`contracts/src/IdentityStakingPool.sol`**（**`GuideIdentityStakingPool` / `ProviderIdentityStakingPool`**；legacy monolithic staking **implementation** removed from the repo; **event signatures and topic0 remain compatible** for indexer / API consumers).
- API placeholders: `GET /api/v1/governance/pool`, `GET /api/v1/governance/rewards` — `crates/api/src/routes/governance.rs`.
- DB: `governance_pool`, `governance_reward_records` — see migrations and `crates/api/src/db/governance.rs`.

## 2. Target on-chain stack (if enabled)

ERC20 (+Votes if snapshots), Governor-compatible or restricted governance, Timelock, treasury isolated from user Escrow balances.

## 3. Sync obligations

Any ABI/API/behavior change → update **04 §3.4**, **14**, `contracts/abi/`, frontend ABIs, CI gates. Narrative changes → update external litepaper + **08-4** + legal.

## 4. Linkage

Follow [07 §二 2.4](../../07-开发流程与顺序.md) when changing this document or `82` / `governance-token/*`.

**Allocatable platform fee base / orthogonality** (45/55 denominator; **not** L1/L2 gas paid by senders; **arbitration fees** and **guide stake slashing on `IdentityStakingPool` (e.g. USDC)** orthogonal to FeeRouter layer-1 split): SSOT **[84 §1.1.1](../../84-第一阶段10国Country-Pool发行参数总表.md)**, **[Runbook §7.1](../../../../ops/RUNBOOK.md)**, [08-4 ch.2 (ZH)](../../08-4-对外口径包.md). Chinese mapping table: [../02-对内技术规格-草案.md](../02-对内技术规格-草案.md) §2.
