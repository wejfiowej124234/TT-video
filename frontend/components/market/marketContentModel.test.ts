import { describe, expect, it } from "vitest";
import { resolveMarketOrderForDetail } from "./marketContentModel";
import { findMarketDevVarietyOrderById } from "@/lib/marketDevVarietyOrders";

describe("resolveMarketOrderForDetail", () => {
  it("resolves dev variety 5-day card not present in raw orders array", () => {
    const apiOnly = [{ id: "api-1", destination: "Test", days: 1 }];
    const id = "00000000-0000-4000-8000-000000000005";
    const resolved = resolveMarketOrderForDetail(apiOnly, id);
    expect(resolved?.days).toBe(5);
    expect(findMarketDevVarietyOrderById(id)?.highlights?.[0]).toContain("五日");
  });
});
