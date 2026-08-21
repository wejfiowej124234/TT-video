import { NextRequest, NextResponse } from "next/server";
import { WWW_SESSION_COOKIE } from "@/lib/auth/wwwSessionCookie";

export function traveltrustApiBaseCandidates(): string[] {
  const seen = new Set<string>();
  const add = (raw?: string) => {
    const t = raw?.trim();
    if (!t) return;
    const b = t.replace(/\/$/, "");
    // Skip deploy placeholders — Official fly.toml historically set api.example.com.
    try {
      const host = new URL(b).hostname.toLowerCase();
      if (host === "api.example.com" || host === "example.com" || host.endsWith(".example.com")) {
        return;
      }
    } catch {
      return;
    }
    seen.add(b);
  };
  add(process.env.TRAVELTRUST_API_BASE_URL);
  add(process.env.API_REWRITE_TARGET);
  add(process.env.NEXT_PUBLIC_API_BASE_URL);
  add("http://127.0.0.1:8080");
  add("http://localhost:8080");
  return [...seen];
}

const apiBase = () => traveltrustApiBaseCandidates()[0] ?? "http://127.0.0.1:8080";

const UPSTREAM_TIMEOUT_MS = 20_000;
const TRANSIT_RETRY_STATUSES = new Set([408, 429, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** ① dev：localhost ↔ 127.0.0.1 回退，避免 Windows 上只监听其一导致 capabilities 404→503。 */
async function fetchUpstreamWithLoopbackFallback(
  url: string,
  init: RequestInit,
): Promise<Response> {
  let res = await fetch(url, init);
  if (res.status !== 404) return res;
  try {
    const u = new URL(url);
    const alt =
      u.hostname === "localhost"
        ? "127.0.0.1"
        : u.hostname === "127.0.0.1"
          ? "localhost"
          : null;
    if (!alt) return res;
    u.hostname = alt;
    const retry = await fetch(u.toString(), init);
    if (retry.status !== 404) return retry;
  } catch {
    /* keep first res */
  }
  return res;
}

async function fetchUpstreamWithTransitRetry(
  url: string,
  init: RequestInit,
  attempts = 4,
): Promise<Response> {
  let last: Response | null = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetchUpstreamWithLoopbackFallback(url, init);
      last = res;
      if (TRANSIT_RETRY_STATUSES.has(res.status) && attempt < attempts - 1) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      return res;
    } catch (e) {
      if (attempt < attempts - 1) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
  return last!;
}

export function forwardApiHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  const auth = req.headers.get("authorization");
  const userId = req.headers.get("x-user-id");
  const requestId = req.headers.get("x-request-id");
  const idem = req.headers.get("idempotency-key") ?? req.headers.get("x-idempotency-key");
  const admin2fa = req.headers.get("x-traveltrust-admin-2fa-session");
  if (auth) {
    headers.set("authorization", auth);
  } else {
    const tok = req.cookies.get(WWW_SESSION_COOKIE)?.value?.trim();
    if (tok) headers.set("authorization", `Bearer ${tok}`);
  }
  if (userId) headers.set("x-user-id", userId);
  if (admin2fa) headers.set("x-traveltrust-admin-2fa-session", admin2fa);
  if (requestId) headers.set("x-request-id", requestId);
  if (idem) {
    headers.set("idempotency-key", idem);
    headers.set("x-idempotency-key", idem);
  }
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  return headers;
}

export function devApiOfflineResponse() {
  return NextResponse.json(
    { status: "error", code: "login_required", message: "traveltrust-api offline (dev)" },
    { status: 401, headers: { "x-tt-api-source": "dev-api-offline" } },
  );
}

async function fetchUpstreamBestEffort(
  bases: string[],
  upstreamPath: string,
  query: string,
  init: RequestInit,
): Promise<{ res: Response; baseUsed: string }> {
  let last: { res: Response; baseUsed: string } | null = null;
  let lastErr: unknown = null;
  for (const base of bases) {
    const url = `${base}${upstreamPath}${query}`;
    try {
      const res = await fetchUpstreamWithTransitRetry(url, init);
      last = { res, baseUsed: base };
      lastErr = null;
      // Try next base on hard upstream miss / gateway death; keep first non-404 otherwise.
      if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504) {
        continue;
      }
      return last;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  if (last) return last;
  throw lastErr instanceof Error ? lastErr : new Error("api_upstream_unreachable");
}

/** 同源转发至 traveltrust-api（① · 避免 Next rewrite ECONNREFUSED → 浏览器 404/500） */
export async function proxyTraveltrustApi(
  req: NextRequest,
  upstreamPath: string,
  method: "GET" | "PUT" | "DELETE",
  opts?: { tryAllApiBases?: boolean },
): Promise<NextResponse> {
  const headers = forwardApiHeaders(req);
  const auth = req.headers.get("authorization");
  const userId = req.headers.get("x-user-id");
  const query = req.nextUrl.search;
  const bases = opts?.tryAllApiBases ? traveltrustApiBaseCandidates() : [apiBase()];

  try {
    const init: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    };
    if (method === "PUT") {
      init.body = await req.text();
    }
    const { res, baseUsed } = await fetchUpstreamBestEffort(bases, upstreamPath, query, init);
    if (
      process.env.NODE_ENV === "development" &&
      (res.status === 502 || res.status === 503 || res.status === 504)
    ) {
      return devApiOfflineResponse();
    }
    if (
      process.env.NODE_ENV === "development" &&
      res.status === 404 &&
      upstreamPath.includes("/api/v1/admin/capabilities")
    ) {
      const upstream = `${baseUsed}${upstreamPath}`;
      return NextResponse.json(
        {
          status: "error",
          code: "admin_capabilities_route_missing",
          message:
            "traveltrust-api 未暴露 GET /api/v1/admin/capabilities；8080 上可能是旧进程或其它服务。请执行: powershell -File scripts/dev/restart-api-local.ps1 或 cargo run -p traveltrust-api",
          upstream,
          upstream_http_status: 404,
          tried_api_bases: bases,
        },
        { status: 503, headers: { "x-tt-api-source": "admin-capabilities-missing" } },
      );
    }
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    if (process.env.NODE_ENV === "development") {
      return devApiOfflineResponse();
    }
    if (!auth && !userId) {
      return NextResponse.json({ status: "error", code: "login_required" }, { status: 401 });
    }
    return NextResponse.json({ status: "error", code: "api_unavailable" }, { status: 503 });
  }
}
