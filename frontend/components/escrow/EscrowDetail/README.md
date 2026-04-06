# EscrowDetail

托管订单详情页：展示订单状态、报价摘要、聊天、操作按钮、评价、设置托管地址、链上操作与风险提示等。43 阶段拆分为多文件，单一入口对外。

## 入口与对外

- **入口**：`index.tsx`（组合 useEscrowDetail、Header、QuoteSummaryCard、ChatBlock、OrderActionsBlock、ReviewBlock、SetEscrowAddressBlock、**CreateOnChainEscrowBlock**（内含父级 **`FeeRouterWiringNotice`**：FeeRouter /meta 与 env 对照，**07 §五 5.2A**）、EscrowTxModal、EscrowOnChainActions、ReorgBanner、EscrowRiskNotice、ConfirmFinalPlanBlock）
- **对外**：`import EscrowDetail from "@/components/escrow/EscrowDetail"`（默认导出）
- **使用**：`app/escrow/[id]/page.tsx` 通过 `dynamic(..., { ssr: false })` 按需加载

## 目录职责

| 文件 | 职责 |
|------|------|
| `index.tsx` | 组合各区块、消费 useEscrowDetail |
| `useEscrowDetail.ts` | 订单数据拉取、状态派生、操作回调 |
| `types.ts` | 组件与 hook 用到的类型 |
| `utils.ts` | 纯函数工具 |
| `EscrowDetailHeader.tsx` | 顶部标题与状态 |
| `QuoteSummaryCard.tsx` | 报价汇总卡片 |
| `ChatBlock.tsx` | 订单消息列表与发送；**did** 态顶部内嵌 `OrderChatContextCard`（`escrow-embedded` + `inlineSnapshot`，53-S7，免重复 GET order）；**53 可选**：`orderContextInline` 时聊天标题下 **`ChatItineraryMicroRibbon`** 微型行程条（≤3 日 `landing_results_day_*` 口径） |
| `OrderActionsBlock.tsx` | 抢单/接单/确认等操作按钮 |
| `ReviewBlock.tsx` | 评价展示与提交 |
| `SetEscrowAddressBlock.tsx` | 设置托管地址 |
| `EscrowTxModal.tsx` | 链上交易确认弹层 |
| `EscrowOnChainActions.tsx` | 链上操作入口 |
| `ReorgBanner.tsx` | 重组/风险提示条 |
| `EscrowRiskNotice.tsx` | 风险说明 |
| `ConfirmFinalPlanBlock.tsx` | 确认最终方案区块 |
| `CreateOnChainEscrowBlock.tsx` | EscrowFactory 链上创建；顶部 **`FeeRouterWiringNotice`**（与 `requirePlatformFeeRecipient` 一致） |

## 依赖方向

- index → useEscrowDetail、各 Block/Modal 组件、types、utils
- 各 Block → types、lib（api、apiClient）、i18n
