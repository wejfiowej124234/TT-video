/**
 * **`GET /api/v1/community/media/capabilities`** — 社区视频上传能力（与 **`crates/api`** **`community_media_object_storage_configured`** 同源）。
 * **`PublishDrawer`** 须以此为准，勿仅靠 **`NEXT_PUBLIC_*`** 推断 multipart。
 */
import { apiUrl } from "../../api";
import { routes } from "../../api/routes";
import { logApiJsonStatusNotOk, throwUnlessApiOk } from "../core";
import { defaultHeaders } from "./internal";

export type CommunityMediaCapabilities = {
  status: string;
  multipart_enabled: boolean;
  /** 桶已配且 HeadBucket 成功；与 `POST …/upload-media` 禁 MP4/WebM Base64 对齐 */
  public_video_publish_ready: boolean;
  /** 与 `TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED` 及 stderr `capabilities_snapshot` 对拍 */
  public_video_spec_required: boolean;
  /** 与 API `COMMUNITY_MEDIA_S3_HEAD_BUCKET_PROBE_LOG_ID` 同源 */
  head_bucket_probe_impl: string;
  /** 本次响应是否命中进程内 Head 探测缓存（与 stderr `cache_hit` 对拍） */
  head_bucket_cache_hit: boolean;
  public_video_publish_error: string | null;
  max_video_seconds: number;
  max_video_bytes: number;
  supported_content_types: string[];
};

type CommunityMediaCapabilitiesRaw = Omit<
  CommunityMediaCapabilities,
  "public_video_spec_required" | "head_bucket_probe_impl" | "head_bucket_cache_hit"
> & {
  public_video_spec_required?: boolean;
  head_bucket_probe_impl?: string;
  head_bucket_cache_hit?: boolean;
};

function normalizeCommunityMediaCapabilities(
  raw: CommunityMediaCapabilitiesRaw & { status?: string },
): CommunityMediaCapabilities {
  return {
    status: typeof raw.status === "string" && raw.status.trim() ? raw.status.trim() : "ok",
    multipart_enabled: Boolean(raw.multipart_enabled),
    public_video_publish_ready: Boolean(raw.public_video_publish_ready),
    public_video_publish_error: raw.public_video_publish_error ?? null,
    public_video_spec_required: Boolean(raw.public_video_spec_required),
    head_bucket_probe_impl:
      typeof raw.head_bucket_probe_impl === "string" && raw.head_bucket_probe_impl.length > 0
        ? raw.head_bucket_probe_impl
        : "unknown",
    head_bucket_cache_hit: Boolean(raw.head_bucket_cache_hit),
    max_video_seconds: Number(raw.max_video_seconds) || 0,
    max_video_bytes: Number(raw.max_video_bytes) || 0,
    supported_content_types: Array.isArray(raw.supported_content_types)
      ? raw.supported_content_types.map(String)
      : [],
  };
}

export async function getCommunityMediaCapabilities(): Promise<CommunityMediaCapabilities> {
  const res = await fetch(apiUrl(routes.community.mediaCapabilities), {
    headers: defaultHeaders(),
    cache: "no-store",
  });
  const parsed = (await res.json().catch(() => null)) as
    | (CommunityMediaCapabilitiesRaw & { status?: string })
    | null;
  if (!res.ok || parsed == null) {
    throw new Error(`community_media_capabilities_http_${res.status}`);
  }
  const rootStatus = typeof parsed.status === "string" ? parsed.status.trim() : "ok";
  if (rootStatus === "ok" || rootStatus === "degraded") {
    return normalizeCommunityMediaCapabilities(parsed);
  }
  logApiJsonStatusNotOk("community.getMediaCapabilities", parsed);
  throwUnlessApiOk(parsed);
  return normalizeCommunityMediaCapabilities(parsed);
}
