/** 配置发布列表 URL 与详情页 `relist` 回跳（仅白名单 query，防开放重定向） */

const RELEASE_KEY_MAX_LEN = 256;
const STATUS_SET = new Set(["draft", "published", "rolled_back"]);

/**
 * 将详情页 `?relist=`（URL 编码后的 query 串）净化为仅含 limit / release_key / status 的 search string。
 */
export function safeReleasesListSearchFromRelistParam(relist: string | null): string {
  if (relist == null || relist === "") return "";
  let decoded: string;
  try {
    decoded = decodeURIComponent(relist);
  } catch {
    return "";
  }
  let sp: URLSearchParams;
  try {
    sp = new URLSearchParams(decoded);
  } catch {
    return "";
  }
  const out = new URLSearchParams();
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  out.set("limit", String(limit));
  const rk = (sp.get("release_key") ?? "").trim().slice(0, RELEASE_KEY_MAX_LEN);
  if (rk) out.set("release_key", rk);
  const st = (sp.get("status") ?? "").trim().toLowerCase();
  if (STATUS_SET.has(st)) out.set("status", st);
  return out.toString();
}

export function releasesListHrefFromRelistParam(relist: string | null): string {
  const q = safeReleasesListSearchFromRelistParam(relist);
  return q ? `/admin/config/releases?${q}` : "/admin/config/releases";
}
