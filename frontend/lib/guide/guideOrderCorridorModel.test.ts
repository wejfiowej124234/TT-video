import { describe, expect, it } from "vitest";
import type { OrderListItem } from "@/lib/apiClient";
import {
  buildGuideWorkbenchInboxSnapshot,
} from "./guideWorkbenchInboxModel";
import {
  filterOrdersForGuideReception,
  guideOrdersInProgressHref,
  orderMatchesGuideReception,
  parseOrdersListHat,
} from "./guideOrderCorridorModel";

function item(partial: Partial<OrderListItem> & { id: string }): OrderListItem {
  return { ...partial } as OrderListItem;
}

const MY_GUIDE_ROW = "550e8400-e29b-41d4-a716-446655440000";

describe("guideOrderCorridorModel", () => {
  it("parseOrdersListHat accepts guide only", () => {
    expect(parseOrdersListHat("guide")).toBe("guide");
    expect(parseOrdersListHat("traveler")).toBeNull();
    expect(parseOrdersListHat(null)).toBeNull();
  });

  it("orderMatchesGuideReception requires matching guide_id on trip line", () => {
    expect(
      orderMatchesGuideReception(
        item({ id: "1", guide_id: MY_GUIDE_ROW, business_line: "trip" }),
        MY_GUIDE_ROW,
      ),
    ).toBe(true);
    expect(
      orderMatchesGuideReception(
        item({ id: "2", guide_id: "other-guide", business_line: "trip" }),
        MY_GUIDE_ROW,
      ),
    ).toBe(false);
    expect(
      orderMatchesGuideReception(item({ id: "3", business_line: "trip" }), MY_GUIDE_ROW),
    ).toBe(false);
    expect(
      orderMatchesGuideReception(
        item({ id: "4", guide_id: MY_GUIDE_ROW, business_line: "merchant_service" }),
        MY_GUIDE_ROW,
      ),
    ).toBe(false);
  });

  it("filterOrdersForGuideReception drops tourist-only multi-identity orders", () => {
    const rows = [
      item({ id: "tourist", state: "created", guide_id: undefined, business_line: "trip" }),
      item({
        id: "reception",
        state: "created",
        guide_id: MY_GUIDE_ROW,
        business_line: "trip",
        traveler_nickname: "Alice",
      }),
    ];
    const filtered = filterOrdersForGuideReception(rows, MY_GUIDE_ROW);
    expect(filtered.map((r) => r.id)).toEqual(["reception"]);
  });

  it("guideOrdersInProgressHref uses hat=guide", () => {
    expect(guideOrdersInProgressHref()).toBe("/orders?hat=guide&state=in_progress");
  });

  it("buildGuideWorkbenchInboxSnapshot uses guide_id SSOT", () => {
    const snap = buildGuideWorkbenchInboxSnapshot(
      [
        item({
          id: "skip-tourist",
          state: "created",
          business_line: "trip",
          created_at: "2026-06-09T06:00:00Z",
        }),
        item({
          id: "accept-me",
          state: "created",
          guide_id: MY_GUIDE_ROW,
          business_line: "trip",
          created_at: "2026-06-09T07:00:00Z",
          traveler_nickname: "Bob",
        }),
        item({
          id: "other-guide",
          state: "created",
          guide_id: "other",
          business_line: "trip",
          created_at: "2026-06-09T08:00:00Z",
        }),
      ],
      MY_GUIDE_ROW,
      new Date("2026-06-09T12:00:00Z"),
    );
    expect(snap.pendingAcceptCount).toBe(1);
    expect(snap.nextOrder?.id).toBe("accept-me");
  });

  it("buildGuideWorkbenchInboxSnapshot is empty without guideRowId", () => {
    const snap = buildGuideWorkbenchInboxSnapshot(
      [item({ id: "a", state: "created", guide_id: MY_GUIDE_ROW })],
      null,
    );
    expect(snap.pendingAcceptCount).toBe(0);
    expect(snap.nextOrder).toBeNull();
  });
});
