import {
  resolveCatalogFoodDescription,
  resolveCatalogFoodImage,
} from "./productPoiMediaCatalog";

export function resolveFoodImage(city: string, value: string, fallback: string): string {
  return resolveCatalogFoodImage(city, value, fallback);
}

export function resolveFoodDescription(
  city: string,
  value: string,
  label: string,
  fallback: string
): string {
  return resolveCatalogFoodDescription(city, value, label, fallback);
}
