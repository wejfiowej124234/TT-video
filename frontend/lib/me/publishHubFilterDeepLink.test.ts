import { describe, expect, it } from "vitest";
import { publishHubFilterFromSearchParams } from "@/lib/me/publishHubModel";

describe("publishHubFilterFromSearchParams", () => {
  it("reads filter query param", () => {
    expect(publishHubFilterFromSearchParams(new URLSearchParams("filter=governance"))).toBe("governance");
  });

  it("reads rail alias", () => {
    expect(publishHubFilterFromSearchParams(new URLSearchParams("rail=merchant"))).toBe("merchant");
  });

  it("returns null for unknown values", () => {
    expect(publishHubFilterFromSearchParams(new URLSearchParams("filter=unknown"))).toBeNull();
  });

  it("returns null for legacy community filter", () => {
    expect(publishHubFilterFromSearchParams(new URLSearchParams("filter=community"))).toBeNull();
  });
});
