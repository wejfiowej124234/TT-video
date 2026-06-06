import { describe, expect, it } from "vitest";
import { buildEscrowCreateParams } from "./buildEscrowCreateParams";
import { baseOrder, buildEscrowCreateParamsTestBase } from "./buildEscrowCreateParams.vitestShared";

describe("buildEscrowCreateParams · validation", () => {
  const base = buildEscrowCreateParamsTestBase();

  it("returns invalid_order_id when id is not a UUID bytes32 source", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: baseOrder({ id: "not-a-valid-uuid" }),
    });
    expect(r).toEqual({ ok: false, code: "invalid_order_id" });
  });

  it("returns missing_snapshot when snapshot is empty", () => {
    const r = buildEscrowCreateParams({
      ...base,
      order: baseOrder(),
      snapshotHash: "   ",
    });
    expect(r).toEqual({ ok: false, code: "missing_snapshot" });
  });

  it("returns invalid_snapshot when not 32-byte hex", () => {
    expect(
      buildEscrowCreateParams({
        ...base,
        order: baseOrder(),
        snapshotHash: "0x00",
      })
    ).toEqual({ ok: false, code: "invalid_snapshot" });
    expect(
      buildEscrowCreateParams({
        ...base,
        order: baseOrder(),
        snapshotHash: `0x${"00".repeat(31)}`,
      })
    ).toEqual({ ok: false, code: "invalid_snapshot" });
  });

  it("returns missing_order_amount when amount missing or invalid", () => {
    expect(
      buildEscrowCreateParams({
        ...base,
        order: baseOrder({ amount: undefined }),
      })
    ).toEqual({ ok: false, code: "missing_order_amount" });
    expect(
      buildEscrowCreateParams({
        ...base,
        order: baseOrder({ amount: "" }),
      })
    ).toEqual({ ok: false, code: "missing_order_amount" });
    expect(
      buildEscrowCreateParams({
        ...base,
        order: baseOrder({ amount: "xx" }),
      })
    ).toEqual({ ok: false, code: "missing_order_amount" });
  });

  it("returns missing_traveler / guide / token / arbitrator when empty", () => {
    expect(
      buildEscrowCreateParams({ ...base, order: baseOrder(), traveler: "" as `0x${string}` })
    ).toEqual({ ok: false, code: "missing_traveler" });
    expect(
      buildEscrowCreateParams({ ...base, order: baseOrder(), guide: "" as `0x${string}` })
    ).toEqual({ ok: false, code: "missing_guide" });
    expect(
      buildEscrowCreateParams({ ...base, order: baseOrder(), token: "" as `0x${string}` })
    ).toEqual({ ok: false, code: "missing_token" });
    expect(
      buildEscrowCreateParams({ ...base, order: baseOrder(), arbitrator: "" as `0x${string}` })
    ).toEqual({ ok: false, code: "missing_arbitrator" });
  });
});
