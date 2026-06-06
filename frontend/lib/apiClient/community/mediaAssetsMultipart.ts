/**
 * Browser multipart upload for community video (S3 presigned parts).
 * @see docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md
 */
import { apiUrl } from "../../api";
import { routes } from "../../api/routes";
import { defaultHeaders, communityReadOk, communityWriteJsonBody } from "./internal";

/** 与后端 **`default_part_size_bytes`** 默认 **8MiB** 同源。 */
export const COMMUNITY_MEDIA_MULTIPART_PART_SIZE_BYTES_DEFAULT = 8 * 1024 * 1024;

export class CommunityMultipartUploadError extends Error {
  readonly code: string;
  readonly httpStatus?: number;
  constructor(code: string, message?: string, httpStatus?: number) {
    super(message ?? code);
    this.name = "CommunityMultipartUploadError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export type CommunityMediaPresignedPart = {
  part_number: number;
  url: string;
  headers: Record<string, string>;
};

export type CommunityMediaSessionCreateOk = {
  status: "ok";
  asset_id: string;
  object_key: string;
  content_type: string;
  byte_length: number;
  part_size_bytes: number;
  part_count: number;
  presign_expires_in_seconds?: number;
};

export type CommunityMediaPresignPartsOk = {
  status: "ok";
  asset_id: string;
  parts: CommunityMediaPresignedPart[];
};

export type CommunityMediaCompleteOk = {
  status: "ok";
  asset_id: string;
  state: string;
  playback_url: string;
  byte_length?: number;
};

export type CommunityMediaAssetStatusOk = {
  status: "ok";
  asset: {
    id: string;
    state: string;
    playback_url: string | null;
    last_error?: string | null;
    byte_length?: number;
  };
};

export type CommunityMultipartProgress =
  | { phase: "creating"; ratio: number }
  | { phase: "uploading"; uploadedBytes: number; totalBytes: number; ratio: number }
  | { phase: "completing"; ratio: number }
  | { phase: "confirming"; ratio: number };

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function readJsonError(data: unknown): { code: string; message: string } | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (o.status === "ok") return null;
  const code =
    (typeof o.error === "string" && o.error.trim()) ||
    (typeof o.message === "string" && o.message.trim()) ||
    "unknown_error";
  const message = (typeof o.message === "string" && o.message.trim()) || code;
  return { code, message };
}

export async function createCommunityMediaUploadSession(body: {
  content_type: string;
  byte_length: number;
  part_size_bytes?: number;
}): Promise<CommunityMediaSessionCreateOk> {
  const res = await fetch(apiUrl(routes.community.mediaAssetsSessions), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify(body),
  });
  const data = await communityWriteJsonBody("community.createMediaUploadSession", res);
  const err = readJsonError(data);
  if (err) throw new CommunityMultipartUploadError(err.code, err.message, res.status);
  return data as CommunityMediaSessionCreateOk;
}

export async function presignCommunityMediaAssetParts(
  assetId: string,
  partNumbers: number[],
): Promise<CommunityMediaPresignPartsOk> {
  const res = await fetch(apiUrl(routes.community.mediaAssetsSessionParts(assetId)), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ part_numbers: partNumbers }),
  });
  const data = await communityWriteJsonBody("community.presignMediaAssetParts", res);
  const err = readJsonError(data);
  if (err) throw new CommunityMultipartUploadError(err.code, err.message, res.status);
  return data as CommunityMediaPresignPartsOk;
}

/** Presigned **UploadPart**：**勿**附加鉴权头（会破坏签名）。 */
export async function putCommunityMediaPresignedPart(
  url: string,
  headers: Record<string, string>,
  body: Blob,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const h = new Headers();
  for (const [k, v] of Object.entries(headers)) {
    if (!k.trim()) continue;
    h.set(k, v);
  }
  const res = await fetchImpl(url, { method: "PUT", headers: h, body });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new CommunityMultipartUploadError(
      "part_upload_http_failed",
      t.slice(0, 200) || `http_${res.status}`,
      res.status,
    );
  }
  const etagRaw = res.headers.get("etag")?.trim();
  if (!etagRaw) {
    throw new CommunityMultipartUploadError("part_upload_missing_etag", "part_upload_missing_etag", res.status);
  }
  return etagRaw;
}

export async function completeCommunityMediaAssetSession(
  assetId: string,
  parts: { part_number: number; etag: string }[],
  sha256_hex?: string,
): Promise<CommunityMediaCompleteOk> {
  const res = await fetch(apiUrl(routes.community.mediaAssetsSessionComplete(assetId)), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({ parts, ...(sha256_hex ? { sha256_hex } : {}) }),
  });
  const data = await communityWriteJsonBody("community.completeMediaAssetSession", res);
  const err = readJsonError(data);
  if (err) throw new CommunityMultipartUploadError(err.code, err.message, res.status);
  return data as CommunityMediaCompleteOk;
}

export async function getCommunityMediaAssetStatus(assetId: string): Promise<CommunityMediaAssetStatusOk> {
  const res = await fetch(apiUrl(routes.community.mediaAssetById(assetId)), {
    headers: defaultHeaders(),
  });
  const data = await communityReadOk("community.getMediaAssetStatus", res);
  return data as CommunityMediaAssetStatusOk;
}

export type UploadCommunityVideoMultipartOptions = {
  onProgress?: (p: CommunityMultipartProgress) => void;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  partSizeBytes?: number;
  pollIntervalMs?: number;
  pollMaxAttempts?: number;
};

function ratioUploading(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(0.95, 0.05 + (done / total) * 0.85);
}

/**
 * 编排：建 session → 分片预签 → 浏览器 PUT → complete →（必要时）轮询 **ready**。
 */
export async function uploadCommunityVideoMultipart(
  file: File,
  opts: UploadCommunityVideoMultipartOptions = {},
): Promise<{ assetId: string; playbackUrl: string }> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const partSize = opts.partSizeBytes ?? COMMUNITY_MEDIA_MULTIPART_PART_SIZE_BYTES_DEFAULT;
  const pollMs = opts.pollIntervalMs ?? 400;
  const pollMax = opts.pollMaxAttempts ?? 60;
  const onProgress = opts.onProgress;
  const signal = opts.signal;

  const ct = (file.type || "video/mp4").trim() || "video/mp4";

  onProgress?.({ phase: "creating", ratio: 0.02 });
  const session = await createCommunityMediaUploadSession({
    content_type: ct,
    byte_length: file.size,
    part_size_bytes: partSize,
  });
  if (signal?.aborted) throw new CommunityMultipartUploadError("aborted", "aborted");

  const { asset_id: assetId, part_count: partCount, part_size_bytes: serverPartSize } = session;
  const sliceSize = Number.isFinite(serverPartSize) && serverPartSize > 0 ? serverPartSize : partSize;

  const etags: { part_number: number; etag: string }[] = [];
  let uploaded = 0;
  const total = file.size;

  let nextPart = 1;
  while (nextPart <= partCount) {
    const nums: number[] = [];
    for (let k = 0; k < 32 && nextPart <= partCount; k++, nextPart++) {
      nums.push(nextPart);
    }

    const pres = await presignCommunityMediaAssetParts(assetId, nums);
    if (signal?.aborted) throw new CommunityMultipartUploadError("aborted", "aborted");

    const byPart = new Map(pres.parts.map((x) => [x.part_number, x]));
    for (const n of nums) {
      const spec = byPart.get(n);
      if (!spec) {
        throw new CommunityMultipartUploadError("presign_missing_part", `missing part ${n}`);
      }
      const start = (n - 1) * sliceSize;
      const end = Math.min(start + sliceSize, file.size);
      const slice = file.slice(start, end);
      const etag = await putCommunityMediaPresignedPart(spec.url, spec.headers, slice, fetchImpl);
      etags.push({ part_number: n, etag });
      uploaded += end - start;
      onProgress?.({
        phase: "uploading",
        uploadedBytes: uploaded,
        totalBytes: total,
        ratio: ratioUploading(uploaded, total),
      });
      if (signal?.aborted) throw new CommunityMultipartUploadError("aborted", "aborted");
    }
  }

  onProgress?.({ phase: "completing", ratio: 0.92 });
  etags.sort((a, b) => a.part_number - b.part_number);
  const done = await completeCommunityMediaAssetSession(assetId, etags);
  if (signal?.aborted) throw new CommunityMultipartUploadError("aborted", "aborted");

  let playbackUrl = typeof done.playback_url === "string" ? done.playback_url.trim() : "";
  if (playbackUrl && done.state === "ready") {
    onProgress?.({ phase: "confirming", ratio: 0.98 });
    return { assetId, playbackUrl };
  }

  onProgress?.({ phase: "confirming", ratio: 0.96 });
  for (let i = 0; i < pollMax; i++) {
    if (signal?.aborted) throw new CommunityMultipartUploadError("aborted", "aborted");
    const st = await getCommunityMediaAssetStatus(assetId);
    const stName = st.asset.state;
    if (stName === "ready") {
      const u = (st.asset.playback_url ?? "").trim();
      if (!u) {
        throw new CommunityMultipartUploadError("media_asset_ready_missing_playback", "media_asset_ready_missing_playback");
      }
      onProgress?.({ phase: "confirming", ratio: 1 });
      return { assetId, playbackUrl: u };
    }
    if (stName === "failed") {
      const le = (st.asset.last_error ?? "").trim() || "media_asset_failed";
      throw new CommunityMultipartUploadError("media_asset_failed", le);
    }
    await sleep(pollMs);
  }
  throw new CommunityMultipartUploadError("media_asset_poll_timeout", "media_asset_poll_timeout");
}
