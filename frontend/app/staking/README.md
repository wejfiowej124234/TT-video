# `/staking` — 身份质押（Guide + Provider · 81 · ①）



**阶段：** **① 本地**。**②** 测试网真链 tx · **③** 生产部署另闸。



**向导全链 SSOT：** [`lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md`](../../lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md)



## 职责（写死）



| 轨 | 本页 | 不在本页 |

|----|------|----------|

| **身份质押** | 向导 / 商家 **USDC** → `GuideIdentityStakingPool` / `ProviderIdentityStakingPool` | — |

| **B 轨准入费** | — | `/me/onboarding`（**USDC** · 官方地址 · **不退** · 仅 provider / region_steward） |

| **主理人 TTG 质押** | — | `/me/onboarding` · `MeOnboardingStewardStakeSection` |

| **订单 Escrow** | — | `/pay` · `/escrow/[id]` |

| **Country Pool** | — | 治理/融资叙事 · 84 |



## 资金与池子



```

钱包 USDC --approve+stake()--> GuideIdentityStakingPool     （向导）

                          or --> ProviderIdentityStakingPool （商家）

```



- **币种：** **USDC**（与 **01** `SETTLEMENT_TOKEN`、**`traveltrustLiquidityGatewayModel`** 同源）

- **禁止** 与准入费、Escrow 本金、Country Pool TVL 混账（**96-18 §6** · **81 §1.2**）



## 准入费 vs 身份质押



| | **准入费（B 轨）** | **身份质押（本页）** |

|--|-------------------|----------------------|

| 对象 | 平台运营 SKU | 履约/身份押金 |

| 币种 | **USDC**（官方地址） | **USDC**（链上池） |

| 路由 | `/me/onboarding` | `/staking` |

| 角色 | 商家、主理人 | 向导、商家 |

| 向导 | **无 B 轨** | **审核通过后**方可写操作 |

| 退回 | **原则上不退**（平台费） | `withdraw`（未被 slash 部分 · **可赎回**） |



## 向导生命周期与入口（防重复）



| 生命周期 | 主入口 | 本页写操作 |

|----------|--------|------------|

| 未申请 | `/guide/register` | 无（仅说明 + 申请 CTA） |

| **已提交 · 审核中** | 完成页 → `/guide` 看状态 | **`GuideIdentityStakingOpsGate` 拦截** stake/withdraw |

| **审核通过 · 未质押** | **`/guide` Banner** → 本页 `#guide-identity-stake` | **开放** |

| 已质押 | — | withdraw 等按 81 |

| 商家审核后 | `/provider/register` 完成页 | provider 池（对称） |



**刻意不在：** 顶栏用户菜单挂 `/staking` 作主 CTA；申请完成页 **不** 链 `/staking`（2026-06-12 收口）。



## UI · L5（① · 体验深壳）

- **视觉族：** 首页 `/guide` 工作台同族 — `WorkspaceL5PageShell` + `AuthL5PageBackdrop` + 暖金暗玻璃卡片（`lib/staking/stakingPageL5.ts` · `data-tt-homepage-funnel-l5`）
- **L0 深顶栏：** `/staking` ∈ `AUTH_L5_DARK_HEADER_PREFIXES`（`lib/uiSystem.ts` · 与 `/guide` 同族）
- **底栏：** `StakingL5CrossNav` 暖金链 · `footerTarget="guide"`（**非** ProductCrossNav 蓝链）
- **钱包 CTA：** 向导 scope + 全页双池 · **单点** `StakingWalletConnectPrompt`（`StakingWalletGateProvider` 抑制子面板重复提示）
- **MIN 诚实：** `resolveGuideIdentityStakingTier` · 链可读未连钱包也展示 API 额 · 连钱包后「一键补足至最低质押」
- **地址：** `StakingContractAddressRow` 复制 + 区块浏览器（① 已知链）
- **错误边界：** `app/staking/error.tsx` 体验深壳（`WorkspaceL5PageShell` + `StakingL5CrossNav`）
- **`?scope=guide`：** 仅向导池；Registry 收进「高级」折叠；链未部署时展示 `StakingApiStakeSummary`（`GET /me` · `guide.stake_amount` 只读兜底）
- **机读：** `app/staking/stakingPageL5.contract.test.ts` · `lib/staking/stakingContractDeployment.test.ts`
- **① 收口：** [`STAKING-PHASE1-CLOSURE.md`](../../evidence/GO_local_web3_pages_closure/STAKING-PHASE1-CLOSURE.md)
- **② backlog：** [`STAKING-PHASE2-BACKLOG.md`](../../evidence/GO_local_web3_pages_closure/STAKING-PHASE2-BACKLOG.md)（**STK-P2-001～010** · [PHASE2-START-CHECKLIST B-SMOKE-9](../../../docs/runbook/PHASE2-START-CHECKLIST.md)）

## ① 本地链环境（读/写真链）

| 场景 | 做法 |
|------|------|
| **向导池 Anvil（推荐）** | `bash scripts/dev/smoke-guide-identity-stake-anvil.sh`（deploy + env + `token/stakeOf/stake/withdraw` 烟测） |
| 仅部署 + env | `bash scripts/dev/deploy-fundstack-anvil-local.sh --apply` → 重启 API + Next |
| MetaMask mint USDC | `bash scripts/dev/mint-usdc-anvil-local.sh 0xYourWallet 2000` |
| 链上写 → DB 对拍 | tx 成功后 `stakingGuideDbSync` → `POST /guides/:id/stake`（须登录 + 已有 guide 行） |
| Sepolia | `NEXT_PUBLIC_CHAIN_ID=11155111` + 已部署地址（**②**） |
| 链/地址不匹配 | UI「本链未检测到质押合约」+ API 只读兜底（**非**链上真值） |

详 **[FUNDSTACK-ANVIL-LOCAL-README.md](../../../scripts/dev/FUNDSTACK-ANVIL-LOCAL-README.md)**

## 代码地图

| 模块 | 路径 |
|------|------|
| 页面 | `app/staking/page.tsx` |
| L5 token | `lib/staking/stakingPageL5.ts` |
| 部署探测 | `lib/staking/stakingContractDeployment.ts` |
| API 质押兜底 | `lib/staking/useGuideApiStakeAmount.ts` · `components/staking/StakingApiStakeSummary.tsx` |
| 向导池门闸 | `components/staking/GuideIdentityStakingOpsGate.tsx` |
| 向导池写操作 | `#guide-identity-stake` · `StakingStakePanel pool="guide"` |
| 商家池写操作 | `StakingStakePanel pool="provider"` |
| 环境 | `lib/stakingEnv.ts` · `NEXT_PUBLIC_GUIDE_STAKING_ADDRESS` / `NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS` |
| 向导入口 SSOT | `lib/guide/guideIdentityStakingNav.ts` |
| 工作台 Banner | `components/guide/GuideIdentityStakingBanner.tsx` |



## 互指



- 向导全链：`GUIDE-ONBOARDING-STAKING-FLOW.md` · `frontend/app/guide/README.md` · `frontend/app/guide/register/README.md`

- 商家全链：`frontend/app/provider/register/README.md`

- 准入费：`frontend/app/me/onboarding/README.md`

- 经济模型：`docs/spec/81-经济模型-向导质押与订单押金.md` · `docs/spec/96-18-商家与主理人准入费用与治理币兑换设计.md`


