import { apiUrl, routes } from "../../api";
import {
  requestId,
  parseResponse,
  getAuthHeaders,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";

/**
 * **`POST /api/v1/guides/upload-doc`**（证件/证明落盘，需登录；**`parseResponse`** / **`throwUnlessApiOk`** 与订单信封不同，失败体常为根级 **`error`/`message`** 同键）。
 *
 * **body**：**`content_base64`** — 裸 base64 或 **`data:`** URL（**`image/jpeg|png|webp`**、**`application/pdf`** 等，见 **`crates/api/src/routes/guides.rs`** **`upload_guide_doc`**）。**`filename?`** 可选，**当前服务端未用于文件名**（落盘名仍为 **UUID + 扩展名**）。
 *
 * **成功**：**200** **`{ status:"ok", url:"/api/v1/uploads/guides/{uuid}.{ext}" }`** — 可将 **`url`** 填入 **`postGuide`** 的 **`id_photo_url`** / **`language_cert_url`**（**04** §3.4 **`POST …/guides/upload-doc`**）。
 *
 * **常见错误**：**401** **`login_required`**；**429** **`rate_limit_exceeded`**；**400** **`invalid_base64`** / **`invalid_file_type`**；**413** **`file_too_large`**（**`max_bytes`** ≈ **800KiB**）；**500** **`write_failed`**。
 */
export async function postGuideUploadDoc(
  body: { content_base64: string; filename?: string },
  idempotencyKey?: string
): Promise<{ status?: string; url?: string; error?: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...writeRequestHeaders(idempotencyKey),
  };
  const res = await fetch(apiUrl(routes.guideUploadDoc), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await parseResponse(res)) as { status?: string; url?: string; error?: string };
  logApiJsonStatusNotOk("postGuideUploadDoc", data);
  throwUnlessApiOk(data);
  return data;
}

/**
 * **`POST /api/v1/guides`**（向导注册，需登录；**`writeRequestHeaders`** 含幂等键与 Bearer）。
 * **无 chain_off** → **503** **`chain_off_unavailable`**。**401** **`login_required`**。body 与 **`CreateGuideBody`** / **`guide_create_impl`** 一致：**`country_code`** 等见 **04** §3.4 **`POST …/guides`** 与文前「POST /api/v1/guides 请求体」。
 * **`guide_license_url`**：可选；非空时须 `http://` 或 `https://` 前缀（ASCII 大小写不敏感）、最长 **2048** 字符（与 **`chain_off/guides`**、**04** 同源）。前端预检 **`guideLicenseUrlHasHttpScheme`**（**`frontend/lib/guideLicenseUrlScheme.ts`**）。
 */
export async function postGuide(
  body: {
    city: string;
    country_code?: string;
    languages?: string[];
    service_types?: string[];
    bio?: string;
    wallet_address?: string;
    real_name?: string;
    passport_number?: string;
    id_photo_url?: string;
    language_cert_url?: string;
    guide_license_url?: string;
  },
  idempotencyKey?: string
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...writeRequestHeaders(idempotencyKey),
  };
  const res = await fetch(apiUrl(routes.guides), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postGuide", data);
  throwUnlessApiOk(data);
  return data;
}

/**
 * **`POST /api/v1/guides/:id/stake`**（质押；须登录；可选 **`Idempotency-Key`** / **`X-Idempotency-Key`**）。
 * **无 chain_off** → **503** **`chain_off_unavailable`**。**`:id`** 非 UUID → **400** **`invalid_uuid`**。业务错误码见 **`chain_off/guides/stake.rs`** **`guide_stake_impl`**（与 **04** §3.4 **`POST …/stake`**、双写 **`guides`** 表同源）。
 */
export async function postGuideStake(
  guideId: string,
  body: { amount: string },
  idempotencyKey?: string
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-request-id": requestId(),
    ...getAuthHeaders(),
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
    headers["X-Idempotency-Key"] = idempotencyKey;
  }
  const res = await fetch(apiUrl(routes.guideStake(guideId)), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postGuideStake", data);
  throwUnlessApiOk(data);
  return data;
}
