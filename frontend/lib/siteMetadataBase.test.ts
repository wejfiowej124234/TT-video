import { afterEach, describe, expect, it } from "vitest";
import { getSiteMetadataBase } from "@/lib/siteMetadataBase";

describe("getSiteMetadataBase", () => {
  const key = "NEXT_PUBLIC_SITE_URL";
  const prev = process.env[key];

  afterEach(() => {
    if (prev === undefined) delete process.env[key];
    else process.env[key] = prev;
  });

  it("uses NEXT_PUBLIC_SITE_URL when valid https", () => {
    process.env[key] = "https://travel.example";
    expect(getSiteMetadataBase().origin).toBe("https://travel.example");
  });

  it("uses NEXT_PUBLIC_SITE_URL when valid http", () => {
    process.env[key] = "http://staging.local:3012";
    expect(getSiteMetadataBase().href).toBe("http://staging.local:3012/");
  });

  it("falls back to 127.0.0.1:3012 when unset", () => {
    delete process.env[key];
    expect(getSiteMetadataBase().href).toBe("http://127.0.0.1:3012/");
  });

  it("falls back when value is not a valid URL", () => {
    process.env[key] = "not-a-url";
    expect(getSiteMetadataBase().href).toBe("http://127.0.0.1:3012/");
  });

  it("falls back for non-http(s) scheme", () => {
    process.env[key] = "ftp://example.com";
    expect(getSiteMetadataBase().href).toBe("http://127.0.0.1:3012/");
  });
});
