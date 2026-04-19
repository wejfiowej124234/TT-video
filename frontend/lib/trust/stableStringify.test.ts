import { describe, expect, it } from "vitest";
import { sha256HexUtf8, stableStringify } from "./stableStringify";

describe("stableStringify", () => {
  it("sorts object keys", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("is stable for nested objects", () => {
    expect(stableStringify({ z: { m: 1, a: 2 }, y: 0 })).toBe('{"y":0,"z":{"a":2,"m":1}}');
  });
});

describe("sha256HexUtf8", () => {
  it("matches known empty hash", async () => {
    const h = await sha256HexUtf8("");
    expect(h).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
});
