# TT · Web3 Contract Architecture Matrix（Pack 05 · LATEST）

**STATUS:** `PACK05_NINE_FIELD_DEEPENED`  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/web3-contract-architecture-matrix.v1.yaml`](../../registry/web3-contract-architecture-matrix.v1.yaml)  
**Overlay:** [TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md)  
**Gate:** `python scripts/dev/check-web3-contract-architecture-matrix.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**`M5_SHALLOW_NODE`:** **0** · **`M5_UNRESOLVED_POINTER`:** **0** · **`UNEXPLAINED_CONTRACT_DEPENDENCY`:** **0**  
**本波 STOP：** Pack 05 CLOSED。Pack 04 为后续独立波；本包不重开。  
**禁止：** deploy / schedule / execute / cutover / 真钱 · 用 `/meta` 改 FTB 或反向覆盖

Living 地址以 **L7 链上 + Timelock `operations.done` + Official `/meta` + Registry living flags** 为准。  
FTB `20260812` 是 **锁表**，不是当前 Official create 指针。

---

## 0 · 活路径 vs 83 目标

**Living Official create（已证）：**

```text
EscrowFactoryV2Wired 0xEE0BE3
  --settlementRouter--> SR-FT 0xD1DAE665
SR-FT --trustedFactory--> Wired
SR-FT --feeRouter--> OLD FeeRouter 0x2aF47C
OLD FR --countryBucket--> Safe 0x96491
Timelock --admin--> Safe
PM V8 NEW 0x882Ad --ttg--> NEW TTG 0x0EC40 (100_000 TTG/USDC)
Governor NEW 0xD581 --> Timelock
P4Cap /meta treasury 0xfB906
Indexer lag=0  WIRED observation
```

**不在活路径上：** Track1 SR（SUPERSEDED）· NEW FeeRouter（SCHEDULED hop B）· OLD PM GOV-04 / $25（**LEGACY** on OLD proxy `0xf7B7`）· Seat（Pack 05 **NOT_DEPLOYED** stamp；L7 `0x68e55d` DEPLOYED_NOT_WIRED）· JP Vault（NOT_DEPLOYED）。

**83 目标（Vault 未部署，禁止当 Official hop）：** FeeRouter → SeatRegistry → RegionVault / P4Cap。

---

## 1 · 节点（九字段）

| w3_id | 地址 / Runtime | Status | 关系 |
|-------|----------------|--------|------|
| W3-FACTORY-WIRED | `0xEE0BE3…` `/meta.escrow_factory` | **OFFICIAL_LIVE** | T2 后指向 SR-FT |
| W3-FACTORY-V2-LINEAGE | `0x052052…` `/meta.escrow_factory_v2` | **LEGACY** | 谱系，禁止 FE create |
| W3-SR-TRACK1 | `0xe5C3ED…` | **SUPERSEDED** | Track1 CLOSED_REALITY；FTB 锁表仍标 Official |
| W3-SR-FT | `0xD1DAE665…` `/meta.settlement_router` | **OFFICIAL_LIVE** | DEPLOYED→WIRED→OFFICIAL_LIVE；1 USDC 未 CLOSED |
| W3-FR-OLD | `0x2aF47C…` `/meta.fee_router` | **OFFICIAL_LIVE** | Official 仍指旧 |
| W3-FR-NEW | `0xb6bfED…` | **SCHEDULED_WAITING_ETA** | A `done=true` · Official hop B **未 schedule** |
| W3-PM-PROXY | `0x882Ad…` `/meta.primary_market` | **OFFICIAL_LIVE** | V8 NEW · 100_000 TTG/USDC · ALIGNED |
| W3-PM-IMPL-OLD | `0xDf9e…` | **SUPERSEDED** | FTB 锁表仍写 live impl（OLD proxy 谱系） |
| W3-PM-IMPL-GOV04 | `0xB3bC…` | **LEGACY** | OLD proxy 先前 impl；非 Official 售卖 hop |
| W3-PM-IMPL-25 | `0x53d0…` | **LEGACY** | OLD proxy `$25` L7 `done=true`；非 Official 售卖 |
| W3-P4CAP | `0xfB906…` `/meta.treasury` | **OFFICIAL_LIVE** | |
| W3-GOVERNOR | `0xD5819ac…` `/meta.governor` | **OFFICIAL_LIVE** | OLD `0x46Ce671` = LEGACY |
| W3-TIMELOCK | `0x50F0B2…` `/meta.timelock` | **OFFICIAL_LIVE** | 剩余 hop B；PM `$25` = LEGACY |
| W3-SAFE | `0x96491…` | **OFFICIAL_LIVE** | Timelock admin · FR countryBucket · `/meta` 无键 |
| W3-TTG | `0x0EC40…` `/meta.governance_token` | **OFFICIAL_LIVE** | NEW 25T · OLD `0x3cB1` = LEGACY |
| W3-SEAT-REGISTRY | null | **NOT_DEPLOYED** | Pack 05 stamp · living L7 `0x68e55d` 见 recon |
| W3-REGION-VAULT | null | **NOT_DEPLOYED** | CI-03 · `/meta.region_steward_stake_pool_address=null` |
| W3-GUIDE-STAKING | null | **NOT_DEPLOYED** | `/meta.guide_staking_address=null` · DB ≠ L7 |
| W3-INDEXER | `/meta.indexer` | **WIRED** | L8 观察 · 非合约地址 |
| W3-META | `GET /meta` | **WIRED** | L8 身份面 |

美元怎么走是 Pack **06**，不是本包。

---

## 2 · 本波边界

- Pack **03** 已闭，只读引用。  
- Pack 04 Data Truth 为后续独立波（本包不重开）。  
- 不执行 CI-02 hop B / Official www bake。CI-02 A 与 OLD-proxy PM `$25` Timelock.execute 已完成（2026-08-17）= **LEGACY**。  
- Official 售卖 = NEW PM + NEW TTG；www chrome 10→10 / 2T·3T·7.5T = Expected Difference（bake FORBIDDEN）。  
- `UNEXPLAINED_CONTRACT_DEPENDENCY=0`：活边不含 SUPERSEDED / SCHEDULED / NOT_DEPLOYED / LEGACY impl 当 Official hop。

① Pack 05 地图加深 ≠ ② staging GO ≠ ③ Production GO。
