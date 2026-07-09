import { describe, expect, it } from "vitest";
import {
  CN_AMBIENT_COUNTRY_ISO,
  CN_AMBIENT_COUNTRY_ZH,
  auditLandingAmbientCnCountryKeys,
} from "./landingAmbientCnDebug";

describe("landingAmbientCnDebug country keys", () => {
  it("中国 / CN 静态映射与 catalog ISO 一致", () => {
    const rows = auditLandingAmbientCnCountryKeys();
    expect(rows.every((r) => r.matchesCatalogIso)).toBe(true);
    expect(CN_AMBIENT_COUNTRY_ZH).toBe("中国");
    expect(CN_AMBIENT_COUNTRY_ISO).toBe("CN");
  });
});
