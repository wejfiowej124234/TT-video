import { describe, expect, it } from "vitest";
import {
  filterOrdersForMerchantSellerService,
  merchantOrdersInProgressHref,
  orderMatchesMerchantSellerService,
  parseMerchantOrdersListHat,
} from "./merchantOrderCorridorModel";

describe("merchantOrderCorridorModel", () => {
  it("parses hat=merchant", () => {
    expect(parseMerchantOrdersListHat("merchant")).toBe("merchant");
    expect(parseMerchantOrdersListHat("guide")).toBeNull();
  });

  it("filters merchant_service business line", () => {
    const trip = { id: "1", business_line: "trip" };
    const svc = { id: "2", business_line: "merchant_service" };
    expect(orderMatchesMerchantSellerService(svc as never)).toBe(true);
    expect(orderMatchesMerchantSellerService(trip as never)).toBe(false);
    expect(filterOrdersForMerchantSellerService([trip, svc] as never)).toHaveLength(1);
  });

  it("builds in-progress href with hat", () => {
    expect(merchantOrdersInProgressHref()).toBe("/orders?hat=merchant&state=in_progress");
  });
});
