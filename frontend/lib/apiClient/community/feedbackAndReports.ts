import { apiUrl, routes } from "../../api";
import { logApiJsonStatusNotOk, parseResponse, throwUnlessApiOk } from "../core";
import { COMMUNITY_ME_REPORTS_LIST_API_MAX } from "./constants";
import { communityReadOk, communityWriteJsonBody, defaultHeaders, merge429RetryAfterFromResponse } from "./internal";
import type {
  CommunityGetMyReportsResponse,
  CommunityGetReportDetailResponse,
  CommunityReportAppealResponse,
  CommunityReportReasonCode,
  CommunityReportTargetType,
  CommunityWriteJsonResponse,
} from "./types";

/** 55-S10 / 54-S19：反馈列表（需登录） */
export async function getFeedbackList(): Promise<{
  status: string;
  items?: Array<{
    id: string;
    category: string;
    content: string;
    status: string;
    official_reply?: string | null;
    media_urls?: string[];
    created_at: string;
    updated_at: string;
  }>;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.community.feedback), { headers: defaultHeaders() });
  return (await communityReadOk("community.getFeedbackList", res)) as {
    status: string;
    items?: Array<{
      id: string;
      category: string;
      content: string;
      status: string;
      official_reply?: string | null;
      media_urls?: string[];
      created_at: string;
      updated_at: string;
    }>;
    message?: string;
  };
}

/**
 * **`POST /api/v1/community/feedback`**（55-S10 / 54-S19，需登录）；HTTP 非 2xx 仍解析 JSON 以便读取 `status`/`errors`。
 * **`media_urls`**：最多 4 条；每条 scheme 须为 **`http(s):`** 或 **`data:image/`** / **`data:video/`**（ASCII 前缀大小写不敏感，与 **`crates/api/src/routes/community/feedback_reports/feedback/parse_media.rs`** **`feedback_media_item_has_allowed_scheme`** 同源）；**`http(s):`** 条目另受 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES`** / **`TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS`** 护栏（**400** **`media_url_invalid_scheme`** / **`media_url_prefix_not_allowed`**，`errors.media_urls` 同键；**`data:`** 不走前缀表）。**04** §3.4 **`POST …/community/feedback`** 行。前端预检：**`feedbackMediaItemHasAllowedClientScheme`**、**`feedbackMediaEmbeddedPolicyViolationCode`**（**`frontend/lib/communityPostMediaEmbeddedUrlPolicy.ts`**）。
 */
export async function postFeedback(params: {
  category: string;
  content: string;
  /** 可选；与后端 `community_feedback.media_urls` 一致，最多 4 条 */
  media_urls?: string[];
}): Promise<(CommunityWriteJsonResponse & { id?: string }) | null> {
  const body: Record<string, unknown> = { category: params.category, content: params.content };
  if (params.media_urls && params.media_urls.length > 0) {
    body.media_urls = params.media_urls;
  }
  const res = await fetch(apiUrl(routes.community.feedback), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => null);
  logApiJsonStatusNotOk("community.postFeedback", data);
  if (data == null || typeof data !== "object") return null;
  return merge429RetryAfterFromResponse(res, data) as CommunityWriteJsonResponse & { id?: string };
}

/** HTTP 非 2xx（含 429）仍解析 JSON，供 `interpretCommunityWriteError` */
export async function postCommunityReport(payload: {
  target_type: CommunityReportTargetType;
  target_id: string;
  reason_code: CommunityReportReasonCode;
  details?: string;
  evidence_ref?: string;
}): Promise<CommunityWriteJsonResponse | null> {
  const body: Record<string, string> = {
    target_type: payload.target_type,
    target_id: payload.target_id.trim(),
    reason_code: payload.reason_code,
  };
  const d = payload.details?.trim();
  if (d) body.details = d;
  const ev = payload.evidence_ref?.trim();
  if (ev) body.evidence_ref = ev;
  const res = await fetch(apiUrl(routes.community.reports), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify(body),
  });
  return (await communityWriteJsonBody("community.postCommunityReport", res)) as CommunityWriteJsonResponse | null;
}

/** 160：`GET …/me/reports` 当前用户提交的举报列表（`limit` 默认 30，最大 **`COMMUNITY_ME_REPORTS_LIST_API_MAX`**） */
export async function getMyCommunityReports(params?: { limit?: number }): Promise<CommunityGetMyReportsResponse> {
  const lim = params?.limit;
  const q =
    typeof lim === "number" && Number.isFinite(lim) && lim > 0
      ? `?limit=${encodeURIComponent(
          String(Math.min(COMMUNITY_ME_REPORTS_LIST_API_MAX, Math.max(1, Math.floor(lim))))
        )}`
      : "";
  const res = await fetch(apiUrl(`${routes.community.meReports}${q}`), {
    headers: defaultHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("community.getMyCommunityReports", data);
  throwUnlessApiOk(data);
  return data as CommunityGetMyReportsResponse;
}

/** 160：`GET …/reports/:id`（仅举报人，见 04 §3.4） */
export async function getCommunityReport(reportId: string): Promise<CommunityGetReportDetailResponse> {
  const res = await fetch(apiUrl(routes.community.reportById(reportId.trim())), {
    headers: defaultHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("community.getCommunityReport", data);
  throwUnlessApiOk(data);
  return data as CommunityGetReportDetailResponse;
}

/** 160：结案后申诉 `POST …/reports/:id/appeals` */
export async function postCommunityReportAppeal(
  reportId: string,
  bodyText: string
): Promise<CommunityReportAppealResponse | null> {
  const res = await fetch(apiUrl(routes.community.reportAppeals(reportId.trim())), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ body: bodyText.trim() }),
  });
  return (await communityWriteJsonBody(
    "community.postCommunityReportAppeal",
    res
  )) as CommunityReportAppealResponse | null;
}
