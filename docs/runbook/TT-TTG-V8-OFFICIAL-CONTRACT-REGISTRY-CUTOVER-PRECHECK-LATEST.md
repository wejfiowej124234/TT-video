# TT · TTG V8 · Official Contract Registry Cutover Precheck

**STATUS:** `TTG_V8_OFFICIAL_CONTRACT_REGISTRY_CUTOVER_PRECHECK` · `PASS_STOP` · **`/meta` 段已 SUPERSEDED**  
**Living successor:** [TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md)（Registry Official + Official API Runtime + L7 已 NEW 对齐）。下文「Official `/meta` 仍 OLD」是 **2026-08-17 23:58Z 只读快照**，不是当前 Runtime。**不得**用本快照回滚已完成的 V8 主网切针。  
**Machine:** [TT-TTG-V8-OFFICIAL-CONTRACT-REGISTRY-CUTOVER-PRECHECK-LATEST.json](./TT-TTG-V8-OFFICIAL-CONTRACT-REGISTRY-CUTOVER-PRECHECK-LATEST.json)  
**Evidence:** [evidence/GO_ttg_v8_registry_cutover_precheck/TTG_V8_OFFICIAL_CONTRACT_REGISTRY_CUTOVER_PRECHECK.json](../../evidence/GO_ttg_v8_registry_cutover_precheck/TTG_V8_OFFICIAL_CONTRACT_REGISTRY_CUTOVER_PRECHECK.json)  
**Command:** `bash scripts/dev/run-ttg-v8-official-contract-registry-cutover-precheck.sh`  
**HOLD_RESCAN:** still binding · [TT-TTG-V8-TOKEN-RISK-INDEX-HOLD-RESCAN-LATEST.md](./TT-TTG-V8-TOKEN-RISK-INDEX-HOLD-RESCAN-LATEST.md)  
**Prior product-runtime precheck:** still `PASS_STOP` · [TT-TTG-V8-OFFICIAL-PRODUCT-RUNTIME-CUTOVER-PRECHECK-LATEST.md](./TT-TTG-V8-OFFICIAL-PRODUCT-RUNTIME-CUTOVER-PRECHECK-LATEST.md)  
**`TT_PRODUCTION_GO`:** `NO_GO`

阶段口径：**③ 只读 Reality Audit**（全项目 Mainnet 合约矩阵 · Official `/meta` · living Registry · Official 产品 env）。**不是** Official 合约面切针，**不是**「官网已与 Mainnet Reality 对齐」，**不是** Production GO。禁止迁币 / 拆仓 / 再发 `setGovernor` / 改 FTB / 切 `/meta` / bake www / 动 Money Path / CI-02 hop B。

本闸 **≠** 全部合约重新部署。V8 该换的 TTG / PM / Governor **已**主网部署并接到 KEEP Timelock；其余成熟合约 **KEEP**。

## 本闸结论

| 项 | 结果 |
|----|------|
| 生产写入 | **0** |
| `setGovernor` 本轮 | **未调用** · live Timelock.governor = NEW `0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F` |
| NEW 映射（L7） | **全部正确** · NEW TTG / NEW PM / NEW Governor / KEEP Timelock |
| 25T · 15 / 35 / 50 | 链上未漂 |
| Official 产品面（**2026-08-17 23:58Z 快照**） | 当时仍指向 OLD TTG / OLD Governor；`/meta` **无** `primary_market_address` |
| Official 产品面（**2026-08-18 活 overlay**） | Official `/meta` **NOW** NEW Governor / NEW TTG / NEW PM `0x882Ad` + SR-FT；www chrome **10→10** + CMS 25T = Expected Difference · bake **FORBIDDEN** |
| Official env 含 NEW hex | **0** 条（本快照当时） |
| Official env 含 OLD TTG/PM/Gov | **20** 条（本快照当时） |
| 下一会话（本快照当时） | 等待 Owner 独立 Official 合约面切针。**之后已发生：** API Runtime overlay 对齐 + Registry/Runtime/L7 一致性认证 `PASS_STOP`。www bake 与 FTB 吸收仍另闸。 |

禁止用本 `PASS_STOP` 宣称：「官网合约面已经与当前 Mainnet Web3 Reality 对齐。」该句只允许在 **切针执行 + Runtime 验证** 之后。**之后已发生：** [Consistency Cert](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md) 允许说 Registry Official + Official API Runtime + L7 已 NEW 对齐；**仍禁止**说 Official www 已切、FTB 已吸收、或 Production GO。

## NEW 映射确认（L7 · 本闸 eth_call）

| 角色 | 地址 | 链上核对 |
|------|------|----------|
| NEW TTG | `0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602` | totalSupply = 25T · 15/35/50 |
| NEW PM | `0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2` | `ttg()`=NEW TTG · `usdc()`=Circle · `ttgPerUsdcUnit=100_000 ether` · `minPurchaseUsdc=1e6` |
| NEW Governor | `0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F` | `token()`=NEW TTG · `timelock()`=KEEP |
| KEEP Timelock | `0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7` | `governor()`=NEW · `admin()`=Safe `0x96491aa8…40e7` |

**当时快照：** Living Registry Official 槽 **没有** NEW 三址。Official `/meta` **没有** NEW 三址。Official 产品 env **没有** NEW hex。  
**2026-08-18 活 overlay：** Official `/meta` + Registry Official 槽 **已** NEW Governor / TTG / PM；www chrome 与 FTB overlay 仍另闸。禁止用本快照当当前 Runtime。

## OLD 三址仍被 Official 产品引用（**2026-08-17 23:58Z 快照** · 不是 2026-08-18 活 `/meta`）

| 标签 | 地址 | `/meta`（当时） | living Registry（当时） | Official env |
|------|------|---------|-----------------|--------------|
| OLD TTG | `0x3cB1b328E7a4ea01006b0697813aFEEdafe8512A` | `governance_token_address` | Official 槽 | www bake + FE/scripts env |
| OLD PM | `0xf7B7BBa2a5f21b91Fbb016d6B8853DEFa34F56ce` | **缺键** | Official 槽 | www bake + FE/scripts env |
| OLD Governor | `0x46Ce671b04d21760e496646bb370ADEbC374ea4d` | `governor_address` | Official 槽 | www bake + FE/scripts env |

实测 Official www `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · `OPS-2026.08.20-v9`。API git `8df2ab21…`。`/meta` timelock / fee_router / escrow_factory = KEEP 且与链上一致。

20 条 Official env 引用（完整键见 machine JSON `official_old_env_cites`）：

- `deploy/fly/tt-web-prod/build.env.local` — `NEXT_PUBLIC_GOVERNOR_ADDRESS` / `NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS` / `NEXT_PUBLIC_PRIMARY_MARKET_ADDRESS`
- `frontend/.env.mainnet.local` · `frontend/.env.production.local`
- `scripts/dev/.env.mainnet-active.local` · `scripts/dev/.env.production.local`

FE `.ts/.tsx` 与 `crates/api` **无** OLD hex 硬编码；运行时来自 env + `/meta`。报价 SSOT `frontend/lib/governance/primaryMarketRuntimePriceSsot.ts` 仍是 OLD 经济（`1e18` + impl `0x53d0…`）= **REPLACE_CODE_NOT_JUST_ADDRESS**，须与地址切针同批，禁止只改页面。

## 全项目矩阵（ACTIVE / KEEP / LEGACY）

| Contract | 链上 | 三态 | Registry | `/meta` | 是否切换 |
|----------|------|------|----------|---------|----------|
| OLD TTG 10M | `0x3cB1…512A` | **LEGACY** | OLD | OLD | YES_AFTER_OWNER_AUTH |
| NEW TTG 25T | `0x0EC4…3602` | **ACTIVE_L7_NOT_OFFICIAL** | 未入 Official 槽 | 仍 OLD | PROMOTE_AFTER_OWNER_AUTH |
| OLD PM | `0xf7B7…56ce` | **LEGACY** | OLD | **ABSENT** | YES_AFTER_OWNER_AUTH |
| NEW PM | `0x882A…B6D2` | **ACTIVE_L7_NOT_OFFICIAL** | 未入 Official 槽 | 缺键 | PROMOTE_AFTER_OWNER_AUTH |
| OLD Governor | `0x46Ce…ea4d` | **LEGACY** | OLD | OLD | YES_AFTER_OWNER_AUTH |
| NEW Governor | `0xD581…787F` | **ACTIVE_L7_NOT_OFFICIAL** | 未入 Official 槽 | 仍 OLD | PROMOTE_AFTER_OWNER_AUTH |
| KEEP Timelock | `0x50F0…22f7` | **KEEP** | 同址 | 同址 | NO_KEEP |
| KEEP P4Cap | `0xfB90…9BbF` | **KEEP** | 同址 | 无键 | NO_KEEP |
| KEEP Wired Factory | `0xEE0B…C1C6` | **KEEP** | 同址 | 同址 | NO_KEEP |
| LEGACY FactoryV2 lineage | `0x0520…a4f7` | **LEGACY** | lineage | lineage | NO_KEEP_AS_LINEAGE |
| LEGACY Track1 SR | `0xe5C3…B372` | **LEGACY** | Track1 | 缺键 | NO_DO_NOT_PROMOTE |
| KEEP SR-FT | `0xD1DA…7147` | **KEEP** | Official create | 缺键（L8 lag · 非 V8） | NO_KEEP |
| KEEP OLD FeeRouter | `0x2aF4…8A72` | **KEEP** | Official hop | 同址 | NO_KEEP |
| CI-02 NEW FeeRouter | `0xb6bf…7655` | **DEPLOYED_NOT_OFFICIAL** | 已登记 | 仍 OLD FR | NO_INDEPENDENT_CI02 |
| CI-01 Seat 路由 | `0x68e5…80bd` | KEEP_ROUTING_NOT_OFFICIAL | 已登记 | null | NO_KEEP |
| Circle USDC | `0xA0b8…eB48` | **KEEP** | 同址 | 无键 | NO_KEEP |
| Safe admin | `0x9649…40e7` | **KEEP** | 同址 | 无键 | NO_KEEP |
| Seat concentration / StakePool / 83 vaults / identity stake | NOT_DEPLOYED | **NOT_DEPLOYED** | TBD | null | 本阶段不部署 |
| Escrow V1 / Migrator / SeatGate | — | **FORBIDDEN** | — | — | 禁止 |

完整 29 行 + 每行 `web_refs` 见 machine JSON `matrix`。

## Owner 独立授权后才允许的切针范围（本闸未执行）

**一次同步，禁止只改页面：**

1. living Registry Official 槽：OLD TTG/PM/Governor → NEW 三址；KEEP 槽不动。
2. Official `/meta`：`governor_address` / `governance_token_address` 切 NEW；**新增** `primary_market_address` = NEW PM。
3. Official www bake env + FE/scripts Official env：同上三址。
4. `primaryMarketRuntimePriceSsot.ts`：报价单位与 impl pin 同步 NEW 经济。
5. Runtime 验证后再说「官网合约面对齐」。

**KEEP 不动：** Timelock · Wired · SR-FT · Official OLD FeeRouter · P4Cap · USDC · Safe · CI-01 路由。  
**禁止：** FTB `20260812` 字节 · Money Path 重部署 · CI-02 hop B · 迁 25T / 拆仓 / 再发 `setGovernor`。

`TT_PRODUCTION_GO` 在最终总闸通过前仍 **NO_GO**。
