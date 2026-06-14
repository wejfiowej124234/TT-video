# Traveler L5 Excellence Sprint · 消费者全链路审计（①）

**Sprint ID:** `traveler-l5-excellence-sprint-20260608`  
**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（本 sprint 仅 ① 文案/引导收口，不增业务功能）  
**机读 SSOT：** `frontend/lib/travelerL5ExcellenceSprintModel.ts` · `travelerL5ExcellenceSprint.contract.test.ts`

## 三身份走查

| 身份 | 目标 | 5s 价值 | 30s 首动作 | 3min 完整路径 |
|------|------|---------|------------|---------------|
| **first_visit** 首次访问 | 理解产品、敢点生成 | Hero 标题 + 价值条 | 选国家/城市 → AI 生成 | 预览卡 → 查看订单详情 |
| **first_order** 首次下单 | 保存行程、选向导 | 预览摘要 + 资金有保障 | 打开订单详情 → 保存行程 | 自由市场 → 绑定向导 |
| **first_pay** 首次付款 | 付款、跟踪订单 | 订单步骤条 + 应付金额 | 向导接单后 → 支付中心 | 我的订单跟踪状态 |

## 链路步骤 · L5 三问

| # | 步骤 | 路由 | 我能获得什么 | 为什么相信你 | 下一步做什么 | ① 状态 |
|---|------|------|-------------|-------------|-------------|--------|
| 1 | 首页 Hero | `/` | `landing_hero_*` · `home_consumer_value_*` | `home_consumer_funds_protected` | `landing_btn_generate` | ✅ 已收口 |
| 2 | 行程预览 | `/#results` | `landing_results_*` | `home_consumer_funds_protected` | `landing_view_order_detail` · `landing_results_next_step` | ✅ 已收口 |
| 3 | 订单详情（草稿） | `/escrow/:id` | `escrow_draftMeta_*` | `escrow_draftGuideTrust_*` | 保存行程 → 市场选向导 | ✅ 文案已收口 |
| 4 | 自由市场选向导 | `/market` | `market_hero_subtitle` | `market_hero_pill_*` · `pes2_escrow_*` | `market_bindGuide_*` | ✅ 文案已收口 |
| 5 | 行程付款 | `/pay` | `pay_pageTitle` · `pay_orderSummary_*` | `pay_disclaimer`（消费者版） | `pay_ctaEscrow` | ✅ 文案已收口 |
| 6 | 订单跟踪 | `/orders` | `orders_myOrders` · `orders_desc` | `orders_list_drafts_scope_note` | `orders_escrowDetail` | ✅ 文案已收口 |

## 未达 L5 · 登记留 ②③ 或结构性

| ID | 页面 | 问题 | 原因 | 未完成应在哪阶 |
|----|------|------|------|----------------|
| TL5-01 | 全链 | URL 仍为 `/escrow/:id` | 路由冻结 · 非 i18n | ② 可选 alias `/orders/:id/trip` |
| TL5-02 | 订单列表 | 卡片展示 Contract 地址 | 链上观测 · 旅行者噪声 | ② 按状态隐藏 |
| TL5-03 | 支付页 | 演示/mock 入金面板 | ① 本地 dev 必需 | ③ 生产隐藏 |
| TL5-04 | 市场 | PES 转化 rail 结构 | 五主 UI 冻结 | ② consumer-only 模式 |

## 验收命令（①）

```bash
cd frontend
npx vitest run lib/travelerL5ExcellenceSprint.contract.test.ts lib/homeConsumerExperienceL5.contract.test.ts
bash ../scripts/dev/run-web3-itinerary-l5-green.sh
```

## 一句话结论

**① 旅行者主路径文案与三问已收口**；结构性 URL/链上地址/mock 支付留 **TL5-01～04** 登记，**不**冒充 ②③ GO。
