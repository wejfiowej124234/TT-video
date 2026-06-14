# itinerary-date-as-source · ① 本地冻结（2026-06-09）

**阶段：① 本地** — 创建行程时写入的 **出行日期 = 预约档期真源**；市场绑定向导、向导详情「查看/预约」**同源**，禁止再要求旅客首选日历日期。**不**表示 ② 测试网 / ③ 生产 GO。

**代码真源：**

| 域 | 路径 |
|----|------|
| 行程日期推导 | `frontend/lib/guideBookingDates.ts` |
| 默认绑单 | `frontend/lib/bookGuideItineraryPicker.ts` · `pickDefaultBindOrderId` |
| 市场过滤 | `frontend/lib/guidesAvailableForTrip.ts` · `useMarketPage.ts` |
| 向导详情 | `frontend/app/guides/[id]/useGuideDetailPage.ts` · `GuideDetailPageLoaded.tsx` |
| 日历展示 | `frontend/components/guides/GuideOccupiedScheduleBlock.tsx` |
| 深链 | `frontend/lib/ordersGuideDeepLink.ts` · `guideDetailHrefForBind` |

---

## 冻结结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **有没有收口** | 是（①） |
| **有没有 UI 冻结** | 是（① · 数据链/预约逻辑；非五主 layout） |
| **日期真源** | 订单 `travel_date` + `days` / `start_date`+`end_date`（与后端 `parse_itinerary_date_range` 同源） |
| **绑单优先级** | URL `bindGuideToOrder` → Landing `tt_landing_result_order_ids_v1` 最近 → 可绑列表首条 |
| **市场过滤** | `bindGuideToOrder` 激活时按行程日期过滤；`occupied_ranges` 非空向导 **整卡隐藏**（与 PATCH 409 同源） |
| **向导详情** | 有行程时日历 **只读** + 高亮「您的行程出行」；**预约向导** 一键可点（`requireTripDates={false}`） |
| **忙档门闸** | 向导已接单占档 → 第二单 `PATCH …/guide` **409**；`BookGuideModal` **`book_guide_bindBlocked`** |
| **冻结日** | **2026-06-09** |
| **权威证据** | `ITINERARY-DATE-AS-SOURCE-20260609T060143Z.log` |

**维护期纪律：** 仅允许 bugfix · 数据链路 · i18n/a11y · 门闸对齐；**禁止**恢复「必须先选手动日历日期」为主路径、禁止削弱忙档 409 / 市场过滤一致性。

---

## 主链步骤（浏览器 · 与 Playwright 一致）

```text
首页/API 创建带 travel_date 行程 → 发布（无向导）
  → Escrow「请选择向导」→ /market?view=guides&bindGuideToOrder=
  → 横幅「行程出行：…」+ 向导列表按档期过滤
  → 查看向导（抽屉链接保留 bindGuideToOrder）
  → /guides/[id] 日历高亮行程日期（data-tt-guide-trip-selected）
  → 预约向导 → BookGuideModal → PATCH guide
  → /escrow/[id]「等待向导接单」
```

---

## 机读验收（须 exit 0）

```bash
bash scripts/dev/record-itinerary-date-as-source-evidence.sh
```

末行：`TT_ITINERARY_DATE_AS_SOURCE_EVIDENCE: OK`

**分项：**

| 步骤 | 命令 / 标记 |
|------|-------------|
| 绿集回归 | `run-web3-itinerary-l5-green.sh` |
| 冻结契约 | `lib/l5/itineraryDateAsSource.contract.test.ts` |
| 日期/过滤单测 | `guideBookingDates.test.ts` · `guidesAvailableForTrip.test.ts` · `bookGuideItineraryPicker.test.ts` |
| 忙档 API 烟测 | `smoke-itinerary-date-as-source-busy-guide-local.sh` → `TT_ITINERARY_DATE_AS_SOURCE_BUSY_GUIDE_SMOKE: OK` |
| 浏览器走廊 | `e2e/itinerary-date-as-source-corridor.spec.ts` |

---

## 清单

| # | 清单项 | 状态 | 未完成应在哪阶 |
|---|--------|------|----------------|
| 1 | 行程日期推导 SSOT | ✅ 完成 · 已冻结 | — |
| 2 | 市场 bind 出行横幅 + 过滤 | ✅ 完成 · 已冻结 | — |
| 3 | 向导详情自动带入 + 只读日历 | ✅ 完成 · 已冻结 | — |
| 4 | 一键预约 → Escrow 待接单 | ✅ 完成 · 已冻结 | — |
| 5 | 忙档向导不可预约（409 + 过滤） | ✅ 完成 · 已冻结 | — |
| 6 | ② staging 真链复验 | ❌ 未完成 | ② |
| 7 | ③ 生产 PSP / 主网 | ❌ 未完成 | ③ |

**诚实边界：** ① 本地绿 + 本冻结 **≠** ② staging GO **≠** ③ Production GO。
