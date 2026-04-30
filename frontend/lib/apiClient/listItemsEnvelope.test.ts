import { describe, expect, it } from "vitest";
import {
  assertApiListArrayWhenEnvelopeOk,
  requireApiItemsArrayAfterOk,
  TRAVELTRUST_API_LIST_ITEMS_CONTRACT_INVALID,
} from "./listItemsEnvelope";

describe("requireApiItemsArrayAfterOk", () => {
  it("returns items array", () => {
    expect(requireApiItemsArrayAfterOk({ status: "ok", items: [1, 2] })).toEqual([1, 2]);
  });

  it("allows empty items", () => {
    expect(requireApiItemsArrayAfterOk({ status: "ok", items: [] })).toEqual([]);
  });

  it("throws when items missing", () => {
    expect(() => requireApiItemsArrayAfterOk({ status: "ok" })).toThrow(TRAVELTRUST_API_LIST_ITEMS_CONTRACT_INVALID);
  });

  it("throws when items not array", () => {
    expect(() => requireApiItemsArrayAfterOk({ status: "ok", items: {} })).toThrow(
      TRAVELTRUST_API_LIST_ITEMS_CONTRACT_INVALID,
    );
  });
});

describe("assertApiListArrayWhenEnvelopeOk", () => {
  it("requires field when status ok", () => {
    expect(() => assertApiListArrayWhenEnvelopeOk({ status: "ok" }, "posts")).toThrow(
      TRAVELTRUST_API_LIST_ITEMS_CONTRACT_INVALID,
    );
  });

  it("allows degraded without posts", () => {
    expect(() => assertApiListArrayWhenEnvelopeOk({ status: "degraded", reason: "x" }, "posts")).not.toThrow();
  });

  it("allows ok with empty array", () => {
    expect(() => assertApiListArrayWhenEnvelopeOk({ status: "ok", posts: [] }, "posts")).not.toThrow();
  });
});
