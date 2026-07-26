import { useParams } from "next/navigation";
import { useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import type { AdminAcquisitionPublishSuspendSnapshot } from "@/components/admin/AdminAcquisitionPublishSuspendCard";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import { routes } from "@/lib/api";

import { type AdminUserDetailRes } from "./adminUserDetailPageModel";

export function useAdminUserDetailPage() {
  const params = useParams();
  const userId = useMemo(() => {
    const raw = typeof params?.id === "string" ? params.id : "";
    return decodeURIComponent(raw.trim());
  }, [params]);

  const detailUrl = useMemo(() => (userId ? routes.admin.userById(userId) : ""), [userId]);

  const { body, loading, refreshing, error } = useAdminStandardDetailFetch<AdminUserDetailRes>({
    scope: "user-detail",
    context: "AdminUserDetailPage",
    detailUrl,
    resourceId: userId,
  });

  const user = body?.user && typeof body.user === "object" ? body.user : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;
  const identitySlots = Array.isArray(body?.identity_slots) ? body.identity_slots : [];
  const identitySlotsSource =
    typeof body?.identity_slots_source === "string" ? body.identity_slots_source : null;
  const roleApplications = Array.isArray(body?.role_applications) ? body.role_applications : [];
  const roleApplicationsSource =
    typeof body?.role_applications_source === "string" ? body.role_applications_source : null;

  const acquisitionSuspendInitial: AdminAcquisitionPublishSuspendSnapshot | null = useMemo(() => {
    if (!user) return null;
    if (typeof user.acquisition_publish_suspended !== "boolean") return null;
    const until = user.acquisition_publish_suspended_until;
    return {
      acquisition_publish_suspended: user.acquisition_publish_suspended,
      acquisition_publish_suspended_until:
        typeof until === "string" ? until : until === null ? null : undefined,
    };
  }, [user]);

  return {
    userId,
    loading,
    refreshing,
    error,
    user,
    meta,
    acquisitionSuspendInitial,
    identitySlots,
    identitySlotsSource,
    roleApplications,
    roleApplicationsSource,
  };
}
