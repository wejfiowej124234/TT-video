/**
 * 270：媒体短期签名 URL（04 §3.4、14）
 */

import { apiUrl, routes } from "../api";
import {
  requestId,
  parseResponse,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "./core";

export type MediaSignedUrlScope = "read" | "download";

export type PostMediaSignedUrlsBody = {
  object_id: string;
  scope: MediaSignedUrlScope;
  expires_in?: number;
};

export type PostMediaSignedUrlsResult = {
  status?: string;
  url?: string;
  expires_at?: string;
  token_id?: string;
};

/** POST /api/v1/media/signed-urls — 须登录；无 DB 时 503 database_required */
export async function postMediaSignedUrls(
  body: PostMediaSignedUrlsBody,
  idempotencyKey?: string
): Promise<PostMediaSignedUrlsResult> {
  const res = await fetch(apiUrl(routes.mediaSignedUrls), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders(idempotencyKey) },
    body: JSON.stringify(body),
  });
  const data = (await parseResponse(res)) as PostMediaSignedUrlsResult;
  logApiJsonStatusNotOk("postMediaSignedUrls", data);
  throwUnlessApiOk(data);
  return data;
}

/** GET /api/v1/media/access/:tokenId — 匿名；410 token_expired */
export async function getMediaAccess(tokenId: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.mediaAccess(tokenId)), {
    headers: { "x-request-id": requestId() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMediaAccess", data);
  throwUnlessApiOk(data as { status?: string });
  return data;
}
