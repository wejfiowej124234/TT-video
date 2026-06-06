import { describe, expect, it } from "vitest";
import { mapApiReadError } from "./mapApiReadError";

const t = (k: string) => k;

describe("mapApiReadError · compliance & fallback", () => {
  it("returns raw message for compliance errors (403 substring)", () => {
    expect(mapApiReadError(new Error("HTTP 403 blocked"), t, "fb")).toBe("HTTP 403 blocked");
  });

  it("returns raw message for compliance errors (风控/合规 copy)", () => {
    expect(mapApiReadError(new Error("因合规限制无法展示"), t, "fb")).toBe("因合规限制无法展示");
  });

  it("uses fallbackKey for compliance-looking non-Error values", () => {
    expect(mapApiReadError("403 string", t, "my_fallback")).toBe("my_fallback");
  });

  it("uses fallbackKey for unknown errors", () => {
    expect(mapApiReadError(new Error("totally_unknown"), t, "orders_requestFailed")).toBe("orders_requestFailed");
  });
});
