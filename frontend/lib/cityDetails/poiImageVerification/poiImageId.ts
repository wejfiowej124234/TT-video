import type { PoiImageKind } from "./types";

export function buildPoiImageId(params: {
  country: string;
  city: string;
  kind: PoiImageKind;
  value: string;
}): string {
  return `${params.country}::${params.city}::${params.kind}::${params.value}`;
}

export function parsePoiImageId(poiId: string): {
  country: string;
  city: string;
  kind: PoiImageKind;
  value: string;
} {
  const parts = poiId.split("::");
  if (parts.length < 4) {
    throw new Error(`Invalid poiId: ${poiId}`);
  }
  const [country, city, kind, ...rest] = parts;
  return {
    country,
    city,
    kind: kind as PoiImageKind,
    value: rest.join("::"),
  };
}
