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
import { PUBLISH_STATUSES, REGION_MAX, TENANT_KEY_MAX } from "./adminTenantScopesPageConstants";
import { buildTenantScopesListPath, parseTenantScopesListQuery } from "./adminTenantScopesPageQuery";
import type { TenantScopePublishRes, TenantScopeRow } from "./adminTenantScopesPageTypes";

export function useAdminTenantScopesPage() {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const pageTitleId = useId();
  const limitInputId = useId();
  const tenantKeyInputId = useId();
  const regionCodeInputId = useId();
  const statusSelectId = useId();
  const scopeClassSelectId = useId();
  const publishDialogTitleId = useId();
  const publishDialogDescId = useId();
  const publishModalFilterHintId = useId();
  const adminFilterHintId = useId();
  const tenantScopesActiveKeyDescId = useId();
  const tenantScopesActiveRegionDescId = useId();
  const tenantScopesActiveStatusDescId = useId();
  const tenantScopesActiveScopeClassDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, tenantKey, regionCode, status, scopeClass } = useMemo(
    () => parseTenantScopesListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [reloadTick, setReloadTick] = useState(0);

  const listUrl = useMemo(
    () =>
      routes.admin.tenantScopes({
        limit,
        ...(tenantKey ? { tenant_key: tenantKey } : {}),
        ...(regionCode ? { region_code: regionCode } : {}),
        ...(status ? { status } : {}),
        ...(scopeClass ? { scope_class: scopeClass } : {}),
      }),
    [limit, tenantKey, regionCode, status, scopeClass],
  );

  const {
    items,
    meta,
    appliedFilters,
    loading,
    refreshing,
    error,
  } = useAdminStandardListFetch<TenantScopeRow>({
    scope: "tenant-scopes",
    context: "AdminTenantScopesPage",
    listUrl,
    refreshToken: reloadTick,
  });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftTenantKey, setDraftTenantKey] = useState(tenantKey);
  const [draftRegionCode, setDraftRegionCode] = useState(regionCode);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftScopeClass, setDraftScopeClass] = useState(scopeClass);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftTenantKey(tenantKey);
    setDraftRegionCode(regionCode);
    setDraftStatus(status);
    setDraftScopeClass(scopeClass);
  }, [limit, tenantKey, regionCode, status, scopeClass]);

  const [publishRow, setPublishRow] = useState<TenantScopeRow | null>(null);
  const [publishStatus, setPublishStatus] = useState<(typeof PUBLISH_STATUSES)[number]>("active");
  const [publishVersion, setPublishVersion] = useState("");
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const publishFormError = useAdminFormErrorState();

  const openPublish = (r: TenantScopeRow) => {
    publishFormError.clearError();
    setPublishRow(r);
    setPublishStatus("active");
    setPublishVersion(r.version != null ? String(r.version) : "");
  };

  const closePublish = useCallback(() => {
    setPublishRow(null);
    publishFormError.clearError();
  }, [publishFormError]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildTenantScopesListPath({
        limit: nextLimit,
        tenantKey: draftTenantKey.trim().slice(0, TENANT_KEY_MAX),
        regionCode: draftRegionCode.trim().slice(0, REGION_MAX),
        status: draftStatus,
        scopeClass: draftScopeClass,
      }),
    );
  };

  const resetFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildTenantScopesListPath({
        limit: nextLimit,
        tenantKey: "",
        regionCode: "",
        status: "",
        scopeClass: "",
      }),
    );
  };

  const hasActiveFilters = Boolean(tenantKey) || Boolean(regionCode) || Boolean(status) || Boolean(scopeClass);

  const submitPublishImpl = useCallback(() => {
    if (!publishRow?.id?.trim()) return;
    const ev = Number.parseInt(publishVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      publishFormError.setError("invalid_request", t("admin_tenant_scopes_publishBadVer"));
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
      publishFormError.setError("login_required", t("admin_tenant_scopes_publishAuth"));
      setPublishSubmitting(false);
      return;
    }

    void adminFetchJson<TenantScopePublishRes>(
      "AdminTenantScopesPublish",
      apiUrl(routes.admin.tenantScopePublish(publishRow.id.trim())),
      {
        method: "POST",
        headers,
        body: JSON.stringify({ status: publishStatus, expected_version: ev }),
      },
    )
      .then(({ res, body: b }) => {
        if (res.status === 409 && b?.error === "admin_tenant_scope_version_conflict") {
          const cv = b.current_version;
          publishFormError.setError(
            "conflict",
            typeof cv === "number"
              ? t("admin_tenant_scopes_publishConflict").replace("{{current}}", String(cv))
              : t("admin_tenant_scopes_publishConflictGeneric"),
          );
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminTenantScopesPublish", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closePublish();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminTenantScopesPublish", e);
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
    tenantKeyInputId,
    regionCodeInputId,
    statusSelectId,
    scopeClassSelectId,
    publishDialogTitleId,
    publishDialogDescId,
    publishModalFilterHintId,
    adminFilterHintId,
    tenantScopesActiveKeyDescId,
    tenantScopesActiveRegionDescId,
    tenantScopesActiveStatusDescId,
    tenantScopesActiveScopeClassDescId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
    limit,
    tenantKey,
    regionCode,
    status,
    scopeClass,
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftTenantKey,
    setDraftTenantKey,
    draftRegionCode,
    setDraftRegionCode,
    draftStatus,
    setDraftStatus,
    draftScopeClass,
    setDraftScopeClass,
    apply,
    resetFilters,
    hasActiveFilters,
    publishRow,
    publishStatus,
    setPublishStatus,
    publishVersion,
    setPublishVersion,
    publishSubmitting,
    publishError: publishFormError.message,
    publishErrorKind: publishFormError.kind,
    openPublish,
    closePublish,
    submitPublish,
  };
}

export type AdminTenantScopesPageViewModel = ReturnType<typeof useAdminTenantScopesPage>;
