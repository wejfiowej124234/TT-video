/**
 * Production-grade www session (BATCH-A).
 * Opaque API token lives in an HttpOnly cookie on the Next origin.
 * Browser JS must not persist traveltrust_session_token.
 * Edge-safe — imported by middleware.
 */

export const WWW_SESSION_COOKIE = "traveltrust_session";
export const WWW_SESSION_OK_COOKIE = "traveltrust_session_ok";
export const WWW_USER_ID_COOKIE = "traveltrust_user_id";
export const WWW_SESSION_MAX_AGE_SEC = 60 * 60 * 8;

const SESSION_AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/logout",
  "/auth/refresh",
  "/auth/register",
]);

export function isWwwSessionAuthPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  return SESSION_AUTH_PATHS.has(p);
}

export function isWwwSessionAuthPost(method: string, pathname: string): boolean {
  return method.toUpperCase() === "POST" && isWwwSessionAuthPath(pathname);
}

export function wwwSessionApiBase(): string {
  const cands = [
    process.env.TRAVELTRUST_API_BASE_URL,
    process.env.API_REWRITE_TARGET,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    "http://127.0.0.1:8080",
  ];
  for (const raw of cands) {
    const t = raw?.trim().replace(/\/$/, "");
    if (!t) continue;
    try {
      const host = new URL(t).hostname.toLowerCase();
      if (host === "api.example.com" || host === "example.com" || host.endsWith(".example.com")) {
        continue;
      }
    } catch {
      continue;
    }
    return t;
  }
  return "http://127.0.0.1:8080";
}

export function extractSessionTokenFromAuthJson(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const rec = body as Record<string, unknown>;
  const nested = rec.data && typeof rec.data === "object" ? (rec.data as Record<string, unknown>) : null;
  const token = rec.token ?? nested?.token;
  return typeof token === "string" && token.trim() ? token.trim() : undefined;
}

export function extractUserIdFromAuthJson(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const rec = body as Record<string, unknown>;
  const nested = rec.data && typeof rec.data === "object" ? (rec.data as Record<string, unknown>) : null;
  const id = rec.user_id ?? nested?.user_id;
  return typeof id === "string" && id.trim() ? id.trim() : undefined;
}

export function redactSessionTokenFromAuthJson(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const rec = { ...(body as Record<string, unknown>) };
  if ("token" in rec) rec.token = null;
  if ("session_token" in rec) rec.session_token = null;
  if (rec.data && typeof rec.data === "object") {
    const data = { ...(rec.data as Record<string, unknown>) };
    if ("token" in data) data.token = null;
    if ("session_token" in data) data.session_token = null;
    rec.data = data;
  }
  return rec;
}

export type WwwSessionCookieOpts = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

export function wwwSessionCookieOpts(secure: boolean, maxAge = WWW_SESSION_MAX_AGE_SEC): WwwSessionCookieOpts {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function wwwPublicCookieOpts(secure: boolean, maxAge = WWW_SESSION_MAX_AGE_SEC): WwwSessionCookieOpts {
  return {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}
