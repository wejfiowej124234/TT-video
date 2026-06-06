import { describe, expect, it } from "vitest";
import { deriveAuthGateDataState, deriveListDataState } from "./dataState";

describe("deriveListDataState", () => {
  it("prioritizes invalid over loading and error", () => {
    expect(
      deriveListDataState({
        invalid: true,
        invalidMessage: "bad",
        loading: true,
        error: "e",
        items: [1],
      }).kind
    ).toBe("invalid");
  });

  it("uses loading when not invalid", () => {
    expect(deriveListDataState({ loading: true, error: null, items: [] }).kind).toBe("loading");
  });

  it("uses error when loaded with message", () => {
    const s = deriveListDataState({ loading: false, error: "x", items: [1] });
    expect(s.kind).toBe("error");
    if (s.kind === "error") expect(s.message).toBe("x");
  });

  it("uses empty when no error and no items", () => {
    expect(deriveListDataState({ loading: false, error: null, items: [] }).kind).toBe("empty");
  });

  it("uses success when items exist", () => {
    const s = deriveListDataState({ loading: false, error: null, items: ["a"] });
    expect(s.kind).toBe("success");
    if (s.kind === "success") expect(s.value).toEqual(["a"]);
  });
});

describe("deriveAuthGateDataState", () => {
  it("loading while auth pending", () => {
    expect(deriveAuthGateDataState(true, false).kind).toBe("loading");
    expect(deriveAuthGateDataState(true, true).kind).toBe("loading");
  });

  it("invalid guest when resolved", () => {
    expect(deriveAuthGateDataState(false, false).kind).toBe("invalid");
  });

  it("success when logged in", () => {
    expect(deriveAuthGateDataState(false, true).kind).toBe("success");
  });
});
