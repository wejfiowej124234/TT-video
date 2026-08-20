# TT · L7 Contract Reality ↔ L8 Observed Runtime Reconciliation（LATEST）

**STATUS:** `RECONCILIATION_ACTIVE`  
**Window:** `2026-08-12` → `2026-08-18`（Official `/meta` V8 NEW TTG/PM/Governor ALIGNED · CMS 25T overlay）  
**Probe:** mainnet · Official `GET /meta` `200` · CI-02 A execute `2026-08-17` · OLD-proxy PM `$25` execute `2026-08-17T03:22:27Z` = **LEGACY**  
**Machine:** [`registry/l7-l8-contract-runtime-reality-reconciliation.v1.yaml`](../../registry/l7-l8-contract-runtime-reality-reconciliation.v1.yaml)  
**Gate:** `python scripts/dev/check-l7-l8-reality-reconciliation.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**`UNEXPLAINED_CONFLICT`:** **0**  
**00–14 九字段加深：** **Pack 00 PHASE1 FROZEN**（Pack **01–14** CLOSED · Phase 2B **FORBIDDEN** · Gap Audit **CLOSED** · **Phase 2A** convergence **ACTIVE**） · overlay 保持 `UNEXPLAINED_CONFLICT=0`

本包是 **L7 链上 Reality 与 L8 `/meta`/Indexer 观察的对拍层**。  
**不是**新 SSOT。FTB stamp `20260812T101500Z` **LOCKED** — **禁止**用 `/meta` 覆盖 FTB，也 **禁止**用 FTB 覆盖 `/meta`。  
本波 **禁止** 2B 架构升级 / 大规模重构 / CI-02 hop B / Official www bake / Seat·Vault 再部署 / 假 L7。OLD-proxy PM `$25` Timelock.execute **已做**（2026-08-17）= **LEGACY**。Official 售卖 = NEW PM `0x882Ad` + NEW TTG `0x0EC40`。Phase 2A 可按梯子关闭已分类缺口。

**THREE_TRUTH_PLANES：** Official 产品现实 ≠ Web3 L7 最高真源 ≠ FTB 冻结锚。  
**矩阵服从 Reality。** 不得因 `/meta` 滞后改写 L7。生命周期保持分裂：`OFFICIAL_LIVE` · `DEPLOYED` · `SCHEDULED_WAITING_ETA` · `DEPLOYED_NOT_WIRED` · `NOT_DEPLOYED` · `SUPERSEDED` · `REALITY_VERIFIED` · `CLOSED_REALITY`。

---

## 0 · 读法（写死）

| 源 | 角色 |
|----|------|
| **L7** | Web3 **最高真源**：链上 code / owner / `settlementRouter` / EIP-1967 impl / Timelock `operations.done` |
| **L8** | Official `GET /meta` + Indexer checkpoint = **产品/投影现实**，不是 L7 |
| **FTB 20260812** | 规则 / 冻结锚 · 当时 SSOT · 现与 L7 有 **已解释滞后** |
| **FTB living V8** | `addresses.primary_market` = NEW `0x882Ad…` · Official-live OLD PM `0xf7B7…` 在 `legacy_superseded` · **Expected Difference**（禁止 FIX_TO_MATCH） |
| **Official www/API** | 非 Web3 矩阵的 **AS-IS 取证面**（历史登录 405 已 SUPERSEDED · BATCH-A CLOSED_REALITY） |
| **本 overlay** | 00–14 地图的 **当前 L7/L8 读法** · 地图不是真源 |

`DEPLOYED ≠ WIRED ≠ OFFICIAL_LIVE ≠ REALITY ≠ CLOSED_REALITY`。

---

## 1 · 逐地址时间线（2026-08-12→18）

| 地址 | 角色 | 种类 | L7 now | L8 `/meta` | FTB 锁表 | 生命周期 |
|------|------|------|--------|------------|----------|----------|
| `0xEE0BE3…C1C6` | Wired Factory | 新部署 | `settlementRouter=SR-FT` | `escrow_factory_address` 同 | 同 | **OFFICIAL_LIVE** |
| `0x052052…a4f7` | FactoryV2 | 谱系 | code yes | `escrow_factory_v2` | lineage | **LEGACY** |
| `0xe5C3ED…B372` | SR Track1 | 官网曾指旧 | code yes · **Wired 不再指向** | `/meta` **不是**它 | 仍标 Official live | **SUPERSEDED** |
| `0xD1DAE665…7147` | SR-FT | 新部署→接线 | `trustedFactory=Wired` | `settlement_router_address` **同** | 槽位存在、叙事仍 UNWIRED | **OFFICIAL_LIVE** · 非 1 USDC CLOSED |
| `0x2aF47C…8A72` | FeeRouter OLD | 官网仍指旧 | owner Timelock | `fee_router` 同 | 同 | **OFFICIAL_LIVE** |
| `0xb6bfED…7655` | FeeRouter NEW CI-02 | 已部署 · A 已 execute | code yes · A **done=true** · hop B **未 schedule** | 仍 OLD | 锁表无此行 | **SCHEDULED_WAITING_ETA**（hop B） |
| `0x882Ad1…B6D2` | PM V8 NEW | 新实例 | `ttg=NEW TTG` · unit **100_000 ether** · min **1 USDC** | `primary_market_address` **同** | living `addresses.primary_market` | **OFFICIAL_LIVE** |
| `0xf7B7BB…56ce` | PM OLD proxy | impl 升级 | impl **`$25`** `0x53d0…` · unit **4e16** | **不是** Official 售卖 | overlay freeze parent | **LEGACY** |
| `0xDf9eF9…4346` | PM 旧 impl | 升级被替 | code yes | — | 锁表 live impl | **SUPERSEDED** |
| `0xB3bCBc…6aA1` | PM GOV-04 impl | 先前 OLD-proxy impl | 已被 `$25` 替 | — | 锁表写 pending | **LEGACY** |
| `0x53d0dA…Fc6b` | PM $25 impl | L7 execute 已完成 | code yes · op **done=true** · tx `0x132909b1…` | www chrome 仍 10→10 | Registry 有 | **LEGACY**（www chrome Expected Difference） |
| `0xD5819a…787F` | Governor NEW | 新部署 | code yes | `governor_address` **同** | living | **OFFICIAL_LIVE** |
| `0x46Ce67…ea4d` | Governor OLD | 谱系 | code yes | **不是** Official | parent freeze | **LEGACY** |
| `0x0EC40c…3602` | TTG NEW 25T | 新部署 | code yes | `governance_token_address` **同** | living | **OFFICIAL_LIVE** |
| `0x3cB1b3…512A` | TTG OLD 10M | 谱系 | code yes | **不是** Official | parent freeze | **LEGACY** |
| `0x68e55d…80bd` | Active Seat Registry CI-01 | 已部署未切 Official | codesize **5010** · bytecode match | null | TBD | **DEPLOYED_NOT_WIRED** |
| JP RegionVault | CI-03 | — | **无地址** | null | TBD | **NOT_DEPLOYED** |
| Guide staking | — | — | — | null | — | **NOT_DEPLOYED**（DB ≠ L7） |

Timelock ops（链上 `operations`）：

| Op | opId | done | 含义 |
|----|------|------|------|
| T1 | `0x35f54aa1…9ebe` | **true** | SR-FT.setTrustedFactory(Wired) |
| T2 | `0xbdc82edb…e21a` | **true** | Wired.setSettlementRouter(SR-FT) |
| GOV-04 | `0xb33dfdf2…03bc` | **true** | PM `upgradeTo` GOV-04 impl |
| CI-02 A | `0xa26f09da…2479` | **true** | NEW FR `setSeatRoutingConfig(Seat, P4Cap)` · tx `0x69e6363b…` |
| CI-02 B | — | **never scheduled** | `SR-FT.setFeeRouter(NEW)` · Official hop |
| PM $25 | `0xb7d2a7c3…1b12` | **true** | `upgradeTo(0x53d0…)` · execute **2026-08-17T03:22:27Z** |

---

## 2 · L7 ↔ L8 对拍

| 键 | L7 | L8 | 结论 |
|----|----|----|------|
| Wired / create factory | `0xEE0BE3` | `escrow_factory_address=0xEE0BE3` | **ALIGNED** |
| SettlementRouter Official path | Wired→**SR-FT** `0xD1DAE665` | `/meta.settlement_router_address` **同** | **ALIGNED** |
| FeeRouter Official | OLD `0x2aF47C` | 同 | **ALIGNED**（NEW hop B 未 schedule · **SCHEDULED_WAITING_ETA**） |
| PM Official sale | NEW `0x882Ad` · 100_000 ether | `primary_market_address` **同** | **ALIGNED** |
| Governor | NEW `0xD5819ac` | `governor_address` **同** | **ALIGNED** |
| TTG | NEW `0x0EC40` 25T | `governance_token_address` **同** | **ALIGNED** |
| OLD PM / GOV-04 / `$25` | L7 仍存在 | **不是** Official 售卖 | **LEGACY** · www chrome 10→10 Expected Difference |
| FactoryV2 谱系 | code | `/meta` 另键列出 | **EXPLAINED** lineage |
| Indexer | tip live | checkpoint live lag=0 | **EXPLAINED** tx window cleared; projection/UI unverified |

**不是冲突：** L7 Wired→SR-FT **同时** FTB 锁表仍写 Track1 SR。那是 **FTB 锁戳滞后**，不是 L7≠L8。Official `/meta` 现含 SR-FT。

---

## 3 · 已解释差（不是 UNEXPLAINED）

1. **FTB SR 锁表滞后** — L7 Official create = SR-FT；FTB `20260812` 仍标 Track1 Official live。禁止改 FTB 字节。  
2. **FTB PM impl 锁表滞后** — 链上 EIP-1967=`0x53d0`；FTB 仍 `0xDf9e`。  
3. **Track2 C5 宣称 FTB 已切** — C5 写 `ftb_settlement_router_official_live=SR-FT`，磁盘 FTB JSON **未改**（`lock_status=LOCKED`）。  
4. **Dual-Wait 冻结包过期** — `2026-08-12` 仍 WAITING；链上 T1/T2/GOV-04 **done=true**。  
5. **CI-02 A / hop B / $25** — A `setSeatRoutingConfig` **done=true**（2026-08-17）；Official hop B **从未 schedule**（**SCHEDULED_WAITING_ETA**）；官网仍指旧 FR。OLD-proxy `$25` Timelock **done=true**（L7 4e16）= **LEGACY**；Official www chrome 仍 10→10 = Expected Difference（bake **FORBIDDEN**）。  
6. **1 USDC** — Track2 **WIRED+OFFICIAL_LIVE** · money-path **PASS**（Owner A · L7+L8）· living `P0_COMMERCIAL_MONEY_PATH_BLOCKER=false`。Official book hop **CLOSED_REALITY**（`GAP-E2E-JOURNEY`）。FTB 锁表 P0 TRUE = 解释滞后。全局 **HANDOFF hop 闭 ≠ 全局 CLOSED_REALITY**。下一步 = Owner 书面 **GO** 或 **继续 NO_GO**。  
7. **CI-01 Seat / CI-03 Vault** — Seat L7 `0x68e55d` **DEPLOYED_NOT_WIRED**（非 Official hop）；Vault **仍无地址**。Pack 05 `W3-SEAT-REGISTRY` 枚举仍 **NOT_DEPLOYED**（stamp + gate pin）。  
8. **Official `/meta` 现含 `settlement_router_address` + `primary_market_address`** — 历史「L8 omit SR / PM null」**SUPERSEDED**。L7 Wired 仍指 SR-FT。**禁止**把 08-16 www chrome 10→10 修成与 CMS 25T 一致（Expected Difference · bake FORBIDDEN）。

`unexplained_conflicts: []`

---

## 4 · 本波已修（地图 / Registry 指针 / 状态 · 未动 FTB）

- Pack **03** L7 SR / Vault / Timelock 状态  
- Pack **05** 合约节点生命周期  
- Pack **09** JP Vault DEPLOYED  
- Pack **12** blocker 不再引用已 execute 的 dual-wait  
- Pack **14 / depth-audit** 不再把 SR 差写成 L8≠L7  
- `registry/mainnet-address-registry.v1.yaml` **living flags**（Track1 SUPERSEDED · SR-FT WIRED · NEW FR 指针）

未修：FTB parent `20260812` 锁表字节、CI-02 hop B、Official www bake、任何新广播。Living FTB V8 + Official `/meta` 已指 NEW。

---

## 5 · 下一刀（仍 NO_GO）

对账保持 `UNEXPLAINED_CONFLICT=0`。Pack **00** Master Map 本波 **PHASE_1_AS_IS_ARCHITECTURE_FROZEN** 并 **STOP**（**禁止 Phase 2**）。Pack **01**–**14** CLOSED。  
另授下一刀：CI-02 hop B schedule/execute · Official www bake（chrome 10→10 vs CMS 25T）· Owner 书面 **GO** 或 **继续 NO_GO**。本 hop 不做。CI-02 hop B / www bake / Proposal #3 不合并。OLD-proxy `$25` 证据：[`TT-PM25USDC-EXECUTE-VERIFIED-LATEST.md`](./TT-PM25USDC-EXECUTE-VERIFIED-LATEST.md) = **LEGACY**。
