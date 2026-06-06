import { NextRequest } from "next/server";

import { devApiOfflineResponse, proxyTraveltrustApi } from "@/lib/server/proxyTraveltrustApi";

async function proxyMe(req: NextRequest, method: "GET" | "PUT") {
  const res = await proxyTraveltrustApi(req, "/api/v1/me", method, { tryAllApiBases: true });
  if (process.env.NODE_ENV === "development" && res.headers.get("x-tt-api-source") === "dev-api-offline") {
    return devApiOfflineResponse();
  }
  return res;
}

/** 优先于 rewrite；API 未起时避免 Next proxy ECONNREFUSED → 浏览器 500 */
export async function GET(req: NextRequest) {
  return proxyMe(req, "GET");
}

/** 设置偏好等 `PUT /api/v1/me`（通知 / 社区可见性 · ①） */
export async function PUT(req: NextRequest) {
  return proxyMe(req, "PUT");
}
