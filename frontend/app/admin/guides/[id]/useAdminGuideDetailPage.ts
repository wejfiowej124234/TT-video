import { useParams } from "next/navigation";
import { useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import { routes } from "@/lib/api";

import type { AdminGuideDetailRes } from "./adminGuideDetailPageModel";

export function useAdminGuideDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const guideId = decodeURIComponent(rawId.trim());

  const detailUrl = useMemo(() => (guideId ? routes.admin.guideById(guideId) : ""), [guideId]);

  const { body, loading, refreshing, error } = useAdminStandardDetailFetch<AdminGuideDetailRes>({
    scope: "guide-detail",
    context: "AdminGuideDetailPage",
    detailUrl,
    resourceId: guideId,
  });

  const guide = body?.guide && typeof body.guide === "object" ? body.guide : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  return { guideId, loading, refreshing, error, body, guide, meta };
}
