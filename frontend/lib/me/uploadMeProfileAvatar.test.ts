import { describe, expect, it } from "vitest";
import { shouldFallbackToProfileAvatarPresign } from "./uploadMeProfileAvatar";

describe("shouldFallbackToProfileAvatarPresign", () => {
  it("falls back when Official API requires object-storage presign", () => {
    expect(
      shouldFallbackToProfileAvatarPresign(
        new Error("profile_avatar_use_presign_when_object_storage_configured"),
      ),
    ).toBe(true);
    expect(shouldFallbackToProfileAvatarPresign(new Error("avatar_ephemeral_upload_url_forbidden"))).toBe(
      true,
    );
  });

  it("does not swallow unrelated failures", () => {
    expect(shouldFallbackToProfileAvatarPresign(new Error("login_required"))).toBe(false);
    expect(shouldFallbackToProfileAvatarPresign(new Error("file_too_large"))).toBe(false);
  });
});
