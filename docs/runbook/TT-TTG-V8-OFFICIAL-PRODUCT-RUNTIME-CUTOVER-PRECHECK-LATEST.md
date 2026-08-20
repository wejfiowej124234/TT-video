# TT · TTG V8 · Official Product Runtime Cutover Precheck

**STATUS:** `TTG_V8_OFFICIAL_PRODUCT_RUNTIME_CUTOVER_PRECHECK` · `PASS_STOP` · **`/meta` 段已 SUPERSEDED**  
**Living successor:** [TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md)（Registry Official + Official API Runtime + L7 已 NEW 对齐）。下文「Official `/meta` 仍 OLD / PM ABSENT」是 **当时只读快照**，不是当前 Runtime。**不得**用本快照回滚已完成的 V8 主网切针。  
**Machine:** [TT-TTG-V8-OFFICIAL-PRODUCT-RUNTIME-CUTOVER-PRECHECK-LATEST.json](./TT-TTG-V8-OFFICIAL-PRODUCT-RUNTIME-CUTOVER-PRECHECK-LATEST.json)  
**Evidence:** [evidence/GO_ttg_v8_cutover_precheck/TTG_V8_OFFICIAL_PRODUCT_RUNTIME_CUTOVER_PRECHECK.json](../../evidence/GO_ttg_v8_cutover_precheck/TTG_V8_OFFICIAL_PRODUCT_RUNTIME_CUTOVER_PRECHECK.json)  
**Command:** `bash scripts/dev/run-ttg-v8-official-product-runtime-cutover-precheck.sh`  
**HOLD_RESCAN:** still binding · [TT-TTG-V8-TOKEN-RISK-INDEX-HOLD-RESCAN-LATEST.md](./TT-TTG-V8-TOKEN-RISK-INDEX-HOLD-RESCAN-LATEST.md)  
**`TT_PRODUCTION_GO`:** `NO_GO`

阶段口径：**③ 只读盘点**（Registry · live `/meta` · API env keys · FE env · Official www bake env）。**不是** Official live 切针，**不是** Production GO。禁止迁币 / 拆仓 / 再发 `setGovernor` / 改 FTB / 切 `/meta` / bake www / 动 Money Path / CI-02。

## 本闸结论

| 项 | 结果 |
|----|------|
| 生产写入 | **0** |
| `setGovernor` 本轮 | **未调用** · live Timelock.governor 仍是 NEW `0xD581…787F` |
| 25T · 15 / 35 / 50 | 链上未漂 |
| HOLD_RESCAN | 仍绑定 · 禁止拆仓/迁币 |
| Official 产品面（当时快照） | 仍指向 OLD TTG / OLD Governor；`/meta` **无** `primary_market_address` |
| Official 产品面（**2026-08-18 活 overlay**） | `/meta` **NOW** NEW Governor / NEW TTG / NEW PM `0x882Ad` + SR-FT；www chrome **10→10** + CMS 25T = Expected Difference · bake **FORBIDDEN** |
| 控制面 vs 产品面（当时） | Timelock 已 NEW Governor · www/`/meta` 仍 OLD |
| 下一会话（当时） | **等待 Owner 独立产品切针授权**。**之后已发生：** API Runtime overlay + Consistency Cert。www bake / FTB 吸收仍另闸。 |

## 活网 Official 产品（本闸实测 · **当时快照**）

| 面 | 实测 |
|----|------|
| Official www `git_sha` | `3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · `OPS-2026.08.20-v9` |
| API git | `8df2ab21…` |
| `/meta` governor | OLD `0x46Ce671b04d21760e496646bb370ADEbC374ea4d` |
| `/meta` governance_token | OLD `0x3cB1b328E7a4ea01006b0697813aFEEdafe8512A` |
| `/meta` primary_market | **ABSENT** |
| `/meta` timelock | KEEP `0x50f0…` |
| `/meta` fee_router | KEEP OLD FR `0x2aF47C…` |
| `/meta` escrow_factory | KEEP Wired `0xEE0BE3…` |

**2026-08-18 活 overlay：** Official `/meta` **NOW** NEW Governor `0xD581…` / NEW TTG `0x0EC4…` / NEW PM `0x882Ad` + SR-FT。上表是当时只读快照，**禁止**当当前 Runtime。www chrome bake 仍 **FORBIDDEN**。

## OLD → NEW V8 替换矩阵（写死 · 当时未执行 · `/meta` 段之后已发生）

| 面 | 键 | OLD | NEW | class |
|----|----|-----|-----|-------|
| `/meta` | `governor_address` | `0x46Ce…` | `0xD581…787F` | REPLACE |
| `/meta` | `governance_token_address` | `0x3cB1…` | `0x0EC4…3602` | REPLACE |
| `/meta` | `primary_market_address` | **缺键** | `0x882A…B6D2` | REPLACE_OR_ADD_KEY |
| `/meta` | `timelock_address` | `0x50f0…` | 同址 | KEEP |
| `/meta` | `fee_router` / Wired / SR-FT | Official hop | 不动 | KEEP / DO_NOT_TOUCH |
| www bake | `NEXT_PUBLIC_GOVERNOR_ADDRESS` | OLD | NEW | REPLACE · **bake 另闸** |
| www bake | `NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS` | OLD | NEW | REPLACE · **bake 另闸** |
| www bake | `NEXT_PUBLIC_PRIMARY_MARKET_ADDRESS` | OLD | NEW | REPLACE · **bake 另闸** |
| FE 报价 SSOT | `primaryMarketRuntimePriceSsot.ts` | 1e18 + OLD PM impl `0x53d0…` | `100_000 ether` + NEW PM | REPLACE_CODE_NOT_JUST_ADDRESS |
| Registry living | `mainnet-address-registry.v1.yaml` 三槽 | OLD 三址 | NEW 三址 | REPLACE |
| FTB `20260812` | 文首表 | OLD 字节 | — | **LOCKED_DO_NOT_TOUCH** |

`crates/api` **无** OLD hex 硬编码；切针 = Fly secrets `GOVERNOR_ADDRESS` / `GOVERNANCE_TOKEN_ADDRESS`（及 `GOVERNANCE_VOTES_TOKEN_ADDRESS`）+ 若产品需要则新增 `PRIMARY_MARKET_ADDRESS` 并让 `/meta` 发出。前端 `.ts/.tsx` **无** OLD hex；运行时来自 env + `/meta`。

本闸扫描（排除 `.worktrees` / `node_modules` / `target`）：含 OLD hex 文件 **32** · 列为 `REPLACE_CANDIDATE_OWNER_AUTH` **17**（Registry living + FE/www/scripts env）。完整路径见 machine JSON `scan.replace_candidate_files`。

## 未部署合约 vs 新币（要不要改）

**本阶段默认：不部署、不改 constructor、不把它们绑进 V8 产品切针。**

| 槽 | Registry | 对新币要不要改 |
|----|----------|----------------|
| RegionStewardStakePool | TBD | **YES_IF_LATER_DEPLOYED** — constructor 必须 `ttgToken_=NEW` 且 `ttgTotalSupplyUnits_=25T`；禁止抄 `TtgGovFreezeConstants` 的 10M |
| TtgSeatConcentrationRegistry | TBD | NO_THIS_PHASE — constructor 无 TTG |
| CI-01 Seat `0x68e55d…` | DEPLOYED_NOT_WIRED | **INDEPENDENT** · KEEP 作路由 |
| CountryPool / StewardPathVault / Unallocated / RegionVault / ReserveVault / legacy_treasury | TBD/PLANNED | **INDEPENDENT_OF_TTG**（结算资产是 USDC 路径） |
| Guide / Provider IdentityStakingPool | `/meta` null | **INDEPENDENT_OF_TTG**（81 身份质押与治理 TTG 正交） |
| SeatGate / vote-escrow / Migrator | NOT_IN_CUTOVER | **禁止本阶段**（Migrator = 迁币） |
| indexer / relayer / monitoring EOA | PLANNED | INDEPENDENT · 切针后跟 `/meta` |

## 禁止（写死）

- 迁 25T / 拆仓 / 再发 `setGovernor`
- 改 FTB `20260812` 地址字节
- 切 Official `/meta` 或 bake Official www
- 重部署 Money Path / 执行 CI-02 hop B
- 宣称 Official live 已切 NEW 币 或 `TT_PRODUCTION_GO=GO`

下一会话：**仅**在 Owner **独立写出**产品切针授权后，才允许按上表 REPLACE 行开工。本闸 `PASS_STOP` ≠ 授权。
