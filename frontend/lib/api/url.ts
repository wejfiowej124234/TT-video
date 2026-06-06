/**
 * API 基地址与完整 URL 拼接（与 04 §三、crates/api 一致）。
 * 路径常量表见 `./routes.ts`，由 `lib/api.ts` 统一导出。
 */

const BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
    ? process.env.NEXT_PUBLIC_API_BASE_URL.trim().replace(/\/$/, "")
    : "http://127.0.0.1:8080";

export const apiBase = BASE;

function isLoopbackApiBase(base: string): boolean {
  try {
    const u = new URL(base);
    const h = u.hostname.toLowerCase();
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "[::1]" ||
      h === "::1" ||
      h === "0:0:0:0:0:0:0:1"
    );
  } catch {
    return false;
  }
}

function sameOriginApiPathInBrowser(path: string): string | null {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (typeof globalThis === "undefined") return null;
  const loc = (globalThis as { window?: { location?: { origin?: string } } }).window?.location;
  const origin = loc?.origin;
  if (typeof origin !== "string" || origin.length === 0) return null;
  return `${origin}${p}`;
}

/** 完整 URL（base + path）。浏览器 + loopback 基址时通常返回「当前页 origin + path」（经 `next.config.js` rewrites 代理）。
 * `/auth/*` 例外：App Router 在同路径有页面时 **afterFiles** rewrite 不覆盖，**POST** 会落到 Next 返回 HTML；开发态 API CORS 已放宽，须直连 `BASE`。
 * `/api/*`：**浏览器**优先「当前 origin + `/api/…`」经 rewrite 到 `BASE`，与 Bearer 同机 E2E（`localhost:3012` → `127.0.0.1:8080`）一致，避免直连跨 host 时偶发鉴权/预检差异；**无 `window`**（SSR / Vitest / Node）仍直连 `BASE`。
 */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (isLoopbackApiBase(BASE)) {
    if (p.startsWith("/auth/")) {
      return `${BASE}${p}`;
    }
    if (p.startsWith("/api/")) {
      const same = sameOriginApiPathInBrowser(p);
      if (same != null) return same;
      return `${BASE}${p}`;
    }
    const same = sameOriginApiPathInBrowser(p);
    if (same != null) return same;
  }
  return `${BASE}${p}`;
}
