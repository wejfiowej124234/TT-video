import { describe, expect, it } from "vitest";
import { sortRowsByKey } from "./useAdminTableSort";

describe("sortRowsByKey", () => {
  it("sorts numbers desc by default key", () => {
    const rows = [{ n: 3 }, { n: 1 }, { n: 2 }];
    const out = sortRowsByKey(rows, "n", "desc", (r) => r.n);
    expect(out.map((r) => r.n)).toEqual([3, 2, 1]);
  });

  it("sorts ISO dates asc", () => {
    const rows = [
      { at: "2026-01-03T00:00:00Z" },
      { at: "2026-01-01T00:00:00Z" },
      { at: "2026-01-02T00:00:00Z" },
    ];
    const out = sortRowsByKey(rows, "at", "asc", (r) => r.at);
    expect(out[0].at).toBe("2026-01-01T00:00:00Z");
    expect(out[2].at).toBe("2026-01-03T00:00:00Z");
  });
});
