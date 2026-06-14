import { describe, expect, it } from "vitest";

import {
  jurisdictionIdToBytes2,
  stakeJurisdictionCountryCode,
  tryJurisdictionIdToBytes2,
} from "./jurisdictionBytes2";

describe("jurisdictionBytes2", () => {
  it("maps CN to bytes2", () => {
    expect(stakeJurisdictionCountryCode("CN")).toBe("CN");
    expect(jurisdictionIdToBytes2("cn")).toBe("0x434e");
  });

  it("maps CN-ZJ subdivision to CN", () => {
    expect(stakeJurisdictionCountryCode("CN-ZJ")).toBe("CN");
    expect(jurisdictionIdToBytes2("CN-ZJ")).toBe("0x434e");
  });

  it("rejects unknown jurisdictions", () => {
    expect(stakeJurisdictionCountryCode("XX")).toBeNull();
    expect(tryJurisdictionIdToBytes2("XX")).toBeNull();
    expect(() => jurisdictionIdToBytes2("CHN")).toThrow("invalid_jurisdiction");
  });
});
