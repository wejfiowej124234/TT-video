// search-params gate: parent route provides Suspense boundary.
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import { releasesListHrefFromRelistParam } from "@/lib/adminConfigReleasesNav";
import { routes } from "@/lib/api";

import type { AdminConfigReleaseDetailRes } from "./adminConfigReleaseDetailPageModel";

export function useAdminConfigReleaseDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const releasesListHref = useMemo(
    () => releasesListHrefFromRelistParam(searchParams.get("relist")),
    [searchParams],
  );
  const releaseId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);

  const detailUrl = useMemo(
    () => (releaseId ? routes.admin.configRelease(releaseId) : ""),
    [releaseId],
  );

  const { body: data, loading, refreshing, error } = useAdminStandardDetailFetch<AdminConfigReleaseDetailRes>({
    scope: "config-release-detail",
    context: "AdminConfigReleaseDetailPage",
    detailUrl,
    resourceId: releaseId,
  });

  const release = data?.release;
  const meta = data && isAdminMetaRecord(data.meta) ? data.meta : null;

  return { releaseId, releasesListHref, loading, refreshing, error, data, release, meta };
}
