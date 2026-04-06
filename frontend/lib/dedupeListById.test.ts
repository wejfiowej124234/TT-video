import { describe, it, expect } from "vitest";
import { dedupeListById, mergeListsUniqueById } from "./dedupeListById";

describe("dedupeListById", () => {
  it("keeps first occurrence per id", () => {
    const rows = [{ id: "a", n: 1 }, { id: "b", n: 2 }, { id: "a", n: 3 }];
    expect(dedupeListById(rows, (r) => r.id)).toEqual([
      { id: "a", n: 1 },
      { id: "b", n: 2 },
    ]);
  });

  it("stringifies id", () => {
    expect(dedupeListById([{ id: 1 }, { id: 1 }], (r) => String(r.id))).toEqual([{ id: 1 }]);
  });

  it("passes through items with empty id", () => {
    expect(dedupeListById([{ id: "" }, { id: "" }], (r) => r.id)).toEqual([{ id: "" }, { id: "" }]);
  });
});

describe("mergeListsUniqueById", () => {
  it("appends only new ids", () => {
    const prev = [{ id: "a" }, { id: "b" }];
    const next = [{ id: "b" }, { id: "c" }];
    expect(mergeListsUniqueById(prev, next, (r) => r.id)).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
  });
});
