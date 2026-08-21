# TT · TTG V9 — Owner Economic Target FREEZE (Fee · Stake · P4Cap)

**STATUS:** `V9_OWNER_ECONOMIC_TARGET_FROZEN` · **Target SSOT this session**  
**Effect:** Supersedes Owner ACTIVE reading of FeeRouter four-leg `4500/3575/1100/825` + `globalStakers` product narrative  
**Does not:** Mutate R2_FINAL bytecode · flip `TT_PRODUCTION_GO` · inherit old 3× audit PASS  
**Next:** Owner decision checklist → implement Local → Sepolia → **new** Audit Candidate → 3× AI audits

Parents: [Fee vs Role Stake](TT-TTG-V9-OWNER-ECONOMIC-MODEL-FEE-VS-STAKE-LATEST.md) · [Gov Root Replacement](TT-TTG-V9-GOVERNANCE-ROOT-REPLACEMENT-LATEST.md) · [Pre-Audit Alignment](TT-TTG-V9-PRE-AUDIT-ALIGNMENT-REGISTER-LATEST.md) · [Owner Decision Checklist](TT-TTG-V9-OWNER-DECISION-CHECKLIST-LATEST.md)

---

## 0 · Frozen Target tree

```text
TTG V9
│
├─ 25T Genesis
│  └─ permanent NO FURTHER MINT
│
├─ Role Stake  (⊥ FeeRouter)
│  ├─ Region Steward · steward_stake_bps[country] × TTG_V9.totalSupply()   ACTIVE
│  │     CN/US 4% · FR/ES 4.5% · JP/TH 2.5% · SG/KR 2% · AU/AE 1.5%
│  ├─ Merchant · NOT_REQUIRED / DISABLED · bond 规则独立 · 未确认 / OPEN
│  └─ Guide    · NOT_REQUIRED / DISABLED · 履约 = 逐订单 USDC Performance Bond（≠ 81 Identity）
│        （TTG RoleStake 仅 Owner 另开治理升级方可重启 · ≠ 默认 TBD）
│
├─ Steward Access Fee
│  └─ 300,000 USDC → 0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736
│
├─ Platform Service Fee (USDC · NEW country→steward Fee Router)
│  ├─ Active Region Steward present
│  │   ├─ 45% → 该国主理人申请收款钱包
│  │   └─ 55% → NEW Project Pool
│  └─ No Active Steward
│      └─ 100% → NEW Project Pool
│
└─ Project Pool / **NEW** P4Cap-class treasury（统一新总池 · Owner 2026-08-21）
   ├─ 公售 USDC + 平台费 55% / 无主理人 100%
   ├─ 90-day accounting window
   ├─ ≤30% spending cap（合约语义另核）
   ├─ spender = NEW Timelock（admin = 0xe1e732…）
   └─ 运营拨付 to = 0xF34804…（Governor→Vote→Timelock→execute）

旧 P4Cap `0xfB90…` / 旧 Timelock / Safe = **LEGACY** · 非 Official 进账。
```

**`globalStakers` 35.75%:** **EXIT Owner ACTIVE**

**Fee Router:** **NEW** 按国→主理人收款址（R2=A）· 非 KEEP 单桶。  
**Role Stake:** **NEW** · live `totalSupply()` × 十国 bps。  
**Q8:** **统一新总池** · 无 Safe 迁权窗。

---

## 1 · Why prior security PASS does **not** inherit

| Change | Class |
|--------|--------|
| FeeRouter ACTIVE: four-leg → **45/55** (or 100%→pool) | Economic + privilege surface |
| No-steward **100%→P4Cap** | New routing semantics |
| Role Stake: immutable supply units → **`totalSupply()` live** | Stake security / economic |
| Governance root: Safe+old Timelock → **NEW Solo Timelock** | Privilege root |
| KEEP Money Path rewire under NEW Timelock | Cutover / ownership |

**Binding:** New Audit Candidate after Local→Sepolia regression · **3× independent AI audits** · old `V9_AUDIT_CANDIDATE_R2_FINAL` PASS **does not cover** this Target. R2_FINAL **monetary Token/Vault/PM** may remain reference for remint bytes — **Fee/Root/Stake Target is a new freeze.**

---

## 2 · P4Cap 90d / 30% — **contract truth** (re-verified source)

Source: `contracts/src/GovernanceTreasuryP4Cap.sol` + `TtgGovFreezeConstants.sol`  
Constants: `TREASURY_P4_DEPLOY_CAP_BPS = 3000` · `P4_ACCOUNTING_PERIOD_SECONDS = 90 days`

| Step | Code behavior |
|------|----------------|
| Reserve | `treasuryReserveBalance()` = `reserveToken.balanceOf(this) − earmarkedP1P3` (floor 0) |
| Cap at call | `p4DeployCap()` = `reserve × 3000 / 10000` — **computed on current reserve** |
| Spend check | `spendP4Reserve`: roll period if needed → read **cap now** → require `p4SpentInPeriod + amount ≤ cap` → then transfer |
| Basis | Cap uses **pre-transfer** balance (check before `transfer`) — **not** post-spend balance |
| Period | If `now ≥ p4PeriodStartedAt + 90d` → reset `p4SpentInPeriod=0`, set new `p4PeriodStartedAt` |
| Snapshot? | **No** period-start balance snapshot stored — only `p4SpentInPeriod` + start time |
| NatSpec drift | Comment says `min(P4Surplus, …)` but **no `P4Surplus` variable in body** — implemented = **reserve × 30% only** |

**Mainnet:** Before Cutover / 3× audit, **re-cast live P4Cap** (`p4DeployCap`, `p4SpentInPeriod`, `p4PeriodStartedAt`, `earmarkedP1P3`, `spender`, balance) — do not assume Local semantics without chain read.

**Ops implication (honest):** If reserve **increases** mid-period, next `spend` sees a **higher** live cap; cumulative `p4SpentInPeriod` still applies. If reserve **falls** below `p4SpentInPeriod/0.3`, further spend may revert until period rolls or reserve recovers.

---

## 3 · Agent binding until Owner checklist closed

1. Do **not** start 3× audit / Sepolia Official / Mainnet broadcast.  
2. Do **not** claim old R2_FINAL Pre-Mainnet / Red-Team / Audit3 PASS covers Fee+Root+Stake Target.  
3. Implement Target only after [Owner Decision Checklist](TT-TTG-V9-OWNER-DECISION-CHECKLIST-LATEST.md) P0 rows answered.  
4. KEEP Money Path class (P4Cap Exact / EF / SR / FeeRouter address) still **KEEP_AND_REWIRE** unless Owner picks FeeRouter redeploy.

---

## 中文要点

- Owner 经济 Target **已按你贴的树冻结**；`globalStakers` **退出 ACTIVE**。  
- **旧三审 PASS 不继承**；须新 Candidate + 新三审。  
- P4Cap：**支出前**活余额×30% + 90 天累计已花；**无**季度初快照；NatSpec 的 P4Surplus **未在代码出现**。  
- 未决/冲突 → 见 **Owner 确认清单**。
