/**
 * GD-L5-P2 · 向导预约业务闭环 Sprint SSOT（①）
 */
import { GUIDE_BOOKING_P2_PROGRAM_ID } from "./guideBookingEscrowOccupancyMatrix";

export { GUIDE_BOOKING_P2_PROGRAM_ID };

export type GuideBookingP2Finding = {
  id: string;
  title: string;
  status: "closed" | "open";
};

export const GUIDE_BOOKING_P2_FINDINGS: readonly GuideBookingP2Finding[] = [
  { id: "GD-L5-P2-01", title: "POST /orders schedule_conflict when trip overlaps", status: "closed" },
  { id: "GD-L5-P2-02", title: "cancel releases guide_slot + release_slot + calendar", status: "closed" },
  { id: "GD-L5-P2-03", title: "PATCH /orders/:id/trip-dates reschedule before escrow", status: "closed" },
  { id: "GD-L5-P2-04", title: "Escrow occupancy matrix documented + contract", status: "closed" },
  { id: "GD-L5-P2-05", title: "GET /guides/:id consumer decision stats backfill", status: "closed" },
] as const;

export const GUIDE_BOOKING_P2_OPEN = GUIDE_BOOKING_P2_FINDINGS.filter((f) => f.status === "open");
