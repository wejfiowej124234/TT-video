import { describe, expect, it } from "vitest";
import { applyPinOrder } from "./communityMeNotesPinOrder";

describe("applyPinOrder", () => {
  it("moves pinned ids to the front in pin order", () => {
    const items = [
      { id: "a", n: 1 },
      { id: "b", n: 2 },
      { id: "c", n: 3 },
    ];
    expect(applyPinOrder(items, (x) => x.id, ["c", "a"]).map((x) => x.id)).toEqual(["c", "a", "b"]);
  });

  it("ignores unknown pin ids", () => {
    const items = [{ id: "x" }];
    expect(applyPinOrder(items, (x) => x.id, ["z", "x"]).map((x) => x.id)).toEqual(["x"]);
  });
});
