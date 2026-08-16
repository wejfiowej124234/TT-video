import { apiUrl, routes } from "../api";
import {
  getAuthHeaders,
  hasWwwSessionHint,
  parseResponse,
  requestId,
  writeRequestHeaders,
} from "./core";

export type UgcContentClass =
  | "community_post"
  | "community_comment"
  | "guide"
  | "merchant_listing"
  | "acquisition_listing"
  | "itinerary";

export type UgcTranslateCache = "hit" | "miss";

export type UgcTranslationLookup = {
  status: string;
  cache: UgcTranslateCache;
  translated_text?: string;
  source_hash?: string;
  source_locale?: string;
  target_locale?: string;
  provider?: string;
  error?: string;
};

export function hasUgcTranslateSession(): boolean {
  const auth = getAuthHeaders();
  return !!(auth["X-User-Id"] || auth.Authorization || hasWwwSessionHint());
}

export async function getUgcTranslationCache(params: {
  contentClass: UgcContentClass | string;
  contentId: string;
  field: string;
  targetLocale: string;
}): Promise<UgcTranslationLookup> {
  const sp = new URLSearchParams();
  sp.set("content_class", params.contentClass);
  sp.set("content_id", params.contentId);
  sp.set("field", params.field);
  sp.set("target_locale", params.targetLocale);
  const res = await fetch(`${apiUrl(routes.ugcTranslations)}?${sp.toString()}`, {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const parsed = (await parseResponse(res)) as UgcTranslationLookup;
  if (res.status === 404) {
    return { status: "ok", cache: "miss", error: "content_not_found" };
  }
  if (!res.ok) {
    const err =
      typeof parsed?.error === "string"
        ? parsed.error
        : `http_${res.status}`;
    return { status: "error", cache: "miss", error: err };
  }
  if (parsed?.cache === "hit" && typeof parsed.translated_text === "string") {
    return { ...parsed, status: parsed.status || "ok", cache: "hit" };
  }
  return { ...parsed, status: parsed?.status || "ok", cache: "miss" };
}

export async function postUgcTranslate(body: {
  contentClass: UgcContentClass | string;
  contentId: string;
  field: string;
  targetLocale: string;
  sourceLocale?: string;
}): Promise<UgcTranslationLookup> {
  const res = await fetch(apiUrl(routes.ugcTranslate), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify({
      content_class: body.contentClass,
      content_id: body.contentId,
      field: body.field,
      target_locale: body.targetLocale,
      ...(body.sourceLocale ? { source_locale: body.sourceLocale } : {}),
    }),
  });
  const parsed = (await parseResponse(res)) as UgcTranslationLookup;
  if (res.status === 401) {
    const err = new Error("login_required");
    (err as Error & { lookup?: UgcTranslationLookup }).lookup = parsed;
    throw err;
  }
  if (!res.ok) {
    const code =
      typeof parsed?.error === "string" ? parsed.error : `http_${res.status}`;
    throw new Error(code);
  }
  return parsed;
}
