import { describe, it, expect } from "vitest";
import { parseAuthEmailTokenFromDevLogUrl } from "./authEmailDevLogUrl";

describe("parseAuthEmailTokenFromDevLogUrl", () => {
  it("extracts token query param", () => {
    const token = parseAuthEmailTokenFromDevLogUrl(
      "http://localhost:3012/auth/verify-email?token=abc123",
    );
    expect(token).toBe("abc123");
  });

  it("returns null for invalid input", () => {
    expect(parseAuthEmailTokenFromDevLogUrl(null)).toBeNull();
    expect(parseAuthEmailTokenFromDevLogUrl("not-a-url")).toBeNull();
  });
});
