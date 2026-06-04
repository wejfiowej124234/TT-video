import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, writeRequestHeaders } from "@/lib/apiClient";

import { type EntitlementRes } from "./adminOnboardingEntitlementDetailPageModel";

export function useAdminOnboardingEntitlementDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const caps = useAdminCapabilities();
  const canWrite = caps.hasPermission(ADMIN_PERM.ONBOARDING_WRITE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [ent, setEnt] = useState<Record<string, unknown> | null>(null);
  const [metaJson, setMetaJson] = useState('{"dispute_flag":false}');
  const [revokeReason, setRevokeReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { ...getAuthHeaders(), "x-request-id": `admin-onb-ent-${Date.now()}` };
      const { res, body } = await adminFetchJson<EntitlementRes>(
        "AdminOnboardingEntitlementDetail",
        apiUrl(routes.admin.entitlementById(id)),
        { headers },
      );
      if (!res.ok) {
        setError(adminFetchErrorKind(new Error((body as { error?: string }).error ?? "failed")));
        setEnt(null);
        return;
      }
      const e = body.entitlement ?? null;
      setEnt(e);
      if (e?.metadata && typeof e.metadata === "object") {
        setMetaJson(JSON.stringify((e.metadata as Record<string, unknown>).admin ?? {}, null, 2));
      }
    } catch (e) {
      logAdminFetch("AdminOnboardingEntitlementDetail", e);
      setError(adminFetchErrorKind(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchMetadata = async () => {
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
      const { res, body } = await adminFetchJson<EntitlementRes>(
        "AdminOnboardingEntitlementPatch",
        apiUrl(routes.admin.entitlementById(id)),
        { method: "PATCH", headers, body: JSON.stringify({ admin }) },
      );
      if (!res.ok) {
        setActionMsg(
          adminErrorUserText(
            adminFetchErrorKind(new Error((body as { error?: string }).error ?? "failed")),
            t,
          ),
        );
        return;
      }
      setActionMsg(t("admin_onb_ent_patch_ok"));
      void load();
    } catch (e) {
      setActionMsg(adminErrorUserText(adminFetchErrorKind(e), t));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    if (!canWrite || !id || !revokeReason.trim()) return;
    setBusy(true);
    setActionMsg(null);
    try {
      const headers = {
        ...writeRequestHeaders(`admin-onb-revoke-${id}-${Date.now()}`),
        "x-request-id": `admin-onb-revoke-${Date.now()}`,
      };
      const { res, body } = await adminFetchJson<EntitlementRes>(
        "AdminOnboardingEntitlementRevoke",
        apiUrl(routes.admin.entitlementRevoke(id)),
        { method: "POST", headers, body: JSON.stringify({ reason: revokeReason.trim() }) },
      );
      if (!res.ok) {
        setActionMsg(
          adminErrorUserText(
            adminFetchErrorKind(new Error((body as { error?: string }).error ?? "failed")),
            t,
          ),
        );
        return;
      }
      setActionMsg(t("admin_onb_ent_revoke_ok"));
      void load();
    } catch (e) {
      setActionMsg(adminErrorUserText(adminFetchErrorKind(e), t));
    } finally {
      setBusy(false);
    }
  };

  return {
    id,
    canWrite,
    loading,
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
