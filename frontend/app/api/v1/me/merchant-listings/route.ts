import { NextRequest } from "next/server";

import { proxyTraveltrustApi } from "@/lib/server/proxyTraveltrustApi";

/** 优先于 rewrite；发布中心 / 商家工作台橱窗清单 */
export async function GET(req: NextRequest) {
  return proxyTraveltrustApi(req, "/api/v1/me/merchant-listings", "GET", { tryAllApiBases: true });
}
