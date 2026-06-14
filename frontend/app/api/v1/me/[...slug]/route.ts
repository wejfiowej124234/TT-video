import { NextRequest, NextResponse } from "next/server";

import { proxyTraveltrustApi } from "@/lib/server/proxyTraveltrustApi";

type SlugCtx = { params: Promise<{ slug: string[] }> };

function meUpstreamPath(slug: string[]): string {
  return `/api/v1/me/${slug.join("/")}`;
}

/** ① dev：`/api/v1/me/*` 兜底同源代理（新子路径未单独建 route 时避免 Next 404） */
export async function GET(req: NextRequest, ctx: SlugCtx) {
  const { slug } = await ctx.params;
  const upstreamPath = meUpstreamPath(slug);
  const res = await proxyTraveltrustApi(req, upstreamPath, "GET", { tryAllApiBases: true });

  if (
    process.env.NODE_ENV === "development" &&
    res.status === 404 &&
    upstreamPath.endsWith("/acquisition-listings")
  ) {
    return NextResponse.json({
      status: "ok",
      published: [],
      drafts: [],
      meta: { implementation_status: "me_acquisition_listings_dev_fallback", source: "next-proxy" },
    });
  }

  return res;
}

export async function PUT(req: NextRequest, ctx: SlugCtx) {
  const { slug } = await ctx.params;
  return proxyTraveltrustApi(req, meUpstreamPath(slug), "PUT", { tryAllApiBases: true });
}

export async function DELETE(req: NextRequest, ctx: SlugCtx) {
  const { slug } = await ctx.params;
  return proxyTraveltrustApi(req, meUpstreamPath(slug), "DELETE", { tryAllApiBases: true });
}
