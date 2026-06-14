import { describe, expect, it } from "vitest";
import { merchantProfileFormSnapshot } from "@/lib/provider/merchantProfileFormSnapshot";

describe("merchantProfileFormSnapshot", () => {
  it("detects trim-normalized dirty state", () => {
    const base = {
      shopName: "演示店",
      city: "杭州",
      countryCode: "CN",
      categories: "travel",
      bio: "bio",
      avatarUrl: "",
      coverUrl: "",
    };
    const snap = merchantProfileFormSnapshot(base);
    expect(merchantProfileFormSnapshot({ ...base, shopName: " 演示店 " })).toBe(snap);
    expect(merchantProfileFormSnapshot({ ...base, bio: "bio2" })).not.toBe(snap);
  });
});
