# Role Stake

**Upstream:** Documentation Truth Baseline · Design Lock **DL_R1** · [Stake Layer Split](../../runbook/TT-TTG-V9-OWNER-STAKE-LAYER-SPLIT-LATEST.md) · Whitepaper PASS  
**Mainnet:** `MAINNET_DEPLOYED_PHASE1` / `TIMELOCK_CUTOVER_PENDING` · **≠** Fully Active · **≠** `TT_PRODUCTION_GO`

| Role | Status | Threshold / performance bond |
|------|--------|------------------------------|
| Region Steward | **ACTIVE** | TTG Seat: `live totalSupply() × country_bps / 10000` |
| Merchant | **`NOT_REQUIRED` / `DISABLED`** | **No TTG stake** · performance = **USDC** Identity/Order Risk + Escrow |
| Guide | **`NOT_REQUIRED` / `DISABLED`** | Same |

Merchant/Guide TTG RoleStake is **not a default backlog**; remains off unless Owner opens a separate governance upgrade.  
Default slash for supply-side breach hits **USDC** risk stake first — **not TTG**.

Initial Steward bps: CN/US 400 · FR/ES 450 · JP/TH 250 · SG/KR 200 · AU/AE 150.  
Address: `0xf6A1Fb4435E463117a666818611F49D03F91E7A7` · `DEPLOYED_PENDING_CUTOVER`
