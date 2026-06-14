/**
 * resolveLandingAmbientUrl · W1 单测（无 UI）
 */
import { describe, expect, it, vi } from "vitest";
import { LANDING_AMBIENT_BY_COUNTRY_ZH, landingAmbientImageUrl } from "../landingAmbientByCountry";
import {
  createDefaultLandingAmbientResolveDeps,
  resolveLandingAmbientUrl,
  type LandingAmbientResolveDeps,
} from "./resolveLandingAmbient";

const CN_TS = landingAmbientImageUrl("中国");
const CN_API = LANDING_AMBIENT_BY_COUNTRY_ZH["中国"]!;

function deps(enabled: boolean, fetchMedia: LandingAmbientResolveDeps["fetchMedia"]): LandingAmbientResolveDeps {
  return { isEnabled: () => enabled, fetchMedia };
}

describe("resolveLandingAmbientUrl", () => {
  it("flag=0 returns TS without fetch", async () => {
    const fetchMedia = vi.fn();
    const r = await resolveLandingAmbientUrl("中国", deps(false, fetchMedia));
    expect(r.source).toBe("ts");
    expect(r.data).toBe(CN_TS);
    expect(fetchMedia).not.toHaveBeenCalled();
  });

  it("flag=1 API success returns catalog-api url", async () => {
    const fetchMedia = vi.fn().mockResolvedValue({
      status: "ok",
      count: 1,
      items: [{ url: CN_API, asset_kind: "landing_ambient", country_iso: "CN" }],
    });
    const r = await resolveLandingAmbientUrl("中国", deps(true, fetchMedia));
    expect(r.source).toBe("catalog-api");
    expect(r.data).toBe(CN_API);
    expect(fetchMedia).toHaveBeenCalledWith({ assetKind: "landing_ambient", countryIso: "CN" });
  });

  it("flag=1 empty items falls back to TS", async () => {
    const fetchMedia = vi.fn().mockResolvedValue({ status: "ok", count: 0, items: [] });
    const r = await resolveLandingAmbientUrl("中国", deps(true, fetchMedia));
    expect(r.source).toBe("ts");
    expect(r.data).toBe(CN_TS);
  });

  it("flag=1 fetch reject falls back to TS", async () => {
    const fetchMedia = vi.fn().mockRejectedValue(new Error("503"));
    const r = await resolveLandingAmbientUrl("日本", deps(true, fetchMedia));
    expect(r.source).toBe("ts");
    expect(r.data).toBe(landingAmbientImageUrl("日本"));
  });

  it("createDefaultLandingAmbientResolveDeps is wired", () => {
    expect(createDefaultLandingAmbientResolveDeps().fetchMedia).toBeTypeOf("function");
  });
});
