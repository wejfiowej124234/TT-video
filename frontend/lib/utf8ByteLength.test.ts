import { describe, expect, it } from "vitest";
import { utf8ByteLength } from "./utf8ByteLength";

describe("utf8ByteLength", () => {
  it("matches UTF-8 byte count (Rust str::len semantics)", () => {
    expect(utf8ByteLength("")).toBe(0);
    expect(utf8ByteLength("abc")).toBe(3);
    expect(utf8ByteLength("中")).toBe(3);
    expect(utf8ByteLength("😀")).toBe(4);
  });
});
