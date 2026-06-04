import { describe, expect, it } from "vitest";
import { sortOnboardingQueueItems } from "./sortOnboardingQueueItems";

describe("sortOnboardingQueueItems", () => {
  it("sorts by submitted_at desc", () => {
    const rows = [
      { application: { submitted_at: "2026-01-01T00:00:00Z", status: "a" } },
      { application: { submitted_at: "2026-01-03T00:00:00Z", status: "b" } },
      { application: { submitted_at: "2026-01-02T00:00:00Z", status: "c" } },
    ];
    const out = sortOnboardingQueueItems(rows, "submitted_at", "desc");
    expect(out.map((r) => r.application?.submitted_at)).toEqual([
      "2026-01-03T00:00:00Z",
      "2026-01-02T00:00:00Z",
      "2026-01-01T00:00:00Z",
    ]);
  });
});
