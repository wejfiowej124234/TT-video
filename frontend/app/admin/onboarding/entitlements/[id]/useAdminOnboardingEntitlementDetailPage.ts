import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";

import { type EntitlementRes } from "./adminOnboardingEntitlementDetailPageModel";

export function useAdminOnboardingEntitlementDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const caps = useAdminCapabilities();
  const canWrite = caps.hasPermission(ADMIN_PERM.ONBOARDING_WRITE);
  const requestConfirm = useAdminL5ConfirmRequest();

  const [refreshToken, setRefreshToken] = useState(0);
  const detailUrl = id ? routes.admin.entitlementById(id) : "";

  const { body, loading, refreshing, error } = useAdminStandardDetailFetch<EntitlementRes>({
    scope: "onboarding-entitlement-detail",
    context: "AdminOnboardingEntitlementDetail",
    detailUrl,
    resourceId: id,
    refreshToken,
  });

  const ent = body?.entitlement && typeof body.entitlement === "object" ? body.entitlement : null;

  const [metaJson, setMetaJson] = useState('{"dispute_flag":false}');
  const [revokeReason, setRevokeReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ent?.metadata && typeof ent.metadata === "object") {
      setMetaJson(JSON.stringify((ent.metadata as Record<string, unknown>).admin ?? {}, null, 2));
    }
  }, [ent]);

  const bumpRefresh = () => setRefreshToken((n) => n + 1);

  const patchMetadataImpl = async () => {
    if (!canWrite || !id) return;
    setBusy(true);
    setActionMsg(null);
    try {
      let admin: unknown;
      try {
        admin = JSON.parse(metaJson) as unknown;
      } catch {
        setActionMsg(t("admin_onb_ent_invalid_json"));
        return;
      }
      const headers = {
        ...writeRequestHeaders(`admin-onb-patch-${id}-${Date.now()}`),
        "x-request-id": `admin-onb-patch-${Date.now()}`,
      };
      const { res, body: resBody } = await adminFetchJson<EntitlementRes>(
        "AdminOnboardingEntitlementPatch",
        apiUrl(routes.admin.entitlementById(id)),
        { method: "PATCH", headers, body: JSON.stringify({ admin }) },
      );
      if (!res.ok) {
        setActionMsg(
          adminErrorUserText(
            adminFetchErrorKind(new Error((resBody as { error?: string }).error ?? "failed")),
            t,
          ),
        );
        return;
      }
      setActionMsg(t("admin_onb_ent_patch_ok"));
      bumpRefresh();
    } catch (e) {
      setActionMsg(adminErrorUserText(adminFetchErrorKind(e), t));
    } finally {
      setBusy(false);
    }
  };

  const revokeImpl = async () => {
    if (!canWrite || !id || !revokeReason.trim()) return;
    setBusy(true);
    setActionMsg(null);
    try {
      const headers = {
        ...writeRequestHeaders(`admin-onb-revoke-${id}-${Date.now()}`),
        "x-request-id": `admin-onb-revoke-${Date.now()}`,
      };
      const { res, body: resBody } = await adminFetchJson<EntitlementRes>(
        "AdminOnboardingEntitlementRevoke",
        apiUrl(routes.admin.entitlementRevoke(id)),
        { method: "POST", headers, body: JSON.stringify({ reason: revokeReason.trim() }) },
      );
      if (!res.ok) {
        setActionMsg(
          adminErrorUserText(
            adminFetchErrorKind(new Error((resBody as { error?: string }).error ?? "failed")),
            t,
          ),
        );
        return;
      }
      setActionMsg(t("admin_onb_ent_revoke_ok"));
      bumpRefresh();
    } catch (e) {
      setActionMsg(adminErrorUserText(adminFetchErrorKind(e), t));
    } finally {
      setBusy(false);
    }
  };

  const patchMetadata = useCallback(() => {
    requestConfirm({
      titleKey: "admin_l5_confirm_title_write",
      descKey: "admin_l5_confirm_desc_entitlement_patch",
      onConfirm: () => patchMetadataImpl(),
    });
  }, [requestConfirm]);

  const revoke = useCallback(() => {
    if (!revokeReason.trim()) return;
    requestConfirm({
      titleKey: "admin_l5_confirm_title_danger",
      descKey: "admin_l5_confirm_desc_entitlement_revoke",
      danger: true,
      onConfirm: () => revokeImpl(),
    });
  }, [requestConfirm, revokeReason]);

  return {
    id,
    canWrite,
    loading,
    refreshing,
    error,
    ent,
    metaJson,
    setMetaJson,
    revokeReason,
    setRevokeReason,
    busy,
    actionMsg,
    patchMetadata,
    revoke,
  };
}
