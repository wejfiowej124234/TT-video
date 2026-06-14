/**
 * GD-L5-P2 · 向导档期 / Escrow 占用矩阵（① · 与 `guide_availability_impl` 同源）
 * 机读：`guideBookingP2.contract.test.ts`
 */

export type GuideBookingOccupancyRow = {
  orderState: string;
  hasTripDates: boolean;
  showsOnGuideCalendar: boolean;
  scheduleLockOnMockPay: boolean;
  guideSlotBlocksNewCreate: boolean;
  notes: string;
};

/** 与 `crates/api/chain_off/guides.rs` `guide_availability_impl` 对拍 */
export const GUIDE_BOOKING_ESCROW_OCCUPANCY_MATRIX: readonly GuideBookingOccupancyRow[] = [
  {
    orderState: "created",
    hasTripDates: true,
    showsOnGuideCalendar: false,
    scheduleLockOnMockPay: false,
    guideSlotBlocksNewCreate: false,
    notes: "游客已选日期建单；日历仍显示可订，待向导接单",
  },
  {
    orderState: "accepted",
    hasTripDates: true,
    showsOnGuideCalendar: true,
    scheduleLockOnMockPay: false,
    guideSlotBlocksNewCreate: true,
    notes: "向导接单后 occupied_ranges 含 source=order；guide_slot 占位",
  },
  {
    orderState: "escrowed",
    hasTripDates: true,
    showsOnGuideCalendar: true,
    scheduleLockOnMockPay: true,
    guideSlotBlocksNewCreate: true,
    notes: "mock-pay 后 lock_slot；日历 source=lock 优先",
  },
  {
    orderState: "cancelled",
    hasTripDates: true,
    showsOnGuideCalendar: false,
    scheduleLockOnMockPay: false,
    guideSlotBlocksNewCreate: false,
    notes: "取消释放 guide_slot + release_slot；Accepted 订单不再计入 availability",
  },
  {
    orderState: "accepted",
    hasTripDates: false,
    showsOnGuideCalendar: false,
    scheduleLockOnMockPay: false,
    guideSlotBlocksNewCreate: true,
    notes: "无日期订单仍占 guide_slot；日历无区间可显",
  },
] as const;

export const GUIDE_BOOKING_P2_PROGRAM_ID = "guide-booking-l5-p2-closure-20260609" as const;
