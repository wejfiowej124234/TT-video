/**
 * resolveCityHero · WP4 单测（无 UI · 无 Consumer）
 */
import { describe, expect, it, vi } from "vitest";
import { LANDING_AMBIENT_BY_COUNTRY_ZH, landingAmbientImageUrl } from "../landingAmbientByCountry";
import {
  createDefaultCityHeroResolveDeps,
  fallbackKeyForCountryIso,
  resolveCityHero,
  type CityHeroResolveDeps,
} from "./resolveCityHero";

const JP_TS = landingAmbientImageUrl("日本");
const JP_AMBIENT = LANDING_AMBIENT_BY_COUNTRY_ZH["日本"]!;
const TOKYO_CITY_URL = "https://cdn.example/city-hero-tokyo-v1.jpg";

function deps(enabled: boolean, fetchMedia: CityHeroResolveDeps["fetchMedia"]): CityHeroResolveDeps {
  return { isEnabled: () => enabled, fetchMedia };
}

const tokyoInput = {
  countryIso: "JP",
  citySlug: "tokyo",
  countryZh: "日本",
  fallbackKey: "hero_japan",
};

describe("resolveCityHero", () => {
  it("flag=0 returns TS without fetch", async () => {
    const fetchMedia = vi.fn();
    const r = await resolveCityHero(tokyoInput, deps(false, fetchMedia));
    expect(r.source).toBe("ts");
    expect(r.data).toBe(JP_TS);
    expect(r.fallback_used).toBe(false);
    expect(fetchMedia).not.toHaveBeenCalled();
  });

  it("missing citySlug returns TS without fetch", async () => {
    const fetchMedia = vi.fn();
    const r = await resolveCityHero({ ...tokyoInput, citySlug: "" }, deps(true, fetchMedia));
    expect(r.source).toBe("ts");
    expect(fetchMedia).not.toHaveBeenCalled();
  });

  it("step1 city_hero hit returns catalog-api", async () => {
    const fetchMedia = vi.fn().mockResolvedValueOnce({
      status: "ok",
      count: 1,
      items: [
        {
          url: TOKYO_CITY_URL,
          asset_kind: "city_hero",
          asset_key: "city_hero_tokyo",
          city_slug: "tokyo",
        },
      ],
    });
    const r = await resolveCityHero(tokyoInput, deps(true, fetchMedia));
    expect(r.source).toBe("catalog-api");
    expect(r.data).toBe(TOKYO_CITY_URL);
    expect(r.asset_key).toBe("city_hero_tokyo");
    expect(r.fallback_used).toBe(false);
    expect(fetchMedia).toHaveBeenCalledTimes(1);
    expect(fetchMedia).toHaveBeenCalledWith({
      assetKind: "city_hero",
      countryIso: "JP",
      citySlug: "tokyo",
    });
  });

  it("step1 empty step2 landing_ambient returns catalog-api-fallback", async () => {
    const fetchMedia = vi
      .fn()
      .mockResolvedValueOnce({ status: "ok", count: 0, items: [] })
      .mockResolvedValueOnce({
        status: "ok",
        count: 1,
        items: [{ url: JP_AMBIENT, asset_kind: "landing_ambient", country_iso: "JP" }],
      });
    const r = await resolveCityHero(tokyoInput, deps(true, fetchMedia));
    expect(r.source).toBe("catalog-api-fallback");
    expect(r.data).toBe(JP_AMBIENT);
    expect(r.fallback_key).toBe("hero_japan");
    expect(r.fallback_used).toBe(true);
    expect(fetchMedia).toHaveBeenNthCalledWith(2, {
      assetKind: "landing_ambient",
      countryIso: "JP",
    });
  });

  it("step1+2 empty returns TS", async () => {
    const fetchMedia = vi
      .fn()
      .mockResolvedValueOnce({ status: "ok", count: 0, items: [] })
      .mockResolvedValueOnce({ status: "ok", count: 0, items: [] });
    const r = await resolveCityHero(tokyoInput, deps(true, fetchMedia));
    expect(r.source).toBe("ts");
    expect(r.data).toBe(JP_TS);
    expect(r.fallback_used).toBe(false);
  });

  it("step1 reject still tries landing_ambient", async () => {
    const fetchMedia = vi
      .fn()
      .mockRejectedValueOnce(new Error("503"))
      .mockResolvedValueOnce({
        status: "ok",
        count: 1,
        items: [{ url: JP_AMBIENT, asset_kind: "landing_ambient", country_iso: "JP" }],
      });
    const r = await resolveCityHero(tokyoInput, deps(true, fetchMedia));
    expect(r.source).toBe("catalog-api-fallback");
    expect(r.fallback_used).toBe(true);
    expect(fetchMedia).toHaveBeenCalledTimes(2);
  });

  it("fallbackKeyForCountryIso maps JP to hero_japan", () => {
    expect(fallbackKeyForCountryIso("jp")).toBe("hero_japan");
  });

  it("createDefaultCityHeroResolveDeps is wired", () => {
    expect(createDefaultCityHeroResolveDeps().fetchMedia).toBeTypeOf("function");
  });
});
