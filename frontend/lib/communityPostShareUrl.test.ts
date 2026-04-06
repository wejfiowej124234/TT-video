import { describe, expect, it } from "vitest";
import { buildCommunityPostShareUrl } from "./communityPostShareUrl";

describe("buildCommunityPostShareUrl", () => {
  it("encodes post id in query", () => {
    expect(buildCommunityPostShareUrl("https://app.example", "abc-123")).toBe(
      "https://app.example/community?post=abc-123",
    );
  });

  it("trims post id and strips trailing slash on origin", () => {
    expect(buildCommunityPostShareUrl("http://localhost:3012/", "  uuid-here  ")).toBe(
      "http://localhost:3012/community?post=uuid-here",
    );
  });

  it("returns bare /community when id empty", () => {
    expect(buildCommunityPostShareUrl("https://x.test", "  ")).toBe("https://x.test/community");
  });
});
