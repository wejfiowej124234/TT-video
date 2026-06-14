# `/staking` · Phase ① 收口（2026-06-12 · L5 体验深壳 · 2026-06-12b 企业诚实性补全）

**阶段：① 本地** — 向导 / 商家 **IdentityStakingPool** 读面板 + stake/withdraw + Registry；**不**表示 ② 测试网全链、③ 主网 Production GO。

**代码真源：** `frontend/app/staking/page.tsx` · `frontend/components/staking/*` · `lib/staking/stakingPageL5.ts` · `lib/guide/guideIdentityStakingNav.ts` · **81** / **14** / **04 §3.4** · [GUIDE-ONBOARDING-STAKING-FLOW](../../lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md)

---

## 收口结论（ACTIVE）

| 维度 | 状态 |
|------|------|
| **视觉族** | **体验深壳** — `WorkspaceL5PageShell` · 首页 `/guide` 暖金暗场 · `data-tt-staking-page-l5=staking-page-l5-v2-experience` |
| **结构** | 全页体验壳 → guide 池（**OpsGate**）→ `?scope=guide` 隐藏 provider 池 · Registry 折叠 → 免责声明 |
| **链上读** | `useStakingContractDeployment` + wagmi `token`/`stakeOf`/`slashedOf`（① Anvil 烟测 `smoke-guide-identity-stake-anvil.sh`） |
| **API 兜底** | 链不可读 **或** 链可读但钱包未连 → `StakingApiStakeSummary`（`guide.stake_amount` · **非**链上真值 · 带 ① 免责） |
| **MIN_STAKE 诚实** | `resolveGuideIdentityStakingTier` · 不足额警告 · 连钱包后「一键补足至最低质押」 |
| **链上写** | `approve` → `stake` · `withdraw`（① Anvil 烟测已覆盖） |
| **DB 对拍** | `stakingGuideDbSync` · tx 成功后 `POST /guides/:id/stake`（① best-effort） |
| **UI 冻结** | **维护期锁** — `data-tt-ui-frozen=staking-l5-20260612`（① 数据链/i18n/门闸补全 **不**回流 layout） |
| **L0 深顶栏** | `/staking` ∈ `AUTH_L5_DARK_HEADER_PREFIXES`（与 `/guide` 同族） |
| **底栏** | `StakingL5CrossNav` 暖金链 · `footerTarget="guide"` |
| **错误边界** | `app/staking/error.tsx` 体验深壳（**非** ProductCrossNav） |
| **钱包 CTA** | **单点** `StakingWalletConnectPrompt`（合并原 intro 文案）；`StakingWalletGateProvider` 抑制子面板重复提示 |
| **合约地址** | `StakingContractAddressRow` 复制 + 区块浏览器（已知链） |
| **Registry 未连钱包** | 折叠摘要 + `StakingPanelDisconnectedState` 紧凑禁用态 |

**② 待验 backlog：** [`STAKING-PHASE2-BACKLOG`](./STAKING-PHASE2-BACKLOG.md)（**STK-P2-001～010** · **STK-P3-001～004**）

---

## ① 清单（2026-06-12b 补全）

| # | 清单项 | 状态 |
|---|--------|------|
| 1 | 体验深壳 + 暖金面板 + 深顶栏 | ✅ 完成 · 已冻结 |
| 2 | 链上只读（池/token/MIN_STAKE） | ✅ 完成 |
| 3 | 未连钱包写操作门闸 | ✅ 完成 |
| 4 | 双钱包 CTA 合并 | ✅ 完成 |
| 5 | 多面板连接提示去重 | ✅ 完成 |
| 6 | 合约地址复制/浏览器 | ✅ 完成（① · 已知链） |
| 7 | 不足 MIN_STAKE 工作台/质押联动警告 | ✅ 完成 |
| 8 | 链可读 + 未连钱包 API 质押展示 | ✅ 完成（带 ① 免责） |
| 9 | 连钱包后三档选档 + L5 预签确认卡 | ✅ 完成 |
| 18 | 后端 stake 鉴权 + PG 持久化 + exit hydrate | ✅ 完成（①） |
| 19 | API↔链不一致警告 · 池缺失/错链非空态 | ✅ 完成（①） |
| 20 | 全额解押 L5 预签卡 · OpsGate 可见性刷新 | ✅ 完成 |
| 10 | `/guide` 底栏交叉链 | ✅ 完成 |
| 11 | 底栏免责声明层级分离 | ✅ 完成 |
| 12 | Registry 折叠摘要（资格徽章） | ✅ 完成 |
| 13 | 连接钱包后自动滚至质押区 | ✅ 完成 |
| 14 | 工作台链上 `stakeOf`/`MIN_STAKE` 摘要 | ✅ 完成（① 展示 · ② STK-P2-004 强一致） |
| 15 | 向导退出申请 API + 工作台卡片 | ✅ 完成（`POST/GET /me/guide-exit-*` · **无** Admin/冷却/链上退款） |
| 16 | 退出期接单门禁 `exiting` → `guide_exit_pending` | ✅ 完成（① · 在途订单释放 **②** STK-P2-015） |
| 17 | 向导 scope **单卡工作台**（摘要 hero · 质押/赎回双栏 · 技术 details 折叠） | ✅ 完成（`StakingGuideIdentityWorkbench`） |

---

## 维护期边界

| 允许 | 禁止 |
|------|------|
| 合约地址 env · ABI 对拍 · i18n · 错误态 · API 只读兜底文案 | 删除双池（全页）或冒充链上余额 |
| `GET /meta` 合约字段诚实化文案 | API 兜底冒充 ② 链上对拍 GO |
| 跳转 `/guide/register` 主 CTA | 冒充 ② 测试网 stake 全矩阵已 GO |
| MIN_STAKE 档位门闸 · 补足 CTA | 五主路由式 layout/视觉回流 |

---

## 机读（① · 结构对拍）

```bash
bash scripts/dev/smoke-guide-identity-stake-anvil.sh
cd frontend && npx vitest run app/staking/stakingPageL5.contract.test.ts lib/guide/guideIdentityStakingNav.test.ts lib/guide/guideExitRequest.test.ts lib/staking/stakingContractDeployment.test.ts lib/staking/stakingGuideDbSync.test.ts lib/staking/stakingBlockExplorer.test.ts
```

变更还须：保持 **双池**（全页）· **`?scope=guide`** 向导专面；推送前 **`run-web3-itinerary-l5-green.sh`**（wagmi 走廊无回归）。② Sepolia 全链对拍见 **PHASE2-START-CHECKLIST**。

---

## 诚实边界

| 可宣称（①） | 禁止冒充 |
|-------------|----------|
| 页面结构 · 双池 · Registry 只读已收口 | ② staging 真 stake GO |
| 本地 chain_off / dev RPC 可读 | ③ 主网 slashing 已验 |
| API 质押额展示带 ① 免责 · MIN 不足警告 | API 额 = 链上真值（② STK-P2-004 前） |
