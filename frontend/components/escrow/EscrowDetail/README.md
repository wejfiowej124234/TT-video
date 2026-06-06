# EscrowDetail · 订单详情编排

**阶段：① 本地** · 路由 **`/escrow/[id]`**（`app/escrow/[id]/page.tsx` → `EscrowDetailSection` → 本目录 `index.tsx`）

## 读序（禁止文档分叉）

| 顺序 | 真源 |
|------|------|
| ① | **[ESCROW-DRAFT-EXPERIENCE-FREEZE.md](../../../evidence/GO_local_web3_itinerary_l5/ESCROW-DRAFT-EXPERIENCE-FREEZE.md)** — 预链上草稿 **UI 已冻结**（2026-05-28） |
| ② | [`app/escrow/[id]/README.md`](../../../app/escrow/[id]/README.md) |
| ③ | **本文件** + 代码 |
| ④ | [GO_local_web3_itinerary_l5](../../../evidence/GO_local_web3_itinerary_l5/README.md) · [GO_local_orders_l5](../../../evidence/GO_local_orders_l5/README.md) · [80 §0.1](../../../../docs/spec/80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md) |

---

## 双壳模型（以 `index.tsx` 为准）

| 壳 | 激活条件 | 视觉 | 用途 |
|----|----------|------|------|
| **Experience** | `experienceDraft` = `isPreEscrowProtocol && !hasEscrow` | `TT_ESCROW_EXPERIENCE_*` · `data-tt-escrow-draft-experience-ui-frozen="1"` | 创新行程解锁后的草稿：发布市场、选向导、编辑行程、确认终版 |
| **协议 DID** | 已上链或 `hasEscrow` 等 | `TT_ESCROW_PROTOCOL_*` · `escrowProtocolUi` · `data-tt-escrow-protocol-l5` | 存款/释放/争议、双边确认、评价、链上 Tx、`ChatBlock`（`variant=did`） |

**`useEscrowDetail.ts` 派生（Experience 相关）：**

- `isPreEscrowProtocol` — 行程区与 PATCH 门闸
- `allowConfirmFinalPlan` — `orderAllowsConfirmFinalPlan`（含 **created** 等）
- `showItineraryBudgetZone` — 行程 + 报价双栏
- `isDraft` — 订单仍为 draft 行（与 UI 壳正交）

---

## Experience 主块序（冻结 · 不得重排）

1. `EscrowDetailHeader` · `variantExperience`
2. `OrderFlowSteps` · `variant="experience"` · `draftJourneyStep` · `draftStep2Phase`（`pickGuide` 当已发布无向导）
3. `EscrowDraftNextStepStrip`（`hideWhenPublishedBanner` 与发布横幅互斥）
4. `EscrowDraftPublishedBanner` **或** `EscrowDraftGuideEmptyCard` / `EscrowDraftGuideAssignedCard`
5. `EscrowDraftPayStepCard`（`planLocked`）
6. 行程区：`EscrowDraftItineraryTabBar` → 城市 / 每日说明 / 预览 · `UnifiedItineraryList`（`richCollapsedPreview` · `expandDayLabelMode="experience"`）
7. `QuoteSummaryCard` + `ConfirmFinalPlanBlock`
8. `EscrowDraftExperienceFooter`（取消/删除在 **更多**）
9. **仅** `NEXT_PUBLIC_ESCROW_DEV_TOOLS=1` → `EscrowDraftAdvancedProtocolFold`（链上创建、接单、证据）

**Experience 默认不出现：** `ChatBlock`、`EscrowRiskNotice`、`TrustGrowthMomentBanner`（协议壳才有）。

---

## `EscrowDraft*` 组件（12）

| 文件 | 职责 |
|------|------|
| `EscrowDraftPublishedBanner.tsx` | 已发布待选向导 · 双栏市场 CTA |
| `EscrowDraftGuideEmptyCard.tsx` | 未发布 · 保存并发布提示 |
| `EscrowDraftGuideAssignedCard.tsx` | 已绑向导 · 换向导 / 社区消息链 |
| `EscrowDraftNextStepStrip.tsx` | 当前步骤文案条 |
| `EscrowDraftItineraryTabBar.tsx` | 城市 \| 每日说明 \| 预览 |
| `EscrowDraftDayNarrativePanel.tsx` | 按日说明编辑 |
| `EscrowDraftPayStepCard.tsx` | 确认后付款步（① mock-pay） |
| `EscrowDraftTrustPayStrip.tsx` | 确认/付款信任说明条 |
| `EscrowDraftMobileActionBar.tsx` | 窄屏保存/发布 |
| `EscrowDraftTravelNotice.tsx` | 合规短提示（替代全协议风险栈） |
| `EscrowDraftExperienceFooter.tsx` | 打印 · 复制 · 返回 · 更多（取消/删除） |
| `EscrowDraftAdvancedProtocolFold.tsx` | 开发者调试折叠区 |

---

## 协议壳组件（未 UI 冻结）

| 文件 | 职责 |
|------|------|
| `index.tsx` | 双壳编排 |
| `useEscrowDetail.ts` | GET order、链状态、Tx、刷新 |
| `EscrowDetailHeader.tsx` | 标题/状态（`variantDid` / `variantExperience`） |
| `QuoteSummaryCard.tsx` | 报价与同步 |
| `ConfirmFinalPlanBlock.tsx` | `POST …/confirm-final-plan` |
| `OrderActionsBlock.tsx` | 接单/取消/完成等（dev 折叠内可 `variantExperience`） |
| `CreateOnChainEscrowBlock.tsx` | EscrowFactory 创建 + `FeeRouterWiringNotice` |
| `EscrowOnChainActions.tsx` / `EscrowTxModal.tsx` | 链上四动作 |
| `BilateralConfirmBlock.tsx` | 双边确认 |
| `ReviewBlock.tsx` | 评价 |
| `EscrowRiskNotice.tsx` / `EscrowCancelPolicySection.tsx` | 协议风险与取消政策 |
| `ChatBlock.tsx` | 订单消息（**非** Experience 草稿路径） |
| `OrderMessageLink.tsx` | 跳转社区消息 |
| `EscrowDetailLoadErrorView.tsx` / `EscrowDetailSkeleton.tsx` | 错误/骨架（Experience 暖壳） |

---

## API（Experience 草稿主链 · 与 `apiClient` 一致）

| 动作 | 方法 / 路径 |
|------|-------------|
| 详情 | `getOrder(id)` → `GET /api/v1/orders/:id` |
| 保存行程 | `patchOrderItinerary` → `PATCH /api/v1/orders/:id/itinerary` |
| 绑向导 | `patchOrderGuide` → `PATCH /api/v1/orders/:id/guide` |
| 确认终版 | `confirmFinalPlan` → `POST /api/v1/orders/:id/confirm-final-plan` |
| 取消/删除草稿 | `orderCancel` → `POST /api/v1/orders/:id/cancel` |
| 市场深链 | `marketHrefForEscrowGuideBind` → `/market?view=split&bindGuideToOrder=` |

发布到发现：`published_to_market` / 保存时 `savePublishedToMarket` 与 `isOrderPublishedToDiscover` 对拍。

---

## 共享 lib

| 模块 | 用途 |
|------|------|
| `lib/escrowExperienceUi.ts` | `TT_ESCROW_EXPERIENCE_*` · 按钮/链接 class |
| `lib/escrowProtocolUi.ts` | `TT_ESCROW_PROTOCOL_*` · 协议壳暖色 L5（含 `ChatBlock` / `OrderMessageLink`） |
| `lib/escrowRateL5.ts` | `/escrow/[id]/rate` 页壳 token |
| `lib/pay/payHubL5.ts` | `/pay` Hub 暖色 L5 |
| `lib/escrowExperienceDevTools.ts` | `isEscrowExperienceDevToolsEnabled()` · 预览截断 |
| `lib/escrowOrderAmountSsot.ts` | 展示金额与分项 |
| `lib/itineraryNarrativeUniform.ts` | 各日说明相同检测 |
| `lib/ordersGuideDeepLink.ts` | 市场绑单 URL |
| `lib/isAssignedGuideId.ts` | 向导是否已绑 |

---

## ① 机读验收

```bash
bash scripts/dev/run-web3-itinerary-l5-green.sh
```

含：`escrowExperienceUi` · `escrowDraftExperienceUiFreeze` · `escrowExperienceDevTools` · `escrowProtocolUi` · `OrderFlowSteps*`

**全链 API（可选）：**

```bash
bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh
```

**订单列表 → 支付 / 详情（辅助入口 · ①）：**

```bash
bash scripts/dev/smoke-orders-list-local.sh
bash scripts/dev/smoke-orders-pay-escrow-local.sh
```

列表卡标记：`data-tt-orders-list-card-escrow-link` · `data-tt-orders-list-pay-link`；Escrow 协议区：`data-tt-escrow-chat-block` · `data-tt-escrow-order-message-link`。

---

## 依赖方向

- `index.tsx` → `useEscrowDetail`、各 Block、`lib/*`
- 各 Block → `types.ts`、`apiClient`、`i18n`
- **对外：** `import EscrowDetail from "@/components/escrow/EscrowDetail"`
