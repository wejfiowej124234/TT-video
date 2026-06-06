import { describe, expect, it } from "vitest";
import {
  dataStateEmpty,
  dataStateError,
  dataStateInvalid,
  dataStateLoading,
  dataStateSuccess,
} from "./dataState";

describe("factories", () => {
  it("builds discriminated unions", () => {
    expect(dataStateLoading()).toEqual({ kind: "loading" });
    expect(dataStateEmpty()).toEqual({ kind: "empty" });
    expect(dataStateError("m")).toEqual({ kind: "error", message: "m" });
    expect(dataStateInvalid()).toEqual({ kind: "invalid", message: undefined });
    expect(dataStateInvalid("z")).toEqual({ kind: "invalid", message: "z" });
    expect(dataStateSuccess(3)).toEqual({ kind: "success", value: 3 });
  });
});
