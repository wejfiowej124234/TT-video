import { describe, expect, it } from "vitest";
import { DEFAULT_SETTLEMENT_CURRENCY_CODE } from "@/lib/defaultSettlementCurrency";
import {
  guideProfileMissingPublicTitle,
  guideProfileSummaryHasContent,
  guideProfileToMarketPreviewDraft,
  guidePublicDetailHref,
} from "./guideWorkbenchProfileSummaryModel";

describe("guideWorkbenchProfileSummaryModel", () => {
  it("public detail href uses guide_id", () => {
    expect(guidePublicDetailHref({ guide_id: "abc-123", city: "Hangzhou" })).toBe("/guides/abc-123");
    expect(guidePublicDetailHref(null)).toBeNull();
  });

  it("detects listing content", () => {
    expect(guideProfileSummaryHasContent({ city: "Hangzhou" })).toBe(true);
    expect(guideProfileSummaryHasContent({})).toBe(false);
  });

  it("guideProfileMissingPublicTitle when city set but public_title blank", () => {
    expect(guideProfileMissingPublicTitle({ city: "Hangzhou", public_title: "" })).toBe(true);
    expect(guideProfileMissingPublicTitle({ city: "Hangzhou", public_title: "西湖向导" })).toBe(false);
    expect(guideProfileMissingPublicTitle({})).toBe(false);
  });

  it("preview draft includes default settlement currency for GuideCard", () => {
    const draft = guideProfileToMarketPreviewDraft({ hourly_rate: "45", city: "Hangzhou" });
    expect(draft.hourly_currency).toBe(DEFAULT_SETTLEMENT_CURRENCY_CODE);
    expect(draft.hourly_rate).toBe("45");
  });
});
