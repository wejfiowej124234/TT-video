import { NextRequest } from "next/server";

import { proxyTraveltrustApi } from "@/lib/server/proxyTraveltrustApi";

type Params = { params: Promise<{ suffix: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const { suffix } = await params;
  const encoded = encodeURIComponent(suffix);
  return proxyTraveltrustApi(req, `/api/v1/me/sessions/${encoded}`, "DELETE");
}
