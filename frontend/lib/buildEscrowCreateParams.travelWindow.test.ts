import { describe, expect, it } from "vitest";
import type { OrderRow } from "@/components/escrow/EscrowDetail/types";
import { buildEscrowCreateParams } from "./buildEscrowCreateParams";
import { baseOrder, buildEscrowCreateParamsTestBase } from "./buildEscrowCreateParams.vitestShared";

describe("buildEscrowCreateParams · travel window / days parsing", () => {
  const base = buildEscrowCreateParamsTestBase();

  it("defaults travel span to 1 day when days is 0 or negative", () => {
    const startTs = Math.floor(new Date("2026-06-01T00:00:00.000Z").getTime() / 1000);
    for (const days of [0, -3]) {
      const r = buildEscrowCreateParams({
        ...base,
        order: baseOrder({ travel_date: "2026-06-01", days }),
      });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(Number(r.params.serviceStart)).toBe(startTs);
      expect(Number(r.params.serviceEnd)).toBe(startTs + 86_400);
    }
  });

  it("accepts days as numeric string (API JSON shape)", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: { ...baseOrder(), travel_date: "2026-06-01", days: "5" } as OrderRow,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const startTs = Math.floor(new Date("2026-06-01T00:00:00.000Z").getTime() / 1000);
    expect(Number(r.params.serviceStart)).toBe(startTs);
    expect(Number(r.params.serviceEnd)).toBe(startTs + 5 * 86_400);
  });

  it("ignores non-integer days strings and falls back to 1 day", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: { ...baseOrder(), travel_date: "2026-06-01", days: "3.5" } as OrderRow,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Number(r.params.serviceEnd - r.params.serviceStart)).toBe(86_400);
  });
});
