import { NextRequest } from "next/server";

import { devApiOfflineResponse, proxyTraveltrustApi } from "@/lib/server/proxyTraveltrustApi";

/** 优先于 rewrite；与 `app/api/v1/admin/capabilities/route.ts` 同源，避免 dev rewrite → 浏览器 404。 */
export async function GET(req: NextRequest) {
  const res = await proxyTraveltrustApi(req, "/api/v1/admin/metrics/home-overview", "GET", {
    tryAllApiBases: true,
  });
  if (process.env.NODE_ENV === "development" && res.headers.get("x-tt-api-source") === "dev-api-offline") {
    return devApiOfflineResponse();
  }
  return res;
}
