# TT · Final Truth Baseline（全系统唯一 SSOT · LATEST · V8 Cycle `20260818`）

**Machine:** [`TT-FINAL-TRUTH-BASELINE-LATEST.json`](./TT-FINAL-TRUTH-BASELINE-LATEST.json)  
**STATUS:** `ACTIVE_UNIQUE_SSOT`  
**Stamp:** `20260818T031500Z`  
**Amendment:** [`TT-FINAL-TRUTH-BASELINE-V8-CYCLE-20260818`](./TT-FINAL-TRUTH-BASELINE-V8-CYCLE-20260818.md)  
**Immutable parent:** [`TT-FINAL-TRUTH-BASELINE-20260812`](./TT-FINAL-TRUTH-BASELINE-20260812.md) · **禁止覆盖**  
**V8 Reality cited (do not recast):** [`Registry/Runtime/L7 Consistency Cert`](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md) · `PASS_STOP` · `2026-08-18T03:00:00Z`  
**Final Reality / Release Certification:** [`TT-FINAL-REALITY-RELEASE-CERTIFICATION-LATEST`](./TT-FINAL-REALITY-RELEASE-CERTIFICATION-LATEST.md) · `FINAL_REALITY_RELEASE_CERTIFICATION_PASS` · `blocking_p0_p1=0` · `2026-08-18T03:20:00Z` · **≠** Production GO  
**Web3 Active Truth:** Ethereum mainnet · **NEW TTG / NEW PM / NEW Governor ACTIVE** · **KEEP** Wired + Official SR + Official OLD FeeRouter + Timelock（同一身份）  
**Product Truth:** Official **API** 必须对齐下表 ACTIVE 地址；Official **www** = 冻结 OLD bake（Expected Difference · 禁止 bake）  
**Sepolia / Local:** 架构/ABI/流程对齐 · **独立地址** · **≠** Official  
**Reality Wave:** `TRACK1_REALITY_SEALED` · execute `0xe575…e88e04` · release `0x271e…0f796` · Escrow status=3 / USDC=0 · `isEscrow=true` · conservation `10e6=9.5e6+0.5e6+0` · [`Seal`](./TT-TRACK1-REALITY-EVIDENCE-SEAL-LATEST.md)  
**money_path 活真源：** `MAINNET_MONEY_PATH_TRACK1_REALITY_SEALED`（**禁止**再读 `WAITING_ETA` / `MAINNET_MONEY_PATH_INCOMPLETE` / Settlement·Fee **UNSET** 当活叙事）  
**双等待冻结（Money Path 独立轨 · 未因 V8 自动消失）：** `WAITING_TRACK2_TIMELOCK_ETA` + `WAITING_GOV04_TIMELOCK_ETA` · [`DUAL-WAIT FREEZE`](./TT-DUAL-WAIT-TRACK2-GOV04-FREEZE-LATEST.md) · GOV-04 pending impl 在 **OLD PM proxy** = **LEGACY for Official TTG sale**  
**`P0_COMMERCIAL_MONEY_PATH_BLOCKER`:** **TRUE**（Official 仍每单 Timelock allowlist · 等 Track2 Reality PASS）  
**独立未自动轨：** FeeRouter 四桶 Timelock distribute · Track2 execute/切流 · GOV-04 on OLD proxy · 83 RegionVault · Bitget HOLD · **`TT_PRODUCTION_GO`**  
**`TT_PRODUCTION_GO: NO_GO`** · Hard Gate **REEVAL 仍 REFUSED/NO_GO** · ≠ Production Ready · Final Reality / Release Certification **已 PASS** · 下一闸 = Production GO 重评  
**区域分账设计真源（中文 · Target）：** [`83`](../spec/83-区域治理与收益分配-协议白皮书.md) · Living gap：[`83-GROUNDED`](../../evidence/GO_mainnet_money_path/WEB3-DESIGN-CONSISTENCY-83-GROUNDED-LATEST.md)

---

## 0 · Owner 锁死（防 AI 分叉）

```text
Final Truth Baseline  = 全系统唯一 SSOT（读本文件 / JSON）
Parent 20260812       = IMMUTABLE HISTORICAL · 不得改字节 · 不得覆盖
V8 Cycle 20260818     = 本文件 = Active Truth
Web3 Active Truth     = NEW TTG / NEW PM / NEW Governor + KEEP Money Path
Official createEscrow = EscrowFactoryV2Wired 0xEE0BE3…  （ABI: frontend/dapp/abis/EscrowFactoryV2Wired.json）
FactoryV2 0x0520…     = LINEAGE ONLY · 无 settlementRouter · 禁止重新绑到官网 FE/API
Official API          = 必须对齐下表 ACTIVE
Official www          = FROZEN OLD bake daa5ae87 · Expected Difference · 禁止 bake
Bitget HOLD           = 独立轨 · 不得 unwind V8 针
TT_PRODUCTION_GO      = NO_GO · Final Reality / Release Certification = PASS · 下一闸 = Production GO 重评
```

**对齐闸：** `bash scripts/gates/check-official-mainnet-web3-alignment.sh`  
**Absorb 闸：** `bash scripts/dev/run-ftb-v8-cycle-absorb-gate.sh`  
**Final Reality / Release Certification 闸：** `bash scripts/dev/run-final-reality-release-certification.sh`

---

## 1 · Official Mainnet 地址（活真源 · V8 Cycle）

| 角色 | Address | 本 Cycle |
|------|---------|----------|
| chain_id | `1` | Ethereum mainnet |
| **EscrowFactoryV2Wired** | `0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6` | **KEEP** · Official create · 现仍指旧 SR |
| **SettlementRouter（Official live）** | `0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372` | **KEEP** · Track1 封印路径 |
| SettlementRouterFactoryTrust（SR-FT） | `0xD1DAE665eDc16FCEc7b7530Ead3504A846457147` | **KEEP** · DEPLOYED_UNWIRED · ≠ Official live 直至 Track2 T1/T2 |
| FeeRouter | `0x2aF47CB6390d7e51C210920b0A62d4d3abD68A72` | **KEEP** · Official OLD hop |
| EscrowFactoryV2 (lineage) | `0x052052f06bfc15cbd63606252db68b4b445aa4f7` | **历史** · 非 Official create |
| Timelock | `0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7` | **KEEP** · delay=48h · governor()=NEW |
| Timelock admin Safe | `0x96491aa894658ff7946506318c49F3c76b8f40e7` | **KEEP** |
| **Governor** | `0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F` | **ACTIVE · NEW** |
| **Governance token (TTG)** | `0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602` | **ACTIVE · NEW** · 25T · 15/35/50 |
| Treasury P4Cap | `0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF` | **KEEP** |
| **PrimaryMarket** | `0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2` | **ACTIVE · NEW instance** · min=1 USDC · 禁止抄 OLD `0xDf9e…` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | **KEEP** |

**LEGACY / SUPERSEDED（仅本 Cycle 降级；父本 20260812 仍列原身份）：**

| 角色 | Address |
|------|---------|
| OLD TTG | `0x3cB1b328E7a4ea01006b0697813aFEEdafe8512A` |
| OLD Governor | `0x46Ce671b04d21760e496646bb370ADEbC374ea4d` |
| OLD PM | `0xf7B7BBa2a5f21b91Fbb016d6B8853DEFa34F56ce` |
| OLD PM live impl | `0xDf9eF9278aF4E49449e87c54D45Fb975F8204346` · min=100 · **勿抄到 NEW** |
| GOV-04 pending impl on OLD proxy | `0xB3bCBc8F90b66E88961C2E8F178924F3200D6aA1` · **LEGACY for Official TTG sale** |

**Quote（cite cert · 不重证）：** `1 USDC = 100000 TTG` · `min_purchase_usdc=1.0` · class `TTG_V8_OFFICIAL_RUNTIME_QUOTE`

**Deploy txs（Owner fill · Money Path KEEP）：**  
Fee `0x15f8b056…` · Settlement `0xeb74f6af…` · Wired `0x0fbbc579…`  
→ [`OWNER-FILL-BROADCAST-TXS-LATEST.json`](../../evidence/GO_mainnet_money_path/OWNER-FILL-BROADCAST-TXS-LATEST.json)

**money_path 状态机读：** `MAINNET_MONEY_PATH_TRACK1_REALITY_SEALED`  
（Track1 setEscrow execute + Escrow release + FeeLegReceived 已链上封印；FeeRouter 四桶 distribute = **独立 Timelock 轨**，非本 Seal 自动项；V8 吸收 **不**重部署 Money Path）

**FeeRouter 落点（Reality-partial · ≠ 83 终局）：**

| 腿 | Mainnet 现址 | 相对 [`83`](../spec/83-区域治理与收益分配-协议白皮书.md) |
|----|--------------|------|
| BPS 默认 | `4500/3575/1100/825`（与 83/84 一致） | 比例 **MATCH** |
| `countryBucket` / `globalStakers` | Timelock admin Safe `0x9649…` | **interim custody** · **≠** RegionVault→Snapshot→Claim |
| `globalReserve` / `globalOps` | Treasury P4Cap `0xfB90…` | interim · 治理托管 |
| `region_vault` | Registry **TBD** | 83 区域终局 **未**上 Official Money Path |
| 无主理人（83 附录 B.5） | PendingVault / Vacancy 未接 Official | 设计已写 · 部署未闭环 |

**禁止 AI 误读：** FeeRouter 已部署 **≠** 83 区域主理人分账商业终局已上线；Track1 Reality PASS **≠** SeatBonus/Claim GO；SR-FT 已部署 **≠** Official Money Path 已切 Factory-Trust；OLD-proxy GOV-04 impl 已部署 **≠** NEW PM 公售规则；本 Cycle Active **≠** Production GO。

---

## 1b · 双等待冻结 pin（Money Path 独立轨 · 防分叉）

SSOT：[`TT-DUAL-WAIT-TRACK2-GOV04-FREEZE-LATEST`](./TT-DUAL-WAIT-TRACK2-GOV04-FREEZE-LATEST.md)

本轨 **不**因 V8 Cycle 自动关闭。GOV-04 `upgradeTo` 钉在 **OLD PM proxy**，对 Official TTG 公售 = **LEGACY**。NEW PM 已是独立实例（min=1 USDC · cite cert）。

| 轨 | 状态 | 关键 pin |
|----|------|---------|
| **Track2** | `WAITING_TRACK2_TIMELOCK_ETA` | T1 `0x35f54aa1…9ebe` · T2 `0xbdc82edb…e21a` · ETA **`2026-08-14T09:03:11Z`** |
| **GOV-04（OLD proxy）** | `WAITING_GOV04_TIMELOCK_ETA` | opId `0xb33dfdf2…03bc` · newImpl `0xB3bC…` · **LEGACY for Official TTG sale** |
| 商业 P0 | **TRUE** | 新单仍须逐单 Timelock allowlist |
| 禁止 | — | 提前 execute · Track1 重跑 · FeeRouter 四桶 / 83 / Stake 插队 · 翻 GO · 用 Bitget unwind V8 |

## 2 · 产品 / ABI 对齐

| 面 | 要求 |
|----|------|
| API `GET /meta` | NEW TTG / NEW PM / NEW Governor · Wired · Fee/Settlement 非 null · quote 1 USDC=100000 TTG |
| Official www | **FROZEN** `daa5ae87` / `2026-08-16T15:15:49Z` · Expected Difference · **禁止 bake** |
| FE ABI | `EscrowFactoryV2Wired.json`（含 `settlementRouter`） |
| create 钩子 | `useEscrowFactoryCreate` → Wired ABI |
| Indexer | `FEE_ROUTER_ADDRESS` / Settlement 事件随 API secrets |

禁止：把官网钉回 `0x0520…` lineage · 钉 Sepolia 地址 · 读旧「Settlement/Fee MISSING」当活状态 · 用 www OLD bake 否决 API/L7 NEW。

---

## 3 · 三环境

| 环境 | 对齐 |
|------|------|
| **官网 API** | 上表 ACTIVE Mainnet 地址 + Wired ABI |
| **官网 www** | 冻结 OLD bake · 不等价 API 已切 NEW |
| **Sepolia** | 同协议/ABI/流程 · **独立** Sepolia 地址 |
| **Local** | 同架构/ABI/流程 · 独立地址 |

---

## 4 · Reality / 等待闸

| 项 | 状态 |
|----|------|
| Owner fill Wired/Fee/Settlement | **PASS** |
| Official API Runtime NEW V8 | **PASS** · cite consistency cert |
| Official www bake | **FROZEN OLD** · Expected Difference |
| Track1 10 USDC + dual confirm + setEscrow execute + release | **SEALED** · escrow `0x9996FBD5…B8d6` |
| V8 Registry/Runtime/L7 consistency | **PASS_STOP** · 引用不重证 |
| FTB Cycle absorb V8 | **THIS FILE** · parent 20260812 immutable |
| Track2 SR-FT deploy + T1/T2 schedule | **WAITING_TRACK2_TIMELOCK_ETA** · ETA **`2026-08-14T09:03:11Z`** |
| GOV-04 on OLD PM proxy | **LEGACY for Official TTG sale** |
| Final Reality / Release Certification | **PASS** · `blocking_p0_p1=0` · 引用不重证 |
| `P0_COMMERCIAL_MONEY_PATH_BLOCKER` | **TRUE** |
| `TT_PRODUCTION_GO` | **NO_GO** |

Wallets：A deploy/traveler `0xe1e732…` · B TTG/guide `0xF34804…`

---

## 5 · 禁止项

- 覆盖或改写 [`TT-FINAL-TRUTH-BASELINE-20260812`](./TT-FINAL-TRUTH-BASELINE-20260812.md)  
- 把本 Cycle 或 Final Reality cert PASS 写成 Production GO  
- 重跑已闭合 L7/`/meta`/Registry 来再证明一遍 V8  
- 用 Bitget HOLD unwind V8 针或把 living FTB 退回 OLD TTG/PM/Governor  
- Official www bake · 再发 `setGovernor` · CI-02 hop B · Money Path 再部署 · 重复 1 USDC 真金  
- 把 NEW PM 写成仍用 OLD live impl `0xDf9e…`（min=100）  
- 阅读本 SSOT 时仍采用「Fee/Settlement UNSET / MISSING_OWNER_FILL / Track1 仍 WAITING_ETA」旧叙事  
- 官网 FE/API 重新绑定 lineage FactoryV2 `0x0520…`  
- 把 SR-FT 写成 Official 已切 Factory-Trust  
- 测试网/本地复制主网地址  
- 把 FeeRouter 已部署 / Track1 Reality 写成 [`83`](../spec/83-区域治理与收益分配-协议白皮书.md) 区域主理人分账商业终局 GO  

---

## 6 · 下一动作（勿混）

**已闭：** FTB `20260812` 冻结为历史父本 · V8 Mainnet Reality Certification `PASS_STOP` · 本 Cycle 吸收为 Active Truth · Final Reality / Release Certification `PASS`（`blocking_p0_p1=0`）。

**下一闸（另会话 · Owner）：** Production GO 重评。本文件 **未**翻 `TT_PRODUCTION_GO`。

Money Path KEEP 身份不变。Bitget HOLD 继续完全独立。Track2 / 83 / FeeRouter 四桶仍是独立未自动轨。

Registry / Mainline / Engineering 钉本表；变更官方 **ACTIVE** 地址必须先改 **living** FTB + 对齐闸。**禁止**改 20260812 父本。
