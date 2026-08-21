# TT · TTG V9 — Money Flow Economic Truth Reconciliation


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**STATUS:** `V9_MONEY_FLOW_ECONOMIC_TRUTH_RECONCILED` · **STOP before Sepolia**  
**Why now:** `V9_GOV_ROOT_LOCAL_PASS_STOP` cleaned Safe in a Local drill using RegionVault + GlobalStakersFeeVault — must verify that did **not** silently rewrite Final Truth / PSG-EGM / Region Steward economics.  
**Forbidden this turn:** Sepolia · Mainnet · auto `TT_PRODUCTION_GO` · treating Local bucket drill as 83 commercial GO

Parents: [FTB](TT-FINAL-TRUTH-BASELINE-LATEST.md) · [L5 V3.1.1 Flow](TT-WEB3-L5-FLOW-V311-STEWARD-GOVERNANCE-LATEST.md) · [Gov Root Replacement](TT-TTG-V9-GOVERNANCE-ROOT-REPLACEMENT-LATEST.md) · [Local PASS + Bucket Audit](TT-TTG-V9-GOV-ROOT-LOCAL-PASS-AND-BUCKET-AUDIT-LATEST.md) · [83](../spec/83-区域治理与收益分配-协议白皮书.md)

Evidence: `evidence/GO_ttg_v9_audit/V9_MONEY_FLOW_ECONOMIC_TRUTH_RECONCILED.json`

---

## 0 · Three money paths (nuclear · orthogonal)

| # | Path | Original economic meaning (SSOT) | Destination | Orthogonal to |
|---|------|----------------------------------|-------------|----------------|
| **A** | **TTG Sale USDC** | Primary-market proceeds · project gov pool | **P4Cap** `0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF` | FeeRouter · Steward fee |
| **B** | **300k Steward Access Fee USDC** | Platform Access Fee on steward apply | **Exact** `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` ([Owner Ops Fee Model](TT-TTG-V9-OWNER-OPS-FEE-MODEL-LATEST.md) · registry) | FeeRouter · P4Cap sale |
| **C** | **Order / platform Fee USDC** | FeeRouter four-leg BPS split | **BPS frozen** `4500/3575/1100/825` · destinations Reality-partial · **Owner living ops** = 45/55（有主理人）/ 100% 总池（无主理人）— see Owner Ops doc · **≠** 83 staking slice as living truth | Sale · Steward Access Fee |

**L5 discipline (binding):** 公募 USDC → P4Cap（≠ Safe）。FeeRouter 平台费第一层 45/55 **≠** Country Pool 净利润另一套 45/55 键。  
**Owner living ops (2026-08-21):** 不以「TTG 质押激励 / globalStakers 产品」为当前运营真源 — [Owner Ops Fee Model](TT-TTG-V9-OWNER-OPS-FEE-MODEL-LATEST.md)。

---

## 1 · Path A — TTG Sale → 项目总池

| Check | Truth |
|-------|--------|
| V9 Norm / Remint Design | USDC → live P4Cap Exact |
| L5 / FTB | P4Cap KEEP · sale ≠ Safe |
| Local Gov-Root wave | **Did not change** V9 PM `usdcTreasury=P4Cap` economics |
| Verdict | **ALIGNED** · Exact Address P4Cap · no RegionVault / GlobalStakersFeeVault involvement |

---

## 2 · Path B — 300k Steward USDC

| Check | Truth |
|-------|--------|
| Registry | `amount_usdc: 300000` · `destination: founder_designated_wallet` · **`destination_exact: 0xe1e732…CdD4`** |
| Owner Exact | Marketing / Solo ops wallet `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` |
| L5 ③ | 支付 Platform Access Fee 300,000 USDC → **Founder 指定钱包** · 审核失败可退 · ACTIVE 后不可退 |
| FeeRouter / RegionVault | **Not** this path |
| Local Gov-Root wave | **Did not model or rewrite** Access Fee destination |
| Verdict | **ALIGNED** · Exact pinned · Safe deprecation **must not** redirect 300k into RegionVault / GlobalStakersFeeVault / P4Cap |

---

## 3 · Path C — Transaction Fee → FeeRouter BPS

| Check | Truth |
|-------|--------|
| BPS (on-chain + FeeRouter defaults) | **4500 / 3575 / 1100 / 825** — Local drill **preserved** |
| FTB Reality destinations | `countryBucket`/`globalStakers` = Safe **interim custody** · **≠** RegionVault→Snapshot→Claim GO |
| FTB Reality destinations | `globalReserve`/`globalOps` = **P4Cap** Exact |
| 83 Target | country → RegionVault… · Global stakers slice → TTG incentive narrative — **Target / independent track** |
| FTB forbid | FeeRouter deployed ≠ 83 steward-split commercial GO |

### Honest correction to Local bucket audit

Local PASS used **RegionVault + GlobalStakersFeeVault** as Safe replacements for country/stakers. That is a valid **83 Target-shaped drill**, but it is **not** proven Final Truth for “Safe-exit without economic change.”

| Option | country / stakers destinations | Economic meaning | When allowed |
|--------|--------------------------------|------------------|--------------|
| **I · Interim custody (Safe-exit only)** | Both → **P4Cap Exact** (same class as reserve/ops today) | Keep FeeRouter BPS; custody stays **gov treasury interim** · **does not** claim 83 RegionVault GO | Default for Root Replacement if Owner wants Safe gone **without** advancing 83 |
| **II · 83 Target wire (LEGACY option)** | country → RegionVault · ~~stakers → incentive vault~~ | **Owner ACTIVE 不再默认** · `globalStakers` 腿 **退出 Owner 经济语义**；角色质押走 Stake 模块 | Only if Owner **re-opens** 83 fee-slice Target separately from Role Stake |

**Personal EOAs** remain **forbidden** as FeeRouter sinks (Access Fee Exact `0xe1e732…` is **Path B only**).

**GlobalStakersFeeVault.sol** = **NOT** Owner ACTIVE · optional historical Target artifact only.  
**RegionVault.sol** = 83 fee-side Target · orthogonal to Role Stake 4%.  
**Role Stake:** [Fee vs Role Stake](TT-TTG-V9-OWNER-ECONOMIC-MODEL-FEE-VS-STAKE-LATEST.md).

---

## 4 · Did Local PASS mis-change the economic model?

| Surface | Mis-change? |
|---------|-------------|
| BPS 4500/3575/1100/825 | **No** |
| Sale → P4Cap | **No** |
| 300k → Founder wallet | **No** (untouched) |
| Safe-exit **requires** RegionVault + GlobalStakersFeeVault as economic truth | **Over-claimed** in prior bucket audit — **corrected here** |
| Claiming Local drill = 83 RegionVault commercial GO | **Forbidden** · FTB |

`V9_GOV_ROOT_LOCAL_PASS_STOP` remains valid as **① mechanics PASS** (new Timelock · KEEP_AND_REWIRE · BPS frozen · zero Safe refs **in that drill**).  
Economic destination choice for country/stakers is **reopened** to Owner Option **I vs II** before Sepolia.

---

## 5 · Binding next step (not Sepolia yet)

```text
V9_MONEY_FLOW_ECONOMIC_TRUTH_RECONCILED
  → Owner picks FeeRouter Safe-exit Option I (P4Cap interim) or II (83 Target vaults)
  → Amend Local/Sepolia plan to that option only
  → then Sepolia lifecycle
TT_PRODUCTION_GO unchanged · no Mainnet broadcast
```

---

## 中文要点

- **三条钱路正交且已核死：** 卖 TTG→**P4Cap**；30万主理人→**Founder 指定钱包**；交易 Fee→**FeeRouter BPS 不变**（落点 Reality-partial）。  
- Local 去 Safe **未改** BPS / 公售池 / 30万规则；但把 country/stakers 直接写成 RegionVault+GlobalStakersFeeVault **过早等同 83 终局** — 已纠正。  
- Safe 退出默认可走 **Option I：两腿也进 P4Cap（interim）**；只有 Owner 明确要推 83 才走 Option II 新部署金库。  
- **现在不进 Sepolia**；等 Owner 选 I/II。
