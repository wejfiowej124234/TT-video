import { NextRequest } from "next/server";

import { proxyTraveltrustApi } from "@/lib/server/proxyTraveltrustApi";

export async function GET(req: NextRequest) {
  return proxyTraveltrustApi(req, "/api/v1/me/sessions", "GET");
}
