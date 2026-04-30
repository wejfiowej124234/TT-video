import { describe, expect, it } from "vitest";
import { applyLocalePlaceholders } from "./i18n";

describe("applyLocalePlaceholders", () => {
  it("leaves template unchanged when vars empty or omitted", () => {
    expect(applyLocalePlaceholders("a {{x}} b", undefined)).toBe("a {{x}} b");
    expect(applyLocalePlaceholders("a {{x}} b", {})).toBe("a {{x}} b");
  });

  it("replaces known keys and drops missing keys to empty", () => {
    expect(applyLocalePlaceholders("x={{reason}}", { reason: "db_down" })).toBe("x=db_down");
    expect(applyLocalePlaceholders("{{a}}-{{b}}", { a: "1" })).toBe("1-");
  });

  it("coerces number and boolean", () => {
    expect(applyLocalePlaceholders("n={{count}}", { count: 3 })).toBe("n=3");
    expect(applyLocalePlaceholders("b={{ok}}", { ok: true })).toBe("b=true");
  });

  it("ignores non-placeholder curly segments", () => {
    expect(applyLocalePlaceholders("{not}", { not: "x" })).toBe("{not}");
  });
});
