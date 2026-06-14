import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  GUIDE_BOOKING_ESCROW_OCCUPANCY_MATRIX,
  GUIDE_BOOKING_P2_PROGRAM_ID,
} from "./guideBookingEscrowOccupancyMatrix";
import { GUIDE_BOOKING_P2_FINDINGS, GUIDE_BOOKING_P2_OPEN } from "./guideBookingP2SprintModel";

const root = join(process.cwd());

describe("GD-L5-P2 guide booking closure contract", () => {
  it("exports occupancy matrix + zero open P2 findings", () => {
    expect(GUIDE_BOOKING_P2_PROGRAM_ID).toContain("guide-booking-l5-p2");
    expect(GUIDE_BOOKING_ESCROW_OCCUPANCY_MATRIX.length).toBeGreaterThanOrEqual(5);
    expect(GUIDE_BOOKING_ESCROW_OCCUPANCY_MATRIX.some((r) => r.orderState === "accepted" && r.showsOnGuideCalendar))
      .toBe(true);
    expect(GUIDE_BOOKING_ESCROW_OCCUPANCY_MATRIX.some((r) => r.orderState === "cancelled" && !r.showsOnGuideCalendar))
      .toBe(true);
    expect(GUIDE_BOOKING_P2_OPEN.length).toBe(0);
    expect(GUIDE_BOOKING_P2_FINDINGS.every((f) => f.status === "closed")).toBe(true);
  });

  it("backend wires schedule_booking + trip-dates route", () => {
    const schedule = readFileSync(join(root, "../crates/api/src/chain_off/schedule_booking.rs"), "utf8");
    const orders = readFileSync(join(root, "../crates/api/src/chain_off/orders.rs"), "utf8");
    const routes = readFileSync(join(root, "../crates/api/src/routes/orders/mod.rs"), "utf8");
    const guides = readFileSync(join(root, "../crates/api/src/chain_off/guides.rs"), "utf8");
    expect(schedule).toContain("guide_trip_range_conflicts");
    expect(orders).toContain("patch_order_trip_dates_impl");
    expect(orders).toContain("schedule_conflict");
    expect(routes).toContain("/trip-dates");
    expect(guides).toContain("guide_consumer_decision_fields");
    expect(guides).toContain("completedCount");
  });

  it("parseGuideDetailForRoute maps decision stats", () => {
    const src = readFileSync(join(root, "lib/guideDetailRoutePayload.ts"), "utf8");
    expect(src).toContain("completed_count");
    expect(src).toContain("response_sla");
  });
});
