import { describe, expect, it } from "vitest";
import { userFromGetMePayload } from "./meTrust";

describe("userFromGetMePayload", () => {
  it("returns user from nested shape", () => {
    expect(
      userFromGetMePayload({
        status: "ok",
        user: { id: "550e8400-e29b-41d4-a716-446655440000", nickname: "A" },
      })?.id
    ).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("returns null for anonymous or flat wrong shape", () => {
    expect(userFromGetMePayload({ user: { id: "anonymous" } })).toBeNull();
    expect(userFromGetMePayload({ id: "x", nickname: "flat" } as { id: string; nickname: string })).toBeNull();
  });
});
