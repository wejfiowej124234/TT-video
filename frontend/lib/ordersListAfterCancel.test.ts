import { describe, it, expect } from "vitest";
import { patchOrderListAfterCancelSuccess, patchPreviewOrderAfterCancelSuccess } from "./ordersListAfterCancel";

describe("ordersListAfterCancel (B-047)", () => {
  it("patchOrderListAfterCancelSuccess updates matching row status/state from API order", () => {
    const prev = [
      { id: "a", destination: "X", amount: "1", status: "created", state: "created" },
      { id: "b", destination: "Y", amount: "2", status: "draft", state: "draft" },
    ];
    const next = patchOrderListAfterCancelSuccess(prev, "a", { status: "cancelled" });
    expect(next[0]).toMatchObject({ id: "a", status: "cancelled", state: "cancelled" });
    expect(next[1]).toBe(prev[1]);
  });

  it("patchOrderListAfterCancelSuccess defaults to cancelled when API omits fields", () => {
    const prev = [{ id: "a", status: "created", state: "created" }];
    const next = patchOrderListAfterCancelSuccess(prev, "a", {});
    expect(next[0]).toMatchObject({ status: "cancelled", state: "cancelled" });
  });

  it("patchPreviewOrderAfterCancelSuccess only touches same id", () => {
    const po = { id: "a", status: "created", state: "created" };
    expect(patchPreviewOrderAfterCancelSuccess(po, "a", { status: "cancelled" })).toMatchObject({
      status: "cancelled",
      state: "cancelled",
    });
    expect(patchPreviewOrderAfterCancelSuccess(po, "b", { status: "cancelled" })).toBe(po);
  });
});
