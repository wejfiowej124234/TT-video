import { describe, expect, it } from "vitest";
import { formatVacancyUsdcAtomic } from "./vacancyLedgerTransparencyModel";

describe("vacancyLedgerTransparencyModel", () => {
  it("formats atomic USDC without recomputing reserve", () => {
    expect(formatVacancyUsdcAtomic("495000")).toBe("0.495");
    expect(formatVacancyUsdcAtomic("1000000")).toBe("1");
    expect(formatVacancyUsdcAtomic("0")).toBe("0");
  });
});
