import { useCallback, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import {
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
  type AdminFetchErrorKind,
  adminUserFacingErrorFromUnknown,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";
import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";

import {
  ABUSE_POLICY_KEYS,
  type AbusePolicyDraft,
  type AbusePolicyKey,
  type CommunityAbusePolicyPatchRes,
  abusePolicyErr,
  emptyAbusePolicyDraft,
} from "./adminCommunityAbusePolicyPageModel";

export function useAdminCommunityAbusePolicyPage() {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminAbusePolicyMetaBuild");
  const [draft, setDraft] = useState<AbusePolicyDraft>(() => emptyAbusePolicyDraft());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<AdminFetchErrorKind | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const setFormError = (kind: AdminFetchErrorKind, message: string) => {
    setErrorKind(kind);
    setError(message);
  };

  const clearFormError = () => {
    setErrorKind(null);
    setError(null);
  };

  const fieldLabel = useCallback((k: AbusePolicyKey) => t(`admin_abuse_field_${k}`), [t]);

  const setField = useCallback((k: AbusePolicyKey, v: string) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const submitImpl = useCallback(() => {
    const patch: Partial<Record<AbusePolicyKey, number>> = {};
    for (const k of ABUSE_POLICY_KEYS) {
      const raw = draft[k].trim();
      if (raw === "") continue;
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n)) {
        setFormError("invalid_request", t("admin_abuse_errBadNumber", { field: fieldLabel(k) }));
        return;
      }
      patch[k] = n;
    }
    if (Object.keys(patch).length === 0) {
      setFormError("invalid_request", t("admin_abuse_errEmpty"));
      return;
    }
    setSubmitting(true);
    clearFormError();
    setOk(null);
    let headers: Record<string, string>;
    try {
      headers = { ...writeRequestHeaders(), "Content-Type": "application/json" };
    } catch {
      setFormError("login_required", t("admin_policies_publishAuth"));
      setSubmitting(false);
      return;
    }
    void adminFetchJson<CommunityAbusePolicyPatchRes>(
      "AdminCommunityAbusePolicyPatch",
      apiUrl(routes.admin.communityAbusePolicy),
      { method: "PATCH", headers, body: JSON.stringify(patch) },
    )
      .then(({ res, body: b }) => {
        const err = typeof b?.error === "string" ? b.error : undefined;
        if (res.status === 400 && err) {
          setFormError("invalid_request", abusePolicyErr(err, t));
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminCommunityAbusePolicyPatch", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setDraft(emptyAbusePolicyDraft());
        setOk(t("admin_abuse_ok"));
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityAbusePolicyPatch", e);
        const facing = adminUserFacingErrorFromUnknown(e, t);
        setFormError(facing.kind, facing.message);
      })
      .finally(() => setSubmitting(false));
  }, [draft, fieldLabel, t]);

  const submit = useCallback(() => {
    for (const k of ABUSE_POLICY_KEYS) {
      const raw = draft[k].trim();
      if (raw === "") continue;
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n)) {
        setFormError("invalid_request", t("admin_abuse_errBadNumber", { field: fieldLabel(k) }));
        return;
      }
    }
    if (
      ABUSE_POLICY_KEYS.every((k) => draft[k].trim() === "")
    ) {
      setFormError("invalid_request", t("admin_abuse_errEmpty"));
      return;
    }
    requestConfirm({
      titleKey: "admin_l5_confirm_title_write",
      descKey: "admin_l5_confirm_desc_abuse_policy",
      onConfirm: () => submitImpl(),
    });
  }, [draft, fieldLabel, requestConfirm, submitImpl, t]);

  return {
    buildMeta,
    buildLoading,
    buildError,
    draft,
    setField,
    fieldLabel,
    submitting,
    error,
    errorKind,
    ok,
    submit,
  };
}
