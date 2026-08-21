# TT · TTG V9 — Owner Design LOCK (post-acceptance)

**STATUS:** `V9_OWNER_DESIGN_LOCKED` · Owner accepted Agent recommended design 2026-08-21 · **Mainnet Phase1 = `DEPLOYED_PENDING_CUTOVER`**  
**Documentation upstream:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md)  
**Local implementation:** [`V9_DESIGN_LOCK_LOCAL_PASS`](TT-TTG-V9-DESIGN-LOCK-LOCAL-PASS-LATEST.md) · gate `run-ttg-v9-design-lock-local-gate.sh`  
**Effect:** Closes Remaining Confirm Shortlist must-items + defaults  
**Does not:** claim `MAINNET_FULLY_ACTIVE` · inherit old R2_FINAL audit PASS · flip `TT_PRODUCTION_GO` · rewrite Official www this wave

Parents: [Target FREEZE](TT-TTG-V9-OWNER-ECONOMIC-TARGET-FREEZE-LATEST.md) · [Answers](TT-TTG-V9-OWNER-ANSWERS-AND-REMAINING-CONFLICTS-LATEST.md) · [Shortlist](TT-TTG-V9-REMAINING-OWNER-CONFIRM-SHORTLIST-LATEST.md)

---

## Locked decisions (complete)

| ID | Lock |
|----|------|
| R1 | **A** · PM price/batches = Governor → NEW Timelock only · `0xF34804` = pause Guardian only |
| Q5 | **A** · NEW Timelock admin = `0xe1e732…` · delay 48h · no Safe |
| Q6 | **A** · Guardian pause = `0xF34804…` |
| S1 | Apply form captures payout → **Admin review → Timelock writes** country→payout on NEW Fee Router |
| S2 | Order/Escrow carries **ISO country code** · Router keys off it |
| S3 | Platform fee rate = **500 bps (5%)** · change only via governance · **no EOA direct set** |
| S4 | **KEEP** EscrowFactory / SettlementRouter · retarget fee recipient → NEW Fee Router · sale USDC → NEW Project Pool |
| Q8 | **NEW Project Pool** Official · old P4Cap/Timelock/Safe = LEGACY · no Safe migrate window |
| R2 | NEW country→steward Fee Router |
| Q1/Q7 | 45% → steward payout wallet · P4 ops spend `to` = `0xF34804…` |
| Access Fee | 300k USDC → `0xF34804…` |
| Deploy / TTG 5% | `0xe1e732…` |
| TTG 3% / 7% | `0x010365…` / `0xF34804…` |
| Q9/Q11/Q12/L1–L3 | Defaults accepted (stake absolute sticky · 83 Global deferred · CPNP orthogonal · old pool residual later · access fee collection may start off-chain · new 3× audits) |
| MG-TTG | Merchant/Guide TTG RoleStake = **`NOT_REQUIRED` / `DISABLED`** · **非默认待办** · Guide 履约 = **逐订单 USDC Performance Bond**（≠ 81 Identity）· Merchant Bond **不自动继承** · Phase1 **不**因此重部署 — [Guide Bond](TT-TTG-V9-GUIDE-PER-ORDER-PERFORMANCE-BOND-LATEST.md) |

### Topology (locked)

```text
0xe1e732     deploy · Timelock admin · TTG 5%
0xF34804     Guardian pause · Access Fee 300k · P4 ops payout · TTG 7%
0x010365     TTG 3%

Order(+country) → Escrow (KEEP EF/SR)
  → fee 5% → NEW Fee Router
       ├─ Active payout[country] → 45% steward / 55% NEW Pool
       └─ none → 100% NEW Pool
Buy TTG USDC → NEW Project Pool
NEW Pool spend → propose → Timelock → 0xF34804 (≤30%/90d live-cap semantics)
Role Stake NEW · bps × totalSupply() · Steward ACTIVE only
Merchant/Guide TTG RoleStake = NOT_REQUIRED / DISABLED（非默认待办）
Guide 履约 = 逐订单 USDC Performance Bond（≠ 81 Identity）· Merchant Bond 独立未确认
```
See [Stake Layer Split](TT-TTG-V9-OWNER-STAKE-LAYER-SPLIT-LATEST.md) · [Guide Bond](TT-TTG-V9-GUIDE-PER-ORDER-PERFORMANCE-BOND-LATEST.md).

---

## Post-lock scan — still open?

### A · Need Owner confirm now？

| Item | Status |
|------|--------|
| Product/economic forks above | **NONE** — locked |
| New “must confirm” product conflicts | **NONE** at this freeze |

**Optional later (not blocking Design Lock):**
- Exact Escrow field name for country (engineering can pick ISO `bytes2` aligned with Stake)
- Whether Access Fee on-chain collector is Wave-2 (L2 default = off-chain OK)
- Old P4Cap residual extraction date (L1 = not this wave)

### B · Conflicts closed / residual honesty

| Topic | Residual |
|-------|----------|
| Fee personal EOA sink | **Owner exception LOCKED** for steward payout only · ops EOAs still not Fee sinks |
| R1 Treasury “can set PM price” | **SUPERSEDED** by R1-A |
| KEEP FeeRouter / old P4Cap as Official | **SUPERSEDED** |
| FTB living cites old P4Cap/FeeRouter | **Doc/Registry update gap** after deploy — do not pretend FTB already migrated |
| R2_FINAL audit PASS | **Does not cover** this Design Lock surface |

### C · Engineering gaps (Agent work · not Owner quiz)

| Gap | Next |
|-----|------|
| Spec/ABI: NEW Fee Router (country map · 45/55/100% · Timelock setPayout · paused) | Design + Local forge |
| Spec/ABI: NEW Role Stake (live supply · ten-country bps · role flags) | Design + Local forge |
| Deploy: NEW Timelock + NEW Project Pool (P4Cap-class) + wire V9 PM treasury | Scripts + tests |
| Wire KEEP Escrow → new fee recipient + `platformFeeBps=500` governance path | Integration |
| Steward apply → review → Timelock setPayout runbook | Ops + API |
| Local → Sepolia regression → **new Audit Candidate** → 3× AI audits | Process |
| Evidence stamps / Registry Exact after addresses exist | Post-deploy |

### D · Hard stops unchanged

- No Mainnet broadcast without **new** independent Owner auth after new audits  
- No auto `TT_PRODUCTION_GO`  
- No mutate frozen R2_FINAL Token economics bytes casually · Fee/Stake/Pool are **new** freeze track  

---

## 中文要点

- Owner **已接受推荐设计并 LOCK**。  
- **没有**新的产品必须确认项。  
- 剩下是 **实现缺口**（新 Fee / Stake / 总池 / Timelock、Escrow 切流、Local→Sepolia→新三审）。  
- FTB 旧地址与 Official 新拓扑的文档对齐 = 部署后工程债，不是现在再让你选 A/B。
