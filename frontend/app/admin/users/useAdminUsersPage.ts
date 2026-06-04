// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminFormErrorState } from "@/lib/admin/adminFormErrorState";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  adminLogApiJsonStatus,
  adminUserFacingErrorFromUnknown,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, writeRequestHeaders } from "@/lib/apiClient";
import {
  patchAdminUserAcquisitionPublishSuspend,
  type AdminAcquisitionPublishSuspendResult,
} from "@/lib/apiClient/adminAcquisitionPublishSuspend";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { AdminUser, AdminUsersRes, RoleChangeRes } from "./adminUsersPageTypes";
import {
  buildUsersListPath,
  clampUserLimit,
  defaultTargetRole,
  KYC_FILTER_MAX,
  parseUsersListQuery,
  ROLE_FILTER_MAX,
  roleChangeErrText,
  TARGET_ROLES,
} from "./adminUsersPageModel";

export type UseAdminUsersPageResult = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
  items: AdminUser[];
  appliedFilters: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  draftLimit: string;
  setDraftLimit: Dispatch<SetStateAction<string>>;
  draftRole: string;
  setDraftRole: Dispatch<SetStateAction<string>>;
  draftKyc: string;
  setDraftKyc: Dispatch<SetStateAction<string>>;
  roleUser: AdminUser | null;
  targetRole: string;
  setTargetRole: Dispatch<SetStateAction<string>>;
  roleReason: string;
  setRoleReason: Dispatch<SetStateAction<string>>;
  roleSubmitting: boolean;
  roleModalError: string | null;
  roleModalErrorKind: AdminFetchErrorKind | null;
  roleSuccessApprovalId: string | null;
  setRoleSuccessApprovalId: Dispatch<SetStateAction<string | null>>;
  applyFilters: (e?: FormEvent) => void;
  resetFilters: () => void;
  openRoleModal: (u: AdminUser) => void;
  closeRoleModal: () => void;
  submitRoleChange: () => void;
  fetchErrorUserText: (k: AdminFetchErrorKind) => string;
  suspendUser: AdminUser | null;
  suspendInlineUserId: string | null;
  suspendInlineError: string | null;
  suspendInlineErrorKind: AdminFetchErrorKind | null;
  openSuspendModal: (u: AdminUser) => void;
  closeSuspendModal: () => void;
  applySuspendResult: (
    userId: string,
    result: AdminAcquisitionPublishSuspendResult,
  ) => void;
  quickLiftSuspend: (u: AdminUser) => void;
};

export function useAdminUsersPage(): UseAdminUsersPageResult {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, role, kyc_status } = useMemo(
    () => parseUsersListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftRole, setDraftRole] = useState(role);
  const [draftKyc, setDraftKyc] = useState(kyc_status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftRole(role);
    setDraftKyc(kyc_status);
  }, [limit, role, kyc_status]);

  const [roleUser, setRoleUser] = useState<AdminUser | null>(null);
  const [targetRole, setTargetRole] = useState<string>(TARGET_ROLES[0]);
  const [roleReason, setRoleReason] = useState("");
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const roleFormError = useAdminFormErrorState();
  const [roleSuccessApprovalId, setRoleSuccessApprovalId] = useState<string | null>(null);

  const [suspendUser, setSuspendUser] = useState<AdminUser | null>(null);
  const [suspendInlineUserId, setSuspendInlineUserId] = useState<string | null>(null);
  const [suspendInlineError, setSuspendInlineError] = useState<string | null>(null);
  const [suspendInlineErrorKind, setSuspendInlineErrorKind] = useState<AdminFetchErrorKind | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-users-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminUsersRes>(
      "AdminUsersPage",
      apiUrl(
        routes.admin.users({
          limit,
          ...(role ? { role } : {}),
          ...(kyc_status ? { kyc_status } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        setAppliedFilters(body.applied_filters ?? null);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminUsersPage", e);
        setError(adminFetchErrorKind(e));
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [limit, role, kyc_status, reloadTick]);

  const bumpReload = () => setReloadTick((x) => x + 1);

  const applyFilters = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampUserLimit(Number.parseInt(draftLimit.trim(), 10));
    router.push(
      buildUsersListPath({
        limit: lim,
        role: draftRole.trim().slice(0, ROLE_FILTER_MAX),
        kyc_status: draftKyc.trim().slice(0, KYC_FILTER_MAX),
      }),
    );
  };

  const resetFilters = () => {
    router.push(buildUsersListPath({ limit: 100, role: "", kyc_status: "" }));
  };

  const openRoleModal = (u: AdminUser) => {
    roleFormError.clearError();
    setRoleUser(u);
    setTargetRole(defaultTargetRole(u.role ?? ""));
    setRoleReason("");
  };

  const closeRoleModal = () => {
    setRoleUser(null);
    roleFormError.clearError();
    setRoleSubmitting(false);
  };

  const applySuspendResult = (userId: string, result: AdminAcquisitionPublishSuspendResult) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === userId
          ? {
              ...item,
              acquisition_publish_suspended: result.acquisition_publish_suspended === true,
              acquisition_publish_suspended_until: result.acquisition_publish_suspended_until ?? null,
            }
          : item,
      ),
    );
  };

  const openSuspendModal = (u: AdminUser) => {
    setSuspendInlineError(null);
    setSuspendInlineErrorKind(null);
    setSuspendUser(u);
  };

  const closeSuspendModal = () => {
    setSuspendUser(null);
  };

  const quickLiftSuspend = (u: AdminUser) => {
    setSuspendInlineError(null);
    setSuspendInlineErrorKind(null);
    setSuspendInlineUserId(u.id);
    patchAdminUserAcquisitionPublishSuspend(u.id, { suspended_until: null })
      .then((result) => applySuspendResult(u.id, result))
      .catch((e: unknown) => {
        setSuspendInlineErrorKind(adminFetchErrorKind(e));
        setSuspendInlineError(mapApiReadError(e, t, "admin_acquisition_suspend_patchFailed"));
      })
      .finally(() => setSuspendInlineUserId(null));
  };

  const submitRoleChange = () => {
    const uid = roleUser?.id?.trim();
    if (!uid) return;
    setRoleSubmitting(true);
    roleFormError.clearError();

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      roleFormError.setError("login_required", t("admin_users_roleAuth"));
      setRoleSubmitting(false);
      return;
    }

    const body: { target_role: string; reason: string | null } = {
      target_role: targetRole.trim(),
      reason: roleReason.trim() === "" ? null : roleReason.trim(),
    };

    void adminFetchJson<RoleChangeRes>(
      "AdminUsersRoleChange",
      apiUrl(routes.admin.userRoleChangeRequest(uid)),
      { method: "POST", headers, body: JSON.stringify(body) },
    )
      .then(({ res, body: b }) => {
        if (
          (res.status === 501 && b?.status === "not_implemented") ||
          (res.status === 503 && b?.error === "chain_off_unavailable")
        ) {
          roleFormError.setError("not_implemented", t("admin_users_roleErrNotImplemented"));
          return;
        }
        if (!res.ok) {
          const code = typeof b?.error === "string" ? b.error : undefined;
          roleFormError.setError("invalid_request", roleChangeErrText(code, t));
          return;
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminUsersRoleChange", b);
          roleFormError.setError(
            "invalid_request",
            roleChangeErrText(typeof b.error === "string" ? b.error : undefined, t),
          );
          return;
        }
        const aid = b.approval_request_id?.trim();
        if (aid) setRoleSuccessApprovalId(aid);
        closeRoleModal();
        bumpReload();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminUsersRoleChange", e);
        const facing = adminUserFacingErrorFromUnknown(e, t);
        roleFormError.setError(facing.kind, facing.message);
      })
      .finally(() => setRoleSubmitting(false));
  };

  return {
    loading,
    error,
    items,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftRole,
    setDraftRole,
    draftKyc,
    setDraftKyc,
    roleUser,
    targetRole,
    setTargetRole,
    roleReason,
    setRoleReason,
    roleSubmitting,
    roleModalError: roleFormError.message,
    roleModalErrorKind: roleFormError.kind,
    roleSuccessApprovalId,
    setRoleSuccessApprovalId,
    applyFilters,
    resetFilters,
    openRoleModal,
    closeRoleModal,
    submitRoleChange,
    fetchErrorUserText: (k) => adminErrorUserText(k, t),
    suspendUser,
    suspendInlineUserId,
    suspendInlineError,
    suspendInlineErrorKind,
    openSuspendModal,
    closeSuspendModal,
    applySuspendResult,
    quickLiftSuspend,
  };
}
