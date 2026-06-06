import { describe, expect, it } from "vitest";

import { formatOnboardingQuoteExpiresAtUtc } from "./meOnboardingPageHelpers";

describe("formatOnboardingQuoteExpiresAtUtc", () => {
  it("formats ISO timestamps in fixed UTC (SSR/CSR stable)", () => {
    expect(formatOnboardingQuoteExpiresAtUtc("2026-05-27T12:34:56.000Z")).toBe(
      "2026/05/27 12:34:56 UTC",
    );
  });

  it("returns raw string when ISO is invalid", () => {
    expect(formatOnboardingQuoteExpiresAtUtc("not-a-date")).toBe("not-a-date");
  });
});
