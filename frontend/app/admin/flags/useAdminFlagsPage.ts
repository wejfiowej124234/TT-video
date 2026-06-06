// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { useAdminFormErrorState } from "@/lib/admin/adminFormErrorState";
import {
  type AdminFetchErrorKind,
  adminFetchJson,
  adminLogApiJsonStatus,
  adminUserFacingErrorFromUnknown,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";
import { ADMIN_FLAG_CODE_MAX_LEN, ADMIN_FLAG_SCOPE_RE } from "./adminFlagsPageConstants";
import {
  adminFlagRegionToInitialString,
  buildAdminFlagsListPath,
  parseAdminFlagsListQuery,
} from "./adminFlagsPageQuery";
import type { AdminFlagPublishRes, AdminFlagRow } from "./adminFlagsPageTypes";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";

export function useAdminFlagsPage() {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const caps = useAdminCapabilities();
  const canPublish = caps.hasPermission(ADMIN_PERM.PLATFORM_PUBLISH);
  const pageTitleId = useId();
  const limitInputId = useId();
  const flagCodeInputId = useId();
  const enabledSelectId = useId();
  const scopeInputId = useId();
  const publishDialogTitleId = useId();
  const publishDialogDescId = useId();
  const publishModalFilterHintId = useId();
  const adminFilterHintId = useId();
  const flagsActiveCodeDescId = useId();
  const flagsActiveEnabledDescId = useId();
  const flagsActiveScopeDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, flagCode, enabled, scope } = useMemo(
    () => parseAdminFlagsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [reloadTick, setReloadTick] = useState(0);

  const listUrl = useMemo(
    () =>
      routes.admin.flags({
        limit,
        ...(flagCode ? { flag_code: flagCode } : {}),
        ...(enabled === "true" || enabled === "false" ? { enabled } : {}),
        ...(scope ? { scope } : {}),
      }),
    [limit, flagCode, enabled, scope],
  );

  const {
    items,
    meta,
    appliedFilters,
    loading,
    refreshing,
    error,
    setItems,
  } = useAdminStandardListFetch<AdminFlagRow>({
    scope: "flags",
    context: "AdminFlagsPage",
    listUrl,
    refreshToken: reloadTick,
  });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftFlagCode, setDraftFlagCode] = useState(flagCode);
  const [draftEnabled, setDraftEnabled] = useState(enabled);
  const [draftScope, setDraftScope] = useState(scope);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftFlagCode(flagCode);
    setDraftEnabled(enabled);
    setDraftScope(scope);
  }, [limit, flagCode, enabled, scope]);

  const [publishRow, setPublishRow] = useState<AdminFlagRow | null>(null);
  const [pubEnabled, setPubEnabled] = useState(false);
  const [pubRollout, setPubRollout] = useState("");
  const [pubRegionMode, setPubRegionMode] = useState<"unchanged" | "clear" | "set">("unchanged");
  const [pubRegionText, setPubRegionText] = useState("");
  const [pubVersion, setPubVersion] = useState("");
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const publishFormError = useAdminFormErrorState();

  const closePublish = useCallback(() => {
    setPublishRow(null);
    publishFormError.clearError();
  }, [publishFormError]);

  const openPublish = useCallback((r: AdminFlagRow) => {
    if (!canPublish) return;
    publishFormError.clearError();
    setPublishRow(r);
    setPubEnabled(r.enabled === true);
    setPubRollout(r.rollout_percent != null ? String(r.rollout_percent) : "");
    setPubRegionMode("unchanged");
    setPubRegionText(adminFlagRegionToInitialString(r.region));
    setPubVersion(r.version != null ? String(r.version) : "");
  }, [canPublish]);

  const apply = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const n = Number.parseInt(draftLimit.trim(), 10);
      const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 200;
      let nextScope = draftScope.trim();
      if (nextScope !== "" && !ADMIN_FLAG_SCOPE_RE.test(nextScope)) {
        nextScope = "";
      }
      router.push(
        buildAdminFlagsListPath({
          limit: nextLimit,
          flagCode: draftFlagCode.trim().slice(0, ADMIN_FLAG_CODE_MAX_LEN),
          enabled: draftEnabled === "true" || draftEnabled === "false" ? draftEnabled : "",
          scope: nextScope,
        }),
      );
    },
    [draftEnabled, draftFlagCode, draftLimit, draftScope, router],
  );

  const resetFilters = useCallback(() => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildAdminFlagsListPath({ limit: nextLimit, flagCode: "", enabled: "", scope: "" }));
  }, [draftLimit, limit, router]);

  const hasActiveFilters = Boolean(flagCode) || enabled === "true" || enabled === "false" || Boolean(scope);

  const submitPublishImpl = useCallback(() => {
    if (!canPublish) return;
    const id = publishRow?.id?.trim();
    if (!id) return;
    const ev = Number.parseInt(pubVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      publishFormError.setError("invalid_request", t("admin_flags_publishBadVer"));
      return;
    }
    const body: Record<string, unknown> = {
      enabled: pubEnabled,
      expected_version: ev,
    };
    const rp = pubRollout.trim();
    if (rp !== "") {
      const n = Number.parseInt(rp, 10);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        publishFormError.setError("invalid_request", t("admin_flags_publishBadRollout"));
        return;
      }
      body.rollout_percent = n;
    }
    if (pubRegionMode === "clear") {
      body.region = null;
    } else if (pubRegionMode === "set") {
      body.region = pubRegionText.trim() === "" ? null : pubRegionText.trim();
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
      publishFormError.setError("login_required", t("admin_flags_publishAuth"));
      setPublishSubmitting(false);
      return;
    }

    void adminFetchJson<AdminFlagPublishRes>(
      "AdminFlagPublish",
      apiUrl(routes.admin.flagPublish(id)),
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      },
    )
      .then(({ res, body: b }) => {
        if (res.status === 409 && b?.error === "feature_flag_version_conflict") {
          const cv = b.current_version;
          publishFormError.setError(
            "conflict",
            typeof cv === "number"
              ? t("admin_flags_publishConflict").replace("{{current}}", String(cv))
              : t("admin_flags_publishConflictGeneric"),
          );
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminFlagPublish", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closePublish();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminFlagPublish", e);
        const facing = adminUserFacingErrorFromUnknown(e, t);
        publishFormError.setError(facing.kind, facing.message);
      })
      .finally(() => setPublishSubmitting(false));
  }, [canPublish, closePublish, pubEnabled, pubRegionMode, pubRegionText, pubRollout, pubVersion, publishRow, t]);

  const submitPublish = useCallback(() => {
    requestConfirm({
      titleKey: "admin_l5_confirm_title_write",
      descKey: "admin_l5_confirm_desc_publish",
      onConfirm: () => submitPublishImpl(),
    });
  }, [requestConfirm, submitPublishImpl]);

  return {
    canPublish,
    t,
    pageTitleId,
    limitInputId,
    flagCodeInputId,
    enabledSelectId,
    scopeInputId,
    publishDialogTitleId,
    publishDialogDescId,
    publishModalFilterHintId,
    adminFilterHintId,
    flagsActiveCodeDescId,
    flagsActiveEnabledDescId,
    flagsActiveScopeDescId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
    limit,
    flagCode,
    enabled,
    scope,
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftFlagCode,
    setDraftFlagCode,
    draftEnabled,
    setDraftEnabled,
    draftScope,
    setDraftScope,
    apply,
    resetFilters,
    hasActiveFilters,
    publishRow,
    closePublish,
    openPublish,
    submitPublish,
    pubEnabled,
    setPubEnabled,
    pubRollout,
    setPubRollout,
    pubRegionMode,
    setPubRegionMode,
    pubRegionText,
    setPubRegionText,
    pubVersion,
    setPubVersion,
    publishSubmitting,
    publishError: publishFormError.message,
    publishErrorKind: publishFormError.kind,
  };
}

export type AdminFlagsPageViewModel = ReturnType<typeof useAdminFlagsPage>;
