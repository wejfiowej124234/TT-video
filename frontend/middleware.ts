import { NextRequest, NextResponse } from "next/server";
import {
  extractSessionTokenFromAuthJson,
  extractUserIdFromAuthJson,
  isWwwSessionAuthPost,
  redactSessionTokenFromAuthJson,
  WWW_SESSION_COOKIE,
  WWW_SESSION_OK_COOKIE,
  WWW_USER_ID_COOKIE,
  wwwPublicCookieOpts,
  wwwSessionApiBase,
  wwwSessionCookieOpts,
} from "@/lib/auth/wwwSessionCookie";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isApiV1Path(pathname: string): boolean {
  return pathname === "/api/v1" || pathname.startsWith("/api/v1/");
}

function withBearerFromWwwSession(request: NextRequest): NextResponse {
  const tok = request.cookies.get(WWW_SESSION_COOKIE)?.value?.trim();
  if (!tok || request.headers.get("authorization")?.trim()) {
    return NextResponse.next();
  }
  const headers = new Headers(request.headers);
  headers.set("authorization", `Bearer ${tok}`);
  return NextResponse.next({ request: { headers } });
}

function applySessionCookies(
  res: NextResponse,
  opts: { token?: string; userId?: string; secure: boolean; clear?: boolean },
): void {
  const secure = opts.secure;
  if (opts.clear) {
    const gone = { ...wwwSessionCookieOpts(secure), maxAge: 0 };
    const gonePublic = { ...wwwPublicCookieOpts(secure), maxAge: 0 };
    res.cookies.set(WWW_SESSION_COOKIE, "", gone);
    res.cookies.set(WWW_SESSION_OK_COOKIE, "", gonePublic);
    res.cookies.set(WWW_USER_ID_COOKIE, "", gonePublic);
    return;
  }
  if (opts.token) {
    res.cookies.set(WWW_SESSION_COOKIE, opts.token, wwwSessionCookieOpts(secure));
    res.cookies.set(WWW_SESSION_OK_COOKIE, "1", wwwPublicCookieOpts(secure));
  }
  if (opts.userId) {
    res.cookies.set(WWW_USER_ID_COOKIE, opts.userId, wwwPublicCookieOpts(secure));
  }
}

async function proxyWwwSessionAuth(request: NextRequest): Promise<NextResponse> {
  try {
    return await proxyWwwSessionAuthInner(request);
  } catch {
    return NextResponse.json(
      { status: "error", code: "auth_bff_upstream_unavailable", message: "session hop unavailable" },
      { status: 502 },
    );
  }
}

async function proxyWwwSessionAuthInner(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const apiBase = wwwSessionApiBase();
  const upstreamUrl = `${apiBase}${pathname}${request.nextUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const requestId = request.headers.get("x-request-id");
  const idem = request.headers.get("idempotency-key") ?? request.headers.get("x-idempotency-key");
  if (contentType) headers.set("content-type", contentType);
  if (requestId) headers.set("x-request-id", requestId);
  if (idem) {
    headers.set("idempotency-key", idem);
    headers.set("x-idempotency-key", idem);
  }
  const existingAuth = request.headers.get("authorization")?.trim();
  const cookieTok = request.cookies.get(WWW_SESSION_COOKIE)?.value?.trim();
  if (existingAuth) headers.set("authorization", existingAuth);
  else if (cookieTok) headers.set("authorization", `Bearer ${cookieTok}`);

  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers,
    body: await request.text(),
    cache: "no-store",
    redirect: "manual",
  });

  const raw = await upstream.text();
  let payload: unknown = raw;
  let textOut = raw;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    payload = null;
  }

  const secure = request.nextUrl.protocol === "https:";
  const isLoginOrRegister = pathname.replace(/\/$/, "") === "/auth/login" || pathname.replace(/\/$/, "") === "/auth/register";
  const isLogout = pathname.replace(/\/$/, "") === "/auth/logout";
  const isRefresh = pathname.replace(/\/$/, "") === "/auth/refresh";

  if (payload && typeof payload === "object" && (isLoginOrRegister || isRefresh) && upstream.ok) {
    const token = extractSessionTokenFromAuthJson(payload);
    const userId = extractUserIdFromAuthJson(payload);
    const redacted = redactSessionTokenFromAuthJson(payload);
    textOut = JSON.stringify(redacted);
    payload = redacted;
    const contentTypeOut = upstream.headers.get("content-type") || "application/json";
    const res = new NextResponse(textOut, {
      status: upstream.status,
      headers: { "content-type": contentTypeOut },
    });
    if (token) applySessionCookies(res, { token, userId, secure });
    return res;
  }

  const contentTypeOut = upstream.headers.get("content-type") || "application/json";
  const res = new NextResponse(textOut, {
    status: upstream.status,
    headers: { "content-type": contentTypeOut },
  });
  if (isLogout && upstream.ok) {
    applySessionCookies(res, { secure, clear: true });
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/market/travel" || pathname === "/market/travel/") {
    const url = request.nextUrl.clone();
    url.pathname = "/market";
    return NextResponse.redirect(url);
  }
  if (pathname === "/discover" || pathname === "/discover/") {
    const url = request.nextUrl.clone();
    url.pathname = "/market";
    return NextResponse.redirect(url);
  }

  if (isWwwSessionAuthPost(request.method, pathname)) {
    return proxyWwwSessionAuth(request);
  }

  if (isApiV1Path(pathname)) {
    return withBearerFromWwwSession(request);
  }

  if (!isAdminPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(WWW_SESSION_COOKIE)?.value?.trim();
  if (session) {
    return withBearerFromWwwSession(request);
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.searchParams.set("returnUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/discover",
    "/discover/",
    "/market/travel",
    "/market/travel/",
    "/auth/login",
    "/auth/logout",
    "/auth/refresh",
    "/auth/register",
    "/api/v1/:path*",
    "/admin",
    "/admin/",
    "/admin/:path*",
  ],
};
