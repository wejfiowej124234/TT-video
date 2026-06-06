import { NextResponse } from "next/server";

import { TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK } from "@/lib/traveltrustPageBrief";

const apiBase = () => (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");

/** 优先于 rewrite；API 未起时避免 proxy ECONNREFUSED → 浏览器 500（PH1-FE-02 · 与 /api/v1/me 同源） */
export async function GET() {
  try {
    const res = await fetch(`${apiBase()}/api/v1/traveltrust/page-brief`, {
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) {
      const usePublicFallback =
        process.env.NODE_ENV === "development" || res.status === 401 || res.status === 403;
      if (usePublicFallback) {
        return NextResponse.json(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK, {
          status: 200,
          headers: {
            "x-tt-page-brief-source": "dev-fallback",
            "x-tt-page-brief-upstream-status": String(res.status),
          },
        });
      }
    }
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK, {
        status: 200,
        headers: { "x-tt-page-brief-source": "dev-fallback" },
      });
    }
    return NextResponse.json(
      { status: "error", code: "api_unavailable", message: "traveltrust-api offline" },
      { status: 503 },
    );
  }
}
