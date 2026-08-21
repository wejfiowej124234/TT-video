# TT · Wait Window · Web3 Gap Closure（Track2 ETA 并行 · LATEST）


> **STATUS (V9 Documentation Truth Convergence · phase-2):** **SUPERSEDED as Official ACTIVE V9 path** · **DO_NOT_USE_AS_ACTIVE_TRUTH** · **HISTORICAL**.  
> Sole living upstream: [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Public-sale USDC→P4Cap · globalStakers 35.75% · R2_FINAL/Remint · Safe/old Timelock as V9 Official admin = **LEGACY / SUPERSEDED**. Evidence retained.

**STATUS:** `WEB3_GAP_CLOSURE_INVENTORY_ACTIVE` · **Stamp:** `2026-08-12T09:07:53Z`  
**Track2:** **`WAITING_TRACK2_TIMELOCK_ETA` · FROZEN**（不改 T1/T2/opId/ETA）  
**Dual wait SSOT:** [`DUAL-WAIT FREEZE`](./TT-DUAL-WAIT-TRACK2-GOV04-FREEZE-LATEST.md) · FTB stamp `20260812T101500Z`  
**Track2 ETA preempt:** **`2026-08-14T09:03:11Z`** → 暂停本差集主线 → fresh preflight → execute T1→T2 → …  
**`TT_PRODUCTION_GO`:** `NO_GO` · **`P0_COMMERCIAL`:** TRUE（等 Track2 Reality PASS）  
**AXIS-14 / GO:** **LOCKED**

**唯一真源：** FTB + [`registry/mainnet-address-registry.v1.yaml`](../../registry/mainnet-address-registry.v1.yaml)  
**Candidate v2 / Sepolia：** `DEMOTED_TESTNET` · **≠** Official Mainnet 差集目标  
**禁止：** 重部署 TTG/Governor/Timelock/Wired/FeeRouter/Track1 SEALED · 改 Track2 payload · FeeRouter 四桶 distribute · 临时新协议/经济模型

Machine: [`TT-WAIT-WINDOW-WEB3-GAP-CLOSURE-LATEST.json`](./TT-WAIT-WINDOW-WEB3-GAP-CLOSURE-LATEST.json)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · Track2 冻结核对（本轮只读）

| 项 | 值 |
|----|-----|
| SR-FT | `0xD1DAE665eDc16FCEc7b7530Ead3504A846457147` |
| T1 readyAt / ETA | `1786698179` / `2026-08-14T09:02:59Z` · done=false |
| T2 readyAt / ETA | `1786698191` / `2026-08-14T09:03:11Z` · done=false |
| Wired.settlementRouter | 仍旧 SR `0xe5C3…` |
| SR-FT.trustedFactory | `0` |
| 旧 `0xce269Cdc…` / 旧 opId | **SUPERSEDED_NOT_BROADCAST** |

---

## 1 · Mainnet 差集分类（对照 FTB / Registry）

状态枚举：**DEPLOYED_ACTIVE** · **DEPLOYED_UNWIRED** · **NOT_DEPLOYED** · **SUPERSEDED_BY_TRACK2** · **LINEAGE_ONLY** · **EXTERNAL** · **FORBIDDEN**

### 1.1 Money Path / Escrow

| 模块 | 分类 | Track2 解耦？ | 本等待窗动作 |
|------|------|---------------|--------------|
| EscrowFactoryV2Wired `0xEE0B…` | **DEPLOYED_ACTIVE** | — | 禁止重部署；T2 将改其 settlementRouter（**勿提前改**） |
| SettlementRouter `0xe5C3…` | **DEPLOYED_ACTIVE**（Track1） | — | 历史路径保留 |
| SettlementRouterFactoryTrust `0xD1DAE665…` | **DEPLOYED_UNWIRED**（等 T1/T2） | Track2 本体 | **冻结** · ETA 抢占主线 |
| FeeRouter `0x2aF4…` | **DEPLOYED_ACTIVE**（interim buckets） | 是（四桶 distribute **禁止本窗执行**） | 只读；不 `distribute` / 不改 routing 除非独立 Owner 授权且不碰 Track2 |
| EscrowFactoryV2 `0x0520…` | **LINEAGE_ONLY** | 是 | 禁止绑 Official |
| EscrowFactory v1 | **FORBIDDEN** | — | 不部署 |

### 1.2 Governance（已锁）

| 模块 | 分类 | 本窗 |
|------|------|------|
| TTG `0x3cB1…` | **DEPLOYED_ACTIVE** | 禁止重部署 |
| Timelock `0x50f0…` | **DEPLOYED_ACTIVE** | 禁止重部署；仅 Track2 已 schedule 的 T1/T2 |
| Governor `0x46Ce…` | **DEPLOYED_ACTIVE**（impl TBD in registry） | 禁止重部署 |
| Treasury P4Cap / PrimaryMarket | **DEPLOYED_ACTIVE** | 禁止重部署 |
| Timelock admin Safe `0x9649…` | **DEPLOYED_ACTIVE** | AXIS-05 只读准备可用 |

### 1.3 83 / Country / Vacancy / Registry TBD（优先）

| 模块 | Registry | 源码 | constructor（冻结规格摘要） | Snapshot/Claim？ | Track2 解耦？ | 分类 | 部署顺序建议 |
|------|----------|------|------------------------------|------------------|---------------|------|--------------|
| **RegionVault** | TBD | `RegionVault.sol` | `constructor(owner_)` · owner→Timelock | **未实现**（仅 `emitRegionShareSnapshotLine` 锚点 + `forward`） | **是**（部署本身不改 T1/T2） | **NOT_DEPLOYED** | ① 可独立 Preflight→Owner 授权→deploy(Timelock)→**DEPLOYED_UNWIRED**；**接线** `FeeRouter.setRoutingConfig(countryBucket=RV)` = **另闸** · **≠** 四桶 distribute · **本窗默认不接线** |
| **ReserveVault** | TBD | `ReserveVault.sol` | `(asset, timelock)` | 否 | 是 | **NOT_DEPLOYED** | ② 可在 RegionVault 后；依赖 USDC asset |
| **RegionStewardStakePool** | TBD | `RegionStewardStakePool.sol` | 多参（proxy 姿态） | 否 | 是 | **NOT_DEPLOYED** | ③ 治理扩面 · 须完整 proxy/init Preflight |
| **TtgSeatConcentrationRegistry** | TBD | `TtgSeatConcentrationRegistry.sol` | `(owner_, stakePool_)` | 否 | 是 | **NOT_DEPLOYED** | ④ **依赖** StakePool 地址 → 顺序在 ③ 后 |
| **CountryPoolNetProfitLedger** | TBD | `CountryPoolNetProfitLedger.sol` | 多参 · 辖区波次 | 否 | 是 | **NOT_DEPLOYED** | ⑤ 辖区波次（pilot DE）· 非 Money Path 即时结算 |
| **StewardPathVault** | TBD | `StewardPathVault.sol` | `(owner, jurisdiction, token, ledger)` | 否 | 是 | **NOT_DEPLOYED** | ⑥ 依赖 Ledger |
| **UnallocatedStewardPathVault** | TBD | `vacancy/UnallocatedStewardPathVault.sol` | Vacancy_V1 多参 | Vacancy 路径 | 是 | **NOT_DEPLOYED** | ⑦ 83 附录 B.5 · **独立轨** |
| **Snapshot / Claim 终局合约** | 非 Registry 单槽 | — | 83 Target | Target **未**在 RegionVault MVP | — | **NOT_DEPLOYED**（规格缺口） | **禁止本窗发明新协议**；维持 83 Target 文档轨 |
| FeeRouter→RegionVault 路由 | — | FeeRouter owner=Timelock | `setRoutingConfig` | — | 解耦 Track2 **但是** 经济接线 | **未执行** | Owner 另授权；**禁止**当四桶 distribute |

**诚实边界：** 现有 `RegionVault` **≠** 83「RegionVault→Snapshot→Claim」商业终局；部署 RV 只能到 **DEPLOYED_UNWIRED / interim custody 升级候选**，**不得**宣称 83 CLOSED。

### 1.4 其它

| 模块 | 分类 |
|------|------|
| USDC | **EXTERNAL** |
| deployer/indexer/relayer wallets | PLANNED / TBD ops |
| FeeRouter 四桶 Timelock distribute | **DEPLOYED_ACTIVE 合约 · 资金动作 NOT_THIS_WAIT_WINDOW** |

---

## 2 · 等待窗允许 / 禁止

| 允许 | 禁止 |
|------|------|
| 差集 inventory + 规格/依赖/顺序钉死 | execute Track2 T1/T2 |
| RegionVault 等 **解耦** 模块的 Preflight 包（等 Owner 授权才广播） | 改 T1/T2 calldata/opId/ETA |
| AXIS-05/07/08/09/11/12 **只读证据准备** | AXIS-14 / 翻 GO |
| | 重部署已 SEALED / Wired / Fee / Timelock / TTG |
| | FeeRouter `distribute` |
| | 发明 Snapshot/Claim 新合约冒充 83 终局 |
| | 提前 Official 切流 / 1 USDC / 关 P0 |

---

## 3 · Hard Gate AXIS（并行只读）

| AXIS | 现态 | 等待窗 |
|------|------|--------|
| 05 Safe/roles | INCOMPLETE · Safe `0x9649…` 1/1 已知 | 可 Reality 填地址/threshold；**roles 须 Owner** |
| 07 Ops | secrets/infra/dns/monitor false | Owner/prod 探针准备 |
| 08 R-01 / residual | R01 缺 · residual 未签 | 准备 residual 草稿；不伪造签字 |
| 09 Readiness P0 | BLOCKED · MN-P0-006 R-01 | 随 08 |
| 11 Package | LATEST 缺 | 可生成 package（若 freeze PASS）· 非 GO |
| 12 Shadow | NO_GO scaffold | 真 Shadow 另排 |
| **14** | auth=false | **LOCKED** |
| Hard Gate / GO | REFUSED / NO_GO | **LOCKED** |

---

## 4 · ETA 抢占（写死）

```text
now → WEB3_GAP_CLOSURE_INVENTORY (+ optional decoupled Preflight packs only)
At 2026-08-14T09:03:11Z:
  PAUSE gap-closure deploy work
  → fresh Track2 preflight
  → if PASS: execute T1 then T2
  → verify trustedFactory + Wired.settlementRouter
  → Official cutover
  → 1 USDC Reality (bilateral → immediate release, no per-order Timelock)
  → PASS ⇒ clear P0_COMMERCIAL
  → then resume remaining Web3 + Hard Gate
TT_PRODUCTION_GO = NO_GO until Hard Gate real PASS + Owner decision
```

---

## 5 · 下一步（本窗 · 仍 NO 广播除非 Owner 点名）

1. **保持** Track2 WAITING  
2. **已开** [`FROZEN_WEB3_REMAINING_MAINNET_WAVE-1` Phase 1](./TT-FROZEN-WEB3-REMAINING-MAINNET-WAVE-1-PHASE1-LATEST.md)：RegionVault MVP + ReserveVault = deploy pack 已形成（默认不广播）；Stake/Seat/Country/Vacancy/83 Snapshot–Claim = **TBD_STOP · NOT_DEPLOYED**  
3. Seat/Stake/Vacancy：**规格依赖未闭前不部署**  
4. AXIS 只读准备可继续  
5. ETA 到点 **抢占** Track2 主线  

*Sebastian Ward · Solo · WEB3_GAP_CLOSURE_INVENTORY_ACTIVE · Track2 FROZEN · NO_GO*
