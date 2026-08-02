import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import type {
  CmsAnnouncementAdminRow,
  CmsPublicAnnouncementRow,
} from "@/lib/cmsPublicAnnouncementsTypes";
import { writeRequestHeaders, requestId, parseResponse, logApiJsonStatusNotOk } from "../core";

async function adminAnnouncementsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...writeRequestHeaders(),
      "x-request-id": requestId(),
      ...(init?.headers ?? {}),
    },
  });
  const data = (await parseResponse(res)) as T;
  logApiJsonStatusNotOk("adminContentAnnouncements", data);
  if (!res.ok) {
    const err = (data as { error?: string })?.error ?? "request_failed";
    throw new Error(err);
  }
  return data;
}

export async function getAdminContentAnnouncements(params?: {
  publish_status?: string;
  lane?: string;
}) {
  const q = new URLSearchParams();
  if (params?.publish_status) q.set("publish_status", params.publish_status);
  if (params?.lane) q.set("lane", params.lane);
  const suffix = q.toString() ? `?${q}` : "";
  return adminAnnouncementsFetch<{ items?: CmsAnnouncementAdminRow[] }>(
    `${routes.adminContentAnnouncements}${suffix}`,
  );
}

export async function postAdminContentAnnouncement(body: {
  slug: string;
  lane: string;
  kind: string;
  content_tier: string;
  pinned?: boolean;
  sort_order?: number;
  title_zh: string;
  title_en: string;
  summary_zh?: string;
  summary_en?: string;
  body_zh?: string;
  body_en?: string;
  release_at?: string;
  effective_at?: string;
  cta_href?: string;
  cta_kind?: string;
}) {
  return adminAnnouncementsFetch<{ item?: CmsAnnouncementAdminRow }>(routes.adminContentAnnouncements, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchAdminContentAnnouncement(
  id: string,
  body: {
    version: number;
    lane?: string;
    kind?: string;
    content_tier?: string;
    pinned?: boolean;
    sort_order?: number;
    title_zh?: string;
    title_en?: string;
    summary_zh?: string;
    summary_en?: string;
    body_zh?: string;
    body_en?: string;
    release_at?: string;
    effective_at?: string;
    cta_href?: string;
    cta_kind?: string;
  },
) {
  return adminAnnouncementsFetch<{ item?: CmsAnnouncementAdminRow }>(
    `${routes.adminContentAnnouncements}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function postAdminContentAnnouncementWorkflow(
  id: string,
  action: "publish" | "unpublish" | "submit-review" | "archive",
  body: { version: number; reason?: string },
) {
  return adminAnnouncementsFetch<{ item?: CmsAnnouncementAdminRow }>(
    `${routes.adminContentAnnouncements}/${encodeURIComponent(id)}/${action}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function getPublicCmsAnnouncements(params?: {
  lane?: string;
  limit?: number;
  for_home?: boolean;
}) {
  const q = new URLSearchParams();
  if (params?.lane) q.set("lane", params.lane);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.for_home) q.set("for_home", "1");
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetch(apiUrl(`${routes.publicAnnouncements}${suffix}`), {
    cache: "no-store",
    headers: writeRequestHeaders(),
  });
  const data = (await parseResponse(res)) as {
    items?: CmsPublicAnnouncementRow[];
    source?: string;
    for_home?: boolean;
  };
  if (!res.ok) {
    // Homepage CMS-only path must never invent static rows.
    if (params?.for_home) {
      return { items: [] as CmsPublicAnnouncementRow[], source: "unavailable" as const };
    }
    return { items: [] as CmsPublicAnnouncementRow[], source: "static" as const };
  }
  return { items: data.items ?? [], source: (data.source ?? "cms") as string };
}

export async function getPublicCmsAnnouncementsPulse(limit = 6) {
  const res = await fetch(apiUrl(`${routes.publicAnnouncementsPulse}?limit=${limit}`), {
    cache: "no-store",
    headers: writeRequestHeaders(),
  });
  const data = (await parseResponse(res)) as { items?: CmsPublicAnnouncementRow[]; source?: string };
  if (!res.ok) return { items: [] as CmsPublicAnnouncementRow[], source: "static" as const };
  return { items: data.items ?? [], source: (data.source ?? "cms") as string };
}
