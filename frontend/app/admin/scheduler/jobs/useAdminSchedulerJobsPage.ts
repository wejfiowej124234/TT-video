// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { useAdminFormErrorState } from "@/lib/admin/adminFormErrorState";
import {
  adminFetchJson,
  adminLogApiJsonStatus,
  adminUserFacingErrorFromUnknown,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";
import {
  buildSchedulerListPath,
  parseSchedulerListQuery,
  sanitizeJobCodeInput,
  type AdminSchedulerJobRerunRes,
  type AdminSchedulerJobRow,
} from "./adminSchedulerJobsPageModel";

export function useAdminSchedulerJobsPage() {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, jobCode } = useMemo(
    () => parseSchedulerListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const [reloadTick, setReloadTick] = useState(0);

  const listUrl = useMemo(
    () =>
      routes.admin.schedulerJobs({
        limit,
        job_code: jobCode || undefined,
      }),
    [limit, jobCode],
  );

  const { items, meta, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<AdminSchedulerJobRow>({
      scope: "scheduler-jobs",
      context: "AdminSchedulerJobsPage",
      listUrl,
      refreshToken: reloadTick,
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftJobCode, setDraftJobCode] = useState(jobCode);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftJobCode(jobCode);
  }, [limit, jobCode]);

  const [rerunCode, setRerunCode] = useState<string | null>(null);
  const [rerunReason, setRerunReason] = useState("");
  const [rerunSubmitting, setRerunSubmitting] = useState(false);
  const rerunFormError = useAdminFormErrorState();

  const closeRerun = useCallback(() => {
    setRerunCode(null);
    setRerunReason("");
    rerunFormError.clearError();
  }, [rerunFormError]);

  const openRerun = (code: string) => {
    rerunFormError.clearError();
    setRerunReason("");
    setRerunCode(code.trim());
  };

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildSchedulerListPath({
        limit: nextLimit,
        jobCode: sanitizeJobCodeInput(draftJobCode),
      }),
    );
  };

  const resetJobCodeFilter = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildSchedulerListPath({ limit: nextLimit, jobCode: "" }));
  };

  const hasJobCodeFilter = Boolean(jobCode);

  const submitRerunImpl = useCallback(() => {
    const code = rerunCode?.trim();
    if (!code) return;
    setRerunSubmitting(true);
    rerunFormError.clearError();

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      rerunFormError.setError("login_required", t("admin_scheduler_rerunAuth"));
      setRerunSubmitting(false);
      return;
    }

    const body: Record<string, unknown> = {};
    const r = rerunReason.trim();
    if (r !== "") body.reason = r;

    void adminFetchJson<AdminSchedulerJobRerunRes>(
      "AdminSchedulerRerun",
      apiUrl(routes.admin.schedulerJobRerun(code)),
      { method: "POST", headers, body: JSON.stringify(body) },
    )
      .then(({ res, body: b }) => {
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminSchedulerRerun", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closeRerun();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminSchedulerRerun", e);
        const facing = adminUserFacingErrorFromUnknown(e, t);
        rerunFormError.setError(facing.kind, facing.message);
      })
      .finally(() => setRerunSubmitting(false));
  }, [closeRerun, rerunCode, rerunReason, rerunFormError, t]);

  const submitRerun = useCallback(() => {
    const code = rerunCode?.trim();
    if (!code) return;
    requestConfirm({
      titleKey: "admin_l5_confirm_title_danger",
      descKey: "admin_l5_confirm_desc_scheduler_rerun",
      descVars: { code },
      danger: true,
      onConfirm: () => submitRerunImpl(),
    });
  }, [rerunCode, requestConfirm, submitRerunImpl]);

  return {
    t,
    limit,
    jobCode,
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftJobCode,
    setDraftJobCode,
    rerunCode,
    rerunReason,
    setRerunReason,
    rerunSubmitting,
    rerunError: rerunFormError.message,
    rerunErrorKind: rerunFormError.kind,
    closeRerun,
    openRerun,
    submitRerun,
    apply,
    resetJobCodeFilter,
    hasJobCodeFilter,
  };
}
