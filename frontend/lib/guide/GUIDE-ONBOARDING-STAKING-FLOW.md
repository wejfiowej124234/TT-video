# 向导入驻 · 审核 · 身份质押 — 产品与技术 SSOT（①）

**阶段：** **① 本地**。**②** 测试网链上对拍 · **③** 主网真质押另闸。

**代码门闸真源：** `guideIdentityStakingNav.ts` · `GuideIdentityStakingBanner.tsx` · `GuideIdentityStakingOpsGate.tsx`

**互指：** `frontend/app/guide/README.md` · `frontend/app/guide/register/README.md` · `frontend/app/staking/README.md` · `docs/spec/64-申请向导-行业标准与DID检查清单.md` · `docs/spec/81-经济模型-向导质押与订单押金.md` §5.3

---

## 1. 五步（写死 · 与商家对照）

| 步 | 向导 | 商家（对照） |
|----|------|----------------|
| 1 | 注册 / 登录 | 同左 |
| 2 | **`/guide/register`** 资质 + 钱包 + 证件 | `/provider/register` KYB |
| 3 | —（**无** B 轨准入费 · **无** `/me/onboarding`） | `/me/onboarding` 准入费 **USDC** → 官方收款地址 |
| 4 | **平台审核**（Admin `PATCH …/admin/guides/:id`） | Admin 审核 |
| 5 | **审核通过后** USDC 身份质押 → 接单 | 审核后 USDC 质押 → 发橱窗 |

**强制：** 步骤 2 **仅提交资料**，**不**要求质押；步骤 5 **仅**在 `guides.status` 为 **`active` / `approved`** 后开放写操作。

---

## 2. 资金分工（防混读）

| 类型 | 币种 | 路由 | 向导 | 商家 | 主理人 |
|------|------|------|------|------|--------|
| **B 轨准入费** | **USDC**（官方地址 · **不退**） | `/me/onboarding` | **无** | 有 | 有 |
| **身份质押** | USDC | `/staking#guide-identity-stake` | 有 | 有（provider 池） | **无**（TTG 另轨） |
| **订单 Escrow** | USDC | `/pay` · `/escrow` | 接单后 | — | — |

**用户口径：** **身份质押** = 押金，**可赎回**（`withdraw` · 冷却期 · 未被 slash 部分）；**B 轨准入费** = 平台运营费，**USDC 付至官方地址**，**原则上不退**（见 `ONBOARDING-B-TRACK-USDC-SSOT.md`）。

---

## 3. 入口规划（唯一主 CTA · 防重复）

| 生命周期 | 页面 | 用户可见 | 链上/API 写操作 |
|----------|------|----------|-----------------|
| 未申请 | `/guide/register` | 三步表单 | `POST /api/v1/guides` |
| **已提交 · 审核中** | 完成页 / pending 面板 | 文案：**无需质押，等待审核** | **无**质押 CTA；**无** `/staking` 深链 |
| 审核中误入 `/staking` | 向导池区 | 黄色说明条 | `GuideIdentityStakingOpsGate` **拦截** stake/withdraw |
| **审核通过 · 未质押** | **`/guide` 工作台顶区** | **前往质押** Banner（标题下青色条） | `StakingStakePanel pool="guide"` |
| **已质押 · 不足 MIN** | **`/guide` 工作台顶区** | **不足最低质押** 警告 + 补足 CTA | 链上 `stakeOf` 或 API 额 < `MIN_STAKE` |
| **已满足 MIN** | `/guide` 工作台 | **管理身份质押** 条（显示已锁定 USDC） | withdraw / 追加（见 81） |

**刻意不在：** 顶栏用户菜单再挂「去质押」主按钮（与 Hub/工作台分流重复）。

**≠ 信任核验：** 工作台「查看准入与核验进度」「信任与核验」→ **`/me/settings/trust`**（KYC / `guide_registration_status` 展示），**不是**质押入口。

---

## 4. 门闸函数（机读）

| 函数 | 用途 |
|------|------|
| `canPerformGuideIdentityStaking(status)` | 审核已通过方可质押（`/staking` OpsGate） |
| `shouldShowGuideIdentityStakingBanner({…})` | 工作台顶区 Banner（须 `guideWorkspaceUnlocked` + 已通过 + **完全未质押**） |
| `shouldShowGuideIdentityStakingBelowMinWarning({…})` | 已质押但 **不足** `MIN_STAKE`（① 默认 81 参考锚 1000） |
| `shouldShowGuideWorkbenchStakingManageLink({…})` | **已满足最低质押** 时「管理身份质押」次入口 |
| `resolveGuideIdentityStakingTier(stakeAmount, min?)` | `none` · `below_min` · `satisfied` |
| `guideIdentityStakingSatisfied(stakeAmount, min?)` | 档位 `satisfied`（**非** `> 0`） |
| `canSubmitGuideExitRequest(status)` | **`active`****/**`approved`** 可提交退出申请 |
| `shouldShowGuideWorkbenchExitRequestCard({…})` | 工作台退出卡片（已质押或退出流中） |
| `GUIDE_IDENTITY_STAKE_TIER_USDC` | 平台定档 **1000 / 5000 / 10000** USDC（`guideIdentityStakeTiers.ts`） |
| `GuideIdentityStakeTrustBadge` | 游客可见押金档位（`/guides/:id` · 市场卡片） |
| `GUIDE_IDENTITY_STAKING_HREF` | `/staking?scope=guide#guide-identity-stake`（**仅向导池**） |

**`guide_registration_status` 真源：** `GET /api/v1/me` → `trust.guide_registration_status`（有 `guides` 行则为该行 `status`）。

**工作台解锁：** `meGuideWorkspaceUnlocked`（`users.role=guide` 或 `identity_slots.guide.state=active`）— **不等价**于可质押；质押另看审核状态。

---

## 5. 路由真源（防漂移）

| 路由 | 组件 | 说明 |
|------|------|------|
| `/guide` | `app/guide/page.tsx` → `GuideDashboardPageInner` | **线上工作台** |
| `/guide/register` | `GuideRegisterPageMain.tsx` | 申请 · **不质押** |
| `/staking` | `app/staking/page.tsx` | 双池；向导写操作经 OpsGate |

**遗留非入口：** `GuideDashboardPageMain.tsx` — **勿**在此挂新产品 CTA。

---

## 6. ① 本地链上读/写（Anvil · 企业验收）

| 项 | 入口 |
|----|------|
| 部署 FundStack | `bash scripts/dev/deploy-fundstack-anvil-local.sh --apply` |
| 读/写烟测 | `bash scripts/dev/smoke-guide-identity-stake-anvil.sh` → `TT_GUIDE_IDENTITY_STAKE_ANVIL_SMOKE: OK` |
| MetaMask USDC | `bash scripts/dev/mint-usdc-anvil-local.sh 0xWallet 2000` |
| 链上 → DB | `stakingGuideDbSync.ts` · tx 后 `POST /guides/:id/stake` |

**诚实边界：** ① Anvil 绿 **≠** ② Sepolia indexer 对拍 **≠** ③ 主网 GO。详 `scripts/dev/FUNDSTACK-ANVIL-LOCAL-README.md`。

---

## 7. 机读验收（①）

```bash
bash scripts/dev/smoke-guide-identity-stake-anvil.sh
cd frontend && npx vitest run \
  lib/guide/guideIdentityStakingNav.test.ts \
  lib/staking/stakingGuideDbSync.test.ts \
  app/staking/stakingPageL5.contract.test.ts
```

---

## 8. 产品缺口（① 代码审计 · 非跳阶）

| # | 缺口 | ① 现状 | 目标阶段 |
|---|------|--------|----------|
| G-01 | **页内重复钱包按钮** | 顶栏 `WalletStatusMini` 已够；质押页仅文案指顶栏 | ✅ 已收敛 |
| G-02 | **池合约地址含义** | 全站**单一** `GuideIdentityStakingPool` 地址（env 部署），**非**按用户生成；用户余额 = `stakeOf(钱包)` | 文档澄清 |
| G-03 | **质押 ≠ 审核通过** | 须 Admin 先 `active`/`approved` → `GuideIdentityStakingOpsGate` 才开放 stake/withdraw | ① 已门闸 |
| G-04 | **解押冷却期（7～30 天）** | **81** 有叙事；**合约 `withdraw` 即时到账**，无 cooldown | ② 合约 + UI |
| G-05 | **取消向导身份 · 管理员审核后退押** | **①** `POST/GET /me/guide-exit-*` + 工作台退出卡片；**无** Admin 审核 UI · 冷却 · 自动链上 withdraw | ② Admin + 冷却 + 退款 |
| G-06 | **Exited 生命周期** | **①** `exiting` 状态 + 接单门禁；**`exited`** 与解押联动 **未** 接线 | ② |
| G-07 | **Registry 与 Admin 审核对拍** | Registry 只读展示；**不**替代 `guides.status` 门闸 | ② STK-P2-006 |
| G-08 | **链上 withdraw → DB 归零** | `stakingGuideDbSync` best-effort；**非**强一致 | ② STK-P2-004 |

登记：**[`STAKING-PHASE2-BACKLOG`](../evidence/GO_local_web3_pages_closure/STAKING-PHASE2-BACKLOG.md)** **STK-P2-013～015**（退出/冷却）。

---

## 9. 诚实边界

① Anvil 链上读/写 + DB best-effort **≠** ② Sepolia 真链 stake tx 已验 **≠** ③ Production GO。

---

## 10. Phase ② 待验（登记 · 未实施）

**SSOT：** [`STAKING-PHASE2-BACKLOG`](../evidence/GO_local_web3_pages_closure/STAKING-PHASE2-BACKLOG.md)（**STK-P2-001～015**）

| 轨 | ② 任务摘要 |
|----|------------|
| env | Sepolia FundStack 地址注入 staging（[TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY](../../../docs/runbook/TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md)） |
| 烟测 | `smoke-guide-identity-stake` Sepolia 变体 |
| 浏览器 | `/staking?scope=guide` staging E2E |
| API | `guide.stake_amount` ↔ `stakeOf` 强一致 |
| 矩阵 | R-003 staging `release_gate=GO` 含 `/staking` 行 |

**开工闸：** [PHASE2-START-CHECKLIST · B-SMOKE-9](../../../docs/runbook/PHASE2-START-CHECKLIST.md) · **须 G-1/G-2 清闸后** 方合法宣称 ② 实施。
