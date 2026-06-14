import { describe, expect, it } from "vitest";
import {
  countStewardTodoActiveProposals,
  countStewardTodoClaim,
  countStewardTodoDelegate,
  formatStewardTodoBadgeValue,
  mergeStewardWorkbenchTodoCounts,
} from "./stewardWorkbenchTodoModel";

describe("stewardWorkbenchTodoModel (① · API honest counts)", () => {
  it("counts active and pending proposals only", () => {
    expect(
      countStewardTodoActiveProposals([
        { status: "active" },
        { status: "pending" },
        { status: "executed" },
        { status: "draft" },
      ]),
    ).toBe(2);
  });

  it("maps delegate and claim counts honestly", () => {
    expect(countStewardTodoDelegate(null)).toBe(0);
    expect(countStewardTodoDelegate("00000000-0000-4000-8000-000000000001")).toBe(1);
    expect(countStewardTodoClaim({ status: "ok", items: [{ amount: 1 }, { amount: 2 }] })).toBe(2);
  });

  it("merges todo counts for badges", () => {
    expect(
      mergeStewardWorkbenchTodoCounts({
        proposalItems: [{ status: "active" }],
        delegateTo: null,
        rewards: { status: "ok", items: [{ amount: 1 }] },
      }),
    ).toEqual({ proposals: 1, delegate: 0, claim: 1 });
  });

  it("formats badge values with loading ellipsis", () => {
    expect(formatStewardTodoBadgeValue(null, true)).toBe("…");
    expect(formatStewardTodoBadgeValue(3, false)).toBe("3");
  });
});
