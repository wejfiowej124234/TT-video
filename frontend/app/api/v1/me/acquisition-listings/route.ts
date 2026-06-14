import { NextRequest, NextResponse } from "next/server";

import { proxyTraveltrustApi } from "@/lib/server/proxyTraveltrustApi";

/** 优先于 rewrite；与 `GET /api/v1/me/merchant-listings` 同源 · PD-009 收购轨 */
export async function GET(req: NextRequest) {
  const res = await proxyTraveltrustApi(req, "/api/v1/me/acquisition-listings", "GET", {
    tryAllApiBases: true,
  });
  if (process.env.NODE_ENV === "development" && res.status === 404) {
    return NextResponse.json({
      status: "ok",
      published: [],
      drafts: [],
      meta: { implementation_status: "me_acquisition_listings_dev_fallback", source: "next-proxy" },
    });
  }
  return res;
}
