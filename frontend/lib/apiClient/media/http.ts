/**
 * **媒体短期访问**（**270**；**`crates/api/src/routes/media.rs`**；**04** §3.4、**14**）。
 *
 * **数据源**：**`POST|GET …/media/*`** 依赖 **`chain_off.db_pool`**（**`DATABASE_URL`** + **`signed_url_tokens`** 等迁移）。**无池** → **503** 根级 **`database_required`**（**非** **`chain_off_unavailable`** 文案路径，与 **`media.rs`** 一致）。
 * **POST `/media/signed-urls`**：须登录 **401**；**`object_id`** 须 **`evidence|<order_uuid>|<hex>`**；**scope** **`read|download`**；**`expires_in`** 钳位见路由。
 * **GET `/media/access/:tokenId`**：匿名；**410** **`token_expired`**（**`parseResponse`**）；无效 token → **404** **`object_not_found`**。
 */

import { apiUrl, routes } from "../../api";
import {
  requestId,
  parseResponse,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";
import type { PostMediaSignedUrlsBody, PostMediaSignedUrlsResult } from "./types";

/** **`POST /api/v1/media/signed-urls`**：见模块头（**503 `database_required`**、**401**）。 */
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

/** **`GET /api/v1/media/access/:tokenId`**：匿名；**无池** → **503**；**410** **`token_expired`**。 */
export async function getMediaAccess(tokenId: string): Promise<unknown> {
  const res = await fetch(apiUrl(routes.mediaAccess(tokenId)), {
    headers: { "x-request-id": requestId() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMediaAccess", data);
  throwUnlessApiOk(data as { status?: string });
  return data;
}
