import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import { formatCapsJson, type ObsBody } from "./adminTrustGrowthPageModel";

export function useAdminTrustGrowthPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [data, setData] = useState<ObsBody | null>(null);

  const [draftFrozen, setDraftFrozen] = useState(false);
  const [draftForce, setDraftForce] = useState(false);
  const [capsText, setCapsText] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [rollbackBusy, setRollbackBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorKind, setActionErrorKind] = useState<AdminFetchErrorKind | null>(null);

  const setActionErr = (kind: AdminFetchErrorKind, message: string) => {
    setActionErrorKind(kind);
    setActionError(message);
  };

  const clearActionErr = () => {
    setActionErrorKind(null);
    setActionError(null);
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const headers: Record<string, string> = { "x-request-id": `admin-tg-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      /* 401 handled below */
    }
    adminFetchJson<ObsBody>("AdminTrustGrowthPage", apiUrl(routes.admin.trustGrowthObservability), { headers })
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) throw new Error("forbidden");
        if (!res.ok) throw new Error((json as { error?: string }).error || `request_failed_${res.status}`);
        return json;
      })
      .then((json) => {
        setData(json);
        const c = json.control;
        if (c) {
          setDraftFrozen(!!c.weights_frozen);
          setDraftForce(!!c.force_control_only);
          setCapsText(formatCapsJson(c.variant_weight_caps as Record<string, number> | undefined));
        }
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminTrustGrowthPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function applyControl() {
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
      await load();
    } catch (e: unknown) {
      const kind = adminFetchErrorKind(e);
      setActionErr(kind, adminErrorUserText(kind, t));
    } finally {
      setSaving(false);
    }
  }

  async function rollback() {
    if (!window.confirm(t("admin_trust_growth_rollback_confirm"))) return;
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
      await load();
    } catch (e: unknown) {
      const kind = adminFetchErrorKind(e);
      setActionErr(kind, adminErrorUserText(kind, t));
    } finally {
      setRollbackBusy(false);
    }
  }

  return {
    loading,
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
