import { apiUrl } from "../../api";
import { routes } from "@/lib/api/routes";
import { parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type AdminCatalogPublishStatus = "draft" | "in_review" | "published" | "archived";

export type AdminCatalogCountryRow = {
  id: string;
  iso3166: string;
  name_zh: string;
  name_en: string;
  sort_order: number;
  open_status: string;
  publish_status: AdminCatalogPublishStatus;
  version: number;
  payload?: Record<string, unknown>;
  published_at?: string | null;
  updated_at?: string;
};

export type AdminCatalogCityRow = {
  id: string;
  country_id: string;
  country_iso: string;
  country_name_zh: string;
  slug: string;
  name_zh: string;
  name_en: string;
  region_label?: string | null;
  sort_order: number;
  open_status: string;
  publish_status: AdminCatalogPublishStatus;
  version: number;
  payload?: Record<string, unknown>;
  updated_at?: string;
};

export type AdminCatalogPoiRow = {
  id: string;
  city_id: string;
  city_name_zh: string;
  country_iso: string;
  poi_type: string;
  slug: string;
  name_zh: string;
  name_en: string;
  description_zh?: string | null;
  description_en?: string | null;
  tier?: string | null;
  sort_order: number;
  publish_status: AdminCatalogPublishStatus;
  version: number;
  payload?: Record<string, unknown>;
  legacy_value?: string | null;
  updated_at?: string;
};

export type AdminCatalogPricingRow = {
  id: string;
  country_id: string;
  country_iso: string;
  country_name_zh: string;
  currency_code: string;
  per_attraction_cents: number;
  per_food_cents: number;
  hotel_base_per_night_cents: number;
  publish_status: AdminCatalogPublishStatus;
  version: number;
  updated_at?: string;
};

export type AdminCatalogRouteRow = {
  id: string;
  from_city_name_zh: string;
  to_city_name_zh: string;
  mode: string;
  publish_status: AdminCatalogPublishStatus;
  version: number;
  updated_at?: string;
};

export type AdminCatalogPublishQueueRow = {
  entity_type: string;
  entity_id: string;
  label: string;
  publish_status: AdminCatalogPublishStatus;
  version: number;
  updated_at?: string;
};

async function adminContentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...writeRequestHeaders(),
      "x-request-id": requestId(),
      ...(init?.headers ?? {}),
    },
  });
  const data = (await parseResponse(res)) as T;
  logApiJsonStatusNotOk("adminContent", data);
  return data;
}

export async function getAdminContentCountries(params?: { publish_status?: string }) {
  const q = new URLSearchParams();
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogCountryRow[]; count?: number }>(
    `${routes.adminContentCountries}${suffix}`,
  );
}

export async function postAdminContentCountry(body: {
  iso3166: string;
  name_zh: string;
  name_en: string;
  sort_order?: number;
  open_status?: string;
}) {
  return adminContentFetch<{ item?: AdminCatalogCountryRow }>(routes.adminContentCountries, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchAdminContentCountry(
  id: string,
  body: { version: number; name_zh?: string; name_en?: string; sort_order?: number; open_status?: string },
) {
  return adminContentFetch<{ item?: AdminCatalogCountryRow }>(`${routes.adminContentCountries}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function postAdminContentCountryWorkflow(
  id: string,
  action: "submit-review" | "publish" | "archive" | "request-publish",
  body: { version: number; reason?: string },
) {
  return adminContentFetch<{ version?: number }>(`${routes.adminContentCountries}/${id}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getAdminContentCities(params?: { country_id?: string; publish_status?: string }) {
  const q = new URLSearchParams();
  if (params?.country_id) q.set("country_id", params.country_id);
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogCityRow[] }>(`${routes.adminContentCities}${suffix}`);
}

export async function postAdminContentCity(body: {
  country_id: string;
  slug: string;
  name_zh: string;
  name_en: string;
  region_label?: string;
  sort_order?: number;
}) {
  return adminContentFetch<{ item?: AdminCatalogCityRow }>(routes.adminContentCities, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchAdminContentCity(
  id: string,
  body: { version: number; name_zh?: string; name_en?: string; region_label?: string; sort_order?: number },
) {
  return adminContentFetch<{ item?: AdminCatalogCityRow }>(`${routes.adminContentCities}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function postAdminContentCityWorkflow(
  id: string,
  action: "submit-review" | "publish" | "archive",
  body: { version: number },
) {
  return adminContentFetch<{ version?: number }>(`${routes.adminContentCities}/${id}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getAdminContentPois(params?: {
  city_id?: string;
  poi_type?: string;
  publish_status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.city_id) q.set("city_id", params.city_id);
  if (params?.poi_type) q.set("poi_type", params.poi_type);
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogPoiRow[] }>(`${routes.adminContentPois}${suffix}`);
}

export async function postAdminContentPoi(body: {
  city_id: string;
  poi_type: string;
  slug: string;
  name_zh: string;
  name_en: string;
  legacy_value?: string;
  sort_order?: number;
}) {
  return adminContentFetch<{ item?: AdminCatalogPoiRow }>(routes.adminContentPois, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchAdminContentPoi(id: string, body: { version: number; name_zh?: string; name_en?: string }) {
  return adminContentFetch<{ item?: AdminCatalogPoiRow }>(`${routes.adminContentPois}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function postAdminContentPoiWorkflow(
  id: string,
  action: "submit-review" | "publish" | "archive",
  body: { version: number },
) {
  return adminContentFetch<{ version?: number }>(`${routes.adminContentPois}/${id}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getAdminContentPricing(params?: { publish_status?: string }) {
  const q = new URLSearchParams();
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogPricingRow[] }>(
    `${routes.adminContentPricingTemplates}${suffix}`,
  );
}

export async function getAdminContentIntercityRoutes(params?: { publish_status?: string }) {
  const q = new URLSearchParams();
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogRouteRow[] }>(
    `${routes.adminContentIntercityRoutes}${suffix}`,
  );
}

export async function getAdminContentPublishQueue() {
  return adminContentFetch<{ items?: AdminCatalogPublishQueueRow[]; queue_key?: string; count?: number }>(
    routes.adminContentPublishQueue,
  );
}

export type AdminPoiImageBatchStatus = "draft" | "generating" | "review" | "published" | "archived";
export type AdminPoiImageCandidateReviewStatus = "pending" | "approved" | "rejected";

export type AdminPoiImageBatchRow = {
  id: string;
  city_id?: string | null;
  city_name_zh?: string | null;
  batch_name: string;
  poi_kind: string;
  status: AdminPoiImageBatchStatus;
  notes?: string | null;
  version: number;
  candidate_count: number;
  poi_count: number;
  approved_count: number;
  updated_at?: string;
};

export type AdminPoiImageCandidateRow = {
  id: string;
  batch_id: string;
  poi_id: string;
  poi_name_zh: string;
  poi_type: string;
  candidate_url: string;
  source_page_url?: string | null;
  scene_description?: string | null;
  license?: string | null;
  review_status: AdminPoiImageCandidateReviewStatus;
  notes?: string | null;
  rank: number;
};

export async function getAdminContentPoiImageBatches(params?: {
  status?: string;
  city_id?: string;
  poi_kind?: string;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.city_id) q.set("city_id", params.city_id);
  if (params?.poi_kind) q.set("poi_kind", params.poi_kind);
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminPoiImageBatchRow[] }>(
    `${routes.adminContentPoiImageBatches}${suffix}`,
  );
}

export async function getAdminContentPoiImageBatch(id: string) {
  return adminContentFetch<{ item?: AdminPoiImageBatchRow }>(routes.adminContentPoiImageBatch(id));
}

export async function getAdminContentPoiImageCandidates(batchId: string, params?: { poi_id?: string }) {
  const q = new URLSearchParams();
  if (params?.poi_id) q.set("poi_id", params.poi_id);
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminPoiImageCandidateRow[] }>(
    `${routes.adminContentPoiImageCandidates(batchId)}${suffix}`,
  );
}

export async function patchAdminContentPoiImageCandidate(
  batchId: string,
  candidateId: string,
  body: { review_status?: AdminPoiImageCandidateReviewStatus; notes?: string },
) {
  return adminContentFetch<{ item?: AdminPoiImageCandidateRow }>(
    `${routes.adminContentPoiImageBatches}/${batchId}/candidates/${candidateId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function postAdminContentPoiImageSelect(
  batchId: string,
  body: { version: number; poi_id: string; candidate_id: string },
) {
  return adminContentFetch<{ item?: AdminPoiImageCandidateRow }>(
    `${routes.adminContentPoiImageBatch(batchId)}/select`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function postAdminContentPoiImageWorkflow(
  batchId: string,
  action: "submit-review" | "publish" | "request-publish",
  body: { version: number; reason?: string },
) {
  return adminContentFetch<{ version?: number; approval_request_id?: string }>(
    `${routes.adminContentPoiImageBatch(batchId)}/${action}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export type AdminCatalogHotelTierRow = {
  id: string;
  tier_code: string;
  sort_order: number;
  multiplier: number;
  label_key: string;
  description_key: string;
  submit_label_zh: string;
  stock_image_asset_id?: string | null;
  stock_image_url?: string | null;
  publish_status: AdminCatalogPublishStatus;
  version: number;
  updated_at?: string;
};

export type AdminCatalogTransportRuleRow = {
  id: string;
  country_id: string;
  country_iso: string;
  country_name_zh: string;
  default_modes: string[];
  rail_ui_label_key?: string | null;
  flight_ui_label_key?: string | null;
  notes?: string | null;
  publish_status: AdminCatalogPublishStatus;
  version: number;
  updated_at?: string;
};

export type AdminCatalogMediaAssetRow = {
  id: string;
  asset_kind: string;
  source_type: string;
  url: string;
  source_page_url?: string | null;
  country_iso?: string | null;
  country_name_zh?: string | null;
  publish_status: AdminCatalogPublishStatus;
  version: number;
  updated_at?: string;
};

export type AdminCountryLandingAmbientRow = {
  country_id: string;
  iso3166: string;
  name_zh: string;
  publish_status: AdminCatalogPublishStatus;
  version: number;
  landing_ambient: Record<string, unknown>;
  media_asset_id?: string | null;
};

export async function getAdminContentHotelTiers(params?: { publish_status?: string }) {
  const q = new URLSearchParams();
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogHotelTierRow[] }>(`${routes.adminContentHotelTiers}${suffix}`);
}

export async function getAdminContentTransportRegionRules(params?: {
  publish_status?: string;
  country_id?: string;
}) {
  const q = new URLSearchParams();
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  if (params?.country_id) q.set("country_id", params.country_id);
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogTransportRuleRow[] }>(
    `${routes.adminContentTransportRegionRules}${suffix}`,
  );
}

export async function getAdminContentMediaAssets(params?: {
  publish_status?: string;
  asset_kind?: string;
  country_id?: string;
}) {
  const q = new URLSearchParams();
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  if (params?.asset_kind) q.set("asset_kind", params.asset_kind);
  if (params?.country_id) q.set("country_id", params.country_id);
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogMediaAssetRow[] }>(`${routes.adminContentMediaAssets}${suffix}`);
}

export async function getAdminContentLandingAmbient(countryId: string) {
  return adminContentFetch<{ item?: AdminCountryLandingAmbientRow }>(
    routes.adminContentLandingAmbient(countryId),
  );
}

export async function patchAdminContentLandingAmbient(
  countryId: string,
  body: { version: number; landing_ambient: Record<string, unknown> },
) {
  return adminContentFetch<{ item?: AdminCountryLandingAmbientRow }>(
    routes.adminContentLandingAmbient(countryId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export type AdminCatalogRevisionDetailRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  version: number;
  action: string;
  actor_id?: string | null;
  request_id?: string | null;
  before_json?: Record<string, unknown> | null;
  after_json?: Record<string, unknown> | null;
  created_at?: string;
};

export type AdminCatalogImportBatchRow = {
  import_batch_id: string;
  row_count: number;
  first_seen?: string;
  last_seen?: string;
};

export type AdminCatalogParityCheckRow = {
  id: string;
  passed: boolean;
  expected: string;
  actual: string;
  detail: string;
};

export type AdminCatalogObservabilityRow = {
  entity_type: string;
  total: number;
  draft: number;
  in_review: number;
  published: number;
  archived: number;
};

export async function getAdminContentRevisionDetails(params?: {
  entity_type?: string;
  entity_id?: string;
  action?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.entity_type) q.set("entity_type", params.entity_type);
  if (params?.entity_id) q.set("entity_id", params.entity_id);
  if (params?.action) q.set("action", params.action);
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogRevisionDetailRow[] }>(
    `${routes.adminContentRevisionsDetail}${suffix}`,
  );
}

export async function getAdminContentRevisionCompare(params: {
  entity_type: string;
  entity_id: string;
  version_a: number;
  version_b: number;
}) {
  const q = new URLSearchParams({
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    version_a: String(params.version_a),
    version_b: String(params.version_b),
  });
  return adminContentFetch<{ left?: AdminCatalogRevisionDetailRow; right?: AdminCatalogRevisionDetailRow }>(
    `${routes.adminContentRevisionsCompare}?${q}`,
  );
}

export async function getAdminContentRollbackHistory(params?: { limit?: number }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogRevisionDetailRow[] }>(
    `${routes.adminContentRevisionsRollbackHistory}${suffix}`,
  );
}

export async function getAdminContentImportHistory(params?: { limit?: number }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogImportBatchRow[] }>(
    `${routes.adminContentImportHistory}${suffix}`,
  );
}

export async function postAdminContentImportTrigger(body: {
  mode: "dry-run" | "validate" | "apply";
  skip_m6?: boolean;
  reason?: string;
}) {
  return adminContentFetch<{ approval_request_id?: string }>(routes.adminContentImportTrigger, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getAdminContentCatalogParity() {
  return adminContentFetch<{ parity_pass?: boolean; items?: AdminCatalogParityCheckRow[] }>(
    routes.adminContentCatalogParity,
  );
}

export async function getAdminContentCatalogObservability() {
  return adminContentFetch<{
    summary?: {
      entities?: AdminCatalogObservabilityRow[];
      revisions_total?: number;
      revisions_rollback?: number;
      import_batches?: number;
      parity_pass?: boolean;
      parity_checks?: AdminCatalogParityCheckRow[];
    };
  }>(routes.adminContentCatalogObservability);
}

export type AdminCatalogGeoFlagStatus = {
  catalog_server_geo_validation_enabled: boolean;
  catalog_server_geo_validation_env: string;
  next_public_catalog_api_enabled_env: string;
  next_public_catalog_api_enabled_note: string;
};

export type AdminCatalogGeoReadSourceStatus = {
  meta_read_source: string;
  post_itineraries_geo_source: string;
  dual_write_order: string;
};

export type AdminCatalogMetaProductCountriesParityRow = {
  index: number;
  core_iso: string;
  core_name_zh: string;
  catalog_iso?: string | null;
  catalog_name_zh?: string | null;
  passed: boolean;
  detail: string;
};

export type AdminCatalogGeoDriftRow = {
  id: string;
  severity: string;
  passed: boolean;
  detail: string;
};

export type AdminCatalogGeoValidationSummary = {
  flags: AdminCatalogGeoFlagStatus;
  read_source: AdminCatalogGeoReadSourceStatus;
  core_geo_parity_pass: boolean;
  core_geo_parity_error?: string | null;
  published_countries: number;
  published_cities: number;
  drift_detected: boolean;
  drift_items: AdminCatalogGeoDriftRow[];
  meta_product_countries_parity: AdminCatalogMetaProductCountriesParityRow[];
  meta_product_countries_parity_pass: boolean;
  open_b_s4_items: string[];
  checked_at?: string;
};

export type AdminCatalogGeoValidationHistoryRow = {
  id: string;
  action: string;
  resource_type?: string | null;
  resource_id?: string | null;
  actor_id: string;
  request_id?: string | null;
  payload?: Record<string, unknown>;
  created_at?: string;
};

export async function getAdminContentCatalogGeoValidation() {
  return adminContentFetch<{ summary?: AdminCatalogGeoValidationSummary }>(
    routes.adminContentCatalogGeoValidation,
  );
}

export async function getAdminContentCatalogGeoValidationHistory(params?: { limit?: number }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return adminContentFetch<{ items?: AdminCatalogGeoValidationHistoryRow[] }>(
    `${routes.adminContentCatalogGeoValidationHistory}${suffix}`,
  );
}

export async function getAdminContentCatalogGeoMetaParity() {
  return adminContentFetch<{
    parity_pass?: boolean;
    items?: AdminCatalogMetaProductCountriesParityRow[];
  }>(routes.adminContentCatalogGeoMetaParity);
}
