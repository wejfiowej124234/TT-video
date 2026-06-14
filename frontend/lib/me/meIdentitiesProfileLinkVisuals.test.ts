import { describe, expect, it } from "vitest";

import {
  meIdentitiesProfileLinkFallbackImage,
  ME_IDENTITIES_PROFILE_LINK_FALLBACK_IMAGES,
  resolveMeIdentitiesProfileLinkThumb,
} from "./meIdentitiesProfileLinkVisuals";

describe("meIdentitiesProfileLinkVisuals", () => {
  it("provides distinct fallback images per surface", () => {
    const ids = ["acquisition", "guide", "merchant", "steward"] as const;
    const urls = ids.map((id) => meIdentitiesProfileLinkFallbackImage(id));
    expect(new Set(urls).size).toBe(4);
    for (const id of ids) {
      expect(meIdentitiesProfileLinkFallbackImage(id)).toBe(ME_IDENTITIES_PROFILE_LINK_FALLBACK_IMAGES[id]);
    }
  });

  it("prefers resolved upload URL over fallback", () => {
    expect(resolveMeIdentitiesProfileLinkThumb("guide", "/api/v1/uploads/demo.jpg")).toContain("/uploads/demo.jpg");
    expect(resolveMeIdentitiesProfileLinkThumb("merchant", "")).toBe(
      ME_IDENTITIES_PROFILE_LINK_FALLBACK_IMAGES.merchant,
    );
  });
});
