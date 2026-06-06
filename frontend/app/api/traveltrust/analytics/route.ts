import { NextResponse } from "next/server";

/** ① 本地埋点收口（TT-PH1-050 partial）；② 生产 ingest 由 `NEXT_PUBLIC_TRAVELTRUST_ANALYTICS_BEACON` 指向真实服务 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[traveltrust-analytics]", body);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
