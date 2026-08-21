# Role Stake

**上游：** Documentation Truth Baseline · Design Lock **DL_R1** · [Stake Layer Split](../../runbook/TT-TTG-V9-OWNER-STAKE-LAYER-SPLIT-LATEST.md) · Whitepaper PASS  
**Mainnet：** `MAINNET_DEPLOYED_PHASE1` / `TIMELOCK_CUTOVER_PENDING` · **≠** Fully Active · **≠** `TT_PRODUCTION_GO`

| 角色 | 状态 | 门槛 / 履约 |
|------|------|-------------|
| Region Steward | **ACTIVE** | TTG Seat：`live totalSupply() × country_bps / 10000` |
| Merchant | **`NOT_REQUIRED` / `DISABLED`** | **不质押 TTG** · 履约 = **USDC** Identity/Order Risk + Escrow |
| Guide | **`NOT_REQUIRED` / `DISABLED`** | 同上 |

Merchant/Guide TTG RoleStake **不是默认待办**；除非 Owner 另开治理升级，否则保持关闭。  
违约处罚优先扣 **USDC** 风险押，**不动 TTG**。

初始 Steward bps：CN/US 400 · FR/ES 450 · JP/TH 250 · SG/KR 200 · AU/AE 150。  
地址：`0xf6A1Fb4435E463117a666818611F49D03F91E7A7` · `DEPLOYED_PENDING_CUTOVER`
