import { apiUrl } from "../../api";
import { routes } from "@/lib/api/routes";
import { parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type AdminOfficialAccountRow = {
  id: string;
  user_id: string;
  account_kind: string;
  display_label: string;
  is_active: boolean;
  showcase_eligible: boolean;
  data_origin: string;
  linked_guide_id?: string | null;
  linked_provider_app?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  user_email?: string | null;
  user_nickname?: string | null;
  user_role?: string | null;
  kol_referral_code?: string | null;
};

async function adminOfficialFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...writeRequestHeaders(),
      "x-request-id": requestId(),
      ...(init?.headers ?? {}),
    },
  });
  const data = (await parseResponse(res)) as T;
  logApiJsonStatusNotOk("adminOfficial", data);
  return data;
}

export async function getAdminOfficialAccounts(params?: {
  account_kind?: string;
  is_active?: boolean;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.account_kind) q.set("account_kind", params.account_kind);
  if (params?.is_active !== undefined) q.set("is_active", String(params.is_active));
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return adminOfficialFetch<{ items?: AdminOfficialAccountRow[]; count?: number }>(
    `${routes.adminOfficialAccounts}${suffix}`,
  );
}

export async function postAdminOfficialAccount(body: {
  email: string;
  password: string;
  account_kind: string;
  display_label: string;
  nickname?: string;
  data_origin?: string;
}) {
  return adminOfficialFetch<{ item?: AdminOfficialAccountRow }>(routes.adminOfficialAccounts, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchAdminOfficialAccount(
  id: string,
  body: {
    display_label?: string;
    showcase_eligible?: boolean;
    data_origin?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return adminOfficialFetch<{ item?: AdminOfficialAccountRow }>(
    routes.adminOfficialAccount(id),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function postAdminOfficialAccountSubmitReview(id: string) {
  return adminOfficialFetch<{ item?: AdminOfficialAccountRow }>(
    routes.adminOfficialAccountSubmitReview(id),
    { method: "POST" },
  );
}

export async function postAdminOfficialAccountRequestPublish(id: string, body?: { reason?: string }) {
  return adminOfficialFetch<{ approval_request_id?: string }>(
    routes.adminOfficialAccountRequestPublish(id),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );
}

export async function postAdminOfficialAccountPublish(id: string) {
  return adminOfficialFetch<{ item?: AdminOfficialAccountRow }>(
    routes.adminOfficialAccountPublish(id),
    { method: "POST" },
  );
}

export async function postAdminOfficialAccountBindReferral(
  id: string,
  body?: { code?: string; label?: string; region_iso?: string },
) {
  return adminOfficialFetch<{ item?: AdminOfficialAccountRow; referral_code?: string }>(
    routes.adminOfficialAccountBindReferral(id),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );
}

export type AdminOfficialGuideRow = {
  id: string;
  community_post_id?: string | null;
  author_account_id: string;
  title: string;
  body: string;
  destination?: string | null;
  tags?: string[];
  cover_url?: string | null;
  featured?: boolean;
  publish_status: string;
  data_origin?: string;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  author_display_label?: string | null;
  author_user_email?: string | null;
};

export async function getAdminOfficialGuides(params?: {
  author_account_id?: string;
  publish_status?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.author_account_id) q.set("author_account_id", params.author_account_id);
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return adminOfficialFetch<{ items?: AdminOfficialGuideRow[]; count?: number }>(
    `${routes.adminOfficialGuides}${suffix}`,
  );
}

export async function postAdminOfficialGuide(body: {
  author_account_id: string;
  title: string;
  body: string;
  destination?: string;
  tags?: string[];
  cover_url?: string;
  featured?: boolean;
}) {
  return adminOfficialFetch<{ item?: AdminOfficialGuideRow }>(routes.adminOfficialGuides, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchAdminOfficialGuide(
  id: string,
  body: {
    title?: string;
    body?: string;
    destination?: string;
    tags?: string[];
    cover_url?: string;
    featured?: boolean;
    author_account_id?: string;
  },
) {
  return adminOfficialFetch<{ item?: AdminOfficialGuideRow }>(routes.adminOfficialGuide(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function postAdminOfficialGuideSubmitReview(id: string) {
  return adminOfficialFetch<{ item?: AdminOfficialGuideRow }>(
    routes.adminOfficialGuideSubmitReview(id),
    { method: "POST" },
  );
}

export async function postAdminOfficialGuideRequestPublish(id: string, body?: { reason?: string }) {
  return adminOfficialFetch<{ approval_request_id?: string }>(
    routes.adminOfficialGuideRequestPublish(id),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );
}

export async function postAdminOfficialGuidePublish(id: string) {
  return adminOfficialFetch<{ item?: AdminOfficialGuideRow }>(
    routes.adminOfficialGuidePublish(id),
    { method: "POST" },
  );
}

export async function postAdminOfficialGuideArchive(id: string) {
  return adminOfficialFetch<{ item?: AdminOfficialGuideRow }>(
    routes.adminOfficialGuideArchive(id),
    { method: "POST" },
  );
}

export type AdminOfficialItineraryTemplateRow = {
  id: string;
  title: string;
  country_iso?: string | null;
  city_id?: string | null;
  days_json?: unknown;
  budget_json?: unknown;
  cover_image_url?: string | null;
  author_account_id?: string | null;
  publish_status: string;
  data_origin?: string;
  linked_order_id?: string | null;
  version?: number;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  author_display_label?: string | null;
  author_user_email?: string | null;
  city_name_zh?: string | null;
  country_name_zh?: string | null;
};

export async function getAdminOfficialItineraryTemplates(params?: {
  author_account_id?: string;
  country_iso?: string;
  publish_status?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.author_account_id) q.set("author_account_id", params.author_account_id);
  if (params?.country_iso) q.set("country_iso", params.country_iso);
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return adminOfficialFetch<{ items?: AdminOfficialItineraryTemplateRow[]; count?: number }>(
    `${routes.adminOfficialItineraryTemplates}${suffix}`,
  );
}

export async function postAdminOfficialItineraryTemplate(body: {
  title: string;
  author_account_id: string;
  country_iso?: string;
  city_id?: string;
  days_json?: unknown;
  budget_json?: unknown;
  cover_image_url?: string;
}) {
  return adminOfficialFetch<{ item?: AdminOfficialItineraryTemplateRow }>(
    routes.adminOfficialItineraryTemplates,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function postAdminOfficialItineraryTemplateSubmitReview(id: string) {
  return adminOfficialFetch<{ item?: AdminOfficialItineraryTemplateRow }>(
    routes.adminOfficialItineraryTemplateSubmitReview(id),
    { method: "POST" },
  );
}

export async function postAdminOfficialItineraryTemplateRequestPublish(
  id: string,
  body?: { reason?: string },
) {
  return adminOfficialFetch<{ approval_request_id?: string }>(
    routes.adminOfficialItineraryTemplateRequestPublish(id),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );
}

export async function postAdminOfficialItineraryTemplatePublish(id: string) {
  return adminOfficialFetch<{ item?: AdminOfficialItineraryTemplateRow }>(
    routes.adminOfficialItineraryTemplatePublish(id),
    { method: "POST" },
  );
}

export type AdminColdStartCampaignRow = {
  id: string;
  name: string;
  campaign_kind?: string;
  status: string;
  surfaces?: string[];
  publish_status: string;
  version?: number;
  deployed_at?: string | null;
  rolled_back_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminPublicOpsCampaignRow = AdminColdStartCampaignRow;

export type AdminPublicOpsCampaignPreview = {
  campaign_id: string;
  campaign_kind: string;
  name: string;
  surface: string;
  surface_match: boolean;
  deploy_status: string;
  publish_status: string;
  item_count: number;
  items: AdminColdStartItemRow[];
};

export type AdminColdStartItemRow = {
  id: string;
  campaign_id: string;
  item_type: string;
  item_ref_id?: string | null;
  sort_order?: number;
  status: string;
  payload?: Record<string, unknown>;
  ref_label?: string | null;
};

export async function getAdminOfficialColdStartCampaigns(params?: {
  publish_status?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return adminOfficialFetch<{ items?: AdminColdStartCampaignRow[]; count?: number }>(
    `${routes.adminOfficialColdStartCampaigns}${suffix}`,
  );
}

export async function postAdminOfficialColdStartCampaign(body: {
  name: string;
  surfaces?: string[];
}) {
  return adminOfficialFetch<{ item?: AdminColdStartCampaignRow }>(
    routes.adminOfficialColdStartCampaigns,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function postAdminOfficialColdStartCampaignItem(
  campaignId: string,
  body: {
    item_type: string;
    item_ref_id: string;
    sort_order?: number;
  },
) {
  return adminOfficialFetch<{ item?: AdminColdStartItemRow }>(
    routes.adminOfficialColdStartCampaignItems(campaignId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function postAdminOfficialColdStartCampaignSubmitReview(id: string) {
  return adminOfficialFetch<{ item?: AdminColdStartCampaignRow }>(
    routes.adminOfficialColdStartCampaignSubmitReview(id),
    { method: "POST" },
  );
}

export async function postAdminOfficialColdStartCampaignRequestDeploy(
  id: string,
  body?: { reason?: string },
) {
  return adminOfficialFetch<{ approval_request_id?: string }>(
    routes.adminOfficialColdStartCampaignRequestDeploy(id),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );
}

export async function postAdminOfficialColdStartCampaignDeploy(id: string) {
  return adminOfficialFetch<{ item?: AdminColdStartCampaignRow }>(
    routes.adminOfficialColdStartCampaignDeploy(id),
    { method: "POST" },
  );
}

export async function postAdminOfficialColdStartCampaignRollback(id: string) {
  return adminOfficialFetch<{ item?: AdminColdStartCampaignRow }>(
    routes.adminOfficialColdStartCampaignRollback(id),
    { method: "POST" },
  );
}

export type AdminPublicOperationsOriginBucket = Record<string, number>;

export type AdminPublicOperationsStatsRes = {
  status?: string;
  filter_enabled?: boolean;
  data_origin_counts?: {
    guides?: AdminPublicOperationsOriginBucket;
    orders?: AdminPublicOperationsOriginBucket;
    market_listings?: AdminPublicOperationsOriginBucket;
    community_posts?: AdminPublicOperationsOriginBucket;
    market_listings_by_variant?: {
      provider?: AdminPublicOperationsOriginBucket;
      acquisition?: AdminPublicOperationsOriginBucket;
    };
  };
  error?: string;
};

export async function getAdminOfficialPublicOperationsStats() {
  return adminOfficialFetch<AdminPublicOperationsStatsRes>(routes.adminOfficialPublicOperationsStats);
}

export type AdminPublicOpsDisplayRow = {
  id: string;
  entity_type: string;
  label: string;
  display_status: string;
  display_origin: string;
  data_origin: string;
  featured: boolean;
  display_priority: number;
  display_surfaces: string[];
  display_start_at?: string | null;
  display_end_at?: string | null;
  updated_at?: string;
};

export async function getAdminOfficialPublicOperationsPublishQueue(params?: {
  entity_type?: string;
  display_status?: string;
  featured_only?: boolean;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.entity_type) q.set("entity_type", params.entity_type);
  if (params?.display_status) q.set("display_status", params.display_status);
  if (params?.featured_only) q.set("featured_only", "true");
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return adminOfficialFetch<{ status?: string; entity_type?: string; items?: AdminPublicOpsDisplayRow[] }>(
    `${routes.adminOfficialPublicOperationsPublishQueue}${suffix}`,
  );
}

export async function patchAdminOfficialPublicOperationsFeatured(
  entityType: string,
  id: string,
  featured: boolean,
) {
  return adminOfficialFetch<{ status?: string; item?: AdminPublicOpsDisplayRow }>(
    routes.adminOfficialPublicOperationsEntityFeatured(entityType, id),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured }),
    },
  );
}

export async function patchAdminOfficialPublicOperationsPriority(
  entityType: string,
  id: string,
  displayPriority: number,
) {
  return adminOfficialFetch<{ status?: string; item?: AdminPublicOpsDisplayRow }>(
    routes.adminOfficialPublicOperationsEntityPriority(entityType, id),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_priority: displayPriority }),
    },
  );
}

export async function patchAdminOfficialPublicOperationsSurfaces(
  entityType: string,
  id: string,
  displaySurfaces: string[],
) {
  return adminOfficialFetch<{ status?: string; item?: AdminPublicOpsDisplayRow }>(
    routes.adminOfficialPublicOperationsEntitySurfaces(entityType, id),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_surfaces: displaySurfaces }),
    },
  );
}

export async function patchAdminOfficialPublicOperationsSchedule(
  entityType: string,
  id: string,
  schedule: { display_start_at?: string | null; display_end_at?: string | null },
) {
  return adminOfficialFetch<{ status?: string; item?: AdminPublicOpsDisplayRow }>(
    routes.adminOfficialPublicOperationsEntitySchedule(entityType, id),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    },
  );
}

export type AdminPublicOpsPreviewResult = {
  entity_type: string;
  entity_id: string;
  surface: string;
  as_of: string;
  visible: boolean;
  checks: {
    display_status_published: boolean;
    surface_match: boolean;
    schedule_in_window: boolean;
    policy_origin_allowed: boolean;
  };
  reasons_hidden: string[];
  display: AdminPublicOpsDisplayRow;
};

export async function getAdminOfficialPublicOperationsPreview(
  entityType: string,
  id: string,
  params?: { surface?: string; as_of?: string },
) {
  const q = new URLSearchParams();
  if (params?.surface) q.set("surface", params.surface);
  if (params?.as_of) q.set("as_of", params.as_of);
  const suffix = q.toString() ? `?${q}` : "";
  return adminOfficialFetch<{
    status?: string;
    preview?: AdminPublicOpsPreviewResult;
    public_card?: unknown;
    error?: string;
  }>(`${routes.adminOfficialPublicOperationsEntityPreview(entityType, id)}${suffix}`);
}

export type AdminPublicOpsHistoryRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id?: string | null;
  display_source?: string | null;
  before_state?: unknown;
  after_state?: unknown;
  created_at?: string;
};

export async function getAdminOfficialPublicOperationsHistory(params?: {
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
  return adminOfficialFetch<{ status?: string; items?: AdminPublicOpsHistoryRow[] }>(
    `${routes.adminOfficialPublicOperationsHistory}${suffix}`,
  );
}

export type AdminPublicOpsPolicy = {
  show_test_data: boolean;
  blocked_origins: string[];
  updated_at?: string;
  updated_by?: string | null;
};

export async function getAdminOfficialPublicOperationsPolicy() {
  return adminOfficialFetch<{ status?: string; policy?: AdminPublicOpsPolicy }>(
    routes.adminOfficialPublicOperationsPolicy,
  );
}

export async function patchAdminOfficialPublicOperationsPolicy(body: {
  show_test_data?: boolean;
  blocked_origins?: string[];
}) {
  return adminOfficialFetch<{ status?: string; policy?: AdminPublicOpsPolicy; error?: string }>(
    routes.adminOfficialPublicOperationsPolicy,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function getAdminOfficialPublicOperationsCampaigns(params?: {
  campaign_kind?: string;
  publish_status?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.campaign_kind) q.set("campaign_kind", params.campaign_kind);
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return adminOfficialFetch<{ status?: string; items?: AdminPublicOpsCampaignRow[]; count?: number }>(
    `${routes.adminOfficialPublicOperationsCampaigns}${suffix}`,
  );
}

export async function postAdminOfficialPublicOperationsCampaign(body: {
  name: string;
  campaign_kind: string;
  surfaces?: string[];
}) {
  return adminOfficialFetch<{ status?: string; item?: AdminPublicOpsCampaignRow }>(
    routes.adminOfficialPublicOperationsCampaigns,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function postAdminOfficialPublicOperationsCampaignItem(
  campaignId: string,
  body: { item_type: string; item_ref_id: string; sort_order?: number },
) {
  return adminOfficialFetch<{ status?: string; item?: AdminColdStartItemRow }>(
    routes.adminOfficialPublicOperationsCampaignItems(campaignId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function postAdminOfficialPublicOperationsCampaignSubmitReview(id: string) {
  return adminOfficialFetch<{ status?: string; item?: AdminPublicOpsCampaignRow }>(
    routes.adminOfficialPublicOperationsCampaignSubmitReview(id),
    { method: "POST" },
  );
}

export async function postAdminOfficialPublicOperationsCampaignRequestDeploy(id: string, body?: { reason?: string }) {
  return adminOfficialFetch<{ status?: string; approval_id?: string }>(
    routes.adminOfficialPublicOperationsCampaignRequestDeploy(id),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );
}

export async function postAdminOfficialPublicOperationsCampaignDeploy(id: string) {
  return adminOfficialFetch<{ status?: string; item?: AdminPublicOpsCampaignRow }>(
    routes.adminOfficialPublicOperationsCampaignDeploy(id),
    { method: "POST" },
  );
}

export async function postAdminOfficialPublicOperationsCampaignRollback(id: string) {
  return adminOfficialFetch<{ status?: string; item?: AdminPublicOpsCampaignRow }>(
    routes.adminOfficialPublicOperationsCampaignRollback(id),
    { method: "POST" },
  );
}

export async function getAdminOfficialPublicOperationsCampaignPreview(id: string, params?: { surface?: string }) {
  const q = new URLSearchParams();
  if (params?.surface) q.set("surface", params.surface);
  const suffix = q.toString() ? `?${q}` : "";
  return adminOfficialFetch<{ status?: string; preview?: AdminPublicOpsCampaignPreview }>(
    `${routes.adminOfficialPublicOperationsCampaignPreview(id)}${suffix}`,
  );
}

export async function postAdminOfficialPublicOperationsPublish(entityType: string, id: string) {
  return adminOfficialFetch<{ status?: string; item?: AdminPublicOpsDisplayRow }>(
    routes.adminOfficialPublicOperationsEntityPublish(entityType, id),
    { method: "POST" },
  );
}

export async function postAdminOfficialPublicOperationsUnpublish(entityType: string, id: string) {
  return adminOfficialFetch<{ status?: string; item?: AdminPublicOpsDisplayRow }>(
    routes.adminOfficialPublicOperationsEntityUnpublish(entityType, id),
    { method: "POST" },
  );
}
