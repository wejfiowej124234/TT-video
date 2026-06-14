/**
 * Landing ambient 读路径（S2b Phase 4 / W1）
 * `ENABLED=1` → `GET /catalog/media?asset_kind=landing_ambient`（可选 country_iso）· 失败/空 → TS
 */
import { landingAmbientImageUrl } from "../landingAmbientByCountry";
import { fetchCatalogMedia, isCatalogApiEnabled } from "./client";
import { countryNameZhToIso } from "./catalogGeoAdapter";
import type { CatalogResolveResult } from "./types";

export type LandingAmbientResolveDeps = {
  isEnabled: () => boolean;
  fetchMedia: typeof fetchCatalogMedia;
};

export function createDefaultLandingAmbientResolveDeps(): LandingAmbientResolveDeps {
  return {
    isEnabled: isCatalogApiEnabled,
    fetchMedia: fetchCatalogMedia,
  };
}

export async function resolveLandingAmbientUrl(
  countryZh: string,
  deps: LandingAmbientResolveDeps = createDefaultLandingAmbientResolveDeps(),
): Promise<CatalogResolveResult<string>> {
  const tsUrl = landingAmbientImageUrl(countryZh);
  if (!deps.isEnabled()) {
    return { data: tsUrl, source: "ts" };
  }
  try {
    const trimmed = countryZh.trim();
    const iso = trimmed ? countryNameZhToIso(trimmed) : undefined;
    const res = await deps.fetchMedia({
      assetKind: "landing_ambient",
      ...(iso ? { countryIso: iso } : {}),
    });
    const url = res.items.map((i) => i.url?.trim()).find(Boolean);
    if (!url) throw new Error("catalog_api_empty");
    return { data: url, source: "catalog-api" };
  } catch {
    return { data: tsUrl, source: "ts" };
  }
}
