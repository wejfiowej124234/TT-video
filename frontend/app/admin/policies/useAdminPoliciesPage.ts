// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { useAdminFormErrorState } from "@/lib/admin/adminFormErrorState";
import {
  adminFetchJson,
  adminLogApiJsonStatus,
  adminUserFacingErrorFromUnknown,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import {
  BINDING_ROLE_MAX,
  POLICY_CODE_MAX,
  SCOPE_TYPE_MAX,
  type AdminPolicyPublishStatus,
} from "./adminPoliciesPageConstants";
import { buildPoliciesListPath, parsePoliciesListQuery } from "./adminPoliciesPageQuery";
import type { AdminPolicyPublishRes, AdminPolicyRow } from "./adminPoliciesPageTypes";

export function useAdminPoliciesPage() {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const pageTitleId = useId();
  const limitInputId = useId();
  const policyCodeInputId = useId();
  const statusSelectId = useId();
  const scopeTypeInputId = useId();
  const bindingRoleInputId = useId();
  const publishDialogTitleId = useId();
  const publishDialogDescId = useId();
  const publishModalFilterHintId = useId();
  const adminFilterHintId = useId();
  const policiesActiveCodeDescId = useId();
  const policiesActiveStatusDescId = useId();
  const policiesActiveScopeTypeDescId = useId();
  const policiesActiveBindingRoleDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, policyCode, status, scopeType, bindingRole } = useMemo(
    () => parsePoliciesListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [reloadTick, setReloadTick] = useState(0);

  const listUrl = useMemo(
    () =>
      routes.admin.policies({
        limit,
        ...(policyCode ? { policy_code: policyCode } : {}),
        ...(status === "draft" || status === "active" || status === "deprecated" ? { status } : {}),
        ...(scopeType ? { scope_type: scopeType } : {}),
        ...(bindingRole ? { binding_role: bindingRole } : {}),
      }),
    [limit, policyCode, status, scopeType, bindingRole],
  );

  const {
    items,
    meta,
    appliedFilters,
    loading,
    refreshing,
    error,
  } = useAdminStandardListFetch<AdminPolicyRow>({
    scope: "policies",
    context: "AdminPoliciesPage",
    listUrl,
    refreshToken: reloadTick,
  });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftPolicyCode, setDraftPolicyCode] = useState(policyCode);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftScopeType, setDraftScopeType] = useState(scopeType);
  const [draftBindingRole, setDraftBindingRole] = useState(bindingRole);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftPolicyCode(policyCode);
    setDraftStatus(status);
    setDraftScopeType(scopeType);
    setDraftBindingRole(bindingRole);
  }, [limit, policyCode, status, scopeType, bindingRole]);

  const [publishRow, setPublishRow] = useState<AdminPolicyRow | null>(null);
  const [publishStatus, setPublishStatus] = useState<AdminPolicyPublishStatus>("active");
  const [publishVersion, setPublishVersion] = useState("");
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const publishFormError = useAdminFormErrorState();

  const closePublish = useCallback(() => {
    setPublishRow(null);
    publishFormError.clearError();
  }, [publishFormError]);

  const openPublish = useCallback((row: AdminPolicyRow) => {
    publishFormError.clearError();
    setPublishRow(row);
    setPublishStatus("active");
    const v = row.policy?.version;
    setPublishVersion(v != null ? String(v) : "");
  }, [publishFormError]);

  const apply = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const n = Number.parseInt(draftLimit.trim(), 10);
      const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
      router.push(
        buildPoliciesListPath({
          limit: nextLimit,
          policyCode: draftPolicyCode.trim().slice(0, POLICY_CODE_MAX),
          status: draftStatus,
          scopeType: draftScopeType.trim().slice(0, SCOPE_TYPE_MAX),
          bindingRole: draftBindingRole.trim().slice(0, BINDING_ROLE_MAX),
        }),
      );
    },
    [draftBindingRole, draftLimit, draftPolicyCode, draftScopeType, draftStatus, router],
  );

  const resetFilters = useCallback(() => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildPoliciesListPath({
        limit: nextLimit,
        policyCode: "",
        status: "",
        scopeType: "",
        bindingRole: "",
      }),
    );
  }, [draftLimit, limit, router]);

  const hasActiveFilters =
    Boolean(policyCode) ||
    status === "draft" ||
    status === "active" ||
    status === "deprecated" ||
    Boolean(scopeType) ||
    Boolean(bindingRole);

  const submitPublishImpl = useCallback(() => {
    const id = publishRow?.id?.trim();
    if (!id) return;
    const ev = Number.parseInt(publishVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      publishFormError.setError("invalid_request", t("admin_policies_publishBadVer"));
      return;
    }
    setPublishSubmitting(true);
    publishFormError.clearError();

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      publishFormError.setError("login_required", t("admin_policies_publishAuth"));
      setPublishSubmitting(false);
      return;
    }

    void adminFetchJson<AdminPolicyPublishRes>(
      "AdminPolicyPublish",
      apiUrl(routes.admin.policyPublish(id)),
      {
        method: "POST",
        headers,
        body: JSON.stringify({ status: publishStatus, expected_version: ev }),
      },
    )
      .then(({ res, body: b }) => {
        if (res.status === 409 && b?.error === "admin_policy_version_conflict") {
          const cv = b.current_version;
          publishFormError.setError(
            "conflict",
            typeof cv === "number"
              ? t("admin_policies_publishConflict").replace("{{current}}", String(cv))
              : t("admin_policies_publishConflictGeneric"),
          );
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminPolicyPublish", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closePublish();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminPolicyPublish", e);
        const facing = adminUserFacingErrorFromUnknown(e, t);
        publishFormError.setError(facing.kind, facing.message);
      })
      .finally(() => setPublishSubmitting(false));
  }, [closePublish, publishRow, publishStatus, publishVersion, publishFormError, t]);

  const submitPublish = useCallback(() => {
    requestConfirm({
      titleKey: "admin_l5_confirm_title_write",
      descKey: "admin_l5_confirm_desc_publish",
      onConfirm: () => submitPublishImpl(),
    });
  }, [requestConfirm, submitPublishImpl]);

  return {
    t,
    pageTitleId,
    limitInputId,
    policyCodeInputId,
    statusSelectId,
    scopeTypeInputId,
    bindingRoleInputId,
    publishDialogTitleId,
    publishDialogDescId,
    publishModalFilterHintId,
    adminFilterHintId,
    policiesActiveCodeDescId,
    policiesActiveStatusDescId,
    policiesActiveScopeTypeDescId,
    policiesActiveBindingRoleDescId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
    limit,
    policyCode,
    status,
    scopeType,
    bindingRole,
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftPolicyCode,
    setDraftPolicyCode,
    draftStatus,
    setDraftStatus,
    draftScopeType,
    setDraftScopeType,
    draftBindingRole,
    setDraftBindingRole,
    apply,
    resetFilters,
    hasActiveFilters,
    publishRow,
    closePublish,
    openPublish,
    submitPublish,
    publishStatus,
    setPublishStatus,
    publishVersion,
    setPublishVersion,
    publishSubmitting,
    publishError: publishFormError.message,
    publishErrorKind: publishFormError.kind,
  };
}

export type AdminPoliciesPageViewModel = ReturnType<typeof useAdminPoliciesPage>;
