# GO_local_guide_detail_l5 · 向导详情 L5（①）

**阶段：** ① 本地 only（非 ②③ GO）

## GD-L5 预约链路烟测

```bash
bash scripts/dev/record-guide-detail-l5-booking-evidence.sh
```

**对齐 `start-api-with-seed`（可选 · 默认不跑）：**

```bat
set TRAVELTRUST_POST_START_GUIDE_DETAIL_BOOKING_SMOKE=1
scripts\start-api-with-seed.bat
```

- **Step 4b**：API 启动前 `clear-hangzhou-seed-guide-slots-db`（清 `f0e0b101-*` accepted/escrowed）
- **Step 6l**：`smoke-guide-detail-booking-local.sh`（`RESTART_API=0` · `SKIP_PLAYWRIGHT=1`）
- 独立证据：`bash scripts/dev/record-guide-detail-l5-booking-evidence.sh`（含 API 重启 + vitest）

或仅 API 链（API 已起）：

```bash
RESTART_API=0 bash scripts/dev/smoke-guide-detail-booking-local.sh
```

**通过标记：** 日志末行 `TT_GD_L5_BOOKING_SMOKE: OK`

**覆盖：**

- 重启 API 清空 `guide_slot` 脏占用（默认 `RESTART_API=1`）
- `tourist@test.com`：`GET /guides/:id` · `GET …/availability` · `POST /orders`
- 与 UI 同源：`BookGuideModal` → `/orders/new?guide_id=` → 创建订单
- 可选 Playwright：`e2e/b469-guides-drawer-booking-convergence.spec.ts`（前端 `:3012` 可用时）

**机读绿集：**

```bash
npx vitest run app/guides/[id]/guideDetailPageL5.contract.test.ts lib/l5/guideDetailL5Closure.contract.test.ts
```

## GD-L5-P2 业务闭环烟测（档期 · 改期 · 取消 · 决策回填）

```bash
bash scripts/dev/record-guide-detail-l5-booking-p2-evidence.sh
```

或仅 API 链（API 已起且含 P2 路由）：

```bash
RESTART_API=0 bash scripts/dev/smoke-guide-detail-booking-p2-local.sh
```

**通过标记：** 日志末行 `TT_GD_L5_BOOKING_P2_SMOKE: OK`

**覆盖（①）：**

- `GET /guides/:id` 游客决策字段（`rating` · `completedCount` · `responseSLA`）
- `POST /orders` + 行程日期 → Created 不占日历红档
- 向导接单 → `occupied_ranges` 显示档期；重叠建单 **409 `schedule_conflict`**
- `PATCH /orders/:id/trip-dates` 改期迁移日历区间
- 取消 → `guide_slot` 释放 · 日历清空 · 可再预约
- Escrow 占用矩阵：`lib/l5/guideBookingEscrowOccupancyMatrix.ts` + `guideBookingP2.contract.test.ts`

**机读绿集（P2）：**

```bash
npx vitest run lib/l5/guideBookingP2.contract.test.ts lib/guideBookingDates.test.ts
```

**诚实边界：** ① 本地 API 烟测 **≠** ② staging **≠** ③ 生产真链/真 PSP。

## GD-L5-P3 itinerary-first 预约主链（移除 `/orders/new` 捷径）

```bash
bash scripts/dev/record-guide-detail-l5-booking-p3-evidence.sh
```

**机读绿集（P3）：**

```bash
npx vitest run lib/l5/guideBookingP3.contract.test.ts components/market/BookGuideModal.test.tsx
```

**浏览器 E2E（需 API `:8080` + 前端 `:3012`）：**

```bash
npx playwright test e2e/b469-guides-drawer-booking-convergence.spec.ts e2e/b468-market-discovery-full-ui-journey.spec.ts -g "B-469|B-468"
```

**行为（①）：**

- `BookGuideModal`：拉取旅客已发布、未选向导行程 → **行程下拉** → `PATCH guide` + 可选 `PATCH trip-dates` → `/escrow/:id`
- 无行程：主 CTA **先去创建行程**（`/itinerary/new?guide_id=`），不再误导跳转 `/orders/new`
- Escrow 深链 `bindGuideToOrder` 模式保持不变

**诚实边界：** `/orders/new` 仍可作为独立建单页（B-467/p02），**不再**作为向导详情/市场预约弹窗主链。

## itinerary-date-as-source 冻结（行程日期 = 档期真源 · 2026-06-09）

```bash
bash scripts/dev/record-itinerary-date-as-source-evidence.sh
```

**SSOT：** [`../GO_local_web3_itinerary_l5/ITINERARY-DATE-AS-SOURCE-PHASE1-FREEZE.md`](../GO_local_web3_itinerary_l5/ITINERARY-DATE-AS-SOURCE-PHASE1-FREEZE.md)

**末行：** `TT_ITINERARY_DATE_AS_SOURCE_EVIDENCE: OK` · 忙档 `TT_ITINERARY_DATE_AS_SOURCE_BUSY_GUIDE_SMOKE: OK`

**E2E：** `e2e/itinerary-date-as-source-corridor.spec.ts`
