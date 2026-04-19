import { describe, expect, it } from "vitest";
import { safeInternalReturnPath } from "./safeInternalReturnPath";

describe("safeInternalReturnPath", () => {
  it("allows simple absolute path", () => {
    expect(safeInternalReturnPath("/orders", "/community/me")).toBe("/orders");
  });

  it("prefixes path without leading slash", () => {
    expect(safeInternalReturnPath("orders", "/community/me")).toBe("/orders");
  });

  it("falls back on empty", () => {
    expect(safeInternalReturnPath("", "/community/me")).toBe("/community/me");
    expect(safeInternalReturnPath("   ", "/community/me")).toBe("/community/me");
    expect(safeInternalReturnPath(null, "/community/me")).toBe("/community/me");
    expect(safeInternalReturnPath(undefined, "/community/me")).toBe("/community/me");
  });

  it("rejects protocol-relative URL", () => {
    expect(safeInternalReturnPath("//evil.example/phish", "/community/me")).toBe("/community/me");
  });

  it("rejects absolute URL with scheme", () => {
    expect(safeInternalReturnPath("https://evil.example/", "/community/me")).toBe("/community/me");
    expect(safeInternalReturnPath("http://evil.example/", "/community/me")).toBe("/community/me");
  });

  it("rejects backslash tricks", () => {
    expect(safeInternalReturnPath("/\\evil.example", "/community/me")).toBe("/community/me");
    expect(safeInternalReturnPath("\\/evil", "/community/me")).toBe("/community/me");
  });
});
