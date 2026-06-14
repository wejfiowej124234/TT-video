# Traveler Conversion Excellence Sprint · Matrix

**Program ID:** `traveler-conversion-excellence-sprint-20260608`  
**视角：** 仅首次访问游客 · 禁止系统/协议/运营视角审计  
**通过标准：** 3 秒内知道 **在哪 · 做什么 · 完成后会怎样**（非「功能存在」）  
**机读 SSOT：** `frontend/lib/travelerConversionExcellenceSprintModel.ts` · `travelerConversionExcellence.contract.test.ts`

---

## 六页 · 一目标 · 一主 CTA · 一下一步

| 页 | 路由 | 我在哪（目标） | 主 CTA | 下一步 | 完成后 |
|----|------|----------------|--------|--------|--------|
| 首页 | `/` | `landing_hero_title` | `landing_btn_generate` | `landing_hero_action_note` | `landing_hero_itinerary_disclaimer` |
| 行程预览 | `/#landing-results` | `landing_results_heading` | `landing_view_order_detail` | `landing_results_next_step` | 美元估算报价 |
| 订单详情 | `/escrow/:id` | `escrow_draftMeta_*` | `escrow_saveItinerary` | `escrow_draftNextStep_*` | `escrow_draftGuideTrust_line` |
| 自由市场 | `/market` | `market_hero_subtitle` | `guide_card_book` | `market_bindGuide_bannerSub` | `market_hero_pill_escrow` |
| 向导详情 | `/guides/:id` | 介绍/专长 | `guide_card_book` | `guide_detail_specialty_hint` | `guide_detail_consumer_trust_body` |
| 行程付款 | `/pay` | `pay_pageTitle` | `pay_ctaEscrowPrimary` | `pay_escrowPhase_calloutTitle` | `pay_disclaimer` |

---

## 禁止出现在游客可见 copy

`DID` · `EscrowFactory` · `FeeRouter` · `GET /meta` · `NEXT_PUBLIC_*` · 链上托管/存款 · `Campaign/surface` 运维句 · `UUID` 操作指引 · Runbook · 开发者调试标题

---

## Findings

### P0（1/1 ✅）

| ID | 页 | 问题 | 修复 |
|----|-----|------|------|
| TC-P0-01 | 市场 | 空冷启动展示「surface / Campaign」 | 空态不渲染面板（`return null`） |

### P1（5/5 ✅）

| ID | 页 | 问题 | 修复 |
|----|-----|------|------|
| TC-P1-01 | 订单详情 | Experience 路径仍展示 FeeRouter | 体验区不渲染 `FeeRouterWiringNotice` |
| TC-P1-02 | 向导详情 | 「DID 可验证」 | →「平台认证」 |
| TC-P1-03 | 付款 | 链上存款/UUID/托管阶段 | 消费者付款指引 rewrite |
| TC-P1-04 | 首页 | Hero 托管术语 | → 费用锁定至行程结束 |
| TC-P1-05 | 订单详情 | factory 标题「链上托管」 | →「准备付款」消费者句 |

### P2 → ②

| ID | 页 | 问题 |
|----|-----|------|
| TC-P2-01 | 订单详情 | `ESCROW_DEV_TOOLS=1` 时高级折叠仍可见 |

---

## 验收

```bash
cd frontend
npx vitest run lib/travelerConversionExcellence.contract.test.ts \
  lib/travelerL5ExcellenceSprint.contract.test.ts \
  app/guides/\[id\]/guideDetailPageL5.contract.test.ts
```

**Conversion Standard（①）：** P0/P1 = 0 open · 六页主链 copy 无协议术语漂移。
