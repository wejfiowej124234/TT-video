/** Maps publish-queue `entity_type` rows to admin module paths and workflow API bases. */

import { routes } from "@/lib/api/routes";

const ADMIN_PATH_BY_ENTITY: Record<string, string> = {
  catalog_countries: "/admin/content/countries",
  catalog_cities: "/admin/content/cities",
  catalog_pois: "/admin/content/pois",
  catalog_pricing_templates: "/admin/content/pricing",
  catalog_intercity_routes: "/admin/content/intercity-routes",
  catalog_hotel_tier_definitions: "/admin/content/hotel-tiers",
  catalog_transport_region_rules: "/admin/content/transport-region-rules",
  catalog_media_assets: "/admin/content/media-assets",
  catalog_translation_entries: "/admin/content/translation",
  catalog_seo_metadata: "/admin/content/seo",
};

const API_BASE_BY_ENTITY: Record<string, string> = {
  catalog_countries: routes.adminContentCountries,
  catalog_cities: routes.adminContentCities,
  catalog_pois: routes.adminContentPois,
  catalog_pricing_templates: routes.adminContentPricingTemplates,
  catalog_intercity_routes: routes.adminContentIntercityRoutes,
  catalog_hotel_tier_definitions: routes.adminContentHotelTiers,
  catalog_transport_region_rules: routes.adminContentTransportRegionRules,
  catalog_media_assets: routes.adminContentMediaAssets,
  catalog_translation_entries: routes.adminContentTranslations,
  catalog_seo_metadata: routes.adminContentSeo,
};

export function adminCatalogPublishQueueAdminPath(entityType: string): string | null {
  return ADMIN_PATH_BY_ENTITY[entityType] ?? null;
}

export function adminCatalogPublishQueueApiBase(entityType: string): string | null {
  return API_BASE_BY_ENTITY[entityType] ?? null;
}
