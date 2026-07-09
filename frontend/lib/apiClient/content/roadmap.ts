import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import type {
  CmsRoadmapMilestoneAdmin,
  CmsRoadmapSectionAdmin,
  RoadmapOpsStatus,
} from "@/lib/cmsRoadmapTypes";
import { writeRequestHeaders, requestId, parseResponse, logApiJsonStatusNotOk } from "../core";

async function adminRoadmapFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...writeRequestHeaders(),
      "x-request-id": requestId(),
      ...(init?.headers ?? {}),
    },
  });
  const data = (await parseResponse(res)) as T;
  logApiJsonStatusNotOk("adminContentRoadmap", data);
  if (!res.ok) {
    const err = (data as { error?: string })?.error ?? "request_failed";
    throw new Error(err);
  }
  return data;
}

export async function getAdminRoadmapSection() {
  return adminRoadmapFetch<{ section?: CmsRoadmapSectionAdmin }>(routes.adminContentRoadmapSection);
}

export async function patchAdminRoadmapSection(body: {
  version: number;
  anchor_id?: string;
  period_label?: string;
  kicker_zh?: string;
  kicker_en?: string;
  title_zh?: string;
  title_en?: string;
  subtitle_zh?: string;
  subtitle_en?: string;
  disclaimer_zh?: string;
  disclaimer_en?: string;
}) {
  return adminRoadmapFetch<{ section?: CmsRoadmapSectionAdmin }>(routes.adminContentRoadmapSection, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function postAdminRoadmapSectionWorkflow(
  action: "submit-review" | "publish" | "unpublish",
  body: { version: number },
) {
  return adminRoadmapFetch<{ section?: CmsRoadmapSectionAdmin }>(
    `${routes.adminContentRoadmapSection}/${action}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function getAdminRoadmapMilestones(params?: { publish_status?: string }) {
  const q = new URLSearchParams();
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  const suffix = q.toString() ? `?${q}` : "";
  return adminRoadmapFetch<{ items?: CmsRoadmapMilestoneAdmin[] }>(
    `${routes.adminContentRoadmapMilestones}${suffix}`,
  );
}

export async function postAdminRoadmapMilestone(body: {
  slug: string;
  kind: string;
  pinned?: boolean;
  sort_order?: number;
  title_zh: string;
  title_en: string;
  summary_zh?: string;
  summary_en?: string;
  body_zh?: string;
  body_en?: string;
  target_at?: string;
  cta_href?: string;
  cta_kind?: string;
  ops_status?: RoadmapOpsStatus;
}) {
  return adminRoadmapFetch<{ item?: CmsRoadmapMilestoneAdmin }>(routes.adminContentRoadmapMilestones, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchAdminRoadmapMilestone(
  id: string,
  body: {
    version: number;
    kind?: string;
    pinned?: boolean;
    sort_order?: number;
    title_zh?: string;
    title_en?: string;
    summary_zh?: string;
    summary_en?: string;
    body_zh?: string;
    body_en?: string;
    target_at?: string;
    cta_href?: string;
    cta_kind?: string;
    ops_status?: RoadmapOpsStatus;
  },
) {
  return adminRoadmapFetch<{ item?: CmsRoadmapMilestoneAdmin }>(
    `${routes.adminContentRoadmapMilestones}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function postAdminRoadmapMilestoneWorkflow(
  id: string,
  action: "publish" | "unpublish" | "submit-review" | "archive",
  body: { version: number },
) {
  return adminRoadmapFetch<{ item?: CmsRoadmapMilestoneAdmin }>(
    `${routes.adminContentRoadmapMilestones}/${encodeURIComponent(id)}/${action}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function getPublicRoadmap(limit = 20) {
  const res = await fetch(apiUrl(`${routes.publicRoadmap}?limit=${limit}`), {
    cache: "no-store",
    headers: writeRequestHeaders(),
  });
  const data = (await parseResponse(res)) as {
    section?: CmsRoadmapSectionAdmin | null;
    items?: CmsRoadmapMilestoneAdmin[];
    source?: string;
  };
  if (!res.ok) return { section: null, items: [], source: "unavailable" as const };
  return { section: data.section ?? null, items: data.items ?? [], source: data.source ?? "cms" };
}
