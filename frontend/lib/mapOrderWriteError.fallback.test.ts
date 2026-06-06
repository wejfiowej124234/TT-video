import { describe, expect, it } from "vitest";
import { mapOrderWriteError } from "./mapOrderWriteError";
import { mapOrderWriteErrorTestT } from "./mapOrderWriteError.vitestShared";

const t = mapOrderWriteErrorTestT;

describe("mapOrderWriteError · fallback", () => {
  it("uses default fallback for unknown Error message", () => {
    expect(mapOrderWriteError(new Error("unknown_code"), t)).toBe("order_error_write_generic");
  });

  it("uses opts.fallbackKey when provided", () => {
    expect(mapOrderWriteError(new Error("x"), t, { fallbackKey: "orders_requestFailed" })).toBe("orders_requestFailed");
  });

  it("treats non-Error as empty code → fallback", () => {
    expect(mapOrderWriteError(null, t)).toBe("order_error_write_generic");
    expect(mapOrderWriteError("not an error", t, { fallbackKey: "fb" })).toBe("fb");
  });
});
