import { describe, it, expect } from "vitest";
import { isDraftOrderListState } from "./isDraftOrderListState";

describe("isDraftOrderListState", () => {
  it("treats draft and open as draft-like (B-044)", () => {
    expect(isDraftOrderListState("draft")).toBe(true);
    expect(isDraftOrderListState("DRAFT")).toBe(true);
    expect(isDraftOrderListState("open")).toBe(true);
    expect(isDraftOrderListState("created")).toBe(false);
    expect(isDraftOrderListState("accepted")).toBe(false);
  });
});
