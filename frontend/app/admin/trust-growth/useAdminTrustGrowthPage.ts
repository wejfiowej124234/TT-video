import { useCallback, useEffect, useMemo, useState } from "react";

import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { useTranslation } from "@/components/LocaleProvider";
import {
  adminErrorUserText,
  adminFetchErrorKind,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import {
  type AdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";

import {
  ADMIN_TRUST_GROWTH_OBS_META_KEY,
  formatCapsJson,
  type ObsBody,
} from "./adminTrustGrowthPageModel";

function trustGrowthObsToSnapshot(body: AdminStandardListBody<never> & ObsBody): AdminListFetchSnapshot<never> {
  return {
    items: [],
    appliedFilters: null,
    meta: {
      [ADMIN_TRUST_GROWTH_OBS_META_KEY]: body,
    },
  };
}

function syncTrustGrowthDraftsFromObs(data: ObsBody | null) {
  const c = data?.control;
  if (!c) return null;
  return {
    frozen: !!c.weights_frozen,
    force: !!c.force_control_only,
    capsText: formatCapsJson(c.variant_weight_caps as Record<string, number> | undefined),
  };
}

export function useAdminTrustGrowthPage() {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [reloadTick, setReloadTick] = useState(0);

  const { meta: rawMeta, loading, refreshing, error } = useAdminStandardListFetch<never>({
    scope: "trust-growth-obs",
    context: "AdminTrustGrowthPage",
    listUrl: routes.admin.trustGrowthObservability,
    refreshToken: reloadTick,
    toSnapshot: trustGrowthObsToSnapshot,
  });

  const data = useMemo((): ObsBody | null => {
    const raw = rawMeta?.[ADMIN_TRUST_GROWTH_OBS_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as ObsBody;
    }
    return null;
  }, [rawMeta]);

  const [draftFrozen, setDraftFrozen] = useState(false);
  const [draftForce, setDraftForce] = useState(false);
  const [capsText, setCapsText] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [rollbackBusy, setRollbackBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorKind, setActionErrorKind] = useState<AdminFetchErrorKind | null>(null);

  useEffect(() => {
    const next = syncTrustGrowthDraftsFromObs(data);
    if (!next) return;
    setDraftFrozen(next.frozen);
    setDraftForce(next.force);
    setCapsText(next.capsText);
  }, [data]);

  const setActionErr = (kind: AdminFetchErrorKind, message: string) => {
    setActionErrorKind(kind);
    setActionError(message);
  };

  const clearActionErr = () => {
    setActionErrorKind(null);
    setActionError(null);
  };

  const load = useCallback(() => {
    setReloadTick((x) => x + 1);
  }, []);

  async function applyControlImpl() {
    clearActionErr();
    let capsJson: Record<string, number>;
    try {
      const parsed = JSON.parse(capsText || "{}") as unknown;
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("caps_not_object");
      }
      capsJson = parsed as Record<string, number>;
    } catch {
      setActionErr("invalid_request", t("admin_trust_growth_err_caps_json"));
      return;
    }

    setSaving(true);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-request-id": `admin-tg-patch-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      setActionErr("login_required", t("admin_trust_growth_err_auth"));
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(apiUrl(routes.admin.trustGrowthControl), {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          weights_frozen: draftFrozen,
          force_control_only: draftForce,
          variant_weight_caps: capsJson,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (res.status === 401 || res.status === 403) {
        setActionErr("forbidden", t("admin_observability_forbidden"));
        return;
      }
      if (!res.ok) {
        const code = j.error ?? `request_failed_${res.status}`;
        setActionErr(adminFetchErrorKind(new Error(code)), j.message || j.error || t("admin_requestFailed"));
        return;
      }
      load();
    } catch (e: unknown) {
      const kind = adminFetchErrorKind(e);
      setActionErr(kind, adminErrorUserText(kind, t));
    } finally {
      setSaving(false);
    }
  }

  async function rollbackImpl() {
    clearActionErr();
    setRollbackBusy(true);
    const headers: Record<string, string> = {
      "x-request-id": `admin-tg-rb-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      setActionErr("login_required", t("admin_trust_growth_err_auth"));
      setRollbackBusy(false);
      return;
    }
    try {
      const res = await fetch(apiUrl(routes.admin.trustGrowthRollbackControl), {
        method: "POST",
        headers,
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (res.status === 401 || res.status === 403) {
        setActionErr("forbidden", t("admin_observability_forbidden"));
        return;
      }
      if (!res.ok) {
        const code = j.error ?? `request_failed_${res.status}`;
        setActionErr(adminFetchErrorKind(new Error(code)), j.message || j.error || t("admin_requestFailed"));
        return;
      }
      load();
    } catch (e: unknown) {
      const kind = adminFetchErrorKind(e);
      setActionErr(kind, adminErrorUserText(kind, t));
    } finally {
      setRollbackBusy(false);
    }
  }

  const applyControl = useCallback(() => {
    requestConfirm({
      titleKey: "admin_l5_confirm_title_write",
      descKey: "admin_l5_confirm_desc_apply_control",
      onConfirm: () => applyControlImpl(),
    });
  }, [requestConfirm, draftFrozen, draftForce, capsText, t]);

  const rollback = useCallback(() => {
    requestConfirm({
      titleKey: "admin_l5_confirm_title_danger",
      descKey: "admin_trust_growth_rollback_confirm",
      danger: true,
      confirmLabelKey: "admin_trust_growth_rollback",
      onConfirm: () => rollbackImpl(),
    });
  }, [requestConfirm, t]);

  return {
    loading,
    refreshing,
    error,
    data,
    draftFrozen,
    setDraftFrozen,
    draftForce,
    setDraftForce,
    capsText,
    setCapsText,
    saving,
    rollbackBusy,
    actionError,
    actionErrorKind,
    load,
    applyControl,
    rollback,
  };
}
