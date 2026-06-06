import { describe, expect, it } from "vitest";
import { AMBIENT_BG_HOME } from "@/lib/ambientBackgrounds";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";
import {
  LANDING_AMBIENT_BY_COUNTRY_ZH,
  LANDING_AMBIENT_LANDMARK_ZH,
  landingAmbientImageUrl,
} from "@/lib/landingAmbientByCountry";

describe("landingAmbientByCountry (Phase A)", () => {
  it("maps every product country to a distinct HD unsplash URL", () => {
    for (const { nameZh } of PRODUCT_COUNTRIES) {
      const url = LANDING_AMBIENT_BY_COUNTRY_ZH[nameZh];
      expect(url, `missing ambient for ${nameZh}`).toBeTruthy();
      expect(url).toContain("images.unsplash.com");
      expect(url).toContain("w=3840");
    }
    const urls = PRODUCT_COUNTRIES.map((c) => LANDING_AMBIENT_BY_COUNTRY_ZH[c.nameZh]);
    expect(new Set(urls).size).toBe(PRODUCT_COUNTRIES.length);
  });

  it("defaults to AMBIENT_BG_HOME when country empty or unknown", () => {
    expect(landingAmbientImageUrl("")).toBe(AMBIENT_BG_HOME);
    expect(landingAmbientImageUrl("   ")).toBe(AMBIENT_BG_HOME);
    expect(landingAmbientImageUrl("火星")).toBe(AMBIENT_BG_HOME);
  });

  it("resolves known countries", () => {
    expect(landingAmbientImageUrl("中国")).toBe(LANDING_AMBIENT_BY_COUNTRY_ZH["中国"]);
    expect(landingAmbientImageUrl("日本")).toBe(LANDING_AMBIENT_BY_COUNTRY_ZH["日本"]);
    expect(landingAmbientImageUrl("泰国")).toBe(LANDING_AMBIENT_BY_COUNTRY_ZH["泰国"]);
  });

  it("uses country-accurate hero slugs (landmark regression)", () => {
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["新加坡"]).toContain("1562505415");
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["新加坡"]).not.toContain("1527623629755");
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["新加坡"]).not.toContain("1533050487297");
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["中国"]).toContain("1547150492");
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["日本"]).toContain("1741935505561");
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["韩国"]).toContain("1748835600895");
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["泰国"]).toContain("1534008897995");
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["澳大利亚"]).toContain("1748243262890");
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["澳大利亚"]).not.toContain("1774222057966");
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["阿联酋"]).toContain("1512453979798");
    expect(LANDING_AMBIENT_BY_COUNTRY_ZH["阿联酋"]).not.toContain("1582672060674");
    expect(LANDING_AMBIENT_LANDMARK_ZH["中国"]).toBe("长城·秋色");
    expect(LANDING_AMBIENT_LANDMARK_ZH["日本"]).toBe("富士山·河口湖");
    expect(LANDING_AMBIENT_LANDMARK_ZH["韩国"]).toBe("景福宫·秋意");
    expect(LANDING_AMBIENT_LANDMARK_ZH["泰国"]).toBe("玛雅湾·皮皮岛");
    expect(LANDING_AMBIENT_LANDMARK_ZH["澳大利亚"]).toBe("悉尼歌剧院·晴日");
    for (const { nameZh } of PRODUCT_COUNTRIES) {
      expect(LANDING_AMBIENT_LANDMARK_ZH[nameZh as keyof typeof LANDING_AMBIENT_LANDMARK_ZH]).toBeTruthy();
    }
  });

  it("requests HD hero dimensions in URL params", () => {
    for (const url of Object.values(LANDING_AMBIENT_BY_COUNTRY_ZH)) {
      expect(url).toContain("w=3840");
      expect(url).toContain("h=2160");
      expect(url).toContain("q=92");
    }
  });
});
