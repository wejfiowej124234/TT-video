import { describe, expect, it } from "vitest";
import type { OrderListItem } from "@/lib/apiClient";
import {
  orderBusinessLineFromApi,
  formatOrderListTitle,
  formatOrderIdShort,
  formatOrderAmountLine,
} from "./communityMeOrdersDrawerModel";

const t = (k: string) => (k === "order_defaultSettlementToken" ? "USDC" : k);

describe("orderBusinessLineFromApi", () => {
  it("maps trip", () => {
    expect(orderBusinessLineFromApi({ id: "1", business_line: "trip" } as OrderListItem)).toBe("trip");
  });

  it("maps merchant_service", () => {
    expect(orderBusinessLineFromApi({ id: "1", business_line: "merchant_service" } as OrderListItem)).toBe(
      "merchant_service"
    );
  });

  it("maps acquisition", () => {
    expect(orderBusinessLineFromApi({ id: "1", business_line: "acquisition" } as OrderListItem)).toBe("acquisition");
  });

  it("is case-insensitive", () => {
    expect(orderBusinessLineFromApi({ id: "1", business_line: "TRIP" } as OrderListItem)).toBe("trip");
  });

  it("fail-closed to merchant_service when missing or invalid", () => {
    expect(orderBusinessLineFromApi({ id: "1" } as OrderListItem)).toBe("merchant_service");
    expect(orderBusinessLineFromApi({ id: "1", business_line: "hotel" } as OrderListItem)).toBe("merchant_service");
  });
});

describe("formatters", () => {
  it("formatOrderListTitle prefers destination", () => {
    expect(formatOrderListTitle({ destination: " 巴黎 " } as OrderListItem)).toBe("巴黎");
  });

  it("formatOrderIdShort truncates long ids", () => {
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(formatOrderIdShort(id)).toMatch(/^aaaaaaaa…/);
  });

  it("formatOrderAmountLine uses default currency token", () => {
    expect(formatOrderAmountLine({ amount: "12.5" } as OrderListItem, t)).toBe("12.5 USDC");
  });
});
