import { NextRequest, NextResponse } from "next/server";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  /** 曾用 `/market/travel` 的旧书签 → 主入口 `/market` */
  if (pathname === "/market/travel" || pathname === "/market/travel/") {
    const url = request.nextUrl.clone();
    url.pathname = "/market";
    return NextResponse.redirect(url);
  }
  /** 29 §10：/discover → 自由市场主界面 `/market`（保留 query/hash） */
  if (pathname === "/discover" || pathname === "/discover/") {
    const url = request.nextUrl.clone();
    url.pathname = "/market";
    return NextResponse.redirect(url);
  }

  if (!isAdminPath(pathname)) {
    return NextResponse.next();
  }

  const uid = request.cookies.get("traveltrust_user_id")?.value?.trim();
  if (uid) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.searchParams.set("returnUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/discover", "/discover/", "/market/travel", "/market/travel/", "/admin/:path*"],
};
