# `/guide` · 向导工作台（① · L5 全页 ACTIVE）



**阶段：① 本地** — Operator Grade 经营轨；**非** ② staging SLA **非** ③ Production GO。



**全链 SSOT（申请 → 审核 → 质押）：** [`lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md`](../../lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md)



## 职责边界



| 区块 | 职责 | SSOT |

|------|------|------|

| 收件箱 | 待接单 / 今日待处理 / 进入 `/escrow`（空态链 Trust） | `GuideWorkbenchInboxCard` |

| 市场曝光 | **已保存**挂牌预览 + 档期 + 编辑链（只读经营） | `GuideWorkbenchMarketExposureCard` |

| 经营统计 | 有接单史后账单 + 累计指标；新向导见统计预告 | `GuideBillingPeriodCard` · `GuideDashboardStats` · `GuideWorkbenchStatsTeaser` |



**分工（Guide Experience Consistency Sprint + Order Corridor）：** 编辑 → `/me/identities/guide/settings` · 经营 → `/guide` · 信任/KYC → `/me/settings/trust` · **身份质押（审核通过后）** → `/staking#guide-identity-stake`（**唯一主 CTA** · `GuideIdentityStakingBanner`）· 接待订单 → `/orders?hat=guide`（`guide_id` SSOT）· 旅客订单 → `/orders`



**不做：** 完整 KYC 表单 · 资料编辑表单 · 市场筛选 · **申请期质押**。 **无** `/me/onboarding` B 轨准入费（见 `app/guide/register/README.md`）。



**路由真源：** `app/guide/page.tsx`（`GuideDashboardPageInner`）；`GuideDashboardPageMain.tsx` 为遗留视图模型，**非**线上入口。



## 身份质押（仅审核通过后）



| 阶段 | 本页表现 |

|------|----------|

| 审核中 | **无**「前往质押」Banner；收件箱空态可链 **信任与核验**（≠ 质押） |

| **审核通过 · 未质押** | 顶区 **`GuideIdentityStakingBanner`** → **前往质押** |

| 已质押 | Banner 隐藏 |



门闸：`lib/guide/guideIdentityStakingNav.ts` · 详表见全链 SSOT 上文。



## 数据链



- `getMeFull` → user + stats + `trust.guide_registration_status` + `guide.stake_amount`

- `useGuideWorkbenchInbox` → 订单收件箱

- `useGuideWorkbenchProfile` → `GET /api/v1/me/guide-profile`

- 预览 → `buildGuideProfileMarketPreviewDraft`

- 档期 → `getGuideAvailability(guide_id)`



## 机读闸（①）



```bash

bash scripts/dev/record-guide-workbench-l5-evidence.sh

```



Vitest：`guideWorkbenchL5.contract.test.ts` · `guideWorkbenchL5FullClosure.contract.test.ts` · `guideIdentityStakingNav.test.ts`



Playwright：`e2e/guide-workbench-inbox-l5.spec.ts` · `e2e/guide-workbench-full-l5.spec.ts`



## 冻结



[GUIDE-WORKBENCH-L5-FREEZE.md](../../evidence/GO_local_guide_workbench_l5/GUIDE-WORKBENCH-L5-FREEZE.md)


