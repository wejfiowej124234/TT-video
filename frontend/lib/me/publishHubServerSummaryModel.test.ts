import { describe, expect, it } from "vitest";
import {
  isPublishHubServerSummaryApiPayload,
  isPublishHubServerSummaryBffAggregatePayload,
  parsePublishHubServerSummaryPayload,
} from "@/lib/me/publishHubServerSummaryModel";

describe("publishHubServerSummaryModel", () => {
  it("parses ok envelope counts", () => {
    expect(
      parsePublishHubServerSummaryPayload({
        status: "ok",
        counts: {
          trip: 2,
          guide: 1,
          merchantPublished: 1,
          merchantDrafts: 0,
          acquisitionPublished: 0,
          acquisitionDrafts: 1,
          governance: 3,
        },
      }),
    ).toEqual({
      trip: 2,
      guide: 1,
      merchantPublished: 1,
      merchantDrafts: 0,
      acquisitionPublished: 0,
      acquisitionDrafts: 1,
      governance: 3,
    });
  });

  it("returns null for error envelope", () => {
    expect(parsePublishHubServerSummaryPayload({ status: "error" })).toBeNull();
  });

  it("detects api vs bff meta (W1-A4)", () => {
    expect(
      isPublishHubServerSummaryApiPayload({
        status: "ok",
        counts: {},
        meta: { implementation_status: "me_publish_summary_api_v1" },
      }),
    ).toBe(true);
    expect(
      isPublishHubServerSummaryBffAggregatePayload({
        status: "ok",
        counts: {},
        meta: { implementation_status: "me_publish_summary_bff_v1", source: "next-bff-aggregate" },
      }),
    ).toBe(true);
  });
});
