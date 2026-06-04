// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";
import { isUuidString } from "@/lib/isUuidString";
import { buildAdminCommunityReportsModerationPatchBody } from "./adminCommunityReportsModerationPatchBody";
import { moderationErrText } from "./adminCommunityReportsModerationErrors";
import { buildReportsListPath, parseReportsListQuery } from "./adminCommunityReportsQuery";
import {
  MOD_STATUS_OPTIONS,
  PENALTY_ACTIONS,
  RC_MAX,
  STATUS_URL,
  TT_MAX,
  type ModerationRes,
  type ReportRow,
} from "./adminCommunityReportsTypes";
import type { ModerationWizardStep } from "./AdminCommunityReportsModerationWizard";
import { useAdminCommunityReportsPageListFetch } from "./useAdminCommunityReportsPageListFetch";
import { useAdminFormErrorState } from "@/lib/admin/adminFormErrorState";
import { adminUserFacingErrorFromUnknown } from "@/lib/adminFetchDisplay";
import { validateAdminReportsModerationSubmit } from "@/lib/admin/adminReportsModerationWizardValidation";

export function useAdminCommunityReportsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseReportsListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<ReportRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftStatus, setDraftStatus] = useState(listQ.status);
  const [draftReporterId, setDraftReporterId] = useState(listQ.reporterId);
  const [draftTargetType, setDraftTargetType] = useState(listQ.targetType);
  const [draftReasonCode, setDraftReasonCode] = useState(listQ.reasonCode);
  const [draftTargetId, setDraftTargetId] = useState(listQ.targetId);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftStatus(listQ.status);
    setDraftReporterId(listQ.reporterId);
    setDraftTargetType(listQ.targetType);
    setDraftReasonCode(listQ.reasonCode);
    setDraftTargetId(listQ.targetId);
  }, [listQ]);

  const [modRow, setModRow] = useState<ReportRow | null>(null);
  const [modExpectedVer, setModExpectedVer] = useState("");
  const [modStatus, setModStatus] = useState<(typeof MOD_STATUS_OPTIONS)[number]>("in_review");
  const [modNotes, setModNotes] = useState("");
  const [modDisposition, setModDisposition] = useState("");
  const [modRecordPenalty, setModRecordPenalty] = useState(false);
  const [modPenaltyAction, setModPenaltyAction] = useState<(typeof PENALTY_ACTIONS)[number]>("warn");
  const [modPenaltySubject, setModPenaltySubject] = useState("");
  const [modPenaltyReason, setModPenaltyReason] = useState("");
  const [modPenaltyExpires, setModPenaltyExpires] = useState("");
  const [modSubmitting, setModSubmitting] = useState(false);
  const modFormError = useAdminFormErrorState();
  const [modWizardStep, setModWizardStep] = useState<ModerationWizardStep>(1);

  const closeMod = useCallback(() => {
    setModRow(null);
    setModWizardStep(1);
    modFormError.clearError();
  }, [modFormError]);

  const openMod = (r: ReportRow) => {
    modFormError.clearError();
    setModWizardStep(1);
    setModRow(r);
    const st = r.status?.trim();
    setModStatus(
      st && (MOD_STATUS_OPTIONS as readonly string[]).includes(st)
        ? (st as (typeof MOD_STATUS_OPTIONS)[number])
        : "in_review",
    );
    setModExpectedVer(r.version != null ? String(r.version) : "");
    setModNotes("");
    setModDisposition("");
    setModRecordPenalty(false);
    setModPenaltyAction("warn");
    setModPenaltySubject("");
    setModPenaltyReason("");
    setModPenaltyExpires("");
  };

  useAdminCommunityReportsPageListFetch(
    listQ,
    reloadTick,
    setLoading,
    setError,
    setItems,
    setMeta,
    setAppliedFilters,
  );

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const st = draftStatus.trim();
    const nextStatus = STATUS_URL.has(st) ? st : "";
    const repTrim = draftReporterId.trim();
    const nextReporter = isUuidString(repTrim) ? repTrim : "";
    const nextTt = draftTargetType.trim().slice(0, TT_MAX);
    const nextRc = draftReasonCode.trim().slice(0, RC_MAX);
    const tidTrim = draftTargetId.trim();
    const nextTid = isUuidString(tidTrim) ? tidTrim : "";
    router.push(
      buildReportsListPath({
        limit: nextLimit,
        status: nextStatus,
        reporterId: nextReporter,
        targetType: nextTt,
        reasonCode: nextRc,
        targetId: nextTid,
      }),
    );
  };

  const resetExtraFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : listQ.limit;
    const st = draftStatus.trim();
    router.push(
      buildReportsListPath({
        limit: nextLimit,
        status: STATUS_URL.has(st) ? st : "",
        reporterId: "",
        targetType: "",
        reasonCode: "",
        targetId: "",
      }),
    );
  };

  const hasExtraFilters =
    Boolean(listQ.reporterId) ||
    Boolean(listQ.targetType) ||
    Boolean(listQ.reasonCode) ||
    Boolean(listQ.targetId);

  const submitModeration = useCallback(() => {
    const rid = modRow?.id?.trim();
    if (!rid) return;
    const fieldErrors = validateAdminReportsModerationSubmit({
      modExpectedVer,
      modNotes,
      modRecordPenalty,
      modPenaltySubject,
      modPenaltyReason,
    });
    if (Object.keys(fieldErrors).length > 0) {
      modFormError.setError("invalid_request", t("admin_reports_wizard_submit_blocked"));
      return;
    }
    const ev = Number.parseInt(modExpectedVer.trim(), 10);
    if (!Number.isFinite(ev)) {
      modFormError.setError("invalid_request", t("admin_reports_modBadVer"));
      return;
    }
    setModSubmitting(true);
    modFormError.clearError();

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      modFormError.setError("login_required", t("admin_policies_publishAuth"));
      setModSubmitting(false);
      return;
    }

    const body = buildAdminCommunityReportsModerationPatchBody({
      expectedVersion: ev,
      modStatus,
      modNotes,
      modDisposition,
      modRecordPenalty,
      modPenaltyAction,
      modPenaltySubject,
      modPenaltyReason,
      modPenaltyExpires,
    });

    void adminFetchJson<ModerationRes>(
      "AdminCommunityModerationPatch",
      apiUrl(routes.admin.communityModeration(rid)),
      { method: "PATCH", headers, body: JSON.stringify(body) },
    )
      .then(({ res, body: b }) => {
        const err = typeof b?.error === "string" ? b.error : undefined;
        if (
          res.status === 409 &&
          (err === "community_report_version_conflict" || err === "admin_community_moderation_race")
        ) {
          modFormError.setError("conflict", moderationErrText(err, b, t));
          return;
        }
        if (res.status === 400 && err) {
          modFormError.setError("invalid_request", moderationErrText(err, b, t));
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminCommunityModerationPatch", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closeMod();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityModerationPatch", e);
        const facing = adminUserFacingErrorFromUnknown(e, t);
        modFormError.setError(facing.kind, facing.message);
      })
      .finally(() => setModSubmitting(false));
  }, [
    closeMod,
    modDisposition,
    modExpectedVer,
    modNotes,
    modPenaltyAction,
    modPenaltyExpires,
    modPenaltyReason,
    modPenaltySubject,
    modRecordPenalty,
    modRow,
    modStatus,
    t,
  ]);

  return {
    t,
    listQ,
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    draftReporterId,
    setDraftReporterId,
    draftTargetType,
    setDraftTargetType,
    draftReasonCode,
    setDraftReasonCode,
    draftTargetId,
    setDraftTargetId,
    apply,
    resetExtraFilters,
    hasExtraFilters,
    modRow,
    openMod,
    closeMod,
    submitModeration,
    modExpectedVer,
    setModExpectedVer,
    modStatus,
    setModStatus,
    modNotes,
    setModNotes,
    modDisposition,
    setModDisposition,
    modRecordPenalty,
    setModRecordPenalty,
    modPenaltyAction,
    setModPenaltyAction,
    modPenaltySubject,
    setModPenaltySubject,
    modPenaltyReason,
    setModPenaltyReason,
    modPenaltyExpires,
    setModPenaltyExpires,
    modError: modFormError.message,
    modErrorKind: modFormError.kind,
    setModFormError: modFormError.setError,
    clearModFormError: modFormError.clearError,
    modSubmitting,
    modWizardStep,
    setModWizardStep,
    openCount: items.filter((i) => (i.status ?? "").trim() === "open").length,
  };
}
