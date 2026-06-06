import { describe, expect, it } from "vitest";
import { guideLicenseUrlHasHttpScheme, GUIDE_LICENSE_URL_MAX_LEN } from "./guideLicenseUrlScheme";

describe("guideLicenseUrlHasHttpScheme", () => {
  it("accepts ASCII case variants of http(s)", () => {
    expect(guideLicenseUrlHasHttpScheme("HTTPS://a/x")).toBe(true);
    expect(guideLicenseUrlHasHttpScheme("HTTP://a/x")).toBe(true);
    expect(guideLicenseUrlHasHttpScheme("https://a/x")).toBe(true);
  });

  it("rejects empty and non-http schemes", () => {
    expect(guideLicenseUrlHasHttpScheme("")).toBe(false);
    expect(guideLicenseUrlHasHttpScheme("   ")).toBe(false);
    expect(guideLicenseUrlHasHttpScheme("ftp://a")).toBe(false);
  });

  it("exports max len aligned with API", () => {
    expect(GUIDE_LICENSE_URL_MAX_LEN).toBe(2048);
  });
});
