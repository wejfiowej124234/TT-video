import { describe, it, expect } from "vitest";
import { isUuidString } from "./isUuidString";

describe("isUuidString", () => {
  it("accepts standard lowercase UUID", () => {
    expect(isUuidString("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")).toBe(true);
  });
  it("accepts uppercase", () => {
    expect(isUuidString("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11")).toBe(true);
  });
  it("rejects local placeholder ids", () => {
    expect(isUuidString("post-local-123")).toBe(false);
  });
  it("rejects empty", () => {
    expect(isUuidString("")).toBe(false);
  });
});
