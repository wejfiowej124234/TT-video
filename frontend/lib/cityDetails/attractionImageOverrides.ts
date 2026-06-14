import { resolveCatalogAttractionImage } from "./productPoiMediaCatalog";

export function resolveAttractionImage(city: string, value: string, fallback: string): string {
  return resolveCatalogAttractionImage(city, value, fallback);
}

export function isExternalItineraryStockImage(url: string): boolean {
  return url.includes("images.unsplash.com");
}
