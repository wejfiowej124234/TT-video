import { describe, expect, it } from "vitest";
import { safeInternalReturnPath } from "./safeInternalReturnPath";

describe("safeInternalReturnPath", () => {
  it("allows simple absolute path", () => {
    expect(safeInternalReturnPath("/orders", "/me")).toBe("/orders");
  });

  it("prefixes path without leading slash", () => {
    expect(safeInternalReturnPath("orders", "/me")).toBe("/orders");
  });

  it("falls back on empty", () => {
    expect(safeInternalReturnPath("", "/me")).toBe("/me");
    expect(safeInternalReturnPath("   ", "/me")).toBe("/me");
    expect(safeInternalReturnPath(null, "/me")).toBe("/me");
    expect(safeInternalReturnPath(undefined, "/me")).toBe("/me");
  });

  it("rejects protocol-relative URL", () => {
    expect(safeInternalReturnPath("//evil.example/phish", "/me")).toBe("/me");
  });

  it("rejects absolute URL with scheme", () => {
    expect(safeInternalReturnPath("https://evil.example/", "/me")).toBe("/me");
    expect(safeInternalReturnPath("http://evil.example/", "/me")).toBe("/me");
  });

  it("rejects backslash tricks", () => {
    expect(safeInternalReturnPath("/\\evil.example", "/me")).toBe("/me");
    expect(safeInternalReturnPath("\\/evil", "/me")).toBe("/me");
  });
});
