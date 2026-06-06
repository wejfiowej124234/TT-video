import { NextResponse } from "next/server";
import { META_DEV_FALLBACK } from "@/lib/metaDevFallback";

const apiBase = () => (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");

function metaFetchTimeoutMs(): number {
  if (process.env.PLAYWRIGHT_FULL_STACK === "1") return 60_000;
  return 8_000;
}

async function fetchApiMeta(): Promise<Response> {
  return fetch(`${apiBase()}/meta`, {
    headers: { "x-request-id": `tt-meta-route-${Date.now()}` },
    signal: AbortSignal.timeout(metaFetchTimeoutMs()),
    cache: "no-store",
  });
}

/** 优先于 `next.config.js` rewrite；API 未起时 dev 返回 200 降级，避免控制台 proxy 500 */
export async function GET() {
  try {
    let res = await fetchApiMeta();
    if (!res.ok && process.env.PLAYWRIGHT_FULL_STACK === "1") {
      res = await fetchApiMeta();
    }
    if (res.ok) {
      const body = await res.text();
      return new NextResponse(body, {
        status: res.status,
        headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
      });
    }
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(META_DEV_FALLBACK);
    }
    return NextResponse.json({ status: "error", code: "meta_unavailable" }, { status: res.status });
  } catch {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(META_DEV_FALLBACK);
    }
    return NextResponse.json({ status: "error", code: "meta_unavailable" }, { status: 503 });
  }
}
